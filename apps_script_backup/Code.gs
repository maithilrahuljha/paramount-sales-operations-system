/**
 * ============================================================================
 * PARAMOUNT MERCHANT NAVY — Apps Script API v4
 * ============================================================================
 *
 * WHAT THIS DOES:
 *   1. On form submit → generates Lead_ID, sets Status, copies to Followup_Tracker
 *   2. Serves as a WEB APP API so the dashboard can UPDATE leads (two-way)
 *   3. Archives Enrolled/Completed/Lost leads to monthly archive sheet
 *
 * DEPLOYMENT (one-time):
 *   1. Open Lead_Register sheet → Extensions → Apps Script
 *   2. Paste this code, Save
 *   3. Click Deploy → New deployment
 *   4. Type = "Web app"
 *   5. Execute as = "Me"
 *   6. Who has access = "Anyone"
 *   7. Click Deploy → Copy the Web App URL
 *   8. Paste that URL into dashboard_ui/config.js → appsScriptUrl
 *
 * TRIGGERS (set once):
 *   Triggers → Add Trigger:
 *     Function: onFormSubmit
 *     Event source: From spreadsheet
 *     Event type: On form submit
 * ============================================================================
 */

// ===================== CONFIG =====================

const CFG = {
  PREFIX: 'PMN',
  DIGITS: 4,
  TIMEZONE: 'Asia/Kolkata',
  // Sheet tab names
  FORM_SHEET: 'Form Responses 1',
  FOLLOWUP_SHEET: 'Followup_Tracker',
  // Column positions in Form Responses 1 (1-based)
  COL: {
    TIMESTAMP: 1,    // A — auto by Google Forms
    LEAD_ID: 2,      // B
    NAME: 3,         // C — Candidate Full Name
    EMAIL: 4,        // D
    PHONE: 5,        // E
    CITY: 6,         // F
    COURSE: 7,       // G
    SOURCE: 8,       // H — How did you hear about us?
    BATCH: 9,        // I
    EDUCATION: 10,   // J
    COUNSELLOR: 11,  // K
    REMARKS: 12,     // L
    STATUS: 13       // M
  },
  DEFAULT_STATUS: 'New Lead',
  ARCHIVE_STATUSES: ['Enrolled', 'Completed', 'Lost'],
  VALID_STATUSES: [
    'New Lead', 'Contacted', 'Interested',
    'Counselling Scheduled', 'Admission Pending',
    'Enrolled', 'Completed', 'Lost'
  ]
};

// ===================== FORM SUBMIT TRIGGER =====================

function onFormSubmit(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CFG.FORM_SHEET) || ss.getActiveSheet();
    var row = e.range.getRow();
    if (row <= 1) return;

    // Generate Lead ID if empty
    var idCell = sheet.getRange(row, CFG.COL.LEAD_ID);
    if (!idCell.getValue()) {
      var id = generateId(sheet);
      idCell.setValue(id);
    }

    // Set default status if empty
    var statusCell = sheet.getRange(row, CFG.COL.STATUS);
    if (!statusCell.getValue()) {
      statusCell.setValue(CFG.DEFAULT_STATUS);
    }

    // Copy to Followup_Tracker
    syncToFollowup(ss, sheet, row);

  } catch (err) {
    Logger.log('onFormSubmit error: ' + err);
  }
}

function generateId(sheet) {
  var year = Utilities.formatDate(new Date(), CFG.TIMEZONE, 'yyyy');
  var prefix = CFG.PREFIX + '-' + year + '-';
  var last = sheet.getLastRow();
  var max = 0;

  if (last > 1) {
    var ids = sheet.getRange(2, CFG.COL.LEAD_ID, last - 1, 1).getValues();
    ids.forEach(function(r) {
      var v = String(r[0]);
      if (v.indexOf(prefix) === 0) {
        var n = parseInt(v.substring(prefix.length), 10);
        if (n > max) max = n;
      }
    });
  }

  var next = max + 1;
  var padded = String(next);
  while (padded.length < CFG.DIGITS) padded = '0' + padded;
  return prefix + padded;
}

function syncToFollowup(ss, formSheet, row) {
  try {
    var fu = ss.getSheetByName(CFG.FOLLOWUP_SHEET);
    if (!fu) {
      fu = ss.insertSheet(CFG.FOLLOWUP_SHEET);
      fu.getRange(1, 1, 1, 10).setValues([[
        'Lead_ID', 'Candidate Full Name', 'Phone Number', 'Course Interested In',
        'Counsellor Assigned', 'Status', 'Last Contact Date',
        'Next Followup Date', 'Priority', 'Notes'
      ]]);
      fu.getRange(1, 1, 1, 10).setBackground('#1a237e').setFontColor('#fff').setFontWeight('bold');
    }

    var data = formSheet.getRange(row, 1, 1, 13).getValues()[0];
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    fu.appendRow([
      data[CFG.COL.LEAD_ID - 1],     // Lead_ID
      data[CFG.COL.NAME - 1],        // Name
      data[CFG.COL.PHONE - 1],       // Phone
      data[CFG.COL.COURSE - 1],      // Course
      data[CFG.COL.COUNSELLOR - 1],  // Counsellor
      data[CFG.COL.STATUS - 1] || CFG.DEFAULT_STATUS, // Status
      '',                             // Last Contact Date
      Utilities.formatDate(tomorrow, CFG.TIMEZONE, 'yyyy-MM-dd'), // Next Followup
      'P2',                           // Priority
      'New lead — initial contact required'  // Notes
    ]);
  } catch (err) {
    Logger.log('syncToFollowup error: ' + err);
  }
}

// ===================== WEB APP API =====================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var action = (e.parameter && e.parameter.action) || '';
  var result;

  try {
    switch (action) {
      case 'getLeads':
        result = apiGetLeads();
        break;
      case 'updateLead':
        result = apiUpdateLead(e.parameter);
        break;
      case 'archiveLead':
        result = apiArchiveLead(e.parameter);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: String(err) };
  }

  var output = ContentService.createTextOutput(JSON.stringify(result));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ---- GET ALL LEADS ----

function apiGetLeads() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CFG.FORM_SHEET) || ss.getActiveSheet();
  var last = sheet.getLastRow();
  if (last <= 1) return { leads: [] };

  var data = sheet.getRange(2, 1, last - 1, 13).getValues();
  var leads = data.map(function(r) {
    return {
      timestamp:  r[0],
      leadId:     r[1],
      name:       r[2],
      email:      r[3],
      phone:      r[4],
      city:       r[5],
      course:     r[6],
      source:     r[7],
      batch:      r[8],
      education:  r[9],
      counsellor: r[10],
      remarks:    r[11],
      status:     r[12] || CFG.DEFAULT_STATUS
    };
  });

  return { leads: leads };
}

// ---- UPDATE LEAD STATUS / REMARKS ----

function apiUpdateLead(params) {
  var leadId   = params.leadId;
  var newStatus = params.status;
  var notes     = params.notes || '';

  if (!leadId) return { error: 'Missing leadId' };
  if (newStatus && CFG.VALID_STATUSES.indexOf(newStatus) === -1) {
    return { error: 'Invalid status: ' + newStatus };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CFG.FORM_SHEET) || ss.getActiveSheet();
  var last = sheet.getLastRow();
  if (last <= 1) return { error: 'No data' };

  var ids = sheet.getRange(2, CFG.COL.LEAD_ID, last - 1, 1).getValues();
  var targetRow = -1;
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === leadId) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow === -1) return { error: 'Lead not found: ' + leadId };

  var ts = Utilities.formatDate(new Date(), CFG.TIMEZONE, 'yyyy-MM-dd HH:mm');

  // Update status
  if (newStatus) {
    sheet.getRange(targetRow, CFG.COL.STATUS).setValue(newStatus);
  }

  // Append notes to remarks
  if (notes) {
    var existing = sheet.getRange(targetRow, CFG.COL.REMARKS).getValue() || '';
    var updated = '[' + ts + '] ' + (newStatus || '') + ': ' + notes + '\n' + existing;
    sheet.getRange(targetRow, CFG.COL.REMARKS).setValue(updated);
  }

  // Also update Followup_Tracker
  updateFollowupStatus(ss, leadId, newStatus, notes, ts);

  // If status is archive-worthy, auto-archive
  if (newStatus && CFG.ARCHIVE_STATUSES.indexOf(newStatus) !== -1) {
    archiveRow(ss, sheet, targetRow, newStatus);
  }

  return { success: true, leadId: leadId, status: newStatus };
}

function updateFollowupStatus(ss, leadId, newStatus, notes, ts) {
  try {
    var fu = ss.getSheetByName(CFG.FOLLOWUP_SHEET);
    if (!fu) return;
    var last = fu.getLastRow();
    if (last <= 1) return;

    var ids = fu.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === leadId) {
        var r = i + 2;
        if (newStatus) fu.getRange(r, 6).setValue(newStatus);  // Status col
        fu.getRange(r, 7).setValue(ts.split(' ')[0]);          // Last Contact Date

        // Set priority based on status
        var p = 'P2';
        if (['Interested', 'Counselling Scheduled', 'Admission Pending'].indexOf(newStatus) !== -1) p = 'P1';
        if (CFG.ARCHIVE_STATUSES.indexOf(newStatus) !== -1) p = 'P3';
        fu.getRange(r, 9).setValue(p);

        if (notes) {
          var old = fu.getRange(r, 10).getValue() || '';
          fu.getRange(r, 10).setValue('[' + ts + '] ' + notes + '\n' + old);
        }
        break;
      }
    }
  } catch (err) {
    Logger.log('updateFollowupStatus error: ' + err);
  }
}

// ---- ARCHIVE ----

function archiveRow(ss, formSheet, row, reason) {
  try {
    var monthTag = Utilities.formatDate(new Date(), CFG.TIMEZONE, 'yyyy_MM');
    var archName = 'Archived_' + monthTag;
    var arch = ss.getSheetByName(archName);
    if (!arch) {
      arch = ss.insertSheet(archName);
      var headers = formSheet.getRange(1, 1, 1, formSheet.getLastColumn()).getValues()[0];
      headers.push('Archived_Date', 'Archive_Reason');
      arch.getRange(1, 1, 1, headers.length).setValues([headers]);
      arch.getRange(1, 1, 1, headers.length).setBackground('#1a237e').setFontColor('#fff').setFontWeight('bold');
    }

    var rowData = formSheet.getRange(row, 1, 1, formSheet.getLastColumn()).getValues()[0];
    var ts = Utilities.formatDate(new Date(), CFG.TIMEZONE, 'yyyy-MM-dd HH:mm');
    rowData.push(ts, reason);
    arch.appendRow(rowData);

    // Delete from main sheet
    formSheet.deleteRow(row);
    Logger.log('Archived ' + rowData[1] + ' → ' + archName);
  } catch (err) {
    Logger.log('archiveRow error: ' + err);
  }
}

function apiArchiveLead(params) {
  return apiUpdateLead(params); // archive happens automatically via status change
}

// ===================== MENU =====================

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🏢 Paramount CRM')
    .addItem('🔄 Backfill Lead IDs', 'backfillIds')
    .addItem('🧪 Test ID Generation', 'testId')
    .addToUi();
}

function backfillIds() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CFG.FORM_SHEET) || ss.getActiveSheet();
  var last = sheet.getLastRow();
  var count = 0;

  for (var r = 2; r <= last; r++) {
    if (!sheet.getRange(r, CFG.COL.LEAD_ID).getValue()) {
      sheet.getRange(r, CFG.COL.LEAD_ID).setValue(generateId(sheet));
      count++;
    }
    if (!sheet.getRange(r, CFG.COL.STATUS).getValue()) {
      sheet.getRange(r, CFG.COL.STATUS).setValue(CFG.DEFAULT_STATUS);
    }
    syncToFollowup(ss, sheet, r);
  }

  SpreadsheetApp.getUi().alert('Done! Backfilled ' + count + ' Lead IDs and synced Followup_Tracker.');
}

function testId() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CFG.FORM_SHEET) || ss.getActiveSheet();
  SpreadsheetApp.getUi().alert('Next ID would be: ' + generateId(sheet));
}
