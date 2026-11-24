# Manual and automated test cases

These cases are a project validation checklist. Automated coverage currently focuses on authentication, request creation, form validation, TOTP, and backend utility behavior; the remaining cases require a browser, configured integration, or staff action.

| ID | Area | Test | Expected result |
|---|---|---|---|
| TC-01 | Registration | Register with valid email and password | Account is created; verification is required |
| TC-02 | Registration | Register using an existing email | Conflict response; no duplicate account |
| TC-03 | Registration | Submit malformed email | Field validation error |
| TC-04 | Verification | Verify using a valid email link | Account becomes verified once |
| TC-05 | Verification | Reuse or expire a verification token | Request is rejected |
| TC-06 | Login | Sign in using a verified account | Access token and refresh cookie are issued |
| TC-07 | Login | Sign in using a wrong password | Generic invalid credentials response |
| TC-08 | Login | Sign in before email verification | Clear verification-required response |
| TC-09 | Login | Exceed failed-attempt limit | Account is temporarily locked |
| TC-10 | Login | Sign in to deactivated account | Access is refused |
| TC-11 | Password reset | Request reset for a known email | Generic success response and one-time link |
| TC-12 | Password reset | Request reset for an unknown email | Same generic response; no account disclosure |
| TC-13 | Password reset | Reset using a valid token | Password changes; active refresh sessions are revoked |
| TC-14 | Password reset | Reuse/expire reset token | Request is rejected |
| TC-15 | Staff MFA | Start authenticator setup | Secret and provisioning URI returned only to signed-in staff |
| TC-16 | Staff MFA | Enable with current TOTP code | MFA enabled and secret remains encrypted at rest |
| TC-17 | Staff MFA | Login without TOTP after enabling it | Login requests a six-digit authenticator code |
| TC-18 | Staff MFA | Login with invalid TOTP | Login is rejected |
| TC-19 | Authorization | Customer opens admin user management | Forbidden response |
| TC-20 | User management | Deactivate another account as admin | Account is deactivated and cannot sign in |
| TC-21 | User management | Deactivate/demote the only active admin | Operation is rejected |
| TC-22 | Service catalogue | Customer lists services | Only active services are shown |
| TC-23 | Service management | Admin creates a valid service | Service is saved and customer-visible when active |
| TC-24 | Service management | Admin edits service fee and SLA | Updated values are returned |
| TC-25 | Service management | Admin deactivates a service | Existing requests remain; new applications are blocked |
| TC-26 | Application | Submit valid service form with consent | Request number and initial event are created |
| TC-27 | Application | Submit missing required field | Validation errors identify invalid form data |
| TC-28 | Application | Submit extra unknown field | Strict schema validation rejects the payload |
| TC-29 | Application | Submit Aadhaar with spaces | Digits normalize; stored value is encrypted and masked in output |
| TC-30 | Documents | Upload allowed image/PDF under size limit | File is stored privately and linked to request |
| TC-31 | Documents | Upload disallowed MIME or invalid file signature | Upload is rejected and temporary file removed |
| TC-32 | Documents | Upload a file over the size limit | `413 FILE_TOO_LARGE` response |
| TC-33 | Status | Staff advances request status | Event, in-app notification, and configured email are created |
| TC-34 | SLA | Submit a request for a service with processing days | Due date is calculated and overdue queue count updates |
| TC-35 | Completion | Mark a request complete without checklist | Completion is rejected |
| TC-36 | Completion preview | Customer opens completed request | Personalized preview is marked as a sample, not official |
| TC-37 | Feedback | Customer rates a completed request | One feedback record is accepted per request |
| TC-38 | Notifications | Customer marks a notification read | Only that customer's notification changes |
| TC-39 | Payments | Download receipt for paid request | Authenticated PDF downloads with payment details |
| TC-40 | Delivery | Request home delivery then staff dispatches | Status/tracking details show; email notification follows preferences |

## Execution notes

- Run backend tests with `cd backend && npm test`; the script creates a fresh, isolated SQLite database and cleans up only that generated test database.
- Build the frontend with `cd frontend && npm run build`.
- Test email delivery only with a designated test mailbox and test SMTP account. Test payment webhooks only with Razorpay test credentials.
- Use fictional data. Do not test with real identity numbers or upload real certificates.
