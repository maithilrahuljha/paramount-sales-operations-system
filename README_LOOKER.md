# 📊 Looker Studio Dashboard Setup Guide

## Paramount Merchant Navy - Advanced Analytics Dashboard

> **Estimated Setup Time:** 30-45 minutes  
> **Difficulty:** Easy (no coding required)  
> **Prerequisites:** Working Lead_Register with data

---

## 📋 Table of Contents

1. [What You'll Build](#-what-youll-build)
2. [Before You Start](#-before-you-start)
3. [Step 1: Access Looker Studio](#-step-1-access-looker-studio)
4. [Step 2: Create Data Source](#-step-2-create-data-source)
5. [Step 3: Create the Report](#-step-3-create-the-report)
6. [Step 4: Build Page 1 - Executive Dashboard](#-step-4-build-page-1---executive-dashboard)
7. [Step 5: Build Page 2 - Sales Performance](#-step-5-build-page-2---sales-performance)
8. [Step 6: Build Page 3 - Team Performance](#-step-6-build-page-3---team-performance)
9. [Step 7: Add Filters](#-step-7-add-filters)
10. [Step 8: Style and Theme](#-step-8-style-and-theme)
11. [Step 9: Share the Dashboard](#-step-9-share-the-dashboard)
12. [Troubleshooting](#-troubleshooting)

---

## 🎯 What You'll Build

A professional 3-page analytics dashboard with:

### Page 1: Executive Dashboard
- 📊 4 large KPI scorecards
- 📈 Lead conversion funnel
- 📉 Weekly trend chart

### Page 2: Sales Performance  
- 📊 30-day trend analysis
- 📊 Lead source breakdown
- 📋 Pending follow-ups table

### Page 3: Team Performance
- 📊 Counsellor comparison
- 📊 Admissions by counsellor
- 📊 Performance metrics

---

## ✅ Before You Start

### Verify You Have:

- [ ] **Google Account** (same one with Lead_Register access)
- [ ] **Lead_Register Sheet** with data (at least 5-10 leads)
- [ ] **Published CSV URL** of Lead_Register (from File → Share → Publish to web)

### Copy These Values:

You'll need these during setup:

| Item | Your Value |
|------|------------|
| Lead_Register Spreadsheet ID | _________________________________ |
| Published CSV URL | _________________________________ |

**To find Spreadsheet ID:**  
Open Lead_Register → Look at URL:  
`https://docs.google.com/spreadsheets/d/`**`THIS_IS_YOUR_ID`**`/edit`

---

## 📍 Step 1: Access Looker Studio

### 1.1 Open Looker Studio

1. Open your browser
2. Go to: **https://lookerstudio.google.com**
3. Sign in with your Google account (same one that has Lead_Register access)

### 1.2 First Time Setup

If this is your first time:
1. Click **"Get Started"**
2. Accept Terms of Service
3. Choose your country
4. Click **"Continue"**

### 1.3 Looker Studio Home

You should see the Looker Studio home page with:
- **Recent** reports
- **Shared with me**
- **Templates**

![Looker Studio Home](https://via.placeholder.com/800x400?text=Looker+Studio+Home+Page)

---

## 🔌 Step 2: Create Data Source

### 2.1 Start Data Source Creation

1. Click **"Create"** button (top left, blue button)
2. Select **"Data source"**

### 2.2 Choose Connector

1. You'll see a list of connectors
2. Scroll down or search for **"Google Sheets"**
3. Click on **Google Sheets** connector

![Select Google Sheets](https://via.placeholder.com/800x400?text=Select+Google+Sheets+Connector)

### 2.3 Authorize Access

1. Click **"AUTHORIZE"**
2. Select your Google account
3. Click **"Allow"** to grant access

### 2.4 Select Your Spreadsheet

1. You'll see a list of your Google Sheets
2. Find **"Lead_Register"** (use search if needed)
3. Click on it to select

### 2.5 Select the Worksheet

1. Under "Worksheet", select **"Form Responses 1"** (or your main data tab)
2. Leave other options as default:
   - ✅ Use first row as headers
   - ☐ Include hidden and filtered cells

### 2.6 Click Connect

1. Click **"CONNECT"** button (top right)
2. Wait for Looker Studio to analyze your data

### 2.7 Configure Fields

You'll see a list of all columns. Configure these data types:

| Field Name | Set Type To |
|------------|-------------|
| Lead_ID | Text |
| Candidate Full Name | Text |
| Email Address | Text |
| Phone Number | Text |
| City / Location | Text (Geo → City if available) |
| Course Interested In | Text |
| How did you hear about us? | Text |
| Preferred Batch Month | Text |
| Current Education Level | Text |
| Counsellor Assigned | Text |
| Additional Remarks | Text |
| Status | Text |
| Timestamp | Date & Time |

### 2.8 Name and Save Data Source

1. Click the **"Untitled Data Source"** text at top
2. Rename to: **"Lead_Register_Data"**
3. Click **"CREATE REPORT"** (top right)

---

## 📝 Step 3: Create the Report

### 3.1 Create Report Dialog

1. After clicking "Create Report", a dialog appears
2. Click **"ADD TO REPORT"**

### 3.2 Name Your Report

1. Click **"Untitled Report"** at top left
2. Rename to: **"Paramount Merchant Navy - Sales Analytics"**

### 3.3 Report Canvas

You now have a blank canvas. The interface shows:
- **Left panel**: Charts and components
- **Top toolbar**: Formatting tools
- **Right panel**: Properties and settings
- **Center**: Your report canvas

---

## 📊 Step 4: Build Page 1 - Executive Dashboard

### 4.1 Set Page Name

1. Right-click on page tab at bottom
2. Select **"Rename"**
3. Type: **"Executive Dashboard"**

### 4.2 Add Header

1. Click **"Insert"** menu → **"Text"**
2. Draw a text box at the top
3. Type: **"⚓ Paramount Merchant Navy - Executive Dashboard"**
4. Format:
   - Font: **Roboto** or **Arial**
   - Size: **24px**
   - Color: **#1a237e** (Navy Blue)
   - Bold: **Yes**

### 4.3 Add Scorecard: Total Leads

1. Click **"Add a chart"** → **"Scorecard"**
2. Draw a rectangle on the canvas
3. In right panel, set:
   - **Metric**: `Record Count`
   - **Style tab**:
     - Background: **#1a237e**
     - Text color: **White**
     - Metric font size: **48px**
4. Add a text label above: **"Total Leads"**

**Position:** Top left area

### 4.4 Add Scorecard: Enrolled Count

1. Add another Scorecard
2. **Data tab**:
   - **Metric**: `Record Count`
   - **Filter**: Click "Add a filter"
     - Create filter: `Status` equals `Enrolled`
3. **Style tab**:
   - Background: **#28a745** (Green)
   - Text color: **White**
4. Add label: **"Enrolled"**

**Position:** Next to Total Leads

### 4.5 Add Scorecard: Conversion Rate

1. Add another Scorecard
2. This requires a calculated field. Click **"Add a field"** → **"Create field"**
3. Create calculated field:
   - Name: `Conversion Rate`
   - Formula:
   ```
   COUNTIF(Status, "Enrolled") / COUNT(Lead_ID) * 100
   ```
4. Use this field as the Metric
5. Add **%** suffix in Style
6. Style:
   - Background: **#ffd700** (Gold)
   - Text color: **#1a237e**

**Position:** Next to Enrolled

### 4.6 Add Scorecard: Lost Count

1. Add another Scorecard
2. **Metric**: `Record Count`
3. **Filter**: `Status` equals `Lost`
4. Style:
   - Background: **#dc3545** (Red)
   - Text color: **White**
5. Add label: **"Lost"**

**Position:** Next to Conversion Rate

### 4.7 Add Funnel Chart: Lead Status

1. Click **"Add a chart"** → **"Funnel chart"**
   - (If funnel not available, use **Stacked Bar Chart** horizontally)
2. Draw below the scorecards
3. **Data tab**:
   - **Dimension**: `Status`
   - **Metric**: `Record Count`
   - **Sort**: None (it will sort by funnel logic)
4. **Style tab**:
   - Colors: Use the Paramount color palette

### 4.8 Add Time Series: Weekly Trend

1. Click **"Add a chart"** → **"Time series chart"**
2. Draw on the right side
3. **Data tab**:
   - **Date dimension**: `Timestamp`
   - **Metric**: `Record Count`
   - **Granularity**: Week
4. **Style tab**:
   - Line color: **#1a237e**
   - Show data labels: **Yes**

### 4.9 Add Date Filter

1. Click **"Add a control"** → **"Date range control"**
2. Place at top right
3. Set default to **"Last 30 days"**

---

## 📈 Step 5: Build Page 2 - Sales Performance

### 5.1 Add New Page

1. Click **"Page"** menu → **"New page"**
2. Or click **"+"** icon next to page tabs at bottom

### 5.2 Rename Page

1. Right-click page tab
2. Rename to: **"Sales Performance"**

### 5.3 Add Header

1. Add text: **"📈 Sales Performance"**
2. Format same as Page 1

### 5.4 Add Combo Chart: Leads Over Time

1. Click **"Add a chart"** → **"Combo chart"**
2. Draw a wide chart at top
3. **Data tab**:
   - **Date dimension**: `Timestamp`
   - **Metric 1**: `Record Count` (Bars - All leads)
   - **Metric 2**: Create filter for Enrolled count (Line)
4. **Style tab**:
   - Bar color: **#1a237e**
   - Line color: **#28a745**

### 5.5 Add Bar Chart: Lead Sources

1. Click **"Add a chart"** → **"Bar chart"** (horizontal)
2. Draw on left side, below combo chart
3. **Data tab**:
   - **Dimension**: `How did you hear about us?`
   - **Metric**: `Record Count`
   - **Sort**: `Record Count` descending

### 5.6 Add Pie Chart: Status Distribution

1. Click **"Add a chart"** → **"Pie chart"**
2. Draw on right side
3. **Data tab**:
   - **Dimension**: `Status`
   - **Metric**: `Record Count`
4. **Style tab**:
   - Show legend
   - Show percentages

### 5.7 Add Table: Active Follow-ups

1. Click **"Add a chart"** → **"Table"**
2. Draw at bottom
3. **Data tab**:
   - **Dimensions**:
     - `Lead_ID`
     - `Candidate Full Name`
     - `Phone Number`
     - `Counsellor Assigned`
     - `Status`
   - **Filter**: `Status` NOT IN (`Enrolled`, `Completed`, `Lost`)
4. **Style tab**:
   - Header background: **#1a237e**
   - Header text: **White**
   - Alternating row colors: **Yes**

---

## 👥 Step 6: Build Page 3 - Team Performance

### 6.1 Add New Page

1. Add new page
2. Rename to: **"Team Performance"**

### 6.2 Add Header

1. Add text: **"👥 Team Performance"**

### 6.3 Add Bar Chart: Leads by Counsellor

1. Click **"Add a chart"** → **"Bar chart"**
2. **Data tab**:
   - **Dimension**: `Counsellor Assigned`
   - **Metric**: `Record Count`
   - **Sort**: `Record Count` descending
3. Style with Paramount colors

### 6.4 Add Stacked Bar: Status by Counsellor

1. Click **"Add a chart"** → **"Stacked bar chart"**
2. **Data tab**:
   - **Dimension**: `Counsellor Assigned`
   - **Breakdown dimension**: `Status`
   - **Metric**: `Record Count`
3. This shows each counsellor's leads broken down by status

### 6.5 Add Pivot Table: Counsellor Summary

1. Click **"Add a chart"** → **"Pivot table"**
2. **Data tab**:
   - **Row dimension**: `Counsellor Assigned`
   - **Column dimension**: `Status`
   - **Metric**: `Record Count`
3. **Style tab**:
   - Show row totals: **Yes**
   - Show column totals: **Yes**

### 6.6 Add Scorecard Row: Team Totals

Add scorecards for each counsellor with their individual stats.

---

## 🎛️ Step 7: Add Filters

### 7.1 Add Counsellor Filter (All Pages)

1. Click **"Add a control"** → **"Drop-down list"**
2. **Data tab**:
   - **Control field**: `Counsellor Assigned`
3. **Style tab**:
   - Allow search
   - Multi-select: **Yes**
4. Position at top of each page
5. Right-click → **"Make report-level"** (applies to all pages)

### 7.2 Add Status Filter

1. Add another Drop-down list
2. **Control field**: `Status`
3. Make report-level

### 7.3 Add Course Filter

1. Add Drop-down list
2. **Control field**: `Course Interested In`
3. Make report-level

### 7.4 Add Date Range Filter

1. Click **"Add a control"** → **"Date range control"**
2. Position at top
3. Make report-level

---

## 🎨 Step 8: Style and Theme

### 8.1 Set Theme Colors

1. Click **"Theme and layout"** in toolbar (or Resource → Manage report theme)
2. Click **"Customize"**
3. Set brand colors:
   - **Primary**: #1a237e (Navy Blue)
   - **Secondary**: #ffd700 (Gold)
   - **Accent 1**: #28a745 (Green)
   - **Accent 2**: #fd7e14 (Orange)
   - **Accent 3**: #dc3545 (Red)

### 8.2 Set Fonts

1. In Theme settings:
   - **Header font**: Roboto
   - **Body font**: Roboto
2. Apply to all

### 8.3 Add Logo (Optional)

1. Click **"Insert"** → **"Image"**
2. Upload your logo or use the anchor emoji: ⚓
3. Position at top left of each page

### 8.4 Add Footer

1. Add text box at bottom of each page
2. Text: **"© 2026 Paramount Merchant Navy | Data refreshes automatically"**
3. Font size: 10px
4. Color: Gray

---

## 🔗 Step 9: Share the Dashboard

### 9.1 Set Sharing Permissions

1. Click **"Share"** button (top right)
2. Add email addresses of team members
3. Set permission level:
   - **Viewer**: Can view only
   - **Editor**: Can modify

### 9.2 Get Shareable Link

1. Click **"Share"** → **"Get link"**
2. Choose access level:
   - **Restricted**: Only added people
   - **Anyone with link**: Public access
3. Copy the link

### 9.3 Embed in Website (Optional)

1. Click **"File"** → **"Embed report"**
2. Copy the embed code
3. Paste in your website HTML

### 9.4 Schedule Email Delivery

1. Click **"Share"** → **"Schedule email delivery"**
2. Set:
   - Recipients
   - Frequency: Daily/Weekly/Monthly
   - Time
   - Pages to include
3. Click **"Schedule"**

---

## 🔄 Data Refresh Settings

### Automatic Refresh

Looker Studio automatically refreshes data based on your data source settings.

### Manual Refresh

1. Click the **"Refresh data"** icon (circular arrow) in viewer mode
2. Or set auto-refresh interval in embed settings

### Set Data Freshness

1. Go to **"Resource"** → **"Manage added data sources"**
2. Click **"Edit"** on your data source
3. Set **"Data freshness"**:
   - **15 minutes** (recommended)
   - **1 hour**
   - **4 hours**
   - **12 hours**

---

## ❓ Troubleshooting

### Issue: No Data Showing

**Cause:** Data source not connected properly

**Solution:**
1. Check data source connection
2. Verify Sheet is shared with your account
3. Re-authorize if needed

### Issue: Wrong Data Types

**Cause:** Looker Studio auto-detected incorrect types

**Solution:**
1. Go to Resource → Manage added data sources
2. Click Edit on your source
3. Change field types manually

### Issue: Filters Not Working

**Cause:** Filters not applied correctly

**Solution:**
1. Verify filter field matches data
2. Check for extra spaces in data
3. Ensure filter is report-level if needed on all pages

### Issue: Calculated Field Error

**Cause:** Formula syntax error

**Solution:**
1. Check formula uses correct field names
2. Use quotes around text values: `"Enrolled"`
3. Check for typos

### Issue: Charts Not Loading

**Cause:** Too much data or timeout

**Solution:**
1. Add date filter to limit data
2. Reduce chart complexity
3. Refresh the page

---

## 📋 Quick Reference: Chart Types

| Chart | Best For |
|-------|----------|
| **Scorecard** | Single KPI number |
| **Time Series** | Trends over time |
| **Bar Chart** | Comparing categories |
| **Pie Chart** | Part of whole (< 7 items) |
| **Table** | Detailed data view |
| **Pivot Table** | Cross-tabulation |
| **Funnel** | Stage progression |
| **Geo Map** | Geographic data |

---

## 📋 Quick Reference: Useful Formulas

### Conversion Rate
```
COUNTIF(Status, "Enrolled") / COUNT(Lead_ID) * 100
```

### Enrolled This Month
```
SUM(CASE WHEN Status = "Enrolled" AND Timestamp >= DATE_TRUNC_MONTH(TODAY()) THEN 1 ELSE 0 END)
```

### Days Since Creation
```
DATE_DIFF(TODAY(), Timestamp)
```

### Lead Age Category
```
CASE 
  WHEN DATE_DIFF(TODAY(), Timestamp) <= 7 THEN "This Week"
  WHEN DATE_DIFF(TODAY(), Timestamp) <= 30 THEN "This Month"
  ELSE "Older"
END
```

---

## ✅ Final Checklist

- [ ] Data source connected to Lead_Register
- [ ] All 3 pages created
- [ ] Page 1: Executive Dashboard with 4 KPIs + Funnel + Trend
- [ ] Page 2: Sales Performance with charts + table
- [ ] Page 3: Team Performance with counsellor breakdown
- [ ] Date range filter added (report-level)
- [ ] Counsellor filter added (report-level)
- [ ] Status filter added (report-level)
- [ ] Theme colors applied (Navy + Gold)
- [ ] Report named properly
- [ ] Shared with team members
- [ ] Bookmark/save the report URL

---

## 🔗 Your Dashboard URL

After completing setup, your dashboard will be available at:

```
https://lookerstudio.google.com/reporting/[YOUR_REPORT_ID]
```

**Save this URL for quick access!**

---

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Verify data source connection
3. Check Looker Studio help: https://support.google.com/looker-studio

---

<div align="center">

**⚓ Paramount Merchant Navy**

*Looker Studio Dashboard Setup Guide v1.0*

</div>
