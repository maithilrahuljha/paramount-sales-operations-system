# ⚓ Paramount Merchant Navy - Sales Operations CRM System

[![Status](https://img.shields.io/badge/Status-Live%20%26%20Working-success)](/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Automated-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-Connected-34A853?logo=google-sheets&logoColor=white)](https://www.google.com/sheets/about/)

> ✅ **This system is fully configured and operational.** All integrations are complete and tested.

---

## 📋 Table of Contents

1. [System Overview](#-system-overview)
2. [Current Configuration](#-current-configuration)
3. [System Workflow](#-system-workflow)
4. [Component Status](#-component-status)
5. [Daily Operations Guide](#-daily-operations-guide)
6. [Updating the System](#-updating-the-system)
7. [Important IDs to Preserve](#-important-ids-to-preserve)
8. [Troubleshooting](#-troubleshooting)
9. [Maintenance Schedule](#-maintenance-schedule)
10. [Pending Setup: Looker Studio](#-pending-setup-looker-studio)

---

## 🎯 System Overview

The Paramount Merchant Navy Sales Operations CRM is a fully automated lead management system that:

| Function | Status | Description |
|----------|--------|-------------|
| 📥 **Lead Capture** | ✅ Live | Google Form captures new leads |
| 🆔 **Auto Lead ID** | ✅ Live | Apps Script generates PMN-2026-XXXX IDs |
| 🔄 **Auto Sync** | ✅ Live | New leads auto-copied to Followup_Tracker |
| 📊 **Dashboard** | ✅ Live | GitHub Pages hosts real-time dashboard |
| ✏️ **Status Edit** | ✅ Live | Edit lead status directly from dashboard |
| 📬 **Morning Briefing** | ✅ Live | Daily 8:30 AM IST Slack/Email notifications |
| 📈 **KPI Updates** | ✅ Live | Hourly KPI calculations |
| 🗄️ **Auto Archive** | ✅ Live | Monthly archiving of completed leads |
| 📊 **Looker Studio** | ⏳ Pending | Advanced analytics dashboard |

---

## ⚙️ Current Configuration

### 🔗 Live URLs

| Component | URL | Purpose |
|-----------|-----|---------|
| 📊 **Dashboard** | `https://[YOUR_USERNAME].github.io/paramount-crm-system/dashboard_ui/` | Real-time KPI dashboard |
| 📝 **Lead Intake Form** | *(Your Google Form URL)* | New lead capture |
| 📋 **Lead_Register Sheet** | *(Your Google Sheet URL)* | Primary data storage |
| 📞 **Followup_Tracker Sheet** | *(Auto-created tab in Lead_Register)* | Follow-up management |

### 🔐 Configured GitHub Secrets

| Secret | Status | Purpose |
|--------|--------|---------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ✅ Configured | Google API authentication |
| `DRIVE_FOLDER_ID` | ✅ Configured | CRM folder location |
| `SLACK_WEBHOOK_URL` | ✅ Configured | Slack notifications |
| `GMAIL_USER` | ✅ Configured | Email sender address |
| `GMAIL_APP_PASSWORD` | ✅ Configured | Gmail authentication |

### ⏰ Automated Schedules

| Workflow | Schedule | Status |
|----------|----------|--------|
| 📬 Morning Briefing | 8:30 AM IST daily | ✅ Active |
| 📊 KPI Aggregation | Every hour | ✅ Active |
| 🗄️ Monthly Archive | 1st of each month | ✅ Active |

---

## 🔄 System Workflow

### Complete Lead Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LEAD LIFECYCLE FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: LEAD CAPTURE                                                        │
│  ════════════════════                                                        │
│                                                                              │
│    👤 Prospective Student                                                    │
│           │                                                                  │
│           ▼                                                                  │
│    ┌─────────────────────┐                                                   │
│    │  📝 Lead Intake Form │  ◄── Google Form with all questions             │
│    │     (Google Form)    │                                                  │
│    └──────────┬──────────┘                                                   │
│               │                                                              │
│               ▼                                                              │
│                                                                              │
│  STEP 2: AUTO-PROCESSING (Apps Script)                                       │
│  ═════════════════════════════════════                                       │
│                                                                              │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │  📋 Lead_Register (Form Responses 1)                             │      │
│    │                                                                  │      │
│    │  Apps Script Triggers:                                           │      │
│    │  ✅ 1. Generates Lead_ID (PMN-2026-0001)                        │      │
│    │  ✅ 2. Sets Status = "New Lead"                                 │      │
│    │  ✅ 3. Copies to Followup_Tracker                               │      │
│    └──────────┬──────────────────────────────────────────────────────┘      │
│               │                                                              │
│               ├────────────────────┐                                         │
│               ▼                    ▼                                         │
│    ┌─────────────────┐    ┌─────────────────┐                               │
│    │ Followup_Tracker│    │  Dashboard_Data │                               │
│    │   (Auto-sync)   │    │  (KPI Storage)  │                               │
│    └─────────────────┘    └─────────────────┘                               │
│                                                                              │
│                                                                              │
│  STEP 3: DAILY OPERATIONS                                                    │
│  ════════════════════════                                                    │
│                                                                              │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                    📊 LIVE DASHBOARD                             │      │
│    │                                                                  │      │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │      │
│    │  │ KPI Cards   │  │ Lead Table  │  │ Follow-up   │              │      │
│    │  │             │  │             │  │ List        │              │      │
│    │  │ • Total     │  │ • Search    │  │ • Priority  │              │      │
│    │  │ • Enrolled  │  │ • Filter    │  │ • Status    │              │      │
│    │  │ • Conv Rate │  │ • Edit ✏️   │  │ • Quick View│              │      │
│    │  └─────────────┘  └─────────────┘  └─────────────┘              │      │
│    │                                                                  │      │
│    │  Counsellor clicks "Edit" → Updates status → Saves              │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│                                                                              │
│  STEP 4: STATUS PROGRESSION                                                  │
│  ══════════════════════════                                                  │
│                                                                              │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                     STATUS WORKFLOW                              │      │
│    │                                                                  │      │
│    │   🆕 New Lead                                                    │      │
│    │        │                                                         │      │
│    │        ▼                                                         │      │
│    │   📞 Contacted ──────────────────────────────┐                  │      │
│    │        │                                      │                  │      │
│    │        ▼                                      │                  │      │
│    │   🔥 Interested                               │                  │      │
│    │        │                                      │                  │      │
│    │        ▼                                      ▼                  │      │
│    │   📅 Counselling Scheduled              ❌ Lost                 │      │
│    │        │                                 (Archive)               │      │
│    │        ▼                                                         │      │
│    │   ⏳ Admission Pending                                           │      │
│    │        │                                                         │      │
│    │        ├─────────────────┐                                       │      │
│    │        ▼                 ▼                                       │      │
│    │   ✅ Enrolled      ✅ Completed                                  │      │
│    │    (Archive)        (Archive)                                    │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│                                                                              │
│  STEP 5: MONTHLY ARCHIVING                                                   │
│  ═════════════════════════                                                   │
│                                                                              │
│    GitHub Actions (1st of month at midnight):                                │
│                                                                              │
│    ┌─────────────────┐         ┌─────────────────────┐                      │
│    │  Lead_Register  │  ────▶  │  Archived_2026_01   │                      │
│    │                 │  Move   │  Archived_2026_02   │                      │
│    │ Status:         │  rows   │  Archived_2026_03   │                      │
│    │ • Enrolled      │  with   │  ...                │                      │
│    │ • Completed     │  final  │                     │                      │
│    │ • Lost          │  status │  (Never deleted,    │                      │
│    │                 │         │   only moved)       │                      │
│    └─────────────────┘         └─────────────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
                                    ┌─────────────────────┐
                                    │   MORNING BRIEFING  │
                                    │   (8:30 AM IST)     │
                                    │                     │
                                    │  📬 Slack Message   │
                                    │  📧 Email Report    │
                                    └──────────┬──────────┘
                                               │
┌──────────────┐    ┌──────────────┐    ┌──────┴───────┐    ┌──────────────┐
│              │    │              │    │              │    │              │
│  Google      │───▶│  Lead        │───▶│  GitHub      │───▶│  Dashboard   │
│  Form        │    │  Register    │    │  Actions     │    │  (GitHub     │
│              │    │  (Sheets)    │    │  (Hourly)    │    │   Pages)     │
│              │    │              │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                           │                    │
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐    ┌──────────────┐
                    │  Followup    │    │  Dashboard   │
                    │  Tracker     │    │  Data        │
                    │  (Auto-sync) │    │  (KPIs)      │
                    └──────────────┘    └──────────────┘
```

---

## ✅ Component Status

### Google Sheets Structure

```
📁 Paramount_CRM_Data (Google Drive Folder)
│
├── 📊 Lead_Register (Spreadsheet)
│   │
│   ├── 📋 Form Responses 1 (Main data - DO NOT RENAME)
│   │   │
│   │   │  COLUMNS:
│   │   │  ─────────────────────────────────────────────────
│   │   │  A: Lead_ID (Auto: PMN-2026-XXXX)
│   │   │  B: Candidate Full Name
│   │   │  C: Email Address
│   │   │  D: Phone Number
│   │   │  E: City / Location
│   │   │  F: Course Interested In
│   │   │  G: How did you hear about us?
│   │   │  H: Preferred Batch Month
│   │   │  I: Current Education Level
│   │   │  J: Counsellor Assigned
│   │   │  K: Additional Remarks
│   │   │  L: Status (Auto: "New Lead")
│   │   │
│   │
│   ├── 📞 Followup_Tracker (Auto-created by Apps Script)
│   │   │
│   │   │  COLUMNS:
│   │   │  ─────────────────────────────────────────────────
│   │   │  A: Lead_ID
│   │   │  B: Candidate Full Name
│   │   │  C: Phone Number
│   │   │  D: Email Address
│   │   │  E: Course Interested In
│   │   │  F: Counsellor Assigned
│   │   │  G: Status
│   │   │  H: Last Contact Date
│   │   │  I: Next Followup Date
│   │   │  J: Priority (P1/P2/P3)
│   │   │  K: Followup Notes
│   │   │  L: Created Date
│   │   │
│   │
│   ├── 📊 Dashboard_Data (Auto-created by GitHub Actions)
│   │   │
│   │   │  COLUMNS:
│   │   │  ─────────────────────────────────────────────────
│   │   │  A: Metric
│   │   │  B: Value
│   │   │  C: Category
│   │   │  D: Last_Updated
│   │   │
│   │
│   ├── 🗄️ Archived_2026_01 (Auto-created monthly)
│   ├── 🗄️ Archived_2026_02
│   └── 🗄️ ... (continues monthly)
│
└── 📝 Lead Intake Form (Google Form - linked to Lead_Register)
```

### GitHub Repository Structure

```
📁 paramount-crm-system (Repository)
│
├── 📁 .github/workflows/
│   ├── morning_briefing.yml     ✅ Runs daily 8:30 AM IST
│   ├── hourly_aggregation.yml   ✅ Runs every hour
│   └── monthly_archive.yml      ✅ Runs 1st of each month
│
├── 📁 scripts/
│   ├── google_sheets_connector.py   ✅ KPI calculations
│   ├── send_slack_email.py          ✅ Morning briefing
│   └── archive_leads.py             ✅ Monthly archiving
│
├── 📁 dashboard_ui/                 ✅ Hosted on GitHub Pages
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── config.js                    ⚠️ Contains your CSV URLs
│
├── 📁 apps_script_backup/
│   └── Code.gs                      ✅ Deployed in Google Sheets
│
├── 📁 looker_studio_export/
│   └── paramount_dashboard.json     📊 Schema for Looker Studio
│
├── 📁 docs/
│   └── index.html                   ✅ Redirect page
│
├── requirements.txt
├── README.md (this file)
├── README_LOOKER.md                 📊 Looker Studio setup guide
├── .gitignore
└── LICENSE
```

### Apps Script Triggers

| Trigger | Function | Event | Status |
|---------|----------|-------|--------|
| onFormSubmit | `onFormSubmit` | Form submission | ✅ Active |
| onOpen | `onOpen` | Spreadsheet open | ✅ Active |

---

## 📱 Daily Operations Guide

### For Counsellors

#### Adding a New Lead
1. Share the **Lead Intake Form** link with the prospect
2. Prospect fills the form
3. Lead automatically appears in:
   - Lead_Register (with Lead ID)
   - Followup_Tracker
   - Dashboard

#### Updating Lead Status
1. Open the **Dashboard** URL
2. Click **"All Leads"** tab
3. Find the lead (search by name/phone/Lead ID)
4. Click **"✏️ Edit"** button
5. Click the new status button
6. Add notes (optional)
7. Click **"Save Changes"**

#### Viewing Follow-ups
1. Open the **Dashboard** URL
2. **Dashboard** view shows priority follow-ups
3. **Follow-ups** tab shows all active leads
4. Filter by status using tabs

### For Managers

#### Morning Routine
1. Check **Slack** or **Email** for morning briefing (8:30 AM)
2. Review status breakdown
3. Identify overdue follow-ups
4. Assign priorities

#### Weekly Review
1. Open Dashboard → Check conversion rate
2. Review source breakdown
3. Check counsellor performance in Looker Studio

---

## 🔄 Updating the System

### ⚠️ IMPORTANT: IDs to Preserve

When updating any files, you **MUST preserve** these IDs. Copy them from your current working setup before making changes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     🔐 CRITICAL IDs - DO NOT LOSE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📁 GOOGLE DRIVE                                                             │
│  ───────────────                                                             │
│                                                                              │
│  Drive Folder ID:                                                            │
│  Location: Google Drive URL → drive.google.com/drive/folders/[THIS_ID]      │
│  Current:  ________________________________________________                  │
│                                                                              │
│                                                                              │
│  📊 GOOGLE SHEETS                                                            │
│  ────────────────                                                            │
│                                                                              │
│  Lead_Register Spreadsheet ID:                                               │
│  Location: Sheet URL → docs.google.com/spreadsheets/d/[THIS_ID]/edit        │
│  Current:  ________________________________________________                  │
│                                                                              │
│  Lead_Register Published CSV URL:                                            │
│  Location: File → Share → Publish to web → CSV URL                          │
│  Current:  ________________________________________________                  │
│             ________________________________________________                  │
│                                                                              │
│  Followup_Tracker Published CSV URL:                                         │
│  Location: File → Share → Publish to web → Select Followup_Tracker → CSV    │
│  Current:  ________________________________________________                  │
│             ________________________________________________                  │
│                                                                              │
│                                                                              │
│  📝 GOOGLE FORMS                                                             │
│  ───────────────                                                             │
│                                                                              │
│  Lead Intake Form ID:                                                        │
│  Location: Form URL → docs.google.com/forms/d/e/[THIS_ID]/viewform          │
│  Current:  ________________________________________________                  │
│                                                                              │
│  Lead Intake Form Shareable URL:                                             │
│  Location: Form → Send → Link icon → Copy                                    │
│  Current:  ________________________________________________                  │
│                                                                              │
│                                                                              │
│  🔐 SERVICE ACCOUNT                                                          │
│  ──────────────────                                                          │
│                                                                              │
│  Service Account Email:                                                      │
│  Location: Google Cloud Console → IAM → Service Accounts                    │
│  Current:  ________________________________________________                  │
│            @________________________________________________.iam.gserviceaccount.com │
│                                                                              │
│  Service Account JSON (keep file safe):                                      │
│  Location: Downloaded JSON key file                                         │
│  Status:   ☐ Backed up securely                                             │
│                                                                              │
│                                                                              │
│  💬 SLACK                                                                    │
│  ────────                                                                    │
│                                                                              │
│  Webhook URL:                                                                │
│  Location: Slack API → Your App → Incoming Webhooks                         │
│  Current:  https://hooks.slack.com/services/_______________                 │
│                                                                              │
│                                                                              │
│  📧 GMAIL                                                                    │
│  ────────                                                                    │
│                                                                              │
│  Gmail User:                                                                 │
│  Current:  ________________________________________________@gmail.com       │
│                                                                              │
│  App Password (16 characters):                                               │
│  Current:  ____ ____ ____ ____                                              │
│                                                                              │
│                                                                              │
│  🌐 GITHUB                                                                   │
│  ─────────                                                                   │
│                                                                              │
│  Repository URL:                                                             │
│  Current:  https://github.com/_____________/paramount-crm-system            │
│                                                                              │
│  GitHub Pages URL:                                                           │
│  Current:  https://_____________.github.io/paramount-crm-system/dashboard_ui/ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Updating config.js

If you need to update the dashboard configuration:

1. **Backup current config.js** - Download from GitHub
2. **Copy these values** from current config.js:
   ```javascript
   leadRegisterCsvUrl: 'YOUR_CURRENT_URL_HERE',
   followupTrackerCsvUrl: 'YOUR_CURRENT_URL_HERE',
   quickAddFormUrl: 'YOUR_CURRENT_URL_HERE',
   appsScriptWebAppUrl: 'YOUR_CURRENT_URL_HERE',  // if configured
   ```
3. **Make your changes**
4. **Paste back the URLs** before committing

### Updating Apps Script

If you need to update the Apps Script:

1. Open Lead_Register sheet
2. Extensions → Apps Script
3. **DO NOT delete existing triggers**
4. Make your changes
5. Save and test with a form submission

### Updating GitHub Secrets

If secrets need updating:

1. Repository → Settings → Secrets and variables → Actions
2. Click on the secret to update
3. Enter new value
4. Click "Update secret"

> ⚠️ **Warning**: If you update `GOOGLE_SERVICE_ACCOUNT_JSON`, ensure the new service account has access to your Drive folder and sheets.

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Dashboard shows "--" | CSV URLs not configured or expired | Re-publish sheets, update config.js |
| Lead ID not generating | Apps Script trigger missing | Check Extensions → Apps Script → Triggers |
| Morning briefing not received | GitHub Actions failed | Check Actions tab for errors |
| "Permission Denied" in Actions | Service account lost access | Re-share folder with service account email |
| Form responses not appearing | Form not linked to sheet | Check Form → Responses → Link to Sheets |
| Status not saving | Apps Script Web App not deployed | Deploy as Web App (optional feature) |

### Checking GitHub Actions

1. Go to Repository → **Actions** tab
2. Look for failed workflows (red ❌)
3. Click on failed run → View logs
4. Common fixes:
   - Re-add secrets if expired
   - Check service account permissions
   - Verify sheet names haven't changed

### Checking Apps Script Logs

1. Open Lead_Register sheet
2. Extensions → Apps Script
3. Click **Executions** (left sidebar)
4. View recent runs and any errors

### Re-publishing Sheets as CSV

If dashboard stops loading data:

1. Open Lead_Register sheet
2. File → Share → **Publish to web**
3. Select "Form Responses 1" tab
4. Format: **Comma-separated values (.csv)**
5. Click **Publish** (or **Republish** if already published)
6. Copy the new URL
7. Update `config.js` with new URL
8. Commit and push to GitHub

---

## 📅 Maintenance Schedule

| Task | Frequency | How To |
|------|-----------|--------|
| Check morning briefings received | Daily | Verify Slack/Email |
| Review GitHub Actions | Weekly | Actions tab → Check for failures |
| Verify dashboard data | Weekly | Compare dashboard with sheet |
| Check archive sheets | Monthly | Verify Enrolled/Completed/Lost moved |
| Backup service account JSON | Quarterly | Download and store securely |
| Review Looker Studio | Weekly | Check data freshness |

### Adding New Counsellors

1. Open **Lead Intake Form**
2. Edit the "Counsellor Assigned" question
3. Add new counsellor name
4. Save form

### Adding New Courses

1. Open **Lead Intake Form**
2. Edit the "Course Interested In" question
3. Add new course
4. Save form

### Changing Briefing Time

1. Edit `.github/workflows/morning_briefing.yml`
2. Change cron schedule:
   ```yaml
   schedule:
     - cron: '30 3 * * *'  # 8:30 AM IST = 3:00 AM UTC
   ```
3. Time conversion: IST = UTC + 5:30
4. Commit and push

---

## 📊 Pending Setup: Looker Studio

> 📖 **Detailed instructions available in: [README_LOOKER.md](README_LOOKER.md)**

Looker Studio provides advanced analytics and visualizations beyond the basic dashboard. Setup includes:

- Executive KPI Scorecard
- Lead Conversion Funnel
- Time-series analysis
- Counsellor performance comparison
- Lead source analysis
- Custom date filters

**Estimated setup time: 30-45 minutes**

---

## 📞 Quick Reference

### URLs at a Glance

| Resource | Action |
|----------|--------|
| 📊 Dashboard | View KPIs, edit leads |
| 📝 Lead Form | Share with prospects |
| 📋 Lead_Register | Direct data access |
| ⚙️ GitHub Actions | Monitor automation |
| 📈 Looker Studio | Advanced analytics |

### Status Color Codes

| Color | Status | Action |
|-------|--------|--------|
| 🔵 Blue | New Lead | Initial contact needed |
| 🟣 Purple | Contacted | Follow-up scheduled |
| 🟠 Orange | Interested | High priority follow-up |
| 🔷 Light Blue | Counselling Scheduled | Prepare for session |
| 🟡 Yellow | Admission Pending | Close the deal |
| 🟢 Green | Enrolled | ✅ Success - will archive |
| 🟢 Green | Completed | ✅ Success - will archive |
| 🔴 Red | Lost | ❌ Closed - will archive |

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

<div align="center">

**⚓ Paramount Merchant Navy**

*Sales Operations CRM System v2.0*

✅ System Status: **OPERATIONAL**

</div>
