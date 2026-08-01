<div align="center">

<img src="https://krew-os.vercel.app/favicon.ico" alt="KrewOS" width="80" />

# 🏗️ KrewOS — Backend

**Enterprise Construction Management API — Multi-Tenant SaaS with Stripe Billing**

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-5-000000?logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-20-635BFF?logo=stripe)](https://stripe.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.5-000000)](https://www.better-auth.com/)

</div>

---

## 📋 Overview

KrewOS Backend is the API layer for a multi-tenant construction management SaaS. Built with **Node.js**, **Express.js**, and **TypeScript**, it powers 14 business domains across a **Prisma + PostgreSQL** stack. The architecture implements a **dual authentication system** (Better Auth sessions + custom JWT tokens), **hierarchical RBAC** with both system-level and project-level roles, a **Stripe-integrated billing engine** with webhook-driven subscription lifecycle management, and **Cloudinary-backed media uploads** with automatic cleanup on request failure.

> 🔗 **Frontend Repo:** [KrewOS-Frontend](https://github.com/ishtiakalhumaidi/KrewOS-Frontend)  
> 🔗 **API Base:** `https://krew-os-backend.vercel.app`

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **🔐 Dual Authentication Architecture** | Better Auth session tokens for browser sessions + custom JWT access/refresh tokens for API clients. The `checkAuth` middleware validates BOTH systems with fallback chain |
| **⏱️ Percentage-Based Session Refresh** | Calculates remaining session lifetime percentage and sends `X-Session-Refresh` + `X-Time-Remaining` headers when < 20% remains, enabling proactive frontend token renewal |
| **🛡️ Hierarchical RBAC (System + Project)** | Four system roles (SUPER_ADMIN → OWNER → ADMIN → MEMBER) AND five project roles (PROJECT_MANAGER, SITE_MANAGER, SAFETY_OFFICER, SUBCONTRACTOR, WORKER) with separate middleware enforcement |
| **🔒 Project-Scoped Authorization** | `checkProjectRole` middleware verifies user assignment to specific projects via composite key (`projectId_userId`) before allowing action — Owners and Super Admins bypass for oversight |
| **💳 Stripe Billing Engine** | Checkout sessions, webhook signature verification, subscription lifecycle management (trialing → active → canceled → past_due), and plan-configurable system limits (maxProjects, maxMembers, maxStorage) |
| **🧹 Cloudinary Auto-Cleanup** | Global error handler intercepts `req.file` / `req.files` and deletes uploaded Cloudinary assets on ANY request failure, preventing orphaned media |
| **📧 SMTP Email Pipeline** | Nodemailer + EJS templates for transactional emails (invites, password resets, billing receipts) |
| **✅ Zod Request Validation** | `validateRequest` middleware parses JSON from `FormData` bodies and validates against Zod schemas before reaching controllers |
| **📊 Domain-Driven Prisma Schema** | 11 modular `.prisma` files (enums, auth, company, project, task, attendance, material, report, safety, billing, invite) with 18 domain enums |
| **🧯 Graceful Shutdown** | SIGTERM, SIGINT, uncaughtException, and unhandledRejection handlers ensure active requests complete before process exit |
| **🔒 Strict Environment Validation** | 25+ env vars validated at boot time with descriptive `AppError` messages — server refuses to start if any required variable is missing |
| **📦 Standardized API Response** | `sendResponse` utility enforces uniform `{ success, message, data, meta }` shape across all 15 modules |
| **🎣 CatchAsync Wrapper** | Eliminates try/catch boilerplate in every controller by centralizing async error propagation to the global handler |

---

## 🛠️ Tech Stack

**Core**
- [Node.js](https://nodejs.org/) — Runtime
- [Express.js](https://expressjs.com/) — Web framework
- [TypeScript](https://www.typescriptlang.org/) — Type safety

**Database**
- [Prisma](https://www.prisma.io/) — ORM with multi-file schema
- [PostgreSQL](https://www.postgresql.org/) — Relational database
- [@prisma/adapter-pg](https://www.prisma.io/docs/orm/overview/databases/postgresql) — Native PostgreSQL driver adapter

**Authentication**
- [Better Auth](https://www.better-auth.com/) — Session-based auth framework
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — Custom JWT implementation
- [cookie-parser](https://www.npmjs.com/package/cookie-parser) — Cookie parsing

**Payments**
- [Stripe](https://stripe.com/) — Subscription billing & checkout

**Media**
- [Cloudinary](https://cloudinary.com/) — Image upload & storage
- [Multer](https://www.npmjs.com/package/multer) — Multipart form parsing
- [multer-storage-cloudinary](https://www.npmjs.com/package/multer-storage-cloudinary) — Direct Cloudinary upload

**Validation**
- [Zod](https://zod.dev/) — Runtime schema validation

**Email**
- [Nodemailer](https://nodemailer.com/) — SMTP transport
- [EJS](https://ejs.co/) — Email template engine

**Utilities**
- [http-status](https://www.npmjs.com/package/http-status) — Standardized status codes
- [ms](https://www.npmjs.com/package/ms) — Human-readable time parsing

**Build**
- [tsup](https://tsup.egoist.dev/) — Zero-config TypeScript bundler
- [tsx](https://tsx.is/) — TypeScript execution for dev

---

## 🚀 Getting Started

### Prerequisites
- Node.js `>= 20`
- PostgreSQL `>= 14`
- pnpm `>= 8`
- Stripe account (for billing)
- Cloudinary account (for media)
- SMTP credentials (for email)

### Installation

```bash
# Clone the repository
git clone https://github.com/ishtiakalhumaidi/krewOS-Backend.git
cd krewOS-Backend

# Install dependencies
pnpm install

# Generate Prisma Client
pnpm generate

# Push schema to database
pnpm push

# Seed plan configurations (required for billing)
pnpm seed

# Start development server
pnpm dev
```

### Environment Variables

Create a `.env` file with all required variables:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=https://krew-os.vercel.app

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/krewos?schema=public"

# Auth
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:5000
JWT_SECRET=your_jwt_secret
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN=30d
BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE=1d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/callback/google

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cron
CRON_SECRET=your_cron_secret
```

> ⚠️ **Never commit `.env` to version control.**

### Stripe Webhook Local Testing

```bash
# Forward Stripe webhooks to your local server
stripe listen --forward-to localhost:5000/api/v1/billing/webhook
```

### Build for Production

```bash
# Using tsup (recommended)
pnpm build:tsup

# Or using TypeScript compiler
pnpm build

# Start production server
pnpm start
```

---

## 📁 Project Structure

```
krewOS-Backend/
├── prisma/
│   ├── schema/
│   │   ├── schema.prisma          # Prisma config (generator + datasource)
│   │   ├── enums.prisma           # 18 domain enums
│   │   ├── auth.prisma            # User, Session, Account, Verification
│   │   ├── company.prisma         # Company model
│   │   ├── project.prisma         # Project + ProjectMember
│   │   ├── task.prisma            # Task model
│   │   ├── attendance.prisma      # Attendance + Timesheet
│   │   ├── material.prisma        # MaterialRequest
│   │   ├── report.prisma          # DailySiteReport
│   │   ├── safety.prisma          # SafetyChecklist + Incident
│   │   ├── billing.prisma         # PlanConfig + Subscription + Payment
│   │   └── invite.prisma          # CompanyInvite
│   └── migrations/                # Prisma migration history
├── scripts/
│   └── fix-imports.js             # Post-build import path fixer
├── src/
│   ├── app.ts                     # Express app configuration
│   ├── server.ts                  # Bootstrap + graceful shutdown
│   ├── app/
│   │   ├── config/
│   │   │   ├── env.ts             # Strict env var validation (25+ vars)
│   │   │   ├── cloudinary.config.ts
│   │   │   └── stripe.config.ts
│   │   ├── errorHelpers/
│   │   │   ├── AppError.ts        # Custom error class
│   │   │   └── handleZodError.ts  # Zod error formatter
│   │   ├── interfaces/
│   │   │   └── error.interface.ts
│   │   ├── lib/
│   │   │   ├── auth.ts            # Better Auth configuration
│   │   │   └── prisma.ts          # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── checkAuth.ts       # Dual-auth validation + session refresh
│   │   │   ├── checkProjectRole.ts # Project-scoped authorization
│   │   │   ├── globalErrorHandler.ts # Cloudinary cleanup + error formatting
│   │   │   ├── notFoundHandler.ts
│   │   │   └── validateRequest.ts # Zod body validation
│   │   ├── module/                # 15 business modules
│   │   │   ├── admin/
│   │   │   ├── attendance/
│   │   │   ├── auth/
│   │   │   ├── billing/           # Stripe checkout + webhooks
│   │   │   ├── company/
│   │   │   ├── daily-report/
│   │   │   ├── dashboard/
│   │   │   ├── incident/
│   │   │   ├── material-request/
│   │   │   ├── project/
│   │   │   ├── project-member/
│   │   │   ├── safety-checklist/
│   │   │   ├── task/
│   │   │   └── user/
│   │   ├── routes/
│   │   │   └── index.ts           # Central router aggregator
│   │   ├── shared/
│   │   │   ├── catchAsync.ts      # Async error wrapper
│   │   │   ├── sendResponse.ts    # Standardized response formatter
│   │   │   ├── sendEmail.ts       # SMTP email pipeline
│   │   │   └── mailTemplates/     # EJS email templates
│   │   ├── templates/             # EJS view templates
│   │   └── utils/
│   │       ├── cookie.ts          # Cookie read/write utilities
│   │       ├── jwt.ts             # JWT sign/verify utilities
│   │       └── seed.ts            # Database seeding
│   └── generated/                 # Prisma generated client + enums
├── vercel.json                    # Vercel deployment config
├── tsup.config.ts                 # Bundler configuration
├── package.json
└── README.md
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/*` | Better Auth endpoints (login, register, callback, session) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users` | Fetch all users |
| `GET` | `/api/v1/users/me` | Get current authenticated user |

### Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/companies` | Create company (OWNER only) |
| `GET` | `/api/v1/companies` | List companies |
| `PATCH` | `/api/v1/companies/:id` | Update company |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/projects` | Create project |
| `GET` | `/api/v1/projects` | List projects (company-scoped) |
| `GET` | `/api/v1/projects/:id` | Get project details |
| `PATCH` | `/api/v1/projects/:id` | Update project |
| `DELETE` | `/api/v1/projects/:id` | Delete project |

### Project Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/project-members` | Assign member to project |
| `GET` | `/api/v1/project-members` | List project members |
| `DELETE` | `/api/v1/project-members/:id` | Remove member from project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/tasks` | Create task |
| `GET` | `/api/v1/tasks` | List tasks |
| `PATCH` | `/api/v1/tasks/:id` | Update task status/priority |
| `DELETE` | `/api/v1/tasks/:id` | Delete task |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/attendance` | Log attendance (clock-in/out) |
| `GET` | `/api/v1/attendance` | Get attendance records |
| `GET` | `/api/v1/attendance/timesheet` | Aggregate timesheet with total hours |

### Daily Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/daily-reports` | Submit daily site report |
| `GET` | `/api/v1/daily-reports` | List daily reports |

### Incidents
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/incidents` | Report incident (with Cloudinary images) |
| `GET` | `/api/v1/incidents` | List incidents |
| `PATCH` | `/api/v1/incidents/:id` | Update incident status |

### Material Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/material-requests` | Request materials |
| `GET` | `/api/v1/material-requests` | List material requests |
| `PATCH` | `/api/v1/material-requests/:id/approve` | Approve request |

### Safety Checklists
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/safety-checklists` | Submit safety checklist |
| `GET` | `/api/v1/safety-checklists` | List checklists |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/billing/checkout` | Create Stripe checkout session |
| `POST` | `/api/v1/billing/webhook` | Stripe webhook handler (raw body) |
| `GET` | `/api/v1/billing/plans` | List available subscription plans |
| `GET` | `/api/v1/billing/payments` | Get company payment history |
| `POST` | `/api/v1/billing/cancel` | Schedule subscription cancellation |
| `GET` | `/api/v1/billing/platform-payments` | Super Admin: all platform payments |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/companies` | List all companies (SUPER_ADMIN) |
| `PATCH` | `/api/v1/admin/companies/:id/status` | Suspend/activate company |
| `GET` | `/api/v1/admin/dashboard` | Platform analytics |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/dashboard` | Company dashboard metrics |

---

## 🔑 Key Architectural Decisions

### 1. Dual Authentication with Fallback Chain
The `checkAuth` middleware implements a two-tier validation system:

1. **Better Auth Session Token** — Checks `better-auth.session_token` cookie against the Prisma `Session` table with `expiresAt > now()`. If valid, attaches user to `req.user`.
2. **Custom JWT Access Token** — Falls back to `accessToken` cookie, verifies with `jwt.verify()`, and attaches decoded payload.

This allows the frontend to use Better Auth's built-in session management while supporting API clients that prefer JWT bearer tokens.

### 2. Session Percentage-Based Refresh
Instead of fixed-time refresh, the middleware calculates the remaining session lifetime as a percentage:

```typescript
const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
const timeRemaining = expiresAt.getTime() - now.getTime();
const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

if (percentRemaining < 20) {
  res.setHeader("X-Session-Refresh", "true");
  res.setHeader("X-Session-Expires-At", expiresAt.toISOString());
  res.setHeader("X-Time-Remaining", timeRemaining.toString());
}
```

The frontend Edge middleware reads these headers and proactively refreshes the session before expiration, preventing auth waterfalls on long-running SPA sessions.

### 3. Hierarchical RBAC with Project Scoping
The platform has TWO authorization layers:

- **System Roles** (`checkAuth`): SUPER_ADMIN > OWNER > ADMIN > MEMBER — controls access to platform features and company data
- **Project Roles** (`checkProjectRole`): PROJECT_MANAGER > SITE_MANAGER > SAFETY_OFFICER > SUBCONTRACTOR > WORKER — controls access to specific construction site data

Owners and Super Admins bypass project-level checks for oversight, while standard members must be explicitly assigned to projects with specific roles.

### 4. Stripe Webhook with Raw Body Parsing
The billing webhook requires raw body access for Stripe signature verification:

```typescript
app.post(
  "/api/v1/billing/webhook",
  express.raw({ type: "application/json" }),
  BillingController.handleStripeWebhook,
);
```

This is registered **BEFORE** `express.json()` middleware to preserve the raw payload. The controller uses `stripe.webhooks.constructEvent()` for cryptographic verification before processing the event.

### 5. Cloudinary Auto-Cleanup on Error
The global error handler inspects `req.file` and `req.files` on EVERY error and deletes uploaded Cloudinary assets:

```typescript
if (req.file) {
  await deleteFileFormCloudinary(req.file.path);
}
if (req.files && Array.isArray(req.files) && req.files.length > 0) {
  const imageUrls = req.files.map((file) => file.path);
  await Promise.all(imageUrls.map((url) => deleteFileFormCloudinary(url)));
}
```

This prevents orphaned images when validation fails, database constraints are violated, or business logic rejects the request after upload.

### 6. Zod + FormData for Multipart Validation
The `validateRequest` middleware handles the common pattern of JSON data embedded in `FormData`:

```typescript
if (req.body.data) {
  req.body = JSON.parse(req.body.data);
}
const parsedResult = zodSchema.safeParse(req.body);
```

This enables Zod validation on endpoints that also accept file uploads (incidents, daily reports) without requiring separate validation paths.

### 7. Domain-Driven Prisma Schema
The schema is split into 11 files rather than one monolithic file:

- `enums.prisma` — 18 domain enums (UserRole, ProjectStatus, TaskPriority, etc.)
- `auth.prisma` — Better Auth models (User, Session, Account, Verification)
- `company.prisma`, `project.prisma`, `task.prisma` — Core business entities
- `attendance.prisma`, `material.prisma`, `report.prisma`, `safety.prisma` — Operational modules
- `billing.prisma` — SaaS subscription models
- `invite.prisma` — Company invitation system

This organization makes schema changes reviewable by domain and reduces merge conflicts in team environments.

### 8. Strict Boot-Time Environment Validation
The `env.ts` module validates all 25+ required environment variables at server startup:

```typescript
requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      `Environment variable ${varName} is required but not set...`
    );
  }
});
```

The server refuses to start if ANY required variable is missing, preventing runtime crashes from undefined config values.

### 9. Graceful Shutdown with Signal Handlers
The server handles four termination scenarios:

- **SIGTERM** — Docker/container orchestration shutdown
- **SIGINT** — Ctrl+C manual shutdown
- **uncaughtException** — Synchronous runtime errors
- **unhandledRejection** — Async promise rejections

All handlers close the HTTP server before exiting, ensuring active requests complete.

---

## 🗺️ Roadmap

- [ ] **QueryBuilder Integration** — Add the custom QueryBuilder class for deep relational filtering, searching, and pagination across all list endpoints
- [ ] **Rate Limiting** — Integrate `express-rate-limit` on auth and billing endpoints
- [ ] **API Documentation** — OpenAPI/Swagger spec generation from Zod schemas
- [ ] **Testing Suite** — Jest + Supertest for controller and middleware coverage
- [ ] **Redis Caching** — Cache frequently accessed data (plans, company configs, dashboard metrics)
- [ ] **WebSockets** — Socket.io for real-time incident alerts and task updates
- [ ] **Audit Logging** — Immutable audit trail for all data mutations (who, what, when)
- [ ] **Soft Delete Recovery** — Admin interface for restoring soft-deleted records
- [ ] **Multi-Tenant Data Isolation Audit** — Ensure all queries include `companyId` filters
- [ ] **Background Jobs** — BullMQ queue for email sending, report generation, and Stripe sync

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**🏗️ Built for the crews that build the world**

Crafted by [Ishtiak Al Humaidi](https://github.com/ishtiakalhumaidi)

</div>
