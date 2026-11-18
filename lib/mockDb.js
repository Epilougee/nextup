// ============================================================================
// lib/mockDb.js
// In-Memory Database Fallback for NextUp.
// Automatically activates when SUPABASE_URL is not set or placeholder.
// Allows instantaneous zero-config local testing and presentation to judges.
// ============================================================================

import { getTodayISTDateString, getPastISTDateString } from './time.js';

// Pre-computed bcrypt hash for 'demo123'
const DEMO_PASSWORD_HASH = '$2a$10$6jDxGbvpV0SVgwGRSh.gmuz4IPlY.iRMZr1MVk4IQAKvZnddIpksO';

// Initial Users
const initialUsers = [
  {
    id: 'u-admin-1',
    name: 'Dr. Rajesh Sharma (Dean Office)',
    email: 'admin@demo.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'admin',
    created_at: '2026-11-01T09:00:00+05:30',
  },
  {
    id: 'u-student-1',
    name: 'Aarav Patel',
    email: 'student1@demo.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'student',
    created_at: '2026-11-01T09:00:00+05:30',
  },
  { id: 'u-student-2', name: 'Diya Sharma', email: 'student2@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-3', name: 'Rohan Verma', email: 'student3@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-4', name: 'Ananya Iyer', email: 'student4@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-5', name: 'Kabir Mehta', email: 'student5@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-6', name: 'Saanvi Nair', email: 'student6@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-7', name: 'Ishaan Gupta', email: 'student7@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-8', name: 'Meera Joshi', email: 'student8@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-9', name: 'Arjun Rao', email: 'student9@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-10', name: 'Pooja Kulkarni', email: 'student10@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-11', name: 'Aditya Deshmukh', email: 'student11@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-12', name: 'Tanvi Bhatia', email: 'student12@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-13', name: 'Vivaan Malhotra', email: 'student13@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-14', name: 'Rhea Choudhury', email: 'student14@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
  { id: 'u-student-15', name: 'Karan Singh', email: 'student15@demo.com', password_hash: DEMO_PASSWORD_HASH, role: 'student', created_at: '2026-11-01T09:00:00+05:30' },
];

// Initial Services
const initialServices = [
  {
    id: 's-acc',
    name: 'Accounts Office',
    prefix: 'ACC',
    avg_minutes_default: 8,
    open_time: '10:00:00',
    close_time: '16:00:00',
    is_open: true,
    max_tokens_per_day: 100,
    created_at: '2026-11-01T09:00:00+05:30',
  },
  {
    id: 's-exm',
    name: 'Examination Cell',
    prefix: 'EXM',
    avg_minutes_default: 6,
    open_time: '10:00:00',
    close_time: '16:00:00',
    is_open: true,
    max_tokens_per_day: 120,
    created_at: '2026-11-01T09:00:00+05:30',
  },
  {
    id: 's-adm',
    name: 'Admissions Office',
    prefix: 'ADM',
    avg_minutes_default: 10,
    open_time: '10:00:00',
    close_time: '16:00:00',
    is_open: true,
    max_tokens_per_day: 80,
    created_at: '2026-11-01T09:00:00+05:30',
  },
  {
    id: 's-lib',
    name: 'Central Library Counter',
    prefix: 'LIB',
    avg_minutes_default: 5,
    open_time: '09:30:00',
    close_time: '17:00:00',
    is_open: true,
    max_tokens_per_day: 150,
    created_at: '2026-11-01T09:00:00+05:30',
  },
  {
    id: 's-crt',
    name: 'Certificates & Transcripts',
    prefix: 'CRT',
    avg_minutes_default: 7,
    open_time: '10:00:00',
    close_time: '15:30:00',
    is_open: false, // Closed state demonstration!
    max_tokens_per_day: 60,
    created_at: '2026-11-01T09:00:00+05:30',
  },
];

// Initialize in-memory state
// Stored on globalThis to persist across hot reloads in development
if (!globalThis.__nextup_mock_db) {
  const todayStr = getTodayISTDateString();
  const initialTokens = [];

  // Today's Accounts Office tokens
  initialTokens.push(
    {
      id: 't-today-1',
      service_id: 's-acc',
      student_id: 'u-student-2',
      token_date: todayStr,
      token_no: 1,
      purpose: 'Semester Tuition Fee Receipt',
      status: 'completed',
      created_at: `${todayStr}T09:45:00+05:30`,
      called_at: `${todayStr}T10:02:00+05:30`,
      completed_at: `${todayStr}T10:10:00+05:30`,
      served_by: 'u-admin-1',
    },
    {
      id: 't-today-2',
      service_id: 's-acc',
      student_id: 'u-student-3',
      token_date: todayStr,
      token_no: 2,
      purpose: 'Hostel Security Deposit Refund',
      status: 'completed',
      created_at: `${todayStr}T09:50:00+05:30`,
      called_at: `${todayStr}T10:11:00+05:30`,
      completed_at: `${todayStr}T10:19:00+05:30`,
      served_by: 'u-admin-1',
    },
    {
      id: 't-today-3',
      service_id: 's-acc',
      student_id: 'u-student-4',
      token_date: todayStr,
      token_no: 3,
      purpose: 'Bus Pass Fee Verification',
      status: 'completed',
      created_at: `${todayStr}T10:00:00+05:30`,
      called_at: `${todayStr}T10:20:00+05:30`,
      completed_at: `${todayStr}T10:27:00+05:30`,
      served_by: 'u-admin-1',
    },
    {
      id: 't-today-4',
      service_id: 's-acc',
      student_id: 'u-student-5',
      token_date: todayStr,
      token_no: 4,
      purpose: 'Fee Concession Application',
      status: 'serving',
      created_at: `${todayStr}T10:05:00+05:30`,
      called_at: `${todayStr}T10:28:00+05:30`,
      served_by: 'u-admin-1',
    },
    {
      // Student 1 (Aarav Patel) is Next in line!
      id: 't-today-5',
      service_id: 's-acc',
      student_id: 'u-student-1',
      token_date: todayStr,
      token_no: 5,
      purpose: 'Bonafide Certificate Fee Slip',
      status: 'waiting',
      created_at: `${todayStr}T10:15:00+05:30`,
    },
    {
      id: 't-today-6',
      service_id: 's-acc',
      student_id: 'u-student-6',
      token_date: todayStr,
      token_no: 6,
      purpose: 'Late Fine Exemption Request',
      status: 'waiting',
      created_at: `${todayStr}T10:18:00+05:30`,
    },
    {
      id: 't-today-7',
      service_id: 's-acc',
      student_id: 'u-student-7',
      token_date: todayStr,
      token_no: 7,
      purpose: 'Lab Dues Clearance',
      status: 'waiting',
      created_at: `${todayStr}T10:22:00+05:30`,
    },
    {
      id: 't-today-8',
      service_id: 's-acc',
      student_id: 'u-student-8',
      token_date: todayStr,
      token_no: 8,
      purpose: 'Scholarship Disbursal Query',
      status: 'waiting',
      created_at: `${todayStr}T10:25:00+05:30`,
    },
    {
      id: 't-today-9',
      service_id: 's-acc',
      student_id: 'u-student-9',
      token_date: todayStr,
      token_no: 9,
      purpose: 'Exam Fee Late Submission',
      status: 'no_show',
      created_at: `${todayStr}T09:40:00+05:30`,
      called_at: `${todayStr}T10:00:00+05:30`,
      served_by: 'u-admin-1',
    },
    {
      id: 't-today-10',
      service_id: 's-acc',
      student_id: 'u-student-10',
      token_date: todayStr,
      token_no: 10,
      purpose: 'Duplicate ID Card Fine',
      status: 'cancelled',
      created_at: `${todayStr}T09:55:00+05:30`,
    }
  );

  // Today's Examination Cell tokens
  initialTokens.push(
    {
      id: 't-today-11',
      service_id: 's-exm',
      student_id: 'u-student-11',
      token_date: todayStr,
      token_no: 1,
      purpose: 'Backlog Exam Form Verification',
      status: 'completed',
      created_at: `${todayStr}T10:00:00+05:30`,
      called_at: `${todayStr}T10:08:00+05:30`,
      completed_at: `${todayStr}T10:15:00+05:30`,
      served_by: 'u-admin-1',
    },
    {
      id: 't-today-12',
      service_id: 's-exm',
      student_id: 'u-student-12',
      token_date: todayStr,
      token_no: 2,
      purpose: 'Revaluation Form Submission',
      status: 'serving',
      created_at: `${todayStr}T10:05:00+05:30`,
      called_at: `${todayStr}T10:16:00+05:30`,
      served_by: 'u-admin-1',
    },
    {
      id: 't-today-13',
      service_id: 's-exm',
      student_id: 'u-student-13',
      token_date: todayStr,
      token_no: 3,
      purpose: 'Grade Card Correction',
      status: 'waiting',
      created_at: `${todayStr}T10:12:00+05:30`,
    }
  );

  // Today's Admissions & Library tokens
  initialTokens.push(
    {
      id: 't-today-14',
      service_id: 's-adm',
      student_id: 'u-student-14',
      token_date: todayStr,
      token_no: 1,
      purpose: 'Branch Transfer Eligibility Check',
      status: 'serving',
      created_at: `${todayStr}T10:10:00+05:30`,
      called_at: `${todayStr}T10:25:00+05:30`,
      served_by: 'u-admin-1',
    },
    {
      id: 't-today-15',
      service_id: 's-adm',
      student_id: 'u-student-15',
      token_date: todayStr,
      token_no: 2,
      purpose: 'Original Document Verification',
      status: 'waiting',
      created_at: `${todayStr}T10:18:00+05:30`,
    },
    {
      id: 't-today-16',
      service_id: 's-lib',
      student_id: 'u-student-2',
      token_date: todayStr,
      token_no: 1,
      purpose: 'Book Return & Clearance Slip',
      status: 'completed',
      created_at: `${todayStr}T09:40:00+05:30`,
      called_at: `${todayStr}T09:45:00+05:30`,
      completed_at: `${todayStr}T09:50:00+05:30`,
      served_by: 'u-admin-1',
    }
  );

  // 7 Days of Historical Tokens for Analytics with 11 AM Peak
  const pastPurposes = [
    'Document Verification',
    'Fee Receipt Verification',
    'No Dues Certificate',
    'Duplicate Hall Ticket',
    'Grade Sheet Collection',
  ];

  for (let daysAgo = 1; daysAgo <= 7; daysAgo++) {
    const pastDateStr = getPastISTDateString(daysAgo);
    const hourlyCountsConfig = [
      { hour: 9, count: 3 },
      { hour: 10, count: 6 },
      { hour: 11, count: 16 }, // Peak!
      { hour: 12, count: 7 },
      { hour: 13, count: 3 },
      { hour: 14, count: 5 },
      { hour: 15, count: 4 },
    ];

    let seq = 1;
    for (const slot of hourlyCountsConfig) {
      for (let i = 0; i < slot.count; i++) {
        const sIndex = (seq + i) % initialUsers.length;
        const targetService = initialServices[seq % 4];
        const minOffset = Math.floor((i * 55) / slot.count);
        const mm = String(minOffset).padStart(2, '0');
        const hh = String(slot.hour).padStart(2, '0');

        const createdTime = `${pastDateStr}T${hh}:${mm}:00+05:30`;
        const calledTime = `${pastDateStr}T${hh}:${String(Math.min(58, minOffset + 3)).padStart(2, '0')}:00+05:30`;
        const completedTime = `${pastDateStr}T${hh}:${String(Math.min(59, minOffset + 9)).padStart(2, '0')}:00+05:30`;

        const isNoShow = (seq + slot.hour) % 8 === 0;

        initialTokens.push({
          id: `t-hist-${daysAgo}-${seq}`,
          service_id: targetService.id,
          student_id: initialUsers[sIndex].id,
          token_date: pastDateStr,
          token_no: seq++,
          purpose: pastPurposes[(seq + i) % pastPurposes.length],
          status: isNoShow ? 'no_show' : 'completed',
          created_at: createdTime,
          called_at: calledTime,
          completed_at: isNoShow ? null : completedTime,
          served_by: 'u-admin-1',
        });
      }
    }
  }

  // Initial Demo Digital Documents for Aarav Patel (student1)
  const initialDigitalDocs = [
    {
      id: 'doc-demo-1',
      student_id: 'u-student-1',
      service_id: 's-adm',
      doc_type: 'adm-bonafide-cert',
      doc_title: 'College Bonafide Student Certificate',
      reference_no: 'NITM-BON-2026-8941',
      purpose: 'Passport & Visa Application',
      metadata: {
        student_name: 'Aarav Patel',
        roll_no: 'NITM-2023-CS-042',
        branch: 'Computer Science & Engineering',
        semester: 'Semester V',
        academic_year: '2026-2027',
      },
      status: 'issued',
      issued_at: `${todayStr}T09:30:00+05:30`,
    },
    {
      id: 'doc-demo-2',
      student_id: 'u-student-1',
      service_id: 's-acc',
      doc_type: 'acc-fee-receipt',
      doc_title: 'Semester Fee Payment Receipt',
      reference_no: 'NITM-ACC-2026-3190',
      purpose: 'Tuition Fee Record & Education Loan',
      metadata: {
        student_name: 'Aarav Patel',
        roll_no: 'NITM-2023-CS-042',
        branch: 'Computer Science & Engineering',
        amount_paid: '₹68,500',
        payment_mode: 'NetBanking / UPI',
        academic_year: '2026-2027',
      },
      status: 'issued',
      issued_at: `${todayStr}T10:15:00+05:30`,
    },
  ];

  globalThis.__nextup_mock_db = {
    users: initialUsers,
    services: initialServices,
    tokens: initialTokens,
    digital_documents: initialDigitalDocs,
  };
}

const store = globalThis.__nextup_mock_db;

/**
 * Creates a mock Supabase Query Builder with chaining support.
 */
class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderConfig = null;
    this.selectedColumns = '*';
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.mutationType = null; // 'insert', 'update', 'delete'
    this.mutationData = null;
  }

  select(columns = '*') {
    this.selectedColumns = columns;
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column, value) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  in(column, values) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  gte(column, value) {
    this.filters.push((row) => row[column] >= value);
    return this;
  }

  lte(column, value) {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderConfig = { column, ascending };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(data) {
    this.mutationType = 'insert';
    this.mutationData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this.mutationType = 'update';
    this.mutationData = data;
    return this;
  }

  delete() {
    this.mutationType = 'delete';
    return this;
  }

  // Executes query when awaited with `await supabase.from(...)`
  async then(resolve, reject) {
    try {
      const result = this._execute();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  }

  _execute() {
    let rows = store[this.table] || [];

    // 1. Handle INSERT
    if (this.mutationType === 'insert') {
      const inserted = this.mutationData.map((item, idx) => {
        const newRow = {
          id: item.id || `gen-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
          created_at: item.created_at || new Date().toISOString(),
          ...item,
        };
        return newRow;
      });

      // Check unique constraint for tokens: (service_id, token_date, token_no)
      if (this.table === 'tokens') {
        for (const ins of inserted) {
          const collision = rows.find(
            (r) =>
              r.service_id === ins.service_id &&
              r.token_date === ins.token_date &&
              r.token_no === ins.token_no
          );
          if (collision) {
            return {
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint' },
            };
          }
        }
      }

      // Check unique constraint for users: (email)
      if (this.table === 'users') {
        for (const ins of inserted) {
          const collision = rows.find(
            (r) => r.email && ins.email && r.email.toLowerCase() === ins.email.toLowerCase()
          );
          if (collision) {
            return {
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint' },
            };
          }
        }
      }

      rows.push(...inserted);
      store[this.table] = rows;

      if (this.isSingle) {
        return { data: inserted[0], error: null };
      }
      return { data: inserted, error: null };
    }

    // 2. Handle UPDATE
    if (this.mutationType === 'update') {
      const updatedRows = [];
      store[this.table] = rows.map((r) => {
        const matches = this.filters.every((fn) => fn(r));
        if (matches) {
          const updated = { ...r, ...this.mutationData };
          updatedRows.push(updated);
          return updated;
        }
        return r;
      });

      if (this.isSingle) {
        return { data: updatedRows[0] || null, error: null };
      }
      return { data: updatedRows, error: null };
    }

    // 3. Handle DELETE
    if (this.mutationType === 'delete') {
      store[this.table] = rows.filter((r) => !this.filters.every((fn) => fn(r)));
      return { data: null, error: null };
    }

    // 4. Handle SELECT (Filter + Sort)
    let filtered = rows.filter((r) => this.filters.every((fn) => fn(r)));

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      filtered.sort((a, b) => {
        if (a[column] < b[column]) return ascending ? -1 : 1;
        if (a[column] > b[column]) return ascending ? 1 : -1;
        return 0;
      });
    }

    // Handle Relations/Joins
    const joined = filtered.map((row) => {
      const copy = { ...row };
      if (this.selectedColumns.includes('service:services')) {
        const svc = store.services.find((s) => s.id === row.service_id);
        copy.service = svc || null;
      }
      if (this.selectedColumns.includes('student:users')) {
        const student = store.users.find((u) => u.id === row.student_id);
        copy.student = student ? { name: student.name, email: student.email } : null;
      }
      return copy;
    });

    if (this.isSingle) {
      if (joined.length === 0) {
        return { data: null, error: { message: 'Row not found' } };
      }
      return { data: joined[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: joined[0] || null, error: null };
    }

    return { data: joined, error: null };
  }
}

export const mockSupabase = {
  from(table) {
    return new MockQueryBuilder(table);
  },
};
