// Verification test script
global.window = global;

const storeLocal = {};
const storeSession = {};

global.localStorage = {
  getItem: (k) => storeLocal[k] || null,
  setItem: (k, v) => { storeLocal[k] = String(v); },
  removeItem: (k) => { delete storeLocal[k]; }
};

global.sessionStorage = {
  getItem: (k) => storeSession[k] || null,
  setItem: (k, v) => { storeSession[k] = String(v); },
  removeItem: (k) => { delete storeSession[k]; }
};

require('./js/seedData.js');
require('./js/auth.js');
require('./js/db.js');
require('./js/appointments.js');
require('./js/export.js');
require('./js/testRunner.js');

async function run() {
  console.log("=== Initializing DentalDB ===");
  await window.DentalDB.init();

  console.log("=== Running TC-01 through TC-19 Verification ===");
  const res = await window.TestSuiteRunner.runAllTests((tc, idx, total) => {
    const status = tc.passed ? '✓ PASSED' : '✗ FAILED';
    console.log(`[${tc.id}] ${tc.title.padEnd(45)} | ${status} | ${tc.message}`);
  });

  console.log("\n================================================");
  console.log(`FINAL RESULT: ${res.passed} / ${res.total} Test Cases Passed!`);
  console.log("================================================");

  console.log("\n=== Verifying New Features (Dr. Ganesh Janjal, Digital Notes & X-Rays) ===");

  // 1. Verify Dentist Name
  const adminUser = window.DentalDB.findUserByEmail('admin@drpatil.com');
  if (!adminUser.name.includes('Dr. Ganesh Janjal')) {
    throw new Error('Admin dentist name is not Dr. Ganesh Janjal: ' + adminUser.name);
  }
  console.log('✓ Verified Attending Dentist:', adminUser.name);

  // 2. Verify Digital Notes functionality
  const patient = window.DentalDB.getPatients({ role: 'Admin' })[0];
  const initialNotesCount = (patient.digitalNotes || []).length;
  const newNote = window.DentalDB.addPatientDigitalNote(patient.id, {
    category: 'Endodontic Procedure Note (RCT)',
    tooth: '#46 Lower Molar',
    findings: 'Obturation completed with Gutta Percha and AH Plus sealer. Well condensed apical seal.',
    prescription: 'Tab. Combiflam BD x 2 days'
  }, adminUser);
  console.log('✓ Verified Digital Note Creation:', newNote.id, `(${newNote.category} - Tooth: ${newNote.tooth})`);

  const updatedPatient = window.DentalDB.getPatientById(patient.id, 'Admin');
  if (updatedPatient.digitalNotes.length !== initialNotesCount + 1) {
    throw new Error('Digital note count mismatch after addition');
  }

  // 3. Verify X-Ray Import functionality
  const initialXrayCount = (patient.xrays || []).length;
  const newXray = window.DentalDB.addPatientXray(patient.id, {
    type: 'IOPA (Periapical Radiograph)',
    tooth: '#46 Post-Op',
    dataUrl: 'data:image/svg+xml;utf8,<svg><rect width="100" height="100" fill="black"/></svg>',
    notes: 'Post-obturation IOPA confirming root canal obturation to radiographic apex.'
  }, adminUser);
  console.log('✓ Verified Local X-Ray Import:', newXray.id, `(${newXray.type} - ${newXray.tooth})`);

  const patientWithXray = window.DentalDB.getPatientById(patient.id, 'Admin');
  if (patientWithXray.xrays.length !== initialXrayCount + 1) {
    throw new Error('X-ray count mismatch after import');
  }

  console.log("✓ All Digital Notes & Local Storage X-Ray diagnostic tests passed!");
  console.log("================================================\n");

  if (res.failed > 0) {
    process.exit(1);
  }
}

run().catch(e => {
  console.error("Test execution error:", e);
  process.exit(1);
});

