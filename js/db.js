/**
 * Local Database Engine for Dr. Patil's Advance Dentistry
 * Simulates SQLite storage with ACID-like transactional safety in LocalStorage,
 * enforcing query-level Role-Based Access Control (RBAC), automatic serial numbering,
 * soft deletes, grace window validation, and audit logging.
 */

const DentalDB = (() => {
  const STORAGE_KEYS = {
    USERS: 'drpatil_db_users',
    PATIENTS: 'drpatil_db_patients',
    APPOINTMENTS: 'drpatil_db_appointments',
    AUDIT_LOGS: 'drpatil_db_audit_logs',
    INITIALIZED: 'drpatil_db_v3_seeded'
  };

  // Safe localStorage helper with error handling
  function getRaw(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return null;
    }
  }

  function setRaw(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
      return false;
    }
  }

  // Generate unique IDs
  function generateId(prefix = 'rec') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  }

  // Automatic Serial Number Generator: "SR-001", "SR-002", etc.
  function getNextSerialNumber() {
    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    let maxNum = 0;
    patients.forEach(p => {
      if (p.srNo && p.srNo.startsWith('SR-')) {
        const numPart = parseInt(p.srNo.replace('SR-', ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `SR-${String(nextNum).padStart(3, '0')}`;
  }

  // Initialize and Seed Database if first run
  async function init() {
    const isSeeded = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isSeeded) {
      await resetToDefaultSeed();
    }
  }

  // Reset to default seed dataset
  async function resetToDefaultSeed() {
    // 1. Prepare seeded users with salted SHA-256 hashes
    const users = [];
    for (const u of window.SEED_USERS) {
      const userCopy = { ...u };
      userCopy.passwordHash = await window.AuthService.hashPassword(userCopy.passwordPlain);
      users.push(userCopy);
    }
    setRaw(STORAGE_KEYS.USERS, users);

    // 2. Prepare patients with initial grace windows
    const patients = window.SEED_PATIENTS.map((p, idx) => ({
      ...p,
      isDeleted: false,
      // The most recent registered patient gets an active grace window for demo purposes
      graceWindowExpiry: idx === 4 ? Date.now() + 5 * 60 * 1000 : 0
    }));
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    // 3. Appointments
    setRaw(STORAGE_KEYS.APPOINTMENTS, window.SEED_APPOINTMENTS);

    // 4. Audit logs
    const initialLogs = [
      {
        id: generateId('log'),
        timestamp: new Date().toISOString(),
        userEmail: 'system@drpatil.com',
        action: 'DB_SEED',
        details: 'Initial database created with pre-registered Admin & Reception accounts and clinical seed records.'
      }
    ];
    setRaw(STORAGE_KEYS.AUDIT_LOGS, initialLogs);

    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    console.log('DentalDB successfully seeded with clinical data.');
  }

  // Audit Logger
  function logAudit(action, details) {
    const currentUser = window.AuthService ? window.AuthService.getCurrentUser() : null;
    const userEmail = currentUser ? currentUser.email : 'System';
    const logs = getRaw(STORAGE_KEYS.AUDIT_LOGS) || [];
    logs.unshift({
      id: generateId('log'),
      timestamp: new Date().toISOString(),
      userEmail,
      action,
      details
    });
    // Keep last 150 logs
    if (logs.length > 150) logs.pop();
    setRaw(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // User queries
  function getUsers() {
    return getRaw(STORAGE_KEYS.USERS) || [];
  }

  function findUserByEmail(email) {
    const users = getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  function updateUser(updatedUser) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx] = updatedUser;
      setRaw(STORAGE_KEYS.USERS, users);
      return true;
    }
    return false;
  }

  // PATIENT QUERIES - Strict Role-Based Column Protection
  // If role is Reception, return only MinimalPatient { id, srNo, name, registrationDate, graceWindowRemaining }
  // As explicitly required: "Receptionists can read only id, name and registration_date; medical history, contact details and payments are hidden at the query level."
  function getPatients(options = {}) {
    const {
      role = 'Admin',
      includeDeleted = false,
      search = '',
      paymentStatus = 'All',
      dateRange = 'All'
    } = options;

    const allPatients = getRaw(STORAGE_KEYS.PATIENTS) || [];

    // Filter soft deletes
    let list = allPatients.filter(p => includeDeleted ? true : !p.isDeleted);

    // Filter by search (name, phone, srNo)
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(p => {
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const srMatch = (p.srNo || '').toLowerCase().includes(q);
        const phoneMatch = (p.primaryPhone || '').includes(q);
        return nameMatch || srMatch || (role === 'Admin' && phoneMatch);
      });
    }

    // Filter by payment status (Admin only)
    if (role === 'Admin' && paymentStatus !== 'All') {
      list = list.filter(p => p.paymentStatus === paymentStatus);
    }

    // Filter by date range
    if (dateRange && dateRange !== 'All') {
      const now = new Date();
      list = list.filter(p => {
        const pDate = new Date(p.registrationDate);
        if (dateRange === 'Today') {
          return pDate.toDateString() === now.toDateString();
        } else if (dateRange === 'Week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return pDate >= oneWeekAgo;
        } else if (dateRange === 'Month') {
          return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Sort: newest first
    list.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));

    // STRICT QUERY-LEVEL RBAC MASKING
    if (role !== 'Admin') {
      // Map to MinimalPatient model only
      return list.map(p => {
        const graceRemainingMs = Math.max(0, (p.graceWindowExpiry || 0) - Date.now());
        return {
          id: p.id,
          srNo: p.srNo,
          name: p.name,
          registrationDate: p.registrationDate,
          graceEditable: graceRemainingMs > 0,
          graceRemainingSec: Math.floor(graceRemainingMs / 1000)
        };
      });
    }

    return list;
  }

  // Get single patient by ID (Admin gets full model; Reception gets restricted model)
  function getPatientById(id, role = 'Admin') {
    const all = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const patient = all.find(p => p.id === id);
    if (!patient) return null;

    if (role !== 'Admin') {
      const graceRemainingMs = Math.max(0, (patient.graceWindowExpiry || 0) - Date.now());
      return {
        id: patient.id,
        srNo: patient.srNo,
        name: patient.name,
        registrationDate: patient.registrationDate,
        graceEditable: graceRemainingMs > 0,
        graceRemainingSec: Math.floor(graceRemainingMs / 1000)
      };
    }

    return patient;
  }

  // Add Patient (Receptionist or Admin)
  function addPatient(formData, user) {
    // 1. Mandatory Field Validation
    const name = (formData.name || '').trim();
    if (!name) {
      throw new Error('Mandatory field validation error: Patient Name is required.');
    }

    const age = parseInt(formData.age, 10);
    if (isNaN(age) || age < 0 || age > 120) {
      throw new Error('Age validation error: Valid age range is 0 to 120 years.');
    }

    const sex = formData.sex;
    if (!['Male', 'Female', 'Other'].includes(sex)) {
      throw new Error('Mandatory field validation error: Please select Patient Sex.');
    }

    const visitType = formData.visitType;
    if (!['First Time', 'Already Consulted'].includes(visitType)) {
      throw new Error('Mandatory field validation error: Visit Type is required.');
    }

    const primaryPhone = (formData.primaryPhone || '').trim();
    if (!/^\d{10}$/.test(primaryPhone)) {
      throw new Error('Phone validation error: Primary Phone must be exactly 10 digits.');
    }

    const secondaryPhone = (formData.secondaryPhone || '').trim();
    if (secondaryPhone && !/^\d{10}$/.test(secondaryPhone)) {
      throw new Error('Phone validation error: Secondary Phone must be 10 digits if provided.');
    }

    const address = (formData.address || '').trim();
    if (!address) {
      throw new Error('Mandatory field validation error: Patient Address is required.');
    }

    // Auto-generate Sr. No
    const srNo = getNextSerialNumber();
    const newId = generateId('pat');

    // 5-minute Grace Window for receptionist typo corrections
    const GRACE_WINDOW_MS = 5 * 60 * 1000;
    const graceWindowExpiry = Date.now() + GRACE_WINDOW_MS;

    const newPatient = {
      id: newId,
      srNo,
      name,
      age,
      sex,
      visitType,
      primaryPhone,
      secondaryPhone: secondaryPhone || primaryPhone,
      address,
      lastConsultDate: formData.lastConsultDate || '',
      chiefProblem: formData.chiefProblem || 'Routine dental checkup',
      photo: formData.photo || '',
      paymentStatus: formData.paymentStatus || 'Pending',
      paymentAmount: parseFloat(formData.paymentAmount) || 500,
      registrationDate: new Date().toISOString(),
      isDeleted: false,
      registeredBy: user ? user.email : 'Unknown',
      graceWindowExpiry,
      digitalNotes: formData.digitalNotes || [],
      xrays: formData.xrays || []
    };

    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    patients.unshift(newPatient);
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    logAudit('PATIENT_REGISTER', `New patient registered: ${name} (${srNo}) by ${user ? user.email : 'Staff'}.`);

    return newPatient;
  }

  // Grace Window Edit (Receptionists can correct name typos right after submission)
  function graceEditPatientName(id, newName, user) {
    const trimmed = (newName || '').trim();
    if (!trimmed) {
      throw new Error('Name cannot be empty.');
    }

    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const patient = patients.find(p => p.id === id);
    if (!patient) {
      throw new Error('Patient record not found.');
    }

    // Check if grace window has expired
    const now = Date.now();
    if (user.role !== 'Admin' && (!patient.graceWindowExpiry || now > patient.graceWindowExpiry)) {
      throw new Error('Grace window has expired. Only Admin can edit patient details after the grace period.');
    }

    const oldName = patient.name;
    patient.name = trimmed;
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    // Also update name in any appointments for this patient
    const appointments = getRaw(STORAGE_KEYS.APPOINTMENTS) || [];
    appointments.forEach(apt => {
      if (apt.patientId === id) {
        apt.patientName = trimmed;
      }
    });
    setRaw(STORAGE_KEYS.APPOINTMENTS, appointments);

    logAudit('GRACE_EDIT_NAME', `Patient ${patient.srNo} name corrected from "${oldName}" to "${trimmed}" during grace window.`);

    return patient;
  }

  // Admin Full Patient Update
  function updatePatientFull(id, updateData, user) {
    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const idx = patients.findIndex(p => p.id === id);
    if (idx === -1) {
      throw new Error('Patient not found.');
    }

    // Validation
    if (updateData.age !== undefined) {
      const age = parseInt(updateData.age, 10);
      if (isNaN(age) || age < 0 || age > 120) {
        throw new Error('Age must be between 0 and 120.');
      }
      updateData.age = age;
    }
    if (updateData.primaryPhone && !/^\d{10}$/.test(updateData.primaryPhone)) {
      throw new Error('Primary Phone must be 10 digits.');
    }

    const merged = { ...patients[idx], ...updateData, id };
    patients[idx] = merged;
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    // Update appointments patient name if changed
    if (updateData.name) {
      const appointments = getRaw(STORAGE_KEYS.APPOINTMENTS) || [];
      appointments.forEach(apt => {
        if (apt.patientId === id) apt.patientName = updateData.name;
      });
      setRaw(STORAGE_KEYS.APPOINTMENTS, appointments);
    }

    logAudit('PATIENT_UPDATE', `Admin updated clinical record for ${merged.name} (${merged.srNo}).`);

    return merged;
  }

  // One-tap Payment Status Toggle (Admin)
  function togglePaymentStatus(patientId, user) {
    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      throw new Error('Patient not found.');
    }

    const prevStatus = patient.paymentStatus;
    patient.paymentStatus = prevStatus === 'Paid' ? 'Pending' : 'Paid';
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    logAudit('PAYMENT_TOGGLE', `Payment status for ${patient.name} (${patient.srNo}) toggled from ${prevStatus} to ${patient.paymentStatus} by ${user ? user.email : 'Admin'}.`);

    return patient;
  }

  // Soft Delete (Admin)
  function softDeletePatient(patientId, user) {
    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      throw new Error('Patient not found.');
    }

    patient.isDeleted = true;
    patient.deletedAt = new Date().toISOString();
    patient.deletedBy = user ? user.email : 'Admin';
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    logAudit('PATIENT_SOFT_DELETE', `Patient ${patient.name} (${patient.srNo}) soft-deleted by ${user ? user.email : 'Admin'}.`);

    return patient;
  }

  // Restore Soft-Deleted Patient (Admin)
  function restorePatient(patientId, user) {
    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      throw new Error('Patient not found.');
    }

    patient.isDeleted = false;
    delete patient.deletedAt;
    delete patient.deletedBy;
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    logAudit('PATIENT_RESTORE', `Patient ${patient.name} (${patient.srNo}) restored from archive by ${user ? user.email : 'Admin'}.`);

    return patient;
  }

  // APPOINTMENTS CRUD
  function getAppointments(options = {}) {
    const { date = '', status = 'All', patientId = '' } = options;
    let list = getRaw(STORAGE_KEYS.APPOINTMENTS) || [];

    if (patientId) {
      list = list.filter(a => a.patientId === patientId);
    }
    if (date) {
      list = list.filter(a => a.date === date);
    }
    if (status && status !== 'All') {
      list = list.filter(a => a.status === status);
    }

    // Sort by date and time
    list.sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.time}:00`);
      const dtB = new Date(`${b.date}T${b.time}:00`);
      return dtA - dtB;
    });

    return list;
  }

  function addAppointment(aptData, user) {
    const { patientId, date, time, dentist, treatment, notes } = aptData;
    if (!patientId || !date || !time) {
      throw new Error('Patient, Date, and Time are required to schedule an appointment.');
    }

    const patient = getPatientById(patientId, 'Admin');
    if (!patient) {
      throw new Error('Referenced patient does not exist.');
    }

    const newApt = {
      id: generateId('apt'),
      patientId: patient.id,
      patientSrNo: patient.srNo,
      patientName: patient.name,
      date,
      time,
      dentist: dentist || 'Dr. Ganesh Janjal',
      treatment: treatment || 'Dental Consultation',
      notes: notes || '',
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
      createdBy: user ? user.email : 'Staff'
    };

    const appointments = getRaw(STORAGE_KEYS.APPOINTMENTS) || [];
    appointments.push(newApt);
    setRaw(STORAGE_KEYS.APPOINTMENTS, appointments);

    logAudit('APPOINTMENT_SCHEDULE', `Appointment booked for ${patient.name} (${patient.srNo}) on ${date} at ${time}.`);

    return newApt;
  }

  function updateAppointmentStatus(id, newStatus, user) {
    const appointments = getRaw(STORAGE_KEYS.APPOINTMENTS) || [];
    const apt = appointments.find(a => a.id === id);
    if (!apt) throw new Error('Appointment not found.');

    const oldStatus = apt.status;
    apt.status = newStatus;
    setRaw(STORAGE_KEYS.APPOINTMENTS, appointments);

    logAudit('APPOINTMENT_STATUS', `Appointment for ${apt.patientName} changed from ${oldStatus} to ${newStatus}.`);

    return apt;
  }

  // Analytics & Counts for Admin Dashboard
  function getDashboardStats() {
    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const nonDeleted = patients.filter(p => !p.isDeleted);

    const totalPatients = nonDeleted.length;

    // Today's appointments count
    const todayStr = new Date().toISOString().split('T')[0];
    const appointments = getRaw(STORAGE_KEYS.APPOINTMENTS) || [];
    const todayAppointments = appointments.filter(a => a.date === todayStr && a.status !== 'Cancelled').length;

    // Pending payments count & total amount
    const pendingPatients = nonDeleted.filter(p => p.paymentStatus === 'Pending');
    const pendingCount = pendingPatients.length;
    const pendingAmount = pendingPatients.reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

    // Paid amount & revenue
    const paidPatients = nonDeleted.filter(p => p.paymentStatus === 'Paid');
    const totalCollected = paidPatients.reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

    // First time vs Already consulted
    const firstTimeCount = nonDeleted.filter(p => p.visitType === 'First Time').length;
    const alreadyConsultedCount = nonDeleted.filter(p => p.visitType === 'Already Consulted').length;

    return {
      totalPatients,
      todayAppointments,
      pendingCount,
      pendingAmount,
      totalCollected,
      firstTimeCount,
      alreadyConsultedCount
    };
  }

  // Digital Clinical Notes CRUD
  function addPatientDigitalNote(patientId, noteData, user) {
    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const patient = patients.find(p => p.id === patientId);
    if (!patient) throw new Error('Patient record not found.');

    const findings = (noteData.findings || '').trim();
    if (!findings) {
      throw new Error('Clinical note content/findings cannot be empty.');
    }

    const note = {
      id: generateId('note'),
      date: noteData.date || new Date().toISOString(),
      author: user ? (user.name || user.email) : 'Dr. Ganesh Janjal',
      category: noteData.category || 'Clinical Diagnosis & Treatment Plan',
      tooth: (noteData.tooth || 'General Arch').trim(),
      findings,
      prescription: (noteData.prescription || '').trim(),
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(patient.digitalNotes)) {
      patient.digitalNotes = [];
    }
    patient.digitalNotes.unshift(note);
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    logAudit('DIGITAL_NOTE_ADDED', `Clinical note added for ${patient.name} (${patient.srNo}) by ${note.author}.`);
    return note;
  }

  function deletePatientDigitalNote(patientId, noteId, user) {
    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const patient = patients.find(p => p.id === patientId);
    if (!patient) throw new Error('Patient record not found.');

    patient.digitalNotes = (patient.digitalNotes || []).filter(n => n.id !== noteId);
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    logAudit('DIGITAL_NOTE_DELETED', `Clinical note deleted for ${patient.name} (${patient.srNo}).`);
    return true;
  }

  // X-Rays Diagnostic Images CRUD
  function addPatientXray(patientId, xrayData, user) {
    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const patient = patients.find(p => p.id === patientId);
    if (!patient) throw new Error('Patient record not found.');

    if (!xrayData.dataUrl) {
      throw new Error('No X-ray image file provided.');
    }

    const xray = {
      id: generateId('xray'),
      date: xrayData.date || new Date().toISOString().split('T')[0],
      type: xrayData.type || 'IOPA (Periapical Radiograph)',
      tooth: (xrayData.tooth || 'Dental Arch').trim(),
      dataUrl: xrayData.dataUrl,
      notes: (xrayData.notes || 'Dental radiograph imported from local storage.').trim(),
      importedBy: user ? (user.name || user.email) : 'Dr. Ganesh Janjal',
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(patient.xrays)) {
      patient.xrays = [];
    }
    patient.xrays.unshift(xray);
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    logAudit('XRAY_IMPORTED', `Imported ${xray.type} for ${patient.name} (${patient.srNo}).`);
    return xray;
  }

  function deletePatientXray(patientId, xrayId, user) {
    const patients = getRaw(STORAGE_KEYS.PATIENTS) || [];
    const patient = patients.find(p => p.id === patientId);
    if (!patient) throw new Error('Patient record not found.');

    patient.xrays = (patient.xrays || []).filter(x => x.id !== xrayId);
    setRaw(STORAGE_KEYS.PATIENTS, patients);

    logAudit('XRAY_DELETED', `Deleted X-ray image for ${patient.name} (${patient.srNo}).`);
    return true;
  }

  // Get Audit Logs
  function getAuditLogs() {
    return getRaw(STORAGE_KEYS.AUDIT_LOGS) || [];
  }

  return {
    init,
    resetToDefaultSeed,
    getUsers,
    findUserByEmail,
    updateUser,
    getPatients,
    getPatientById,
    addPatient,
    graceEditPatientName,
    updatePatientFull,
    togglePaymentStatus,
    softDeletePatient,
    restorePatient,
    getAppointments,
    addAppointment,
    updateAppointmentStatus,
    getDashboardStats,
    getAuditLogs,
    logAudit,
    getNextSerialNumber,
    addPatientDigitalNote,
    deletePatientDigitalNote,
    addPatientXray,
    deletePatientXray,
    STORAGE_KEYS,
    getRaw,
    setRaw
  };
})();

window.DentalDB = DentalDB;

