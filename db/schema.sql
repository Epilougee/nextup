-- ============================================================================
-- NextUp - Database Schema for Supabase (PostgreSQL)
-- Mid-Semester Project: Digital Queue, Token Management & Instant Digital Document Issuance
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if re-running (order respects foreign key dependencies)
DROP TABLE IF EXISTS digital_documents CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. Users Table
-- Stores registered students and office administration staff (admins).
-- Passwords are encrypted using bcryptjs on the server before storage.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Services (Departments / Offices) Table
-- Represents college offices (Accounts Office, Examination Cell, Admissions, Library, Certificates).
-- Includes operating hours, capacity limits, and active toggle status.
-- ----------------------------------------------------------------------------
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    prefix VARCHAR(10) NOT NULL UNIQUE,
    avg_minutes_default INTEGER NOT NULL DEFAULT 8,
    open_time TIME NOT NULL DEFAULT '10:00:00',
    close_time TIME NOT NULL DEFAULT '16:00:00',
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    max_tokens_per_day INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. Tokens (Physical In-Person Counter Visits) Table
-- Tracks token lifecycle for matters requiring physical desk presence:
-- waiting -> serving -> completed / no_show / cancelled.
-- Enforces UNIQUE (service_id, token_date, token_no) so token numbers reset daily.
-- ----------------------------------------------------------------------------
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_date DATE NOT NULL,
    token_no INTEGER NOT NULL,
    purpose TEXT,
    status TEXT NOT NULL CHECK (status IN ('waiting', 'serving', 'completed', 'no_show', 'cancelled')) DEFAULT 'waiting',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    served_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_service_token_per_day UNIQUE (service_id, token_date, token_no)
);

-- ----------------------------------------------------------------------------
-- 4. Digital Documents (Instant Online Issuance) Table
-- When a request is digital, it is digitally generated and issued immediately.
-- The student downloads/prints the verified credential; NO office visit required.
-- ----------------------------------------------------------------------------
CREATE TABLE digital_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    doc_title TEXT NOT NULL,
    reference_no TEXT UNIQUE NOT NULL,
    purpose TEXT,
    metadata JSONB,
    status TEXT NOT NULL DEFAULT 'issued',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Indexes for performance
-- High-frequency queries: daily office queue lookups, student token status, digital docs
-- ----------------------------------------------------------------------------
CREATE INDEX idx_tokens_service_date_status ON tokens (service_id, token_date, status);
CREATE INDEX idx_tokens_student_date ON tokens (student_id, token_date);
CREATE INDEX idx_tokens_token_date ON tokens (token_date);
CREATE INDEX idx_services_is_open ON services (is_open);
CREATE INDEX idx_digital_docs_student ON digital_documents (student_id);
CREATE INDEX idx_digital_docs_ref ON digital_documents (reference_no);
