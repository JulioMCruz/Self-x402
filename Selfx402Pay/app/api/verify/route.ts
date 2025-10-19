import { NextRequest, NextResponse } from 'next/server';

/**
 * Self Protocol Verification Endpoint
 *
 * This endpoint receives verification data from the Self mobile app
 * after a user scans the QR code and completes passport NFC verification.
 *
 * In production, you should:
 * 1. Install @selfxyz/backend package
 * 2. Validate the proof and public signals
 * 3. Extract and store the nullifier (for Sybil resistance)
 * 4. Upgrade user tier from 'unverified' to 'verified_human'
 * 5. Return verification status and user data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Received verification data:', {
      attestationId: body.attestationId,
      proof: body.proof ? 'present' : 'missing',
      publicSignals: body.publicSignals ? 'present' : 'missing',
      userContextData: body.userContextData,
    });

    // TODO: Implement backend verification with @selfxyz/backend
    // Example implementation:
    /*
    import { SelfBackendVerifier, DefaultConfigStore, AllIds } from '@selfxyz/backend';

    const verifier = new SelfBackendVerifier(
      "self-x402-facilitator", // Must match frontend scope
      "https://your-domain.com/api/verify",
      false, // mockPassport (false for production)
      AllIds, // Allow all document types
      new DefaultConfigStore({
        minimumAge: 18,
        excludedCountries: [],
        ofac: false
      }),
      "hex" // Must match frontend userIdType
    );

    const result = await verifier.verify(
      body.attestationId,
      body.proof,
      body.publicSignals,
      body.userContextData
    );

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Verification failed', details: result },
        { status: 400 }
      );
    }

    // Check if nullifier already exists (prevent duplicate verifications)
    const nullifierExists = await checkNullifierInDatabase(result.nullifier);
    if (nullifierExists) {
      return NextResponse.json(
        { error: 'This passport has already been verified' },
        { status: 409 }
      );
    }

    // Store verification in database
    await storeVerification({
      nullifier: result.nullifier,
      userId: body.userContextData.userId,
      ageValid: result.ageValid,
      ofacValid: result.ofacValid,
      disclosedData: result.disclosedData,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    });
    */

    // Temporary response for development
    return NextResponse.json({
      success: true,
      message: 'Verification received (backend validation not yet implemented)',
      tier: 'verified_human',
      data: {
        attestationId: body.attestationId,
        userId: body.userContextData?.userId,
        verified: true,
        // In production, include:
        // nullifier: result.nullifier,
        // ageValid: result.ageValid,
        // ofacValid: result.ofacValid,
        // disclosedData: result.disclosedData,
      }
    });

  } catch (error) {
    console.error('Verification endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process verification',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (service discovery)
export async function GET() {
  return NextResponse.json({
    service: 'Self Protocol Verification',
    version: '1.0',
    scope: 'self-x402-facilitator',
    status: 'development',
    note: 'Backend verification not yet implemented. Install @selfxyz/backend to enable full validation.'
  });
}
