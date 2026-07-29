# ⚓ Paramount Merchant Navy - Sales Operations CRM System

[![Status](https://img.shields.io/badge/Status-Live%20%26%20Working-success)](/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Automated-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-Connected-34A853?logo=google-sheets&logoColor=white)](https://www.google.com/sheets/about/)


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

---


<div align="center">

**⚓ Paramount Merchant Navy**

*Sales Operations CRM System v2.0*

✅ System Status: **OPERATIONAL**

</div>
