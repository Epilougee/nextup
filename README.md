# NextUp - Digital Queue, Token Management & Instant Document Portal

**Live GitHub Repository**: [https://github.com/Epilougee/queueless](https://github.com/Epilougee/queueless)

NextUp is an institutional digital queue, token management, and instant digital document issuance web application designed for college administration offices (Accounts, Examination Cell, Admissions, Library, Certificates).

Built with a soothing, modern Slate & Pure White design, it provides students with:
1. **Instant Digital Document Portal (No Office Visit Needed)**: Apply directly online for verified institutional documents (Bonafide certificates, fee receipts, grade transcripts, no-dues e-slips). Documents are generated instantly with official digital registrar seals and security verification hashes.
2. **Physical Counter Desk Tokens**: When an in-person physical visit is strictly required (original degree parchment collection, caution deposit cheques, branch transfer approvals, physical transcript embossing), students take a live token to see their real-time position and estimated wait time.
3. **Office Queue Console**: Staff desks call next, complete, skip (no-show), or recall students.
4. **Public TV Board**: Airport/transit-grade digital signage board with live IST wall clock and active counter calls.

---

## 1. Tech Stack & Architectural Decisions

- **Framework**: Next.js 14 (App Router) + JavaScript (Plain ES6+, no TypeScript, zero abstractions).
- **Database**: Supabase (PostgreSQL). Accessed **strictly server-side** (Server Route Handlers) via the Service Role Key. Includes a zero-setup in-memory fallback store for instantaneous local testing.
- **Authentication**: Email + password with `bcryptjs` password hashing and signed HTTP cookies verified using `jose` JWTs. Roles: `student` and `admin` (office staff).
- **Theme**: Soothing, modern Slate (`#F8FAFC`, `#0F172A`, `#E2E8F0`) with Emerald Green for digital verified credentials and Indigo for queue tokens. Zero eye-strain.
- **Real-Time Updates**: Client polling every 4 seconds with `setInterval`. Automatically pauses when the browser tab is hidden (`document.visibilityState === 'hidden'`) and resumes on focus.
  - *Why polling instead of WebSockets or SSE?* Vercel hosts code on short-lived serverless lambda functions that terminate after completing each request and cannot maintain persistent stateful TCP connections. WebSockets and Server-Sent Events (SSE) require persistent daemon processes or costly third-party socket relays, whereas lightweight HTTP polling with visibility pausing is reliable, cheap, and serverless-friendly.
- **Charts**: Single Chart.js bar chart via `react-chartjs-2` showing hourly student volume.
- **Icons & Typography**: Font Awesome 6 icons and Inter font with tabular numerals (`tabular-nums`) for queue tokens and clocks.
- **Timezone**: Centralized Indian Standard Time (`Asia/Kolkata` - IST) in `lib/time.js` to ensure consistent daily date resets and hourly distributions on Vercel's UTC runtime.

---

## 2. Department Catalog & Delivery Classification

| Department | Digital Issuance (No Office Visit Needed) | Physical Visit (Counter Token Required) |
| :--- | :--- | :--- |
| **Accounts Office (ACC)** | Semester Fee Payment Receipt, Tuition Fee Structure Letter | Hostel Caution Deposit Refund, Late Fee Fine Exemption |
| **Examination Cell (EXM)** | Provisional Semester Grade Transcript, Backlog Clearance Certificate | Degree & Convocation Parchment Collection, Evaluated Answer Script Review |
| **Admissions Office (ADM)** | College Bonafide Student Certificate, Medium of Instruction Letter | Original 10th/12th Certificates Verification, Branch Transfer Allocation |
| **Central Library (LIB)** | Library No-Dues Clearance E-Certificate, IEEE & E-Library Access Voucher | Physical Book Return & Overdue Fine Settlement, RFID Smart Card Issuance |
| **Certificates (CRT)** | Course Completion Letter, Character & Conduct Certificate | Embossed Physical Transcripts & Sealed Envelope Stamp |

---

## 3. Entity-Relationship (ER) Diagram

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
             |                                                   |
             | 1:N (Student)                                     | 1:N (Issued Digital Docs)
             v                                                   v
+--------------------------------------+       +---------------------------------+
|              SERVICES                |       |        DIGITAL_DOCUMENTS        |
+--------------------------------------+       +---------------------------------+
| id                  : UUID (PK)      |       | id           : UUID (PK)        |
| name                : TEXT NOT NULL  |<--+   | student_id   : UUID (FK Users)  |
| prefix              : VARCHAR(10) UQ |   |   | service_id   : UUID (FK Serv)   |
| avg_minutes_default : INT DEFAULT 8  |   |   | doc_type     : TEXT             |
| open_time           : TIME DEFAULT 10|   |   | doc_title    : TEXT             |
| close_time          : TIME DEFAULT 16|   |   | reference_no : TEXT UNIQUE      |
| is_open             : BOOL DEFAULT T |   |   | purpose      : TEXT             |
| max_tokens_per_day  : INT DEFAULT 100|   |   | metadata     : JSONB            |
| created_at          : TIMESTAMPTZ    |   |   | status       : TEXT ('issued')  |
+--------------------------------------+   |   | issued_at    : TIMESTAMPTZ      |
             |                             |   +---------------------------------+
             | 1:N (Queue Tokens)          |
             v                             |
+------------------------------------------+
|                 TOKENS                   |
+------------------------------------------+
| id           : UUID (PK)                 |
| service_id   : UUID (FK Services)        |
| student_id   : UUID (FK Users)           |
| token_date   : DATE NOT NULL             |
| token_no     : INT NOT NULL              |
| purpose      : TEXT                      |
| status       : TEXT (waiting, serving,   |
|                completed, no_show,       |
|                cancelled)                |
| created_at   : TIMESTAMPTZ               |
| called_at    : TIMESTAMPTZ               |
| completed_at : TIMESTAMPTZ               |
| served_by    : UUID (FK Users)           |
+------------------------------------------+
| CONSTRAINT: UNIQUE                       |
| (service_id, token_date, token_no)       |
+------------------------------------------+
```

---

## 4. Local Setup & Quick Start

```bash
git clone https://github.com/Epilougee/queueless.git
cd queueless
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Logins (1-Click Fill on Login Page):
- **Student**: `student1@demo.com` / `demo123` (Aarav Patel — has active token `ACC-005` and issued digital documents).
- **Staff / Admin**: `admin@demo.com` / `demo123` (Dr. Rajesh Sharma — Queue Console desk).

---

## 5. Vercel Deployment Steps

1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Select your repository `Epilougee/queueless`.
3. Add environment variables:
   - `SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role secret.
   - `SESSION_SECRET`: A secure random secret string (32+ chars).
4. Click **Deploy**.
