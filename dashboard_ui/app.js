/**
 * app.js — Paramount Merchant Navy Dashboard v9
 *
 * DATA SOURCE HIERARCHY:
 *   1. Apps Script API (getLeads) → reads ALL tabs, returns combined data
 *   2. Published CSV (fallback) → reads only Form Responses 1 tab
 *
 * When API is configured, KPIs are accurate because data comes from
 * all tabs (main + followup + archives). CSV alone only sees one tab.
 */

/* ===================== CSV PARSER ===================== */
function parseCsv(text){var rows=[],row=[],field='',inQ=false;for(var i=0;i<text.length;i++){var c=text[i];if(inQ){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else inQ=false;}else field+=c;}else if(c==='"')inQ=true;else if(c===','){row.push(field);field='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';if(row.some(function(v){return v!=='';}))rows.push(row);row=[];}else field+=c;}if(field!==''||row.length){row.push(field);if(row.some(function(v){return v!=='';}))rows.push(row);}if(!rows.length)return[];var hdr=rows[0].map(function(h){return h.trim();});return rows.slice(1).map(function(r){var o={};hdr.forEach(function(h,idx){o[h]=(r[idx]||'').trim();});return o;});}

/* ===================== HELPERS ===================== */
var $=function(id){return document.getElementById(id);};
function norm(s){return String(s).toLowerCase().replace(/[_\s\/\-\.]+/g,'').trim();}
function getF(row){
  var names=Array.prototype.slice.call(arguments,1),keys=Object.keys(row);
  for(var i=0;i<names.length;i++){if(row[names[i]]!==undefined&&row[names[i]]!=='')return row[names[i]];}
  var ns=names.map(norm);for(var k=0;k<keys.length;k++){var nk=norm(keys[k]);for(var j=0;j<ns.length;j++){if(nk===ns[j]&&row[keys[k]]!=='')return row[keys[k]];}}
  var parts=['phone','mobile','contact','status','name','email','course','city','counsell','remark','batch','education','source','hear'];
  for(var p=0;p<names.length;p++){var sn=norm(names[p]);for(var m=0;m<keys.length;m++){var nkey=norm(keys[m]);for(var pi=0;pi<parts.length;pi++){if(sn.indexOf(parts[pi])!==-1&&nkey.indexOf(parts[pi])!==-1&&row[keys[m]]!=='')return row[keys[m]];}}}
  return '';
}
function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
var STATUSES=['New Lead','Contacted','Interested','Counselling Scheduled','Admission Pending','Enrolled','Completed','Lost'];
var ACTIVE=['New Lead','Contacted','Interested','Counselling Scheduled','Admission Pending'];
var ARCHIVE=['Enrolled','Completed','Lost'];
function matchStatus(raw){if(!raw)return'New Lead';var n=norm(raw);for(var i=0;i<STATUSES.length;i++){if(norm(STATUSES[i])===n)return STATUSES[i];}if(n.indexOf('enroll')!==-1)return'Enrolled';if(n.indexOf('complet')!==-1)return'Completed';if(n.indexOf('lost')!==-1)return'Lost';if(n.indexOf('interest')!==-1)return'Interested';if(n.indexOf('contact')!==-1)return'Contacted';if(n.indexOf('schedul')!==-1)return'Counselling Scheduled';if(n.indexOf('pending')!==-1)return'Admission Pending';if(n.indexOf('new')!==-1)return'New Lead';return raw;}
function showBanner(msg,isErr){var el=$('statusBanner');el.textContent=msg;el.classList.remove('hidden');el.classList.toggle('error',!!isErr);}
function hideBanner(){$('statusBanner').classList.add('hidden');}
function hasApi(){return config.appsScriptUrl&&config.appsScriptUrl.length>20&&config.appsScriptUrl.indexOf('/exec')!==-1;}

/* ===================== APPS SCRIPT CALLER (iframe form) ===================== */
function sendToAppsScript(params){
  return new Promise(function(resolve){
    var id='_f_'+Date.now();
    var iframe=document.createElement('iframe');iframe.name=id;iframe.id=id;
    iframe.style.cssText='position:absolute;width:0;height:0;border:0;opacity:0';
    document.body.appendChild(iframe);
    var form=document.createElement('form');form.method='GET';form.action=config.appsScriptUrl;form.target=id;form.style.display='none';
    Object.keys(params).forEach(function(k){var inp=document.createElement('input');inp.type='hidden';inp.name=k;inp.value=params[k]||'';form.appendChild(inp);});
    document.body.appendChild(form);
    console.log('📤 Sending:',JSON.stringify(params));
    var done=false;
    iframe.onload=function(){if(done)return;done=true;var result=null;try{var t=iframe.contentDocument.body.textContent||'';if(t.trim().charAt(0)==='{')result=JSON.parse(t);console.log('📥 Response:',t.substring(0,200));}catch(e){console.log('📥 Loaded (cross-origin)');}setTimeout(function(){try{iframe.remove();form.remove();}catch(e){}},1000);resolve(result||{success:true,note:'sent'});};
    setTimeout(function(){if(done)return;done=true;try{iframe.remove();form.remove();}catch(e){}resolve({success:true,note:'timeout'});},12000);
    form.submit();
  });
}

/* ===================== STATE ===================== */
var allLeads=[];var selectedLead=null;var selectedStatus=null;

/* ===================== DATA FETCH ===================== */

function mapLead(r) {
  var l = {
    leadId: r.leadId || getF(r,'Lead_ID','Lead ID','LeadID'),
    name: r.name || getF(r,'Candidate Full Name','Candidate Name','Full Name','Name'),
    email: r.email || getF(r,'Email Address','Email'),
    phone: r.phone || getF(r,'Phone Number','Phone','Mobile','Mobile Number','Contact Number','Phone No'),
    city: r.city || getF(r,'City / Location','City','Location'),
    course: r.course || getF(r,'Course Interested In','Course Interested','Course'),
    source: r.source || getF(r,'How did you hear about us?','How did you hear about us','Lead Source','Source'),
    batch: r.batch || getF(r,'Preferred Batch Month','Batch Month','Batch'),
    education: r.education || getF(r,'Current Education Level','Education Level','Education'),
    counsellor: r.counsellor || getF(r,'Counsellor Assigned','Counselor Assigned','Counsellor','Counselor'),
    remarks: r.remarks || getF(r,'Additional Remarks','Remarks','Notes'),
    rawStatus: r.status || getF(r,'Status','Lead Status','Current Status'),
    timestamp: r.timestamp || getF(r,'Timestamp','Date'),
    tab: r.tab || 'main'
  };
  l.status = matchStatus(l.rawStatus);
  return l;
}

async function fetchFromApi() {
  console.log('📡 Fetching from Apps Script API (all tabs)…');
  var result = await sendToAppsScript({ action: 'getLeads' });
  if (result && result.leads) {
    console.log('✅ API returned', result.leads.length, 'leads from tabs:', (result.tabs||[]).join(', '));
    return result.leads.map(mapLead);
  }
  throw new Error('API returned no leads data');
}

async function fetchFromCsv() {
  console.log('📡 Fetching from CSV (Form Responses 1 only)…');
  var url = config.leadRegisterCsvUrl;
  if (!url || url.indexOf('google.com') === -1) throw new Error('CSV URL not configured');
  var resp = await fetch(url, { cache: 'no-store' });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  var text = await resp.text();
  if (text.trimStart().charAt(0) === '<') throw new Error('Got HTML not CSV');
  var raw = parseCsv(text);
  console.log('✅ CSV returned', raw.length, 'rows');
  return raw.map(mapLead);
}

async function refresh() {
  console.log('🔄 Refreshing…');
  try {
    hideBanner();

    // PRIMARY: Use Apps Script API (reads ALL tabs — main + followup + archives)
    if (hasApi()) {
      try {
        allLeads = await fetchFromApi();
        console.log('✅ Using API data:', allLeads.length, 'total leads (all tabs)');
      } catch (apiErr) {
        console.warn('⚠️ API failed, falling back to CSV:', apiErr.message);
        allLeads = await fetchFromCsv();
        showBanner('⚠️ Using CSV data only (API unavailable) — archived leads may not show in KPIs');
      }
    } else {
      // FALLBACK: CSV only (only sees Form Responses 1 tab)
      allLeads = await fetchFromCsv();
    }

    // Debug
    if (allLeads.length > 0) {
      var f = allLeads[0];
      console.log('📋 1st lead: id="'+f.leadId+'" name="'+f.name+'" status="'+f.status+'" tab="'+f.tab+'"');
      
      // Count by tab
      var tabCounts = {};
      allLeads.forEach(function(l) { tabCounts[l.tab] = (tabCounts[l.tab]||0)+1; });
      console.log('📋 Leads per tab:', JSON.stringify(tabCounts));
    }

    renderAll();
    $('lastUpdated').textContent = 'Updated: ' + new Date().toLocaleTimeString();
    console.log('✅ Dashboard refreshed,', allLeads.length, 'leads');
  } catch (err) {
    console.error('❌', err);
    showBanner('⚠️ ' + err.message, true);
  }
}

/* ===================== RENDER ===================== */
function renderAll(){renderKPIs();renderFunnel();renderSources();renderLeadsTable();}

function renderKPIs(){
  var total=allLeads.length, counts={};
  STATUSES.forEach(function(s){counts[s]=0;});
  allLeads.forEach(function(l){if(counts[l.status]!==undefined)counts[l.status]++;else counts['New Lead']++;});
  var enrolled=counts['Enrolled']+counts['Completed'];
  var pending=ACTIVE.reduce(function(s,k){return s+(counts[k]||0);},0);
  var conv=total?((enrolled/total)*100).toFixed(1):'0.0';
  $('kpiTotalLeads').textContent=total;
  $('kpiEnrolled').textContent=enrolled;
  $('kpiConversion').textContent=conv+'%';
  $('kpiPending').textContent=pending;
  $('kpiNew').textContent=counts['New Lead'];
  $('kpiLost').textContent=counts['Lost'];
  $('leadCount').textContent=total;
}

function renderFunnel(){
  var counts={};STATUSES.forEach(function(s){counts[s]=0;});
  allLeads.forEach(function(l){if(counts[l.status]!==undefined)counts[l.status]++;else counts['New Lead']++;});
  var cls={'New Lead':'s-new','Contacted':'s-contacted','Interested':'s-interested','Counselling Scheduled':'s-scheduled','Admission Pending':'s-pending','Enrolled':'s-enrolled','Completed':'s-completed','Lost':'s-lost'};
  $('statusFunnel').innerHTML=STATUSES.map(function(s){
    return '<div class="funnel-row '+(cls[s]||'')+'"><span class="funnel-label">'+s+'</span><span class="funnel-count">'+(counts[s]||0)+'</span></div>';
  }).join('');
}

function renderSources(){
  var c={};allLeads.forEach(function(l){var s=l.source||'Unknown';c[s]=(c[s]||0)+1;});
  var e=Object.entries(c).sort(function(a,b){return b[1]-a[1];});var max=e.length?e[0][1]:1;
  $('sourceBreakdown').innerHTML=e.length?e.map(function(x){return'<div class="source-row"><span class="source-name">'+esc(x[0])+'</span><div class="source-bar-wrap"><div class="source-bar" style="width:'+(x[1]/max*100)+'%"></div></div><span class="source-count">'+x[1]+'</span></div>';}).join(''):'<p class="muted">No data</p>';
}

function renderLeadsTable(){
  var search=($('searchBox').value||'').toLowerCase(),filterSt=$('filterStatus').value;
  var filtered=allLeads.filter(function(l){if(filterSt&&l.status!==filterSt)return false;if(search)return(l.name||'').toLowerCase().indexOf(search)!==-1||(l.phone||'').toLowerCase().indexOf(search)!==-1||(l.leadId||'').toLowerCase().indexOf(search)!==-1;return true;});
  if(!filtered.length){$('leadsBody').innerHTML='<tr><td colspan="7" class="muted">No matching leads</td></tr>';return;}
  $('leadsBody').innerHTML=filtered.map(function(l){
    var stCls=ARCHIVE.indexOf(l.status)!==-1?(l.status==='Lost'?'badge-lost':'badge-closed'):'badge-open';
    var editId=l.leadId||l.name||'unknown';
    return'<tr><td style="font-family:monospace;font-weight:600;color:var(--navy)">'+esc(l.leadId||'—')+'</td><td>'+esc(l.name)+'</td><td><a href="tel:'+esc(l.phone)+'" class="phone-link" onclick="event.stopPropagation()">'+esc(l.phone||'—')+'</a></td><td>'+esc(l.course)+'</td><td>'+esc(l.counsellor||'—')+'</td><td><span class="badge '+stCls+'">'+esc(l.status)+'</span></td><td><button class="edit-btn" onclick="openModal(\''+esc(editId)+'\')">✏️</button></td></tr>';
  }).join('');
}

/* ===================== MODAL ===================== */
function openModal(leadId){
  var lead=allLeads.find(function(l){return l.leadId===leadId;})||allLeads.find(function(l){return l.name===leadId;});
  if(!lead){alert('Lead not found: '+leadId);return;}
  selectedLead=lead;selectedStatus=null;
  $('mLeadId').textContent=lead.leadId||'(no ID)';
  $('mName').textContent=lead.name||'—';
  $('mPhone').innerHTML=lead.phone?'<a href="tel:'+esc(lead.phone)+'" class="phone-link">'+esc(lead.phone)+'</a>':'—';
  $('mEmail').textContent=lead.email||'—';$('mCourse').textContent=lead.course||'—';
  $('mCity').textContent=lead.city||'—';$('mCounsellor').textContent=lead.counsellor||'—';
  $('mCurrentStatus').textContent=lead.status;
  $('mRemarks').textContent=lead.remarks||'No previous remarks';
  $('mNotes').value='';$('saveBtn').disabled=true;
  document.querySelectorAll('.st-btn').forEach(function(btn){btn.classList.remove('active');if(btn.dataset.st===lead.status)btn.classList.add('active');});
  $('modal').style.display='flex';
}
function closeModal(){$('modal').style.display='none';selectedLead=null;selectedStatus=null;}
function selectStatusBtn(status){selectedStatus=status;document.querySelectorAll('.st-btn').forEach(function(btn){btn.classList.remove('active');if(btn.dataset.st===status)btn.classList.add('active');});$('saveBtn').disabled=(status===selectedLead.status&&!$('mNotes').value.trim());}

async function saveChanges(){
  if(!selectedLead)return;
  var leadId=selectedLead.leadId,newStatus=selectedStatus||selectedLead.status,notes=$('mNotes').value.trim();
  if(!selectedStatus&&!notes){alert('Select a status or add notes');return;}
  if(!leadId){alert('⚠️ This lead has no Lead_ID. Run Backfill in Apps Script.');return;}
  $('saveBtn').disabled=true;$('saveBtn').textContent='⏳ Saving…';

  if(hasApi()){
    try{
      var result=await sendToAppsScript({action:'updateLead',leadId:leadId,status:newStatus,notes:notes});
      console.log('✅ Result:',result);
      if(result&&result.error){alert('❌ '+result.error);$('saveBtn').disabled=false;$('saveBtn').textContent='💾 Save Changes';return;}
      if(ARCHIVE.indexOf(newStatus)!==-1)alert('✅ '+leadId+' → "'+newStatus+'" (archived)');
      else alert('✅ Status → "'+newStatus+'"');
    }catch(err){console.error('❌',err);alert('⚠️ Request sent. Click ⟳ Refresh to verify.');}
  }else{alert('📖 Read-only. Deploy Apps Script Web App for edit access.');}

  // Update local state (lead stays — KPIs count it)
  var idx=allLeads.findIndex(function(l){return l.leadId===leadId;});
  if(idx!==-1){allLeads[idx].status=newStatus;if(notes){var ts=new Date().toLocaleString('en-IN');allLeads[idx].remarks='['+ts+'] '+newStatus+': '+notes+'\n'+(allLeads[idx].remarks||'');}}
  renderAll();closeModal();$('saveBtn').disabled=false;$('saveBtn').textContent='💾 Save Changes';
  if(hasApi())setTimeout(refresh,5000);
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded',function(){
  console.log('🚀 Dashboard v9 — API reads all tabs');
  console.log('📡 CSV:',config.leadRegisterCsvUrl?'✅':'❌');
  console.log('📤 API:',hasApi()?'✅ '+config.appsScriptUrl:'❌ NOT SET (using CSV only — KPIs may be incomplete)');

  if(hasApi()){$('editMode').textContent='✏️ Edit mode (all tabs)';$('editMode').style.color='#8f8';}
  else{$('editMode').innerHTML='📖 CSV-only mode — KPIs show main sheet only. <a href="https://github.com/maithilrahuljha/paramount-sales-operations-system/blob/main/changesmade.txt" target="_blank" style="color:#ffd700">Setup API for full data</a>';$('editMode').style.color='#ffa';}

  if(config.quickAddFormUrl&&config.quickAddFormUrl.indexOf('google.com')!==-1)$('quickAddBtn').href=config.quickAddFormUrl;
  document.querySelectorAll('.st-btn').forEach(function(btn){btn.addEventListener('click',function(){selectStatusBtn(btn.dataset.st);});});
  $('mNotes').addEventListener('input',function(){$('saveBtn').disabled=!selectedStatus&&!$('mNotes').value.trim();});
  $('searchBox').addEventListener('input',renderLeadsTable);
  $('filterStatus').addEventListener('change',renderLeadsTable);
  $('refreshBtn').addEventListener('click',refresh);
  refresh();setInterval(refresh,config.refreshInterval||300000);
});
window.openModal=openModal;window.closeModal=closeModal;
