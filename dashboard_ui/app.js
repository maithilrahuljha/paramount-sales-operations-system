/**
 * ============================================================================
 * PARAMOUNT MERCHANT NAVY - SALES DASHBOARD APPLICATION v2.0
 * ============================================================================
 * Features:
 * - Real-time KPI display
 * - Lead status management (edit by Lead ID)
 * - Status workflow: New Lead → Contacted → Interested → 
 *   Counselling Scheduled → Admission Pending → Enrolled/Completed/Lost
 * - Auto-refresh every 5 minutes
 * ============================================================================
 */

// ============================================
// GLOBAL STATE
// ============================================
const AppState = {
    leads: [],
    followups: [],
    kpis: {},
    lastUpdated: null,
    isLoading: true,
    hasError: false,
    currentView: 'dashboard',
    currentFilter: 'all',
    selectedLead: null,
    selectedStatus: null,
    refreshInterval: null
};

// Status workflow configuration
const STATUS_CONFIG = {
    'New Lead': { color: '#17a2b8', class: 'new-lead', priority: 'P2' },
    'Contacted': { color: '#9c27b0', class: 'contacted', priority: 'P2' },
    'Interested': { color: '#fd7e14', class: 'interested', priority: 'P1' },
    'Counselling Scheduled': { color: '#2196f3', class: 'counselling-scheduled', priority: 'P1' },
    'Admission Pending': { color: '#ff9800', class: 'admission-pending', priority: 'P1' },
    'Enrolled': { color: '#28a745', class: 'enrolled', priority: 'P3', archived: true },
    'Completed': { color: '#388e3c', class: 'completed', priority: 'P3', archived: true },
    'Lost': { color: '#dc3545', class: 'lost', priority: 'P3', archived: true }
};

// ============================================
// DOM ELEMENTS
// ============================================
const DOM = {
    loadingOverlay: document.getElementById('loadingOverlay'),
    errorBanner: document.getElementById('errorBanner'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    
    // Views
    dashboardView: document.getElementById('dashboardView'),
    leadsView: document.getElementById('leadsView'),
    followupsView: document.getElementById('followupsView'),
    
    // KPIs
    todaysLeads: document.getElementById('todaysLeads'),
    totalLeads: document.getElementById('totalLeads'),
    enrolledCount: document.getElementById('enrolledCount'),
    conversionRate: document.getElementById('conversionRate'),
    conversionProgress: document.getElementById('conversionProgress'),
    pendingFollowups: document.getElementById('pendingFollowups'),
    lostCount: document.getElementById('lostCount'),
    
    // Quick Stats
    newLeadCount: document.getElementById('newLeadCount'),
    contactedCount: document.getElementById('contactedCount'),
    interestedCount: document.getElementById('interestedCount'),
    scheduledCount: document.getElementById('scheduledCount'),
    pendingCount: document.getElementById('pendingCount'),
    
    // Status Funnel
    statusFunnel: document.getElementById('statusFunnel'),
    sourceBreakdown: document.getElementById('sourceBreakdown'),
    followupList: document.getElementById('followupList'),
    followupBadge: document.getElementById('followupBadge'),
    
    // Leads Table
    leadsTableBody: document.getElementById('leadsTableBody'),
    leadSearch: document.getElementById('leadSearch'),
    statusFilter: document.getElementById('statusFilter'),
    leadsBadge: document.getElementById('leadsBadge'),
    
    // Followups Grid
    followupsGrid: document.getElementById('followupsGrid'),
    
    // Modal
    editModal: document.getElementById('editModal'),
    editLeadId: document.getElementById('editLeadId'),
    currentStatusBadge: document.getElementById('currentStatusBadge'),
    editCandidateName: document.getElementById('editCandidateName'),
    editPhone: document.getElementById('editPhone'),
    editEmail: document.getElementById('editEmail'),
    editCourse: document.getElementById('editCourse'),
    editCity: document.getElementById('editCity'),
    editCounsellor: document.getElementById('editCounsellor'),
    updateNotes: document.getElementById('updateNotes'),
    previousRemarks: document.getElementById('previousRemarks'),
    saveStatus: document.getElementById('saveStatus'),
    closeModal: document.getElementById('closeModal'),
    cancelEdit: document.getElementById('cancelEdit'),
    
    // Footer
    lastUpdated: document.getElementById('lastUpdated'),
    refreshStatus: document.getElementById('refreshStatus'),
    
    // Buttons
    quickAddBtn: document.getElementById('quickAddBtn'),
    quickAddBtnMobile: document.getElementById('quickAddBtnMobile'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileNav: document.getElementById('mobileNav')
};

// ============================================
// CSV PARSING
// ============================================
function parseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];
    
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= headers.length - 1) {
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = (values[index] || '').trim();
            });
            data.push(row);
        }
    }
    return data;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values.map(v => v.replace(/^"|"$/g, ''));
}

// ============================================
// DATA FETCHING
// ============================================
async function fetchCSVData(url) {
    if (!url || url.includes('YOUR_CSV_URL_HERE')) {
        console.warn('CSV URL not configured');
        return [];
    }
    
    try {
        const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

async function fetchAllData() {
    console.log('🔄 Fetching data...');
    showLoading(true);
    hideError();
    
    try {
        const [leadsData, followupsData] = await Promise.all([
            fetchCSVData(CONFIG.leadRegisterCsvUrl).catch(() => []),
            fetchCSVData(CONFIG.followupTrackerCsvUrl).catch(() => [])
        ]);
        
        // Map leads data to standard format
        AppState.leads = leadsData.map(lead => ({
            leadId: lead['Lead_ID'] || lead['Lead ID'] || '',
            candidateName: lead['Candidate Full Name'] || lead['Student_Name'] || lead['Name'] || '',
            email: lead['Email Address'] || lead['Email'] || '',
            phone: lead['Phone Number'] || lead['Phone'] || '',
            city: lead['City / Location'] || lead['City'] || '',
            course: lead['Course Interested In'] || lead['Course'] || '',
            source: lead['How did you hear about us?'] || lead['Source'] || '',
            batchMonth: lead['Preferred Batch Month'] || '',
            education: lead['Current Education Level'] || '',
            counsellor: lead['Counsellor Assigned'] || lead['Counselor'] || '',
            remarks: lead['Additional Remarks'] || lead['Remarks'] || '',
            status: lead['Status'] || 'New Lead'
        }));
        
        AppState.followups = followupsData;
        AppState.lastUpdated = new Date();
        AppState.hasError = false;
        
        console.log(`✅ Loaded ${AppState.leads.length} leads`);
        
        calculateKPIs();
        updateDashboard();
        
    } catch (error) {
        console.error('❌ Error:', error);
        AppState.hasError = true;
        showError('Unable to fetch data. Please check your connection and CSV URLs.');
    } finally {
        showLoading(false);
    }
}

// ============================================
// KPI CALCULATIONS
// ============================================
function calculateKPIs() {
    const leads = AppState.leads;
    const today = new Date();
    const todayStr = formatDate(today, 'YYYY-MM-DD');
    
    const kpis = {
        totalLeads: leads.length,
        todaysLeads: 0,
        statusCounts: {
            'New Lead': 0,
            'Contacted': 0,
            'Interested': 0,
            'Counselling Scheduled': 0,
            'Admission Pending': 0,
            'Enrolled': 0,
            'Completed': 0,
            'Lost': 0
        },
        sources: {},
        counsellors: {}
    };
    
    leads.forEach(lead => {
        // Count by status
        const status = lead.status || 'New Lead';
        if (kpis.statusCounts.hasOwnProperty(status)) {
            kpis.statusCounts[status]++;
        } else {
            kpis.statusCounts['New Lead']++;
        }
        
        // Count by source
        const source = lead.source || 'Unknown';
        kpis.sources[source] = (kpis.sources[source] || 0) + 1;
        
        // Count by counsellor
        const counsellor = lead.counsellor || 'Unassigned';
        kpis.counsellors[counsellor] = (kpis.counsellors[counsellor] || 0) + 1;
    });
    
    // Calculate pending followups (not enrolled, completed, or lost)
    kpis.pendingFollowups = kpis.statusCounts['New Lead'] + 
                           kpis.statusCounts['Contacted'] + 
                           kpis.statusCounts['Interested'] + 
                           kpis.statusCounts['Counselling Scheduled'] + 
                           kpis.statusCounts['Admission Pending'];
    
    // Calculate conversion rate
    const totalAttempted = kpis.totalLeads - kpis.statusCounts['New Lead'];
    if (totalAttempted > 0) {
        kpis.conversionRate = ((kpis.statusCounts['Enrolled'] + kpis.statusCounts['Completed']) / kpis.totalLeads * 100).toFixed(1);
    } else {
        kpis.conversionRate = '0.0';
    }
    
    AppState.kpis = kpis;
}

// ============================================
// UI UPDATES
// ============================================
function updateDashboard() {
    const kpis = AppState.kpis;
    
    // Update KPI cards
    animateValue(DOM.todaysLeads, kpis.todaysLeads || 0);
    animateValue(DOM.totalLeads, kpis.totalLeads);
    animateValue(DOM.enrolledCount, kpis.statusCounts['Enrolled'] + kpis.statusCounts['Completed']);
    DOM.conversionRate.textContent = `${kpis.conversionRate}%`;
    DOM.conversionProgress.style.width = `${Math.min(parseFloat(kpis.conversionRate), 100)}%`;
    animateValue(DOM.pendingFollowups, kpis.pendingFollowups);
    animateValue(DOM.lostCount, kpis.statusCounts['Lost']);
    
    // Update quick stats
    animateValue(DOM.newLeadCount, kpis.statusCounts['New Lead']);
    animateValue(DOM.contactedCount, kpis.statusCounts['Contacted']);
    animateValue(DOM.interestedCount, kpis.statusCounts['Interested']);
    animateValue(DOM.scheduledCount, kpis.statusCounts['Counselling Scheduled']);
    animateValue(DOM.pendingCount, kpis.statusCounts['Admission Pending']);
    
    // Update funnel
    updateStatusFunnel(kpis.statusCounts);
    
    // Update source breakdown
    updateSourceBreakdown(kpis.sources);
    
    // Update followup list
    updateFollowupList();
    
    // Update leads table
    updateLeadsTable();
    
    // Update followups grid
    updateFollowupsGrid();
    
    // Update badges
    if (DOM.followupBadge) DOM.followupBadge.textContent = kpis.pendingFollowups;
    if (DOM.leadsBadge) DOM.leadsBadge.textContent = kpis.totalLeads;
    
    // Update timestamp
    if (AppState.lastUpdated && DOM.lastUpdated) {
        DOM.lastUpdated.textContent = formatTimestamp(AppState.lastUpdated);
    }
}

function updateStatusFunnel(statusCounts) {
    if (!DOM.statusFunnel) return;
    
    const total = AppState.leads.length || 1;
    const statuses = [
        { name: 'New Lead', class: 'status-new' },
        { name: 'Contacted', class: 'status-contacted' },
        { name: 'Interested', class: 'status-interested' },
        { name: 'Counselling Scheduled', class: 'status-scheduled' },
        { name: 'Admission Pending', class: 'status-pending' },
        { name: 'Enrolled', class: 'status-enrolled' },
        { name: 'Completed', class: 'status-completed' },
        { name: 'Lost', class: 'status-lost' }
    ];
    
    DOM.statusFunnel.innerHTML = statuses.map(status => {
        const count = statusCounts[status.name] || 0;
        const percentage = ((count / total) * 100).toFixed(0);
        return `
            <div class="funnel-item ${status.class}">
                <span class="funnel-label">${status.name}</span>
                <span class="funnel-count">${count}</span>
                <div class="funnel-bar">
                    <div class="funnel-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function updateSourceBreakdown(sources) {
    if (!DOM.sourceBreakdown) return;
    
    const sortedSources = Object.entries(sources)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    
    if (sortedSources.length === 0) {
        DOM.sourceBreakdown.innerHTML = '<div class="source-item"><span class="source-name">No data</span><span class="source-count">--</span></div>';
        return;
    }
    
    DOM.sourceBreakdown.innerHTML = sortedSources.map(([source, count]) => `
        <div class="source-item">
            <span class="source-name">${escapeHtml(source)}</span>
            <span class="source-count">${count}</span>
        </div>
    `).join('');
}

function updateFollowupList() {
    if (!DOM.followupList) return;
    
    // Filter leads that need followup (not enrolled, completed, or lost)
    let followupLeads = AppState.leads.filter(lead => {
        const status = lead.status || 'New Lead';
        return !['Enrolled', 'Completed', 'Lost'].includes(status);
    });
    
    // Apply filter
    const filter = AppState.currentFilter;
    if (filter !== 'all') {
        const filterMap = {
            'new': 'New Lead',
            'contacted': 'Contacted',
            'interested': 'Interested',
            'scheduled': 'Counselling Scheduled'
        };
        if (filterMap[filter]) {
            followupLeads = followupLeads.filter(lead => lead.status === filterMap[filter]);
        }
    }
    
    // Sort by priority (Interested and Scheduled first)
    followupLeads.sort((a, b) => {
        const priorityOrder = {
            'Interested': 1,
            'Counselling Scheduled': 2,
            'Admission Pending': 3,
            'Contacted': 4,
            'New Lead': 5
        };
        return (priorityOrder[a.status] || 6) - (priorityOrder[b.status] || 6);
    });
    
    if (followupLeads.length === 0) {
        DOM.followupList.innerHTML = `
            <div class="followup-empty">
                <span class="empty-icon">✅</span>
                <p>No pending follow-ups!</p>
            </div>
        `;
        return;
    }
    
    DOM.followupList.innerHTML = followupLeads.slice(0, 15).map(lead => {
        const statusClass = STATUS_CONFIG[lead.status]?.class || 'new-lead';
        return `
            <div class="followup-item status-${statusClass}" onclick="openEditModal('${escapeHtml(lead.leadId)}')">
                <div class="status-indicator ${statusClass.split('-')[0]}"></div>
                <div class="followup-details">
                    <div class="followup-name">${escapeHtml(lead.candidateName)}</div>
                    <div class="followup-meta">
                        <span>🆔 ${escapeHtml(lead.leadId)}</span>
                        <span>📞 ${escapeHtml(lead.phone)}</span>
                        <span>👨‍💼 ${escapeHtml(lead.counsellor || 'Unassigned')}</span>
                    </div>
                </div>
                <span class="followup-status">${lead.status}</span>
            </div>
        `;
    }).join('');
}

function updateLeadsTable() {
    if (!DOM.leadsTableBody) return;
    
    let filteredLeads = [...AppState.leads];
    
    // Apply search filter
    const searchTerm = DOM.leadSearch?.value?.toLowerCase() || '';
    if (searchTerm) {
        filteredLeads = filteredLeads.filter(lead => 
            lead.leadId.toLowerCase().includes(searchTerm) ||
            lead.candidateName.toLowerCase().includes(searchTerm) ||
            lead.phone.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply status filter
    const statusFilter = DOM.statusFilter?.value || '';
    if (statusFilter) {
        filteredLeads = filteredLeads.filter(lead => lead.status === statusFilter);
    }
    
    if (filteredLeads.length === 0) {
        DOM.leadsTableBody.innerHTML = `
            <tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                No leads found
            </td></tr>
        `;
        return;
    }
    
    DOM.leadsTableBody.innerHTML = filteredLeads.map(lead => {
        const statusClass = STATUS_CONFIG[lead.status]?.class || 'new-lead';
        return `
            <tr>
                <td class="lead-id">${escapeHtml(lead.leadId)}</td>
                <td>${escapeHtml(lead.candidateName)}</td>
                <td>${escapeHtml(lead.phone)}</td>
                <td>${escapeHtml(lead.course)}</td>
                <td>${escapeHtml(lead.counsellor || 'Unassigned')}</td>
                <td><span class="status-cell ${statusClass}">${lead.status}</span></td>
                <td><button class="edit-btn" onclick="openEditModal('${escapeHtml(lead.leadId)}')">✏️ Edit</button></td>
            </tr>
        `;
    }).join('');
}

function updateFollowupsGrid() {
    if (!DOM.followupsGrid) return;
    
    const activeLeads = AppState.leads.filter(lead => 
        !['Enrolled', 'Completed', 'Lost'].includes(lead.status)
    );
    
    if (activeLeads.length === 0) {
        DOM.followupsGrid.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666; grid-column: 1/-1;">
                <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">✅</span>
                <p>No active follow-ups</p>
            </div>
        `;
        return;
    }
    
    DOM.followupsGrid.innerHTML = activeLeads.map(lead => {
        const statusClass = STATUS_CONFIG[lead.status]?.class || 'new-lead';
        return `
            <div class="followup-card" style="border-left-color: ${STATUS_CONFIG[lead.status]?.color || '#1a237e'}" 
                 onclick="openEditModal('${escapeHtml(lead.leadId)}')">
                <div class="followup-card-header">
                    <span class="followup-card-id">${escapeHtml(lead.leadId)}</span>
                    <span class="status-cell ${statusClass}">${lead.status}</span>
                </div>
                <div class="followup-card-name">${escapeHtml(lead.candidateName)}</div>
                <div class="followup-card-info">
                    <span>📞 ${escapeHtml(lead.phone)}</span>
                    <span>📧 ${escapeHtml(lead.email)}</span>
                    <span>📚 ${escapeHtml(lead.course)}</span>
                    <span>👨‍💼 ${escapeHtml(lead.counsellor || 'Unassigned')}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function openEditModal(leadId) {
    const lead = AppState.leads.find(l => l.leadId === leadId);
    if (!lead) {
        alert('Lead not found: ' + leadId);
        return;
    }
    
    AppState.selectedLead = lead;
    AppState.selectedStatus = null;
    
    // Populate modal
    DOM.editLeadId.textContent = lead.leadId;
    DOM.currentStatusBadge.textContent = lead.status;
    DOM.editCandidateName.textContent = lead.candidateName;
    DOM.editPhone.textContent = lead.phone;
    DOM.editEmail.textContent = lead.email || 'N/A';
    DOM.editCourse.textContent = lead.course || 'N/A';
    DOM.editCity.textContent = lead.city || 'N/A';
    DOM.editCounsellor.textContent = lead.counsellor || 'Unassigned';
    DOM.previousRemarks.textContent = lead.remarks || 'No previous remarks';
    DOM.updateNotes.value = '';
    
    // Update status buttons
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === lead.status) {
            btn.classList.add('active');
        }
    });
    
    DOM.saveStatus.disabled = true;
    DOM.editModal.style.display = 'flex';
}

function closeEditModal() {
    DOM.editModal.style.display = 'none';
    AppState.selectedLead = null;
    AppState.selectedStatus = null;
}

function selectStatus(status) {
    AppState.selectedStatus = status;
    
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === status) {
            btn.classList.add('active');
        }
    });
    
    // Enable save button if status changed
    DOM.saveStatus.disabled = (status === AppState.selectedLead?.status);
}

async function saveStatusChange() {
    if (!AppState.selectedLead || !AppState.selectedStatus) return;
    
    const leadId = AppState.selectedLead.leadId;
    const newStatus = AppState.selectedStatus;
    const notes = DOM.updateNotes.value.trim();
    
    // Show loading state
    DOM.saveStatus.disabled = true;
    DOM.saveStatus.innerHTML = '<span class="btn-icon">⏳</span> Saving...';
    
    try {
        // If Apps Script Web App URL is configured, call it
        if (CONFIG.appsScriptWebAppUrl && !CONFIG.appsScriptWebAppUrl.includes('YOUR_')) {
            const response = await fetch(CONFIG.appsScriptWebAppUrl, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateStatus',
                    leadId: leadId,
                    status: newStatus,
                    notes: notes
                })
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Update failed');
            }
        }
        
        // Update local state
        const leadIndex = AppState.leads.findIndex(l => l.leadId === leadId);
        if (leadIndex !== -1) {
            AppState.leads[leadIndex].status = newStatus;
            if (notes) {
                const timestamp = formatTimestamp(new Date());
                AppState.leads[leadIndex].remarks = `[${timestamp}] ${newStatus}: ${notes}\n${AppState.leads[leadIndex].remarks || ''}`;
            }
        }
        
        // Recalculate and update UI
        calculateKPIs();
        updateDashboard();
        
        // Show success
        alert(`✅ Status updated to "${newStatus}" for ${leadId}`);
        closeEditModal();
        
    } catch (error) {
        console.error('Save error:', error);
        alert('❌ Error saving: ' + error.message + '\n\nNote: If Apps Script Web App is not configured, changes are only saved locally and will reset on refresh.');
        
        // Still update locally for demo purposes
        const leadIndex = AppState.leads.findIndex(l => l.leadId === leadId);
        if (leadIndex !== -1) {
            AppState.leads[leadIndex].status = newStatus;
        }
        calculateKPIs();
        updateDashboard();
        closeEditModal();
    } finally {
        DOM.saveStatus.disabled = false;
        DOM.saveStatus.innerHTML = '<span class="btn-icon">💾</span> Save Changes';
    }
}

// ============================================
// VIEW NAVIGATION
// ============================================
function switchView(viewName) {
    AppState.currentView = viewName;
    
    // Hide all views
    DOM.dashboardView.style.display = 'none';
    DOM.leadsView.style.display = 'none';
    DOM.followupsView.style.display = 'none';
    
    // Show selected view
    switch (viewName) {
        case 'dashboard':
            DOM.dashboardView.style.display = 'block';
            break;
        case 'leads':
            DOM.leadsView.style.display = 'block';
            updateLeadsTable();
            break;
        case 'followups':
            DOM.followupsView.style.display = 'block';
            updateFollowupsGrid();
            break;
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewName) {
            btn.classList.add('active');
        }
    });
    
    // Close mobile nav
    if (DOM.mobileNav) DOM.mobileNav.classList.remove('active');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function animateValue(element, targetValue) {
    if (!element) return;
    const startValue = parseInt(element.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
        element.textContent = currentValue.toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function formatDate(date, format = 'YYYY-MM-DD') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
    return `${year}-${month}-${day}`;
}

function formatTimestamp(date) {
    return date.toLocaleString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function showLoading(show) {
    if (DOM.loadingOverlay) {
        DOM.loadingOverlay.classList.toggle('hidden', !show);
    }
}

function showError(message) {
    if (DOM.errorBanner && DOM.errorMessage) {
        DOM.errorMessage.textContent = message;
        DOM.errorBanner.style.display = 'flex';
    }
}

function hideError() {
    if (DOM.errorBanner) DOM.errorBanner.style.display = 'none';
}

// ============================================
// EVENT LISTENERS
// ============================================
function initEventListeners() {
    // Quick Add buttons
    const openForm = () => {
        if (CONFIG.quickAddFormUrl && !CONFIG.quickAddFormUrl.includes('YOUR_')) {
            window.open(CONFIG.quickAddFormUrl, '_blank');
        } else {
            alert('Lead Intake Form URL not configured. Please update config.js');
        }
    };
    if (DOM.quickAddBtn) DOM.quickAddBtn.addEventListener('click', openForm);
    if (DOM.quickAddBtnMobile) DOM.quickAddBtnMobile.addEventListener('click', openForm);
    
    // Navigation
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
        if (btn.dataset.view) {
            btn.addEventListener('click', () => switchView(btn.dataset.view));
        }
    });
    
    // Mobile menu
    if (DOM.mobileMenuBtn && DOM.mobileNav) {
        DOM.mobileMenuBtn.addEventListener('click', () => {
            DOM.mobileNav.classList.toggle('active');
        });
    }
    
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            AppState.currentFilter = tab.dataset.filter;
            updateFollowupList();
        });
    });
    
    // Search and filter
    if (DOM.leadSearch) {
        DOM.leadSearch.addEventListener('input', updateLeadsTable);
    }
    if (DOM.statusFilter) {
        DOM.statusFilter.addEventListener('change', updateLeadsTable);
    }
    
    // Modal
    if (DOM.closeModal) DOM.closeModal.addEventListener('click', closeEditModal);
    if (DOM.cancelEdit) DOM.cancelEdit.addEventListener('click', closeEditModal);
    if (DOM.saveStatus) DOM.saveStatus.addEventListener('click', saveStatusChange);
    
    // Status buttons in modal
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', () => selectStatus(btn.dataset.status));
    });
    
    // Click outside modal to close
    if (DOM.editModal) {
        DOM.editModal.addEventListener('click', (e) => {
            if (e.target === DOM.editModal) closeEditModal();
        });
    }
    
    // Retry button
    if (DOM.retryBtn) DOM.retryBtn.addEventListener('click', fetchAllData);
}

// ============================================
// AUTO-REFRESH
// ============================================
function startAutoRefresh() {
    if (AppState.refreshInterval) clearInterval(AppState.refreshInterval);
    
    const interval = CONFIG.refreshInterval || 300000;
    AppState.refreshInterval = setInterval(() => {
        console.log('⏰ Auto-refresh');
        fetchAllData();
    }, interval);
    
    if (DOM.refreshStatus) DOM.refreshStatus.textContent = 'Active';
}

// ============================================
// INITIALIZATION
// ============================================
async function init() {
    console.log('🚀 Initializing Dashboard...');
    
    if (typeof CONFIG === 'undefined') {
        showLoading(false);
        showError('Configuration not loaded. Please ensure config.js is included.');
        return;
    }
    
    initEventListeners();
    await fetchAllData();
    startAutoRefresh();
    
    // Pause refresh when tab hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (AppState.refreshInterval) clearInterval(AppState.refreshInterval);
            if (DOM.refreshStatus) DOM.refreshStatus.textContent = 'Paused';
        } else {
            startAutoRefresh();
            fetchAllData();
        }
    });
    
    console.log('✅ Dashboard initialized');
}

// Make functions globally accessible
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
