# Dr. Patil's Centre of Advance Dentistry
### Advanced Patient Intake, Scheduling & Clinic Management Web Application
**Web Technology Lab — Client Project Report & Implementation**

---

### 🎓 Academic Submission Details
- **Institute:** Sanjivani Rural Education Society's Sanjivani College of Engineering, Kopargaon - 423603 *(Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)*
- **Department:** Department of Computer Engineering *(UG Program - NBA Accredited)*
- **Academic Year:** 2026 - 2027 &nbsp;|&nbsp; **Semester:** I
- **Student Name:** Sarthak Raju Solanke
- **Roll No:** 05 &nbsp;|&nbsp; **Class / Division:** T.Y. - A

---

## 🌟 Executive Overview
**Dr. Patil's Centre of Advance Dentistry Web Application** is a specialized, production-grade healthcare application built to digitize patient intake, queue handling, double-booking prevention, and clinic administration.

Designed according to clinical specifications, it operates **100% offline** with zero server dependency, recurring hosting costs, or cloud vulnerabilities. All data resides securely in a local transactional engine with salted SHA-256 password hashing, automated serial numbering, query-level privacy masking, and instant CSV/database backup generation.

---

## 🚀 Quick Start (Running the Application)

You can run this application in either of two ways:

### Option 1: Direct Browser Launch (100% Zero-Setup)
Simply **double-click** `index.html` or open it with any web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari). No installation is required!

### Option 2: Local Node.js Server
If you prefer running via a local HTTP server:
```bash
# Navigate to the project directory
cd "c:\Users\sarth\OneDrive\Desktop\client project"

# Start the built-in HTTP server
node server.js
# or: npm start
```
Open your browser and navigate to: **`http://localhost:3000`**

### Option 3: Deploy to Vercel (Production Cloud Hosting)
This project is pre-configured with `vercel.json` for seamless 1-click cloud deployment.

#### Method A: Via Vercel CLI
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy in seconds
vercel
```

#### Method B: Via GitHub & Vercel Dashboard
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Dr. Patil's Advance Dentistry Web App"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository. Vercel automatically detects the static root configuration from `vercel.json` and `package.json`.
4. Click **Deploy**. Your live clinic web application will be accessible worldwide on a secure `https://*.vercel.app` URL!

---

## 🔑 Pre-Registered Staff Accounts

The system comes pre-seeded with 3 staff accounts for demonstration. Quick-fill chips are available on the login screen for 1-click access:

| Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Admin (Dr. Ganesh Janjal)** | `admin@drpatil.com` | `admin123` | Full clinical access: Attending Dental Surgeon (BDS, MDS Oral Surgery). Digital notes, X-ray importer & darkroom viewer, scheduling, payment toggles, CSV exports, backups. |
| **Reception Desk 1** | `reception1@drpatil.com` | `recep123` | Front-desk patient registration, 5-minute grace-window typo editing, minimal patient list. |
| **Reception Desk 2** | `reception2@drpatil.com` | `recep123` | Front-desk patient registration, 5-minute grace-window typo editing, minimal patient list. |

---

## 🔬 Core Clinical Modules & Features

### 1. Receptionist Intake Module
- **Patient Registration Form:**
  - **Mandatory Fields:** Full Name, Age (validated range `0 - 120`), Sex (`Male`, `Female`, `Other`), Visit Type (`First Time`, `Already Consulted`), Primary Phone (`10 digits`), Residential Address.
  - **Optional Fields:** Secondary Phone (`10 digits`), Last Consultation Date, Chief Dental Complaint, Consultation Fee, and Patient Photograph (camera/gallery upload).
- **Automatic Serial Number (Sr. No):** Generates sequential clinic IDs (e.g., `SR-001`, `SR-002`, `SR-011`).
- **Grace-Window Name Editing (TC-09):** Real-time 5-minute countdown window allowing receptionists to fix name typos immediately post-submission. Once the timer expires, the record locks automatically to preserve medical audit integrity.
- **Query-Level Reception Privacy (TC-10):** Receptionists can strictly view only `Sr. No`, `Patient Name`, and `Registration Time`. Medical complaints, addresses, phone numbers, and payment details are stripped at the data layer.

### 2. Admin Clinical Management & Diagnostics Module
- **Attending Surgeon:** **Dr. Ganesh Janjal** (BDS, MDS Oral & Maxillofacial Surgery).
- **📝 Digital Clinical Notes & Rx System (Individual Patient File):**
  - Ability to record, edit, and delete structured digital clinical notes for each individual patient.
  - Category classification: `Clinical Diagnosis & Treatment Plan`, `Endodontic Procedure Note (RCT)`, `Oral Surgery / Extraction Note`, `Prosthodontic Crown & Bridge`, `Orthodontic Wire Adjustment`, `Periodontal Scaling`, `Pediatric Care`, `Post-Op Review`.
  - FDI Tooth Notation indexing (e.g. `#46`, `#16`, `#11`, `Full Mouth`).
  - **Quick Dental Preset Chips:** 1-click clinical templates for Root Canal Treatment, Composite Restorations, Surgical Disimpactions, Ultrasonic Scaling, and Post-Op Analgesic Prescriptions.
  - Structured Prescription / Rx box formatted with medications and dosage guidelines.
  - Auto-integrated into printable patient intake slips and CSV exports.
- **🩻 Import Dental X-Rays from Local Storage & Diagnostic Viewer:**
  - Import any dental radiograph (`JPG`, `PNG`, `WEBP`, `DICOM`-export) directly from local computer storage for each individual patient.
  - Radiograph categorization: `IOPA (Periapical)`, `OPG (Panoramic)`, `Bitewing`, `CBCT 3D Section`, `Occlusal`, `Intraoral Camera Photo`.
  - Tooth/quadrant mapping and radiographic diagnostic findings notes.
  - **🌓 Darkroom Negative Invert Mode:** One-click color inversion tool simulating traditional illuminated X-ray viewbox for enhanced periapical radiolucency and bone density diagnosis.
  - **🔍 Lightbox High-Resolution Inspector:** Full-screen zoom inspection window.
  - Direct local storage download and delete actions.
- **Live KPI Analytics Cards:** Real-time counters for Total Registered Patients, Today's Appointments, Pending Payments count and amount (₹), and Total Revenue Collected.
- **Interactive Patient Queue:**
  - Instant live search across Name, Phone, and Sr. No.
  - Multi-criteria filtering by Payment Status (`All`, `Pending`, `Paid`) and Registration Date (`All Time`, `Today`, `This Week`, `This Month`).
  - **One-Tap Payment Toggle (TC-13):** Click any payment badge to instantly toggle between `Paid` and `Pending` with instant audit logging and balance updates.
- **Appointment Scheduling & Double-Booking Engine (TC-14):**
  - Interactive calendar & timeline grouped chronologically.
  - **Collision Detection Window:** Automatically analyzes existing operatory appointments on the chosen date. If another patient is booked within **±30 minutes**, an animated conflict warning banner alerts the user with the conflicting patient's name, time, and procedure.
- **Patient Profile & Printable Intake Slip:**
  - Detailed modal view with tabs for Demographics, Digital Clinical Notes, X-Ray Radiographs Gallery, and Appointment History.
  - **Printable Medical Slip:** Generates formatted clinic intake slips with clinic letterhead, digital notes & Rx history, X-ray records, and Dr. Ganesh Janjal's signature block.
- **Soft-Delete Lifecycle & Archive (TC-15):**
  - Deleted patients are flagged (`isDeleted = true`) and immediately removed from active queues and CSV exports.
  - An Admin-only **Archive / Trash Tab** allows reviewing deleted patients and restoring them with 1 click.
- **Data Export & Backups (TC-16, TC-17):**
  - **CSV Export:** One-click download of `Dr_Patil_Dentistry_Patients_[Date].csv` with all non-deleted patients, appointment logs, digital notes count, and X-ray records formatted for Excel.
  - **Database Backup:** Complete JSON snapshot backup of users, patients, appointments, digital notes, X-rays, and audit logs.
  - **Database Restore:** Drag-and-drop or upload backup files to restore clinic data instantly.

---

## 🧪 Interactive 19-Test Case Verification Suite

The application includes an interactive automated test runner verifying all 19 test cases specified in Section 6 of the report. Click the **`🧪 QA Tests (TC-01..19)`** button in the top navigation bar to run them in real time:

| Test ID | Test Case | Action / Input | Expected Result | Verified Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Admin login | `admin@drpatil.com` with `admin123` | Admin dashboard opens | **PASSED ✓** |
| **TC-02** | Reception login | `reception1@drpatil.com` with `recep123` | Reception dashboard opens | **PASSED ✓** |
| **TC-03** | Invalid login | Correct email, wrong password | Error shown, no session created | **PASSED ✓** |
| **TC-04** | Mandatory field validation | Submit registration form with Name empty | Form blocked with validation message | **PASSED ✓** |
| **TC-05** | Age validation | Enter age `150` | Rejected (valid range 0-120) | **PASSED ✓** |
| **TC-06** | Phone validation | Enter 9-digit primary phone | Rejected (10 digits required) | **PASSED ✓** |
| **TC-07** | Successful registration | Fill mandatory fields and submit | Patient saved with auto Sr. No | **PASSED ✓** |
| **TC-08** | Photo capture | Attach photo from file/camera | Photo saved and shown on profile | **PASSED ✓** |
| **TC-09** | Grace-window edit | Correct patient name within grace window | Name updated successfully | **PASSED ✓** |
| **TC-10** | Reception privacy | View queue with Receptionist role | Only Sr. No & Name visible (privacy masked) | **PASSED ✓** |
| **TC-11** | Dashboard counts | Register patient & view Admin dashboard | Total Patients count increases by 1 | **PASSED ✓** |
| **TC-12** | Queue filters | Filter by name, date range & payment | Only matching patients displayed | **PASSED ✓** |
| **TC-13** | Payment toggle | Tap patient payment badge | Status switches between Pending and Paid | **PASSED ✓** |
| **TC-14** | Double-booking | Book appointment within 30 min of existing | Overlap warning displayed | **PASSED ✓** |
| **TC-15** | Soft delete | Delete patient from profile | Excluded from queue & exports; kept flagged | **PASSED ✓** |
| **TC-16** | CSV export | Click Export from Export tab | CSV generated with non-deleted patients & logs | **PASSED ✓** |
| **TC-17** | Database backup | Run backup action | Full database snapshot generated | **PASSED ✓** |
| **TC-18** | Logout | Click logout button | Session cleared, Login screen shown | **PASSED ✓** |
| **TC-19** | Offline operation | Disconnect internet / check local storage | Works 100% offline via local DB engine | **PASSED ✓** |

---

## 📂 File Architecture

```
client project/
├── index.html                           # Main web application entry point
├── package.json                         # Project metadata and run scripts
├── server.js                            # Built-in lightweight Node.js HTTP server
├── README.md                            # Complete technical and user manual
├── Client_Project_Report_Template.docx   # Academic project report template
├── css/
│   └── styles.css                       # Clinical Teal design system & responsive styling
└── js/
    ├── seedData.js                      # Realistic initial clinical patient & appointment seed records
    ├── auth.js                          # Salted SHA-256 authentication & RBAC service
    ├── db.js                            # Local transactional database engine (SQLite simulation)
    ├── appointments.js                  # Scheduling engine & ±30-minute collision detector
    ├── export.js                        # CSV generation, database backup/restore & print slip generator
    ├── testRunner.js                    # Automated runner for test cases TC-01 to TC-19
    └── app.js                           # UI orchestration, views controller, modals & audio synthesizer
```

---

## 🔒 Security & Data Privacy Implementation
1. **Salted SHA-256 Password Storage:** Passwords are never stored in plain text. A per-installation cryptographic salt is combined with the password before generating the SHA-256 hash.
2. **Session Security:** Tokenized sessions are maintained in secure browser storage with an automatic 8-hour expiration timeout and explicit invalidation upon logout.
3. **Query-Level Data Masking:** Data segregation is enforced at the data retrieval layer, not merely in CSS. Receptionist queries call `getPatients({ role: 'Reception Desk 1' })` which strips all clinical complaints, contact numbers, and payment details before returning records to the view.
4. **Audit Logging:** Every critical administrative action (login, logout, registration, grace edit, payment toggle, soft delete, and export) is logged with timestamps and user identifiers.

---

### Developed for:
**Dr. Patil's Centre of Advance Dentistry** &nbsp;|&nbsp; Web Technology Lab Project

