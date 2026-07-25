#!/usr/bin/env python3
"""
============================================================================
PARAMOUNT MERCHANT NAVY - LEAD ARCHIVING SCRIPT v2.0
============================================================================
Purpose: Archives leads with final statuses (Enrolled, Completed, Lost)
         Moves to Archived_YYYY_MM sheet, never deletes permanently

Status Workflow:
- New Lead → Contacted → Interested → Counselling Scheduled → 
- Admission Pending → Enrolled / Completed / Lost (ARCHIVE THESE)

Author: Paramount Merchant Navy CRM System
============================================================================
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Tuple

import gspread
from oauth2client.service_account import ServiceAccountCredentials

# ============================================
# CONFIGURATION
# ============================================

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

LEAD_REGISTER_SHEET = 'Lead_Register'

# Statuses that should be archived
ARCHIVE_STATUSES = ['Enrolled', 'Completed', 'Lost']

# Lead Register column headers (in order)
LEAD_REGISTER_HEADERS = [
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
]

TIMEZONE = 'Asia/Kolkata'

# ============================================
# LOGGING
# ============================================

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('archive_leads.log', mode='a')
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging()

# ============================================
# AUTHENTICATION
# ============================================

def authenticate():
    logger.info("🔐 Authenticating...")
    
    service_account_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    if not service_account_json:
        raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON not set")
    
    credentials_dict = json.loads(service_account_json)
    credentials = ServiceAccountCredentials.from_json_keyfile_dict(
        credentials_dict, scopes=SCOPES
    )
    
    client = gspread.authorize(credentials)
    logger.info("✅ Authenticated")
    return client

# ============================================
# ARCHIVE OPERATIONS
# ============================================

def get_or_create_archive_sheet(spreadsheet: gspread.Spreadsheet) -> gspread.Worksheet:
    """Get or create monthly archive sheet."""
    archive_name = f"Archived_{datetime.now().strftime('%Y_%m')}"
    
    try:
        worksheet = spreadsheet.worksheet(archive_name)
        logger.info(f"📋 Found existing archive: {archive_name}")
    except gspread.WorksheetNotFound:
        logger.info(f"📝 Creating archive sheet: {archive_name}")
        
        # Create with extra columns for archive metadata
        headers = LEAD_REGISTER_HEADERS + ['Archived_Date', 'Archive_Reason']
        worksheet = spreadsheet.add_worksheet(archive_name, rows=1000, cols=len(headers))
        worksheet.append_row(headers)
        
        # Format header
        worksheet.format('1:1', {
            'backgroundColor': {'red': 0.1, 'green': 0.14, 'blue': 0.49},
            'textFormat': {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}, 'bold': True}
        })
    
    return worksheet

def identify_leads_to_archive(records: List[Dict]) -> Tuple[List[int], List[Dict]]:
    """Identify leads with archive statuses."""
    rows_to_archive = []
    records_to_archive = []
    
    for idx, record in enumerate(records):
        status = str(record.get('Status', '')).strip()
        
        if status in ARCHIVE_STATUSES:
            rows_to_archive.append(idx + 2)  # +2 for header and 0-indexing
            records_to_archive.append(record)
    
    logger.info(f"🔍 Found {len(rows_to_archive)} leads to archive")
    
    # Log breakdown by status
    status_counts = {}
    for record in records_to_archive:
        status = record.get('Status', 'Unknown')
        status_counts[status] = status_counts.get(status, 0) + 1
    
    for status, count in status_counts.items():
        logger.info(f"   - {status}: {count}")
    
    return rows_to_archive, records_to_archive

def archive_leads(spreadsheet: gspread.Spreadsheet, 
                  main_worksheet: gspread.Worksheet,
                  rows_to_archive: List[int],
                  records_to_archive: List[Dict],
                  dry_run: bool = False) -> Dict[str, Any]:
    """Archive leads by copying to archive sheet and removing from main."""
    
    stats = {
        'total_identified': len(rows_to_archive),
        'successfully_archived': 0,
        'failed': 0,
        'archive_sheet': None,
        'by_status': {},
        'timestamp': datetime.now().isoformat()
    }
    
    if not rows_to_archive:
        logger.info("✅ No leads to archive")
        return stats
    
    if dry_run:
        logger.info("🧪 DRY RUN - No changes will be made")
        for record in records_to_archive[:10]:
            name = record.get('Candidate Full Name', record.get('Name', 'Unknown'))
            status = record.get('Status', 'Unknown')
            lead_id = record.get('Lead_ID', 'N/A')
            logger.info(f"   Would archive: {lead_id} | {name} | {status}")
        if len(records_to_archive) > 10:
            logger.info(f"   ... and {len(records_to_archive) - 10} more")
        return stats
    
    try:
        # Get archive sheet
        archive_worksheet = get_or_create_archive_sheet(spreadsheet)
        stats['archive_sheet'] = archive_worksheet.title
        
        # Prepare rows for archive
        archive_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        rows_to_add = []
        
        for record in records_to_archive:
            row = []
            for header in LEAD_REGISTER_HEADERS:
                # Try different possible column names
                value = record.get(header, '')
                if not value:
                    # Try alternate names
                    alt_names = {
                        'Lead_ID': ['Lead ID', 'LeadID'],
                        'Candidate Full Name': ['Name', 'Student_Name'],
                        'Phone Number': ['Phone', 'Mobile'],
                        'Email Address': ['Email'],
                        'City / Location': ['City'],
                        'Course Interested In': ['Course'],
                        'Counsellor Assigned': ['Counselor', 'Counsellor']
                    }
                    for alt in alt_names.get(header, []):
                        value = record.get(alt, '')
                        if value:
                            break
                row.append(str(value))
            
            status = record.get('Status', 'Unknown')
            row.append(archive_date)
            row.append(f"Auto-archived: {status}")
            
            rows_to_add.append(row)
            
            # Track by status
            stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
        
        # Batch append to archive
        logger.info(f"📤 Copying {len(rows_to_add)} rows to archive...")
        archive_worksheet.append_rows(rows_to_add, value_input_option='USER_ENTERED')
        stats['successfully_archived'] = len(rows_to_add)
        
        # Delete from main sheet (reverse order)
        logger.info(f"🗑️ Removing archived rows from main sheet...")
        for row_idx in sorted(rows_to_archive, reverse=True):
            try:
                main_worksheet.delete_rows(row_idx)
            except Exception as e:
                logger.warning(f"⚠️ Could not delete row {row_idx}: {e}")
                stats['failed'] += 1
        
        logger.info(f"✅ Archived {stats['successfully_archived']} leads")
        
    except Exception as e:
        logger.error(f"❌ Archive error: {e}")
        stats['failed'] = len(rows_to_archive)
        raise
    
    return stats

def create_archive_report(stats: Dict, records: List[Dict]) -> str:
    """Create archive report file."""
    filename = f"archive_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    with open(filename, 'w') as f:
        f.write("=" * 60 + "\n")
        f.write("PARAMOUNT MERCHANT NAVY - ARCHIVE REPORT\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Date: {stats['timestamp']}\n")
        f.write(f"Archive Sheet: {stats['archive_sheet']}\n\n")
        f.write(f"Total Identified: {stats['total_identified']}\n")
        f.write(f"Successfully Archived: {stats['successfully_archived']}\n")
        f.write(f"Failed: {stats['failed']}\n\n")
        
        f.write("By Status:\n")
        for status, count in stats.get('by_status', {}).items():
            f.write(f"  - {status}: {count}\n")
        
        f.write("\n" + "-" * 60 + "\n")
        f.write("ARCHIVED LEADS:\n")
        f.write("-" * 60 + "\n\n")
        
        for i, record in enumerate(records, 1):
            lead_id = record.get('Lead_ID', record.get('Lead ID', 'N/A'))
            name = record.get('Candidate Full Name', record.get('Name', 'Unknown'))
            status = record.get('Status', 'Unknown')
            phone = record.get('Phone Number', record.get('Phone', 'N/A'))
            
            f.write(f"{i}. {lead_id}\n")
            f.write(f"   Name: {name}\n")
            f.write(f"   Status: {status}\n")
            f.write(f"   Phone: {phone}\n\n")
        
        f.write("=" * 60 + "\n")
        f.write("END OF REPORT\n")
    
    logger.info(f"📄 Report saved: {filename}")
    return filename

# ============================================
# MAIN
# ============================================

def main():
    logger.info("=" * 60)
    logger.info("🗄️ PARAMOUNT MERCHANT NAVY - LEAD ARCHIVING v2.0")
    logger.info("=" * 60)
    logger.info(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"📋 Archive Statuses: {', '.join(ARCHIVE_STATUSES)}")
    
    dry_run = os.environ.get('DRY_RUN', 'false').lower() == 'true'
    if dry_run:
        logger.info("🧪 DRY RUN MODE - No changes will be made")
    
    try:
        # Authenticate
        client = authenticate()
        
        # Find Lead_Register
        try:
            spreadsheet = client.open(LEAD_REGISTER_SHEET)
        except gspread.SpreadsheetNotFound:
            # Try to find any spreadsheet with "Lead" in name
            all_sheets = client.openall()
            spreadsheet = None
            for ss in all_sheets:
                if 'lead' in ss.title.lower():
                    spreadsheet = ss
                    logger.info(f"📄 Found: {ss.title}")
                    break
            
            if not spreadsheet:
                raise ValueError("Lead_Register spreadsheet not found")
        
        # Get main worksheet
        main_worksheet = spreadsheet.sheet1
        
        # Get all records
        records = main_worksheet.get_all_records()
        logger.info(f"📊 Total records: {len(records)}")
        
        # Identify leads to archive
        rows_to_archive, records_to_archive = identify_leads_to_archive(records)
        
        if not rows_to_archive:
            logger.info("✅ No leads match archive criteria")
            return
        
        # Archive
        stats = archive_leads(
            spreadsheet,
            main_worksheet,
            rows_to_archive,
            records_to_archive,
            dry_run=dry_run
        )
        
        # Create report
        if not dry_run and stats['successfully_archived'] > 0:
            create_archive_report(stats, records_to_archive)
        
        # Summary
        logger.info("=" * 60)
        logger.info("📊 ARCHIVE SUMMARY")
        logger.info("=" * 60)
        logger.info(f"   Total Identified: {stats['total_identified']}")
        logger.info(f"   Successfully Archived: {stats['successfully_archived']}")
        logger.info(f"   Failed: {stats['failed']}")
        
        for status, count in stats.get('by_status', {}).items():
            logger.info(f"   - {status}: {count}")
        
        if stats['archive_sheet']:
            logger.info(f"   Archive Sheet: {stats['archive_sheet']}")
        logger.info("=" * 60)
        
        if dry_run:
            logger.info("🧪 DRY RUN COMPLETE - No changes made")
        else:
            logger.info("✅ Archive completed!")
        
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        logger.error("⚠️ No data was permanently lost")
        sys.exit(1)

if __name__ == '__main__':
    main()
