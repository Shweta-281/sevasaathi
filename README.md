# SevaSaathi

SevaSaathi is a full-stack service application and tracking portal built as an academic demonstration. Customers can create accounts, submit applications, upload documents, track progress, receive notifications, and download payment receipts. Staff and administrators can manage requests, services, users, appointments, feedback, and reports.

> **Demonstration only:** SevaSaathi is not an official government website and does not represent UIDAI or any government agency. It cannot issue identity cards or certificates. Use fictional information and files during development.

## Features

### Customer portal

- Create an account with an email address and password.
- Sign in normally with email and password.
- Recover a forgotten password.
- Browse services and complete dynamic application forms.
- Record consent and upload supporting documents.
- Track request status, staff updates, and processing milestones.
- View in-app notifications and request email notifications.
- Book appointments and submit feedback.
- View payments and download PDF receipts.
- Search requests and use public tracking with an application number.
- Switch between English, Hindi, and Marathi.

### Staff and administration

- Manage the staff and administrator queues.
- Review submitted data and document metadata.
- Update application states and process appointments.
- Complete the staff checklist before marking a request complete.
- Create or update services and processing targets.
- Activate or deactivate services and user accounts.
- Manage customer, staff, and administrator roles.
- View request, revenue, service, and feedback metrics.
- Export operational reports to XLSX or PDF.
- Optionally protect staff and administrator accounts with TOTP.

### Platform and security

- React 18 and Vite frontend.
- Node.js and Express REST API.
- Prisma ORM with SQLite for local development.
- Prisma PostgreSQL support and Docker Compose deployment.
- bcrypt password hashing.
- JWT access tokens and HTTP-only refresh cookies.
- Login lockout and role-based API authorization.
- Helmet security headers and request rate limits.
- Encrypted Aadhaar storage and private uploaded-document storage.
- Zod validation and Pino structured logging.
- Swagger API documentation and a Postman collection.

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Zustand, React Hook Form, Tailwind CSS, Recharts, i18next |
| Backend | Node.js, Express, Zod, Pino, Helmet, express-rate-limit |
| Database | SQLite through Prisma locally; PostgreSQL through Prisma with Docker |
| Authentication | bcrypt, JWT, rotating refresh-token cookies, optional TOTP |
| Documents | Local private storage, PDFKit, uploaded-file validation |
| Payments | Razorpay integration or configured local/demo payment flow |
| Email | Optional SMTP/Nodemailer delivery |

## Prerequisites

- Node.js 20 or later
- npm
- Git
- Docker Desktop is optional for the PostgreSQL setup

## Run locally

The frontend and backend run as separate processes.

### 1. Configure the backend

Open a terminal in the repository root:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Generate separate secure values for application secrets:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set these values in `backend/.env`:

- `JWT_ACCESS_SECRET`
- `TOTP_ENC_KEY`
- `AADHAAR_ENC_KEY`

`AADHAAR_ENC_KEY` must be exactly 64 hexadecimal characters. Keep a secure backup of encryption keys; changing one can make previously stored Aadhaar data unreadable.

Initialize the local SQLite database:

```powershell
npm run db:push
npm run db:generate
npm run db:seed
npm run dev
```

The backend runs at `http://localhost:4000`.

- Health: `http://localhost:4000/api/health`
- Swagger UI: `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/api/docs.json`

### 2. Configure and start the frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:4000`.

## Development accounts

The seed script creates local-only accounts. It does not send verification emails; registration and these demo accounts can sign in directly with email and password.

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@sevasaathi.test` | `password123` |
| Staff | `staff@sevasaathi.test` | `password123` |
| Customer | `customer@sevasaathi.test` | `password123` |

If a demo account is missing or inactive, run this from `backend/`:

```powershell
npm run db:seed
```

Demo credentials are public source data and must not be used in a deployed environment.

## Environment configuration

The complete backend template is [`backend/.env.example`](backend/.env.example).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite URL for local development |
| `JWT_ACCESS_SECRET` | Signs access tokens |
| `AADHAAR_ENC_KEY` | 32-byte hexadecimal encryption key |
| `TOTP_ENC_KEY` | Encrypts staff authenticator secrets |
| `FRONTEND_URL` | Public frontend URL used for application links |
| `APP_BASE_URL` | Public/backend base URL |
| `CORS_ORIGIN` | Allowed browser origin |
| `UPLOAD_DIR` | Private uploaded-document directory |
| `MAX_UPLOAD_BYTES` | Maximum upload size |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Optional email delivery settings |
| `SUPPORT_EMAIL` | Support mailbox shown in the application |
| `GOOGLE_CLIENT_ID` | Optional Google Identity client ID |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Optional Razorpay settings |
| `LOCKOUT_MAX_ATTEMPTS`, `LOCKOUT_WINDOW_MIN` | Login lockout policy |
| `RETENTION_DAYS`, `BACKUP_DIR` | Data retention and backup settings |

The frontend template is [`frontend/.env.example`](frontend/.env.example). It currently uses `VITE_API_URL` to configure the backend API URL.

Never place private secrets in `VITE_*` variables. Never commit `backend/.env`, `.env.compose`, databases, uploads, backups, or keys.

## Docker with PostgreSQL

Create the Compose environment file:

```powershell
Copy-Item .env.compose.example .env
```

Set a strong PostgreSQL password in the root `.env` file. The required variable is `POSTGRES_PASSWORD`.

Build and initialize PostgreSQL:

```powershell
docker compose up --build -d database
docker compose build
docker compose run --rm api npx prisma db push --schema prisma/schema.postgresql.prisma
docker compose up -d
```

Open `http://localhost:8080`.

- Frontend: `http://localhost:8080`
- API health: `http://localhost:8080/api/health`

The Compose setup persists PostgreSQL data and application files in Docker volumes. For production, use versioned database migrations, managed secrets, HTTPS, backups, and a reviewed deployment configuration.

## Tests and quality checks

Run backend tests:

```powershell
cd backend
npm test
```

The test runner uses a temporary SQLite database and serial execution. It does not run against the normal development database.

Run frontend tests and build:

```powershell
cd frontend
npm test -- --run
npm run build
```

Additional test documentation is available in [`docs/TEST_CASES.md`](docs/TEST_CASES.md).

## API and project documentation

- [API collection](postman/SevaSaathi.postman_collection.json)
- [Project report](docs/PROJECT_REPORT.md)
- [Test cases](docs/TEST_CASES.md)
- [Google sign-in setup](GOOGLE_AUTH_SETUP.md)

## Project structure

```text
.
├── backend/
│   ├── prisma/              # Schemas and seed data
│   ├── scripts/             # Test runner and backup utility
│   ├── src/
│   │   ├── routes/          # REST routes
│   │   └── services/        # Auth and application services
│   └── tests/               # Backend tests
├── frontend/
│   └── src/
│       ├── components/      # Shared UI components
│       ├── pages/           # Route pages
│       ├── store/           # Zustand application state
│       └── lib/             # API client and shared utilities
├── docs/                    # Project report and test documentation
├── postman/                 # Postman API collection
└── docker-compose.yml       # PostgreSQL and production-style web setup
```

## Troubleshooting

### Login shows invalid credentials

- Enter the exact demo email and password.
- Confirm `npm run db:seed` was run in `backend/`.
- Confirm the backend is using the same SQLite database expected by the seed.
- Check that the account is active.

### The frontend cannot reach the API

- Start the backend on port `4000`.
- Start the frontend on port `5173`.
- Open `http://localhost:4000/api/health`.
- Confirm `CORS_ORIGIN` and `VITE_API_URL` match the running services.

### Prisma engine or generated client error on Windows

Stop the backend process, close other Node processes using Prisma, and run:

```powershell
cd backend
npm run db:generate
```

Then restart the backend.

### Uploaded documents or receipts are unavailable

- Confirm the document was uploaded successfully.
- Sign in with the account that owns the request.
- Verify the request or payment status required by the endpoint.
- Confirm the `UPLOAD_DIR` still exists and contains the application files.

### Docker cannot start PostgreSQL

- Start Docker Desktop.
- Confirm `POSTGRES_PASSWORD` exists in the root `.env`.
- Inspect logs with `docker compose logs database`.
- Use `docker compose down` to stop containers without removing volumes.

## Security and privacy

- Use only fictional data for demos.
- Do not store real Aadhaar numbers, PAN numbers, identity documents, or payment details.
- Use strong, unique secrets in deployed environments.
- Keep uploaded documents and databases outside public web directories.
- Protect backups and encryption keys.
- Use HTTPS and managed environment secrets for any real deployment.
- Review permissions and audit logs before pilot or production use.

## License

This project is distributed under the MIT License. See [`LICENSE`](LICENSE).
