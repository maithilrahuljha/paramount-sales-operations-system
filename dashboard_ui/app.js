/**
 * ============================================================================
 * PARAMOUNT MERCHANT NAVY - SALES DASHBOARD APPLICATION v2.1
 * ============================================================================
 * Fixed: Shows UI even when data fails to load
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
    errorMessage: '',
    currentView: 'dashboard',
    currentFilter: 'all',
    selectedLead: null,
    selectedStatus: null,
    refreshInterval: null,
    dataLoaded: false
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
// INITIALIZATION - Run immediately
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard loading...');
    init();
});

// ============================================
// DOM ELEMENTS - Get them safely
// ============================================
function getDOM() {
    return {
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
}

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
        if (values.length >= headers.length - 2) { // Allow some missing columns
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
    // Check if URL is a placeholder
    if (!url || url.includes('YOUR_CSV_URL_HERE') || url.includes('YOUR_')) {
        console.warn('⚠️ CSV URL not configured:', url);
        return null; // Return null to indicate not configured
    }
    
    try {
        console.log('📡 Fetching:', url.substring(0, 50) + '...');
        const response = await fetch(url, { 
            method: 'GET', 
            mode: 'cors', 
            cache: 'no-cache' 
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const csvText = await response.text();
        const data = parseCSV(csvText);
        console.log(`✅ Loaded ${data.length} rows`);
        return data;
        
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        throw error;
    }
}

async function fetchAllData() {
    const DOM = getDOM();
    console.log('🔄 Fetching data...');
    
    showLoading(true);
    hideError();
    
    // Check if CONFIG exists
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG not defined');
        showError('Configuration error: config.js not loaded properly');
        showLoading(false);
        showEmptyState();
        return;
    }
    
    try {
        // Try to fetch lead data
        const leadsResult = await fetchCSVData(CONFIG.leadRegisterCsvUrl);
        
        if (leadsResult === null) {
            // URL not configured - show setup message
            console.warn('⚠️ CSV URL not configured - showing setup instructions');
            AppState.leads = getDemoData();
            AppState.hasError = true;
            AppState.errorMessage = 'CSV URL not configured. Using demo data. Please update config.js with your published Google Sheet CSV URL.';
            showError(AppState.errorMessage);
        } else if (leadsResult.length === 0) {
            // No data
            console.warn('⚠️ No data in sheet');
            AppState.leads = [];
        } else {
            // Success!
            AppState.leads = leadsResult.map(lead => mapLeadData(lead));
            AppState.hasError = false;
            AppState.dataLoaded = true;
        }
        
        // Try followups (optional)
        try {
            const followupsResult = await fetchCSVData(CONFIG.followupTrackerCsvUrl);
            AppState.followups = followupsResult || [];
        } catch (e) {
            AppState.followups = [];
        }
        
        AppState.lastUpdated = new Date();
        
        // Calculate and display
        calculateKPIs();
        updateDashboard();
        
    } catch (error) {
        console.error('❌ Data fetch failed:', error);
        AppState.hasError = true;
        AppState.errorMessage = `Failed to load data: ${error.message}. Check if your Google Sheet is published correctly.`;
        showError(AppState.errorMessage);
        
        // Still show UI with empty/demo data
        AppState.leads = getDemoData();
        calculateKPIs();
        updateDashboard();
    } finally {
        showLoading(false);
    }
}

function mapLeadData(lead) {
    return {
        leadId: lead['Lead_ID'] || lead['Lead ID'] || lead['Timestamp'] || '',
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
        status: lead['Status'] || 'New Lead',
        timestamp: lead['Timestamp'] || ''
    };
}

function getDemoData() {
    // Return demo data so dashboard isn't empty
    return [
        {
            leadId: 'PMN-2026-0001',
            candidateName: 'Demo Student 1',
            email: 'demo1@example.com',
            phone: '9876543210',
            city: 'Mumbai',
            course: 'GP Rating',
            source: 'Website',
            batchMonth: 'January',
            education: '12th Pass (Science)',
            counsellor: 'Counsellor 1',
            remarks: 'Demo data - configure CSV URL to see real data',
            status: 'New Lead'
        },
        {
            leadId: 'PMN-2026-0002',
            candidateName: 'Demo Student 2',
            email: 'demo2@example.com',
            phone: '9876543211',
            city: 'Delhi',
            course: 'Deck Cadet',
            source: 'Facebook',
            batchMonth: 'February',
            education: 'Graduate',
            counsellor: 'Counsellor 2',
            remarks: '',
            status: 'Contacted'
        },
        {
            leadId: 'PMN-2026-0003',
            candidateName: 'Demo Student 3',
            email: 'demo3@example.com',
            phone: '9876543212',
            city: 'Chennai',
            course: 'Engine Cadet',
            source: 'Referral',
            batchMonth: 'March',
            education: '12th Pass (Science)',
            counsellor: 'Counsellor 1',
            remarks: '',
            status: 'Interested'
        }
    ];
}

// ============================================
// KPI CALCULATIONS
// ============================================
function calculateKPIs() {
    const leads = AppState.leads;
    
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
        const status = lead.status || 'New Lead';
        if (kpis.statusCounts.hasOwnProperty(status)) {
            kpis.statusCounts[status]++;
        } else {
            kpis.statusCounts['New Lead']++;
        }
        
        const source = lead.source || 'Unknown';
        kpis.sources[source] = (kpis.sources[source] || 0) + 1;
        
        const counsellor = lead.counsellor || 'Unassigned';
        kpis.counsellors[counsellor] = (kpis.counsellors[counsellor] || 0) + 1;
    });
    
    kpis.pendingFollowups = kpis.statusCounts['New Lead'] + 
                           kpis.statusCounts['Contacted'] + 
                           kpis.statusCounts['Interested'] + 
                           kpis.statusCounts['Counselling Scheduled'] + 
                           kpis.statusCounts['Admission Pending'];
    
    if (kpis.totalLeads > 0) {
        kpis.conversionRate = ((kpis.statusCounts['Enrolled'] + kpis.statusCounts['Completed']) / kpis.totalLeads * 100).toFixed(1);
    } else {
        kpis.conversionRate = '0.0';
    }
    
    AppState.kpis = kpis;
    console.log('📊 KPIs calculated:', kpis);
}

// ============================================
// UI UPDATES
// ============================================
function updateDashboard() {
    const DOM = getDOM();
    const kpis = AppState.kpis;
    
    console.log('🎨 Updating dashboard UI...');
    
    // Update KPI cards safely
    safeSetText(DOM.todaysLeads, kpis.todaysLeads || 0);
    safeSetText(DOM.totalLeads, kpis.totalLeads || 0);
    safeSetText(DOM.enrolledCount, (kpis.statusCounts?.['Enrolled'] || 0) + (kpis.statusCounts?.['Completed'] || 0));
    safeSetText(DOM.conversionRate, `${kpis.conversionRate || 0}%`);
    
    if (DOM.conversionProgress) {
        DOM.conversionProgress.style.width = `${Math.min(parseFloat(kpis.conversionRate) || 0, 100)}%`;
    }
    
    safeSetText(DOM.pendingFollowups, kpis.pendingFollowups || 0);
    safeSetText(DOM.lostCount, kpis.statusCounts?.['Lost'] || 0);
    
    // Quick stats
    safeSetText(DOM.newLeadCount, kpis.statusCounts?.['New Lead'] || 0);
    safeSetText(DOM.contactedCount, kpis.statusCounts?.['Contacted'] || 0);
    safeSetText(DOM.interestedCount, kpis.statusCounts?.['Interested'] || 0);
    safeSetText(DOM.scheduledCount, kpis.statusCounts?.['Counselling Scheduled'] || 0);
    safeSetText(DOM.pendingCount, kpis.statusCounts?.['Admission Pending'] || 0);
    
    // Update other sections
    updateStatusFunnel(kpis.statusCounts || {});
    updateSourceBreakdown(kpis.sources || {});
    updateFollowupList();
    updateLeadsTable();
    updateFollowupsGrid();
    
    // Update badges
    if (DOM.followupBadge) DOM.followupBadge.textContent = kpis.pendingFollowups || 0;
    if (DOM.leadsBadge) DOM.leadsBadge.textContent = kpis.totalLeads || 0;
    
    // Update timestamp
    if (AppState.lastUpdated && DOM.lastUpdated) {
        DOM.lastUpdated.textContent = formatTimestamp(AppState.lastUpdated);
    }
    
    console.log('✅ Dashboard updated');
}

function safeSetText(element, value) {
    if (element) {
        element.textContent = value;
    }
}

function updateStatusFunnel(statusCounts) {
    const DOM = getDOM();
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
        const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
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
    const DOM = getDOM();
    if (!DOM.sourceBreakdown) return;
    
    const sortedSources = Object.entries(sources)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    
    if (sortedSources.length === 0) {
        DOM.sourceBreakdown.innerHTML = '<div class="source-item"><span class="source-name">No data yet</span><span class="source-count">0</span></div>';
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
    const DOM = getDOM();
    if (!DOM.followupList) return;
    
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
    
    // Sort by priority
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
                <span class="empty-icon">📭</span>
                <p>${AppState.leads.length === 0 ? 'No leads yet. Add your first lead!' : 'No pending follow-ups!'}</p>
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
                    <div class="followup-name">${escapeHtml(lead.candidateName || 'Unknown')}</div>
                    <div class="followup-meta">
                        <span>🆔 ${escapeHtml(lead.leadId || 'N/A')}</span>
                        <span>📞 ${escapeHtml(lead.phone || 'N/A')}</span>
                        <span>👨‍💼 ${escapeHtml(lead.counsellor || 'Unassigned')}</span>
                    </div>
                </div>
                <span class="followup-status">${lead.status || 'New Lead'}</span>
            </div>
        `;
    }).join('');
}

function updateLeadsTable() {
    const DOM = getDOM();
    if (!DOM.leadsTableBody) return;
    
    let filteredLeads = [...AppState.leads];
    
    // Apply search
    const searchTerm = DOM.leadSearch?.value?.toLowerCase() || '';
    if (searchTerm) {
        filteredLeads = filteredLeads.filter(lead => 
            (lead.leadId || '').toLowerCase().includes(searchTerm) ||
            (lead.candidateName || '').toLowerCase().includes(searchTerm) ||
            (lead.phone || '').toLowerCase().includes(searchTerm)
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
                ${AppState.leads.length === 0 ? 'No leads yet. Submit a lead through your form!' : 'No matching leads found'}
            </td></tr>
        `;
        return;
    }
    
    DOM.leadsTableBody.innerHTML = filteredLeads.map(lead => {
        const statusClass = STATUS_CONFIG[lead.status]?.class || 'new-lead';
        return `
            <tr>
                <td class="lead-id">${escapeHtml(lead.leadId || 'N/A')}</td>
                <td>${escapeHtml(lead.candidateName || 'Unknown')}</td>
                <td>${escapeHtml(lead.phone || 'N/A')}</td>
                <td>${escapeHtml(lead.course || 'N/A')}</td>
                <td>${escapeHtml(lead.counsellor || 'Unassigned')}</td>
                <td><span class="status-cell ${statusClass}">${lead.status || 'New Lead'}</span></td>
                <td><button class="edit-btn" onclick="openEditModal('${escapeHtml(lead.leadId)}')">✏️ Edit</button></td>
            </tr>
        `;
    }).join('');
}

function updateFollowupsGrid() {
    const DOM = getDOM();
    if (!DOM.followupsGrid) return;
    
    const activeLeads = AppState.leads.filter(lead => 
        !['Enrolled', 'Completed', 'Lost'].includes(lead.status)
    );
    
    if (activeLeads.length === 0) {
        DOM.followupsGrid.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666; grid-column: 1/-1;">
                <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">📭</span>
                <p>No active follow-ups</p>
            </div>
        `;
        return;
    }
    
    DOM.followupsGrid.innerHTML = activeLeads.map(lead => {
        const statusClass = STATUS_CONFIG[lead.status]?.class || 'new-lead';
        const statusColor = STATUS_CONFIG[lead.status]?.color || '#1a237e';
        return `
            <div class="followup-card" style="border-left-color: ${statusColor}" 
                 onclick="openEditModal('${escapeHtml(lead.leadId)}')">
                <div class="followup-card-header">
                    <span class="followup-card-id">${escapeHtml(lead.leadId || 'N/A')}</span>
                    <span class="status-cell ${statusClass}">${lead.status || 'New Lead'}</span>
                </div>
                <div class="followup-card-name">${escapeHtml(lead.candidateName || 'Unknown')}</div>
                <div class="followup-card-info">
                    <span>📞 ${escapeHtml(lead.phone || 'N/A')}</span>
                    <span>📧 ${escapeHtml(lead.email || 'N/A')}</span>
                    <span>📚 ${escapeHtml(lead.course || 'N/A')}</span>
                    <span>👨‍💼 ${escapeHtml(lead.counsellor || 'Unassigned')}</span>
                </div>
            </div>
        `;
    }).join('');
}

function showEmptyState() {
    const DOM = getDOM();
    
    // Show zeros in KPIs
    safeSetText(DOM.todaysLeads, '0');
    safeSetText(DOM.totalLeads, '0');
    safeSetText(DOM.enrolledCount, '0');
    safeSetText(DOM.conversionRate, '0%');
    safeSetText(DOM.pendingFollowups, '0');
    safeSetText(DOM.lostCount, '0');
    safeSetText(DOM.newLeadCount, '0');
    safeSetText(DOM.contactedCount, '0');
    safeSetText(DOM.interestedCount, '0');
    safeSetText(DOM.scheduledCount, '0');
    safeSetText(DOM.pendingCount, '0');
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function openEditModal(leadId) {
    const DOM = getDOM();
    const lead = AppState.leads.find(l => l.leadId === leadId);
    
    if (!lead) {
        alert('Lead not found: ' + leadId);
        return;
    }
    
    AppState.selectedLead = lead;
    AppState.selectedStatus = null;
    
    // Populate modal
    if (DOM.editLeadId) DOM.editLeadId.textContent = lead.leadId || 'N/A';
    if (DOM.currentStatusBadge) DOM.currentStatusBadge.textContent = lead.status || 'New Lead';
    if (DOM.editCandidateName) DOM.editCandidateName.textContent = lead.candidateName || 'Unknown';
    if (DOM.editPhone) DOM.editPhone.textContent = lead.phone || 'N/A';
    if (DOM.editEmail) DOM.editEmail.textContent = lead.email || 'N/A';
    if (DOM.editCourse) DOM.editCourse.textContent = lead.course || 'N/A';
    if (DOM.editCity) DOM.editCity.textContent = lead.city || 'N/A';
    if (DOM.editCounsellor) DOM.editCounsellor.textContent = lead.counsellor || 'Unassigned';
    if (DOM.previousRemarks) DOM.previousRemarks.textContent = lead.remarks || 'No previous remarks';
    if (DOM.updateNotes) DOM.updateNotes.value = '';
    
    // Update status buttons
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === lead.status) {
            btn.classList.add('active');
        }
    });
    
    if (DOM.saveStatus) DOM.saveStatus.disabled = true;
    if (DOM.editModal) DOM.editModal.style.display = 'flex';
}

function closeEditModal() {
    const DOM = getDOM();
    if (DOM.editModal) DOM.editModal.style.display = 'none';
    AppState.selectedLead = null;
    AppState.selectedStatus = null;
}

function selectStatus(status) {
    const DOM = getDOM();
    AppState.selectedStatus = status;
    
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === status) {
            btn.classList.add('active');
        }
    });
    
    if (DOM.saveStatus) {
        DOM.saveStatus.disabled = (status === AppState.selectedLead?.status);
    }
}

async function saveStatusChange() {
    const DOM = getDOM();
    if (!AppState.selectedLead || !AppState.selectedStatus) return;
    
    const leadId = AppState.selectedLead.leadId;
    const newStatus = AppState.selectedStatus;
    const notes = DOM.updateNotes?.value?.trim() || '';
    
    // Update local state
    const leadIndex = AppState.leads.findIndex(l => l.leadId === leadId);
    if (leadIndex !== -1) {
        AppState.leads[leadIndex].status = newStatus;
        if (notes) {
            const timestamp = formatTimestamp(new Date());
            AppState.leads[leadIndex].remarks = `[${timestamp}] ${newStatus}: ${notes}\n${AppState.leads[leadIndex].remarks || ''}`;
        }
    }
    
    // Recalculate and update
    calculateKPIs();
    updateDashboard();
    
    alert(`✅ Status updated to "${newStatus}"\n\n⚠️ Note: This change is saved locally. To save permanently, update the Google Sheet directly or configure the Apps Script Web App.`);
    closeEditModal();
}

// ============================================
// VIEW NAVIGATION
// ============================================
function switchView(viewName) {
    const DOM = getDOM();
    AppState.currentView = viewName;
    
    // Hide all views
    if (DOM.dashboardView) DOM.dashboardView.style.display = 'none';
    if (DOM.leadsView) DOM.leadsView.style.display = 'none';
    if (DOM.followupsView) DOM.followupsView.style.display = 'none';
    
    // Show selected view
    switch (viewName) {
        case 'dashboard':
            if (DOM.dashboardView) DOM.dashboardView.style.display = 'block';
            break;
        case 'leads':
            if (DOM.leadsView) DOM.leadsView.style.display = 'block';
            updateLeadsTable();
            break;
        case 'followups':
            if (DOM.followupsView) DOM.followupsView.style.display = 'block';
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
    const DOM = getDOM();
    if (DOM.loadingOverlay) {
        if (show) {
            DOM.loadingOverlay.classList.remove('hidden');
        } else {
            DOM.loadingOverlay.classList.add('hidden');
        }
    }
}

function showError(message) {
    const DOM = getDOM();
    if (DOM.errorBanner && DOM.errorMessage) {
        DOM.errorMessage.textContent = message;
        DOM.errorBanner.style.display = 'flex';
    }
    console.error('⚠️ Error:', message);
}

function hideError() {
    const DOM = getDOM();
    if (DOM.errorBanner) {
        DOM.errorBanner.style.display = 'none';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function initEventListeners() {
    const DOM = getDOM();
    
    // Quick Add buttons
    const openForm = () => {
        if (typeof CONFIG !== 'undefined' && CONFIG.quickAddFormUrl && !CONFIG.quickAddFormUrl.includes('YOUR_')) {
            window.open(CONFIG.quickAddFormUrl, '_blank');
        } else {
            alert('📝 Lead Intake Form URL not configured.\n\nPlease update config.js with your Google Form URL.');
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
    if (DOM.retryBtn) {
        DOM.retryBtn.addEventListener('click', fetchAllData);
    }
    
    console.log('✅ Event listeners initialized');
}

// ============================================
// AUTO-REFRESH
// ============================================
function startAutoRefresh() {
    const DOM = getDOM();
    
    if (AppState.refreshInterval) {
        clearInterval(AppState.refreshInterval);
    }
    
    const interval = (typeof CONFIG !== 'undefined' && CONFIG.refreshInterval) || 300000;
    
    AppState.refreshInterval = setInterval(() => {
        console.log('⏰ Auto-refresh triggered');
        fetchAllData();
    }, interval);
    
    if (DOM.refreshStatus) DOM.refreshStatus.textContent = 'Active';
    console.log(`⏰ Auto-refresh started: every ${interval/1000}s`);
}

// ============================================
// INITIALIZATION
// ============================================
async function init() {
    console.log('🚀 Initializing Paramount Dashboard v2.1...');
    
    // Check for CONFIG
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG not loaded - check if config.js is included');
        showLoading(false);
        showError('Configuration file (config.js) not loaded. Please check the file exists and is properly linked in index.html');
        showEmptyState();
        return;
    }
    
    console.log('✅ CONFIG loaded');
    
    // Initialize event listeners
    initEventListeners();
    
    // Fetch data
    await fetchAllData();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Handle tab visibility
    document.addEventListener('visibilitychange', () => {
        const DOM = getDOM();
        if (document.hidden) {
            if (AppState.refreshInterval) {
                clearInterval(AppState.refreshInterval);
            }
            if (DOM.refreshStatus) DOM.refreshStatus.textContent = 'Paused';
        } else {
            startAutoRefresh();
            fetchAllData();
        }
    });
    
    console.log('✅ Dashboard initialized successfully!');
}

// Make functions globally accessible
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.switchView = switchView;
