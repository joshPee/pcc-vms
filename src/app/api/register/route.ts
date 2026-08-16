import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

function generateRegistrationCode(): string {
  const randomNum = Math.floor(Math.random() * 900000) + 100000;
  return `CTS-${randomNum}`;
}

async function isDuplicate(fullName: string, organisation: string) {
  const similar = await sql`
    SELECT full_name, organisation 
    FROM participants 
    WHERE 
      LOWER(full_name) = LOWER(${fullName}) 
      AND LOWER(organisation) = LOWER(${organisation})
  `;
  return similar.length > 0;
}

async function getUniqueCode(): Promise<string> {
  let code = generateRegistrationCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await sql`
      SELECT registration_code FROM participants WHERE registration_code = ${code}
    `;
    if (existing.length === 0) {
      return code;
    }
    code = generateRegistrationCode();
    attempts++;
  }

  throw new Error('Could not generate unique registration code');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, organisation, position, forceSubmit = false } = body;

    // Validate input
    if (!fullName || !organisation || !position) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const trimmedName = fullName.trim();
    const trimmedOrg = organisation.trim();
    const trimmedPos = position.trim();

    // Basic validation
    if (trimmedName.length < 2 || trimmedOrg.length < 2 || trimmedPos.length < 2) {
      return NextResponse.json(
        { error: 'Each field must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (/^\d+$/.test(trimmedName) || /^\d+$/.test(trimmedOrg) || /^\d+$/.test(trimmedPos)) {
      return NextResponse.json(
        { error: 'Numbers only are not allowed in any field' },
        { status: 400 }
      );
    }

    // Check if participant already exists in participants table (as expected participant)
    const existingParticipant = await sql`
      SELECT id, registration_code, participant_status, full_name, organisation 
      FROM participants 
      WHERE LOWER(full_name) = LOWER(${trimmedName})
        AND LOWER(organisation) = LOWER(${trimmedOrg})
    `;

    console.log('Registration - Existing participant check:', existingParticipant);

    // Get ACTIVE event
    let event = await sql`SELECT id FROM events WHERE status = 'ACTIVE' LIMIT 1`;
    let eventId;
    
    if (event.length === 0) {
      return NextResponse.json(
        { error: 'No active event found. Registration is closed.' },
        { status: 400 }
      );
    } else {
      eventId = event[0].id;
    }

    let registrationCode;
    let participantId;

    if (existingParticipant.length > 0) {
      // Participant already exists - reject duplicate registration
      console.log('Duplicate registration rejected:', existingParticipant[0]);
      return NextResponse.json(
        { 
          error: 'You have already registered for this event',
          existingCode: existingParticipant[0].registration_code,
          fullName: existingParticipant[0].full_name,
          organisation: existingParticipant[0].organisation
        },
        { status: 409 }
      );
    } else {
      // Check for duplicates in expected_attendees table
      const duplicate = await isDuplicate(trimmedName, trimmedOrg);
      if (duplicate && !forceSubmit) {
        return NextResponse.json(
          { 
            duplicate: true,
            error: 'A similar registration already exists',
            fullName: trimmedName,
            organisation: trimmedOrg,
            position: trimmedPos
          },
          { status: 409 }
        );
      }

      // Generate unique registration code
      registrationCode = await getUniqueCode();

      // Insert new participant
      const result = await sql`
        INSERT INTO participants (
          registration_code, 
          full_name, 
          organisation, 
          position, 
          event_id,
          participant_status,
          registration_status,
          registration_source
        )
        VALUES (
          ${registrationCode}, 
          ${trimmedName}, 
          ${trimmedOrg}, 
          ${trimmedPos},
          ${eventId},
          'REGISTERED',
          'REGISTERED',
          'ONLINE'
        )
        RETURNING id
      `;
      participantId = result[0].id;
    }

    return NextResponse.json({
      success: true,
      registrationCode: registrationCode,
      participantId: participantId,
      fullName: trimmedName
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
