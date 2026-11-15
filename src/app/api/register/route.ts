import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUniquePassNumber } from '@/lib/pass-generator';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { evaluateWatchlistMatch, WatchlistEntry } from '@/lib/watchlist-match';

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
      watchlistDecision,
      watchlistJustification = '',
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
    let watchlistEntries: WatchlistEntry[] = [];
    try {
      const rows = await sql`
        SELECT id, full_name, phone, reason, description FROM watchlist WHERE is_active = true
      `;
      watchlistEntries = rows.map((r: any) => ({
        id: Number(r.id),
        full_name: String(r.full_name || ''),
        phone: r.phone ? String(r.phone) : null,
        reason: String(r.reason || ''),
        description: r.description ? String(r.description) : null,
      }));
    } catch {
      // Fallback query in case phone column is not yet migrated
      try {
        const rows = await sql`
          SELECT id, full_name, reason, description FROM watchlist WHERE is_active = true
        `;
        watchlistEntries = rows.map((r: any) => ({
          id: Number(r.id),
          full_name: String(r.full_name || ''),
          phone: null,
          reason: String(r.reason || ''),
          description: r.description ? String(r.description) : null,
        }));
      } catch {
        // Table may not exist yet in fresh environment
      }
    }

    const matchResult = evaluateWatchlistMatch(
      { fullName: trimmedName, phone: trimmedPhone },
      watchlistEntries
    );

    if (matchResult) {
      if (watchlistDecision === 'deny') {
        // Guard confirmed denial of entry
        const passNumber = await getUniquePassNumber();
        let rejectedId: number | null = null;
        try {
          const rejectedRow = await sql`
            INSERT INTO participants (
              registration_code, pass_number, full_name, phone, location,
              organisation, host_name, host_department, visit_purpose, visitor_type,
              participant_status, registration_status, registration_source,
              approval_status, approved_by, approved_at,
              check_in_status, created_at
            )
            VALUES (
              ${passNumber}, ${passNumber}, ${trimmedName}, ${trimmedPhone}, ${trimmedLocation},
              ${trimmedOrg}, ${trimmedPersonToVisit}, ${trimmedDepartment}, ${trimmedVisitPurpose}, ${trimmedVisitorType},
              'REJECTED', 'REJECTED', 'GUARD_STATION',
              'REJECTED', ${guardUserId}, CURRENT_TIMESTAMP,
              'DENIED', CURRENT_TIMESTAMP
            )
            RETURNING id
          `;
          rejectedId = rejectedRow[0]?.id || null;
        } catch (rejErr) {
          console.warn('Failed to insert rejected participant:', rejErr);
        }

        try {
          await sql`
            INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
            VALUES (
              ${rejectedId},
              'WATCHLIST_DENIED',
              ${guardUserId},
              ${`WATCHLIST DENIED: Entry refused by guard ${guardName}. Matched: "${matchResult.entry.full_name}" (${matchResult.matchType}, confidence: ${Math.round(matchResult.confidence * 100)}%). Reason: ${matchResult.entry.reason || 'Restricted entry'}.`},
              ${clientIp}
            )
          `;
        } catch (logErr) {
          console.warn('Failed to log WATCHLIST_DENIED:', logErr);
        }

        return NextResponse.json(
          {
            error: `Entry denied for ${trimmedName} per security policy (${matchResult.entry.reason || 'Restricted individual'}).`,
            denied: true,
            watchlistAlert: false,
          },
          { status: 403 }
        );
      } else if (watchlistDecision === 'allow') {
        if (!watchlistJustification || watchlistJustification.trim().length < 10) {
          return NextResponse.json(
            { error: 'Supervisor override requires a detailed justification (minimum 10 characters).' },
            { status: 400 }
          );
        }

        // Log the supervisor override audit record
        try {
          await sql`
            INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
            VALUES (
              NULL,
              'WATCHLIST_OVERRIDE',
              ${guardUserId},
              ${`WATCHLIST OVERRIDE by ${guardName} for visitor "${trimmedName}". Justification: "${watchlistJustification.trim()}". Matched: "${matchResult.entry.full_name}" (${matchResult.matchType}).`},
              ${clientIp}
            )
          `;
        } catch (logErr) {
          console.warn('Failed to log WATCHLIST_OVERRIDE:', logErr);
        }
        // Proceed with normal registration below
      } else {
        // Initial detection: log alert and prompt guard for decision
        try {
          await sql`
            INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
            VALUES (
              NULL,
              'WATCHLIST_ALERT',
              ${guardUserId},
              ${`WATCHLIST ALERT: Registration attempt for "${trimmedName}" (${trimmedPhone}) matched "${matchResult.entry.full_name}" (${matchResult.matchType}, confidence: ${Math.round(matchResult.confidence * 100)}%). Reason: ${matchResult.entry.reason || 'Restricted entry'}.`},
              ${clientIp}
            )
          `;
        } catch (logErr) {
          console.warn('Failed to log WATCHLIST_ALERT:', logErr);
        }

        return NextResponse.json(
          {
            watchlistAlert: true,
            error: `SECURITY ALERT: This visitor matches a restricted individual (${matchResult.entry.full_name}). Reason: ${matchResult.entry.reason || 'Security Restriction'}.`,
            matchType: matchResult.matchType,
            confidence: matchResult.confidence,
            matchedName: matchResult.entry.full_name,
            watchlistReason: matchResult.entry.reason,
            watchlistDescription: matchResult.entry.description,
          },
          { status: 403 }
        );
      }
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
