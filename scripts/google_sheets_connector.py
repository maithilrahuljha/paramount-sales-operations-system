#!/usr/bin/env python3
"""
============================================================================
PARAMOUNT MERCHANT NAVY - GOOGLE SHEETS CONNECTOR v2.0
============================================================================
Purpose: Connects to Google Sheets API, calculates KPIs based on new workflow
         
Lead Register Headers:
- Lead_ID | Candidate Full Name | Email Address | Phone Number | 
- City / Location | Course Interested In | How did you hear about us? | 
- Preferred Batch Month | Current Education Level | Counsellor Assigned | 
- Additional Remarks | Status

Status Workflow:
- New Lead → Contacted → Interested → Counselling Scheduled → 
- Admission Pending → Enrolled / Completed / Lost

Author: Paramount Merchant Navy CRM System
============================================================================
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

import gspread
from oauth2client.service_account import ServiceAccountCredentials

# ============================================
# CONFIGURATION
# ============================================

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

# Sheet names
LEAD_REGISTER_SHEET = 'Lead_Register'
FOLLOWUP_TRACKER_SHEET = 'Followup_Tracker'
DASHBOARD_DATA_SHEET = 'Dashboard_Data'

# Valid statuses in workflow order
VALID_STATUSES = [
    'New Lead',
    'Contacted', 
    'Interested',
    'Counselling Scheduled',
    'Admission Pending',
    'Enrolled',
    'Completed',
    'Lost'
]

# Statuses that indicate active leads (need follow-up)
ACTIVE_STATUSES = ['New Lead', 'Contacted', 'Interested', 'Counselling Scheduled', 'Admission Pending']

# Statuses for archiving
ARCHIVE_STATUSES = ['Enrolled', 'Completed', 'Lost']

TIMEZONE = 'Asia/Kolkata'

# ============================================
# LOGGING
# ============================================

def setup_logging() -> logging.Logger:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('kpi_aggregation.log', mode='a')
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging()

# ============================================
# AUTHENTICATION
# ============================================

def authenticate() -> gspread.Client:
    """Authenticate with Google Sheets API."""
    logger.info("🔐 Authenticating...")
    
    try:
        service_account_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
        if not service_account_json:
            raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON not set")
        
        credentials_dict = json.loads(service_account_json)
        credentials = ServiceAccountCredentials.from_json_keyfile_dict(
            credentials_dict, scopes=SCOPES
        )
        
        client = gspread.authorize(credentials)
        logger.info("✅ Authenticated successfully")
        return client
        
    except Exception as e:
        logger.error(f"❌ Authentication failed: {e}")
        raise

# ============================================
# DATA OPERATIONS
# ============================================

def get_spreadsheet(client: gspread.Client, name: str) -> Optional[gspread.Spreadsheet]:
    """Find spreadsheet by name."""
    try:
        return client.open(name)
    except gspread.SpreadsheetNotFound:
        logger.warning(f"⚠️ Spreadsheet not found: {name}")
        return None

def get_all_leads(worksheet: gspread.Worksheet) -> List[Dict[str, Any]]:
    """Fetch all leads from worksheet."""
    try:
        records = worksheet.get_all_records()
        logger.info(f"📊 Fetched {len(records)} leads")
        return records
    except Exception as e:
        logger.error(f"❌ Error fetching leads: {e}")
        return []

# ============================================
# KPI CALCULATIONS
# ============================================

def calculate_kpis(leads: List[Dict]) -> Dict[str, Any]:
    """Calculate all KPIs from lead data."""
    logger.info("📈 Calculating KPIs...")
    
    today = datetime.now()
    today_str = today.strftime('%Y-%m-%d')
    week_ago = (today - timedelta(days=7)).strftime('%Y-%m-%d')
    month_start = today.replace(day=1).strftime('%Y-%m-%d')
    
    kpis = {
        'last_updated': today.strftime('%Y-%m-%d %H:%M:%S'),
        'total_leads': len(leads),
        'todays_leads': 0,
        'week_leads': 0,
        'month_leads': 0,
        
        # Status counts
        'status_counts': {status: 0 for status in VALID_STATUSES},
        
        # Active (need follow-up)
        'active_leads': 0,
        
        # Conversion
        'enrolled_count': 0,
        'completed_count': 0,
        'lost_count': 0,
        'conversion_rate': 0.0,
        
        # Breakdowns
        'sources': {},
        'courses': {},
        'counsellors': {},
        'cities': {}
    }
    
    for lead in leads:
        # Get status (normalize)
        status = str(lead.get('Status', 'New Lead')).strip()
        if status not in VALID_STATUSES:
            status = 'New Lead'
        
        # Count by status
        kpis['status_counts'][status] = kpis['status_counts'].get(status, 0) + 1
        
        # Count active leads
        if status in ACTIVE_STATUSES:
            kpis['active_leads'] += 1
        
        # Count final statuses
        if status == 'Enrolled':
            kpis['enrolled_count'] += 1
        elif status == 'Completed':
            kpis['completed_count'] += 1
        elif status == 'Lost':
            kpis['lost_count'] += 1
        
        # Source breakdown
        source = str(lead.get('How did you hear about us?', 
                    lead.get('Source', 'Unknown'))).strip() or 'Unknown'
        kpis['sources'][source] = kpis['sources'].get(source, 0) + 1
        
        # Course breakdown
        course = str(lead.get('Course Interested In', 
                    lead.get('Course', 'Unknown'))).strip() or 'Unknown'
        kpis['courses'][course] = kpis['courses'].get(course, 0) + 1
        
        # Counsellor breakdown
        counsellor = str(lead.get('Counsellor Assigned', 
                        lead.get('Counselor', 'Unassigned'))).strip() or 'Unassigned'
        kpis['counsellors'][counsellor] = kpis['counsellors'].get(counsellor, 0) + 1
        
        # City breakdown
        city = str(lead.get('City / Location', 
                  lead.get('City', 'Unknown'))).strip() or 'Unknown'
        kpis['cities'][city] = kpis['cities'].get(city, 0) + 1
    
    # Calculate conversion rate
    total_processed = kpis['enrolled_count'] + kpis['completed_count'] + kpis['lost_count']
    if kpis['total_leads'] > 0:
        kpis['conversion_rate'] = round(
            ((kpis['enrolled_count'] + kpis['completed_count']) / kpis['total_leads']) * 100, 2
        )
    
    logger.info(f"✅ KPIs: {kpis['total_leads']} total, {kpis['active_leads']} active, "
               f"{kpis['enrolled_count']} enrolled, {kpis['conversion_rate']}% conversion")
    
    return kpis

# ============================================
# DASHBOARD DATA UPDATE
# ============================================

def update_dashboard_data(spreadsheet: gspread.Spreadsheet, kpis: Dict[str, Any]) -> bool:
    """Update Dashboard_Data sheet with calculated KPIs."""
    logger.info("📝 Updating Dashboard_Data...")
    
    try:
        # Get or create Dashboard_Data sheet
        try:
            worksheet = spreadsheet.worksheet(DASHBOARD_DATA_SHEET)
        except gspread.WorksheetNotFound:
            worksheet = spreadsheet.add_worksheet(DASHBOARD_DATA_SHEET, rows=100, cols=5)
        
        # Clear existing data
        worksheet.clear()
        
        timestamp = kpis['last_updated']
        
        # Prepare data rows
        data_rows = [
            ['Metric', 'Value', 'Category', 'Last_Updated'],
            ['Total_Leads', kpis['total_leads'], 'Overall', timestamp],
            ['Active_Leads', kpis['active_leads'], 'Overall', timestamp],
            ['Enrolled', kpis['enrolled_count'], 'Final', timestamp],
            ['Completed', kpis['completed_count'], 'Final', timestamp],
            ['Lost', kpis['lost_count'], 'Final', timestamp],
            ['Conversion_Rate', kpis['conversion_rate'], 'Overall', timestamp],
        ]
        
        # Add status counts
        for status, count in kpis['status_counts'].items():
            safe_status = status.replace(' ', '_')
            data_rows.append([f'Status_{safe_status}', count, 'Status', timestamp])
        
        # Add top sources
        for source, count in sorted(kpis['sources'].items(), key=lambda x: -x[1])[:10]:
            safe_source = source.replace(' ', '_')[:30]
            data_rows.append([f'Source_{safe_source}', count, 'Source', timestamp])
        
        # Add counsellor stats
        for counsellor, count in kpis['counsellors'].items():
            safe_counsellor = counsellor.replace(' ', '_')[:20]
            data_rows.append([f'Counsellor_{safe_counsellor}', count, 'Counsellor', timestamp])
        
        # Add course stats
        for course, count in kpis['courses'].items():
            safe_course = course.replace(' ', '_')[:30]
            data_rows.append([f'Course_{safe_course}', count, 'Course', timestamp])
        
        # Batch update
        worksheet.update('A1', data_rows)
        
        # Format header
        worksheet.format('A1:D1', {
            'backgroundColor': {'red': 0.1, 'green': 0.14, 'blue': 0.49},
            'textFormat': {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}, 'bold': True}
        })
        
        logger.info(f"✅ Dashboard_Data updated with {len(data_rows)} rows")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error updating Dashboard_Data: {e}")
        return False

# ============================================
# MAIN
# ============================================

def main():
    logger.info("=" * 60)
    logger.info("🚀 PARAMOUNT MERCHANT NAVY - KPI AGGREGATION v2.0")
    logger.info("=" * 60)
    
    try:
        # Authenticate
        client = authenticate()
        
        # Find Lead_Register
        spreadsheet = get_spreadsheet(client, LEAD_REGISTER_SHEET)
        
        if not spreadsheet:
            # Try to find any spreadsheet with "Lead" in name
            all_sheets = client.openall()
            for ss in all_sheets:
                if 'lead' in ss.title.lower():
                    spreadsheet = ss
                    logger.info(f"📄 Found: {ss.title}")
                    break
        
        if not spreadsheet:
            raise ValueError("Lead_Register spreadsheet not found")
        
        # Get leads from first worksheet (Form Responses 1)
        worksheet = spreadsheet.sheet1
        leads = get_all_leads(worksheet)
        
        # Calculate KPIs
        kpis = calculate_kpis(leads)
        
        # Update Dashboard_Data
        update_dashboard_data(spreadsheet, kpis)
        
        # Summary
        logger.info("=" * 60)
        logger.info("📊 KPI SUMMARY")
        logger.info("=" * 60)
        logger.info(f"   Total Leads: {kpis['total_leads']}")
        logger.info(f"   Active (Need Follow-up): {kpis['active_leads']}")
        logger.info(f"   Enrolled: {kpis['enrolled_count']}")
        logger.info(f"   Completed: {kpis['completed_count']}")
        logger.info(f"   Lost: {kpis['lost_count']}")
        logger.info(f"   Conversion Rate: {kpis['conversion_rate']}%")
        logger.info("=" * 60)
        logger.info("   STATUS BREAKDOWN:")
        for status, count in kpis['status_counts'].items():
            logger.info(f"   - {status}: {count}")
        logger.info("=" * 60)
        logger.info("✅ KPI aggregation completed!")
        
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
