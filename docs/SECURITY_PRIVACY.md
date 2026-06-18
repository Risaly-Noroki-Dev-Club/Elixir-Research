# Security and Privacy

## Defaults

- Local-only mode is the default.
- No account is required for PK visualization.
- No concentration data is sent to a server by default.
- HTTPS is mandatory in production.
- Export/import uses explicit user action.

## Optional Vault

The optional vault should use:

- passphrase-derived key through WebCrypto PBKDF2 or Argon2id when available
- AES-GCM for local encrypted payloads
- WebAuthn/passkey or platform biometrics as an unlock convenience, not as the only secret

## Auth

When login is added:

- Google and Apple sign-in are acceptable.
- Hosted sync must be opt-in.
- WebDAV sync is preferred for user-owned storage.
- Sync payloads should be encrypted before upload where feasible.

## Bot Defense

No distorted CAPTCHA. Prefer:

- rate limiting
- passkeys for sensitive operations
- email/device reputation
- proof-of-work only as a last-resort, low-frequency challenge
- server-side abuse scoring

## Medical Safety

Controlled-substance and psychiatric-drug workflows require extra friction:

- source provenance visible
- emergency/overdose warnings
- interaction alerts
- explicit "not medical advice" report footer
- no dose-change recommendation language

