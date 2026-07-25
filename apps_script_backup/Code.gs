/**
 * ============================================================================
 * PARAMOUNT MERCHANT NAVY - LEAD ID GENERATOR & FOLLOWUP SYNC
 * ============================================================================
 * Purpose: 
 *   1. Auto-generates unique Lead IDs when new form submissions are received
 *   2. Sets initial status to "New Lead"
 *   3. Copies new lead to Followup_Tracker sheet for follow-up management
 * 
 * Format: PMN-YYYY-XXXX (e.g., PMN-2026-0001, PMN-2026-0002)
 * Author: Paramount Merchant Navy CRM System
 * Version: 2.0.0
 * ============================================================================
 * 
 * LEAD_REGISTER HEADERS (Form Responses 1):
 * -----------------------------------------
 * A: Lead_ID (auto-generated)
 * B: Candidate Full Name
 * C: Email Address
 * D: Phone Number
 * E: City / Location
 * F: Course Interested In
 * G: How did you hear about us?
 * H: Preferred Batch Month
 * I: Current Education Level
 * J: Counsellor Assigned
 * K: Additional Remarks
 * L: Status (auto-set to "New Lead")
 * 
 * STATUS WORKFLOW:
 * ----------------
 * New Lead → Contacted → Interested → Counselling Scheduled → 
 * Admission Pending → Enrolled / Completed / Lost
 * 
 * INSTALLATION INSTRUCTIONS:
 * --------------------------
 * 1. Open your Lead_Register Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code in the editor
 * 4. Copy and paste this entire file content
 * 5. Click the disk icon (Save) or press Ctrl+S
 * 6. Name the project "Lead ID Generator"
 * 7. Click "Run" > "Run function" > "onFormSubmit" to authorize
 * 8. Click "Review Permissions" and allow access
 * 9. Go to "Triggers" (clock icon on left sidebar)
 * 10. Click "Add Trigger" button
 * 11. Configure:
 *     - Choose which function to run: onFormSubmit
 *     - Choose which deployment should run: Head
 *     - Select event source: From spreadsheet
 *     - Select event type: On form submit
 * 12. Click "Save"
 * 
 * ============================================================================
 */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Prefix for Lead IDs (Paramount Merchant Navy)
  PREFIX: 'PMN',
  
  // Column indices (1-based)
  COLUMNS: {
    LEAD_ID: 1,           // Column A
    CANDIDATE_NAME: 2,    // Column B
    EMAIL: 3,             // Column C
    PHONE: 4,             // Column D
    CITY: 5,              // Column E
    COURSE: 6,            // Column F
    SOURCE: 7,            // Column G
    BATCH_MONTH: 8,       // Column H
    EDUCATION: 9,         // Column I
    COUNSELLOR: 10,       // Column J
    REMARKS: 11,          // Column K
    STATUS: 12            // Column L
  },
  
  // Default status for new leads
  DEFAULT_STATUS: 'New Lead',
  
  // Valid statuses
  VALID_STATUSES: [
    'New Lead',
    'Contacted',
    'Interested',
    'Counselling Scheduled',
    'Admission Pending',
    'Enrolled',
    'Completed',
    'Lost'
  ],
  
  // Followup Tracker sheet name
  FOLLOWUP_SHEET_NAME: 'Followup_Tracker',
  
  // Timezone for date calculations
  TIMEZONE: 'Asia/Kolkata',
  
  // Number of digits for the sequential number (e.g., 4 = 0001)
  NUMBER_DIGITS: 4
};

// ============================================
// MAIN TRIGGER FUNCTION
// ============================================

/**
 * Trigger function that runs when a form is submitted
 * This is the main entry point called by Google Sheets trigger
 * 
 * @param {Object} e - The event object from form submission
 */
function onFormSubmit(e) {
  try {
    Logger.log('📥 Form submission received');
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    
    // Get the range that was edited (the new row)
    const range = e.range;
    const row = range.getRow();
    
    Logger.log('📍 New row: ' + row);
    
    // Skip if it's the header row
    if (row === 1) {
      Logger.log('⏭️ Skipping header row');
      return;
    }
    
    // Check if Lead ID already exists for this row
    const existingLeadId = sheet.getRange(row, CONFIG.COLUMNS.LEAD_ID).getValue();
    
    if (existingLeadId && existingLeadId.toString().trim() !== '') {
      Logger.log('⏭️ Lead ID already exists: ' + existingLeadId);
      return;
    }
    
    // Step 1: Generate new Lead ID
    const newLeadId = generateLeadId(sheet);
    sheet.getRange(row, CONFIG.COLUMNS.LEAD_ID).setValue(newLeadId);
    Logger.log('✅ Lead ID generated: ' + newLeadId);
    
    // Step 2: Set default status to "New Lead"
    const currentStatus = sheet.getRange(row, CONFIG.COLUMNS.STATUS).getValue();
    if (!currentStatus || currentStatus.toString().trim() === '') {
      sheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue(CONFIG.DEFAULT_STATUS);
      Logger.log('✅ Status set to: ' + CONFIG.DEFAULT_STATUS);
    }
    
    // Step 3: Copy to Followup Tracker
    copyToFollowupTracker(ss, sheet, row, newLeadId);
    
    Logger.log('✅ Form submission processed successfully!');
    
  } catch (error) {
    Logger.log('❌ Error in onFormSubmit: ' + error.toString());
    // Don't throw error to prevent form submission failure
  }
}

// ============================================
// LEAD ID GENERATION
// ============================================

/**
 * Generate a unique Lead ID in format: PMN-YYYY-XXXX
 * 
 * @param {Sheet} sheet - The active sheet
 * @returns {string} The generated Lead ID
 */
function generateLeadId(sheet) {
  // Get current year in IST timezone
  const now = new Date();
  const year = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy');
  
  // Get the last Lead ID with this year's prefix
  const lastNumber = getLastLeadNumber(sheet, year);
  
  // Increment the number
  const newNumber = lastNumber + 1;
  
  // Format the number with leading zeros
  const formattedNumber = padNumber(newNumber, CONFIG.NUMBER_DIGITS);
  
  // Construct the Lead ID
  const leadId = `${CONFIG.PREFIX}-${year}-${formattedNumber}`;
  
  return leadId;
}

/**
 * Get the last sequential number used for a given year
 * 
 * @param {Sheet} sheet - The active sheet
 * @param {string} year - The year to search for
 * @returns {number} The last used number, or 0 if none found
 */
function getLastLeadNumber(sheet, year) {
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return 0;
  }
  
  const leadIdRange = sheet.getRange(2, CONFIG.COLUMNS.LEAD_ID, lastRow - 1, 1);
  const leadIds = leadIdRange.getValues();
  
  let maxNumber = 0;
  const yearPrefix = `${CONFIG.PREFIX}-${year}-`;
  
  for (let i = 0; i < leadIds.length; i++) {
    const leadId = leadIds[i][0].toString().trim();
    
    if (leadId.startsWith(yearPrefix)) {
      const numberPart = leadId.substring(yearPrefix.length);
      const number = parseInt(numberPart, 10);
      
      if (!isNaN(number) && number > maxNumber) {
        maxNumber = number;
      }
    }
  }
  
  Logger.log('📊 Last number for ' + year + ': ' + maxNumber);
  return maxNumber;
}

/**
 * Pad a number with leading zeros
 */
function padNumber(num, digits) {
  let str = num.toString();
  while (str.length < digits) {
    str = '0' + str;
  }
  return str;
}

// ============================================
// FOLLOWUP TRACKER SYNC
// ============================================

/**
 * Copy new lead to Followup Tracker sheet
 * 
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {Sheet} sourceSheet - The Lead Register sheet
 * @param {number} row - The row number of the new lead
 * @param {string} leadId - The generated Lead ID
 */
function copyToFollowupTracker(ss, sourceSheet, row, leadId) {
  try {
    // Get or create Followup_Tracker sheet
    let followupSheet = ss.getSheetByName(CONFIG.FOLLOWUP_SHEET_NAME);
    
    if (!followupSheet) {
      // Create the Followup_Tracker sheet if it doesn't exist
      followupSheet = ss.insertSheet(CONFIG.FOLLOWUP_SHEET_NAME);
      
      // Add headers
      const headers = [
        'Lead_ID',
        'Candidate Full Name',
        'Phone Number',
        'Email Address',
        'Course Interested In',
        'Counsellor Assigned',
        'Status',
        'Last Contact Date',
        'Next Followup Date',
        'Priority',
        'Followup Notes',
        'Created Date'
      ];
      followupSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      followupSheet.getRange(1, 1, 1, headers.length)
        .setBackground('#1a237e')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      
      Logger.log('📋 Created Followup_Tracker sheet');
    }
    
    // Get data from source row
    const candidateName = sourceSheet.getRange(row, CONFIG.COLUMNS.CANDIDATE_NAME).getValue();
    const phone = sourceSheet.getRange(row, CONFIG.COLUMNS.PHONE).getValue();
    const email = sourceSheet.getRange(row, CONFIG.COLUMNS.EMAIL).getValue();
    const course = sourceSheet.getRange(row, CONFIG.COLUMNS.COURSE).getValue();
    const counsellor = sourceSheet.getRange(row, CONFIG.COLUMNS.COUNSELLOR).getValue();
    const status = CONFIG.DEFAULT_STATUS;
    
    // Calculate next followup date (tomorrow)
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextFollowup = Utilities.formatDate(tomorrow, CONFIG.TIMEZONE, 'yyyy-MM-dd');
    const createdDate = Utilities.formatDate(today, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    
    // Prepare row data for Followup Tracker
    const followupData = [
      leadId,                    // Lead_ID
      candidateName,             // Candidate Full Name
      phone,                     // Phone Number
      email,                     // Email Address
      course,                    // Course Interested In
      counsellor,                // Counsellor Assigned
      status,                    // Status
      '',                        // Last Contact Date (empty initially)
      nextFollowup,              // Next Followup Date
      'P2',                      // Priority (default P2 - new leads)
      'New lead - Initial contact required',  // Followup Notes
      createdDate                // Created Date
    ];
    
    // Append to Followup Tracker
    followupSheet.appendRow(followupData);
    
    Logger.log('✅ Lead copied to Followup_Tracker: ' + leadId);
    
  } catch (error) {
    Logger.log('⚠️ Error copying to Followup Tracker: ' + error.toString());
    // Don't throw - this shouldn't block the main process
  }
}

// ============================================
// STATUS UPDATE FUNCTION (for Dashboard use)
// ============================================

/**
 * Update lead status by Lead ID
 * This function can be called from the Dashboard via Apps Script Web App
 * 
 * @param {string} leadId - The Lead ID to update
 * @param {string} newStatus - The new status
 * @param {string} notes - Optional notes
 * @returns {Object} Result object
 */
function updateLeadStatus(leadId, newStatus, notes) {
  try {
    // Validate status
    if (!CONFIG.VALID_STATUSES.includes(newStatus)) {
      return {
        success: false,
        error: 'Invalid status: ' + newStatus
      };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    
    // Find the row with this Lead ID
    const lastRow = sheet.getLastRow();
    const leadIdRange = sheet.getRange(2, CONFIG.COLUMNS.LEAD_ID, lastRow - 1, 1);
    const leadIds = leadIdRange.getValues();
    
    let targetRow = -1;
    for (let i = 0; i < leadIds.length; i++) {
      if (leadIds[i][0].toString().trim() === leadId) {
        targetRow = i + 2; // +2 for header and 0-indexing
        break;
      }
    }
    
    if (targetRow === -1) {
      return {
        success: false,
        error: 'Lead ID not found: ' + leadId
      };
    }
    
    // Update status
    sheet.getRange(targetRow, CONFIG.COLUMNS.STATUS).setValue(newStatus);
    
    // Update remarks if notes provided
    if (notes) {
      const existingRemarks = sheet.getRange(targetRow, CONFIG.COLUMNS.REMARKS).getValue();
      const timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm');
      const newRemarks = `[${timestamp}] ${newStatus}: ${notes}\n${existingRemarks}`;
      sheet.getRange(targetRow, CONFIG.COLUMNS.REMARKS).setValue(newRemarks);
    }
    
    // Also update Followup Tracker
    updateFollowupTrackerStatus(ss, leadId, newStatus, notes);
    
    Logger.log('✅ Status updated for ' + leadId + ' to ' + newStatus);
    
    return {
      success: true,
      leadId: leadId,
      newStatus: newStatus
    };
    
  } catch (error) {
    Logger.log('❌ Error updating status: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Update status in Followup Tracker
 */
function updateFollowupTrackerStatus(ss, leadId, newStatus, notes) {
  try {
    const followupSheet = ss.getSheetByName(CONFIG.FOLLOWUP_SHEET_NAME);
    if (!followupSheet) return;
    
    const lastRow = followupSheet.getLastRow();
    if (lastRow <= 1) return;
    
    const leadIdRange = followupSheet.getRange(2, 1, lastRow - 1, 1);
    const leadIds = leadIdRange.getValues();
    
    for (let i = 0; i < leadIds.length; i++) {
      if (leadIds[i][0].toString().trim() === leadId) {
        const targetRow = i + 2;
        
        // Update status (column 7)
        followupSheet.getRange(targetRow, 7).setValue(newStatus);
        
        // Update last contact date (column 8)
        const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');
        followupSheet.getRange(targetRow, 8).setValue(today);
        
        // Update priority based on status
        let priority = 'P2';
        if (newStatus === 'Interested' || newStatus === 'Counselling Scheduled') {
          priority = 'P1';
        } else if (newStatus === 'Enrolled' || newStatus === 'Completed' || newStatus === 'Lost') {
          priority = 'P3';
        }
        followupSheet.getRange(targetRow, 10).setValue(priority);
        
        // Update notes if provided (column 11)
        if (notes) {
          const timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm');
          const existingNotes = followupSheet.getRange(targetRow, 11).getValue();
          const newNotes = `[${timestamp}] ${notes}\n${existingNotes}`;
          followupSheet.getRange(targetRow, 11).setValue(newNotes);
        }
        
        break;
      }
    }
    
    Logger.log('✅ Followup Tracker updated for ' + leadId);
    
  } catch (error) {
    Logger.log('⚠️ Error updating Followup Tracker: ' + error.toString());
  }
}

// ============================================
// WEB APP FUNCTIONS (for Dashboard API)
// ============================================

/**
 * Handle GET requests (for fetching data)
 */
function doGet(e) {
  const action = e.parameter.action;
  
  let result;
  
  switch (action) {
    case 'getLeads':
      result = getAllLeads();
      break;
    case 'getFollowups':
      result = getAllFollowups();
      break;
    case 'getLead':
      result = getLeadById(e.parameter.leadId);
      break;
    default:
      result = { error: 'Unknown action' };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests (for updating data)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    
    switch (action) {
      case 'updateStatus':
        result = updateLeadStatus(data.leadId, data.status, data.notes);
        break;
      default:
        result = { error: 'Unknown action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all leads from Lead Register
 */
function getAllLeads() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { leads: [] };
  }
  
  const data = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  
  const leads = data.map(row => ({
    leadId: row[0],
    candidateName: row[1],
    email: row[2],
    phone: row[3],
    city: row[4],
    course: row[5],
    source: row[6],
    batchMonth: row[7],
    education: row[8],
    counsellor: row[9],
    remarks: row[10],
    status: row[11]
  }));
  
  return { leads: leads };
}

/**
 * Get all followups
 */
function getAllFollowups() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const followupSheet = ss.getSheetByName(CONFIG.FOLLOWUP_SHEET_NAME);
  
  if (!followupSheet) {
    return { followups: [] };
  }
  
  const lastRow = followupSheet.getLastRow();
  if (lastRow <= 1) {
    return { followups: [] };
  }
  
  const data = followupSheet.getRange(2, 1, lastRow - 1, 12).getValues();
  
  const followups = data.map(row => ({
    leadId: row[0],
    candidateName: row[1],
    phone: row[2],
    email: row[3],
    course: row[4],
    counsellor: row[5],
    status: row[6],
    lastContactDate: row[7],
    nextFollowupDate: row[8],
    priority: row[9],
    notes: row[10],
    createdDate: row[11]
  }));
  
  return { followups: followups };
}

/**
 * Get a specific lead by ID
 */
function getLeadById(leadId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { error: 'No data found' };
  }
  
  const data = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === leadId) {
      return {
        lead: {
          leadId: data[i][0],
          candidateName: data[i][1],
          email: data[i][2],
          phone: data[i][3],
          city: data[i][4],
          course: data[i][5],
          source: data[i][6],
          batchMonth: data[i][7],
          education: data[i][8],
          counsellor: data[i][9],
          remarks: data[i][10],
          status: data[i][11]
        }
      };
    }
  }
  
  return { error: 'Lead not found' };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Initialize headers if they don't exist
 */
function initializeHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  const headers = [
    'Lead_ID',
    'Candidate Full Name',
    'Email Address',
    'Phone Number',
    'City / Location',
    'Course Interested In',
    'How did you hear about us?',
    'Preferred Batch Month',
    'Current Education Level',
    'Counsellor Assigned',
    'Additional Remarks',
    'Status'
  ];
  
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = firstRow.some(cell => cell !== '');
  
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#1a237e')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    Logger.log('✅ Headers initialized');
  }
}

/**
 * Backfill Lead IDs for existing rows
 */
function backfillLeadIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('No data rows to process');
    return;
  }
  
  let generatedCount = 0;
  let statusCount = 0;
  
  for (let row = 2; row <= lastRow; row++) {
    // Generate Lead ID if missing
    const existingId = sheet.getRange(row, CONFIG.COLUMNS.LEAD_ID).getValue();
    if (!existingId || existingId.toString().trim() === '') {
      const newId = generateLeadId(sheet);
      sheet.getRange(row, CONFIG.COLUMNS.LEAD_ID).setValue(newId);
      generatedCount++;
      
      // Also copy to Followup Tracker
      copyToFollowupTracker(ss, sheet, row, newId);
    }
    
    // Set status if missing
    const existingStatus = sheet.getRange(row, CONFIG.COLUMNS.STATUS).getValue();
    if (!existingStatus || existingStatus.toString().trim() === '') {
      sheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue(CONFIG.DEFAULT_STATUS);
      statusCount++;
    }
  }
  
  SpreadsheetApp.getUi().alert(
    'Backfill Complete!\n\n' +
    'Lead IDs generated: ' + generatedCount + '\n' +
    'Statuses set: ' + statusCount
  );
}

/**
 * Test function
 */
function testLeadIdGeneration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const testId = generateLeadId(sheet);
  SpreadsheetApp.getUi().alert('Test Lead ID: ' + testId);
}

// ============================================
// MENU
// ============================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏢 Paramount CRM')
    .addItem('🔧 Initialize Headers', 'initializeHeaders')
    .addItem('🔄 Backfill Lead IDs & Sync Followups', 'backfillLeadIds')
    .addItem('🧪 Test Lead ID Generation', 'testLeadIdGeneration')
    .addSeparator()
    .addItem('ℹ️ About', 'showAbout')
    .addToUi();
}

function showAbout() {
  SpreadsheetApp.getUi().alert(
    '🏢 Paramount Merchant Navy CRM\n\n' +
    'Lead Management System v2.0.0\n\n' +
    'Features:\n' +
    '• Auto Lead ID generation (PMN-YYYY-XXXX)\n' +
    '• Auto status setting (New Lead)\n' +
    '• Auto sync to Followup_Tracker\n' +
    '• Status workflow management\n\n' +
    'Status Flow:\n' +
    'New Lead → Contacted → Interested →\n' +
    'Counselling Scheduled → Admission Pending →\n' +
    'Enrolled / Completed / Lost'
  );
}
