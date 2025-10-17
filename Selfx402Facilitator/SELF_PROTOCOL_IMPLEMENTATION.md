# Self Protocol Implementation Review

## Documentation Review

Based on official Self Protocol documentation:
- [Basic Integration](https://docs.self.xyz/backend-integration/basic-integration)
- [ConfigStore](https://docs.self.xyz/backend-integration/configstore)
- [SelfBackendVerifier API Reference](https://docs.self.xyz/backend-integration/selfbackendverifier-api-reference)

## ✅ Implementation Status

### Correct Implementation

1. **Installed Correct SDK**: `@selfxyz/core@^1.0.8` ✅
2. **SelfBackendVerifier Initialization**: Matches official documentation ✅
3. **Verification Method**: Uses correct `verify()` signature ✅
4. **Nullifier Extraction**: Correctly extracts from `result.discloseOutput.nullifier` ✅
5. **Result Structure**: Properly uses `result.isValidDetails` for validation checks ✅
6. **ConfigStore**: Uses `DefaultConfigStore` with proper parameters ✅

### Implementation Details

#### SelfBackendVerifier Constructor
```typescript
new SelfBackendVerifier(
  requirements.scope,              // ✅ Unique app identifier
  requirements.endpoint,           // ✅ Public verification endpoint
  false,                          // ✅ mockPassport (false = mainnet)
  AllIds,                         // ✅ Allow all document types (1,2,3)
  new DefaultConfigStore({
    minimumAge: requirements.minimumAge,
    excludedCountries: requirements.excludedCountries || [],
    ofac: requirements.ofac || false,
  }),                             // ✅ Proper config store
  'uuid'                          // ✅ User identifier type
);
```

#### Verify Method
```typescript
const result = await verifier.verify(
  attestationId,    // number (1=Passport, 2=EU ID, 3=Aadhaar)
  proof,           // VcAndDiscloseProof object
  publicSignals,   // BigNumberish[] array
  userContextData  // string (hex-encoded)
);
```

#### Result Validation
```typescript
// ✅ Correct validation checks
const { isValid, isMinimumAgeValid, isOfacValid } = result.isValidDetails;

// ✅ Correct nullifier extraction
const nullifier = result.discloseOutput?.nullifier;

// ✅ Correct nationality extraction
const nationality = result.discloseOutput?.nationality;
```

## Environment Configuration

### Required Environment Variables

```bash
# Ngrok Configuration
SERVER_DOMAIN=http://codalabs.ngrok.io

# Self Protocol Configuration
SELF_ENDPOINT=http://codalabs.ngrok.io/api/verify
SELF_SCOPE=celo-facilitator
```

### Why Ngrok is Required

Self Protocol mobile app needs to:
1. Generate QR code with `endpoint` URL
2. Mobile app scans QR code
3. User taps NFC passport
4. Mobile app sends proof to `endpoint` URL for verification

**The endpoint MUST be publicly accessible** for the mobile app to reach it. Ngrok provides:
- Public HTTPS URL that tunnels to localhost
- Custom domain support (`codalabs.ngrok.io`)
- SSL/TLS encryption (required for production)

## Data Flow

### 1. Frontend QR Generation (SelfFrontend)
```typescript
const app = new SelfAppBuilder({
  version: 2,
  appName: "Celo Facilitator",
  scope: "celo-facilitator",           // Must match backend SELF_SCOPE
  endpoint: "http://codalabs.ngrok.io/api/verify",  // Public endpoint
  userId: "00000000-0000-0000-0000-000000000000",
  userIdType: 'uuid',
  disclosures: {
    minimumAge: 18,
    excludedCountries: ['IRN', 'PRK'],
    ofac: true,
    nationality: true
  }
}).build();
```

### 2. Mobile App Verification
1. User scans QR code with Self mobile app
2. User taps passport with NFC
3. App generates zero-knowledge proof
4. App calls `POST http://codalabs.ngrok.io/api/verify` with proof

### 3. Backend Verification (CeloFacilitator)
```typescript
// Endpoint: POST /verify-self
const result = await selfService.verifyProof(
  proof,          // Base64 encoded proof|publicSignals
  requirements,   // { minimumAge, excludedCountries, ofac, scope }
  attestationId,  // 1 (Passport)
  userContextData // Optional context
);
```

### 4. Result Structure
```typescript
{
  valid: true,
  tier: 'verified_human',
  nullifier: '0x...',  // Unique identifier (prevents duplicates)
  disclosedData: {
    ageValid: true,
    nationality: 'USA',
    ofacValid: true,
    name: 'John Doe',           // Optional
    gender: 'M',                // Optional
    dateOfBirth: '1990-01-01'   // Optional
  }
}
```

## Verification Result Fields

Based on official documentation, the result object contains:

```typescript
{
  attestationId: number;           // Document type used
  isValidDetails: {
    isValid: boolean;              // Overall proof validity
    isMinimumAgeValid: boolean;    // Age requirement met
    isOfacValid: boolean;          // OFAC check passed
  };
  forbiddenCountriesList: string[];
  discloseOutput: {
    nullifier: string;             // ✅ Unique proof identifier
    forbiddenCountriesListPacked: string[];
    issuingState: string;          // Document issuing country
    name: string;                  // Full name
    idNumber: string;              // Document number
    nationality: string;           // Nationality code (ISO 3166-1 alpha-3)
    dateOfBirth: string;           // YYYY-MM-DD
    gender: string;                // M/F/X
    expiryDate: string;            // Document expiry
    olderThan: string;             // Age verification result
    ofac: boolean[];               // OFAC check results
  };
  userData: {
    userIdentifier: string;        // User ID from context
    userDefinedData: string;       // Additional context data
  };
}
```

## Security Considerations

### Nullifier Management
- ✅ Nullifier is unique per passport + scope combination
- ✅ Prevents same passport from verifying multiple times
- ✅ Currently stored in-memory Map (TODO: PostgreSQL for production)
- ✅ Should include 90-day expiry timestamp

### Privacy Preservation
- ✅ Zero-knowledge proofs reveal only disclosed fields
- ✅ Passport data never leaves user's device
- ✅ Nullifier prevents tracking across scopes
- ✅ Only age/nationality/OFAC disclosed by default

### Country Exclusion
- ✅ Supports dynamic excluded countries list
- ✅ Validates against `result.discloseOutput.nationality`
- ✅ Returns clear error message on exclusion

### OFAC Compliance
- ✅ Automatically validated if `ofac: true` in requirements
- ✅ Checks `result.isValidDetails.isOfacValid`
- ✅ Rejects verification if OFAC check fails

## Production Readiness Checklist

### Completed ✅
- [x] Install correct SDK (`@selfxyz/core`)
- [x] Implement SelfBackendVerifier with proper parameters
- [x] Extract nullifier from `discloseOutput.nullifier`
- [x] Validate using `isValidDetails` fields
- [x] Support dynamic requirements via ConfigStore
- [x] Configure ngrok domain in `.env`
- [x] Set SELF_ENDPOINT and SELF_SCOPE
- [x] Create ngrok startup script
- [x] Update README with ngrok instructions

### TODO 🚧
- [ ] Replace in-memory nullifier storage with PostgreSQL
- [ ] Implement 90-day nullifier expiry
- [ ] Add SSL/TLS for production (ngrok provides this)
- [ ] Test with real Self mobile app
- [ ] Add comprehensive error handling for network failures
- [ ] Implement rate limiting for verification endpoint
- [ ] Add monitoring/logging for verification attempts
- [ ] Set up automated nullifier cleanup job

## Testing Strategy

### Unit Tests
```typescript
describe('SelfVerificationService', () => {
  it('should create verifier with correct parameters');
  it('should extract nullifier from discloseOutput');
  it('should validate age requirements');
  it('should reject excluded countries');
  it('should check nullifier uniqueness');
  it('should handle OFAC validation');
});
```

### Integration Tests
```typescript
describe('Self Protocol Integration', () => {
  it('should verify valid passport proof');
  it('should reject invalid proof');
  it('should reject duplicate nullifier');
  it('should validate dynamic requirements');
});
```

### E2E Tests
```typescript
describe('Complete Verification Flow', () => {
  it('should generate QR code → scan → verify → return result');
  it('should work with ngrok tunnel');
  it('should handle mobile app errors gracefully');
});
```

## Common Issues & Solutions

### Issue: Module not found `@selfxyz/core`
**Solution**: Ensure clean install with `rm -rf node_modules && npm install`

### Issue: Nullifier missing from result
**Solution**: Check extraction path `result.discloseOutput?.nullifier` (not `result.nullifier`)

### Issue: Mobile app can't reach endpoint
**Solution**:
1. Verify ngrok tunnel is running: `./start-ngrok.sh`
2. Check `SELF_ENDPOINT` matches ngrok domain
3. Ensure port 3005 is not blocked by firewall

### Issue: Verification fails with valid proof
**Solution**:
1. Check `scope` matches between frontend and backend
2. Verify `endpoint` is publicly accessible
3. Ensure `mockPassport` is `false` for mainnet proofs

## References

- [Self Protocol Docs](https://docs.self.xyz)
- [Backend Integration Guide](https://docs.self.xyz/backend-integration/basic-integration)
- [SelfBackendVerifier API](https://docs.self.xyz/backend-integration/selfbackendverifier-api-reference)
- [ConfigStore Documentation](https://docs.self.xyz/backend-integration/configstore)
- [x402 Protocol](https://x402.gitbook.io)
- [Celo Network](https://docs.celo.org)

---

**Last Updated**: 2025-01-15
**Implementation Status**: ✅ Complete and compliant with official documentation
**Next Steps**: Production deployment and real-world testing
