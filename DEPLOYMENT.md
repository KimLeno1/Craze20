# Deployment & Production Guide for Closet Kraze

This document outlines the architecture, configuration, and deployment procedures for the **Closet Kraze** high-velocity fashion platform.

## 1. Stack Overview

- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** Express.js (serving as a unified API & asset server)
- **Database:** SQLite3 (Local persistence)
- **Integration:** Paystack (Payments & Withdrawals)
- **Runtime:** Node.js v22+

## 2. Infrastructure Requirements

- **Server:** Minimum 2GB RAM / 1 vCPU (recommended for image processing & high concurrency).
- **Storage:** Persistent storage volume for the SQLite database and uploaded assets.
- **SSL:** Mandatory for Paystack production hooks and secure authenticated sessions.

## 3. Configuration (Environment Variables)

Ensure the following variables are defined in your production environment (e.g., via `.env` or CI/CD secrets):

### Security
- `JWT_SECRET`: High-entropy string for session signature.
- `REFRESH_SECRET`: Separate high-entropy string for token rotation.

### Payments (Paystack)
- `PAYSTACK_SECRET`: Your live secret key (starts with `sk_live_`).
- `VITE_PAYSTACK_PUBLIC_KEY`: Your live public key (starts with `pk_live_`).

### Server
- `PORT`: Defaults to 3000 (standard for this container).
- `NODE_ENV`: Set to `production`.

## 4. Deployment Workflow

### Step 1: Pre-flight Build
```bash
npm install
npm run build
```
This optimizes frontend assets into `/dist` and prepares the server.

### Step 2: Database Initialization
On the first run, the system will automatically create `database.sqlite` and initialize the schema. Ensure the process has **Full Read/Write** permissions to the root directory.

### Step 3: Persistence Management
If deploying to a containerized environment (e.g., Docker, Cloud Run), you **MUST** mount a persistent volume at the root or wherever `database.sqlite` is stored to prevent data loss on container restart.

### Step 4: Execution
Use a process manager like **PM2** to ensure the app stays alive:
```bash
pm2 start npm --name "closet-kraze" -- start
```

## 5. Paystack Integration Notes

- **Withdrawals:** Requires `PAYSTACK_SECRET`. If the bank transfer fails on Paystack's end, the system logs the transaction as `PENDING` for manual intervention in the Admin Panel.
- **Webhooks:** For production reconciliation, ensure you set your Paystack Webhook URL to `https://yourdomain.com/api/paystack/webhook`.

## 6. Scaling & Optimization

- **Image Compression:** Currently handled via client-side processing before upload to save bandwidth and storage.
- **Loading Performance:** Implemented Skeleton screens (Loading Indicators) across all high-latency data components (Lobby, Profile, Admin).
- **SQLite Optimization:** For very high traffic (>10k DAU), consider migrating to PostgreSQL. The `databaseService` is abstracted to facilitate this migration.

## 7. Security Best Practices

1. **Keep Secrets Secret:** Never commit `.env` files.
2. **Rate Limiting:** Implement Express rate limiting for auth endpoints (already partially in place).
3. **Database Backups:** Regularly backup `database.sqlite`.

---
*Closet Kraze Deployment Protocol v2.1*
