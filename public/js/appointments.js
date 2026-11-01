/**
 * Appointment Scheduling & Double-Booking Prevention Module
 * Enforces ±30-minute conflict detection window across clinic appointments (TC-14).
 */

const AppointmentService = (() => {
  // Convert "HH:MM" string to minutes from midnight
  function timeStringToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  // Format minutes from midnight back to 12-hour or 24-hour time string
  function minutesToTimeString(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const displayHrs = hrs % 12 || 12;
    return `${displayHrs}:${String(mins).padStart(2, '0')} ${ampm}`;
  }

  /**
   * Check for double-booking within ±30 minutes window (TC-14)
   * @param {string} date - "YYYY-MM-DD"
   * @param {string} time - "HH:MM"
   * @param {string} dentist - Dentist name
   * @param {string} excludeAptId - Optional ID to ignore when editing
   * @returns {Object} conflict report
   */
  function checkConflict(date, time, dentist = '', excludeAptId = '') {
    if (!date || !time) {
      return { hasConflict: false };
    }

    const candidateMinutes = timeStringToMinutes(time);
    const CONFLICT_WINDOW_MINUTES = 30; // ±30 minutes as specified in report

    // Fetch existing appointments on the target date
    const dayAppointments = window.DentalDB.getAppointments({ date })
      .filter(a => a.status !== 'Cancelled' && a.id !== excludeAptId);

    const conflicts = [];

    for (const apt of dayAppointments) {
      // If dentist is specified, check either matching dentist or general chair conflict
      const aptMinutes = timeStringToMinutes(apt.time);
      const diff = Math.abs(candidateMinutes - aptMinutes);

      if (diff <= CONFLICT_WINDOW_MINUTES) {
        conflicts.push({
          appointment: apt,
          diffMinutes: diff,
          existingTime: apt.time,
          patientName: apt.patientName,
          patientSrNo: apt.patientSrNo,
          dentist: apt.dentist,
          treatment: apt.treatment
        });
      }
    }

    if (conflicts.length > 0) {
      // Find the closest conflict
      conflicts.sort((a, b) => a.diffMinutes - b.diffMinutes);
      const primary = conflicts[0];
      return {
        hasConflict: true,
        conflicts,
        primaryConflict: primary,
        warningMessage: `⚠️ Double-Booking Warning: Overlaps within ${primary.diffMinutes} mins of an existing appointment for ${primary.patientName} (${primary.patientSrNo}) at ${primary.existingTime} with ${primary.dentist}!`
      };
    }

    return {
      hasConflict: false,
      conflicts: [],
      warningMessage: ''
    };
  }

  // Book an appointment with double-booking check
  function scheduleAppointment(data, user, allowConflictOverride = false) {
    const conflictCheck = checkConflict(data.date, data.time, data.dentist);

    if (conflictCheck.hasConflict && !allowConflictOverride) {
      const err = new Error(conflictCheck.warningMessage);
      err.conflictReport = conflictCheck;
      throw err;
    }

    const newApt = window.DentalDB.addAppointment(data, user);
    return {
      appointment: newApt,
      hadConflict: conflictCheck.hasConflict,
      overrideUsed: allowConflictOverride && conflictCheck.hasConflict
    };
  }

  return {
    timeStringToMinutes,
    minutesToTimeString,
    checkConflict,
    scheduleAppointment
  };
})();

window.AppointmentService = AppointmentService;

