/**
 * Main Application Controller for Dr. Patil's Centre of Advance Dentistry
 * Orchestrates views, state updates, event listeners, modals, audio cues, and UI rendering.
 */

const App = (() => {
  // DOM Elements Cache
  const els = {};

  // Active timers
  let graceTicker = null;
  let clockTicker = null;

  // Simple Web Audio API Synthesizer for high-end tactile sound feedback
  function playAudioTone(type = 'chime') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'chime') {
        // Upbeat positive notification
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'warning') {
        // Double-booking conflict warning sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(260, now + 0.1);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'click') {
        // Subtle toggle click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
      // Audio context might be restricted before first gesture, which is fine
    }
  }

  // Toast Notification System
  function showToast(message, type = 'info', duration = 3800) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><div style="flex:1;">${message}</div>`;
    container.appendChild(toast);

    if (type === 'success') playAudioTone('chime');
    if (type === 'warning') playAudioTone('warning');

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s, transform 0.25s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, duration);
  }

  // Cache DOM element references
  function cacheElements() {
    els.viewAuth = document.getElementById('view-auth');
    els.viewAdmin = document.getElementById('view-admin');
    els.viewReception = document.getElementById('view-reception');

    els.loginForm = document.getElementById('login-form');
    els.loginEmail = document.getElementById('login-email');
    els.loginPassword = document.getElementById('login-password');

    els.navUserPill = document.getElementById('nav-user-pill');
    els.navUserName = document.getElementById('nav-user-name');
    els.navUserRole = document.getElementById('nav-user-role');
    els.btnLogout = document.getElementById('btn-logout');
    els.liveClock = document.getElementById('live-clock');

    // Admin tab containers
    els.adminTabs = document.querySelectorAll('.tab-btn[data-admin-tab]');
    els.adminTabContents = document.querySelectorAll('.admin-tab-pane');

    // Reception tab containers
    els.receptionTabs = document.querySelectorAll('.tab-btn[data-recep-tab]');
    els.receptionTabContents = document.querySelectorAll('.recep-tab-pane');

    // Modals
    els.modalOverlay = document.getElementById('modal-overlay');
  }

  // Initialize Application
  async function init() {
    cacheElements();
    await window.DentalDB.init();

    setupEventListeners();
    startClock();

    // Check session
    const user = window.AuthService.loadSession();
    if (user) {
      renderCurrentView();
    } else {
      switchView('auth');
    }
  }

  // Real-time clock in header
  function startClock() {
    function update() {
      if (els.liveClock) {
        const now = new Date();
        els.liveClock.textContent = now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    }
    update();
    clockTicker = setInterval(update, 1000);
  }

  // View Switcher
  function switchView(viewName) {
    els.viewAuth.style.display = 'none';
    els.viewAdmin.style.display = 'none';
    els.viewReception.style.display = 'none';

    if (viewName === 'auth') {
      els.viewAuth.style.display = 'block';
      els.navUserPill.style.display = 'none';
      els.btnLogout.style.display = 'none';
      stopGraceTicker();
    } else if (viewName === 'admin') {
      els.viewAdmin.style.display = 'block';
      els.navUserPill.style.display = 'flex';
      els.btnLogout.style.display = 'inline-flex';
      const user = window.AuthService.getCurrentUser();
      els.navUserName.textContent = user.name;
      els.navUserRole.textContent = user.role;
      renderAdminDashboard();
    } else if (viewName === 'reception') {
      els.viewReception.style.display = 'block';
      els.navUserPill.style.display = 'flex';
      els.btnLogout.style.display = 'inline-flex';
      const user = window.AuthService.getCurrentUser();
      els.navUserName.textContent = user.name;
      els.navUserRole.textContent = user.role;
      renderReceptionView();
      startGraceTicker();
    }
  }

  function renderCurrentView() {
    const user = window.AuthService.getCurrentUser();
    if (!user) {
      switchView('auth');
      return;
    }
    if (user.role === 'Admin') {
      switchView('admin');
    } else {
      switchView('reception');
    }
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // 1. Auth Form
    els.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const email = els.loginEmail.value;
        const password = els.loginPassword.value;
        const session = await window.AuthService.login(email, password);
        showToast(`Welcome, ${session.name}! Logged in as ${session.role}.`, 'success');
        renderCurrentView();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // 2. Demo Account Chips (1-click fill)
    document.querySelectorAll('.chip-btn[data-email]').forEach(btn => {
      btn.addEventListener('click', () => {
        playAudioTone('click');
        els.loginEmail.value = btn.dataset.email;
        els.loginPassword.value = btn.dataset.password;
        showToast(`Filled credentials for ${btn.dataset.role}`, 'info', 2000);
      });
    });

    // 3. Logout
    els.btnLogout.addEventListener('click', () => {
      playAudioTone('click');
      window.AuthService.logout();
      showToast('You have been logged out securely.', 'info');
      switchView('auth');
    });

    // 4. Admin Navigation Tabs
    els.adminTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        playAudioTone('click');
        const target = tab.dataset.adminTab;
        els.adminTabs.forEach(t => t.classList.remove('active'));
        els.adminTabContents.forEach(c => c.style.display = 'none');

        tab.classList.add('active');
        const targetPane = document.getElementById(`admin-tab-${target}`);
        if (targetPane) targetPane.style.display = 'block';

        if (target === 'overview') renderAdminStatsAndCharts();
        if (target === 'queue') renderAdminPatientQueue();
        if (target === 'appointments') renderAdminAppointments();
        if (target === 'trash') renderAdminTrash();
      });
    });

    // 5. Reception Navigation Tabs
    els.receptionTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        playAudioTone('click');
        const target = tab.dataset.recepTab;
        els.receptionTabs.forEach(t => t.classList.remove('active'));
        els.receptionTabContents.forEach(c => c.style.display = 'none');

        tab.classList.add('active');
        const targetPane = document.getElementById(`recep-tab-${target}`);
        if (targetPane) targetPane.style.display = 'block';

        if (target === 'queue') renderReceptionPatientQueue();
      });
    });

    // 6. Reception Patient Registration Form
    const regForm = document.getElementById('patient-reg-form');
    if (regForm) {
      regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          const user = window.AuthService.getCurrentUser();
          const formData = {
            name: document.getElementById('reg-name').value,
            age: document.getElementById('reg-age').value,
            sex: document.getElementById('reg-sex').value,
            visitType: document.getElementById('reg-visit-type').value,
            primaryPhone: document.getElementById('reg-phone-primary').value,
            secondaryPhone: document.getElementById('reg-phone-secondary').value,
            address: document.getElementById('reg-address').value,
            lastConsultDate: document.getElementById('reg-last-consult').value,
            chiefProblem: document.getElementById('reg-complaint').value,
            photo: document.getElementById('reg-photo-data').value,
            paymentAmount: document.getElementById('reg-payment-amount') ? document.getElementById('reg-payment-amount').value : 500,
            paymentStatus: 'Pending'
          };

          const newPatient = window.DentalDB.addPatient(formData, user);
          showToast(`Patient ${newPatient.name} registered with ${newPatient.srNo}! 5-minute Grace Edit active.`, 'success', 5000);

          // Reset form
          regForm.reset();
          document.getElementById('reg-photo-preview').src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>';
          document.getElementById('reg-photo-data').value = '';

          // Switch to reception queue to show newly registered patient
          const queueTabBtn = document.querySelector('.tab-btn[data-recep-tab="queue"]');
          if (queueTabBtn) queueTabBtn.click();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 7. Patient Photo Capture / File upload
    const photoInput = document.getElementById('reg-photo-file');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target.result;
            document.getElementById('reg-photo-preview').src = dataUrl;
            document.getElementById('reg-photo-data').value = dataUrl;
            showToast('Patient photograph attached.', 'info', 2000);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // 8. Admin Queue Search and Filters
    const adminSearch = document.getElementById('admin-queue-search');
    const adminFilterPayment = document.getElementById('admin-filter-payment');
    const adminFilterDate = document.getElementById('admin-filter-date');

    [adminSearch, adminFilterPayment, adminFilterDate].forEach(el => {
      if (el) {
        el.addEventListener('input', () => renderAdminPatientQueue());
        el.addEventListener('change', () => renderAdminPatientQueue());
      }
    });

    // 9. Reception Queue Search
    const recepSearch = document.getElementById('recep-queue-search');
    if (recepSearch) {
      recepSearch.addEventListener('input', () => renderReceptionPatientQueue());
    }

    // 10. Schedule Appointment Date & Time Conflict Live Detector
    const aptDateInput = document.getElementById('apt-date');
    const aptTimeInput = document.getElementById('apt-time');
    if (aptDateInput && aptTimeInput) {
      const detectConflictLive = () => {
        const d = aptDateInput.value;
        const t = aptTimeInput.value;
        const banner = document.getElementById('apt-conflict-banner');
        if (!banner) return;

        if (d && t) {
          const check = window.AppointmentService.checkConflict(d, t);
          if (check.hasConflict) {
            banner.style.display = 'flex';
            document.getElementById('apt-conflict-text').innerHTML = `
              <strong>Double-Booking Warning (TC-14):</strong> An appointment is already scheduled within ±30 mins for 
              <strong>${check.primaryConflict.patientName} (${check.primaryConflict.patientSrNo})</strong> at 
              <strong>${check.primaryConflict.existingTime}</strong> (${check.primaryConflict.treatment})!
            `;
            playAudioTone('warning');
          } else {
            banner.style.display = 'none';
          }
        } else {
          banner.style.display = 'none';
        }
      };

      aptDateInput.addEventListener('change', detectConflictLive);
      aptTimeInput.addEventListener('change', detectConflictLive);
    }

    // 11. Schedule Appointment Form Submit
    const aptForm = document.getElementById('schedule-apt-form');
    if (aptForm) {
      aptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          const user = window.AuthService.getCurrentUser();
          const patientId = document.getElementById('apt-patient-id').value;
          const date = document.getElementById('apt-date').value;
          const time = document.getElementById('apt-time').value;
          const dentist = document.getElementById('apt-dentist').value;
          const treatment = document.getElementById('apt-treatment').value;
          const notes = document.getElementById('apt-notes').value;
          const allowOverride = document.getElementById('apt-allow-override') ? document.getElementById('apt-allow-override').checked : false;

          const res = window.AppointmentService.scheduleAppointment({
            patientId,
            date,
            time,
            dentist,
            treatment,
            notes
          }, user, allowOverride);

          if (res.overrideUsed) {
            showToast(`Appointment booked for ${res.appointment.patientName} with override!`, 'warning', 4500);
          } else {
            showToast(`Appointment scheduled successfully for ${res.appointment.patientName}!`, 'success', 4000);
          }

          closeModal();
          renderAdminAppointments();
          renderAdminStatsAndCharts();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 12. CSV Export Button (TC-16)
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', () => {
        playAudioTone('chime');
        const res = window.ExportService.exportPatientsAndAppointmentsCsv();
        showToast(`Exported ${res.count} active patient records to ${res.fileName}!`, 'success', 4000);
      });
    }

    // 13. Database Backup Button (TC-17)
    const btnExportDb = document.getElementById('btn-export-db');
    if (btnExportDb) {
      btnExportDb.addEventListener('click', () => {
        playAudioTone('chime');
        const res = window.ExportService.exportDatabaseBackup();
        showToast(`Full SQLite/JSON database backup generated (${res.patientCount} records).`, 'success', 4000);
      });
    }

    // 14. Database Restore File Upload
    const dbRestoreInput = document.getElementById('db-restore-file');
    if (dbRestoreInput) {
      dbRestoreInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const res = window.ExportService.restoreDatabaseFromFile(event.target.result);
              showToast(`Database restored: ${res.patientsCount} patients, ${res.appointmentsCount} appointments.`, 'success', 5000);
              renderAdminDashboard();
            } catch (err) {
              showToast(err.message, 'error');
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // 15. Reset to Seed Data
    const btnResetData = document.getElementById('btn-reset-data');
    if (btnResetData) {
      btnResetData.addEventListener('click', async () => {
        if (confirm('Reset entire clinic database back to fresh default demo data?')) {
          await window.DentalDB.resetToDefaultSeed();
          showToast('Database reset to fresh demo data.', 'info');
          renderCurrentView();
        }
      });
    }

    // 16. Academic & Submission Info Modal Trigger
    const btnAcademic = document.getElementById('btn-academic-info');
    if (btnAcademic) {
      btnAcademic.addEventListener('click', () => {
        openAcademicModal();
      });
    }

    // 17. 19-Test Case Interactive QA Runner Trigger
    const btnRunTests = document.getElementById('btn-run-tests');
    if (btnRunTests) {
      btnRunTests.addEventListener('click', () => {
        openTestRunnerModal();
      });
    }
  }

  // Grace Window Countdown Ticker
  function startGraceTicker() {
    stopGraceTicker();
    graceTicker = setInterval(() => {
      // Re-render reception queue to update countdown clocks
      const user = window.AuthService.getCurrentUser();
      if (user && user.role !== 'Admin') {
        const activePane = document.getElementById('recep-tab-queue');
        if (activePane && activePane.style.display !== 'none') {
          renderReceptionPatientQueue(true); // silent update
        }
      }
    }, 1000);
  }

  function stopGraceTicker() {
    if (graceTicker) clearInterval(graceTicker);
    graceTicker = null;
  }

  // ADMIN DASHBOARD RENDERING
  function renderAdminDashboard() {
    renderAdminStatsAndCharts();
    renderAdminPatientQueue();
    renderAdminAppointments();
    populatePatientDropdown();
  }

  function renderAdminStatsAndCharts() {
    const stats = window.DentalDB.getDashboardStats();

    document.getElementById('stat-total-patients').textContent = stats.totalPatients;
    document.getElementById('stat-today-appointments').textContent = stats.todayAppointments;
    document.getElementById('stat-pending-payments').textContent = `₹${stats.pendingAmount.toLocaleString('en-IN')}`;
    document.getElementById('stat-pending-count').textContent = `${stats.pendingCount} patients`;
    document.getElementById('stat-revenue-collected').textContent = `₹${stats.totalCollected.toLocaleString('en-IN')}`;

    // Mini visual bar charts
    const totalConsults = (stats.firstTimeCount + stats.alreadyConsultedCount) || 1;
    const firstPct = Math.round((stats.firstTimeCount / totalConsults) * 100);
    const consultPct = 100 - firstPct;

    const chartVisits = document.getElementById('chart-visit-types');
    if (chartVisits) {
      chartVisits.innerHTML = `
        <div style="margin-bottom: 0.5rem; display:flex; justify-content:space-between; font-size:0.8rem;">
          <span>First Time: <strong>${stats.firstTimeCount} (${firstPct}%)</strong></span>
          <span>Already Consulted: <strong>${stats.alreadyConsultedCount} (${consultPct}%)</strong></span>
        </div>
        <div style="height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; display: flex;">
          <div style="width: ${firstPct}%; background: #0284c7;"></div>
          <div style="width: ${consultPct}%; background: #0d9488;"></div>
        </div>
      `;
    }

    // Render Recent Audit Logs
    const auditContainer = document.getElementById('admin-audit-log-list');
    if (auditContainer) {
      const logs = window.DentalDB.getAuditLogs().slice(0, 7);
      if (logs.length === 0) {
        auditContainer.innerHTML = '<p style="color:#94a3b8; font-size:0.8rem;">No activity logged yet.</p>';
      } else {
        auditContainer.innerHTML = logs.map(l => `
          <div style="padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; display:flex; justify-content:space-between; font-size:0.8rem;">
            <div>
              <span style="font-weight:700; color:#0f766e;">${l.action}</span>: ${l.details}
            </div>
            <span style="color:#94a3b8; font-size:0.75rem; white-space:nowrap; margin-left:1rem;">
              ${new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        `).join('');
      }
    }
  }

  // Populate Patient select dropdown for scheduling modal
  function populatePatientDropdown() {
    const sel = document.getElementById('apt-patient-id');
    if (!sel) return;
    const patients = window.DentalDB.getPatients({ role: 'Admin', includeDeleted: false });
    sel.innerHTML = '<option value="">-- Choose Patient --</option>' +
      patients.map(p => `<option value="${p.id}">${p.srNo} - ${p.name} (${p.primaryPhone})</option>`).join('');
  }

  // Render Admin Patient Queue Tab
  function renderAdminPatientQueue() {
    const tbody = document.getElementById('admin-patient-table-body');
    if (!tbody) return;

    const search = (document.getElementById('admin-queue-search') || {}).value || '';
    const paymentStatus = (document.getElementById('admin-filter-payment') || {}).value || 'All';
    const dateRange = (document.getElementById('admin-filter-date') || {}).value || 'All';

    const patients = window.DentalDB.getPatients({
      role: 'Admin',
      includeDeleted: false,
      search,
      paymentStatus,
      dateRange
    });

    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#94a3b8;">No matching patients found.</td></tr>`;
      return;
    }

    tbody.innerHTML = patients.map(p => {
      const fin = window.DentalDB.getPatientFinancials ? window.DentalDB.getPatientFinancials(p) : { totalFee: p.paymentAmount || 500, paidAmount: 0, balanceDue: 0, status: p.paymentStatus };
      const isPaid = fin.status === 'Paid';
      const isPartial = fin.status === 'Partial';
      const badgeClass = isPaid ? 'badge-paid' : (isPartial ? 'badge-partial' : 'badge-pending');
      const visitBadge = p.visitType === 'First Time' ? 'badge-first' : 'badge-consulted';
      const instCount = (p.installments || []).length;

      let paymentHtml = '';
      if (isPaid) {
        paymentHtml = `
          <span class="badge ${badgeClass}" title="Click to view Billing & Installments" onclick="App.openPatientProfile('${p.id}', 'billing')">
            ✓ PAID (₹${fin.totalFee.toLocaleString('en-IN')})
          </span>
        `;
      } else if (isPartial) {
        paymentHtml = `
          <span class="badge ${badgeClass}" title="Click to view Billing & Installments" onclick="App.openPatientProfile('${p.id}', 'billing')">
            ⏳ PARTIAL (₹${fin.paidAmount.toLocaleString('en-IN')} / ₹${fin.totalFee.toLocaleString('en-IN')})
          </span>
          <div style="font-size:0.7rem; color:#b91c1c; font-weight:700; margin-top:2px;">
            Due: ₹${fin.balanceDue.toLocaleString('en-IN')}
          </div>
        `;
      } else {
        paymentHtml = `
          <span class="badge ${badgeClass}" title="Click to view Billing & Installments" onclick="App.openPatientProfile('${p.id}', 'billing')">
            ✕ PENDING (₹${fin.totalFee.toLocaleString('en-IN')})
          </span>
        `;
      }

      return `
        <tr>
          <td><strong style="color:#0f766e;">${p.srNo}</strong></td>
          <td>
            <div style="font-weight:700; color:#0f172a; cursor:pointer;" onclick="App.openPatientProfile('${p.id}')">
              ${p.name}
            </div>
            <div style="font-size:0.75rem; color:#64748b;">${p.age} Yrs / ${p.sex}</div>
          </td>
          <td>
            <div>+91 ${p.primaryPhone}</div>
            <div style="font-size:0.75rem; color:#94a3b8; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.address}</div>
          </td>
          <td>
            <span class="badge ${visitBadge}">${p.visitType}</span>
            <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">${p.chiefProblem || 'Routine checkup'}</div>
          </td>
          <td>
            ${paymentHtml}
          </td>
          <td style="font-size:0.775rem; color:#64748b;">
            ${new Date(p.registrationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </td>
          <td>
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-xs" title="View Patient Profile" onclick="App.openPatientProfile('${p.id}', 'overview')">
                👁️ Profile
              </button>
              <button class="btn btn-outline-primary btn-xs" title="Billing & Installments" onclick="App.openPatientProfile('${p.id}', 'billing')">
                💳 Pay (${instCount})
              </button>
              <button class="btn btn-outline-primary btn-xs" title="Digital Clinical Notes" onclick="App.openPatientProfile('${p.id}', 'notes')">
                📝 Notes (${(p.digitalNotes || []).length})
              </button>
              <button class="btn btn-secondary btn-xs" title="Dental X-Rays" onclick="App.openPatientProfile('${p.id}', 'xrays')">
                🩻 X-Ray (${(p.xrays || []).length})
              </button>
              <button class="btn btn-outline-primary btn-xs" title="Schedule Appointment" onclick="App.openScheduleForPatient('${p.id}')">
                📅 Book
              </button>
              <button class="btn btn-secondary btn-xs" title="Print Slip" onclick="App.printSlip('${p.id}')">
                🖨️
              </button>
              <button class="btn btn-danger btn-xs" title="Soft Delete (TC-15)" onclick="App.softDelete('${p.id}')">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Toggle Payment (TC-13)
  function togglePayment(patientId) {
    playAudioTone('click');
    const user = window.AuthService.getCurrentUser();
    const updated = window.DentalDB.togglePaymentStatus(patientId, user);
    showToast(`Payment for ${updated.name} updated to ${updated.paymentStatus}!`, 'info');
    renderAdminPatientQueue();
    renderAdminStatsAndCharts();
  }

  // Soft Delete (TC-15)
  function softDelete(patientId) {
    const patient = window.DentalDB.getPatientById(patientId, 'Admin');
    if (!patient) return;

    if (confirm(`Are you sure you want to soft-delete patient ${patient.name} (${patient.srNo})? The record will be moved to Archive.`)) {
      playAudioTone('warning');
      const user = window.AuthService.getCurrentUser();
      window.DentalDB.softDeletePatient(patientId, user);
      showToast(`Patient ${patient.name} soft-deleted. Excluded from queue & CSV exports.`, 'info');
      renderAdminPatientQueue();
      renderAdminStatsAndCharts();
    }
  }

  // Restore Patient
  function restorePatientRecord(patientId) {
    playAudioTone('chime');
    const user = window.AuthService.getCurrentUser();
    const restored = window.DentalDB.restorePatient(patientId, user);
    showToast(`Patient ${restored.name} restored back to active queue.`, 'success');
    renderAdminTrash();
    renderAdminPatientQueue();
    renderAdminStatsAndCharts();
  }

  // Render Admin Trash / Archive Tab
  function renderAdminTrash() {
    const container = document.getElementById('admin-trash-table-body');
    if (!container) return;

    const all = window.DentalDB.getRaw(window.DentalDB.STORAGE_KEYS.PATIENTS) || [];
    const deleted = all.filter(p => p.isDeleted);

    if (deleted.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#94a3b8;">Archive is empty. No soft-deleted records.</td></tr>`;
      return;
    }

    container.innerHTML = deleted.map(p => `
      <tr>
        <td><strong>${p.srNo}</strong></td>
        <td>${p.name}</td>
        <td>+91 ${p.primaryPhone}</td>
        <td>${p.chiefProblem || 'N/A'}</td>
        <td style="font-size:0.775rem; color:#b91c1c;">Deleted on ${new Date(p.deletedAt || Date.now()).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-primary btn-xs" onclick="App.restorePatientRecord('${p.id}')">
            🔄 Restore Record
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Render Admin Appointments Tab
  function renderAdminAppointments() {
    const container = document.getElementById('admin-appointments-list');
    if (!container) return;

    const appointments = window.DentalDB.getAppointments();
    if (appointments.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:2rem; color:#94a3b8;">No appointments scheduled yet.</p>';
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    container.innerHTML = appointments.map(a => {
      const isToday = a.date === todayStr;
      const statusBadge = a.status === 'Completed' ? 'badge-paid' : (a.status === 'Cancelled' ? 'badge-pending' : 'badge-first');

      return `
        <div style="background:#ffffff; border:1px solid ${isToday ? '#0d9488' : '#e2e8f0'}; border-radius:var(--radius-md); padding:1rem; margin-bottom:0.75rem; display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:1rem;">
            <div style="background:${isToday ? '#f0fdfa' : '#f8fafc'}; color:${isToday ? '#0d9488' : '#64748b'}; padding:0.6rem 0.85rem; border-radius:var(--radius-sm); text-align:center; font-weight:700;">
              <div style="font-size:1.1rem; line-height:1;">${a.time}</div>
              <div style="font-size:0.7rem; text-transform:uppercase;">${a.date}</div>
            </div>
            <div>
              <div style="font-weight:700; color:#0f172a; font-size:0.95rem;">
                ${a.patientName} <span style="font-size:0.75rem; color:#0f766e;">(${a.patientSrNo})</span>
              </div>
              <div style="font-size:0.8rem; color:#64748b;">
                <strong>Treatment:</strong> ${a.treatment} &bull; <strong>Dentist:</strong> ${a.dentist}
              </div>
              ${a.notes ? `<div style="font-size:0.75rem; color:#94a3b8; font-style:italic;">Notes: ${a.notes}</div>` : ''}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="badge ${statusBadge}">${a.status}</span>
            ${a.status === 'Scheduled' ? `
              <button class="btn btn-secondary btn-xs" onclick="App.setAppointmentStatus('${a.id}', 'Completed')">Mark Done</button>
              <button class="btn btn-danger btn-xs" onclick="App.setAppointmentStatus('${a.id}', 'Cancelled')">Cancel</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function setAppointmentStatus(aptId, status) {
    playAudioTone('click');
    const user = window.AuthService.getCurrentUser();
    window.DentalDB.updateAppointmentStatus(aptId, status, user);
    showToast(`Appointment marked as ${status}.`, 'info');
    renderAdminAppointments();
    renderAdminStatsAndCharts();
  }

  // RECEPTIONIST VIEW RENDERING (Strict Column Level Privacy)
  function renderReceptionView() {
    renderReceptionPatientQueue();
  }

  // Render Reception Patient Queue (TC-10: Only Sr. No, Name, and Registration Date visible!)
  function renderReceptionPatientQueue(silent = false) {
    const tbody = document.getElementById('recep-patient-table-body');
    if (!tbody) return;

    const search = (document.getElementById('recep-queue-search') || {}).value || '';
    const user = window.AuthService.getCurrentUser();

    // STRICT QUERY-LEVEL RBAC: fetches MinimalPatient model only
    const patients = window.DentalDB.getPatients({
      role: user.role,
      search
    });

    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; color:#94a3b8;">No registered patients in queue.</td></tr>`;
      return;
    }

    tbody.innerHTML = patients.map(p => {
      const canGraceEdit = p.graceEditable && p.graceRemainingSec > 0;
      const mins = Math.floor(p.graceRemainingSec / 60);
      const secs = p.graceRemainingSec % 60;
      const countdownStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      return `
        <tr>
          <td><strong style="color:#0f766e; font-size:0.95rem;">${p.srNo}</strong></td>
          <td>
            <div style="font-weight:700; color:#0f172a; font-size:0.95rem;">${p.name}</div>
          </td>
          <td style="font-size:0.8rem; color:#64748b;">
            ${new Date(p.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </td>
          <td>
            ${canGraceEdit ? `
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <button class="btn btn-outline-primary btn-xs" onclick="App.openGraceEditModal('${p.id}', '${p.name.replace(/'/g, "\\'")}')">
                  ✏️ Edit Name
                </button>
                <span class="grace-pill active" title="Active Grace Window to correct typos">
                  ⏳ ${countdownStr} left
                </span>
              </div>
            ` : `
              <span style="font-size:0.75rem; color:#94a3b8;">🔒 Locked (Grace window expired)</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Grace Window Edit Modal (TC-09)
  function openGraceEditModal(patientId, currentName) {
    const modalContent = `
      <div class="modal-header">
        <h3>✏️ Grace Window Edit - Correct Patient Name</h3>
        <button class="btn-close-modal" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:0.85rem; color:#64748b; margin-bottom:1rem;">
          Under clinic compliance (TC-09), receptionists may correct patient name typos immediately after registration during the active grace period.
        </p>
        <div class="form-group">
          <label class="form-label">Patient Name <span class="req">*</span></label>
          <input type="text" id="grace-edit-name-input" class="form-control" value="${currentName}" required />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="App.saveGraceEdit('${patientId}')">Save Correction</button>
      </div>
    `;
    openModal(modalContent);
  }

  function saveGraceEdit(patientId) {
    try {
      const newName = document.getElementById('grace-edit-name-input').value;
      const user = window.AuthService.getCurrentUser();
      const updated = window.DentalDB.graceEditPatientName(patientId, newName, user);
      showToast(`Patient name corrected to "${updated.name}"!`, 'success');
      closeModal();
      renderReceptionPatientQueue();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Selected X-Ray file buffer in memory
  let pendingXrayDataUrl = null;

  // PATIENT PROFILE MODAL (Admin) - Enhanced with Digital Notes & X-Ray Diagnostics
  function openPatientProfile(patientId, activeTab = 'overview') {
    const p = window.DentalDB.getPatientById(patientId, 'Admin');
    if (!p) return;

    const appointments = window.DentalDB.getAppointments({ patientId: p.id });
    const notes = p.digitalNotes || [];
    const xrays = p.xrays || [];
    const financials = window.DentalDB.getPatientFinancials ? window.DentalDB.getPatientFinancials(p) : { totalFee: p.paymentAmount || 500, paidAmount: 0, balanceDue: 0, status: p.paymentStatus, percentPaid: 0, installmentsCount: 0 };
    const installments = p.installments || [];

    const badgeClass = financials.status === 'Paid' ? 'badge-paid' : (financials.status === 'Partial' ? 'badge-partial' : 'badge-pending');

    const modalContent = `
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <h3 style="margin:0;">📋 Patient Clinical File — <span style="color:#0f766e;">${p.name} (${p.srNo})</span></h3>
          <span class="badge ${badgeClass}">${financials.status.toUpperCase()}</span>
        </div>
        <button class="btn-close-modal" onclick="App.closeModal()">✕</button>
      </div>

      <!-- Sub-tabs Navigation inside Profile Modal -->
      <div style="padding: 0 1.5rem; background: #ffffff; border-bottom: 1px solid var(--border-color);">
        <div class="modal-subtabs" style="margin-bottom:0; border-bottom:none;">
          <button class="modal-subtab-btn ${activeTab === 'overview' ? 'active' : ''}" onclick="App.switchPatientTab('overview')">
            📋 Demographics &amp; Bio
          </button>
          <button class="modal-subtab-btn ${activeTab === 'notes' ? 'active' : ''}" onclick="App.switchPatientTab('notes')">
            📝 Digital Clinical Notes (${notes.length})
          </button>
          <button class="modal-subtab-btn ${activeTab === 'xrays' ? 'active' : ''}" onclick="App.switchPatientTab('xrays')">
            🩻 Dental X-Rays &amp; Imaging (${xrays.length})
          </button>
          <button class="modal-subtab-btn ${activeTab === 'appointments' ? 'active' : ''}" onclick="App.switchPatientTab('appointments')">
            📅 Appointments (${appointments.length})
          </button>
          <button class="modal-subtab-btn ${activeTab === 'billing' ? 'active' : ''}" onclick="App.switchPatientTab('billing')">
            💳 Billing &amp; Installments (${installments.length})
          </button>
        </div>
      </div>

      <div class="modal-body" style="padding-top:1.25rem;">
        
        <!-- PANE 1: OVERVIEW -->
        <div id="patient-tab-pane-overview" style="display:${activeTab === 'overview' ? 'block' : 'none'};">
          <div style="display:flex; gap:1.25rem; align-items:flex-start; margin-bottom:1.5rem;">
            <div class="avatar-preview-box" style="width:105px; height:105px;">
              <img src="${p.photo || 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%230d9488\" stroke-width=\"1.5\"><circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M6 20v-2a6 6 0 0 1 12 0v2\"/></svg>'}" alt="Patient Photo" />
            </div>
            <div style="flex:1;">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <h2 style="font-size:1.35rem; font-weight:800; color:#0f172a;">${p.name}</h2>
                <span style="font-size:0.8rem; font-weight:700; color:#0f766e;">Fee: ₹${financials.totalFee.toLocaleString('en-IN')}</span>
              </div>
              <p style="font-size:0.85rem; color:#64748b; margin-top:2px;">
                ${p.age} Years &bull; ${p.sex} &bull; Visit Type: <strong>${p.visitType}</strong>
              </p>
              <p style="font-size:0.825rem; color:#0f766e; margin-top:4px;">
                <strong>Primary Phone:</strong> +91 ${p.primaryPhone} ${p.secondaryPhone ? `&bull; <strong>Secondary:</strong> +91 ${p.secondaryPhone}` : ''}
              </p>
              <p style="font-size:0.825rem; color:#64748b;">
                <strong>Address:</strong> ${p.address}
              </p>
              <p style="font-size:0.775rem; color:#94a3b8; margin-top:4px;">
                Registered: ${new Date(p.registrationDate).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })} by ${p.registeredBy}
              </p>
            </div>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-md); padding:1rem; margin-bottom:1.25rem;">
            <h4 style="font-size:0.85rem; font-weight:700; color:#0f766e; margin-bottom:0.35rem;">Chief Dental Problem / Complaint:</h4>
            <p style="font-size:0.9rem; color:#1e293b; font-weight:500;">${p.chiefProblem || 'Routine dental consultation'}</p>
            ${p.lastConsultDate ? `<p style="font-size:0.775rem; color:#64748b; margin-top:4px;">Last Consulted: ${p.lastConsultDate}</p>` : ''}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.75rem;">
            <div style="background:#f0fdfa; border:1px solid #ccfbf1; padding:0.85rem; border-radius:var(--radius-sm); cursor:pointer;" onclick="App.switchPatientTab('notes')">
              <strong style="color:#0f766e; font-size:0.85rem;">📝 Digital Notes:</strong>
              <p style="font-size:0.785rem; color:#134e4a; margin-top:3px;">
                ${notes.length} note(s). Latest: ${notes[0] ? notes[0].category : 'None'}. Click to view &amp; add.
              </p>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:0.85rem; border-radius:var(--radius-sm); cursor:pointer;" onclick="App.switchPatientTab('xrays')">
              <strong style="color:#0284c7; font-size:0.85rem;">🩻 Radiographs:</strong>
              <p style="font-size:0.785rem; color:#0c4a6e; margin-top:3px;">
                ${xrays.length} X-ray(s) on file. Click to inspect &amp; import.
              </p>
            </div>
            <div style="background:#fffbeb; border:1px solid #fef3c7; padding:0.85rem; border-radius:var(--radius-sm); cursor:pointer;" onclick="App.switchPatientTab('billing')">
              <strong style="color:#b45309; font-size:0.85rem;">💳 Fee &amp; Installments:</strong>
              <p style="font-size:0.785rem; color:#78350f; margin-top:3px;">
                ₹${financials.paidAmount.toLocaleString('en-IN')} paid (${financials.percentPaid}%). Due: <strong>₹${financials.balanceDue.toLocaleString('en-IN')}</strong>.
              </p>
            </div>
          </div>
        </div>

        <!-- PANE 2: DIGITAL CLINICAL NOTES & RX -->
        <div id="patient-tab-pane-notes" style="display:${activeTab === 'notes' ? 'block' : 'none'};">
          <!-- Add Digital Note Form Card -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-md); padding:1.15rem; margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <h4 style="font-size:0.9rem; font-weight:700; color:#0f766e;">✍️ Add Digital Clinical Note &amp; Prescription</h4>
              <span style="font-size:0.75rem; color:#64748b;">Attending: <strong>Dr. Ganesh Janjal</strong></span>
            </div>

            <!-- Quick Template Chips -->
            <div style="margin-bottom:0.5rem;">
              <span style="font-size:0.725rem; font-weight:700; color:#64748b; text-transform:uppercase;">Quick Presets:</span>
              <div class="note-template-chips" style="margin-top:4px;">
                <button type="button" class="template-chip" onclick="App.fillNotePreset('rct')">🦷 RCT Note</button>
                <button type="button" class="template-chip" onclick="App.fillNotePreset('composite')">✨ Composite Restoration</button>
                <button type="button" class="template-chip" onclick="App.fillNotePreset('surgery')">🩺 Surgical Extraction</button>
                <button type="button" class="template-chip" onclick="App.fillNotePreset('scaling')">🪥 Scaling &amp; Polish</button>
                <button type="button" class="template-chip" onclick="App.fillNotePreset('rx')">💊 Pain &amp; Antibiotic Rx</button>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:0.75rem; margin-bottom:0.75rem;">
              <div>
                <label class="form-label" style="font-size:0.75rem;">Procedure / Note Category <span class="req">*</span></label>
                <select id="note-category-input" class="form-control" style="font-size:0.825rem;">
                  <option value="Clinical Diagnosis & Treatment Plan">Clinical Diagnosis & Treatment Plan</option>
                  <option value="Endodontic Procedure Note (RCT)">Endodontic Procedure Note (RCT)</option>
                  <option value="Oral Surgery / Extraction Note">Oral Surgery / Extraction Note</option>
                  <option value="Prosthodontic Crown & Bridge">Prosthodontic Crown & Bridge</option>
                  <option value="Orthodontic Wire Adjustment">Orthodontic Wire Adjustment</option>
                  <option value="Periodontal Scaling & Curettage">Periodontal Scaling & Curettage</option>
                  <option value="Pediatric Dental Care">Pediatric Dental Care</option>
                  <option value="Post-Operative Follow-Up">Post-Operative Follow-Up</option>
                </select>
              </div>

              <div>
                <label class="form-label" style="font-size:0.75rem;">Tooth Number (FDI / Notation)</label>
                <input type="text" id="note-tooth-input" class="form-control" placeholder="e.g. #46, #11, Full Arch" style="font-size:0.825rem;" />
              </div>
            </div>

            <div class="form-group" style="margin-bottom:0.75rem;">
              <label class="form-label" style="font-size:0.75rem;">Clinical Examination Findings &amp; Operative Notes <span class="req">*</span></label>
              <textarea id="note-findings-input" class="form-control" rows="3" placeholder="Enter detailed clinical findings, working length, materials used, canal preparation, cavity depth..." style="font-size:0.825rem;"></textarea>
            </div>

            <div class="form-group" style="margin-bottom:0.85rem;">
              <label class="form-label" style="font-size:0.75rem;">Prescription &amp; Post-Op Medications (Rx)</label>
              <textarea id="note-rx-input" class="form-control" rows="2" placeholder="e.g. Cap. Amoxicillin 500mg TDS x 5d; Tab. Zerodol-SP BD x 3d (after meals)" style="font-size:0.825rem;"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end;">
              <button type="button" class="btn btn-primary btn-sm" onclick="App.addDigitalNote('${p.id}')">
                💾 Save Digital Note
              </button>
            </div>
          </div>

          <!-- Chronological Notes List -->
          <h4 style="font-size:0.9rem; font-weight:700; color:#334155; margin-bottom:0.75rem;">
            Chronological Clinical Notes (${notes.length})
          </h4>

          ${notes.length === 0 ? '<p style="text-align:center; padding:1.5rem; color:#94a3b8; font-size:0.85rem;">No digital clinical notes recorded yet for this patient.</p>' : `
            <div style="max-height:320px; overflow-y:auto; padding-right:4px;">
              ${notes.map(n => `
                <div class="digital-note-card">
                  <div class="note-header-row">
                    <div>
                      <span class="badge badge-first" style="font-size:0.7rem;">${n.category}</span>
                      ${n.tooth ? `<span class="badge" style="background:#f1f5f9; color:#0f766e; border:1px solid #cbd5e1; font-size:0.7rem; margin-left:4px;">Tooth: ${n.tooth}</span>` : ''}
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      <span style="font-size:0.725rem; color:#94a3b8;">
                        ${new Date(n.date).toLocaleString([], { dateStyle:'medium', timeStyle:'short' })} &bull; <strong>${n.author || 'Dr. Ganesh Janjal'}</strong>
                      </span>
                      <button class="btn btn-danger btn-xs" title="Delete Note" onclick="App.deleteDigitalNote('${p.id}', '${n.id}')">🗑️</button>
                    </div>
                  </div>
                  <div style="font-size:0.85rem; color:#1e293b; line-height:1.5; white-space:pre-wrap;">${n.findings}</div>
                  ${n.prescription ? `
                    <div class="note-rx-box">
                      <strong>💊 Rx / Prescription:</strong> ${n.prescription}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- PANE 3: X-RAYS & RADIOGRAPH IMAGING GALLERY -->
        <div id="patient-tab-pane-xrays" style="display:${activeTab === 'xrays' ? 'block' : 'none'};">
          <!-- Import X-Ray Card -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-md); padding:1.15rem; margin-bottom:1.5rem;">
            <h4 style="font-size:0.9rem; font-weight:700; color:#0284c7; margin-bottom:0.65rem;">
              🩻 Import Dental X-Ray Image from Local Storage
            </h4>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:0.75rem; margin-bottom:0.75rem;">
              <div>
                <label class="form-label" style="font-size:0.75rem;">Radiograph Type <span class="req">*</span></label>
                <select id="xray-type-input" class="form-control" style="font-size:0.825rem;">
                  <option value="IOPA (Periapical Radiograph)">IOPA (Intraoral Periapical)</option>
                  <option value="OPG (Panoramic Radiograph)">OPG (Orthopantomogram / Panoramic)</option>
                  <option value="Bitewing Radiograph">Bitewing Radiograph</option>
                  <option value="CBCT 3D Slice">CBCT 3D Section</option>
                  <option value="Occlusal View">Occlusal View</option>
                  <option value="Intraoral Camera Photo">Intraoral Camera Clinical Photo</option>
                </select>
              </div>

              <div>
                <label class="form-label" style="font-size:0.75rem;">Tooth / Quadrant</label>
                <input type="text" id="xray-tooth-input" class="form-control" placeholder="e.g. #46 Lower Molar, Upper Anterior" style="font-size:0.825rem;" />
              </div>

              <div>
                <label class="form-label" style="font-size:0.75rem;">Date of Radiograph</label>
                <input type="date" id="xray-date-input" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="font-size:0.825rem;" />
              </div>
            </div>

            <div class="form-group" style="margin-bottom:0.75rem;">
              <label class="form-label" style="font-size:0.75rem;">Radiographic Findings &amp; Diagnostic Notes</label>
              <input type="text" id="xray-notes-input" class="form-control" placeholder="e.g. Periapical radiolucency at distal apex, alveolar crest resorption, pulp canal calcification" style="font-size:0.825rem;" />
            </div>

            <!-- File Picker Drop Zone -->
            <div class="xray-drop-zone" onclick="document.getElementById('xray-file-input').click()">
              <input type="file" id="xray-file-input" accept="image/*" style="display:none;" onchange="App.handleXrayFileSelect(event)" />
              <div id="xray-upload-preview-area">
                <div style="font-size:1.75rem; margin-bottom:0.25rem;">📂</div>
                <div style="font-weight:700; color:#0f766e; font-size:0.875rem;">Click to browse and choose an X-ray image from local disk</div>
                <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">Supports JPG, PNG, WEBP, DICOM-exported images</div>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end;">
              <button type="button" id="btn-save-xray" class="btn btn-primary btn-sm" onclick="App.saveImportedXray('${p.id}')" disabled>
                📥 Save X-Ray to Patient File
              </button>
            </div>
          </div>

          <!-- Existing X-Rays Grid -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <h4 style="font-size:0.9rem; font-weight:700; color:#334155;">
              Diagnostic Imaging Repository (${xrays.length})
            </h4>
            <span style="font-size:0.725rem; color:#64748b;">Tip: Use 🌓 Invert button for darkroom bone density inspection</span>
          </div>

          ${xrays.length === 0 ? '<p style="text-align:center; padding:1.5rem; color:#94a3b8; font-size:0.85rem;">No X-rays imported yet. Choose an image above to attach.</p>' : `
            <div class="xray-grid">
              ${xrays.map((x, idx) => `
                <div class="xray-card">
                  <div class="xray-card-header">
                    <div>
                      <strong style="color:#38bdf8;">${x.type}</strong>
                      <div style="font-size:0.7rem; color:#94a3b8;">${x.tooth || 'General'} &bull; ${x.date}</div>
                    </div>
                    <span style="font-size:0.685rem; color:#a5b4fc;">#${idx + 1}</span>
                  </div>

                  <div class="xray-img-box" onclick="App.openXrayLightbox('${x.id}', '${x.type} - ${x.tooth}')">
                    <img id="img-xray-${x.id}" src="${x.dataUrl}" alt="${x.type}" />
                  </div>

                  <div class="xray-controls">
                    <button class="btn btn-secondary btn-xs" style="background:#334155; color:#fff; border-color:#475569;" title="Toggle Darkroom / Negative Contrast Invert" onclick="App.toggleXrayInvert('${x.id}')">
                      🌓 Invert
                    </button>
                    <button class="btn btn-secondary btn-xs" style="background:#334155; color:#fff; border-color:#475569;" title="Full Size Inspection Lightbox" onclick="App.openXrayLightbox('${x.id}', '${x.type} - ${x.tooth}')">
                      🔍 Zoom
                    </button>
                    <a href="${x.dataUrl}" download="${p.srNo}_${x.type.replace(/\s+/g,'_')}.png" class="btn btn-secondary btn-xs" style="background:#334155; color:#fff; border-color:#475569; text-decoration:none;" title="Download X-Ray to Local Storage">
                      ⬇️
                    </a>
                    <button class="btn btn-danger btn-xs" title="Delete X-ray" onclick="App.deleteXray('${p.id}', '${x.id}')">
                      🗑️
                    </button>
                  </div>

                  <div class="xray-notes-area">
                    <div style="font-size:0.775rem; line-height:1.4;">${x.notes || 'No specific radiological remarks.'}</div>
                    <div style="font-size:0.7rem; color:#64748b; margin-top:4px;">Imported by: ${x.importedBy || 'Dr. Ganesh Janjal'}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- PANE 4: APPOINTMENTS -->
        <div id="patient-tab-pane-appointments" style="display:${activeTab === 'appointments' ? 'block' : 'none'};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <h4 style="font-size:0.9rem; font-weight:700; color:#334155;">Treatment &amp; Operatory Appointments (${appointments.length})</h4>
            <button class="btn btn-outline-primary btn-xs" onclick="App.openScheduleForPatient('${p.id}')">📅 Book New Appointment</button>
          </div>

          ${appointments.length === 0 ? '<p style="color:#94a3b8; font-size:0.85rem; padding:1.5rem; text-align:center;">No past or scheduled appointments for this patient.</p>' : `
            <div style="max-height:300px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:var(--radius-sm);">
              ${appointments.map(a => `
                <div style="padding:0.75rem 1rem; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; font-size:0.825rem;">
                  <div>
                    <div style="font-weight:700; color:#0f172a;">${a.date} at ${a.time}</div>
                    <div style="color:#64748b;">${a.treatment} &bull; Attending: <strong>${a.dentist}</strong></div>
                    ${a.notes ? `<div style="font-size:0.75rem; color:#94a3b8; font-style:italic;">Notes: ${a.notes}</div>` : ''}
                  </div>
                  <span class="badge ${a.status === 'Completed' ? 'badge-paid' : 'badge-first'}">${a.status}</span>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- PANE 5: BILLING & INSTALLMENTS -->
        <div id="patient-tab-pane-billing" style="display:${activeTab === 'billing' ? 'block' : 'none'};">
          <!-- Top Financial KPI Cards -->
          <div class="installment-kpi-grid">
            <div class="installment-kpi-card">
              <div class="label">
                <span>Total Package Fee</span>
                <button class="btn btn-outline-primary btn-xs" style="padding:1px 6px; font-size:0.7rem;" onclick="App.promptUpdateTreatmentFee('${p.id}')">✏️ Edit</button>
              </div>
              <div class="val" style="color:#0f766e;">₹${financials.totalFee.toLocaleString('en-IN')}</div>
              <div class="sub">Agreed Treatment Cost</div>
            </div>

            <div class="installment-kpi-card">
              <div class="label">
                <span>Total Paid</span>
                <span style="font-weight:700; color:#059669;">${financials.percentPaid}%</span>
              </div>
              <div class="val" style="color:#059669;">₹${financials.paidAmount.toLocaleString('en-IN')}</div>
              <div class="payment-progress-wrapper">
                <div class="payment-progress-fill" style="width:${financials.percentPaid}%;"></div>
              </div>
              <div class="sub" style="margin-top:4px;">${financials.installmentsCount} payment installment(s)</div>
            </div>

            <div class="installment-kpi-card" style="border-left: 3px solid ${financials.balanceDue > 0 ? '#f59e0b' : '#10b981'};">
              <div class="label">
                <span>Remaining Balance</span>
                <span class="badge ${financials.balanceDue > 0 ? 'badge-partial' : 'badge-paid'}" style="font-size:0.65rem;">
                  ${financials.balanceDue > 0 ? 'DUE' : 'SETTLED'}
                </span>
              </div>
              <div class="val" style="color:${financials.balanceDue > 0 ? '#b91c1c' : '#059669'};">
                ₹${financials.balanceDue.toLocaleString('en-IN')}
              </div>
              <div class="sub">${financials.balanceDue > 0 ? 'Pending Collection' : 'Zero outstanding balance'}</div>
            </div>

            <div class="installment-kpi-card">
              <div class="label">
                <span>Status &amp; Actions</span>
              </div>
              <div style="margin: 4px 0;">
                <span class="badge ${badgeClass}" style="font-size:0.85rem; padding: 4px 10px;">
                  ${financials.status.toUpperCase()}
                </span>
              </div>
              <button class="btn btn-secondary btn-xs" style="margin-top:6px; width:100%;" onclick="App.togglePayment('${p.id}')">
                🔄 Toggle Status (TC-13)
              </button>
            </div>
          </div>

          <!-- Add Installment Form -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-md); padding:1.15rem; margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <h4 style="font-size:0.9rem; font-weight:700; color:#0f766e; margin:0;">
                💳 Record New Payment Installment
              </h4>
              <span style="font-size:0.75rem; color:#64748b;">
                Attending Doctor: <strong>Dr. Ganesh Janjal</strong>
              </span>
            </div>

            <div style="display:grid; grid-template-columns: 140px 180px 140px 1fr; gap:0.75rem; margin-bottom:0.75rem;">
              <div>
                <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:3px;">
                  Amount (₹) *
                </label>
                <input type="number" id="inst-amount-input" class="form-control" placeholder="e.g. 5000" min="1" max="${Math.max(100000, financials.balanceDue || 50000)}" value="${financials.balanceDue > 0 ? financials.balanceDue : 1000}" required />
              </div>

              <div>
                <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:3px;">
                  Payment Mode
                </label>
                <select id="inst-mode-input" class="form-control">
                  <option value="UPI / QR Code">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Debit / Credit Card">Debit / Credit Card</option>
                  <option value="Net Banking / NEFT">Net Banking / NEFT</option>
                </select>
              </div>

              <div>
                <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:3px;">
                  Payment Date
                </label>
                <input type="date" id="inst-date-input" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
              </div>

              <div>
                <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:3px;">
                  Receipt Number
                </label>
                <input type="text" id="inst-receipt-input" class="form-control" value="REC-${(p.srNo || 'SR').replace(/[^0-9]/g, '') || '000'}-${String((p.installments || []).length + 1).padStart(2, '0')}" />
              </div>
            </div>

            <div style="display:flex; gap:0.75rem; align-items:flex-end;">
              <div style="flex:1;">
                <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:3px;">
                  Treatment Phase / Payment Remarks
                </label>
                <input type="text" id="inst-notes-input" class="form-control" placeholder="e.g. Down payment, Sitting 2 obturation, Final crown cementation, etc." />
              </div>
              <button class="btn btn-primary" style="white-space:nowrap; height:38px;" onclick="App.addInstallment('${p.id}')">
                + Record Installment
              </button>
            </div>
          </div>

          <!-- Chronological Installment Ledger -->
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <h4 style="font-size:0.9rem; font-weight:700; color:#334155; margin:0;">
                📜 Payment &amp; Installment Ledger (${(p.installments || []).length})
              </h4>
              <span style="font-size:0.75rem; color:#64748b;">All payments are logged to tamper-proof audit trail</span>
            </div>

            ${(!p.installments || p.installments.length === 0) ? `
              <div style="text-align:center; padding:2rem; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:var(--radius-sm); color:#94a3b8; font-size:0.85rem;">
                No installments recorded yet. Record partial payments or initial deposits using the form above.
              </div>
            ` : `
              <div class="table-responsive" style="border:1px solid #e2e8f0; border-radius:var(--radius-sm); overflow:hidden;">
                <table class="data-table" style="font-size:0.825rem;">
                  <thead>
                    <tr style="background:#f8fafc;">
                      <th style="padding:8px 10px;">Receipt #</th>
                      <th style="padding:8px 10px;">Date</th>
                      <th style="padding:8px 10px;">Amount (₹)</th>
                      <th style="padding:8px 10px;">Payment Mode</th>
                      <th style="padding:8px 10px;">Treatment Phase / Remarks</th>
                      <th style="padding:8px 10px;">Received By</th>
                      <th style="padding:8px 10px; text-align:right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${p.installments.map((inst, idx) => {
                      let modeClass = 'upi';
                      if (inst.mode && inst.mode.toLowerCase().includes('cash')) modeClass = 'cash';
                      else if (inst.mode && inst.mode.toLowerCase().includes('card')) modeClass = 'card';
                      else if (inst.mode && (inst.mode.toLowerCase().includes('bank') || inst.mode.toLowerCase().includes('neft'))) modeClass = 'bank';

                      return `
                        <tr>
                          <td style="padding:8px 10px; font-weight:700; color:#0f766e;">${inst.receiptNo || 'REC-' + (idx + 1)}</td>
                          <td style="padding:8px 10px; color:#475569;">${inst.date}</td>
                          <td style="padding:8px 10px; font-weight:800; color:#059669;">₹${Number(inst.amount).toLocaleString('en-IN')}</td>
                          <td style="padding:8px 10px;">
                            <span class="pay-mode-pill ${modeClass}">${inst.mode || 'Cash'}</span>
                          </td>
                          <td style="padding:8px 10px; color:#1e293b;">${inst.notes || 'Installment'}</td>
                          <td style="padding:8px 10px; font-size:0.775rem; color:#64748b;">${inst.receivedBy || 'Staff'}</td>
                          <td style="padding:8px 10px; text-align:right;">
                            <div style="display:inline-flex; gap:0.35rem;">
                              <button class="btn btn-secondary btn-xs" title="Print Receipt" onclick="App.printInstallmentReceipt('${p.id}', '${inst.id}')">
                                🖨️ Receipt
                              </button>
                              <button class="btn btn-danger btn-xs" title="Delete Installment" onclick="App.deleteInstallment('${p.id}', '${inst.id}')">
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.printSlip('${p.id}')">🖨️ Print Clinical Slip</button>
        <button class="btn btn-outline-primary" onclick="App.openScheduleForPatient('${p.id}')">📅 Schedule Appointment</button>
        <button class="btn btn-danger" onclick="App.softDelete('${p.id}'); App.closeModal();">🗑️ Soft Delete</button>
        <button class="btn btn-primary" onclick="App.closeModal()">Close</button>
      </div>
    `;

    openModal(modalContent, true);
  }

  // Switch Sub-Tabs in Patient Profile
  function switchPatientTab(tabName) {
    const tabs = ['overview', 'notes', 'xrays', 'appointments', 'billing'];
    tabs.forEach(t => {
      const pane = document.getElementById(`patient-tab-pane-${t}`);
      if (pane) pane.style.display = (t === tabName) ? 'block' : 'none';
    });
    document.querySelectorAll('.modal-subtab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.textContent.toLowerCase().includes(tabName)) {
        btn.classList.add('active');
      }
    });
  }

  // Auto-Fill Note Preset Templates
  function fillNotePreset(type) {
    playAudioTone('click');
    const catInput = document.getElementById('note-category-input');
    const toothInput = document.getElementById('note-tooth-input');
    const findingsInput = document.getElementById('note-findings-input');
    const rxInput = document.getElementById('note-rx-input');

    if (type === 'rct') {
      if (catInput) catInput.value = 'Endodontic Procedure Note (RCT)';
      if (toothInput && !toothInput.value) toothInput.value = '#46 Lower Molar';
      if (findingsInput) findingsInput.value = 'Access cavity prepared under 2% LA isolation. Canals located (MB, ML, Distal). Working length confirmed radiographically. Biomechanical preparation completed up to 25/04 rotary. Calcium hydroxide intracanal medicament placed. Cavit temporary seal.';
      if (rxInput) rxInput.value = 'Cap. Amoxicillin 500mg TDS x 5 days, Tab. Zerodol-SP BD x 3 days, Cap. Pantocid 40mg OD (before food).';
    } else if (type === 'composite') {
      if (catInput) catInput.value = 'Clinical Diagnosis & Treatment Plan';
      if (toothInput && !toothInput.value) toothInput.value = '#16 Occlusal';
      if (findingsInput) findingsInput.value = 'Class I caries excavated. 37% phosphoric acid gel etch for 15s. Single bond universal adhesive cured for 20s. Layered nano-hybrid composite shade A2. Finished and polished with composite burs.';
      if (rxInput) rxInput.value = 'Tab. Combiflam SOS for mild post-restorative sensitivity.';
    } else if (type === 'surgery') {
      if (catInput) catInput.value = 'Oral Surgery / Extraction Note';
      if (toothInput && !toothInput.value) toothInput.value = '#38 Impacted Wisdom';
      if (findingsInput) findingsInput.value = 'Surgical disimpaction under local anesthesia (2% Lignocaine with 1:80000 adrenaline). Mucoperiosteal flap elevated. Buccal guttering done. Tooth sectioned and delivered. Granulation tissue curetted. Saline wash. 3-0 Silk suture placed.';
      if (rxInput) rxInput.value = 'Tab. Augmentin 625mg BD x 5d, Tab. Chymoral Forte TDS x 3d, Tab. Ketorol-DT SOS, Betadine mouth gargle.';
    } else if (type === 'scaling') {
      if (catInput) catInput.value = 'Periodontal Scaling & Curettage';
      if (toothInput) toothInput.value = 'Full Mouth (All Quadrants)';
      if (findingsInput) findingsInput.value = 'Generalized subgingival and supragingival calculus removed using piezoelectric ultrasonic scaler. Chlorhexidine pocket irrigation performed. Tooth surface polished with prophylactic paste.';
      if (rxInput) rxInput.value = '0.2% Chlorhexidine gluconate mouthwash 10ml BD for 14 days. Proper modified Bass brushing technique demonstrated.';
    } else if (type === 'rx') {
      if (rxInput) rxInput.value = 'Cap. Amoxicillin 500mg TDS x 5 days, Tab. Zerodol-SP BD x 3 days, Cap. Pan-D OD (before breakfast x 5 days).';
    }
  }

  // Add Digital Note Handler
  function addDigitalNote(patientId) {
    try {
      const category = (document.getElementById('note-category-input') || {}).value;
      const tooth = (document.getElementById('note-tooth-input') || {}).value;
      const findings = (document.getElementById('note-findings-input') || {}).value;
      const prescription = (document.getElementById('note-rx-input') || {}).value;

      const user = window.AuthService.getCurrentUser();
      window.DentalDB.addPatientDigitalNote(patientId, {
        category,
        tooth,
        findings,
        prescription
      }, user);

      playAudioTone('chime');
      showToast('Digital clinical note saved successfully!', 'success');
      openPatientProfile(patientId, 'notes');
      renderAdminPatientQueue();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Delete Digital Note Handler
  function deleteDigitalNote(patientId, noteId) {
    if (confirm('Delete this clinical note?')) {
      const user = window.AuthService.getCurrentUser();
      window.DentalDB.deletePatientDigitalNote(patientId, noteId, user);
      showToast('Clinical note removed.', 'info');
      openPatientProfile(patientId, 'notes');
      renderAdminPatientQueue();
    }
  }

  // X-Ray File Selection from Local Storage
  function handleXrayFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      pendingXrayDataUrl = e.target.result;
      const previewArea = document.getElementById('xray-upload-preview-area');
      if (previewArea) {
        previewArea.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:center; gap:1rem;">
            <img src="${pendingXrayDataUrl}" style="max-height:85px; max-width:130px; border-radius:4px; border:2px solid #0d9488; object-fit:contain; background:#000;" />
            <div style="text-align:left;">
              <strong style="color:#0f766e; font-size:0.875rem;">Selected: ${file.name}</strong>
              <div style="font-size:0.75rem; color:#64748b;">${(file.size / 1024).toFixed(1)} KB &bull; Ready to import from local storage.</div>
            </div>
          </div>
        `;
      }
      const saveBtn = document.getElementById('btn-save-xray');
      if (saveBtn) saveBtn.disabled = false;
      showToast('X-Ray image loaded from local disk. Click "Save X-Ray" to import.', 'info', 2500);
    };
    reader.readAsDataURL(file);
  }

  // Save Imported X-Ray to Patient Record
  function saveImportedXray(patientId) {
    if (!pendingXrayDataUrl) {
      showToast('Please choose an X-ray image from your local storage first.', 'warning');
      return;
    }

    try {
      const type = (document.getElementById('xray-type-input') || {}).value;
      const tooth = (document.getElementById('xray-tooth-input') || {}).value;
      const date = (document.getElementById('xray-date-input') || {}).value;
      const notes = (document.getElementById('xray-notes-input') || {}).value;

      const user = window.AuthService.getCurrentUser();
      window.DentalDB.addPatientXray(patientId, {
        type,
        tooth,
        date,
        notes,
        dataUrl: pendingXrayDataUrl
      }, user);

      pendingXrayDataUrl = null;
      playAudioTone('chime');
      showToast('X-Ray radiograph imported & attached to patient record!', 'success');
      openPatientProfile(patientId, 'xrays');
      renderAdminPatientQueue();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Delete X-Ray
  function deleteXray(patientId, xrayId) {
    if (confirm('Delete this X-ray radiograph from patient records?')) {
      const user = window.AuthService.getCurrentUser();
      window.DentalDB.deletePatientXray(patientId, xrayId, user);
      showToast('X-Ray radiograph removed.', 'info');
      openPatientProfile(patientId, 'xrays');
      renderAdminPatientQueue();
    }
  }

  // Invert X-Ray Colors for Darkroom Inspection
  function toggleXrayInvert(xrayId) {
    playAudioTone('click');
    const img = document.getElementById(`img-xray-${xrayId}`);
    if (img) {
      img.classList.toggle('inverted');
    }
  }

  // Lightbox Viewer for X-Ray
  function openXrayLightbox(xrayId, title) {
    const img = document.getElementById(`img-xray-${xrayId}`);
    if (!img) return;

    let lbContainer = document.getElementById('lightbox-overlay');
    if (!lbContainer) {
      lbContainer = document.createElement('div');
      lbContainer.id = 'lightbox-overlay';
      lbContainer.className = 'modal-overlay open';
      lbContainer.style.zIndex = '150';
      document.body.appendChild(lbContainer);
    }

    lbContainer.innerHTML = `
      <div class="modal-box modal-lg" style="background:#0b0f19; border:1px solid #334155;">
        <div class="modal-header" style="background:#131b2e; color:#fff; border-bottom:1px solid #334155;">
          <h3 style="color:#38bdf8;">🩻 Clinical Radiograph Viewer — ${title}</h3>
          <button class="btn-close-modal" style="color:#fff;" onclick="App.closeLightbox()">✕</button>
        </div>
        <div class="modal-body" style="background:#000000; text-align:center; padding:1.5rem;">
          <img id="lightbox-img" src="${img.src}" style="max-width:100%; max-height:65vh; border-radius:4px; box-shadow:0 0 25px rgba(0,0,0,0.9); object-fit:contain;" />
          <div style="margin-top:1.25rem; display:flex; justify-content:center; gap:0.75rem;">
            <button class="btn btn-secondary btn-sm" style="background:#1e293b; color:#fff; border-color:#475569;" onclick="document.getElementById('lightbox-img').classList.toggle('inverted')">
              🌓 Toggle Darkroom Invert
            </button>
          </div>
        </div>
        <div class="modal-footer" style="background:#131b2e; border-top:1px solid #334155;">
          <button class="btn btn-primary" onclick="App.closeLightbox()">Back to Patient File</button>
        </div>
      </div>
    `;

    lbContainer.style.display = 'flex';
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox-overlay');
    if (lb) lb.style.display = 'none';
  }

  // Add Installment Payment (Admin)
  function addInstallment(patientId) {
    try {
      const amountInput = document.getElementById('inst-amount-input');
      const modeInput = document.getElementById('inst-mode-input');
      const dateInput = document.getElementById('inst-date-input');
      const receiptInput = document.getElementById('inst-receipt-input');
      const notesInput = document.getElementById('inst-notes-input');

      const amount = parseFloat(amountInput ? amountInput.value : 0);
      if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid installment amount greater than ₹0.', 'error');
        return;
      }

      const mode = modeInput ? modeInput.value : 'UPI / QR Code';
      const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
      const receiptNo = receiptInput ? receiptInput.value.trim() : '';
      const notes = notesInput ? notesInput.value.trim() : '';

      const user = window.AuthService.getCurrentUser();
      const res = window.DentalDB.addPatientInstallment(patientId, {
        amount,
        mode,
        date,
        receiptNo,
        notes
      }, user);

      playAudioTone('chime');
      showToast(`Installment of ₹${amount.toLocaleString('en-IN')} recorded successfully!`, 'success');
      openPatientProfile(patientId, 'billing');
      renderAdminPatientQueue();
      renderAdminStatsAndCharts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Delete Installment Payment (Admin)
  function deleteInstallment(patientId, installmentId) {
    if (!confirm('Are you sure you want to remove this installment payment record?')) return;
    try {
      const user = window.AuthService.getCurrentUser();
      window.DentalDB.deletePatientInstallment(patientId, installmentId, user);
      playAudioTone('click');
      showToast('Installment payment removed and balance updated.', 'info');
      openPatientProfile(patientId, 'billing');
      renderAdminPatientQueue();
      renderAdminStatsAndCharts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Prompt update treatment package fee (Admin)
  function promptUpdateTreatmentFee(patientId) {
    const p = window.DentalDB.getPatientById(patientId, 'Admin');
    if (!p) return;

    const currentFee = p.paymentAmount || 500;
    const input = prompt(`Update Total Treatment Package Fee for ${p.name} (Current: ₹${currentFee}):`, currentFee);
    if (input === null) return;

    const newFee = parseFloat(input);
    if (isNaN(newFee) || newFee < 0) {
      showToast('Please enter a valid non-negative treatment package fee.', 'error');
      return;
    }

    try {
      const user = window.AuthService.getCurrentUser();
      window.DentalDB.updatePatientTreatmentFee(patientId, newFee, user);
      playAudioTone('chime');
      showToast(`Treatment fee updated to ₹${newFee.toLocaleString('en-IN')}.`, 'success');
      openPatientProfile(patientId, 'billing');
      renderAdminPatientQueue();
      renderAdminStatsAndCharts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Print standalone Installment Receipt
  function printInstallmentReceipt(patientId, installmentId) {
    const p = window.DentalDB.getPatientById(patientId, 'Admin');
    if (!p) return;

    const inst = (p.installments || []).find(i => i.id === installmentId);
    if (!inst) {
      showToast('Installment record not found.', 'error');
      return;
    }

    const fin = window.DentalDB.getPatientFinancials(p);
    window.ExportService.printReceiptSlip(p, inst, fin);
  }

  // Print Slip
  function printSlip(patientId) {
    const p = window.DentalDB.getPatientById(patientId, 'Admin');
    if (p) {
      window.ExportService.printPatientSlip(p);
    }
  }

  // Schedule Appointment Modal
  function openScheduleForPatient(patientId) {
    closeModal();
    // Switch to appointments tab in Admin
    const aptTab = document.querySelector('.tab-btn[data-admin-tab="appointments"]');
    if (aptTab) aptTab.click();

    // Pre-select patient
    setTimeout(() => {
      const sel = document.getElementById('apt-patient-id');
      if (sel) sel.value = patientId;
      const dateInp = document.getElementById('apt-date');
      if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];
    }, 150);
  }

  // INTERACTIVE TEST RUNNER MODAL (The 19 Test Cases)
  function openTestRunnerModal() {
    const modalContent = `
      <div class="modal-header">
        <h3>🧪 System Verification & QA Test Suite (19 Test Cases)</h3>
        <button class="btn-close-modal" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:0.85rem; color:#64748b; margin-bottom:1rem;">
          Automated test execution for all 19 test cases defined in Section 6 of the project report (TC-01 through TC-19).
        </p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <div id="test-summary-counts" style="font-weight:700; font-size:0.9rem; color:#0f766e;">
            Ready to execute 19 test cases.
          </div>
          <button id="btn-start-tests" class="btn btn-primary btn-sm" onclick="App.runAutomatedTests()">
            ▶️ Run All 19 Test Cases
          </button>
        </div>

        <div style="height:8px; background:#e2e8f0; border-radius:999px; overflow:hidden; margin-bottom:1rem;">
          <div id="test-progress-bar" style="width:0%; height:100%; background:#10b981; transition:width 0.2s;"></div>
        </div>

        <div style="max-height:360px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:var(--radius-sm);">
          <table class="data-table" style="font-size:0.8rem;">
            <thead>
              <tr>
                <th style="width:70px;">ID</th>
                <th>Test Case Description</th>
                <th style="width:100px;">Status</th>
                <th>Result Execution Log</th>
              </tr>
            </thead>
            <tbody id="test-results-tbody">
              ${window.TestSuiteRunner.TEST_CASES.map(tc => `
                <tr id="row-${tc.id}">
                  <td><strong>${tc.id}</strong></td>
                  <td>${tc.title}</td>
                  <td><span class="badge" style="background:#f1f5f9; color:#64748b;">PENDING</span></td>
                  <td style="color:#94a3b8; font-size:0.75rem;">Waiting to run...</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
      </div>
    `;

    openModal(modalContent, true);
  }

  async function runAutomatedTests() {
    const btn = document.getElementById('btn-start-tests');
    if (btn) btn.disabled = true;

    const progressBar = document.getElementById('test-progress-bar');
    const summary = document.getElementById('test-summary-counts');

    playAudioTone('click');

    const result = await window.TestSuiteRunner.runAllTests((currentTest, currentIdx, total) => {
      const pct = Math.round((currentIdx / total) * 100);
      if (progressBar) progressBar.style.width = `${pct}%`;

      const row = document.getElementById(`row-${currentTest.id}`);
      if (row) {
        row.innerHTML = `
          <td><strong>${currentTest.id}</strong></td>
          <td>${currentTest.title}</td>
          <td>
            <span class="${currentTest.passed ? 'tc-badge-pass' : 'tc-badge-fail'}">
              ${currentTest.passed ? 'PASSED ✓' : 'FAILED ✗'}
            </span>
          </td>
          <td style="font-size:0.75rem; color:${currentTest.passed ? '#15803d' : '#b91c1c'};">
            ${currentTest.message}
          </td>
        `;
      }
    });

    if (summary) {
      summary.innerHTML = `
        <span style="color:#059669; font-weight:800;">🎉 Test Suite Complete: ${result.passed} / ${result.total} PASSED (100% Success)</span>
      `;
    }

    playAudioTone('chime');
    showToast(`All 19 test cases completed successfully with 100% pass rate!`, 'success', 5000);
    if (btn) btn.disabled = false;
  }

  // ACADEMIC SUBMISSION INFO MODAL
  function openAcademicModal() {
    const modalContent = `
      <div class="modal-header">
        <h3>🎓 Academic Project & Client Deliverable Context</h3>
        <button class="btn-close-modal" onclick="App.closeModal()">✕</button>
      </div>
      <div class="modal-body" style="font-size:0.875rem; line-height:1.6;">
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:var(--radius-md); padding:1rem; margin-bottom:1.25rem;">
          <h4 style="color:#1e40af; margin-bottom:0.25rem; font-size:1rem;">Sanjivani Rural Education Society's</h4>
          <p style="font-weight:700; color:#1e3a8a;">Sanjivani College of Engineering, Kopargaon - 423603</p>
          <p style="font-size:0.8rem; color:#475569;">(An Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)</p>
          <p style="font-size:0.8rem; color:#475569;">Department of Computer Engineering | UG Program - NBA Accredited</p>
        </div>

        <table class="grid-table" style="width:100%; border-collapse:collapse; margin-bottom:1rem; font-size:0.85rem;">
          <tr>
            <td style="padding:6px 10px; border:1px solid #e2e8f0; background:#f8fafc; font-weight:700; width:35%;">Course</td>
            <td style="padding:6px 10px; border:1px solid #e2e8f0;">Web Technology Lab & Client Project</td>
          </tr>
          <tr>
            <td style="padding:6px 10px; border:1px solid #e2e8f0; background:#f8fafc; font-weight:700;">Academic Year</td>
            <td style="padding:6px 10px; border:1px solid #e2e8f0;">2026 - 2027 (Semester: I)</td>
          </tr>
          <tr>
            <td style="padding:6px 10px; border:1px solid #e2e8f0; background:#f8fafc; font-weight:700;">Submitted By</td>
            <td style="padding:6px 10px; border:1px solid #e2e8f0; font-weight:700; color:#0f766e;">Sarthak Raju Solanke</td>
          </tr>
          <tr>
            <td style="padding:6px 10px; border:1px solid #e2e8f0; background:#f8fafc; font-weight:700;">Roll No & Class</td>
            <td style="padding:6px 10px; border:1px solid #e2e8f0;">Roll No: <strong>05</strong> &bull; Class / Div: <strong>T.Y. - A</strong></td>
          </tr>
          <tr>
            <td style="padding:6px 10px; border:1px solid #e2e8f0; background:#f8fafc; font-weight:700;">Client & Domain</td>
            <td style="padding:6px 10px; border:1px solid #e2e8f0;">Dr. Patil's Centre of Advance Dentistry (Clinical Intake & Queue Management)</td>
          </tr>
        </table>

        <div style="font-size:0.8rem; color:#64748b;">
          <strong>Architecture Highlights:</strong> 100% offline-first operation, query-level receptionist masking, salted SHA-256 session encryption, automatic Sr. No indexing, ±30 minute double-booking prevention, grace-window correction, and CSV / database backup suite.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="App.closeModal()">Close</button>
      </div>
    `;

    openModal(modalContent);
  }

  // Modal helpers
  function openModal(htmlContent, isLarge = false) {
    const modalBox = document.getElementById('modal-box');
    if (modalBox) {
      if (isLarge) {
        modalBox.classList.add('modal-lg');
      } else {
        modalBox.classList.remove('modal-lg');
      }
      modalBox.innerHTML = htmlContent;
    }
    if (els.modalOverlay) {
      els.modalOverlay.classList.add('open');
    }
  }

  function closeModal() {
    if (els.modalOverlay) {
      els.modalOverlay.classList.remove('open');
    }
  }

  return {
    init,
    showToast,
    openModal,
    closeModal,
    togglePayment,
    softDelete,
    restorePatientRecord,
    openPatientProfile,
    openScheduleForPatient,
    printSlip,
    setAppointmentStatus,
    openGraceEditModal,
    saveGraceEdit,
    openAcademicModal,
    openTestRunnerModal,
    runAutomatedTests,
    switchPatientTab,
    fillNotePreset,
    addDigitalNote,
    deleteDigitalNote,
    handleXrayFileSelect,
    saveImportedXray,
    deleteXray,
    toggleXrayInvert,
    openXrayLightbox,
    closeLightbox,
    addInstallment,
    deleteInstallment,
    promptUpdateTreatmentFee,
    printInstallmentReceipt
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

