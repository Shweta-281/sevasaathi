<div align="center">

# SevaSaathi

### A clearer way to request, manage, and track assisted services

**SevaSaathi** means “your service companion”: one place to start an assisted-service request, follow its progress, and manage the related documents and appointments.

An independent service portal concept with a customer dashboard, staff workspace, document handling, payments, appointments, and a public request tracker.

[Features](#-what-you-can-do) · [Run locally](#-run-it-locally) · [Demo accounts](#-development-demo-accounts) · [Configuration](#-configuration) · [Troubleshooting](#-troubleshooting)

</div>

> **Important:** This is a demonstration project and independent service portal. It is not an official government website, does not issue government identity documents, and must not be used to imply government affiliation. Use fictional sample data only.

---

## ✨ What you can do

### Customer portal

- Register with email and password, sign in, or use optional Google sign-in.
- Browse available services and submit a guided request.
- Upload supporting documents and review their request status.
- View appointments, payments, receipts, and profile settings.
- Search and filter requests, download receipts, and export request lists.
- Check a request’s latest status using its tracking number, without exposing personal form data or uploaded files.

### Staff and administration

- Role-protected administration dashboard for staff and administrators.
- Review requests, update their status, manage the service catalogue, and view dashboard metrics.
- Keep an audit record of supported administrative actions.
- Export eight operational reports (requests, users, payments, appointments, services, document metadata, audit activity, and daily totals) as `.xlsx` workbooks or PDFs. Export rows include relevant customer details and India-local timestamps; credentials, Aadhaar values, document contents, and private storage paths are excluded.

### Service and security details

- Password sign-in uses hashed passwords and rate limits; refresh sessions use an HTTP-only cookie.
- Optional Google sign-in verifies Google’s signed ID token on the backend.
- Aadhaar values are encrypted by the backend before storage; use a strong, private encryption key.
- Private uploaded files require authentication and authorization to download.
- Public tracking returns only the request number, service, current status, status note, and last update time.

## 🧭 Request tracking

Open **Track a request** and enter the number from the application acknowledgement. The page checks the API connection and displays whether the tracker service is reachable. A successful lookup shows the latest saved status and highlights its place in the usual request flow.

Tracking numbers use this shape: `AS-YYYY-NNNNNN`, for example `AS-2026-100001` in the current seeded development data. The progress graphic is a guide based on the current status; it is not a full event-by-event history. If a number is not found, confirm it against the acknowledgement and check that the local database has been seeded.

The API health endpoint is available at `http://localhost:4000/api/health` when the backend is running.

## 🧰 Technology

| Area | Tools |
| --- | --- |
| Web app | React 18, Vite, React Router, Zustand, Tailwind CSS |
| API | Node.js, Express, Zod |
| Database | SQLite and Prisma |
| Documents and receipts | Local upload storage and PDFKit |
| Payments | Razorpay integration, configured with backend environment variables |
| Sign-in | Password authentication; Google Identity Services is optional |

## 🚀 Run it locally

### Prerequisites

- Node.js 20 or later and npm.
- Windows, macOS, or Linux.

### 1. Install the backend and configure its environment

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Open `backend/.env` and replace the development encryption key and JWT secret. Generate each value with Node, then paste the output into the matching setting:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use a different generated value for `JWT_ACCESS_SECRET` and `AADHAAR_ENC_KEY`. The Aadhaar key must be 64 hexadecimal characters. Never commit `.env` or reuse these development secrets in production.

For a **new, empty local database**, sync the schema and create the Prisma client:

```powershell
npx prisma db push --accept-data-loss
npm run db:generate
```

`--accept-data-loss` is shown only for initial setup of a disposable local database because Prisma can warn when it adds a unique Google identity column. Do not use it against a database with data you need to keep. Back up an existing database and review schema changes first. Stop the backend before regenerating Prisma Client if Windows reports that a query-engine file is locked.

Load the sample services, development accounts, and example requests:

```powershell
npm run db:seed
```

Start the API:

```powershell
npm run dev
```

It listens at `http://localhost:4000`. Verify that it is available at `http://localhost:4000/api/health`.

### 2. Install and start the frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` calls to the local backend on port `4000`.

### Development demo accounts

The seed script creates these local-only accounts with the same development password:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@sevasaathi.test` | `password123` |
| Staff | `staff@sevasaathi.test` | `password123` |
| Customer (Rahul Sharma) | `customer@sevasaathi.test` | `password123` |

These credentials are public in the seed script. They are for local demonstrations only; never seed these accounts into a live deployment. The current seeded data includes the example tracking number `AS-2026-100001`; run the seed command if it does not exist in your local database.

When you reseed an existing development database, the seed script renames its legacy demo email addresses in place so existing requests stay attached to the same users.

## ⚙️ Configuration

The backend reads its environment from `backend/.env`. Start from [`backend/.env.example`](backend/.env.example).

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite connection string for local development. |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens; use a unique strong value. |
| `AADHAAR_ENC_KEY` | 32-byte hex key for encrypting Aadhaar values. Back it up securely; losing it makes existing encrypted values unreadable. |
| `GOOGLE_CLIENT_ID` | Optional Google web client ID. Leave blank to hide Google sign-in. See [`GOOGLE_AUTH_SETUP.md`](GOOGLE_AUTH_SETUP.md). |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Razorpay credentials for payment integration. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Email delivery for verification and request notifications. |
| `APP_BASE_URL`, `CORS_ORIGIN` | Backend links and the allowed browser origin. Set these to your deployment URLs when hosting. |
| `UPLOAD_DIR`, `MAX_UPLOAD_BYTES` | Local document storage path and upload size limit. |
| `SUPPORT_EMAIL` | Optional support contact address. |

When Google sign-in is enabled, register the frontend origin in Google Cloud Console (for local development, `http://localhost:5173`) and use the generated **Web application** client ID. Do not put a Google client secret in the frontend.

## 🗂️ Project layout

```text
.
├── backend/
│   ├── prisma/             # SQLite schema and development seed
│   └── src/
│       ├── routes/         # HTTP endpoints
│       ├── services/       # Request, auth, payment, and domain logic
│       ├── middleware/     # Authentication, validation, and permissions
│       └── utils/          # Tokens, encryption, tracking, and validation
└── frontend/
    └── src/
        ├── components/     # Shared interface and app shell
        ├── pages/          # Public pages and customer/admin views
        ├── lib/             # API client and display helpers
        └── store/           # Client auth state
```

## 🧪 Useful commands

Run these from the directory indicated:

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend/` | `npm run dev` | Start the API with file watching. |
| `backend/` | `npm run db:push` | Sync Prisma schema changes to the local database. Back up data first. |
| `backend/` | `npm run db:generate` | Generate Prisma Client. Stop the server first if Windows locks the query engine. |
| `backend/` | `npm run db:seed` | Load development services, accounts, and example requests. |
| `backend/` | `npm test` | Run the backend Vitest suite. |
| `frontend/` | `npm run dev` | Start the Vite development server. |
| `frontend/` | `npm run build` | Create the frontend production bundle in `frontend/dist`. |

## 🔎 Troubleshooting

### Tracker says “Tracker unavailable”

Start the backend and open `http://localhost:4000/api/health`. It should return JSON with `"ok": true`. Confirm the frontend is at port `5173` and the backend is at port `4000`; Vite’s API proxy is configured for those local ports.

### The tracker says no matching request

Confirm the number exactly as printed on the acknowledgement. To load the local example records, run `npm run db:seed` from `backend/`, then try `AS-2026-100001`.

### Google sign-in is not visible

Set `GOOGLE_CLIENT_ID` in `backend/.env`, restart the backend, and add `http://localhost:5173` to the OAuth client’s authorized JavaScript origins. Details are in [`GOOGLE_AUTH_SETUP.md`](GOOGLE_AUTH_SETUP.md).

### Prisma cannot replace its query engine on Windows

Stop the backend process that is using Prisma Client, then rerun `npm run db:generate` from `backend/`.

## 🛡️ Deployment notes

- Serve the app over HTTPS and use production-only secrets.
- Change `APP_BASE_URL`, `CORS_ORIGIN`, OAuth origins, email settings, and payment settings to match the deployed domain.
- Do not expose `.env`, sample credentials, database files, or uploaded documents publicly.
- Back up the database, encryption key, and uploaded files through separate, access-controlled processes.
- SQLite and local uploads are suitable for local development and a simple single-instance demo. Select and configure managed database and file storage for a multi-instance production deployment.
- Review privacy, retention, accessibility, email delivery, and payment behavior before handling real users or personal information.

## 📄 License

No license file is currently included. Ask the project owner before redistributing or using this code outside its intended demonstration context.
