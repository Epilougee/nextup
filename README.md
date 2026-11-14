# QueueLess - Digital Queue & Token Management Web App

QueueLess is a rule-based digital queue and token management web application designed for college administration offices (Accounts, Examination Cell, Admissions, Library, Certificates). 

Built as a lightweight, reliable mid-semester project, it provides college students with live queue positions and wait-time estimates on their mobile browsers, gives office staff a streamlined queue console, and presents a public waiting-room display board.

---

## 1. Tech Stack & Architectural Decisions

- **Framework**: Next.js 14 (App Router) + JavaScript (Plain ES6+, no TypeScript, zero abstractions).
- **Database**: Supabase (PostgreSQL). Accessed **strictly server-side** (Server Route Handlers) via the Service Role Key. No client-side database connections exist.
- **Authentication**: Email + password with `bcryptjs` password hashing and signed HTTP cookies verified using `jose` JWTs. Roles: `student` and `admin` (office staff).
- **Real-Time Updates**: Client polling every 4 seconds with `setInterval`. Automatically pauses when the browser tab is hidden (`document.visibilityState === 'hidden'`) and resumes on focus.
  - *Why polling instead of WebSockets or SSE?* Vercel hosts code on short-lived serverless lambda functions that terminate after completing each request and cannot maintain persistent stateful TCP connections. WebSockets and Server-Sent Events (SSE) require persistent daemon processes or costly third-party socket relays, whereas lightweight HTTP polling with visibility pausing is reliable, cheap, and serverless-friendly.
- **Styling**: Single global CSS file (`app/globals.css`) with standard CSS variables. No Tailwind, no component libraries.
- **Charts**: Single Chart.js bar chart via `react-chartjs-2` showing hourly student volume.
- **Icons & Typography**: Font Awesome 6 icons and Inter font with tabular numerals (`tabular-nums`) for queue tokens and clocks.
- **Timezone**: Centralized Indian Standard Time (`Asia/Kolkata` - IST) in `lib/time.js` to ensure consistent daily date resets and hourly distributions on Vercel's UTC runtime.

---

## 2. Entity-Relationship (ER) Diagram

```text
+--------------------------------------------------------------------------------+
|                                    USERS                                       |
+--------------------------------------------------------------------------------+
| id             : UUID (PK, gen_random_uuid())                                 |
| name           : TEXT NOT NULL                                                 |
| email          : TEXT UNIQUE NOT NULL                                          |
| password_hash  : TEXT NOT NULL (bcrypt)                                        |
| role           : TEXT NOT NULL CHECK (role IN ('student', 'admin'))           |
| created_at     : TIMESTAMPTZ NOT NULL DEFAULT NOW()                            |
+--------------------------------------------------------------------------------+
                                       |
             +-------------------------+-------------------------+
             | 1:N (Student)                                     | 1:N (Served By Staff)
             v                                                   v
+--------------------------------------+       +---------------------------------+
|              SERVICES                |       |             TOKENS              |
+--------------------------------------+       +---------------------------------+
| id                  : UUID (PK)      |       | id           : UUID (PK)        |
| name                : TEXT NOT NULL  |       | service_id   : UUID (FK Services|
| prefix              : VARCHAR(10) UQ |<--+   | student_id   : UUID (FK Users)  |
| avg_minutes_default : INT DEFAULT 8  |   |   | token_date   : DATE NOT NULL    |
| open_time           : TIME DEFAULT 10|   |   | token_no     : INT NOT NULL     |
| close_time          : TIME DEFAULT 16|   |   | purpose      : TEXT             |
| is_open             : BOOL DEFAULT T |   |   | status       : TEXT (waiting,   |
| max_tokens_per_day  : INT DEFAULT 100|   |   |                serving,         |
| created_at          : TIMESTAMPTZ    |   |   |                completed,       |
+--------------------------------------+   |   |                no_show,         |
                                           |   |                cancelled)       |
                                           +---| created_at   : TIMESTAMPTZ      |
                                               | called_at    : TIMESTAMPTZ      |
                                               | completed_at : TIMESTAMPTZ      |
                                               | served_by    : UUID (FK Users)  |
                                               +---------------------------------+
                                               | CONSTRAINT: UNIQUE              |
                                               | (service_id, token_date,        |
                                               |  token_no)                      |
                                               +---------------------------------+
```

---

## 3. Queue & Wait-Time Logic (6 Lines)

1. **Token Formatting**: Each token combines office prefix and daily sequence (e.g., prefix `ACC` and number `14` becomes `ACC-014`).
2. **Next Number & Reset**: Daily sequence starts at 1 each IST morning; new tokens take `max(token_no) + 1` for that service today.
3. **Queue Eligibility**: Rejects request if office is toggled closed, outside operating hours, daily cap is reached, or student already holds an active token.
4. **FIFO Queue Position**: Waiting tokens are sorted by `created_at` timestamp; position 1 is the next student to be called.
5. **Dynamic Average Time**: Averages `(completed_at - called_at)` across the last 10 completed tokens today; falls back to service default if fewer than 3 exist.
6. **Estimated Wait Calculation**: Multiplies `position * avgMinutes` and rounds up to the nearest 5-minute interval (minimum 5 minutes).

---

## 4. Local Setup Guide

### Prerequisites
- Node.js 18.17+ or 20+ installed.
- A free Supabase account with an empty project.

### Step 1: Clone and Install
```bash
cd "u:/data analyst/ali"
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials in `.env.local`:
```ini
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SESSION_SECRET=queueless-college-queue-jwt-secret-key-32chars
```
*(Find `SUPABASE_SERVICE_KEY` under Supabase Dashboard -> Project Settings -> API -> `service_role` secret).*

### Step 3: Run Database Schema
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Open the file `db/schema.sql` in this repo.
3. Paste its contents and click **Run**. It creates the `users`, `services`, and `tokens` tables with all constraints and performance indexes.

### Step 4: Seed Demo Data
Populate realistic Indian student profiles, 5 offices (one closed to test rejection logic), multi-status tokens for today, and 7 days of historical tokens:
```bash
npm run seed
```

### Step 5: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Demo Logins

| Role | Email | Password | What You Can Test |
| :--- | :--- | :--- | :--- |
| **College Staff / Admin** | `admin@demo.com` | `demo123` | Call next token, complete desk visit, mark no-show, recall, edit office hours, view hourly peak analytics chart. |
| **Student** | `student1@demo.com` | `demo123` | Has active token `ACC-005` (#1 in line). View live position, wait estimate, vibration/alert banner, cancel token, get tokens for other offices. |

*Tip: The login page includes 1-click credential buttons for both demo accounts.*

---

## 6. Vercel Deployment Steps

1. Push this repository to GitHub or GitLab.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your `QueueLess` repository.
4. Under **Environment Variables**, add the three production values:
   - `SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role secret.
   - `SESSION_SECRET`: A secure random secret string (32+ chars).
5. Click **Deploy**. Vercel will execute `npm run build` and launch the app serverlessly.

---

## 7. Viva Questions & Model Answers

### Q1: Why did you choose HTTP polling instead of WebSockets or Server-Sent Events (SSE)?
> **Answer**: Vercel runs on a serverless architecture where backend compute executes inside ephemeral stateless containers. These containers terminate immediately after returning an HTTP response and cannot maintain persistent stateful TCP socket connections. WebSockets or SSE would either fail or require costly third-party persistent socket services. HTTP polling every 4 seconds—combined with pausing when the browser tab is hidden (`document.visibilityState`)—is lightweight, resilient to network drops, serverless-native, and virtually cost-free.

### Q2: How do you prevent two students from getting the same token number if they tap "Get Token" at the exact same millisecond?
> **Answer**: We use a two-tier safeguard. First, the database enforces a strict PostgreSQL composite constraint: `UNIQUE (service_id, token_date, token_no)`. Second, in `app/api/student/tokens/route.js`, the token insertion logic runs inside a 3-attempt retry loop. If a concurrent collision occurs, PostgreSQL throws error code `23505` (unique violation); the server catches this, recalculates `max(token_no) + 1`, and re-inserts without failing the user's request.

### Q3: How is the estimated wait time calculated?
> **Answer**: Wait time calculation is completely rule-based and adaptive. In `lib/queueEngine.js`, `averageServiceMinutes` inspects the last 10 completed tokens for that office today and computes the average duration of `(completed_at - called_at)`. If fewer than 3 tokens have been completed today, it falls back to the office's configured default (e.g. 8 minutes). The function `estimateWaitMinutes` then multiplies `position * avgMinutes` and rounds up to the nearest 5-minute block.

### Q4: Why is timezone handled explicitly in `lib/time.js`?
> **Answer**: Vercel and serverless containers run in UTC (`Etc/UTC`). In Indian colleges operating under Indian Standard Time (IST, UTC+5:30), a token taken at 10:00 AM IST on November 15 would be evaluated at 04:30 AM UTC. If we used standard `new Date()`, daily resets at midnight would occur at 5:30 AM IST rather than 12:00 AM midnight IST. `lib/time.js` anchors all "today" queries and hourly analytics strictly to `Asia/Kolkata`.

### Q5: How are passwords and user sessions secured?
> **Answer**: Passwords are never stored in plaintext; they are hashed using `bcryptjs` with 10 salt rounds before hitting PostgreSQL. On sign-in, authentication state is encapsulated in a tamper-proof JWT signed with HMAC-SHA256 via the `jose` library and transmitted via an `HttpOnly`, `SameSite=Lax`, `Secure` cookie. Client-side JavaScript cannot read the session cookie, protecting against Cross-Site Scripting (XSS).

### Q6: Can a student jump ahead in line or take multiple tokens for the same office?
> **Answer**: No. In `lib/queueEngine.js`, the pure function `canTakeToken` runs prior to issuing any token. It scans active tokens today and rejects the request if the student already holds a `waiting` or `serving` token for that specific office. Queue order is strictly First-In, First-Out (FIFO) ordered by `created_at` timestamp.

### Q7: Why is Supabase accessed only from server code using the Service Role Key?
> **Answer**: By restricting database queries to Next.js server route handlers, the database credentials and schema structure are never exposed to the client bundle. This allows server-side validation of all business logic (such as office operating hours and eligibility) before touching the database, eliminating the risk of client-side data tampering.

### Q8: What happens when office staff clicks "Skip (No-Show)"? Can that student return later?
> **Answer**: Skipping marks the active token's status as `no_show` in the database, records the timestamp, and clears the counter desk so staff can call the next student. A no-show student is not penalized permanently; once marked `no_show`, `canTakeToken` no longer sees an active waiting token, allowing the student to take a fresh token if they return to campus later in the day.
