#!/usr/bin/env python3
"""
============================================================================
PARAMOUNT MERCHANT NAVY - MORNING BRIEFING SENDER v2.0
============================================================================
Purpose: Fetches leads by status and sends morning briefing via Slack/Email

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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, List, Any

import requests
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# ============================================
# CONFIGURATION
# ============================================

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
]

LEAD_REGISTER_SHEET = 'Lead_Register'
EMAIL_RECIPIENT = 'sales@paramountmerchantnavy.com'

# Priority statuses (need immediate attention)
PRIORITY_STATUSES = ['New Lead', 'Contacted', 'Interested', 'Counselling Scheduled', 'Admission Pending']

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
            logging.FileHandler('morning_briefing.log', mode='a')
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
# DATA FETCHING
# ============================================

def get_leads_by_status(client: gspread.Client) -> Dict[str, List[Dict]]:
    """Fetch leads grouped by status."""
    logger.info("📋 Fetching leads...")
    
    leads_by_status = {status: [] for status in PRIORITY_STATUSES}
    leads_by_status['Other'] = []
    
    try:
        spreadsheet = client.open(LEAD_REGISTER_SHEET)
        worksheet = spreadsheet.sheet1
        records = worksheet.get_all_records()
        
        for record in records:
            status = str(record.get('Status', 'New Lead')).strip()
            
            lead_info = {
                'lead_id': record.get('Lead_ID', record.get('Lead ID', 'N/A')),
                'name': record.get('Candidate Full Name', record.get('Name', 'Unknown')),
                'phone': record.get('Phone Number', record.get('Phone', 'N/A')),
                'course': record.get('Course Interested In', record.get('Course', 'N/A')),
                'counsellor': record.get('Counsellor Assigned', record.get('Counselor', 'Unassigned')),
                'city': record.get('City / Location', record.get('City', 'N/A')),
                'status': status
            }
            
            if status in leads_by_status:
                leads_by_status[status].append(lead_info)
            elif status not in ['Enrolled', 'Completed', 'Lost']:
                leads_by_status['Other'].append(lead_info)
        
        for status, leads in leads_by_status.items():
            if leads:
                logger.info(f"   {status}: {len(leads)}")
        
        return leads_by_status
        
    except Exception as e:
        logger.error(f"❌ Error fetching leads: {e}")
        return leads_by_status

# ============================================
# MESSAGE FORMATTING
# ============================================

def format_slack_message(leads_by_status: Dict) -> Dict:
    """Format Slack message with lead status breakdown."""
    today_str = datetime.now().strftime('%A, %B %d, %Y')
    
    # Count totals
    total_active = sum(len(leads) for status, leads in leads_by_status.items() 
                       if status != 'Other')
    
    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": "🌅 Paramount Merchant Navy - Morning Briefing", "emoji": True}
        },
        {
            "type": "context",
            "elements": [{"type": "mrkdwn", "text": f"📅 *{today_str}*"}]
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*📊 Active Leads: {total_active}*"}
        }
    ]
    
    # Status breakdown
    status_icons = {
        'New Lead': '🆕',
        'Contacted': '📞',
        'Interested': '🔥',
        'Counselling Scheduled': '📅',
        'Admission Pending': '⏳'
    }
    
    for status in PRIORITY_STATUSES:
        leads = leads_by_status.get(status, [])
        if leads:
            icon = status_icons.get(status, '📋')
            blocks.append({
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"{icon} *{status}*: {len(leads)} leads"}
            })
            
            # Show top 5 leads for each status
            for lead in leads[:5]:
                blocks.append({
                    "type": "context",
                    "elements": [{
                        "type": "mrkdwn",
                        "text": f"• {lead['lead_id']} | {lead['name']} | 📞 {lead['phone']} | 👤 {lead['counsellor']}"
                    }]
                })
    
    blocks.append({"type": "divider"})
    blocks.append({
        "type": "context",
        "elements": [{"type": "mrkdwn", "text": "🏢 Paramount Merchant Navy CRM | Auto-generated"}]
    })
    
    return {"blocks": blocks}

def format_email_html(leads_by_status: Dict) -> str:
    """Format HTML email with lead status breakdown."""
    today_str = datetime.now().strftime('%A, %B %d, %Y')
    
    total_active = sum(len(leads) for status, leads in leads_by_status.items() 
                       if status != 'Other')
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }}
            .container {{ max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #1a237e, #3949ab); color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 26px; }}
            .header p {{ margin: 10px 0 0; opacity: 0.9; }}
            .content {{ padding: 30px; }}
            .stat-box {{ background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; }}
            .stat-number {{ font-size: 48px; font-weight: bold; color: #1a237e; }}
            .stat-label {{ color: #666; }}
            .status-section {{ margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #1a237e; }}
            .status-title {{ font-weight: bold; color: #1a237e; margin-bottom: 10px; font-size: 16px; }}
            .lead-item {{ padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }}
            .lead-item:last-child {{ border-bottom: none; }}
            .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            .new-lead {{ border-left-color: #17a2b8; }}
            .contacted {{ border-left-color: #9c27b0; }}
            .interested {{ border-left-color: #fd7e14; }}
            .scheduled {{ border-left-color: #2196f3; }}
            .pending {{ border-left-color: #ff9800; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌅 Morning Briefing</h1>
                <p>Paramount Merchant Navy | {today_str}</p>
            </div>
            
            <div class="content">
                <div class="stat-box">
                    <div class="stat-number">{total_active}</div>
                    <div class="stat-label">Active Leads Requiring Follow-up</div>
                </div>
    """
    
    status_classes = {
        'New Lead': 'new-lead',
        'Contacted': 'contacted',
        'Interested': 'interested',
        'Counselling Scheduled': 'scheduled',
        'Admission Pending': 'pending'
    }
    
    status_icons = {
        'New Lead': '🆕',
        'Contacted': '📞',
        'Interested': '🔥',
        'Counselling Scheduled': '📅',
        'Admission Pending': '⏳'
    }
    
    for status in PRIORITY_STATUSES:
        leads = leads_by_status.get(status, [])
        if leads:
            css_class = status_classes.get(status, '')
            icon = status_icons.get(status, '📋')
            
            html += f"""
                <div class="status-section {css_class}">
                    <div class="status-title">{icon} {status} ({len(leads)})</div>
            """
            
            for lead in leads[:10]:
                html += f"""
                    <div class="lead-item">
                        <strong>{lead['lead_id']}</strong> | {lead['name']} | 
                        📞 {lead['phone']} | 👤 {lead['counsellor']}
                    </div>
                """
            
            if len(leads) > 10:
                html += f"<div class='lead-item'><em>...and {len(leads) - 10} more</em></div>"
            
            html += "</div>"
    
    html += """
            </div>
            <div class="footer">
                <p>🏢 Paramount Merchant Navy | Sales Operations CRM</p>
                <p>This is an automated message.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html

# ============================================
# SENDING
# ============================================

def send_slack(webhook_url: str, message: Dict) -> bool:
    logger.info("📤 Sending to Slack...")
    try:
        response = requests.post(webhook_url, json=message, timeout=30)
        if response.status_code == 200:
            logger.info("✅ Slack sent")
            return True
        logger.error(f"❌ Slack error: {response.status_code}")
        return False
    except Exception as e:
        logger.error(f"❌ Slack failed: {e}")
        return False

def send_email(user: str, password: str, recipient: str, subject: str, html: str) -> bool:
    logger.info(f"📧 Sending email to {recipient}...")
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = user
        msg['To'] = recipient
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(user, password)
            server.send_message(msg)
        
        logger.info("✅ Email sent")
        return True
    except Exception as e:
        logger.error(f"❌ Email failed: {e}")
        return False

# ============================================
# MAIN
# ============================================

def main():
    logger.info("=" * 60)
    logger.info("🌅 PARAMOUNT MERCHANT NAVY - MORNING BRIEFING v2.0")
    logger.info("=" * 60)
    
    test_mode = os.environ.get('TEST_MODE', 'false').lower() == 'true'
    if test_mode:
        logger.info("🧪 TEST MODE - no notifications will be sent")
    
    try:
        # Authenticate
        client = authenticate()
        
        # Get leads by status
        leads_by_status = get_leads_by_status(client)
        
        # Format messages
        slack_msg = format_slack_message(leads_by_status)
        email_html = format_email_html(leads_by_status)
        
        if test_mode:
            logger.info("🧪 Test mode: skipping send")
            return
        
        # Send Slack
        slack_url = os.environ.get('SLACK_WEBHOOK_URL')
        slack_sent = False
        if slack_url:
            slack_sent = send_slack(slack_url, slack_msg)
        
        # Send Email
        gmail_user = os.environ.get('GMAIL_USER')
        gmail_pass = os.environ.get('GMAIL_APP_PASSWORD')
        
        if gmail_user and gmail_pass:
            today_str = datetime.now().strftime('%Y-%m-%d')
            subject = f"📬 Morning Briefing - {today_str}"
            send_email(gmail_user, gmail_pass, EMAIL_RECIPIENT, subject, email_html)
        
        # Summary
        total_active = sum(len(leads) for status, leads in leads_by_status.items() 
                          if status != 'Other')
        
        logger.info("=" * 60)
        logger.info("📊 BRIEFING SUMMARY")
        logger.info("=" * 60)
        logger.info(f"   Active Leads: {total_active}")
        for status in PRIORITY_STATUSES:
            count = len(leads_by_status.get(status, []))
            logger.info(f"   - {status}: {count}")
        logger.info(f"   Slack: {'✅' if slack_sent else '❌'}")
        logger.info("=" * 60)
        logger.info("✅ Morning briefing completed!")
        
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
