# ReachInbox Assignment - Full-Stack Email Job Scheduler

This repository contains the full-stack email job scheduler assignment. It uses React/Vite on the frontend and Node.js/Express on the backend with BullMQ and PostgreSQL for scheduling and persistence.

## Technologies Used
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Axios, React Router, PapaParse (CSV)
- **Backend**: Node.js, Express, TypeScript, Prisma (ORM), BullMQ
- **Infrastructure**: PostgreSQL, Redis, Ethereal Email (SMTP)

## Architecture Overview

### Persistence Strategy
All jobs created via the `/emails/schedule` API endpoint are immediately saved to the **PostgreSQL database**. Simultaneously, jobs are added to the **BullMQ Queue**. BullMQ is backed by **Redis**, which acts as a persistent layer for job state.

If the server restarts, BullMQ automatically reconnects to Redis and resumes processing delayed and active jobs from exactly where it left off. If the server crashes mid-job, BullMQ's automatic retry mechanism ensures the job is retried later.

### Rate Limiting & Concurrency
We support massive load safely using two distinct limits:
1. **Worker Concurrency**: Set via `WORKER_CONCURRENCY` in `.env`. This allows BullMQ to process `X` emails simultaneously in parallel.
2. **Hourly Rate Limiting**: Managed natively by BullMQ's `RateLimiter` on the Worker configuration (`limiter: { max: MAX_EMAILS_PER_HOUR, duration: 3600000 }`). If this limit is exceeded, BullMQ natively backs off and reschedules jobs to the next available window while preserving order.
3. **Delay Between Emails**: To enforce a strict `MIN_DELAY_BETWEEN_EMAILS` globally across concurrent workers, we utilize a custom Redis Lua Script. This atomic script ensures that no matter how many workers pull a job at the exact same millisecond, the absolute gap between emails being dispatched to the SMTP server is strictly maintained.

---

## Setup Instructions

### 1. Start Infrastructure (Database & Redis)
Use the provided `docker-compose.yml` to spin up PostgreSQL and Redis.
```bash
docker-compose up -d
```

### 2. Set up Ethereal Email
Visit [Ethereal.email](https://ethereal.email/) and click "Create Ethereal Account".
Take note of the username and password. You will use these in the backend `.env` file.

### 3. Backend Setup
1. Navigate to the `backend` directory.
```bash
cd backend
npm install
```
2. Create a `.env` file in the `backend` folder (or modify the existing one) with the following structure:
```env
PORT=5000
DATABASE_URL="postgresql://admin:password@localhost:5432/coldmail?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=supersecret123
ETHEREAL_USER=your_ethereal_email
ETHEREAL_PASS=your_ethereal_password
WORKER_CONCURRENCY=5
MAX_EMAILS_PER_HOUR=200
MIN_DELAY_BETWEEN_EMAILS=2000
FRONTEND_URL=http://localhost:5173
```
3. Push the Prisma Schema to your database:
```bash
npx prisma db push
```
4. Start the development server:
```bash
npm run dev
```

### 4. Frontend Setup
1. Navigate to the `frontend` directory.
```bash
cd frontend
npm install
```
2. Start the Vite development server:
```bash
npm run dev
```

### Testing the Application
1. Go to `http://localhost:5173`.
2. Login with Google OAuth.
3. Go to the "Dashboard" tab to compose your email. You can upload a simple CSV file with a header named `email`.
4. Click "Schedule Campaign".
5. Navigate to "Scheduled" or "Sent" tabs to see the emails processing in real-time.
