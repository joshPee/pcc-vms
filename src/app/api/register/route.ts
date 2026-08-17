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
    // Generate 4 random digits
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return `CTS-${code}`;
  };

  // Try to generate a unique code
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, organisation, position, phone, forceSubmit = false } = body;

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

    // Check for similar expected participant using fuzzy matching
    const similarParticipant = await findSimilarParticipant(trimmedName, trimmedOrg);
    
    console.log('Registration - Similar participant check:', similarParticipant);
    console.log('Looking for:', trimmedName, trimmedOrg);

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
      
      // If participant is expected, update them to registered and use their assigned code
      if (participant.participant_status === 'EXPECTED') {
        console.log('Expected participant registering with code:', participant.registration_code);
        const result = await sql`
          UPDATE participants 
          SET 
            participant_status = 'REGISTERED',
            registration_status = 'REGISTERED',
            registration_source = 'ONLINE',
            position = ${trimmedPos},
            phone = ${body.phone || null}
          WHERE id = ${participant.id}
          RETURNING id
        `;
        
        return NextResponse.json({
          success: true,
          registrationCode: participant.registration_code,
          participantId: participant.id,
          fullName: participant.full_name
        });
      }
    } else {
      // No similar participant found, generate new code and register
      registrationCode = await getUniqueCode();

      // Insert new participant
      const result = await sql`
        INSERT INTO participants (
          registration_code, 
          full_name, 
          organisation, 
          position, 
          phone,
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
          ${body.phone || null},
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
