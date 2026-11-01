/**
 * Export and Backup Service
 * Handles CSV generation for non-deleted patients + appointment logs (TC-16),
 * Full database JSON backup & restore (TC-17), and printable clinical intake slips.
 */

const ExportService = (() => {
  // Helper to trigger browser file download
  function downloadBlob(content, fileName, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Escape field for CSV
  function escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Export all non-deleted patients with appointment logs as CSV (TC-16)
   */
  function exportPatientsAndAppointmentsCsv() {
    const patients = window.DentalDB.getPatients({ role: 'Admin', includeDeleted: false });
    const appointments = window.DentalDB.getAppointments();

    const headers = [
      'Serial No',
      'Patient Name',
      'Age',
      'Sex',
      'Visit Type',
      'Primary Phone',
      'Secondary Phone',
      'Address',
      'Chief Dental Complaint',
      'Last Consultation Date',
      'Payment Status',
      'Payment Amount (INR)',
      'Registration Date',
      'Registered By',
      'Total Appointments',
      'Appointment History / Log',
      'Digital Notes Count',
      'Latest Digital Note & Rx',
      'X-Ray Radiographs Count'
    ];

    const rows = [headers.join(',')];

    patients.forEach(p => {
      // Find all appointments for this patient
      const patientApts = appointments.filter(a => a.patientId === p.id);
      const aptSummary = patientApts
        .map(a => `[${a.date} ${a.time} - ${a.treatment} (${a.status})]`)
        .join('; ') || 'No scheduled appointments';

      const notes = p.digitalNotes || [];
      const latestNote = notes.length > 0
        ? `[${notes[0].category} - Tooth ${notes[0].tooth}]: ${notes[0].findings}${notes[0].prescription ? ' | Rx: ' + notes[0].prescription : ''}`
        : 'No notes recorded';

      const row = [
        escapeCsv(p.srNo),
        escapeCsv(p.name),
        escapeCsv(p.age),
        escapeCsv(p.sex),
        escapeCsv(p.visitType),
        escapeCsv(p.primaryPhone),
        escapeCsv(p.secondaryPhone),
        escapeCsv(p.address),
        escapeCsv(p.chiefProblem),
        escapeCsv(p.lastConsultDate || 'N/A'),
        escapeCsv(p.paymentStatus),
        escapeCsv(p.paymentAmount || 0),
        escapeCsv(new Date(p.registrationDate).toLocaleDateString()),
        escapeCsv(p.registeredBy),
        escapeCsv(patientApts.length),
        escapeCsv(aptSummary),
        escapeCsv(notes.length),
        escapeCsv(latestNote),
        escapeCsv((p.xrays || []).length)
      ];

      rows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n'); // UTF-8 BOM for Excel
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Dr_Patil_Dentistry_Patients_${dateStr}.csv`;

    downloadBlob(csvContent, fileName, 'text/csv;charset=utf-8;');

    if (window.DentalDB && window.DentalDB.logAudit) {
      window.DentalDB.logAudit('CSV_EXPORT', `Exported CSV of ${patients.length} active patients with appointment logs.`);
    }

    return { count: patients.length, fileName };
  }

  /**
   * Export Full SQLite / Local Database Backup (TC-17)
   */
  function exportDatabaseBackup() {
    const backupData = {
      clinic: "Dr. Patil's Centre of Advance Dentistry",
      schemaVersion: '2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: window.AuthService.getCurrentUser() ? window.AuthService.getCurrentUser().email : 'Admin',
      database: {
        users: window.DentalDB.getUsers(),
        patients: window.DentalDB.getRaw(window.DentalDB.STORAGE_KEYS.PATIENTS) || [],
        appointments: window.DentalDB.getRaw(window.DentalDB.STORAGE_KEYS.APPOINTMENTS) || [],
        auditLogs: window.DentalDB.getRaw(window.DentalDB.STORAGE_KEYS.AUDIT_LOGS) || []
      }
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `dr_patil_clinic_backup_${dateStr}.json`;

    downloadBlob(jsonStr, fileName, 'application/json');

    if (window.DentalDB && window.DentalDB.logAudit) {
      window.DentalDB.logAudit('DB_BACKUP', `Full database backup generated (${backupData.database.patients.length} patients).`);
    }

    return { patientCount: backupData.database.patients.length, fileName };
  }

  /**
   * Restore Database from backup JSON file
   */
  function restoreDatabaseFromFile(fileContent) {
    try {
      const data = JSON.parse(fileContent);
      if (!data.database || !Array.isArray(data.database.patients) || !Array.isArray(data.database.users)) {
        throw new Error('Invalid backup file schema. Missing essential tables.');
      }

      window.DentalDB.setRaw(window.DentalDB.STORAGE_KEYS.USERS, data.database.users);
      window.DentalDB.setRaw(window.DentalDB.STORAGE_KEYS.PATIENTS, data.database.patients);
      window.DentalDB.setRaw(window.DentalDB.STORAGE_KEYS.APPOINTMENTS, data.database.appointments || []);
      if (data.database.auditLogs) {
        window.DentalDB.setRaw(window.DentalDB.STORAGE_KEYS.AUDIT_LOGS, data.database.auditLogs);
      }

      window.DentalDB.logAudit('DB_RESTORE', `Database restored from backup dated ${data.exportedAt || 'Unknown'}.`);

      return {
        success: true,
        patientsCount: data.database.patients.length,
        appointmentsCount: (data.database.appointments || []).length
      };
    } catch (e) {
      console.error('Restore error:', e);
      throw new Error(`Failed to restore database: ${e.message}`);
    }
  }

  /**
   * Generate Printable HTML Patient Intake Slip
   */
  function printPatientSlip(patient) {
    if (!patient) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Please allow popups to print the patient slip.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const appointments = window.DentalDB.getAppointments({ patientId: patient.id });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Intake Slip - ${patient.srNo} - ${patient.name}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
          }
          .header {
            border-bottom: 3px double #0d9488;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .logo-area h1 {
            color: #0f766e;
            margin: 0 0 4px 0;
            font-size: 22px;
            letter-spacing: -0.5px;
          }
          .logo-area p {
            margin: 0;
            font-size: 13px;
            color: #64748b;
          }
          .slip-badge {
            background: #f0fdfa;
            border: 1px solid #0d9488;
            color: #0f766e;
            padding: 6px 14px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 14px;
            text-align: right;
          }
          .slip-badge .sr {
            font-size: 18px;
            color: #0d9488;
          }
          .grid-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .grid-table td, .grid-table th {
            padding: 9px 12px;
            border: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .grid-table th {
            background: #f8fafc;
            text-align: left;
            width: 28%;
            font-weight: 600;
            color: #334155;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f766e;
            margin: 18px 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .rx-box {
            border: 1px dashed #cbd5e1;
            background: #fafafa;
            height: 140px;
            padding: 10px;
            margin-bottom: 25px;
            border-radius: 4px;
            font-size: 12px;
            color: #94a3b8;
          }
          .footer-sign {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding-top: 15px;
          }
          .sign-line {
            width: 200px;
            border-top: 1px solid #334155;
            text-align: center;
            font-size: 12px;
            padding-top: 4px;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <h1>Dr. Patil's Centre of Advance Dentistry</h1>
            <p>Advanced Micro-Endodontics, Implantology & Aesthetic Dental Care</p>
            <p>Station Road, Near Shivaji Chowk, Kopargaon - 423603 | Ph: +91 98220 00000</p>
          </div>
          <div class="slip-badge">
            <div>PATIENT INTAKE SLIP</div>
            <div class="sr">${patient.srNo}</div>
          </div>
        </div>

        <table class="grid-table">
          <tr>
            <th>Full Name</th>
            <td style="font-weight:700; font-size:15px; color:#0f766e;">${patient.name}</td>
            <th>Date & Time</th>
            <td>${todayStr}</td>
          </tr>
          <tr>
            <th>Age & Sex</th>
            <td>${patient.age} Yrs / ${patient.sex}</td>
            <th>Visit Type</th>
            <td><strong>${patient.visitType}</strong></td>
          </tr>
          <tr>
            <th>Primary Phone</th>
            <td>+91 ${patient.primaryPhone}</td>
            <th>Secondary Phone</th>
            <td>+91 ${patient.secondaryPhone || 'N/A'}</td>
          </tr>
          <tr>
            <th>Residential Address</th>
            <td colspan="3">${patient.address}</td>
          </tr>
          <tr>
            <th>Chief Complaint / Problem</th>
            <td colspan="3" style="color:#b91c1c; font-weight:600;">${patient.chiefProblem || 'Routine Examination'}</td>
          </tr>
          <tr>
            <th>Payment Status</th>
            <td>
              <span style="font-weight:700; color:${patient.paymentStatus === 'Paid' ? '#059669' : '#d97706'}">
                ${patient.paymentStatus.toUpperCase()} (₹${patient.paymentAmount || 500})
              </span>
            </td>
            <th>Consultation Desk</th>
            <td>Dr. Ganesh Janjal (Cabin 1)</td>
          </tr>
        </table>

        <div class="section-title">Clinical Findings & Digital Doctor Notes</div>
        <div class="rx-box" style="height:auto; min-height:100px;">
          ${(patient.digitalNotes && patient.digitalNotes.length > 0) ? `
            <div style="font-size:12px; color:#1e293b;">
              ${patient.digitalNotes.map(n => `
                <div style="margin-bottom:8px; border-bottom:1px dashed #cbd5e1; padding-bottom:6px;">
                  <span style="font-weight:700; color:#0f766e;">[${n.category} - Tooth: ${n.tooth}]</span> (${new Date(n.date).toLocaleDateString()}):
                  <div>${n.findings}</div>
                  ${n.prescription ? `<div style="margin-top:3px; color:#b91c1c; font-weight:600;">Rx: ${n.prescription}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : `
            <span style="color:#94a3b8;">[ No digital clinical notes recorded yet. ]</span>
          `}
        </div>

        ${(patient.xrays && patient.xrays.length > 0) ? `
          <div class="section-title">Diagnostic Dental Radiographs (X-Rays on File: ${patient.xrays.length})</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
            ${patient.xrays.map(x => `
              <div style="border:1px solid #cbd5e1; border-radius:4px; padding:6px; background:#f8fafc; font-size:11px; max-width:220px;">
                <div style="font-weight:700; color:#0369a1;">${x.type}</div>
                <div style="color:#64748b;">Tooth: ${x.tooth} &bull; ${x.date}</div>
                <div style="font-size:10px; color:#334155; margin-top:2px;">${x.notes}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="footer-sign">
          <div class="sign-line">Receptionist Signature</div>
          <div class="sign-line">Dr. Ganesh Janjal<br/><span style="font-size:10px; color:#64748b;">BDS, MDS Oral & Maxillofacial</span></div>
        </div>

        <div class="no-print" style="margin-top: 25px; text-align: center;">
          <button onclick="window.print()" style="background:#0d9488; color:#fff; border:none; padding:10px 24px; border-radius:6px; font-weight:700; cursor:pointer; font-size:14px;">
            🖨️ Print Slip Now
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  return {
    exportPatientsAndAppointmentsCsv,
    exportDatabaseBackup,
    restoreDatabaseFromFile,
    printPatientSlip
  };
})();

window.ExportService = ExportService;

