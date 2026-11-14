// ============================================================================
// lib/departmentCatalog.js
// Department Document & Service Catalog.
// Classifies requests into:
// 1. 'digital': Issued instantly online with a verified digital certificate.
//              Student downloads/views it immediately; NO counter visit needed.
// 2. 'physical': Requires physical verification, cash/cheque, or original stamp.
//                Student takes a queue token and visits the desk when called.
// ============================================================================

export const DEPARTMENT_CATALOG = [
  {
    prefix: 'ACC',
    name: 'Accounts Office',
    description: 'Tuition fees, receipts, caution deposits, and payment clearances.',
    items: [
      {
        id: 'acc-fee-receipt',
        title: 'Semester Fee Payment Receipt',
        type: 'digital',
        deliveryText: 'Instant Digital Issuance • Verified E-Receipt',
        description: 'Official fee voucher with transaction ref, college seal, and barcode for scholarship/loan records.',
        fields: ['roll_no', 'semester', 'academic_year'],
        samplePrefix: 'RCP',
      },
      {
        id: 'acc-fee-structure',
        title: 'Tuition Fee Structure Breakdown',
        type: 'digital',
        deliveryText: 'Instant Digital Issuance • Official Fee Schedule',
        description: 'Certified annual fee schedule letter for bank education loans and government subsidies.',
        fields: ['roll_no', 'purpose'],
        samplePrefix: 'SCH',
      },
      {
        id: 'acc-caution-deposit',
        title: 'Hostel Caution Deposit Cash/Cheque Refund',
        type: 'physical',
        deliveryText: 'Physical Counter Visit • Token Required',
        description: 'In-person identity check, passbook verification, and voucher signature at the cash desk.',
        fields: ['roll_no', 'hostel_room'],
      },
      {
        id: 'acc-fine-waiver',
        title: 'Late Fine Exemption & Physical Challan',
        type: 'physical',
        deliveryText: 'Physical Counter Visit • Token Required',
        description: 'HOD approved exemption letter submission and manual ledger adjustment.',
        fields: ['roll_no', 'reason'],
      },
    ],
  },
  {
    prefix: 'EXM',
    name: 'Examination Cell',
    description: 'Transcripts, grade cards, backlog forms, and degree certificates.',
    items: [
      {
        id: 'exm-provisional-transcript',
        title: 'Provisional Semester Grade Transcript',
        type: 'digital',
        deliveryText: 'Instant Digital Issuance • Digitally Signed Marksheet',
        description: 'Official verified semester GPA report card with digital registrar verification hash.',
        fields: ['roll_no', 'semester'],
        samplePrefix: 'TRN',
      },
      {
        id: 'exm-backlog-status',
        title: 'Exam Backlog Clearance Certificate',
        type: 'digital',
        deliveryText: 'Instant Digital Issuance • Verified Status Letter',
        description: 'Certified verification letter confirming completion of all previous examination modules.',
        fields: ['roll_no'],
        samplePrefix: 'CLR',
      },
      {
        id: 'exm-degree-collection',
        title: 'Original Degree & Convocation Regalia Collection',
        type: 'physical',
        deliveryText: 'Physical Counter Visit • Token Required',
        description: 'Original parchment certificate collection requiring government photo ID and register signing.',
        fields: ['roll_no', 'convocation_year'],
      },
      {
        id: 'exm-revaluation-inspection',
        title: 'Evaluated Answer Script In-Person Review',
        type: 'physical',
        deliveryText: 'Physical Counter Visit • Token Required',
        description: 'Physical inspection of evaluated mid-term or end-term answer booklets under faculty supervision.',
        fields: ['roll_no', 'subject_code'],
      },
    ],
  },
  {
    prefix: 'ADM',
    name: 'Admissions Office',
    description: 'Bonafide letters, English proficiency certificates, and branch transfers.',
    items: [
      {
        id: 'adm-bonafide-cert',
        title: 'College Bonafide Student Certificate',
        type: 'digital',
        deliveryText: 'Instant Digital Issuance • QR-Verified Certificate',
        description: 'Institutional verification letter confirming bonafide full-time student status for passport, visa, or SIM.',
        fields: ['roll_no', 'purpose'],
        samplePrefix: 'BON',
      },
      {
        id: 'adm-medium-instruction',
        title: 'Medium of Instruction (English) Letter',
        type: 'digital',
        deliveryText: 'Instant Digital Issuance • Official Language Letter',
        description: 'Certified letter confirming English as the medium of instruction for higher studies and global tests.',
        fields: ['roll_no'],
        samplePrefix: 'MOI',
      },
      {
        id: 'adm-doc-verification',
        title: 'Original 10th & 12th Certificate Physical Verification',
        type: 'physical',
        deliveryText: 'Physical Counter Visit • Token Required',
        description: 'In-person verification and return of original board mark sheets deposited during admission.',
        fields: ['roll_no'],
      },
      {
        id: 'adm-branch-transfer',
        title: 'Branch Transfer Approval & Seat Allocation',
        type: 'physical',
        deliveryText: 'Physical Counter Visit • Token Required',
        description: 'In-person verification of merit ranking and allotment letter countersigning.',
        fields: ['roll_no', 'target_branch'],
      },
    ],
  },
  {
    prefix: 'LIB',
    name: 'Central Library Counter',
    description: 'Library clearances, smart RFID cards, and lost book settlements.',
    items: [
      {
        id: 'lib-nodues-cert',
        title: 'Library No-Dues Clearance E-Certificate',
        type: 'digital',
        deliveryText: 'Instant Digital Issuance • Catalog Verified E-Slip',
        description: 'Real-time database scan confirming zero pending books or overdue fines. Issued immediately.',
        fields: ['roll_no'],
        samplePrefix: 'LIB',
      },
      {
        id: 'lib-digital-pass',
        title: 'Digital E-Library & IEEE Portal Access Voucher',
        type: 'digital',
        deliveryText: 'Instant Digital Issuance • Credentials Generated',
        description: 'Digital institutional access pass for remote IEEE Xplore, ScienceDirect, and JSTOR databases.',
        fields: ['roll_no', 'branch'],
        samplePrefix: 'IEE',
      },
      {
        id: 'lib-book-return',
        title: 'Physical Book Return & Fine Adjustment',
        type: 'physical',
        deliveryText: 'Physical Counter Visit • Token Required',
        description: 'Physical barcode scan and inspection of returned library volumes at circulation desk.',
        fields: ['roll_no', 'book_accession_no'],
      },
      {
        id: 'lib-rfid-card',
        title: 'New RFID Smart Library Card Printing',
        type: 'physical',
        deliveryText: 'Physical Counter Visit • Token Required',
        description: 'In-person smart-card chip encoding and biometric kiosk linking.',
        fields: ['roll_no'],
      },
    ],
  },
  {
    prefix: 'CRT',
    name: 'Certificates & Transcripts',
    description: 'Official stamped transcripts, conduct letters, and apostille attestations.',
    items: [
      {
        id: 'crt-course-completion',
        title: 'Course Completion Attestation Letter',
        type: 'digital',
        deliveryText: 'Instant Digital Issuance • Verified E-Letter',
        description: 'Registrar signed digital document stating completion of all curriculum graduation requirements.',
        fields: ['roll_no'],
        samplePrefix: 'CMP',
      },
      {
        id: 'crt-character-conduct',
        title: 'Institutional Character & Conduct Certificate',
        type: 'digital',
        deliveryText: 'Instant Digital Issuance • Official Dean E-Certificate',
        description: 'Certified conduct certificate for campus placements, competitive exams, or government service.',
        fields: ['roll_no', 'purpose'],
        samplePrefix: 'CND',
      },
      {
        id: 'crt-embossed-transcript',
        title: 'Embossed Physical Transcript & Sealed Envelope',
        type: 'physical',
        deliveryText: 'Physical Counter Visit • Token Required',
        description: 'Physical registrar embossed seal and tamper-evident sealed envelopes for WES / foreign universities.',
        fields: ['roll_no', 'copies_needed'],
      },
    ],
  },
];
