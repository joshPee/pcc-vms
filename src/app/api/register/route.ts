import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUniquePassNumber } from '@/lib/pass-generator';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Simple fuzzy name matching function
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  let matches = 0;
  const maxWords = Math.max(words1.length, words2.length);
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || 
          word1.includes(word2) || 
          word2.includes(word1) ||
          levenshteinDistance(word1, word2) <= 2) {
        matches++;
        break;
      }
    }
  }
  
  return matches / maxWords;
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

// Watchlist / Blacklist Check
async function checkWatchlist(fullName: string): Promise<{ flagged: boolean; reason?: string; description?: string }> {
  try {
    const watchlistEntries = await sql`
      SELECT full_name, reason, description FROM watchlist WHERE is_active = true
    `;
    for (const entry of watchlistEntries) {
      const similarity = calculateSimilarity(fullName, entry.full_name);
      if (similarity >= 0.75) {
        return { flagged: true, reason: entry.reason, description: entry.description };
      }
    }
  } catch {
    // watchlist table may not exist yet — fail silently
  }
  return { flagged: false };
}

// Returning visitor detection
async function checkReturningVisitor(fullName: string, phone: string): Promise<{
  isReturning: boolean;
  visitCount: number;
  lastVisit?: string;
  lastHost?: string;
}> {
  try {
    const byPhone = await sql`
      SELECT check_in_date, host_name
      FROM participants
      WHERE LOWER(TRIM(phone)) = LOWER(TRIM(${phone}))
        AND check_in_date IS NOT NULL
      ORDER BY check_in_date DESC
      LIMIT 5
    `;
    if (byPhone.length > 0) {
      return {
        isReturning: true,
        visitCount: byPhone.length,
        lastVisit: byPhone[0].check_in_date,
        lastHost: byPhone[0].host_name,
      };
    }
  } catch {
    // ignore
  }
  return { isReturning: false, visitCount: 0 };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. On-duty guard or staff login required to register visitors.' },
        { status: 401 }
      );
    }

    const guardUserId = session.user.id ? parseInt((session.user as any).id) : null;
    const guardName = session.user.name || 'Security Officer';

    // Rate Limiting: max 30 registrations per minute per IP / guard session
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`register:${clientIp}:${guardUserId || 'anon'}`, 30, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait a moment before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.reset.toString(),
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const {
      fullName,
      phone,
      location,
      organisation,
      personToVisit,
      department,
      visitPurpose,
      visitorType = 'Official',
      idType = '',
      idNumber = '',
      photoUrl = '',
      vehicleRegistration = '',
      forceSubmit = false,
    } = body;

    // Validate required fields (Full name, phone, person to visit, purpose)
    if (!fullName || !phone || !personToVisit || !visitPurpose) {
      return NextResponse.json(
        { error: 'Full name, phone number, person to visit, and purpose of visit are required.' },
        { status: 400 }
      );
    }

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedLocation = location?.trim() || 'Accra / PCC';
    const trimmedOrg = organisation?.trim() || '';
    const trimmedPersonToVisit = personToVisit.trim();
    const trimmedDepartment = department?.trim() || 'General';
    const trimmedVisitPurpose = visitPurpose.trim();
    const trimmedVisitorType = visitorType.trim() || 'Official';
    const trimmedIdType = idType?.trim() || null;
    const trimmedIdNumber = idNumber?.trim() || null;
    const trimmedPhotoUrl = photoUrl?.trim() || null;
    const trimmedVehicleRegistration = vehicleRegistration?.trim().toUpperCase() || null;

    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Full name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    // 1. Blacklist / Watchlist Check
    const watchlistResult = await checkWatchlist(trimmedName);
    if (watchlistResult.flagged) {
      const clientIpWl = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      try {
        await sql`
          INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
          VALUES (NULL, 'WATCHLIST_ALERT', NULL, ${`WATCHLIST ALERT: Attempted registration by "${trimmedName}". Reason: ${watchlistResult.reason || 'N/A'}`}, ${clientIpWl})
        `;
      } catch { /* ignore */ }

      return NextResponse.json(
        {
          watchlistAlert: true,
          error: `SECURITY ALERT: This visitor's name matches a restricted or blacklisted individual. Registration cannot proceed without supervisor authorization.`,
          watchlistReason: watchlistResult.reason,
          watchlistDescription: watchlistResult.description,
        },
        { status: 403 }
      );
    }

    // 2. Duplicate Detection: Check if active/pending visitor with same phone exists today
    if (!forceSubmit) {
      // Build query conditionally to avoid ambiguous parameter type errors in Postgres
      // when trimmedIdNumber is null (Postgres can't infer type for untyped NULL params in OR clauses)
      const existingActive = trimmedIdNumber
        ? await sql`
            SELECT id, registration_code, pass_number, full_name, approval_status, check_in_status
            FROM participants
            WHERE (
              LOWER(TRIM(phone)) = LOWER(TRIM(${trimmedPhone}))
              OR id_number = ${trimmedIdNumber}
            )
              AND created_at >= NOW() - INTERVAL '24 hours'
              AND check_in_status IN ('NOT_CHECKED_IN', 'CHECKED_IN')
            LIMIT 1
          `
        : await sql`
            SELECT id, registration_code, pass_number, full_name, approval_status, check_in_status
            FROM participants
            WHERE LOWER(TRIM(phone)) = LOWER(TRIM(${trimmedPhone}))
              AND created_at >= NOW() - INTERVAL '24 hours'
              AND check_in_status IN ('NOT_CHECKED_IN', 'CHECKED_IN')
            LIMIT 1
          `;

      if (existingActive.length > 0) {
        return NextResponse.json(
          {
            duplicate: true,
            error: `An existing registration for today was found for this phone/ID number (${existingActive[0].pass_number || existingActive[0].registration_code}).`,
            existingCode: existingActive[0].pass_number || existingActive[0].registration_code,
            fullName: existingActive[0].full_name,
            approvalStatus: existingActive[0].approval_status,
          },
          { status: 409 }
        );
      }
    }

    // 3. Returning visitor check
    const returningInfo = await checkReturningVisitor(trimmedName, trimmedPhone);

    // 4. Generate unique non-sequential pass number (format PCC-V8K294)
    const passNumber = await getUniquePassNumber();

    // 5. Insert new visitor directly as APPROVED & CHECKED_IN (Confirmed with host at gate by guard)
    const result = await sql`
      INSERT INTO participants (
        registration_code,
        pass_number,
        full_name,
        phone,
        location,
        organisation,
        host_name,
        host_department,
        visit_purpose,
        visitor_type,
        id_type,
        id_number,
        photo_url,
        vehicle_registration,
        participant_status,
        registration_status,
        registration_source,
        approval_status,
        approved_by,
        approved_at,
        check_in_status,
        check_in_date,
        checked_in_by,
        created_at
      )
      VALUES (
        ${passNumber},
        ${passNumber},
        ${trimmedName},
        ${trimmedPhone},
        ${trimmedLocation},
        ${trimmedOrg},
        ${trimmedPersonToVisit},
        ${trimmedDepartment},
        ${trimmedVisitPurpose},
        ${trimmedVisitorType},
        ${trimmedIdType},
        ${trimmedIdNumber},
        ${trimmedPhotoUrl},
        ${trimmedVehicleRegistration},
        'REGISTERED',
        'REGISTERED',
        'GUARD_STATION',
        'APPROVED',
        ${guardUserId},
        CURRENT_TIMESTAMP,
        'CHECKED_IN',
        CURRENT_TIMESTAMP,
        ${guardUserId},
        CURRENT_TIMESTAMP
      )
      RETURNING id, registration_code, pass_number
    `;

    const participantId = result[0].id;
    const finalPassNumber = result[0].pass_number || result[0].registration_code;

    // 6. Record immediate check-in attributed to guard
    try {
      await sql`
        INSERT INTO check_ins (participant_id, user_id, check_in_time)
        VALUES (${participantId}, ${guardUserId}, NOW())
        ON CONFLICT (participant_id) DO NOTHING
      `;
    } catch (ciErr) {
      console.warn('Failed to insert check_in record:', ciErr);
    }

    // 7. Log check-in to audit trail with guard attribution
    try {
      await sql`
        INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
        VALUES (
          ${participantId},
          'CHECK_IN',
          ${guardUserId},
          ${`Gate registration & check-in by ${guardName}. Pass: ${finalPassNumber}. Type: ${trimmedVisitorType}. Host: ${trimmedPersonToVisit} (${trimmedDepartment}).`},
          ${clientIp}
        )
      `;
    } catch (logErr) {
      console.warn('Failed to write visitor_log for registration:', logErr);
    }

    return NextResponse.json({
      success: true,
      passNumber: finalPassNumber,
      registrationCode: finalPassNumber,
      participantId: participantId,
      fullName: trimmedName,
      approvalStatus: 'APPROVED',
      checkInStatus: 'CHECKED_IN',
      returning: returningInfo,
      message: 'Visitor checked in successfully.',
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please check your details and try again.' },
      { status: 500 }
    );
  }
}
