/**
 * app.js — Paramount Merchant Navy Dashboard v4
 *
 * TWO-WAY: Reads CSV for display, writes via Apps Script Web App for edits.
 * Staff never touch the sheet — everything happens through this dashboard.
 */

/* ===================== CSV PARSER ===================== */

function parseCsv(text) {
  var rows = [], row = [], field = '', inQ = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (inQ) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i+1] === '\n') i++; row.push(field); field = ''; if (row.some(function(v){return v!=='';})) rows.push(row); row = []; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(function(v){return v!=='';})) rows.push(row); }
  if (!rows.length) return [];
  var hdr = rows[0].map(function(h){return h.trim();});
  return rows.slice(1).map(function(r) {
    var obj = {};
    hdr.forEach(function(h, idx) { obj[h] = (r[idx] || '').trim(); });
    return obj;
  });
}

/* ===================== HELPERS ===================== */

var $ = function(id) { return document.getElementById(id); };

function getF(row) {
  var names = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < names.length; i++) {
    if (row[names[i]] !== undefined && row[names[i]] !== '') return row[names[i]];
  }
  return '';
}

var STATUSES = ['New Lead','Contacted','Interested','Counselling Scheduled','Admission Pending','Enrolled','Completed','Lost'];
var ACTIVE = ['New Lead','Contacted','Interested','Counselling Scheduled','Admission Pending'];
var CLOSED = ['Enrolled','Completed'];
var ARCHIVE = ['Enrolled','Completed','Lost'];

function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

function showBanner(msg, isErr) {
  var el = $('statusBanner');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.classList.toggle('error', !!isErr);
}
function hideBanner() { $('statusBanner').classList.add('hidden'); }

function hasApi() {
  return config.appsScriptUrl && config.appsScriptUrl.length > 10 && config.appsScriptUrl.indexOf('script.google.com') !== -1;
}

/* ===================== STATE ===================== */

var allLeads = [];
var selectedLead = null;
var selectedStatus = null;

/* ===================== DATA FETCH ===================== */

async function fetchCsv(url) {
  console.log('📡 Fetching:', url.substring(0, 70) + '…');
  var resp = await fetch(url, { cache: 'no-store' });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  var text = await resp.text();
  if (text.trimStart().startsWith('<!') || text.trimStart().startsWith('<html'))
    throw new Error('Got HTML page, not CSV. Republish sheet as CSV.');
  var data = parseCsv(text);
  console.log('✅ Parsed', data.length, 'rows. Headers:', data.length ? Object.keys(data[0]).join(', ') : '(none)');
  return data;
}

async function refresh() {
  console.log('🔄 Refresh…');
  var url = config.leadRegisterCsvUrl;
  if (!url || url.indexOf('docs.google.com') === -1) {
    showBanner('⚙️ CSV URL not configured in config.js');
    return;
  }

  try {
    hideBanner();
    var raw = await fetchCsv(url);

    allLeads = raw.map(function(r) {
      return {
        leadId:     getF(r, 'Lead_ID', 'Lead ID'),
        name:       getF(r, 'Candidate Full Name', 'Candidate Name', 'Name'),
        email:      getF(r, 'Email Address', 'Email'),
        phone:      getF(r, 'Phone Number', 'Phone'),
        city:       getF(r, 'City / Location', 'City'),
        course:     getF(r, 'Course Interested In', 'Course Interested', 'Course'),
        source:     getF(r, 'How did you hear about us?', 'Lead Source', 'Source'),
        batch:      getF(r, 'Preferred Batch Month', 'Batch'),
        education:  getF(r, 'Current Education Level', 'Education'),
        counsellor: getF(r, 'Counsellor Assigned', 'Counselor', 'Assigned Counselor'),
        remarks:    getF(r, 'Additional Remarks', 'Remarks'),
        status:     getF(r, 'Status', 'Lead_Status') || 'New Lead',
        timestamp:  getF(r, 'Timestamp')
      };
    });

    renderAll();
    $('lastUpdated').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
    console.log('✅ Dashboard refreshed,', allLeads.length, 'leads');

  } catch (err) {
    console.error('❌', err);
    showBanner('⚠️ Could not load data: ' + err.message, true);
  }
}

/* ===================== RENDER ===================== */

function renderAll() {
  renderKPIs();
  renderFunnel();
  renderSources();
  renderLeadsTable();
}

function renderKPIs() {
  var total = allLeads.length;
  var counts = {};
  STATUSES.forEach(function(s) { counts[s] = 0; });
  allLeads.forEach(function(l) {
    var s = l.status;
    if (counts[s] !== undefined) counts[s]++;
    else counts['New Lead']++;
  });

  var enrolled = counts['Enrolled'] + counts['Completed'];
  var pending = ACTIVE.reduce(function(sum, s) { return sum + (counts[s] || 0); }, 0);
  var conv = total ? ((enrolled / total) * 100).toFixed(1) : '0.0';

  $('kpiTotalLeads').textContent = total;
  $('kpiEnrolled').textContent   = enrolled;
  $('kpiConversion').textContent = conv + '%';
  $('kpiPending').textContent    = pending;
  $('kpiNew').textContent        = counts['New Lead'];
  $('kpiLost').textContent       = counts['Lost'];
  $('leadCount').textContent     = total;
}

function renderFunnel() {
  var counts = {};
  STATUSES.forEach(function(s) { counts[s] = 0; });
  allLeads.forEach(function(l) {
    if (counts[l.status] !== undefined) counts[l.status]++;
    else counts['New Lead']++;
  });

  var classes = {
    'New Lead':'s-new','Contacted':'s-contacted','Interested':'s-interested',
    'Counselling Scheduled':'s-scheduled','Admission Pending':'s-pending',
    'Enrolled':'s-enrolled','Completed':'s-completed','Lost':'s-lost'
  };

  $('statusFunnel').innerHTML = STATUSES.map(function(s) {
    return '<div class="funnel-row ' + (classes[s]||'') + '">' +
      '<span class="funnel-label">' + s + '</span>' +
      '<span class="funnel-count">' + (counts[s]||0) + '</span></div>';
  }).join('');
}

function renderSources() {
  var counts = {};
  allLeads.forEach(function(l) {
    var src = l.source || 'Unknown';
    counts[src] = (counts[src] || 0) + 1;
  });
  var entries = Object.entries(counts).sort(function(a,b){return b[1]-a[1];});
  var max = entries.length ? entries[0][1] : 1;

  $('sourceBreakdown').innerHTML = entries.length
    ? entries.map(function(e) {
      return '<div class="source-row">' +
        '<span class="source-name" title="'+esc(e[0])+'">'+esc(e[0])+'</span>' +
        '<div class="source-bar-wrap"><div class="source-bar" style="width:'+(e[1]/max*100)+'%"></div></div>' +
        '<span class="source-count">'+e[1]+'</span></div>';
    }).join('')
    : '<p class="muted">No data</p>';
}

function renderLeadsTable() {
  var search = ($('searchBox').value || '').toLowerCase();
  var filterSt = $('filterStatus').value;

  var filtered = allLeads.filter(function(l) {
    if (filterSt && l.status !== filterSt) return false;
    if (search) {
      return (l.name||'').toLowerCase().indexOf(search) !== -1 ||
             (l.phone||'').toLowerCase().indexOf(search) !== -1 ||
             (l.leadId||'').toLowerCase().indexOf(search) !== -1;
    }
    return true;
  });

  if (!filtered.length) {
    $('leadsBody').innerHTML = '<tr><td colspan="7" class="muted">No matching leads</td></tr>';
    return;
  }

  $('leadsBody').innerHTML = filtered.map(function(l) {
    var stClass = ARCHIVE.indexOf(l.status) !== -1
      ? (l.status === 'Lost' ? 'badge-lost' : 'badge-closed')
      : 'badge-open';

    return '<tr>' +
      '<td style="font-family:monospace;font-weight:600;color:var(--navy)">' + esc(l.leadId || '—') + '</td>' +
      '<td>' + esc(l.name) + '</td>' +
      '<td><a href="tel:' + esc(l.phone) + '" class="phone-link">' + esc(l.phone || '—') + '</a></td>' +
      '<td>' + esc(l.course) + '</td>' +
      '<td>' + esc(l.counsellor || 'Unassigned') + '</td>' +
      '<td><span class="badge ' + stClass + '">' + esc(l.status) + '</span></td>' +
      '<td><button class="edit-btn" onclick="openModal(\'' + esc(l.leadId) + '\')">✏️ Edit</button></td>' +
      '</tr>';
  }).join('');
}

/* ===================== MODAL ===================== */

function openModal(leadId) {
  var lead = allLeads.find(function(l){ return l.leadId === leadId; });
  if (!lead) { alert('Lead not found: ' + leadId); return; }

  selectedLead = lead;
  selectedStatus = null;

  $('mLeadId').textContent     = lead.leadId;
  $('mName').textContent       = lead.name || '—';
  $('mPhone').textContent      = lead.phone || '—';
  $('mEmail').textContent      = lead.email || '—';
  $('mCourse').textContent     = lead.course || '—';
  $('mCity').textContent       = lead.city || '—';
  $('mCounsellor').textContent = lead.counsellor || 'Unassigned';
  $('mCurrentStatus').textContent = lead.status;
  $('mRemarks').textContent    = lead.remarks || 'No previous remarks';
  $('mNotes').value = '';
  $('saveBtn').disabled = true;

  // Highlight current status button
  document.querySelectorAll('.st-btn').forEach(function(btn) {
    btn.classList.remove('active');
    if (btn.dataset.st === lead.status) btn.classList.add('active');
  });

  $('modal').style.display = 'flex';
}

function closeModal() {
  $('modal').style.display = 'none';
  selectedLead = null;
  selectedStatus = null;
}

function selectStatusBtn(status) {
  selectedStatus = status;
  document.querySelectorAll('.st-btn').forEach(function(btn) {
    btn.classList.remove('active');
    if (btn.dataset.st === status) btn.classList.add('active');
  });
  $('saveBtn').disabled = (status === selectedLead.status && !$('mNotes').value.trim());
}

async function saveChanges() {
  if (!selectedLead) return;
  var leadId = selectedLead.leadId;
  var newStatus = selectedStatus || selectedLead.status;
  var notes = $('mNotes').value.trim();

  if (!newStatus && !notes) { alert('Select a new status or add notes'); return; }

  $('saveBtn').disabled = true;
  $('saveBtn').textContent = '⏳ Saving…';

  // If Apps Script Web App is configured, write back to sheet
  if (hasApi()) {
    try {
      var url = config.appsScriptUrl +
        '?action=updateLead' +
        '&leadId=' + encodeURIComponent(leadId) +
        '&status=' + encodeURIComponent(newStatus) +
        '&notes='  + encodeURIComponent(notes);

      console.log('📤 Saving to sheet:', leadId, '→', newStatus);
      var resp = await fetch(url, { redirect: 'follow' });
      var result = await resp.json();

      if (result.error) {
        alert('❌ Save failed: ' + result.error);
        $('saveBtn').disabled = false;
        $('saveBtn').textContent = '💾 Save Changes';
        return;
      }

      console.log('✅ Saved to sheet:', result);

      // If archived (Enrolled/Completed/Lost), lead will be removed from sheet
      // on next refresh. Show message.
      if (ARCHIVE.indexOf(newStatus) !== -1) {
        alert('✅ Lead ' + leadId + ' marked as "' + newStatus + '".\nIt has been moved to the archive sheet.');
      } else {
        alert('✅ Status updated to "' + newStatus + '"');
      }

    } catch (err) {
      console.error('❌ API error:', err);
      alert('❌ Could not save: ' + err.message + '\nCheck Apps Script Web App deployment.');
      $('saveBtn').disabled = false;
      $('saveBtn').textContent = '💾 Save Changes';
      return;
    }
  } else {
    // No API — update locally only (will reset on refresh)
    alert('✅ Status updated locally.\n\n⚠️ To save permanently, deploy Apps Script as Web App and paste URL in config.js → appsScriptUrl');
  }

  // Update local state immediately
  var idx = allLeads.findIndex(function(l){ return l.leadId === leadId; });
  if (idx !== -1) {
    allLeads[idx].status = newStatus;
    if (notes) {
      var ts = new Date().toLocaleString('en-IN');
      allLeads[idx].remarks = '[' + ts + '] ' + newStatus + ': ' + notes + '\n' + (allLeads[idx].remarks || '');
    }
    // If archived status, remove from local list
    if (ARCHIVE.indexOf(newStatus) !== -1 && hasApi()) {
      allLeads.splice(idx, 1);
    }
  }

  renderAll();
  closeModal();
  $('saveBtn').disabled = false;
  $('saveBtn').textContent = '💾 Save Changes';

  // Refresh data after short delay to get latest from sheet
  if (hasApi()) setTimeout(refresh, 3000);
}

/* ===================== INIT ===================== */

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Dashboard v4 starting…');
  document.title = '⚓ ' + config.branding.title + ' — Sales Dashboard';

  // Quick Add button
  var qa = $('quickAddBtn');
  if (config.quickAddFormUrl && config.quickAddFormUrl.indexOf('docs.google.com') !== -1) {
    qa.href = config.quickAddFormUrl;
  }

  // Edit mode indicator
  if (hasApi()) {
    $('editMode').textContent = '✏️ Edit mode — connected to Google Sheets';
    $('editMode').style.color = '#8f8';
  }

  // Status buttons in modal
  document.querySelectorAll('.st-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { selectStatusBtn(btn.dataset.st); });
  });

  // Notes field also enables save
  $('mNotes').addEventListener('input', function() {
    $('saveBtn').disabled = !selectedStatus && !$('mNotes').value.trim();
  });

  // Search + filter
  $('searchBox').addEventListener('input', renderLeadsTable);
  $('filterStatus').addEventListener('change', renderLeadsTable);

  // Refresh button
  $('refreshBtn').addEventListener('click', refresh);

  // First load
  refresh();
  setInterval(refresh, config.refreshInterval || 300000);
});
