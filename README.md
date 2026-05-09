# 📧 ColdMailSystem - Full-Stack Email Job Scheduler

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)

A robust, full-stack email job scheduling application designed to handle high-volume email campaigns reliably. Built with a modern tech stack and focusing on performance, rate-limiting, and fault tolerance.

---

## ✨ Key Features

- **Mass Email Scheduling**: Upload CSVs and schedule thousands of emails effortlessly.
- **Robust Queueing**: Powered by BullMQ and Redis for persistent, crash-resilient job processing.
- **Smart Rate Limiting**: Built-in support for hourly limits and strict delays between emails to protect SMTP reputation.
- **Real-Time Tracking**: Monitor scheduled, processing, and sent campaigns directly from the dashboard.
- **Google OAuth**: Secure authentication out-of-the-box.
- **Modern UI**: Smooth, responsive interface built with React, Tailwind CSS, and Framer Motion.

## 🛠️ Technologies Used

### Frontend
- **Framework**: React, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Routing**: React Router
- **Data Fetching**: Axios
- **CSV Parsing**: PapaParse

### Backend
- **Framework**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Message Queue**: BullMQ, Redis
- **Email Delivery**: Ethereal Email (SMTP for testing)

---

## 🏗️ Architecture Overview

### Persistence Strategy
All jobs created via the `/emails/schedule` API endpoint are immediately saved to the **PostgreSQL database**. Simultaneously, jobs are added to the **BullMQ Queue**. BullMQ is backed by **Redis**, which acts as a persistent layer for job state.

If the server restarts, BullMQ automatically reconnects to Redis and resumes processing delayed and active jobs from exactly where it left off. If the server crashes mid-job, BullMQ's automatic retry mechanism ensures the job is retried later.

### Rate Limiting & Concurrency
We support massive load safely using two distinct limits:
1. **Worker Concurrency**: Set via `WORKER_CONCURRENCY` in `.env`. This allows BullMQ to process `X` emails simultaneously in parallel.
2. **Hourly Rate Limiting**: Managed natively by BullMQ's `RateLimiter` on the Worker configuration (`limiter: { max: MAX_EMAILS_PER_HOUR, duration: 3600000 }`). If this limit is exceeded, BullMQ natively backs off and reschedules jobs to the next available window while preserving order.
3. **Delay Between Emails**: To enforce a strict `MIN_DELAY_BETWEEN_EMAILS` globally across concurrent workers, we utilize a custom Redis Lua Script. This atomic script ensures that no matter how many workers pull a job at the exact same millisecond, the absolute gap between emails being dispatched to the SMTP server is strictly maintained.

---

## 🚀 Setup Instructions

### 1. Start Infrastructure (Database & Redis)
Ensure you have Docker installed, then use the provided `docker-compose.yml` to spin up PostgreSQL and Redis:
```bash
docker-compose up -d
```

### 2. Configure Email Provider (Ethereal)
1. Visit [Ethereal.email](https://ethereal.email/) and click "Create Ethereal Account".
2. Note down the **username** and **password**. You will use these in your backend environment variables.

### 3. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file in the `backend` folder using the structure below:
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
3. Initialize the database with Prisma:
   ```bash
   npx prisma db push
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 4. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🎮 Usage Guide

1. **Access the App**: Navigate to `http://localhost:5173` in your browser.
2. **Authenticate**: Log in securely using Google OAuth.
3. **Compose Campaign**: Go to the "Dashboard" tab.
4. **Upload Data**: Attach a simple CSV file containing an `email` column.
5. **Schedule**: Click "Schedule Campaign".
6. **Monitor**: Navigate to the "Scheduled" or "Sent" tabs to track real-time progress.

---
*Built with ❤️ for reliable email delivery.*
