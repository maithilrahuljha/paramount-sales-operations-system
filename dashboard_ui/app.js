/**
 * app.js — Paramount Merchant Navy Sales Dashboard v3
 *
 * FIXES from previous version:
 *   1. Column names now match ACTUAL Google Sheet headers
 *   2. Followup CSV URL was pubhtml (HTML) — must be pub?output=csv
 *   3. Added column-name auto-detection (tries multiple possible names)
 *   4. Added console logging so you can debug from F12
 */

/* ============================ CSV parsing ============================ */

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(v => v !== '')) rows.push(row); }

  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim());
  return rows.slice(1).map(r =>
    Object.fromEntries(header.map((h, idx) => [h, (r[idx] || '').trim()]))
  );
}

/* ============================ Helpers ============================ */

const $ = id => document.getElementById(id);

/**
 * Get a field value from a row, trying multiple possible column names.
 * This handles the mismatch between code and actual sheet headers.
 */
function getField(row, ...names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== '') return row[name];
  }
  return '';
}

// Status values that mean the lead is enrolled/admitted
const CLOSED_STATUSES = ['enrolled', 'completed', 'admitted', 'closed', 'converted', 'admission closed'];

function isConfigured(url) {
  return url && !url.includes('REPLACE_') && !url.includes('XXXXX') && url.includes('docs.google.com');
}

function isToday(value) {
  if (!value) return false;
  const now = new Date();
  const d = new Date(value);
  if (!isNaN(d)) {
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth()    === now.getMonth() &&
           d.getDate()     === now.getDate();
  }
  const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    return +m[3] === now.getFullYear() && +m[2] === now.getMonth() + 1 && +m[1] === now.getDate();
  }
  return false;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showBanner(message, isError) {
  const el = $('statusBanner');
  el.textContent = message;
  el.classList.remove('hidden');
  el.classList.toggle('error', !!isError);
}

function hideBanner() { $('statusBanner').classList.add('hidden'); }

async function fetchCsv(url) {
  console.log('📡 Fetching:', url.substring(0, 80) + '…');
  const resp = await fetch(url, { cache: 'no-store' });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const text = await resp.text();

  // Guard: if Google returned an HTML page instead of CSV, reject it
  if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
    throw new Error('URL returned an HTML page, not CSV. Make sure you publish as CSV (not "pubhtml").');
  }

  const data = parseCsv(text);
  console.log('✅ Parsed', data.length, 'rows.  Headers:', data.length ? Object.keys(data[0]).join(', ') : '(none)');
  return data;
}

/* ============================ Rendering ============================ */

/**
 * YOUR ACTUAL Lead_Register HEADERS (from Form Responses 1):
 *   Lead_ID | Candidate Full Name | Email Address | Phone Number |
 *   City / Location | Course Interested In | How did you hear about us? |
 *   Preferred Batch Month | Current Education Level | Counsellor Assigned |
 *   Additional Remarks | Status
 *
 * The getField() helper tries both old names AND your real names,
 * so the dashboard works no matter which header format your sheet uses.
 */

function renderKpis(leads) {
  const total = leads.length;

  // Today's leads — try "Timestamp" first (auto-added by Forms)
  const today = leads.filter(l => isToday(getField(l, 'Timestamp'))).length;

  // Status column
  const getStatus = l => getField(l, 'Status', 'Lead_Status').toLowerCase();
  const admissions = leads.filter(l => CLOSED_STATUSES.includes(getStatus(l))).length;
  const conversion = total ? ((admissions / total) * 100).toFixed(1) + '%' : '0%';

  $('kpiTodayLeads').textContent  = today;
  $('kpiTotalLeads').textContent  = total;
  $('kpiAdmissions').textContent  = admissions;
  $('kpiConversion').textContent  = conversion;
}

function renderSources(leads) {
  const counts = {};
  leads.forEach(l => {
    // Try your actual header first, then fall back
    const src = getField(l, 'How did you hear about us?', 'Lead Source', 'Source') || 'Unknown';
    counts[src] = (counts[src] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;

  $('sourceBreakdown').innerHTML = entries.length
    ? entries.map(([name, n]) => `
        <div class="source-row">
          <span class="source-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
          <div class="source-bar-wrap"><div class="source-bar" style="width:${(n / max) * 100}%"></div></div>
          <span class="source-count">${n}</span>
        </div>`).join('')
    : '<p class="muted">No leads yet.</p>';
}

function renderFollowups(followups) {
  const open = followups
    .filter(f => {
      const p = getField(f, 'Priority', 'Follow_up_Priority', 'Followup_Priority').trim();
      return /^p[12]/i.test(p);
    })
    .filter(f => {
      const s = getField(f, 'Status', 'Call_Status').toLowerCase();
      return !['done', 'completed', 'closed', 'enrolled', 'lost'].includes(s);
    })
    .sort((a, b) => {
      const pa = getField(a, 'Priority', 'Follow_up_Priority');
      const pb = getField(b, 'Priority', 'Follow_up_Priority');
      return pa.localeCompare(pb);
    });

  $('followupCount').textContent = open.length;
  $('followupBody').innerHTML = open.length
    ? open.slice(0, 25).map(f => {
        const p = getField(f, 'Priority', 'Follow_up_Priority').toUpperCase();
        const badge = p.startsWith('P1') ? 'badge-p1' : 'badge-p2';
        return `<tr>
          <td><span class="badge ${badge}">${escapeHtml(p.split(' ')[0] || p)}</span></td>
          <td>${escapeHtml(getField(f, 'Candidate Full Name', 'Student_Name', 'Candidate Name', 'Name'))}</td>
          <td><a href="tel:${escapeHtml(getField(f, 'Phone Number', 'Phone', 'Contact_Number'))}">${escapeHtml(getField(f, 'Phone Number', 'Phone', 'Contact_Number'))}</a></td>
          <td>${escapeHtml(getField(f, 'Next Followup Date', 'Next_Followup_Date', 'Followup Date', 'Follow_up_Date'))}</td>
          <td>${escapeHtml(getField(f, 'Counsellor Assigned', 'Counselor_Name', 'Assigned Counselor', 'Counselor'))}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="5" class="muted">No open P1/P2 follow-ups 🎉</td></tr>';
}

function renderLeads(leads) {
  const latest = leads.slice(-10).reverse();
  $('leadsBody').innerHTML = latest.length
    ? latest.map(l => {
        const status = getField(l, 'Status', 'Lead_Status') || 'New Lead';
        const isClosed = CLOSED_STATUSES.includes(status.toLowerCase());
        const cls = isClosed ? 'badge-closed' : 'badge-open';
        return `<tr>
          <td>${escapeHtml(getField(l, 'Lead_ID', 'Lead ID') || '—')}</td>
          <td>${escapeHtml(getField(l, 'Candidate Full Name', 'Candidate Name', 'Student_Name', 'Name'))}</td>
          <td>${escapeHtml(getField(l, 'Course Interested In', 'Course Interested', 'Course', 'Course_Interest'))}</td>
          <td><span class="badge ${cls}">${escapeHtml(status)}</span></td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="4" class="muted">No leads yet.</td></tr>';
}

/* ============================ Refresh loop ============================ */

async function refresh() {
  console.log('🔄 Refreshing dashboard…');
  const leadsOk  = isConfigured(config.leadRegisterCsvUrl);
  const followOk = isConfigured(config.followupTrackerCsvUrl);

  if (!leadsOk && !followOk) {
    showBanner('⚙️ Setup pending: publish your Google Sheets to the web as CSV and paste the URLs into dashboard_ui/config.js (see README).');
    return;
  }

  try {
    hideBanner();

    if (leadsOk) {
      const leads = await fetchCsv(config.leadRegisterCsvUrl);
      renderKpis(leads);
      renderSources(leads);
      renderLeads(leads);
    }

    if (followOk) {
      try {
        const followups = await fetchCsv(config.followupTrackerCsvUrl);
        renderFollowups(followups);
      } catch (fErr) {
        console.warn('⚠️ Followup sheet error (non-fatal):', fErr.message);
        $('followupCount').textContent = '!';
        $('followupBody').innerHTML =
          '<tr><td colspan="5" class="muted">⚠️ Could not load follow-ups: ' +
          escapeHtml(fErr.message) + '</td></tr>';
      }
    }

    $('lastUpdated').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
    console.log('✅ Dashboard refreshed');

  } catch (err) {
    console.error('❌ Refresh error:', err);
    showBanner('⚠️ Could not load sheet data: ' + err.message +
      ' — check the CSV URLs are published and public.', true);
  }
}

/* ============================ Init ============================ */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard starting…');
  document.title = '⚓ ' + config.branding.title + ' — Sales Dashboard';

  // Quick Add button
  const quickAdd = $('quickAddBtn');
  if (isConfigured(config.quickAddFormUrl)) {
    quickAdd.href = config.quickAddFormUrl;
  } else {
    quickAdd.addEventListener('click', e => {
      e.preventDefault();
      alert('Add your Google Form URL to config.js (quickAddFormUrl) first.');
    });
  }

  // Manual refresh
  $('refreshBtn').addEventListener('click', refresh);

  // First load + auto refresh
  refresh();
  setInterval(refresh, config.refreshInterval || 300000);
});
