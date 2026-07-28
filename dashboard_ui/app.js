/**
 * app.js — Paramount Merchant Navy Dashboard v12
 *
 * NEW: Login page, editable fields, enrollment form pre-fill link
 */

/* ===================== CSV PARSER ===================== */
function parseCsv(text){var rows=[],row=[],field='',inQ=false;for(var i=0;i<text.length;i++){var c=text[i];if(inQ){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else inQ=false;}else field+=c;}else if(c==='"')inQ=true;else if(c===','){row.push(field);field='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';if(row.some(function(v){return v!=='';}))rows.push(row);row=[];}else field+=c;}if(field!==''||row.length){row.push(field);if(row.some(function(v){return v!=='';}))rows.push(row);}if(!rows.length)return[];var hdr=rows[0].map(function(h){return h.trim();});return rows.slice(1).map(function(r){var o={};hdr.forEach(function(h,idx){o[h]=(r[idx]||'').trim();});return o;});}

/* ===================== HELPERS ===================== */
var $=function(id){return document.getElementById(id);};
function norm(s){return String(s).toLowerCase().replace(/[_\s\/\-\.]+/g,'').trim();}
function getF(row){var names=Array.prototype.slice.call(arguments,1),keys=Object.keys(row);for(var i=0;i<names.length;i++){if(row[names[i]]!==undefined&&row[names[i]]!=='')return row[names[i]];}var ns=names.map(norm);for(var k=0;k<keys.length;k++){var nk=norm(keys[k]);for(var j=0;j<ns.length;j++){if(nk===ns[j]&&row[keys[k]]!=='')return row[keys[k]];}}var parts=['phone','mobile','contact','status','name','email','course','city','counsell','remark','batch','education','source','hear'];for(var p=0;p<names.length;p++){var sn=norm(names[p]);for(var m=0;m<keys.length;m++){var nkey=norm(keys[m]);for(var pi=0;pi<parts.length;pi++){if(sn.indexOf(parts[pi])!==-1&&nkey.indexOf(parts[pi])!==-1&&row[keys[m]]!=='')return row[keys[m]];}}}return '';}
function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
var STATUSES=['New Lead','Contacted','Interested','Counselling Scheduled','Admission Pending','Enrolled','Completed','Lost'];
var ACTIVE=['New Lead','Contacted','Interested','Counselling Scheduled','Admission Pending'];
var ARCHIVE=['Enrolled','Completed','Lost'];
function matchStatus(raw){if(!raw)return'New Lead';var n=norm(raw);for(var i=0;i<STATUSES.length;i++){if(norm(STATUSES[i])===n)return STATUSES[i];}if(n.indexOf('enroll')!==-1)return'Enrolled';if(n.indexOf('complet')!==-1)return'Completed';if(n.indexOf('lost')!==-1)return'Lost';if(n.indexOf('interest')!==-1)return'Interested';if(n.indexOf('contact')!==-1)return'Contacted';if(n.indexOf('schedul')!==-1)return'Counselling Scheduled';if(n.indexOf('pending')!==-1)return'Admission Pending';if(n.indexOf('new')!==-1)return'New Lead';return raw;}
function showBanner(msg,isErr){var el=$('statusBanner');el.textContent=msg;el.classList.remove('hidden');el.classList.toggle('error',!!isErr);}
function hideBanner(){$('statusBanner').classList.add('hidden');}
function hasApi(){return config.appsScriptUrl&&config.appsScriptUrl.length>20&&config.appsScriptUrl.indexOf('/exec')!==-1;}

/* ===================== LOGIN ===================== */
function checkLogin(){
  var saved=sessionStorage.getItem('pmn_user');
  if(saved&&config.users[saved]){showDashboard(saved);return true;}
  return false;
}
function doLogin(){
  var user=$('loginUser').value.trim().toLowerCase();
  var pass=$('loginPass').value;
  if(config.users[user]&&config.users[user]===pass){
    sessionStorage.setItem('pmn_user',user);
    showDashboard(user);
    $('loginError').style.display='none';
  }else{
    $('loginError').style.display='block';
    $('loginPass').value='';
  }
}
function doLogout(){
  sessionStorage.removeItem('pmn_user');
  $('dashboardPage').style.display='none';
  $('loginPage').style.display='flex';
  $('loginUser').value='';$('loginPass').value='';
}
function showDashboard(user){
  $('loginPage').style.display='none';
  $('dashboardPage').style.display='block';
  console.log('🔓 Logged in as:',user);
  refresh();
}

/* ===================== JSONP READ ===================== */
function readFromAppsScript(params){return new Promise(function(resolve,reject){var cb='_cb_'+Date.now()+'_'+Math.floor(Math.random()*10000);var url=config.appsScriptUrl+'?callback='+cb;Object.keys(params).forEach(function(k){url+='&'+k+'='+encodeURIComponent(params[k]||'');});var script=document.createElement('script'),timeout;window[cb]=function(data){cleanup();resolve(data);};script.onerror=function(){cleanup();reject(new Error('JSONP failed'));};function cleanup(){clearTimeout(timeout);try{delete window[cb];}catch(e){}try{script.remove();}catch(e){}}timeout=setTimeout(function(){cleanup();reject(new Error('JSONP timeout'));},15000);script.src=url;document.head.appendChild(script);});}

/* ===================== IFRAME WRITE ===================== */
function sendToAppsScript(params){return new Promise(function(resolve){var id='_f_'+Date.now();var iframe=document.createElement('iframe');iframe.name=id;iframe.id=id;iframe.style.cssText='position:absolute;width:0;height:0;border:0;opacity:0';document.body.appendChild(iframe);var form=document.createElement('form');form.method='GET';form.action=config.appsScriptUrl;form.target=id;form.style.display='none';Object.keys(params).forEach(function(k){var inp=document.createElement('input');inp.type='hidden';inp.name=k;inp.value=params[k]||'';form.appendChild(inp);});document.body.appendChild(form);var done=false;iframe.onload=function(){if(done)return;done=true;var r=null;try{var t=iframe.contentDocument.body.textContent||'';if(t.trim().charAt(0)==='{')r=JSON.parse(t);}catch(e){}setTimeout(function(){try{iframe.remove();form.remove();}catch(e){}},1000);resolve(r||{success:true,note:'sent'});};setTimeout(function(){if(done)return;done=true;try{iframe.remove();form.remove();}catch(e){}resolve({success:true,note:'timeout'});},12000);form.submit();});}

/* ===================== STATE ===================== */
var allLeads=[];var selectedLead=null;var selectedStatus=null;

/* ===================== DATA ===================== */
function mapLead(r){var l={leadId:r.leadId||getF(r,'Lead_ID','Lead ID'),name:r.name||getF(r,'Candidate Full Name','Candidate Name','Name'),email:r.email||getF(r,'Email Address','Email'),phone:r.phone||getF(r,'Phone Number','Phone','Mobile','Contact Number','Phone No'),city:r.city||getF(r,'City / Location','City'),course:r.course||getF(r,'Course Interested In','Course Interested','Course'),source:r.source||getF(r,'How did you hear about us?','Lead Source','Source'),batch:r.batch||getF(r,'Preferred Batch Month','Batch Month','Batch'),education:r.education||getF(r,'Current Education Level','Education'),counsellor:r.counsellor||getF(r,'Counsellor Assigned','Counselor','Counsellor'),remarks:r.remarks||getF(r,'Additional Remarks','Remarks','Notes'),rawStatus:r.status||getF(r,'Status','Lead Status'),timestamp:r.timestamp||getF(r,'Timestamp','Date'),tab:r.tab||'main'};l.status=matchStatus(l.rawStatus);return l;}
async function fetchFromApi(){var result=await readFromAppsScript({action:'getLeads'});if(result&&result.leads)return result.leads.map(mapLead);throw new Error('No data');}
async function fetchFromCsv(){var url=config.leadRegisterCsvUrl;if(!url)throw new Error('CSV URL not set');var resp=await fetch(url,{cache:'no-store'});if(!resp.ok)throw new Error('HTTP '+resp.status);var text=await resp.text();if(text.trimStart().charAt(0)==='<')throw new Error('HTML not CSV');return parseCsv(text).map(mapLead);}

async function refresh(){
  try{hideBanner();
    if(hasApi()){try{allLeads=await fetchFromApi();}catch(e){allLeads=await fetchFromCsv();showBanner('⚠️ CSV fallback',false);}}
    else{allLeads=await fetchFromCsv();}
    renderAll();$('lastUpdated').textContent='Updated: '+new Date().toLocaleTimeString();
  }catch(err){console.error('❌',err);showBanner('⚠️ '+err.message,true);}
}

/* ===================== RENDER ===================== */
function renderAll(){renderKPIs();renderFunnel();renderSources();renderLeadsTable();}
function renderKPIs(){var total=allLeads.length,counts={};STATUSES.forEach(function(s){counts[s]=0;});allLeads.forEach(function(l){if(counts[l.status]!==undefined)counts[l.status]++;else counts['New Lead']++;});var enrolled=counts['Enrolled']+counts['Completed'];var pending=ACTIVE.reduce(function(s,k){return s+(counts[k]||0);},0);var conv=total?((enrolled/total)*100).toFixed(1):'0.0';$('kpiTotalLeads').textContent=total;$('kpiEnrolled').textContent=enrolled;$('kpiConversion').textContent=conv+'%';$('kpiPending').textContent=pending;$('kpiNew').textContent=counts['New Lead'];$('kpiLost').textContent=counts['Lost'];$('leadCount').textContent=total;}
function renderFunnel(){var counts={};STATUSES.forEach(function(s){counts[s]=0;});allLeads.forEach(function(l){if(counts[l.status]!==undefined)counts[l.status]++;else counts['New Lead']++;});var cls={'New Lead':'s-new','Contacted':'s-contacted','Interested':'s-interested','Counselling Scheduled':'s-scheduled','Admission Pending':'s-pending','Enrolled':'s-enrolled','Completed':'s-completed','Lost':'s-lost'};$('statusFunnel').innerHTML=STATUSES.map(function(s){return'<div class="funnel-row '+(cls[s]||'')+'"><span class="funnel-label">'+s+'</span><span class="funnel-count">'+(counts[s]||0)+'</span></div>';}).join('');}
function renderSources(){var c={};allLeads.forEach(function(l){var s=l.source||'Unknown';c[s]=(c[s]||0)+1;});var e=Object.entries(c).sort(function(a,b){return b[1]-a[1];});var max=e.length?e[0][1]:1;$('sourceBreakdown').innerHTML=e.length?e.map(function(x){return'<div class="source-row"><span class="source-name">'+esc(x[0])+'</span><div class="source-bar-wrap"><div class="source-bar" style="width:'+(x[1]/max*100)+'%"></div></div><span class="source-count">'+x[1]+'</span></div>';}).join(''):'<p class="muted">No data</p>';}
function renderLeadsTable(){
  var search=($('searchBox').value||'').toLowerCase(),filterSt=$('filterStatus').value;
  var filtered=allLeads.filter(function(l){if(filterSt&&l.status!==filterSt)return false;if(search)return(l.name||'').toLowerCase().indexOf(search)!==-1||(l.phone||'').toLowerCase().indexOf(search)!==-1||(l.leadId||'').toLowerCase().indexOf(search)!==-1;return true;});
  if(!filtered.length){$('leadsBody').innerHTML='<tr><td colspan="7" class="muted">No matching leads</td></tr>';return;}
  $('leadsBody').innerHTML=filtered.map(function(l){
    var stCls=ARCHIVE.indexOf(l.status)!==-1?(l.status==='Lost'?'badge-lost':'badge-closed'):'badge-open';
    var editId=encodeURIComponent(l.leadId||l.name||'unknown');
    var row='<tr>';
    row+='<td style="font-family:monospace;font-weight:600;color:var(--navy)">'+esc(l.leadId||'—')+'</td>';
    row+='<td>'+esc(l.name)+'</td>';
    row+='<td><a href="tel:'+esc(l.phone)+'" class="phone-link" onclick="event.stopPropagation()">'+esc(l.phone||'—')+'</a></td>';
    row+='<td>'+esc(l.course)+'</td>';
    row+='<td>'+esc(l.counsellor||'—')+'</td>';
    row+='<td><span class="badge '+stCls+'">'+esc(l.status)+'</span></td>';
    row+='<td><button class="edit-btn" onclick="openModal(&quot;'+editId+'&quot;)">✏️</button></td>';
    row+='</tr>';return row;
  }).join('');
}

/* ===================== ENROLLMENT FORM LINK ===================== */
function buildEnrollmentUrl(lead){
  if(!config.enrollmentFormUrl)return null;
  var ids=config.enrollmentEntryIds||{};
  var url=config.enrollmentFormUrl+'?usp=pp_url';
  if(ids.leadId)url+='&entry.'+ids.leadId+'='+encodeURIComponent(lead.leadId||'');
  if(ids.name)url+='&entry.'+ids.name+'='+encodeURIComponent(lead.name||'');
  if(ids.phone)url+='&entry.'+ids.phone+'='+encodeURIComponent(lead.phone||'');
  if(ids.email)url+='&entry.'+ids.email+'='+encodeURIComponent(lead.email||'');
  return url;
}

/* ===================== EDIT MODAL ===================== */
function openModal(encodedLeadId){
  var leadId=decodeURIComponent(encodedLeadId||'');
  var lead=allLeads.find(function(l){return l.leadId===leadId;})||allLeads.find(function(l){return l.name===leadId;});
  if(!lead){alert('Lead not found: '+leadId);return;}
  selectedLead=lead;selectedStatus=null;
  $('mLeadId').textContent=lead.leadId||'(no ID)';
  $('mCurrentStatusLabel').textContent='Current: '+lead.status;

  if(hasApi()){
    $('mEditSection').style.display='block';$('mReadOnly').style.display='none';
    $('saveBtn').style.display='inline-flex';$('mApiWarning').style.display='none';
    $('mName').value=lead.name||'';$('mPhone').value=lead.phone||'';
    $('mEmail').value=lead.email||'';$('mCourse').value=lead.course||'';
    $('mCity').value=lead.city||'';$('mCounsellor').value=lead.counsellor||'';
    $('mBatch').value=lead.batch||'';$('mEducation').value=lead.education||'';
    $('mNotes').value='';$('saveBtn').disabled=true;
    document.querySelectorAll('.st-btn').forEach(function(btn){btn.classList.remove('active');if(btn.dataset.st===lead.status)btn.classList.add('active');});
  }else{
    $('mEditSection').style.display='none';$('saveBtn').style.display='none';$('mApiWarning').style.display='block';
    $('mReadOnly').style.display='block';
    $('mReadOnlyInfo').innerHTML='<div class="info-row"><span class="info-label">👤</span><span>'+esc(lead.name)+'</span></div><div class="info-row"><span class="info-label">📞</span><span>'+esc(lead.phone)+'</span></div><div class="info-row"><span class="info-label">📧</span><span>'+esc(lead.email)+'</span></div><div class="info-row"><span class="info-label">📚</span><span>'+esc(lead.course)+'</span></div><div class="info-row"><span class="info-label">🏙️</span><span>'+esc(lead.city)+'</span></div><div class="info-row"><span class="info-label">👨‍💼</span><span>'+esc(lead.counsellor)+'</span></div>';
  }
  $('mRemarks').textContent=lead.remarks||'No previous remarks';
  $('modal').style.display='flex';
}
function closeModal(){$('modal').style.display='none';selectedLead=null;selectedStatus=null;}
function selectStatusBtn(status){selectedStatus=status;document.querySelectorAll('.st-btn').forEach(function(btn){btn.classList.remove('active');if(btn.dataset.st===status)btn.classList.add('active');});enableSave();}
function enableSave(){if(!selectedLead)return;var changed=selectedStatus&&selectedStatus!==selectedLead.status;var hasNotes=$('mNotes').value.trim().length>0;var fieldsChanged=$('mName').value!==selectedLead.name||$('mPhone').value!==selectedLead.phone||$('mEmail').value!==selectedLead.email||$('mCourse').value!==selectedLead.course||$('mCity').value!==selectedLead.city||$('mCounsellor').value!==selectedLead.counsellor||$('mBatch').value!==selectedLead.batch||$('mEducation').value!==selectedLead.education;$('saveBtn').disabled=!(changed||hasNotes||fieldsChanged);}

async function saveChanges(){
  if(!selectedLead||!hasApi())return;
  var leadId=selectedLead.leadId;if(!leadId){alert('⚠️ No Lead_ID. Run Backfill.');return;}
  var newStatus=selectedStatus||selectedLead.status;
  var notes=$('mNotes').value.trim();
  var fields={name:$('mName').value.trim(),phone:$('mPhone').value.trim(),email:$('mEmail').value.trim(),course:$('mCourse').value.trim(),city:$('mCity').value.trim(),counsellor:$('mCounsellor').value.trim(),batch:$('mBatch').value.trim(),education:$('mEducation').value.trim()};
  $('saveBtn').disabled=true;$('saveBtn').textContent='⏳ Saving…';

  try{
    var result=await sendToAppsScript({action:'updateLead',leadId:leadId,status:newStatus,notes:notes,fields:JSON.stringify(fields)});
    if(result&&result.error){alert('❌ '+result.error);$('saveBtn').disabled=false;$('saveBtn').textContent='💾 Save Changes';return;}

    // If enrolled → open enrollment form pre-filled
    if((newStatus==='Enrolled'||newStatus==='Completed')&&config.enrollmentFormUrl){
      // Update local lead with edited fields first
      var updatedLead={leadId:leadId,name:fields.name,phone:fields.phone,email:fields.email,course:fields.course};
      var formUrl=buildEnrollmentUrl(updatedLead);
      if(formUrl){
        alert('✅ '+leadId+' → "'+newStatus+'"\n\nNow fill the Enrollment Form with fee details.\nThe form will open pre-filled with lead data.');
        window.open(formUrl,'_blank');
      }else{
        alert('✅ '+leadId+' → "'+newStatus+'" (archived)');
      }
    }else{
      alert('✅ Lead updated');
    }
  }catch(err){console.error('❌',err);alert('⚠️ Request sent. Click ⟳ Refresh.');}

  // Update local
  var idx=allLeads.findIndex(function(l){return l.leadId===leadId;});
  if(idx!==-1){allLeads[idx].status=newStatus;allLeads[idx].name=fields.name;allLeads[idx].phone=fields.phone;allLeads[idx].email=fields.email;allLeads[idx].course=fields.course;allLeads[idx].city=fields.city;allLeads[idx].counsellor=fields.counsellor;allLeads[idx].batch=fields.batch;allLeads[idx].education=fields.education;if(notes){var ts=new Date().toLocaleString('en-IN');allLeads[idx].remarks='['+ts+'] '+newStatus+': '+notes+'\n'+(allLeads[idx].remarks||'');}}
  renderAll();closeModal();$('saveBtn').disabled=false;$('saveBtn').textContent='💾 Save Changes';
  setTimeout(refresh,5000);
}

/* ===================== STUDENTS MODAL ===================== */
function openStudentsModal(){
  $('studentsModal').style.display='flex';
  var students=allLeads.filter(function(l){return l.status==='Enrolled'||l.status==='Completed';});
  if(!students.length){$('studentsBody').innerHTML='<tr><td colspan="8" class="muted">No enrolled students yet</td></tr>';return;}
  $('studentsBody').innerHTML=students.map(function(s){
    var formUrl=buildEnrollmentUrl(s);
    var formBtn=formUrl
      ?'<button class="edit-btn" style="background:#2e7d32" onclick="window.open(&quot;'+esc(formUrl)+'&quot;,&quot;_blank&quot;)">📝 Fill Form</button>'
      :'<span class="muted" style="padding:0;font-size:.75rem">No form URL</span>';
    return'<tr>'+
      '<td style="font-family:monospace;font-weight:600">'+esc(s.leadId||'—')+'</td>'+
      '<td>'+esc(s.name)+'</td>'+
      '<td><a href="tel:'+esc(s.phone)+'" class="phone-link" onclick="event.stopPropagation()">'+esc(s.phone||'—')+'</a></td>'+
      '<td>'+esc(s.email||'—')+'</td>'+
      '<td>'+esc(s.course||'—')+'</td>'+
      '<td>'+esc(s.counsellor||'—')+'</td>'+
      '<td><span class="badge badge-closed">'+esc(s.status)+'</span></td>'+
      '<td>'+formBtn+'</td></tr>';
  }).join('');
}
function closeStudentsModal(){$('studentsModal').style.display='none';}
function copyStudentsToClipboard(){
  var students=allLeads.filter(function(l){return l.status==='Enrolled'||l.status==='Completed';});
  if(!students.length){alert('No students');return;}
  var text='Lead_ID\tName\tPhone\tEmail\tCourse\tBatch\tCounsellor\tStatus\tCity\tEducation\n';
  text+=students.map(function(s){return[s.leadId,s.name,s.phone,s.email,s.course,s.batch,s.counsellor,s.status,s.city,s.education].join('\t');}).join('\n');
  navigator.clipboard.writeText(text).then(function(){alert('✅ Copied '+students.length+' students!');}).catch(function(){var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();alert('✅ Copied!');});
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded',function(){
  console.log('🚀 Dashboard v12 — login + editable + enrollment');

  // Login handlers
  $('loginBtn').addEventListener('click',doLogin);
  $('loginPass').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
  $('loginUser').addEventListener('keydown',function(e){if(e.key==='Enter')$('loginPass').focus();});

  // Check if already logged in
  if(!checkLogin()){
    $('loginPage').style.display='flex';$('dashboardPage').style.display='none';
  }

  // Dashboard event listeners
  if(hasApi()){$('editMode').textContent='✏️ Edit mode';$('editMode').style.color='#8f8';}
  else{$('editMode').innerHTML='📖 Read-only';$('editMode').style.color='#ffa';}
  if(config.quickAddFormUrl&&config.quickAddFormUrl.indexOf('google.com')!==-1)$('quickAddBtn').href=config.quickAddFormUrl;
  document.querySelectorAll('.st-btn').forEach(function(btn){btn.addEventListener('click',function(){selectStatusBtn(btn.dataset.st);});});
  $('mNotes').addEventListener('input',enableSave);
  ['mName','mPhone','mEmail','mCourse','mCity','mCounsellor','mBatch','mEducation'].forEach(function(id){$(id).addEventListener('input',enableSave);});
  $('searchBox').addEventListener('input',renderLeadsTable);
  $('filterStatus').addEventListener('change',renderLeadsTable);
  $('refreshBtn').addEventListener('click',refresh);
  $('studentsBtn').addEventListener('click',openStudentsModal);
  $('logoutBtn').addEventListener('click',doLogout);
  setInterval(refresh,config.refreshInterval||300000);
});
window.openModal=openModal;window.closeModal=closeModal;window.closeStudentsModal=closeStudentsModal;window.copyStudentsToClipboard=copyStudentsToClipboard;
