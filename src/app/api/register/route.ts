import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Simple fuzzy name matching function
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Compare word by word
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

// Simple Levenshtein distance for word comparison
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

async function findSimilarParticipant(fullName: string, organisation: string) {
  const allParticipants = await sql`
    SELECT id, registration_code, participant_status, full_name, organisation 
    FROM participants 
    WHERE LOWER(organisation) = LOWER(${organisation})
      AND participant_status = 'EXPECTED'
  `;
  
  const threshold = 0.7; // 70% similarity threshold
  
  for (const participant of allParticipants) {
    const nameSimilarity = calculateSimilarity(fullName, participant.full_name);
    if (nameSimilarity >= threshold) {
      console.log(`Found similar participant: ${participant.full_name} (similarity: ${nameSimilarity.toFixed(2)})`);
      return participant;
    }
  }
  
  return null;
}

async function getUniqueCode(): Promise<string> {
  if (!sql) {
    throw new Error('Database connection not available');
  }

  // Generate a unique 4-digit code
  const generateCode = () => {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return `CTS-${code}`;
  };

  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const code = generateCode();
    const existing = await sql`
      SELECT registration_code FROM participants WHERE registration_code = ${code}
    `;
    if (existing.length === 0) {
      return code;
    }
    attempts++;
  }

  throw new Error('Could not generate unique registration code');
}

// --- FEATURE 1: Watchlist check ---
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

// --- FEATURE 5: Returning visitor detection ---
async function checkReturningVisitor(fullName: string, phone: string): Promise<{
  isReturning: boolean;
  visitCount: number;
  lastVisit?: string;
  lastHost?: string;
}> {
  try {
    const history = await sql`
      SELECT full_name, phone, check_in_date, host_name, check_in_status
      FROM participants
      WHERE (
        LOWER(TRIM(phone)) = LOWER(TRIM(${phone}))
        OR similarity(LOWER(full_name), LOWER(${fullName})) > 0.6
      )
      AND check_in_date IS NOT NULL
      ORDER BY check_in_date DESC
      LIMIT 10
    `;
    if (history.length > 0) {
      return {
        isReturning: true,
        visitCount: history.length,
        lastVisit: history[0].check_in_date,
        lastHost: history[0].host_name,
      };
    }
  } catch {
    // pg_trgm extension may not be available — fall back to phone-only check
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
  }
  return { isReturning: false, visitCount: 0 };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, location, organisation, personToVisit, department, visitPurpose, vehicleRegistration, forceSubmit = false } = body;

    // Validate input
    if (!fullName || !phone || !location || !personToVisit || !department || !visitPurpose) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedLocation = location.trim();
    const trimmedOrg = organisation?.trim() || '';
    const trimmedPersonToVisit = personToVisit.trim();
    const trimmedDepartment = department.trim();
    const trimmedVisitPurpose = visitPurpose.trim();
    const trimmedVehicleRegistration = vehicleRegistration?.trim() || '';

    // Basic validation
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Full name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // --- FEATURE 1: Watchlist check (always run, block on flag) ---
    const watchlistResult = await checkWatchlist(trimmedName);
    if (watchlistResult.flagged) {
      // Log alert to visitor_logs
      const clientIpWl = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      try {
        await sql`
          INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
          VALUES (NULL, 'WATCHLIST_ALERT', NULL, ${`WATCHLIST ALERT: Attempted check-in by "${trimmedName}" matched watchlist. Reason: ${watchlistResult.reason || 'N/A'}`}, ${clientIpWl})
        `;
      } catch { /* ignore */ }

      return NextResponse.json(
        {
          watchlistAlert: true,
          error: `SECURITY ALERT: This visitor's name matches a watchlisted individual. Do not check in. Contact your supervisor immediately.`,
          watchlistReason: watchlistResult.reason,
          watchlistDescription: watchlistResult.description,
        },
        { status: 403 }
      );
    }

    // --- FEATURE 5: Returning visitor check ---
    const returningInfo = await checkReturningVisitor(trimmedName, trimmedPhone);

    // Check for similar expected participant using fuzzy matching
    const similarParticipant = await findSimilarParticipant(trimmedName, trimmedOrg);
    
    console.log('Registration - Similar participant check:', similarParticipant);
    console.log('Looking for:', trimmedName, trimmedOrg);

    let registrationCode;
    let participantId;

    if (similarParticipant) {
      const participant = similarParticipant;
      console.log('Found similar participant:', participant);
      
      // If participant is already registered, reject duplicate
      if (participant.participant_status === 'REGISTERED') {
        console.log('Duplicate registration rejected:', participant);
        return NextResponse.json(
          { 
            error: 'You have already registered for this event',
            existingCode: participant.registration_code,
            fullName: participant.full_name,
            organisation: participant.organisation
          },
          { status: 409 }
        );
      }
      
      // If participant is expected, update them to registered and check them in
      if (participant.participant_status === 'EXPECTED') {
        console.log('Expected participant registering with code:', participant.registration_code);
        await sql`
          UPDATE participants
          SET
            participant_status = 'REGISTERED',
            registration_status = 'REGISTERED',
            registration_source = 'ONLINE',
            check_in_status = 'CHECKED_IN',
            check_in_date = CURRENT_TIMESTAMP,
            phone = ${trimmedPhone},
            location = ${trimmedLocation},
            organisation = ${trimmedOrg},
            host_name = ${trimmedPersonToVisit},
            host_department = ${trimmedDepartment},
            visit_purpose = ${trimmedVisitPurpose},
            vehicle_registration = ${trimmedVehicleRegistration || null}
          WHERE id = ${participant.id}
          RETURNING id
        `;

        // Log check-in to visitor_logs for archival
        const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        try {
          await sql`
            INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
            VALUES (
              ${participant.id},
              'CHECK_IN',
              NULL,
              ${`Gate self-service check-in. Host: ${trimmedPersonToVisit} (${trimmedDepartment}). Purpose: ${trimmedVisitPurpose}. Vehicle: ${trimmedVehicleRegistration || 'None'}.`},
              ${clientIp}
            )
          `;
        } catch (logErr) {
          console.warn('Failed to write visitor_log for expected-participant gate check-in:', logErr);
        }

        return NextResponse.json({
          success: true,
          registrationCode: participant.registration_code,
          participantId: participant.id,
          fullName: participant.full_name,
          returning: returningInfo,
        });
      }
    } else {
      // No similar participant found, generate new code and register
      registrationCode = await getUniqueCode();

      // Insert new participant and check them in
      const result = await sql`
        INSERT INTO participants (
          registration_code,
          full_name,
          phone,
          location,
          organisation,
          host_name,
          host_department,
          visit_purpose,
          vehicle_registration,
          participant_status,
          registration_status,
          registration_source,
          check_in_status,
          check_in_date,
          event_id
        )
        VALUES (
          ${registrationCode},
          ${trimmedName},
          ${trimmedPhone},
          ${trimmedLocation},
          ${trimmedOrg},
          ${trimmedPersonToVisit},
          ${trimmedDepartment},
          ${trimmedVisitPurpose},
          ${trimmedVehicleRegistration || null},
          'REGISTERED',
          'REGISTERED',
          'ONLINE',
          'CHECKED_IN',
          CURRENT_TIMESTAMP,
          NULL
        )
        RETURNING id
      `;
      participantId = result[0].id;

      // Log check-in to visitor_logs for archival
      const clientIpNew = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      try {
        await sql`
          INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
          VALUES (
            ${participantId},
            'CHECK_IN',
            NULL,
            ${`Gate self-service check-in (new visitor). Host: ${trimmedPersonToVisit} (${trimmedDepartment}). Purpose: ${trimmedVisitPurpose}. Org: ${trimmedOrg || 'N/A'}. Vehicle: ${trimmedVehicleRegistration || 'None'}.`},
            ${clientIpNew}
          )
        `;
      } catch (logErr) {
        console.warn('Failed to write visitor_log for new gate check-in:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      registrationCode: registrationCode,
      participantId: participantId,
      fullName: trimmedName,
      returning: returningInfo,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
