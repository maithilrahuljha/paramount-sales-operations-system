/**
 * Paramount Merchant Navy — Apps Script v7
 *
 * FIXES:
 *   1. onFormSubmit auto-archives if form status is Enrolled/Completed/Lost
 *   2. syncFollowup sets correct priority based on actual status
 *   3. updateLead also removes the Followup_Tracker row when archiving
 *   4. Followup_Tracker stays clean — no ghost entries
 */

var TZ = 'Asia/Kolkata';
var PREFIX = 'PMN';
var DIGITS = 4;
var ARCHIVE_STATUSES = ['Enrolled', 'Completed', 'Lost'];

// ============ FIND COLUMNS BY NAME ============

function findColumns(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).toLowerCase().trim();
    var c = i + 1;
    if (h === 'timestamp') cols.timestamp = c;
    else if (h.indexOf('lead') !== -1 && h.indexOf('id') !== -1) cols.leadId = c;
    else if (h.indexOf('name') !== -1 && (h.indexOf('candidate') !== -1 || h.indexOf('full') !== -1 || h === 'name')) cols.name = c;
    else if (h.indexOf('email') !== -1) cols.email = c;
    else if (h.indexOf('phone') !== -1 || h.indexOf('mobile') !== -1 || h.indexOf('contact') !== -1) cols.phone = c;
    else if (h.indexOf('city') !== -1 || h.indexOf('location') !== -1) cols.city = c;
    else if (h.indexOf('course') !== -1) cols.course = c;
    else if (h.indexOf('hear') !== -1 || h.indexOf('source') !== -1) cols.source = c;
    else if (h.indexOf('batch') !== -1) cols.batch = c;
    else if (h.indexOf('education') !== -1 || h.indexOf('qualification') !== -1) cols.education = c;
    else if (h.indexOf('counsell') !== -1 || h.indexOf('counselor') !== -1 || h.indexOf('assigned') !== -1) cols.counsellor = c;
    else if (h.indexOf('remark') !== -1 || h.indexOf('comment') !== -1 || h.indexOf('additional') !== -1 || h.indexOf('notes') !== -1) cols.remarks = c;
    else if (h.indexOf('status') !== -1) cols.status = c;
  }
  return cols;
}

// ============ PRIORITY HELPER ============

function statusToPriority(status) {
  if (['Interested', 'Counselling Scheduled', 'Admission Pending'].indexOf(status) !== -1) return 'P1';
  if (ARCHIVE_STATUSES.indexOf(status) !== -1) return 'P3';
  return 'P2'; // New Lead, Contacted
}

// ============ FORM SUBMIT TRIGGER ============

function onFormSubmit(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = e.range.getSheet();
    var row = e.range.getRow();
    if (row <= 1) return;
    var cols = findColumns(sheet);

    // Generate Lead ID
    var leadId = '';
    if (cols.leadId) {
      var idCell = sheet.getRange(row, cols.leadId);
      if (!idCell.getValue()) {
        leadId = generateId(sheet, cols.leadId);
        idCell.setValue(leadId);
      } else {
        leadId = String(idCell.getValue());
      }
    }

    // Set default status only if empty (form already sets it)
    var status = '';
    if (cols.status) {
      var stCell = sheet.getRange(row, cols.status);
      status = String(stCell.getValue()).trim();
      if (!status) {
        status = 'New Lead';
        stCell.setValue(status);
      }
    }

    // If status is already Enrolled/Completed/Lost → archive immediately
    // (user submitted form with a final status)
    if (ARCHIVE_STATUSES.indexOf(status) !== -1) {
      archiveRow(ss, sheet, row, status, cols);
      // Do NOT sync to followup — it's already closed
      return;
    }

    // Otherwise sync to Followup_Tracker
    syncFollowup(ss, sheet, row, cols, leadId, status);

  } catch (err) { Logger.log('onFormSubmit: ' + err); }
}

// ============ ID GENERATION ============

function generateId(sheet, leadIdCol) {
  var year = Utilities.formatDate(new Date(), TZ, 'yyyy');
  var pfx = PREFIX + '-' + year + '-';
  var last = sheet.getLastRow();
  var max = 0;
  if (last > 1) {
    var ids = sheet.getRange(2, leadIdCol, last - 1, 1).getValues();
    ids.forEach(function(r) {
      var v = String(r[0]);
      if (v.indexOf(pfx) === 0) {
        var n = parseInt(v.substring(pfx.length), 10);
        if (n > max) max = n;
      }
    });
  }
  var next = String(max + 1);
  while (next.length < DIGITS) next = '0' + next;
  return pfx + next;
}

// ============ FOLLOWUP SYNC ============

function syncFollowup(ss, sheet, row, cols, leadId, status) {
  try {
    var fu = ss.getSheetByName('Followup_Tracker');
    if (!fu) {
      fu = ss.insertSheet('Followup_Tracker');
      fu.getRange(1, 1, 1, 8).setValues([['Lead_ID', 'Name', 'Phone', 'Course', 'Counsellor', 'Status', 'Priority', 'Notes']]);
      fu.getRange(1, 1, 1, 8).setBackground('#1a237e').setFontColor('#fff').setFontWeight('bold');
    }

    var gv = function(col) { return cols[col] ? sheet.getRange(row, cols[col]).getValue() : ''; };
    var id = leadId || gv('leadId');
    var st = status || gv('status') || 'New Lead';

    // Check if this lead already exists in Followup_Tracker (avoid duplicates)
    var fuLast = fu.getLastRow();
    if (fuLast > 1) {
      var existingIds = fu.getRange(2, 1, fuLast - 1, 1).getValues();
      for (var i = 0; i < existingIds.length; i++) {
        if (String(existingIds[i][0]).trim() === String(id).trim()) {
          // Already exists — update instead of adding duplicate
          fu.getRange(i + 2, 6).setValue(st);
          fu.getRange(i + 2, 7).setValue(statusToPriority(st));
          return;
        }
      }
    }

    // New entry
    fu.appendRow([
      id,
      gv('name'),
      gv('phone'),
      gv('course'),
      gv('counsellor'),
      st,
      statusToPriority(st),
      'New lead'
    ]);
  } catch (e) { Logger.log('syncFollowup: ' + e); }
}

// ============ REMOVE FROM FOLLOWUP ============

function removeFromFollowup(ss, leadId) {
  try {
    var fu = ss.getSheetByName('Followup_Tracker');
    if (!fu) return;
    var fuLast = fu.getLastRow();
    if (fuLast <= 1) return;

    var fuIds = fu.getRange(2, 1, fuLast - 1, 1).getValues();
    for (var i = fuIds.length - 1; i >= 0; i--) {
      if (String(fuIds[i][0]).trim() === leadId) {
        fu.deleteRow(i + 2);
        Logger.log('Removed ' + leadId + ' from Followup_Tracker');
        return;
      }
    }
  } catch (e) { Logger.log('removeFromFollowup: ' + e); }
}

// ============ ARCHIVE ============

function archiveRow(ss, sheet, row, reason, cols) {
  try {
    var ts = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
    var archName = 'Archived_' + Utilities.formatDate(new Date(), TZ, 'yyyy_MM');
    var arch = ss.getSheetByName(archName);
    if (!arch) {
      arch = ss.insertSheet(archName);
      var hdrs = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      hdrs.push('Archived_Date', 'Reason');
      arch.getRange(1, 1, 1, hdrs.length).setValues([hdrs]);
      arch.getRange(1, 1, 1, hdrs.length).setBackground('#1a237e').setFontColor('#fff').setFontWeight('bold');
    }

    var rd = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    rd.push(ts, reason);
    arch.appendRow(rd);

    // Get leadId before deleting row
    var leadId = cols.leadId ? String(sheet.getRange(row, cols.leadId).getValue()).trim() : '';

    // Delete from main sheet
    sheet.deleteRow(row);
    Logger.log('Archived row ' + row + ' → ' + archName + ' (reason: ' + reason + ')');

    // Also remove from Followup_Tracker
    if (leadId) {
      removeFromFollowup(ss, leadId);
    }
  } catch (e) { Logger.log('archiveRow: ' + e); }
}

// ============ WEB APP ============

function doGet(e) {
  var p = e.parameter || {};
  var callback = p.callback || '';
  var result;

  try {
    if (p.action === 'updateLead') {
      result = updateLead(p.leadId, p.status, p.notes);
    } else if (p.action === 'getLeads') {
      result = getLeads();
    } else {
      result = { ok: true, message: 'Paramount CRM API v7' };
    }
  } catch (err) { result = { error: String(err) }; }

  var json = JSON.stringify(result);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var p = e.parameter || {};
    if (e.postData) {
      var body = JSON.parse(e.postData.contents);
      Object.keys(body).forEach(function(k) { p[k] = body[k]; });
    }
    var result = (p.action === 'updateLead') ? updateLead(p.leadId, p.status, p.notes) : { error: 'Unknown action' };
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(e) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============ API: GET LEADS ============

function getLeads() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var last = sheet.getLastRow();
  if (last <= 1) return { leads: [] };
  var cols = findColumns(sheet);
  var data = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues();
  return {
    leads: data.map(function(r) {
      var o = {};
      Object.keys(cols).forEach(function(k) { o[k] = r[cols[k] - 1] || ''; });
      return o;
    })
  };
}

// ============ API: UPDATE LEAD ============

function updateLead(leadId, newStatus, notes) {
  if (!leadId) return { error: 'Missing leadId' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var cols = findColumns(sheet);
  if (!cols.leadId) return { error: 'Lead_ID column not found' };
  if (!cols.status) return { error: 'Status column not found' };

  var last = sheet.getLastRow();
  if (last <= 1) return { error: 'No data' };

  // Find the row
  var ids = sheet.getRange(2, cols.leadId, last - 1, 1).getValues();
  var row = -1;
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === leadId) { row = i + 2; break; }
  }
  if (row === -1) return { error: 'Lead not found: ' + leadId };

  var ts = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');

  // Update status
  if (newStatus) {
    sheet.getRange(row, cols.status).setValue(newStatus);
  }

  // Append notes to remarks
  if (notes && cols.remarks) {
    var old = sheet.getRange(row, cols.remarks).getValue() || '';
    sheet.getRange(row, cols.remarks).setValue('[' + ts + '] ' + (newStatus || '') + ': ' + notes + '\n' + old);
  }

  // If archive status → archive + remove from followup
  if (ARCHIVE_STATUSES.indexOf(newStatus) !== -1) {
    archiveRow(ss, sheet, row, newStatus, cols);
    // archiveRow already removes from Followup_Tracker
    return { success: true, leadId: leadId, status: newStatus, archived: true };
  }

  // Otherwise just update Followup_Tracker status + priority
  try {
    var fu = ss.getSheetByName('Followup_Tracker');
    if (fu && fu.getLastRow() > 1) {
      var fuIds = fu.getRange(2, 1, fu.getLastRow() - 1, 1).getValues();
      for (var j = 0; j < fuIds.length; j++) {
        if (String(fuIds[j][0]).trim() === leadId) {
          fu.getRange(j + 2, 6).setValue(newStatus);
          fu.getRange(j + 2, 7).setValue(statusToPriority(newStatus));
          if (notes) {
            var oldNotes = fu.getRange(j + 2, 8).getValue() || '';
            fu.getRange(j + 2, 8).setValue('[' + ts + '] ' + notes + '\n' + oldNotes);
          }
          break;
        }
      }
    }
  } catch (e) { Logger.log('Followup update: ' + e); }

  return { success: true, leadId: leadId, status: newStatus };
}

// ============ MENU ============

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🏢 Paramount CRM')
    .addItem('🔄 Backfill Lead IDs + Sync Followups', 'backfill')
    .addItem('🧪 Show Column Map', 'showColMap')
    .addToUi();
}

function backfill() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var cols = findColumns(sheet);
  var last = sheet.getLastRow();
  var count = 0;
  if (!cols.leadId) { SpreadsheetApp.getUi().alert('No Lead_ID column!'); return; }
  for (var r = 2; r <= last; r++) {
    var id = sheet.getRange(r, cols.leadId).getValue();
    if (!id) {
      id = generateId(sheet, cols.leadId);
      sheet.getRange(r, cols.leadId).setValue(id);
      count++;
    }
    if (cols.status && !sheet.getRange(r, cols.status).getValue()) {
      sheet.getRange(r, cols.status).setValue('New Lead');
    }
    var st = cols.status ? String(sheet.getRange(r, cols.status).getValue()).trim() : 'New Lead';
    // Only sync to followup if not an archive status
    if (ARCHIVE_STATUSES.indexOf(st) === -1) {
      syncFollowup(ss, sheet, r, cols, String(id), st);
    }
  }
  SpreadsheetApp.getUi().alert('Backfilled ' + count + ' IDs.\nFollowup_Tracker synced (active leads only).');
}

function showColMap() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var cols = findColumns(sheet);
  var msg = 'Column Map:\n\n';
  Object.keys(cols).forEach(function(k) { msg += k + ' → Col ' + cols[k] + '\n'; });
  SpreadsheetApp.getUi().alert(msg);
}
