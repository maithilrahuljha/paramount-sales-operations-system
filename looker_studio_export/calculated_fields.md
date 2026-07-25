# 📊 Looker Studio - Calculated Fields Reference

## Quick Copy-Paste Formulas

Use these formulas in Looker Studio when creating calculated fields.  
Go to: **Resource → Manage added data sources → Edit → Add a Field**

---

## 📈 KPI Calculations

### 1. Total Leads Count
```
COUNT(Lead_ID)
```
**Use for:** Total leads scorecard

---

### 2. Enrolled Count
```
SUM(CASE WHEN Status = "Enrolled" THEN 1 ELSE 0 END)
```
**Use for:** Enrolled scorecard

---

### 3. Completed Count
```
SUM(CASE WHEN Status = "Completed" THEN 1 ELSE 0 END)
```
**Use for:** Completed scorecard

---

### 4. Lost Count
```
SUM(CASE WHEN Status = "Lost" THEN 1 ELSE 0 END)
```
**Use for:** Lost leads scorecard

---

### 5. Conversion Rate (%)
```
(SUM(CASE WHEN Status = "Enrolled" THEN 1 ELSE 0 END) / COUNT(Lead_ID)) * 100
```
**Use for:** Conversion rate scorecard

---

### 6. Success Rate (Enrolled + Completed)
```
((SUM(CASE WHEN Status = "Enrolled" THEN 1 ELSE 0 END) + SUM(CASE WHEN Status = "Completed" THEN 1 ELSE 0 END)) / COUNT(Lead_ID)) * 100
```
**Use for:** Overall success rate

---

### 7. Active Leads (Need Follow-up)
```
SUM(CASE 
  WHEN Status IN ("New Lead", "Contacted", "Interested", "Counselling Scheduled", "Admission Pending") 
  THEN 1 
  ELSE 0 
END)
```
**Use for:** Active leads count

---

### 8. Loss Rate (%)
```
(SUM(CASE WHEN Status = "Lost" THEN 1 ELSE 0 END) / COUNT(Lead_ID)) * 100
```
**Use for:** Loss tracking

---

## 📅 Date-Based Calculations

### 9. Leads This Week
```
SUM(CASE 
  WHEN Timestamp >= DATE_TRUNC(CURRENT_DATE(), ISOWEEK) 
  THEN 1 
  ELSE 0 
END)
```
**Use for:** Weekly leads count

---

### 10. Leads This Month
```
SUM(CASE 
  WHEN Timestamp >= DATE_TRUNC(CURRENT_DATE(), MONTH) 
  THEN 1 
  ELSE 0 
END)
```
**Use for:** Monthly leads count

---

### 11. Lead Age (Days)
```
DATE_DIFF(CURRENT_DATE(), Timestamp)
```
**Use for:** Days since lead created

---

### 12. Lead Age Category
```
CASE 
  WHEN DATE_DIFF(CURRENT_DATE(), Timestamp) <= 1 THEN "Today"
  WHEN DATE_DIFF(CURRENT_DATE(), Timestamp) <= 7 THEN "This Week"
  WHEN DATE_DIFF(CURRENT_DATE(), Timestamp) <= 30 THEN "This Month"
  WHEN DATE_DIFF(CURRENT_DATE(), Timestamp) <= 90 THEN "Last 3 Months"
  ELSE "Older"
END
```
**Use for:** Aging analysis

---

### 13. Day of Week
```
FORMAT_DATETIME("%A", Timestamp)
```
**Use for:** Day-wise analysis (Monday, Tuesday, etc.)

---

### 14. Month Name
```
FORMAT_DATETIME("%B %Y", Timestamp)
```
**Use for:** Monthly breakdown (January 2026, etc.)

---

## 👥 Status Analysis

### 15. Status Category
```
CASE 
  WHEN Status IN ("New Lead", "Contacted") THEN "Initial Contact"
  WHEN Status IN ("Interested", "Counselling Scheduled") THEN "In Progress"
  WHEN Status = "Admission Pending" THEN "Almost Closed"
  WHEN Status IN ("Enrolled", "Completed") THEN "Success"
  WHEN Status = "Lost" THEN "Lost"
  ELSE "Other"
END
```
**Use for:** Simplified funnel view

---

### 16. Priority Level
```
CASE 
  WHEN Status IN ("Interested", "Counselling Scheduled", "Admission Pending") THEN "P1 - High"
  WHEN Status IN ("New Lead", "Contacted") THEN "P2 - Medium"
  WHEN Status IN ("Enrolled", "Completed", "Lost") THEN "P3 - Closed"
  ELSE "P2 - Medium"
END
```
**Use for:** Priority-based filtering

---

### 17. Is Active Lead
```
CASE 
  WHEN Status IN ("New Lead", "Contacted", "Interested", "Counselling Scheduled", "Admission Pending") 
  THEN "Active"
  ELSE "Closed"
END
```
**Use for:** Active vs Closed filter

---

### 18. Status Order (for sorting)
```
CASE Status
  WHEN "New Lead" THEN 1
  WHEN "Contacted" THEN 2
  WHEN "Interested" THEN 3
  WHEN "Counselling Scheduled" THEN 4
  WHEN "Admission Pending" THEN 5
  WHEN "Enrolled" THEN 6
  WHEN "Completed" THEN 7
  WHEN "Lost" THEN 8
  ELSE 9
END
```
**Use for:** Correct funnel ordering

---

## 🏆 Counsellor Metrics

### 19. Counsellor Success Count
```
SUM(CASE WHEN Status IN ("Enrolled", "Completed") THEN 1 ELSE 0 END)
```
**Use for:** Per-counsellor success (use with dimension)

---

### 20. Counsellor Conversion Rate
```
(SUM(CASE WHEN Status = "Enrolled" THEN 1 ELSE 0 END) / COUNT(Lead_ID)) * 100
```
**Use for:** Per-counsellor conversion (use with dimension)

---

## 📚 Course Analysis

### 21. Course Popularity Rank
Use a Table with:
- Dimension: `Course Interested In`
- Metric: `Record Count`
- Sort: Descending

---

## 📍 Location Analysis

### 22. City Count
Use a Table with:
- Dimension: `City / Location`
- Metric: `Record Count`
- Sort: Descending

---

## 🔗 Source Analysis

### 23. Source Category
```
CASE 
  WHEN REGEXP_MATCH(`How did you hear about us?`, "(?i).*(facebook|instagram|social).*") THEN "Social Media"
  WHEN REGEXP_MATCH(`How did you hear about us?`, "(?i).*(google|search|seo).*") THEN "Search"
  WHEN REGEXP_MATCH(`How did you hear about us?`, "(?i).*(referral|friend|family).*") THEN "Referral"
  WHEN REGEXP_MATCH(`How did you hear about us?`, "(?i).*(walk|visit|office).*") THEN "Walk-in"
  WHEN REGEXP_MATCH(`How did you hear about us?`, "(?i).*(website|web|online).*") THEN "Website"
  ELSE "Other"
END
```
**Use for:** Grouped source analysis

---

## 📊 How to Add Calculated Fields

### Step-by-Step:

1. **Open your report** in Looker Studio
2. Click **Resource** menu (top)
3. Select **Manage added data sources**
4. Click **EDIT** next to your Lead_Register data source
5. Click **ADD A FIELD** (top right)
6. Enter **Field Name** (e.g., "Conversion Rate")
7. Paste the **Formula** from above
8. Click **SAVE**
9. Click **DONE**
10. Click **CLOSE**

### Using the Field:

1. Add a chart to your report
2. In the Data panel, click **Add metric** or **Add dimension**
3. Find your new calculated field in the list
4. Select it

---

## 🎨 Color Coding Reference

Use these colors for status consistency:

| Status | Color | Hex Code |
|--------|-------|----------|
| New Lead | Light Blue | #17a2b8 |
| Contacted | Purple | #9c27b0 |
| Interested | Orange | #fd7e14 |
| Counselling Scheduled | Blue | #2196f3 |
| Admission Pending | Amber | #ff9800 |
| Enrolled | Green | #28a745 |
| Completed | Dark Green | #388e3c |
| Lost | Red | #dc3545 |

---

## ✅ Recommended Charts

| Metric | Chart Type | Reason |
|--------|------------|--------|
| Total Leads | Scorecard | Single prominent number |
| Conversion Rate | Scorecard with % | Easy to read percentage |
| Status Breakdown | Horizontal Bar | Easy comparison |
| Funnel | Funnel or Bar | Shows progression |
| Trends | Time Series | Shows patterns over time |
| By Counsellor | Bar Chart | Compare performance |
| By Source | Pie Chart | Part of whole |
| Lead Details | Table | Detailed view |

---

<div align="center">

**⚓ Paramount Merchant Navy**

*Looker Studio Formulas Reference*

</div>
