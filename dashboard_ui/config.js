/**
 * ============================================================================
 * PARAMOUNT MERCHANT NAVY - DASHBOARD CONFIGURATION v2.0
 * ============================================================================
 * 
 * WORKFLOW:
 * ---------
 * 1. Lead Form submission → Lead_Register (Status: "New Lead")
 * 2. Apps Script generates Lead_ID (PMN-YYYY-XXXX)
 * 3. Apps Script copies to Followup_Tracker
 * 4. Dashboard allows editing status by Lead ID
 * 5. When Enrolled/Completed/Lost → Archived by monthly script
 * 
 * STATUS WORKFLOW:
 * ----------------
 * New Lead → Contacted → Interested → Counselling Scheduled → 
 * Admission Pending → Enrolled / Completed / Lost
 * 
 * SETUP INSTRUCTIONS:
 * -------------------
 * 1. Publish your Lead_Register sheet as CSV:
 *    - Open Google Sheet
 *    - File → Share → Publish to web
 *    - Select "Form Responses 1" or main sheet
 *    - Choose "Comma-separated values (.csv)"
 *    - Click Publish, copy URL
 * 
 * 2. Do the same for Followup_Tracker sheet
 * 
 * 3. Get your Lead Intake Form URL:
 *    - Open Google Form
 *    - Click Send → Link icon
 *    - Copy URL
 * 
 * 4. (Optional) Deploy Apps Script as Web App for real-time updates:
 *    - In Apps Script, click Deploy → New deployment
 *    - Select "Web app"
 *    - Execute as: Me, Who has access: Anyone
 *    - Copy the Web App URL
 * 
 * ============================================================================
 */

const CONFIG = {
    // ============================================
    // DATA SOURCE URLs
    // ============================================
    
    /**
     * Lead Register CSV URL
     * Published URL of your Lead_Register Google Sheet
     * 
     * Expected headers:
     * Lead_ID | Candidate Full Name | Email Address | Phone Number | 
     * City / Location | Course Interested In | How did you hear about us? | 
     * Preferred Batch Month | Current Education Level | Counsellor Assigned | 
     * Additional Remarks | Status
     */
    leadRegisterCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7Jqtg0yQMYBIoZ2LTV9jJLFGtnaxfjA0hGcqjVOSK-l3ZjOUv6eOUTIVeazQX_Ao_JmuzVz7-eVCX/pub?gid=1329417763&single=true&output=csv

',
    
    /**
     * Followup Tracker CSV URL
     * Published URL of your Followup_Tracker sheet (auto-created by Apps Script)
     */
    followupTrackerCsvUrl: 'YOUR_CSV_URL_HERE_FOR_FOLLOWUP_TRACKER',
    
    // ============================================
    // FORM URLs
    // ============================================
    
    /**
     * Lead Intake Form URL
     * The shareable link to your Google Form for new lead capture
     */
    quickAddFormUrl: 'https://docs.google.com/forms/d/1wrN-HyT5qxTBdgi9Y6x3GbttBzLQHtQaE5sLuYu0zC4/viewform',
    
    // ============================================
    // APPS SCRIPT WEB APP (Optional)
    // ============================================
    
    /**
     * Apps Script Web App URL
     * For real-time status updates from dashboard
     * 
     * Deploy Apps Script as Web App:
     * 1. Open Apps Script (Extensions → Apps Script)
     * 2. Click Deploy → New deployment
     * 3. Select type: Web app
     * 4. Execute as: Me
     * 5. Who has access: Anyone
     * 6. Click Deploy
     * 7. Copy the Web App URL here
     * 
     * Leave as placeholder if not using real-time updates
     */
    appsScriptWebAppUrl: 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE',
    
    // ============================================
    // REFRESH SETTINGS
    // ============================================
    
    /**
     * Auto-refresh interval in milliseconds
     * Default: 300000 (5 minutes)
     */
    refreshInterval: 300000,
    
    // ============================================
    // STATUS WORKFLOW
    // ============================================
    
    /**
     * Valid statuses in workflow order
     */
    statuses: [
        'New Lead',
        'Contacted',
        'Interested',
        'Counselling Scheduled',
        'Admission Pending',
        'Enrolled',
        'Completed',
        'Lost'
    ],
    
    /**
     * Statuses that trigger archiving
     */
    archiveStatuses: ['Enrolled', 'Completed', 'Lost'],
    
    // ============================================
    // BRANDING
    // ============================================
    
    branding: {
        title: 'Paramount Merchant Navy',
        tagline: 'Sales Operations Dashboard',
        colors: {
            primary: '#1a237e',
            secondary: '#ffd700',
            success: '#28a745',
            warning: '#fd7e14',
            danger: '#dc3545'
        },
        logoUrl: ''
    },
    
    // ============================================
    // DATE & TIME
    // ============================================
    
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    
    // ============================================
    // LEAD ID FORMAT
    // ============================================
    
    /**
     * Lead ID prefix
     * Format: {prefix}-{year}-{number}
     * Example: PMN-2026-0001
     */
    leadIdPrefix: 'PMN',
    
    // ============================================
    // COUNSELLORS (for reference)
    // ============================================
    
    /**
     * List of counsellors
     * Update this when adding/removing counsellors
     */
    counsellors: [
        'Counsellor 1',
        'Counsellor 2',
        'Counsellor 3'
        // Add more counsellors here
    ],
    
    // ============================================
    // COURSES (for reference)
    // ============================================
    
    /**
     * Available courses
     */
    courses: [
        'GP Rating',
        'Deck Cadet',
        'Engine Cadet',
        'Electro-Technical Officer (ETO)',
        'Other'
        // Add more courses here
    ],
    
    // ============================================
    // DEBUG
    // ============================================
    
    debugMode: false
};

// ============================================
// VALIDATION
// ============================================
(function validateConfig() {
    const warnings = [];
    
    if (CONFIG.leadRegisterCsvUrl.includes('YOUR_CSV_URL_HERE')) {
        warnings.push('⚠️ Lead Register CSV URL not configured');
    }
    if (CONFIG.followupTrackerCsvUrl.includes('YOUR_CSV_URL_HERE')) {
        warnings.push('⚠️ Followup Tracker CSV URL not configured');
    }
    if (CONFIG.quickAddFormUrl.includes('YOUR_FORM_URL_HERE')) {
        warnings.push('⚠️ Lead Intake Form URL not configured');
    }
    if (CONFIG.appsScriptWebAppUrl.includes('YOUR_APPS_SCRIPT')) {
        warnings.push('ℹ️ Apps Script Web App URL not configured (status updates will be local only)');
    }
    
    if (warnings.length > 0) {
        console.warn('📋 Configuration:');
        warnings.forEach(w => console.warn(w));
    } else {
        console.log('✅ Configuration loaded');
    }
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
