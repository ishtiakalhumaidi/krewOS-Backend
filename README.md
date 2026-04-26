# KrewOS Backend API

The robust, scalable Node.js backend powering **KrewOS** — the ultimate operating system for modern construction teams. It handles multi-tenant workspace management, role-based access control, Stripe subscription billing, safety incident reporting, and timesheet aggregation.

---

## 🚀 Tech Stack

- **Framework:** Node.js + Express.js (TypeScript)
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL (Recommended)
- **Validation:** Zod
- **Payments:** Stripe API & Webhooks
- **File Uploads:** Multer (Configured for Incident Reports)
- **Architecture:** Modular MVC (Controller, Service, Route patterns)

---

## 🌟 Core Features

- **Multi-Tenant Workspaces**  
  Isolated data for different construction companies.

- **Advanced Query Builder**  
  Custom `QueryBuilder` class supporting deep relational searching, filtering, and pagination.

- **Stripe Billing Engine**  
  Bulletproof webhook handling for upgrades, downgrades, and cancellations with deadlock prevention.

- **Role-Based Access Control (RBAC)**  
  Distinct permissions for `SUPER_ADMIN`, `OWNER`, `ADMIN`, and `MEMBER`.

- **Timesheet Aggregation**  
  Automatically calculates total hours and estimated payroll across date ranges.

---

## 🛠️ Prerequisites

- Node.js (v18+)
- PostgreSQL installed and running
- Stripe account (for testing billing)

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=https://krew-os.vercel.app/

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/krewos?schema=public"

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
````

***

## 📦 Installation & Setup

1.  **Install dependencies**

```bash
npm install
```

2.  **Generate Prisma Client**

```bash
npx prisma generate
```

3.  **Push Database Schema**

```bash
npx prisma db push
```

4.  **Seed the Database (Optional but recommended for Plans)**

```bash
npm run seed
```

***

## 🚀 Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

***

## 💳 Stripe Webhook Setup

To test local subscriptions, forward Stripe webhooks to your local server using the Stripe CLI:

```bash
stripe listen --forward-to localhost:5000/api/v1/billing/webhook
```

```
```
