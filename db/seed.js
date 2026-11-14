// ============================================================================
// db/seed.js
// Database Seed Script for NextUp
// Populates Supabase with 1 admin, 15 Indian students, 5 services (1 closed),
// today's multi-status tokens, and 7 days of historical tokens with an 11 AM peak.
// Run via: node db/seed.js
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Helper to load .env or .env.local if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const f of envFiles) {
    const fullPath = path.resolve(process.cwd(), f);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/(^['"]|['"]$)/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local or environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Time helpers for IST dates
function getISTDateString(daysAgo = 0) {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istDate.setDate(istDate.getDate() - daysAgo);
  const y = istDate.getFullYear();
  const m = String(istDate.getMonth() + 1).padStart(2, '0');
  const d = String(istDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function runSeed() {
  console.log('--- Starting NextUp Database Seed ---');

  // 1. Hash common password
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('demo123', salt);

  // 2. Prepare Users: 1 Admin + 15 Students
  const adminUser = {
    name: 'Dr. Rajesh Sharma (Dean Office)',
    email: 'admin@demo.com',
    password_hash: defaultPasswordHash,
    role: 'admin',
  };

  const studentUsers = [
    { name: 'Aarav Patel', email: 'student1@demo.com' },
    { name: 'Diya Sharma', email: 'student2@demo.com' },
    { name: 'Rohan Verma', email: 'student3@demo.com' },
    { name: 'Ananya Iyer', email: 'student4@demo.com' },
    { name: 'Kabir Mehta', email: 'student5@demo.com' },
    { name: 'Saanvi Nair', email: 'student6@demo.com' },
    { name: 'Ishaan Gupta', email: 'student7@demo.com' },
    { name: 'Meera Joshi', email: 'student8@demo.com' },
    { name: 'Arjun Rao', email: 'student9@demo.com' },
    { name: 'Pooja Kulkarni', email: 'student10@demo.com' },
    { name: 'Aditya Deshmukh', email: 'student11@demo.com' },
    { name: 'Tanvi Bhatia', email: 'student12@demo.com' },
    { name: 'Vivaan Malhotra', email: 'student13@demo.com' },
    { name: 'Rhea Choudhury', email: 'student14@demo.com' },
    { name: 'Karan Singh', email: 'student15@demo.com' },
  ].map((s) => ({
    name: s.name,
    email: s.email,
    password_hash: defaultPasswordHash,
    role: 'student',
  }));

  const allUsersToInsert = [adminUser, ...studentUsers];

  // Clean old test data
  console.log('Cleaning up existing demo data...');
  await supabase.from('tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert Users
  console.log('Inserting 1 admin and 15 students...');
  const { data: insertedUsers, error: userErr } = await supabase
    .from('users')
    .insert(allUsersToInsert)
    .select();

  if (userErr) {
    console.error('Failed to insert users:', userErr);
    process.exit(1);
  }

  const admin = insertedUsers.find((u) => u.role === 'admin');
  const students = insertedUsers.filter((u) => u.role === 'student');

  // 3. Prepare 5 Services (4 open, 1 closed)
  console.log('Inserting 5 college administration services...');
  const servicesList = [
    {
      name: 'Accounts Office',
      prefix: 'ACC',
      avg_minutes_default: 8,
      open_time: '10:00:00',
      close_time: '16:00:00',
      is_open: true,
      max_tokens_per_day: 100,
    },
    {
      name: 'Examination Cell',
      prefix: 'EXM',
      avg_minutes_default: 6,
      open_time: '10:00:00',
      close_time: '16:00:00',
      is_open: true,
      max_tokens_per_day: 120,
    },
    {
      name: 'Admissions Office',
      prefix: 'ADM',
      avg_minutes_default: 10,
      open_time: '10:00:00',
      close_time: '16:00:00',
      is_open: true,
      max_tokens_per_day: 80,
    },
    {
      name: 'Central Library Counter',
      prefix: 'LIB',
      avg_minutes_default: 5,
      open_time: '09:30:00',
      close_time: '17:00:00',
      is_open: true,
      max_tokens_per_day: 150,
    },
    {
      name: 'Certificates & Transcripts',
      prefix: 'CRT',
      avg_minutes_default: 7,
      open_time: '10:00:00',
      close_time: '15:30:00',
      is_open: false, // Closed state demonstration!
      max_tokens_per_day: 60,
    },
  ];

  const { data: insertedServices, error: servErr } = await supabase
    .from('services')
    .insert(servicesList)
    .select();

  if (servErr) {
    console.error('Failed to insert services:', servErr);
    process.exit(1);
  }

  const accService = insertedServices.find((s) => s.prefix === 'ACC');
  const exmService = insertedServices.find((s) => s.prefix === 'EXM');
  const admService = insertedServices.find((s) => s.prefix === 'ADM');
  const libService = insertedServices.find((s) => s.prefix === 'LIB');

  const todayStr = getISTDateString(0);
  console.log(`Generating tokens for today: ${todayStr}...`);

  const tokensToInsert = [];

  // Accounts Office Tokens for Today:
  // 3 completed, 1 serving, 4 waiting (student1 is position 1!), 1 no_show, 1 cancelled
  tokensToInsert.push(
    {
      service_id: accService.id,
      student_id: students[1].id, // Diya
      token_date: todayStr,
      token_no: 1,
      purpose: 'Semester Tuition Fee Receipt',
      status: 'completed',
      created_at: `${todayStr}T09:45:00+05:30`,
      called_at: `${todayStr}T10:02:00+05:30`,
      completed_at: `${todayStr}T10:10:00+05:30`,
      served_by: admin.id,
    },
    {
      service_id: accService.id,
      student_id: students[2].id, // Rohan
      token_date: todayStr,
      token_no: 2,
      purpose: 'Hostel Security Deposit Refund',
      status: 'completed',
      created_at: `${todayStr}T09:50:00+05:30`,
      called_at: `${todayStr}T10:11:00+05:30`,
      completed_at: `${todayStr}T10:19:00+05:30`,
      served_by: admin.id,
    },
    {
      service_id: accService.id,
      student_id: students[3].id, // Ananya
      token_date: todayStr,
      token_no: 3,
      purpose: 'Bus Pass Fee Verification',
      status: 'completed',
      created_at: `${todayStr}T10:00:00+05:30`,
      called_at: `${todayStr}T10:20:00+05:30`,
      completed_at: `${todayStr}T10:27:00+05:30`,
      served_by: admin.id,
    },
    {
      service_id: accService.id,
      student_id: students[4].id, // Kabir
      token_date: todayStr,
      token_no: 4,
      purpose: 'Fee Concession Application',
      status: 'serving',
      created_at: `${todayStr}T10:05:00+05:30`,
      called_at: `${todayStr}T10:28:00+05:30`,
      served_by: admin.id,
    },
    {
      // Student 1 (student1@demo.com) is Next in line!
      service_id: accService.id,
      student_id: students[0].id, // Aarav
      token_date: todayStr,
      token_no: 5,
      purpose: 'Bonafide Certificate Fee Slip',
      status: 'waiting',
      created_at: `${todayStr}T10:15:00+05:30`,
    },
    {
      service_id: accService.id,
      student_id: students[5].id, // Saanvi
      token_date: todayStr,
      token_no: 6,
      purpose: 'Late Fine Exemption Request',
      status: 'waiting',
      created_at: `${todayStr}T10:18:00+05:30`,
    },
    {
      service_id: accService.id,
      student_id: students[6].id, // Ishaan
      token_date: todayStr,
      token_no: 7,
      purpose: 'Lab Dues Clearance',
      status: 'waiting',
      created_at: `${todayStr}T10:22:00+05:30`,
    },
    {
      service_id: accService.id,
      student_id: students[7].id, // Meera
      token_date: todayStr,
      token_no: 8,
      purpose: 'Scholarship Disbursal Query',
      status: 'waiting',
      created_at: `${todayStr}T10:25:00+05:30`,
    },
    {
      service_id: accService.id,
      student_id: students[8].id, // Arjun
      token_date: todayStr,
      token_no: 9,
      purpose: 'Exam Fee Late Submission',
      status: 'no_show',
      created_at: `${todayStr}T09:40:00+05:30`,
      called_at: `${todayStr}T10:00:00+05:30`,
      served_by: admin.id,
    },
    {
      service_id: accService.id,
      student_id: students[9].id, // Pooja
      token_date: todayStr,
      token_no: 10,
      purpose: 'Duplicate ID Card Fine',
      status: 'cancelled',
      created_at: `${todayStr}T09:55:00+05:30`,
    }
  );

  // Examination Cell Tokens for Today:
  tokensToInsert.push(
    {
      service_id: exmService.id,
      student_id: students[10].id, // Aditya
      token_date: todayStr,
      token_no: 1,
      purpose: 'Backlog Exam Form Verification',
      status: 'completed',
      created_at: `${todayStr}T10:00:00+05:30`,
      called_at: `${todayStr}T10:08:00+05:30`,
      completed_at: `${todayStr}T10:15:00+05:30`,
      served_by: admin.id,
    },
    {
      service_id: exmService.id,
      student_id: students[11].id, // Tanvi
      token_date: todayStr,
      token_no: 2,
      purpose: 'Revaluation Form Submission',
      status: 'serving',
      created_at: `${todayStr}T10:05:00+05:30`,
      called_at: `${todayStr}T10:16:00+05:30`,
      served_by: admin.id,
    },
    {
      service_id: exmService.id,
      student_id: students[12].id, // Vivaan
      token_date: todayStr,
      token_no: 3,
      purpose: 'Grade Card Correction',
      status: 'waiting',
      created_at: `${todayStr}T10:12:00+05:30`,
    }
  );

  // Admissions Office & Library Tokens for Today:
  tokensToInsert.push(
    {
      service_id: admService.id,
      student_id: students[13].id, // Rhea
      token_date: todayStr,
      token_no: 1,
      purpose: 'Branch Transfer Eligibility Check',
      status: 'serving',
      created_at: `${todayStr}T10:10:00+05:30`,
      called_at: `${todayStr}T10:25:00+05:30`,
      served_by: admin.id,
    },
    {
      service_id: admService.id,
      student_id: students[14].id, // Karan
      token_date: todayStr,
      token_no: 2,
      purpose: 'Original Document Verification',
      status: 'waiting',
      created_at: `${todayStr}T10:18:00+05:30`,
    },
    {
      service_id: libService.id,
      student_id: students[1].id,
      token_date: todayStr,
      token_no: 1,
      purpose: 'Book Return & Clearance Slip',
      status: 'completed',
      created_at: `${todayStr}T09:40:00+05:30`,
      called_at: `${todayStr}T09:45:00+05:30`,
      completed_at: `${todayStr}T09:50:00+05:30`,
      served_by: admin.id,
    }
  );

  // 4. Generate 7 Days of Historical Tokens
  // Clear peak around 11:00 AM - 12:00 PM IST
  console.log('Generating 7 days of historical tokens for analytics...');
  const pastPurposes = [
    'Document Verification',
    'Fee Receipt Verification',
    'No Dues Certificate',
    'Duplicate Hall Ticket',
    'Grade Sheet Collection',
    'Library Card Renewal',
    'Bonafide Attestation',
  ];

  for (let daysAgo = 1; daysAgo <= 7; daysAgo++) {
    const pastDateStr = getISTDateString(daysAgo);

    // Distribution across hours to create peak at 11:00 AM:
    // 9 AM: 3 tokens, 10 AM: 6 tokens, 11 AM: 15 tokens (PEAK!), 12 PM: 7 tokens, 1 PM: 3 tokens, 2 PM: 5 tokens, 3 PM: 4 tokens
    const hourlyCountsConfig = [
      { hour: 9, count: 3 },
      { hour: 10, count: 6 },
      { hour: 11, count: 16 }, // Busy peak hour!
      { hour: 12, count: 7 },
      { hour: 13, count: 3 },
      { hour: 14, count: 5 },
      { hour: 15, count: 4 },
    ];

    let tokenSeq = 1;
    for (const slot of hourlyCountsConfig) {
      for (let i = 0; i < slot.count; i++) {
        const studentIndex = (tokenSeq + i) % students.length;
        const targetService = insertedServices[tokenSeq % 4]; // Rotate between open services
        const minOffset = Math.floor((i * 55) / slot.count);
        const mm = String(minOffset).padStart(2, '0');
        const hh = String(slot.hour).padStart(2, '0');

        const createdTime = `${pastDateStr}T${hh}:${mm}:00+05:30`;
        const calledTime = `${pastDateStr}T${hh}:${String(Math.min(58, minOffset + 3)).padStart(2, '0')}:00+05:30`;
        const completedTime = `${pastDateStr}T${hh}:${String(Math.min(59, minOffset + 9)).padStart(2, '0')}:00+05:30`;

        // 88% completed, 12% no-show
        const isNoShow = (tokenSeq + slot.hour) % 8 === 0;

        tokensToInsert.push({
          service_id: targetService.id,
          student_id: students[studentIndex].id,
          token_date: pastDateStr,
          token_no: tokenSeq++,
          purpose: pastPurposes[(tokenSeq + i) % pastPurposes.length],
          status: isNoShow ? 'no_show' : 'completed',
          created_at: createdTime,
          called_at: calledTime,
          completed_at: isNoShow ? null : completedTime,
          served_by: admin.id,
        });
      }
    }
  }

  // Insert in batches of 100 to avoid payload size issues
  console.log(`Inserting ${tokensToInsert.length} total tokens...`);
  const batchSize = 100;
  for (let i = 0; i < tokensToInsert.length; i += batchSize) {
    const batch = tokensToInsert.slice(i, i + batchSize);
    const { error: batchErr } = await supabase.from('tokens').insert(batch);
    if (batchErr) {
      console.error(`Error inserting batch at ${i}:`, batchErr);
      process.exit(1);
    }
  }

  console.log('--- NextUp Seed Complete! ---');
  console.log('Demo Credentials:');
  console.log('  Admin:   admin@demo.com   / demo123');
  console.log('  Student: student1@demo.com / demo123 (has active token ACC-005 in line!)');
}

runSeed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
