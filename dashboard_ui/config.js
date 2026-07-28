const config = {
  // Published CSV of Lead_Register → Form Responses 1 tab → CSV format
  leadRegisterCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7Jqtg0yQMYBIoZ2LTV9jJLFGtnaxfjA0hGcqjVOSK-l3ZjOUv6eOUTIVeazQX_Ao_JmuzVz7-eVCX/pub?gid=712764299&single=true&output=csv',

  // Published CSV of Followup_Tracker tab → CSV format
  followupTrackerCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7Jqtg0yQMYBIoZ2LTV9jJLFGtnaxfjA0hGcqjVOSK-l3ZjOUv6eOUTIVeazQX_Ao_JmuzVz7-eVCX/pub?gid=1256833982&single=true&output=csv',

  // Lead Intake Google Form
  quickAddFormUrl:
    'https://docs.google.com/forms/d/1wrN-HyT5qxTBdgi9Y6x3GbttBzLQHtQaE5sLuYu0zC4/viewform',

  // ⚠️ APPS SCRIPT WEB APP URL — enables EDIT access from dashboard
  // Deploy Code.gs as Web App → paste URL here
  // Without this, dashboard is READ-ONLY
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbyb8EiRAPsUDRwNsAWjkUBx2-6DML9dG91oj6tAZrLam7rGUUCjftam1w8J9WP97lSgAQ/exec',

 // Enrollment form (opens pre-filled when lead → Enrolled)
  enrollmentFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdnnuHiW-TF-t6TqjdqWO-4OwsEhLp4VwdyC05E88jOy6XhNA/viewform',
  enrollmentEntryIds: {
    leadId: '1357968253',
    name:   '1763241178',
    phone:  '393247151',
    email:  '772771328'
  },

  // Login credentials (simple client-side gate — not for high security)
  // Change these passwords as needed
  users: {
    'admin':      'paramount2026',
    'counsellor': 'pmn@sales',
    'manager':    'pmn@mgr'
  },

  refreshInterval: 300000,
  branding: {
    title: 'Paramount Merchant Navy',
    subtitle: 'Sales Operations Command Center'
  }
};
