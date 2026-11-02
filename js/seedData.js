/**
 * Seed data for Dr. Patil's Centre of Advance Dentistry
 * Chief Attending Dental Surgeon: Dr. Ganesh Janjal (BDS, MDS)
 * Includes pre-registered staff accounts, clinical patients with digital notes,
 * local X-ray diagnostic radiographs, and appointment logs.
 */

// Sample clinical SVG dental radiographs for instant visual demonstration
const SAMPLE_XRAY_IOPA_46 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="%230b0f19"/>
  <!-- Film border -->
  <rect x="15" y="15" width="370" height="270" rx="10" fill="%23131b2e" stroke="%23334155" stroke-width="2"/>
  <!-- Alveolar bone trabeculae pattern -->
  <path d="M 30,220 Q 100,200 200,210 T 370,215 L 370,270 L 30,270 Z" fill="%231e293b" opacity="0.8"/>
  <!-- Tooth #46 Lower Molar Crown -->
  <path d="M 140,110 C 130,120 120,160 135,190 C 150,220 160,260 165,270 C 170,260 180,210 195,200 C 210,210 220,260 225,270 C 230,260 240,220 255,190 C 270,160 260,120 250,110 C 235,100 215,115 195,110 C 175,115 155,100 140,110 Z" fill="%23cbd5e1" stroke="%2394a3b8" stroke-width="2"/>
  <!-- Pulp Chamber & Root Canals (Radiolucent dark) -->
  <path d="M 175,135 Q 195,145 215,135 Q 210,170 200,185 Q 205,215 215,255 L 210,255 Q 198,215 195,190 Q 192,215 180,255 L 175,255 Q 185,215 190,185 Q 180,170 175,135 Z" fill="%230f172a"/>
  <!-- Periapical Radiolucency (Lesion at Distal Apex) -->
  <circle cx="215" cy="260" r="14" fill="%23090d16" opacity="0.85"/>
  <circle cx="215" cy="260" r="18" fill="none" stroke="%23f43f5e" stroke-width="1.5" stroke-dasharray="3,3"/>
  <!-- Annotations -->
  <text x="30" y="42" fill="%2338bdf8" font-family="sans-serif" font-size="12" font-weight="bold">DR. GANESH JANJAL - DENTAL RADIOLOGY</text>
  <text x="30" y="60" fill="%2394a3b8" font-family="sans-serif" font-size="10">TYPE: IOPA &bull; TOOTH #46 (MANDIBULAR RIGHT 1ST MOLAR)</text>
  <text x="30" y="76" fill="%23f43f5e" font-family="sans-serif" font-size="9" font-weight="bold">&bull; FINDING: Apical Periodontitis (Distal Apex)</text>
  <text x="330" y="42" fill="%2364748b" font-family="sans-serif" font-size="11" font-weight="bold">R</text>
</svg>`;

const SAMPLE_XRAY_OPG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <rect width="400" height="240" fill="%230b0f19"/>
  <rect x="10" y="10" width="380" height="220" rx="8" fill="%23111827" stroke="%23374151" stroke-width="1.5"/>
  <!-- Panoramic Mandibular Arch Curve -->
  <path d="M 40,80 Q 200,20 360,80 Q 340,190 200,210 Q 60,190 40,80 Z" fill="none" stroke="%23475569" stroke-width="2"/>
  <!-- Upper & Lower Dentition Silhouette -->
  <path d="M 70,110 Q 200,90 330,110 L 325,125 Q 200,105 75,125 Z" fill="%2394a3b8" opacity="0.65"/>
  <path d="M 80,135 Q 200,120 320,135 L 315,150 Q 200,135 85,150 Z" fill="%23cbd5e1" opacity="0.75"/>
  <!-- Impacted Horizontal Wisdom Tooth #38 -->
  <rect x="55" y="130" width="22" height="14" rx="3" transform="rotate(-35, 60, 135)" fill="%23f1f5f9" stroke="%23ef4444" stroke-width="1.5"/>
  <!-- Header Text -->
  <text x="25" y="32" fill="%2338bdf8" font-family="sans-serif" font-size="11" font-weight="bold">DIGITAL OPG (ORTHOPANTOMOGRAM)</text>
  <text x="25" y="48" fill="%2394a3b8" font-family="sans-serif" font-size="9">CHIEF SURGEON: DR. GANESH JANJAL (ORAL &amp; MAXILLOFACIAL)</text>
  <text x="350" y="32" fill="%23f59e0b" font-family="sans-serif" font-size="10" font-weight="bold">PANORAMIC</text>
</svg>`;

const SEED_USERS = [
  {
    id: 'usr_admin',
    email: 'admin@drpatil.com',
    name: 'Dr. Ganesh Janjal (BDS, MDS Oral & Maxillofacial Surgery)',
    role: 'Admin',
    desk: 'Consulting Room 1',
    passwordPlain: 'admin123'
  },
  {
    id: 'usr_recep1',
    email: 'reception1@drpatil.com',
    name: 'Pooja Gaikwad',
    role: 'Reception Desk 1',
    desk: 'Front Desk - Counter A',
    passwordPlain: 'recep123'
  },
  {
    id: 'usr_recep2',
    email: 'reception2@drpatil.com',
    name: 'Rohit Kadam',
    role: 'Reception Desk 2',
    desk: 'Front Desk - Counter B',
    passwordPlain: 'recep123'
  }
];

const SEED_PATIENTS = [
  {
    id: 'pat_001',
    srNo: 'SR-001',
    name: 'Ramesh Kulkarni',
    age: 48,
    sex: 'Male',
    visitType: 'Already Consulted',
    primaryPhone: '9822014589',
    secondaryPhone: '9423157890',
    address: 'Plot 14, Samarth Colony, Kopargaon 423603',
    lastConsultDate: '2026-10-15',
    chiefProblem: 'Severe pain in lower right second molar, sensitive to hot beverages (Root Canal Therapy scheduled).',
    photo: '',
    paymentStatus: 'Paid',
    paymentAmount: 4500,
    registrationDate: '2026-10-15T09:30:00.000Z',
    isDeleted: false,
    registeredBy: 'reception1@drpatil.com',
    digitalNotes: [
      {
        id: 'note_001',
        date: '2026-10-15T10:00:00.000Z',
        author: 'Dr. Ganesh Janjal',
        category: 'Clinical Diagnosis & Treatment Plan',
        tooth: '#46 (Lower Right 1st Molar)',
        findings: 'Acute irreversible pulpitis with symptomatic apical periodontitis. Vitality test positive (delayed response). Percussion tenderness +ve. Advised 2-sitting RCT + full contour zirconia crown.',
        prescription: 'Cap. Amoxicillin 500mg TDS x 5 days, Tab. Zerodol-SP BD x 3 days, Cap. Pantocid 40mg OD (before food).',
        createdAt: '2026-10-15T10:00:00.000Z'
      },
      {
        id: 'note_002',
        date: '2026-10-22T11:30:00.000Z',
        author: 'Dr. Ganesh Janjal',
        category: 'Endodontic Procedure Note',
        tooth: '#46',
        findings: 'Under 2% Lignocaine local anesthesia with adrenaline. Rubber dam isolation placed. Access cavity refined. MB, ML, and Distal canals located. Working lengths: MB=20mm, ML=19.5mm, D=21mm. Biomechanical preparation completed up to 25/04 rotary files. Copious irrigation with 3% NaOCl and 17% EDTA. Calcium hydroxide intracanal medicament placed. Temporary Cavit restoration.',
        prescription: 'Continue warm saline rinses. Review after 7 days for obturation.',
        createdAt: '2026-10-22T11:30:00.000Z'
      }
    ],
    xrays: [
      {
        id: 'xray_001',
        date: '2026-10-15',
        type: 'IOPA (Periapical Radiograph)',
        tooth: '#46 Lower Molar',
        dataUrl: SAMPLE_XRAY_IOPA_46,
        notes: 'Pre-operative IOPA: Periapical radiolucency noted around the distal root apex. Canal curvature visible in mesial root. Alveolar crest bone level adequate.',
        importedBy: 'Dr. Ganesh Janjal'
      }
    ],
    installments: [
      {
        id: 'inst_001',
        receiptNo: 'REC-SR001-01',
        date: '2026-10-15',
        amount: 2500,
        mode: 'Cash',
        notes: 'Initial sitting - Access cavity preparation & biomechanical instrumentation',
        receivedBy: 'Dr. Ganesh Janjal',
        createdAt: '2026-10-15T10:15:00.000Z'
      },
      {
        id: 'inst_002',
        receiptNo: 'REC-SR001-02',
        date: '2026-10-22',
        amount: 2000,
        mode: 'UPI / QR Code',
        notes: 'Second sitting - Root canal obturation & zirconia crown fabrication deposit',
        receivedBy: 'Dr. Ganesh Janjal',
        createdAt: '2026-10-22T11:45:00.000Z'
      }
    ]
  },
  {
    id: 'pat_002',
    srNo: 'SR-002',
    name: 'Sneha Deshmukh',
    age: 26,
    sex: 'Female',
    visitType: 'Already Consulted',
    primaryPhone: '9765432109',
    secondaryPhone: '9890123456',
    address: 'Flat 204, Sai Orchid, Near Bus Stand, Shirdi 423109',
    lastConsultDate: '2026-10-22',
    chiefProblem: 'Monthly ceramic aligner wire tightening and bite realignment assessment.',
    photo: '',
    paymentStatus: 'Pending',
    paymentAmount: 1800,
    registrationDate: '2026-10-22T10:15:00.000Z',
    isDeleted: false,
    registeredBy: 'reception1@drpatil.com',
    digitalNotes: [
      {
        id: 'note_003',
        date: '2026-10-22T10:30:00.000Z',
        author: 'Dr. Ganesh Janjal',
        category: 'Orthodontic Assessment',
        tooth: 'Full Upper and Lower Arch',
        findings: 'Class I malocclusion with moderate crowding in lower anterior region. 0.016 NiTi upper archwire changed to 0.017x0.025 SS. Derotation of #12 and #22 progressing favorably. Good oral hygiene maintained.',
        prescription: 'Orthodontic relief wax given for bracket irritation on right buccal mucosa.',
        createdAt: '2026-10-22T10:30:00.000Z'
      }
    ],
    xrays: [
      {
        id: 'xray_002',
        date: '2026-10-22',
        type: 'OPG (Panoramic)',
        tooth: 'Full Arch Dentition',
        dataUrl: SAMPLE_XRAY_OPG,
        notes: 'Pre-orthodontic baseline panoramic view showing root parallelism and third molar eruption status.',
        importedBy: 'Dr. Ganesh Janjal'
      }
    ]
  },
  {
    id: 'pat_003',
    srNo: 'SR-003',
    name: 'Amitabh Sharma',
    age: 54,
    sex: 'Male',
    visitType: 'First Time',
    primaryPhone: '9823456781',
    secondaryPhone: '9922334455',
    address: 'Bunglow No. 8, Sanjivani Sugar Mill Campus, Kopargaon',
    lastConsultDate: '',
    chiefProblem: 'Tooth mobility and bleeding gums during brushing. Needs deep subgingival scaling.',
    photo: '',
    paymentStatus: 'Pending',
    paymentAmount: 2200,
    registrationDate: '2026-10-28T11:00:00.000Z',
    isDeleted: false,
    registeredBy: 'reception2@drpatil.com',
    digitalNotes: [
      {
        id: 'note_004',
        date: '2026-10-28T11:20:00.000Z',
        author: 'Dr. Ganesh Janjal',
        category: 'Periodontal Assessment',
        tooth: 'General Full Mouth',
        findings: 'Generalized Grade II chronic periodontitis. Heavy supra and subgingival calculus. Probing depth 4-6mm in posterior quadrants. Grade I mobility in #31, #41.',
        prescription: '0.2% Chlorhexidine gluconate mouthwash 10ml BD for 14 days. Advised full mouth ultrasonic deep scaling and root planing.',
        createdAt: '2026-10-28T11:20:00.000Z'
      }
    ],
    xrays: []
  },
  {
    id: 'pat_004',
    srNo: 'SR-004',
    name: 'Priyanka Patil',
    age: 31,
    sex: 'Female',
    visitType: 'Already Consulted',
    primaryPhone: '9850123987',
    secondaryPhone: '9420987654',
    address: 'Shivaji Chowk, Main Road, Rahata 423107',
    lastConsultDate: '2026-10-05',
    chiefProblem: 'Crown placement post successful root canal treatment for upper pre-molar.',
    photo: '',
    paymentStatus: 'Paid',
    paymentAmount: 6000,
    registrationDate: '2026-10-05T14:20:00.000Z',
    isDeleted: false,
    registeredBy: 'reception1@drpatil.com',
    digitalNotes: [
      {
        id: 'note_005',
        date: '2026-10-05T14:45:00.000Z',
        author: 'Dr. Ganesh Janjal',
        category: 'Prosthodontic Crown Preparation',
        tooth: '#14 (Upper Right 1st Premolar)',
        findings: 'Tooth asymptomatic post-RCT. Core buildup completed with dual-cure composite. Chamfer margin preparation with 1.5mm occlusal clearance. Addition silicone 2-step putty-wash impression recorded. Temporary acrylic crown cemented.',
        prescription: 'Zirconia layered CAD-CAM crown sent for laboratory fabrication.',
        createdAt: '2026-10-05T14:45:00.000Z'
      }
    ],
    xrays: []
  },
  {
    id: 'pat_005',
    srNo: 'SR-005',
    name: 'Rajesh Jagtap',
    age: 39,
    sex: 'Male',
    visitType: 'First Time',
    primaryPhone: '9421567890',
    secondaryPhone: '9881234567',
    address: 'Lane 3, Anand Nagar, Station Road, Kopargaon',
    lastConsultDate: '',
    chiefProblem: 'Impacted lower horizontal wisdom tooth causing pericoronitis and swelling.',
    photo: '',
    paymentStatus: 'Partial',
    paymentAmount: 3500,
    registrationDate: '2026-11-01T08:45:00.000Z',
    isDeleted: false,
    registeredBy: 'reception1@drpatil.com',
    digitalNotes: [
      {
        id: 'note_006',
        date: '2026-11-01T09:00:00.000Z',
        author: 'Dr. Ganesh Janjal',
        category: 'Oral Surgery Consultation',
        tooth: '#38 (Mandibular Left 3rd Molar)',
        findings: 'Horizontal Pell & Gregory Class II Position B impaction. Severe operculitis with inflamed mucosal flap. Close proximity of roots to inferior alveolar nerve. Advised surgical disimpaction under LA.',
        prescription: 'Tab. Augmentin 625mg BD x 5d, Tab. Chymoral Forte TDS x 3d, Betadine oral rinse.',
        createdAt: '2026-11-01T09:00:00.000Z'
      }
    ],
    xrays: [
      {
        id: 'xray_003',
        date: '2026-11-01',
        type: 'OPG (Panoramic)',
        tooth: '#38 Lower Left Wisdom',
        dataUrl: SAMPLE_XRAY_OPG,
        notes: 'Panoramic view confirming horizontal impaction #38 with crown abutting distal surface of second molar #37.',
        importedBy: 'Dr. Ganesh Janjal'
      }
    ],
    installments: [
      {
        id: 'inst_003',
        receiptNo: 'REC-SR005-01',
        date: '2026-11-01',
        amount: 1500,
        mode: 'UPI / QR Code',
        notes: 'Down payment for surgical wisdom tooth disimpaction & medication',
        receivedBy: 'Dr. Ganesh Janjal',
        createdAt: '2026-11-01T09:15:00.000Z'
      }
    ]
  },
  {
    id: 'pat_006',
    srNo: 'SR-006',
    name: 'Sunita More',
    age: 62,
    sex: 'Female',
    visitType: 'Already Consulted',
    primaryPhone: '9923876543',
    secondaryPhone: '9822114477',
    address: 'Near Vitthal Mandir, Yeola Road, Kopargaon',
    lastConsultDate: '2026-09-18',
    chiefProblem: 'Full lower arch denture trial and mucosal pressure relief adjustment.',
    photo: '',
    paymentStatus: 'Paid',
    paymentAmount: 12000,
    registrationDate: '2026-09-18T16:00:00.000Z',
    isDeleted: false,
    registeredBy: 'reception2@drpatil.com',
    digitalNotes: [],
    xrays: []
  },
  {
    id: 'pat_007',
    srNo: 'SR-007',
    name: 'Aarav Choudhary',
    age: 8,
    sex: 'Male',
    visitType: 'First Time',
    primaryPhone: '9822998877',
    secondaryPhone: '9422336611',
    address: 'Teachers Colony, Near Sanjivani College, Kopargaon',
    lastConsultDate: '',
    chiefProblem: 'Pediatric pit and fissure sealants + topical fluoride varnish for early caries.',
    photo: '',
    paymentStatus: 'Paid',
    paymentAmount: 1500,
    registrationDate: '2026-11-01T09:10:00.000Z',
    isDeleted: false,
    registeredBy: 'reception1@drpatil.com',
    digitalNotes: [],
    xrays: []
  },
  {
    id: 'pat_008',
    srNo: 'SR-008',
    name: 'Kavita Joshi',
    age: 35,
    sex: 'Female',
    visitType: 'Already Consulted',
    primaryPhone: '9763214587',
    secondaryPhone: '9821456321',
    address: 'Gurukrupa Nivas, Pangri Road, Sinnar 422103',
    lastConsultDate: '2026-10-12',
    chiefProblem: 'In-office Zoom LED laser teeth whitening follow-up and sensitivity check.',
    photo: '',
    paymentStatus: 'Pending',
    paymentAmount: 5000,
    registrationDate: '2026-10-12T11:45:00.000Z',
    isDeleted: false,
    registeredBy: 'reception2@drpatil.com',
    digitalNotes: [],
    xrays: []
  },
  {
    id: 'pat_009',
    srNo: 'SR-009',
    name: 'Vikram Shinde',
    age: 42,
    sex: 'Male',
    visitType: 'First Time',
    primaryPhone: '9423654128',
    secondaryPhone: '9822331155',
    address: 'Sector 5, MIDC Industrial Area, Kopargaon',
    lastConsultDate: '',
    chiefProblem: 'Chipped front incisor following sports injury, aesthetic composite restoration.',
    photo: '',
    paymentStatus: 'Paid',
    paymentAmount: 2500,
    registrationDate: '2026-11-01T10:00:00.000Z',
    isDeleted: false,
    registeredBy: 'reception1@drpatil.com',
    digitalNotes: [],
    xrays: []
  },
  {
    id: 'pat_010',
    srNo: 'SR-010',
    name: 'Meena Waghmare',
    age: 50,
    sex: 'Female',
    visitType: 'Already Consulted',
    primaryPhone: '9850443322',
    secondaryPhone: '9921556677',
    address: 'Ganesh Nagar, Near Water Tank, Kopargaon',
    lastConsultDate: '2026-10-19',
    chiefProblem: 'Osseointegration check for 2 titanium dental implants prior to abutment fixing.',
    photo: '',
    paymentStatus: 'Partial',
    paymentAmount: 25000,
    registrationDate: '2026-10-19T15:30:00.000Z',
    isDeleted: false,
    registeredBy: 'reception1@drpatil.com',
    digitalNotes: [],
    xrays: [],
    installments: [
      {
        id: 'inst_004',
        receiptNo: 'REC-SR010-01',
        date: '2026-10-10',
        amount: 10000,
        mode: 'Net Banking / NEFT',
        notes: 'Stage 1 implant surgery deposit & titanium fixture placement',
        receivedBy: 'Dr. Ganesh Janjal',
        createdAt: '2026-10-10T11:00:00.000Z'
      },
      {
        id: 'inst_005',
        receiptNo: 'REC-SR010-02',
        date: '2026-10-25',
        amount: 5000,
        mode: 'UPI / QR Code',
        notes: 'Stage 2 healing abutment connection & impression',
        receivedBy: 'Dr. Ganesh Janjal',
        createdAt: '2026-10-25T16:00:00.000Z'
      }
    ]
  }
];

// Helper to format today's date in YYYY-MM-DD
function getTodayIsoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const SEED_APPOINTMENTS = [
  {
    id: 'apt_001',
    patientId: 'pat_005',
    patientSrNo: 'SR-005',
    patientName: 'Rajesh Jagtap',
    date: getTodayIsoDate(0),
    time: '10:00',
    dentist: 'Dr. Ganesh Janjal',
    treatment: 'Surgical Wisdom Tooth Extraction',
    status: 'Scheduled',
    notes: 'Pre-op antibiotics prescribed; monitor blood pressure prior to local anesthesia.'
  },
  {
    id: 'apt_002',
    patientId: 'pat_001',
    patientSrNo: 'SR-001',
    patientName: 'Ramesh Kulkarni',
    date: getTodayIsoDate(0),
    time: '11:30',
    dentist: 'Dr. Ganesh Janjal',
    treatment: 'Root Canal Obturation (2nd Sitting)',
    status: 'Scheduled',
    notes: 'Check apical seal with intraoral radiograph.'
  },
  {
    id: 'apt_003',
    patientId: 'pat_007',
    patientSrNo: 'SR-007',
    patientName: 'Aarav Choudhary',
    date: getTodayIsoDate(0),
    time: '15:00',
    dentist: 'Dr. Ananya Rao (Pedodontist)',
    treatment: 'Pediatric Caries Prevention & Fluoride',
    status: 'Scheduled',
    notes: 'Child friendly behavioral management protocol.'
  },
  {
    id: 'apt_004',
    patientId: 'pat_002',
    patientSrNo: 'SR-002',
    patientName: 'Sneha Deshmukh',
    date: getTodayIsoDate(0),
    time: '17:00',
    dentist: 'Dr. Ganesh Janjal',
    treatment: 'Orthodontic Archwire Activation',
    status: 'Scheduled',
    notes: 'Evaluate molar canine relationship.'
  },
  {
    id: 'apt_005',
    patientId: 'pat_003',
    patientSrNo: 'SR-003',
    patientName: 'Amitabh Sharma',
    date: getTodayIsoDate(1),
    time: '10:30',
    dentist: 'Dr. Ganesh Janjal',
    treatment: 'Ultrasonic Subgingival Scaling',
    status: 'Scheduled',
    notes: 'Periodontal charting and chlorhexidine irrigation.'
  },
  {
    id: 'apt_006',
    patientId: 'pat_004',
    patientSrNo: 'SR-004',
    patientName: 'Priyanka Patil',
    date: getTodayIsoDate(2),
    time: '14:00',
    dentist: 'Dr. Ganesh Janjal',
    treatment: 'Permanent Zirconia Crown Cementation',
    status: 'Scheduled',
    notes: 'Verify marginal integrity and dynamic occlusion.'
  }
];

if (typeof window !== 'undefined') {
  window.SEED_USERS = SEED_USERS;
  window.SEED_PATIENTS = SEED_PATIENTS;
  window.SEED_APPOINTMENTS = SEED_APPOINTMENTS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SEED_USERS, SEED_PATIENTS, SEED_APPOINTMENTS };
}
