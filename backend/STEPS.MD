## 2FA (TOTP) Setup and Usage

This project implements 2-factor authentication (2FA) using TOTP via `speakeasy` and password hashing via `bcrypt`. 2FA is enforced during login when enabled for a user. The flow and endpoints are identical for both Client and Admin modules, namespaced under `/client` and `/msb-admin` respectively.

### What was added
- User fields: `twofa_enabled` (boolean), `twofa_secret` (base32), `twofa_backup_codes` (jsonb; reserved for future use)
- Endpoints: setup, enable, disable, and status for both Client and Admin
- Login accepts an optional `otp` and requires it when `twofa_enabled = true`

### Environment variables
- `JWT_SECRET`: signing key for JWTs (already used)
- `TWOFA_APP_NAME` (optional): label shown in authenticator apps; defaults to `Transbridge` (Admin uses `Transbridge Admin` if set)

## Endpoints

Replace `<BASE_URL>` accordingly. All 2FA configuration endpoints require an Authorization header with a valid Bearer token.

### Client
- POST `<BASE_URL>/client/login`
  - Body: `{ email, password, otp? }`
  - Behavior:
    - If 2FA disabled: `otp` ignored; success returns `{ token, user, ... }`
    - If 2FA enabled: `otp` is required; invalid or missing `otp` returns 401

- POST `<BASE_URL>/client/2fa/setup` (JWT)
  - Returns: `{ otpauth_url, base32 }`
  - Use `otpauth_url` to render a QR; `base32` is the manual entry secret.

- POST `<BASE_URL>/client/2fa/enable` (JWT)
  - Body: `{ otp }`
  - Returns: `{ message, twofa_enabled: true }`

- POST `<BASE_URL>/client/2fa/disable` (JWT)
  - Body: `{ otp }`
  - Returns: `{ message, twofa_enabled: false }`

- GET `<BASE_URL>/client/2fa/status` (JWT)
  - Returns: `{ twofa_enabled }`

### Admin
Same shapes as Client, prefixed with `/msb-admin`:
- POST `<BASE_URL>/msb-admin/login` → `{ email, password, otp? }`
- POST `<BASE_URL>/msb-admin/2fa/setup` (JWT) → `{ otpauth_url, base32 }`
- POST `<BASE_URL>/msb-admin/2fa/enable` (JWT) → body `{ otp }`
- POST `<BASE_URL>/msb-admin/2fa/disable` (JWT) → body `{ otp }`
- GET `<BASE_URL>/msb-admin/2fa/status` (JWT) → `{ twofa_enabled }`

## Typical frontend flows

### Enabling 2FA
1) User is logged in (has JWT)
2) Call `POST /client/2fa/setup` (or `/msb-admin/2fa/setup`)
3) Render QR using `otpauth_url`; also show fallback `base32` secret
4) User scans with an authenticator app (Google Authenticator, 1Password, Authy, etc.)
5) User enters the 6-digit code; call `POST /client/2fa/enable` with `{ otp }`
6) On success, `twofa_enabled` becomes true

### Logging in
- If `twofa_enabled = false`: submit `{ email, password }` to `/login`
- If `twofa_enabled = true`: submit `{ email, password, otp }` to `/login`

The backend returns `401 Unauthorized` with messages like `OTP required` or `Invalid OTP` when 2FA verification fails.

### Disabling 2FA
1) While logged in, call `POST /client/2fa/disable` with `{ otp }`
2) On success, 2FA is turned off and the secret is cleared

### Checking 2FA status
- Call `GET /client/2fa/status` → `{ twofa_enabled: boolean }`

## Example requests (curl)

```bash
# Login with 2FA (client)
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"Secret123","otp":"123456"}' \
  <BASE_URL>/client/login

# Generate setup data (client)
curl -sS -X POST \
  -H 'Authorization: Bearer <JWT>' \
  <BASE_URL>/client/2fa/setup

# Enable 2FA (client)
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <JWT>' \
  -d '{"otp":"123456"}' \
  <BASE_URL>/client/2fa/enable

# Disable 2FA (client)
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <JWT>' \
  -d '{"otp":"123456"}' \
  <BASE_URL>/client/2fa/disable

# Status (client)
curl -sS -X GET \
  -H 'Authorization: Bearer <JWT>' \
  <BASE_URL>/client/2fa/status
```

## Error handling
- `401 Unauthorized` with message `OTP required`: user has 2FA enabled but did not include an OTP
- `401 Unauthorized` with message `Invalid OTP`: wrong/expired code
- `401 Unauthorized` with message `Invalid credentials`: wrong email/password
- `400 Bad Request`: various validation or upstream errors (see backend messages)

## Notes & security considerations
- Time synchronization: TOTP codes are time-based; the server allows a small window to offset clock drift. Ensure user devices have correct time.
- Secrets & backups: The API reserves `twofa_backup_codes` for future use. If you need recovery codes, we can generate/store hashed codes and add endpoints to consume them.
- Token handling: 2FA does not change token semantics; continue storing and sending the JWT as usual.


