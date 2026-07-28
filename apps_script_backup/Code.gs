/**
 * Paramount Merchant Navy — Apps Script v9
 *
 * ARCHITECTURE:
 *   The dashboard calls getLeads API which reads ALL tabs:
 *   - Form Responses 1: active leads (main data)
 *   - Archived_YYYY_MM: closed leads (for KPI counting)
 *   - Followup_Tracker: followup info (merged into lead data)
 *
 *   The API returns ONE combined list with every lead ever created.
 *   Dashboard uses this for accurate KPIs.
 *
 *   Published CSV is still used as FALLBACK if API is slow/down.
 */

var TZ = 'Asia/Kolkata';
var PREFIX = 'PMN';
var DIGITS = 4;
var ARCHIVE_STATUSES = ['Enrolled', 'Completed', 'Lost'];

// ============ FIND COLUMNS ============

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

function statusToPriority(s) {
  if (['Interested','Counselling Scheduled','Admission Pending'].indexOf(s) !== -1) return 'P1';
  if (ARCHIVE_STATUSES.indexOf(s) !== -1) return 'P3';
  return 'P2';
}

// ============ FORM SUBMIT ============

function onFormSubmit(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = e.range.getSheet();
    var row = e.range.getRow();
    if (row <= 1) return;
    var cols = findColumns(sheet);

    var leadId = '';
    if (cols.leadId) {
      var idCell = sheet.getRange(row, cols.leadId);
      if (!idCell.getValue()) { leadId = generateId(sheet, cols.leadId); idCell.setValue(leadId); }
      else leadId = String(idCell.getValue());
    }

    var status = '';
    if (cols.status) {
      var stCell = sheet.getRange(row, cols.status);
      status = String(stCell.getValue()).trim();
      if (!status) { status = 'New Lead'; stCell.setValue(status); }
    }

    // If final status → copy to archive, keep in main sheet, skip followup
    if (ARCHIVE_STATUSES.indexOf(status) !== -1) {
      copyToArchive(ss, sheet, row, status);
      return;
    }

    // Active → sync to followup
    syncFollowup(ss, sheet, row, cols, leadId, status);
  } catch (err) { Logger.log('onFormSubmit: ' + err); }
}

function generateId(sheet, col) {
  var year = Utilities.formatDate(new Date(), TZ, 'yyyy');
  var pfx = PREFIX + '-' + year + '-';
  var last = sheet.getLastRow(), max = 0;
  if (last > 1) {
    sheet.getRange(2, col, last-1, 1).getValues().forEach(function(r) {
      var v = String(r[0]);
      if (v.indexOf(pfx) === 0) { var n = parseInt(v.substr(pfx.length),10); if(n>max) max=n; }
    });
  }
  var s = String(max+1); while(s.length<DIGITS) s='0'+s;
  return pfx+s;
}

// ============ FOLLOWUP ============

function syncFollowup(ss, sheet, row, cols, leadId, status) {
  try {
    var fu = ss.getSheetByName('Followup_Tracker');
    if (!fu) {
      fu = ss.insertSheet('Followup_Tracker');
      fu.getRange(1,1,1,8).setValues([['Lead_ID','Name','Phone','Course','Counsellor','Status','Priority','Notes']]);
      fu.getRange(1,1,1,8).setBackground('#1a237e').setFontColor('#fff').setFontWeight('bold');
    }
    var gv = function(c) { return cols[c] ? sheet.getRange(row,cols[c]).getValue() : ''; };
    var id = leadId || gv('leadId'), st = status || gv('status') || 'New Lead';

    // Upsert: update if exists, insert if not
    var fuLast = fu.getLastRow();
    if (fuLast > 1) {
      var eids = fu.getRange(2,1,fuLast-1,1).getValues();
      for (var i=0; i<eids.length; i++) {
        if (String(eids[i][0]).trim() === String(id).trim()) {
          fu.getRange(i+2,6).setValue(st);
          fu.getRange(i+2,7).setValue(statusToPriority(st));
          return;
        }
      }
    }
    fu.appendRow([id, gv('name'), gv('phone'), gv('course'), gv('counsellor'), st, statusToPriority(st), 'New lead']);
  } catch(e) { Logger.log('syncFollowup: '+e); }
}

function removeFromFollowup(ss, leadId) {
  try {
    var fu = ss.getSheetByName('Followup_Tracker');
    if (!fu) return;
    var last = fu.getLastRow();
    if (last <= 1) return;
    var ids = fu.getRange(2,1,last-1,1).getValues();
    for (var i = ids.length-1; i >= 0; i--) {
      if (String(ids[i][0]).trim() === leadId) { fu.deleteRow(i+2); return; }
    }
  } catch(e) {}
}

// ============ ARCHIVE (copy only, never delete from main) ============

function copyToArchive(ss, sheet, row, reason) {
  try {
    var ts = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
    var archName = 'Archived_' + Utilities.formatDate(new Date(), TZ, 'yyyy_MM');
    var arch = ss.getSheetByName(archName);
    if (!arch) {
      arch = ss.insertSheet(archName);
      var hdrs = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      hdrs.push('Archived_Date','Reason');
      arch.getRange(1,1,1,hdrs.length).setValues([hdrs]);
      arch.getRange(1,1,1,hdrs.length).setBackground('#1a237e').setFontColor('#fff').setFontWeight('bold');
    }
    var rd = sheet.getRange(row,1,1,sheet.getLastColumn()).getValues()[0];
    rd.push(ts, reason);
    arch.appendRow(rd);
  } catch(e) { Logger.log('copyToArchive: '+e); }
}

// ============ WEB APP ============

function doGet(e) {
  var p = e.parameter || {};
  var cb = p.callback || '';
  var result;
  try {
    if (p.action === 'updateLead') result = updateLead(p.leadId, p.status, p.notes, p.fields);
    else if (p.action === 'getLeads') result = getDashboardLeads();
    else result = { ok:true, message:'Paramount CRM API v10' };
  } catch(err) { result = { error: String(err) }; }
  var json = JSON.stringify(result);
  if (cb) return ContentService.createTextOutput(cb+'('+json+')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var p = e.parameter || {};
    if (e.postData) { var body = JSON.parse(e.postData.contents); Object.keys(body).forEach(function(k){p[k]=body[k];}); }
    var result = (p.action==='updateLead') ? updateLead(p.leadId, p.status, p.notes, p.fields) : {error:'Unknown action'};
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch(e) { return ContentService.createTextOutput(JSON.stringify({error:String(e)})).setMimeType(ContentService.MimeType.JSON); }
}

// ============ GET DASHBOARD LEADS (MAIN SHEET ONLY) ============

/**
 * Source of truth for dashboard = FIRST / MAIN sheet only.
 *
 * WHY:
 * - Form Responses 1 keeps ALL leads forever now (active + enrolled + completed + lost)
 * - Followup_Tracker is a support tab for operations only
 * - Archived_YYYY_MM is a monthly backup copy only
 *
 * Reading all tabs caused duplicates / stale rows / wrong KPI counts.
 */
function getDashboardLeads() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0]; // Main sheet only
  var last = sheet.getLastRow();
  if (last <= 1) return { leads: [], count: 0, tab: sheet.getName() };

  var cols = findColumns(sheet);
  var data = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues();
  var leads = [];

  for (var r = 0; r < data.length; r++) {
    var row = data[r];
    var id = cols.leadId ? String(row[cols.leadId - 1]).trim() : '';
    var name = cols.name ? String(row[cols.name - 1]).trim() : '';
    if (!id && !name) continue;

    leads.push({
      leadId: id,
      name: name,
      email: cols.email ? String(row[cols.email - 1]) : '',
      phone: cols.phone ? String(row[cols.phone - 1]) : '',
      city: cols.city ? String(row[cols.city - 1]) : '',
      course: cols.course ? String(row[cols.course - 1]) : '',
      source: cols.source ? String(row[cols.source - 1]) : '',
      batch: cols.batch ? String(row[cols.batch - 1]) : '',
      education: cols.education ? String(row[cols.education - 1]) : '',
      counsellor: cols.counsellor ? String(row[cols.counsellor - 1]) : '',
      remarks: cols.remarks ? String(row[cols.remarks - 1]) : '',
      status: cols.status ? String(row[cols.status - 1]).trim() : 'New Lead',
      timestamp: cols.timestamp ? String(row[cols.timestamp - 1]) : '',
      tab: sheet.getName()
    });
  }

  return {
    leads: leads,
    count: leads.length,
    tab: sheet.getName(),
    note: 'Dashboard source = main sheet only; archive/followup tabs excluded by design'
  };
}

// ============ UPDATE LEAD ============

function updateLead(leadId, newStatus, notes, fieldsJson) {
  if (!leadId) return { error: 'Missing leadId' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var cols = findColumns(sheet);
  if (!cols.leadId) return { error: 'Lead_ID column not found' };
  if (!cols.status) return { error: 'Status column not found' };

  var last = sheet.getLastRow();
  if (last <= 1) return { error: 'No data' };

  var ids = sheet.getRange(2, cols.leadId, last-1, 1).getValues();
  var row = -1;
  for (var i=0; i<ids.length; i++) {
    if (String(ids[i][0]).trim() === leadId) { row = i+2; break; }
  }
  if (row === -1) return { error: 'Lead not found: ' + leadId };

  var ts = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');

  // Update status
  if (newStatus) sheet.getRange(row, cols.status).setValue(newStatus);

  // Update editable fields if provided
  if (fieldsJson) {
    try {
      var fields = JSON.parse(fieldsJson);
      if (fields.name && cols.name) sheet.getRange(row, cols.name).setValue(fields.name);
      if (fields.phone && cols.phone) sheet.getRange(row, cols.phone).setValue(fields.phone);
      if (fields.email && cols.email) sheet.getRange(row, cols.email).setValue(fields.email);
      if (fields.course && cols.course) sheet.getRange(row, cols.course).setValue(fields.course);
      if (fields.city && cols.city) sheet.getRange(row, cols.city).setValue(fields.city);
      if (fields.counsellor && cols.counsellor) sheet.getRange(row, cols.counsellor).setValue(fields.counsellor);
      if (fields.batch && cols.batch) sheet.getRange(row, cols.batch).setValue(fields.batch);
      if (fields.education && cols.education) sheet.getRange(row, cols.education).setValue(fields.education);
    } catch(e) { Logger.log('Fields parse error: ' + e); }
  }

  // Append notes
  if (notes && cols.remarks) {
    var old = sheet.getRange(row, cols.remarks).getValue() || '';
    sheet.getRange(row, cols.remarks).setValue('['+ts+'] '+(newStatus||'')+': '+notes+'\n'+old);
  }

  // If final status → copy to archive + remove from followup + add to Student DB
  if (ARCHIVE_STATUSES.indexOf(newStatus) !== -1) {
    copyToArchive(ss, sheet, row, newStatus);
    removeFromFollowup(ss, leadId);
    // If Enrolled/Completed → also add to Student_Master_DB
    if (newStatus === 'Enrolled' || newStatus === 'Completed') {
      addToStudentDB(ss, sheet, row, cols, ts);
    }
    return { success:true, leadId:leadId, status:newStatus, archived:true };
  }

  // Active status → update followup
  try {
    var fu = ss.getSheetByName('Followup_Tracker');
    if (fu && fu.getLastRow() > 1) {
      var fuIds = fu.getRange(2,1,fu.getLastRow()-1,1).getValues();
      for (var j=0; j<fuIds.length; j++) {
        if (String(fuIds[j][0]).trim() === leadId) {
          fu.getRange(j+2,6).setValue(newStatus);
          fu.getRange(j+2,7).setValue(statusToPriority(newStatus));
          if (notes) {
            var oldN = fu.getRange(j+2,8).getValue()||'';
            fu.getRange(j+2,8).setValue('['+ts+'] '+notes+'\n'+oldN);
          }
          break;
        }
      }
    }
  } catch(e) {}

  return { success:true, leadId:leadId, status:newStatus };
}

// ============ STUDENT MASTER DB ============

function addToStudentDB(ss, sheet, row, cols, ts) {
  try {
    var db = ss.getSheetByName('Student_Master_DB');
    if (!db) {
      db = ss.insertSheet('Student_Master_DB');
      db.getRange(1,1,1,12).setValues([[
        'Student_ID','Lead_ID','Student_Name','Phone','Email',
        'Course_Enrolled','Enrollment_Date','City','Education',
        'Batch_Month','Counsellor','Remarks'
      ]]);
      db.getRange(1,1,1,12).setBackground('#2e7d32').setFontColor('#fff').setFontWeight('bold');
    }

    var gv = function(col) { return cols[col] ? sheet.getRange(row, cols[col]).getValue() : ''; };
    var leadId = gv('leadId');

    // Check if already in Student DB (avoid duplicates)
    var dbLast = db.getLastRow();
    if (dbLast > 1) {
      var dbIds = db.getRange(2, 2, dbLast - 1, 1).getValues(); // Column B = Lead_ID
      for (var i = 0; i < dbIds.length; i++) {
        if (String(dbIds[i][0]).trim() === String(leadId).trim()) {
          Logger.log('Student already in DB: ' + leadId);
          return; // Already exists
        }
      }
    }

    // Generate Student ID: STU-YYYY-XXXX
    var year = Utilities.formatDate(new Date(), TZ, 'yyyy');
    var stuPrefix = 'STU-' + year + '-';
    var maxStu = 0;
    if (dbLast > 1) {
      var stuIds = db.getRange(2, 1, dbLast - 1, 1).getValues();
      stuIds.forEach(function(r) {
        var v = String(r[0]);
        if (v.indexOf(stuPrefix) === 0) {
          var n = parseInt(v.substring(stuPrefix.length), 10);
          if (n > maxStu) maxStu = n;
        }
      });
    }
    var studentId = stuPrefix + String(maxStu + 1).padStart(4, '0');

    db.appendRow([
      studentId,
      leadId,
      gv('name'),
      gv('phone'),
      gv('email'),
      gv('course'),
      ts,                 // Enrollment Date
      gv('city'),
      gv('education'),
      gv('batch'),
      gv('counsellor'),
      gv('remarks')
    ]);

    Logger.log('Added to Student_Master_DB: ' + studentId + ' (' + leadId + ')');
  } catch(e) { Logger.log('addToStudentDB: ' + e); }
}

// ============ MENU ============

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🏢 Paramount CRM')
    .addItem('🔄 Backfill Lead IDs + Sync','backfill')
    .addItem('🧪 Show Column Map','showColMap')
    .addToUi();
}

function backfill() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var cols = findColumns(sheet);
  var last = sheet.getLastRow(), count = 0;
  if (!cols.leadId) { SpreadsheetApp.getUi().alert('No Lead_ID column!'); return; }
  for (var r=2; r<=last; r++) {
    var id = sheet.getRange(r,cols.leadId).getValue();
    if (!id) { id = generateId(sheet,cols.leadId); sheet.getRange(r,cols.leadId).setValue(id); count++; }
    if (cols.status && !sheet.getRange(r,cols.status).getValue()) sheet.getRange(r,cols.status).setValue('New Lead');
    var st = cols.status ? String(sheet.getRange(r,cols.status).getValue()).trim() : 'New Lead';
    if (ARCHIVE_STATUSES.indexOf(st)===-1) syncFollowup(ss,sheet,r,cols,String(id),st);
    else removeFromFollowup(ss,String(id));
  }
  SpreadsheetApp.getUi().alert('Backfilled '+count+' IDs. Followup synced.');
}

function showColMap() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var cols = findColumns(sheet);
  var msg = 'Column Map:\n\n';
  Object.keys(cols).forEach(function(k) { msg += k+' → Col '+cols[k]+'\n'; });
  SpreadsheetApp.getUi().alert(msg);
}
