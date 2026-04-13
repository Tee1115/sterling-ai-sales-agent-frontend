"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

type AuthStep = "credentials" | "otp" | "app";
type PageId =
  | "dashboard"
  | "agent-control"
  | "performance"
  | "downtime"
  | "prospective"
  | "existing-life-updates"
  | "existing-migration"
  | "inactive-transaction"
  | "inactive-onebank"
  | "reports"
  | "audit"
  | "settings";

type Job = {
  key: string;
  name: string;
  trigger: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
};

type CustomerScope = "all" | "existing" | "inactive";

type ReportFilterMode = "date" | "month";

type ReportRow = {
  report: string;
  module: string;
  date: string;
  month: string;
  records: string;
  status: string;
  owner: string;
};

type WaveStage = "Wave 1" | "Wave 2" | "Wave 3" | "Final Wave";

const WAVE_STAGE_OPTIONS: WaveStage[] = ["Wave 1", "Wave 2", "Wave 3", "Final Wave"];

function formatWaveStageLabel(jobKey: string, waveStage: WaveStage): string {
  if (jobKey !== "existing-migration") {
    return waveStage;
  }

  if (waveStage === "Wave 1") {
    return "Pre-maturity (30d)";
  }
  if (waveStage === "Wave 2") {
    return "Pre-maturity (14d)";
  }
  if (waveStage === "Wave 3") {
    return "Pre-maturity (7d)";
  }
  return "Day-of / Follow-up";
}

function applyPreviewTokens(text: string): string {
  return text
    .replace(/\{\{FirstName\}\}/gi, "Adaobi")
    .replace(/\{\{LastName\}\}/gi, "Okafor")
    .replace(/\{\{AccountNumber\}\}/gi, "0012345678")
    .replace(/\{\{Amount\}\}/gi, "₦150,000")
    .replace(/\{\{ProductName\}\}/gi, "SterlingOne Savings")
    .replace(/\{\{BankName\}\}/gi, "Sterling Bank")
    .replace(/\{\{Date\}\}/gi, new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderFooterTextHtml(text: string): string {
  const tokenized = applyPreviewTokens(text);
  const escaped = escapeHtml(tokenized);
  const withLinks = escaped.replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, (raw) => {
    const href = raw.toLowerCase().startsWith("www.") ? `https://${raw}` : raw;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${raw}</a>`;
  });
  return withLinks.replace(/\n/g, "<br />");
}

function normalizeLinkUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

type TemplateRow = {
  id: string;
  templateCode?: string;
  name: string;
  templateCategory: string;
  product: string;
  eventCategory: string;
  waveStage: WaveStage;
  channel: string;
  subject: string;
  header?: string;
  headerImage?: string;
  body: string;
  templateFooter?: string;
  footerImage?: string;
  footerTextAbove?: string;
  footerTextBelow?: string;
  videoThumbnail?: string;
  gifThumbnail?: string;
  status: string;
  updated: string;
};

type TemplateDraft = {
  name: string;
  templateCategory: string;
  product: string;
  eventCategory: string;
  waveStage: WaveStage;
  channel: string;
  subject: string;
  header: string;
  headerImage: string;
  body: string;
  templateFooter: string;
  footerImage: string;
  footerTextAbove: string;
  footerTextBelow: string;
  videoThumbnail: string;
  gifThumbnail: string;
};

type ModuleWavePlan = {
  startDate: string;
  endDate: string;
  waves: 1 | 2 | 3;
  spacingDays: number;
  finalWaveAction: "stop" | "escalate";
};

type MigrationTriggerPlan = {
  thresholdCadence: "realtime" | "daily_batch";
  thresholdFollowUpDays: number;
  ageTriggerMinimum: 18;
  ageReminderDays: string;
  investmentReminderDays: string;
  postMaturityFollowUpDays: number;
};

type WorkflowLogRow = {
  date: string;
  module: string;
  subModule: string;
  totalSent: string;
  failed: string;
  success: string;
  pending: string;
  manualTrigger: string;
};

type AuditLogRow = {
  time: string;
  actor: string;
  action: string;
  module: string;
  details: string;
  result: string;
};

type AlertRow = {
  module: string;
  description: string;
  started: string;
  severity: string;
  duration: string;
  action: string;
};

type UserRow = {
  name: string;
  role: string;
  team: string;
  status: string;
  lastSeen: string;
};

type CustomerOption = {
  customerId: number;
  name: string;
  accountNumber: string;
};

type TxForm = {
  accountNumber: string;
  eventType: string;
  amount: string;
  date: string;
};

type TxResult = {
  lifeEvent: string;
  eventDetected: boolean;
  product: string | null;
  emailStatus: string | null;
  error: string | null;
};

type TxSeedResult = {
  seededTransactions: number;
  skippedAccounts: string[];
  error: string | null;
};

type BulkCampaignRow = {
  campaign_name: string;
  module_key: string;
  customer_id: string;
  account_number: string;
  event_type: string;
  product_type: string;
  income_band: string;
  template_code: string;
  channel: string;
  start_date: string;
  end_date: string;
  recurrence: string;
};

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: "Dashboard Overview",
  "agent-control": "Agent Control",
  performance: "Performance Metrics",
  downtime: "Downtime and Alerts",
  prospective: "Prospective Customers",
  "existing-life-updates": "Life Updates",
  "existing-migration": "Lifecycle Triggers",
  "inactive-transaction": "Transaction Inactive",
  "inactive-onebank": "Onebank Inactive",
  reports: "Reports and Sent",
  audit: "Audit Logs",
  settings: "Settings",
};

const LIFE_EVENT_TRIGGER_OPTIONS = [
  { value: "salary_increase", label: "Salary Increase", narration: "SALARY PAYMENT", defaultAmount: "320000" },
  { value: "school_fees", label: "School Fees", narration: "SCHOOL FEES PAYMENT", defaultAmount: "185000" },
  { value: "fx_transfer", label: "FX Activity", narration: "FX TRANSFER USD", defaultAmount: "450000" },
  { value: "rent_payment", label: "Rent Payment", narration: "HOUSE RENT", defaultAmount: "225000" },
  { value: "loan_repayment", label: "Loan Repayment", narration: "LOAN REPAYMENT", defaultAmount: "125000" },
] as const;

const KPIS = [
  { label: "Active Workflows", value: "1,284", delta: "up", note: "+12% today" },
  { label: "Messages Delivered", value: "9,431", delta: "up", note: "+8.4% vs yesterday" },
  { label: "Accounts Processed", value: "3,672", delta: "flat", note: "steady" },
  { label: "Errors", value: "23", delta: "down", note: "3 unresolved" },
];

const ACTIVITY_ROWS = [
  {
    timestamp: "2026-03-19 21:34:02",
    module: "Life Updates",
    customerId: "CUS-00491",
    account: "0012345678",
    trigger: "Birthday Credit",
    version: "V2",
    status: "Delivered",
    by: "System",
  },
  {
    timestamp: "2026-03-19 21:31:18",
    module: "Lifecycle Triggers",
    customerId: "CUS-00388",
    account: "0098765432",
    trigger: "DOB + Credit",
    version: "V2",
    status: "Delivered",
    by: "System",
  },
  {
    timestamp: "2026-03-19 21:28:44",
    module: "Txn Inactive",
    customerId: "CUS-01122",
    account: "0056781234",
    trigger: "90d inactivity",
    version: "V3",
    status: "Pending",
    by: "jsmith",
  },
  {
    timestamp: "2026-03-19 21:22:09",
    module: "Onebank Inactive",
    customerId: "CUS-00774",
    account: "0034561234",
    trigger: "60d no login",
    version: "V3",
    status: "Failed",
    by: "System",
  },
];

const INITIAL_JOBS: Job[] = [
  {
    key: "existing-life-updates",
    name: "Life Updates",
    trigger: "Live event + credit",
    enabled: true,
    lastRun: "21:34",
    nextRun: "21:39",
  },
  {
    key: "existing-migration",
    name: "Lifecycle Triggers",
    trigger: "Threshold + maturity date",
    enabled: true,
    lastRun: "21:31",
    nextRun: "21:36",
  },
  {
    key: "inactive-transaction",
    name: "Transaction Inactive",
    trigger: "Last txn > threshold",
    enabled: true,
    lastRun: "21:28",
    nextRun: "21:33",
  },
  {
    key: "inactive-onebank",
    name: "Onebank Inactive",
    trigger: "Last login > threshold",
    enabled: false,
    lastRun: "20:15",
    nextRun: "-",
  },
];

const REPORT_ROWS: ReportRow[] = [
  {
    report: "Daily Delivery",
    module: "Life Updates",
    date: "2026-03-19",
    month: "2026-03",
    records: "6802",
    status: "Ready",
    owner: "System",
  },
  {
    report: "Failure Analysis",
    module: "Lifecycle Triggers",
    date: "2026-03-19",
    month: "2026-03",
    records: "48",
    status: "Ready",
    owner: "Operations",
  },
  {
    report: "Inactivity Reactivation",
    module: "Transaction Inactive",
    date: "2026-03-18",
    month: "2026-03",
    records: "2845",
    status: "Ready",
    owner: "Retention",
  },
  {
    report: "Lifecycle Trigger Conversion",
    module: "Lifecycle Triggers",
    date: "2026-02-26",
    month: "2026-02",
    records: "4112",
    status: "Ready",
    owner: "Growth",
  },
  {
    report: "Onebank Reactivation",
    module: "Onebank Inactive",
    date: "2026-02-12",
    month: "2026-02",
    records: "1970",
    status: "Ready",
    owner: "Digital",
  },
];

const PERFORMANCE_OVERVIEW = [
  { label: "Delivery Rate", value: "94.2%", note: "+1.3% WoW" },
  { label: "Avg. Response", value: "1.8m", note: "from trigger to send" },
  { label: "Engagement", value: "38.6%", note: "open and click blended" },
  { label: "Conversion Rate", value: "12.4%", note: "offer acceptance" },
];

const PERFORMANCE_MODULE_ROWS = [
  ["Existing", "Life Updates", "2,114", "97.8%", "1.5m", "14.1%"],
  ["Existing", "Lifecycle Triggers", "1,807", "98.9%", "1.2m", "11.6%"],
  ["Inactive", "Transaction Inactive", "1,292", "96.1%", "2.4m", "9.8%"],
  ["Inactive", "Onebank Inactive", "904", "95.3%", "2.9m", "8.7%"],
];

const SLA_ROWS = [
  { label: "DB Latency", value: "42ms", status: "Healthy", note: "Target < 80ms" },
  { label: "Workflow Execution", value: "1.4s", status: "Healthy", note: "Target < 3s" },
  { label: "Message Delivery", value: "94.2%", status: "Watch", note: "Target > 95%" },
];

const DOWNTIME_OVERVIEW = [
  { label: "Current Uptime", value: "99.94%", note: "30 day rolling" },
  { label: "Active Alerts", value: "3", note: "1 high severity" },
  { label: "Incidents", value: "7", note: "this month" },
  { label: "Avg. Resolution", value: "11m", note: "incident MTTR" },
];

const UPTIME_HISTORY = [
  { label: "W1", operational: 26, degraded: 3, outage: 1 },
  { label: "W2", operational: 28, degraded: 2, outage: 0 },
  { label: "W3", operational: 25, degraded: 4, outage: 1 },
  { label: "W4", operational: 27, degraded: 3, outage: 0 },
  { label: "W5", operational: 29, degraded: 1, outage: 0 },
  { label: "W6", operational: 28, degraded: 2, outage: 0 },
];

const ALERT_ROWS: AlertRow[] = [
  { module: "Message Delivery", description: "Provider fallback threshold exceeded", started: "19 Mar 20:44", severity: "High", duration: "18m", action: "Reroute" },
  { module: "Workflow Execution", description: "Retry queue depth above normal", started: "19 Mar 19:28", severity: "Medium", duration: "42m", action: "Investigate" },
  { module: "DB Latency", description: "Primary read latency elevated", started: "19 Mar 18:11", severity: "Low", duration: "9m", action: "Monitor" },
];

const WORKFLOW_LOG_ROWS: WorkflowLogRow[] = [
  { date: "2026-03-19", module: "Existing", subModule: "Life Updates", totalSent: "2114", failed: "11", success: "2074", pending: "29", manualTrigger: "16" },
  { date: "2026-03-19", module: "Existing", subModule: "Lifecycle Triggers", totalSent: "1807", failed: "8", success: "1774", pending: "25", manualTrigger: "11" },
  { date: "2026-03-18", module: "Inactive", subModule: "Transaction Inactive", totalSent: "1292", failed: "17", success: "1231", pending: "44", manualTrigger: "9" },
  { date: "2026-03-18", module: "Inactive", subModule: "Onebank Inactive", totalSent: "904", failed: "12", success: "861", pending: "31", manualTrigger: "7" },
  { date: "2026-02-26", module: "Existing", subModule: "Lifecycle Triggers", totalSent: "1640", failed: "10", success: "1608", pending: "22", manualTrigger: "12" },
];

const TEMPLATE_PRODUCTS = ["Savings", "Current", "Loan", "Cards", "Investment", "Insurance"];

const TEMPLATE_LIBRARY_CATEGORIES = ["Life Event", "Product Category", "Recommendation Category"];

const TEMPLATE_EVENT_CATEGORIES: Record<string, string[]> = {
  "existing-life-updates": ["New Job", "Loan", "School Fees", "Child Birth", "Wedding", "Salary Increase", "Passport Expiry", "Driver's License Expiry"],
  "existing-migration": ["Account Tier Balance Threshold", "30 Days To Maturity", "Maturity Day Follow-up", "Child Turns 18"],
  "inactive-transaction": ["No Debit Activity", "No Credit Activity", "Dormancy Risk", "Low Balance", "Card Inactive"],
  "inactive-onebank": ["No Login", "Feature Discovery", "Abandoned Journey", "Push Failed", "Reactivation"],
};

const INITIAL_TEMPLATES: Record<string, TemplateRow[]> = {
  "existing-life-updates": [
    { id: "lu-1", name: "Birthday Nudge", templateCategory: "Life Event", product: "Savings", eventCategory: "Child Birth", waveStage: "Wave 1", channel: "Email", subject: "A timely offer for you", body: "Celebrate your milestone with a tailored banking offer designed around your recent activity.", status: "Active", updated: "19 Mar 21:10" },
    { id: "lu-2", name: "Salary Credit Follow-up", templateCategory: "Recommendation Category", product: "Current", eventCategory: "Salary Increase", waveStage: "Wave 2", channel: "Email", subject: "Unlock more from your account", body: "Your account activity qualifies you for curated next-step benefits. Here is what to activate next.", status: "Draft", updated: "19 Mar 20:15" },
  ],
  "existing-migration": [
    { id: "mg-1", name: "Tier-1 Threshold Notice", templateCode: "ACCOUNT_TIER_BALANCE_THRESHOLD", templateCategory: "Product Category", product: "Current", eventCategory: "Account Tier Balance Threshold", waveStage: "Wave 1", channel: "Email", subject: "Your account qualifies for the next tier", body: "Your Tier-1 account activity has crossed the balance threshold. You are now eligible for an upgrade journey.", status: "Active", updated: "19 Mar 20:48" },
    { id: "mg-2", name: "30-Day Maturity Reminder", templateCode: "MATURITY_30_DAY_NOTICE", templateCategory: "Recommendation Category", product: "Investment", eventCategory: "30 Days To Maturity", waveStage: "Wave 2", channel: "Email", subject: "30 days to maturity: plan your next move", body: "You are within 30 days of maturity. Confirm your preferred rollover or upgrade option to avoid delays.", status: "Active", updated: "18 Mar 18:02" },
    { id: "mg-3", name: "Maturity Day Follow-up", templateCode: "MATURITY_DAY_OF_FOLLOW_UP", templateCategory: "Recommendation Category", product: "Savings", eventCategory: "Maturity Day Follow-up", waveStage: "Final Wave", channel: "Email", subject: "Maturity is due today", body: "Your maturity date is due today. Complete your next action to finalize the lifecycle transition.", status: "Active", updated: "18 Mar 18:10" },
  ],
  "inactive-transaction": [
    { id: "ti-1", name: "Reactivation Prompt", templateCategory: "Recommendation Category", product: "Savings", eventCategory: "Dormancy Risk", waveStage: "Wave 1", channel: "Email", subject: "We would love to see you transact again", body: "Restart activity on your account with one quick action and see the benefits immediately.", status: "Active", updated: "19 Mar 19:55" },
    { id: "ti-2", name: "Dormancy Save", templateCategory: "Product Category", product: "Current", eventCategory: "No Debit Activity", waveStage: "Wave 3", channel: "Email", subject: "A quick way back to active banking", body: "Your account remains eligible for banking rewards. Re-engage now to stay active and protected.", status: "Draft", updated: "18 Mar 16:34" },
  ],
  "inactive-onebank": [
    { id: "ob-1", name: "App Return", templateCategory: "Recommendation Category", product: "Current", eventCategory: "No Login", waveStage: "Wave 1", channel: "Email", subject: "Come back to Onebank", body: "There are new features waiting in Onebank. Sign in again and continue seamlessly.", status: "Active", updated: "19 Mar 18:21" },
    { id: "ob-2", name: "Feature Spotlight", templateCategory: "Product Category", product: "Savings", eventCategory: "Feature Discovery", waveStage: "Wave 2", channel: "Email", subject: "See what you missed in Onebank", body: "Discover the tools and shortcuts you have missed since your last login to Onebank.", status: "Draft", updated: "17 Mar 15:44" },
  ],
};

const INITIAL_TEMPLATE_DRAFTS: Record<string, TemplateDraft> = {
  "existing-life-updates": { name: "", templateCategory: "Life Event", product: "Savings", eventCategory: "New Job", waveStage: "Wave 1", channel: "Email", subject: "", header: "", headerImage: "", body: "", templateFooter: "", footerImage: "", footerTextAbove: "", footerTextBelow: "", videoThumbnail: "", gifThumbnail: "" },
  "existing-migration": { name: "", templateCategory: "Product Category", product: "Current", eventCategory: "Account Tier Balance Threshold", waveStage: "Wave 1", channel: "Email", subject: "", header: "", headerImage: "", body: "", templateFooter: "", footerImage: "", footerTextAbove: "", footerTextBelow: "", videoThumbnail: "", gifThumbnail: "" },
  "inactive-transaction": { name: "", templateCategory: "Recommendation Category", product: "Savings", eventCategory: "Dormancy Risk", waveStage: "Wave 1", channel: "Email", subject: "", header: "", headerImage: "", body: "", templateFooter: "", footerImage: "", footerTextAbove: "", footerTextBelow: "", videoThumbnail: "", gifThumbnail: "" },
  "inactive-onebank": { name: "", templateCategory: "Recommendation Category", product: "Current", eventCategory: "No Login", waveStage: "Wave 1", channel: "Email", subject: "", header: "", headerImage: "", body: "", templateFooter: "", footerImage: "", footerTextAbove: "", footerTextBelow: "", videoThumbnail: "", gifThumbnail: "" },
};

const MODULE_WAVE_PLAN_DEFAULTS: Record<string, ModuleWavePlan> = {
  "existing-life-updates": { startDate: "2026-03-21", endDate: "2026-04-20", waves: 3, spacingDays: 7, finalWaveAction: "stop" },
  "existing-migration": { startDate: "2026-03-21", endDate: "2026-04-20", waves: 3, spacingDays: 7, finalWaveAction: "escalate" },
  "inactive-transaction": { startDate: "2026-03-21", endDate: "2026-04-30", waves: 3, spacingDays: 10, finalWaveAction: "stop" },
  "inactive-onebank": { startDate: "2026-03-21", endDate: "2026-04-30", waves: 2, spacingDays: 14, finalWaveAction: "stop" },
};

const MIGRATION_TRIGGER_PLAN_DEFAULTS: MigrationTriggerPlan = {
  thresholdCadence: "realtime",
  thresholdFollowUpDays: 3,
  ageTriggerMinimum: 18,
  ageReminderDays: "14,7,0",
  investmentReminderDays: "30,14,7,0",
  postMaturityFollowUpDays: 2,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";
const ENABLE_MANUAL_TRIGGER_PANEL = process.env.NEXT_PUBLIC_ENABLE_MANUAL_TRIGGER === "true";
const ENABLE_DEMO_SEED_BUTTON = process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "true";
const V2_ENDPOINTS = {
  emailTemplates: `${API_BASE_URL}/v2/email-templates`,
  emailTemplateByCode: (code: string) => `${API_BASE_URL}/v2/email-templates/${encodeURIComponent(code)}`,
  workflowJobs: `${API_BASE_URL}/v2/workflow-jobs`,
  workflowJobByKey: (key: string) => `${API_BASE_URL}/v2/workflow-jobs/${encodeURIComponent(key)}`,
  workflowJobTrigger: (key: string) => `${API_BASE_URL}/v2/workflow-jobs/${encodeURIComponent(key)}/trigger`,
  bulkCampaignTrigger: `${API_BASE_URL}/v2/campaigns/bulk/trigger`,
  customers: `${API_BASE_URL}/v2/customers`,
  processTransaction: `${API_BASE_URL}/v2/process-transaction`,
  lifecycleTriggersExecute: `${API_BASE_URL}/v2/lifecycle-triggers/execute`,
  seedLifeEventHistory: `${API_BASE_URL}/v2/demo/seed-life-event-history`,
};

type BackendTemplateListItem = {
  template_id: number;
  template_code: string;
  subject_template: string;
  body_template: string;
  header_image?: string;
  template_footer?: string;
  footer_image?: string;
  footer_text_above?: string;
  footer_text_below?: string;
  video_thumbnail?: string;
  gif_thumbnail?: string;
  active?: number;
  created_at?: string;
};

type BackendTemplateUpsertResponse = {
  status: string;
  template: {
    template_id: number;
    template_code: string;
    subject_template: string;
    body_template: string;
    header_image?: string;
    template_footer?: string;
    footer_image?: string;
    footer_text_above?: string;
    footer_text_below?: string;
    video_thumbnail?: string;
    gif_thumbnail?: string;
    active?: number;
  };
};

type BackendTemplateDetail = {
  template_id: number;
  template_code: string;
  subject_template: string;
  body_template: string;
  header_image?: string;
  template_footer?: string;
  footer_image?: string;
  footer_text_above?: string;
  footer_text_below?: string;
  video_thumbnail?: string;
  gif_thumbnail?: string;
};

type BackendWorkflowJob = {
  key: string;
  name: string;
  enabled: boolean;
  schedule_minutes?: number;
  last_run_at?: string | null;
  next_run_at?: string | null;
};

const BULK_CAMPAIGN_TEMPLATE_COLUMNS = [
  "campaign_name",
  "module_key",
  "customer_id",
  "account_number",
  "event_type",
  "product_type",
  "income_band",
  "template_code",
  "channel",
  "start_date",
  "end_date",
  "recurrence",
];

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = i + 1 < line.length ? line[i + 1] : "";

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseBulkCampaignCsv(content: string): { rows: BulkCampaignRow[]; errors: string[] } {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ["File is empty."] };
  }

  const header = parseCsvLine(lines[0]).map((value) => value.toLowerCase());
  const missing = BULK_CAMPAIGN_TEMPLATE_COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        `Invalid CSV format. Missing columns: ${missing.join(", ")}`,
      ],
    };
  }

  const columnIndex = Object.fromEntries(header.map((value, idx) => [value, idx])) as Record<string, number>;
  const rows: BulkCampaignRow[] = [];
  const errors: string[] = [];

  for (let lineNumber = 1; lineNumber < lines.length; lineNumber += 1) {
    const values = parseCsvLine(lines[lineNumber]);
    const row: BulkCampaignRow = {
      campaign_name: values[columnIndex.campaign_name] ?? "",
      module_key: values[columnIndex.module_key] ?? "",
      customer_id: values[columnIndex.customer_id] ?? "",
      account_number: values[columnIndex.account_number] ?? "",
      event_type: values[columnIndex.event_type] ?? "",
      product_type: values[columnIndex.product_type] ?? "",
      income_band: values[columnIndex.income_band] ?? "",
      template_code: values[columnIndex.template_code] ?? "",
      channel: values[columnIndex.channel] ?? "",
      start_date: values[columnIndex.start_date] ?? "",
      end_date: values[columnIndex.end_date] ?? "",
      recurrence: values[columnIndex.recurrence] ?? "",
    };

    if (!row.customer_id || !row.account_number || !row.module_key || !row.template_code) {
      errors.push(`Line ${lineNumber + 1}: missing one or more required fields.`);
      continue;
    }

    if (!row.start_date || !row.end_date) {
      errors.push(`Line ${lineNumber + 1}: start_date and end_date are required.`);
      continue;
    }

    const startDate = new Date(row.start_date);
    const endDate = new Date(row.end_date);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      errors.push(`Line ${lineNumber + 1}: start_date and end_date must be valid dates (YYYY-MM-DD).`);
      continue;
    }

    if (endDate < startDate) {
      errors.push(`Line ${lineNumber + 1}: end_date cannot be earlier than start_date.`);
      continue;
    }

    rows.push(row);
  }

  return { rows, errors };
}

function formatJobTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const day = d.toLocaleDateString("en-GB", { day: "2-digit" });
    const month = d.toLocaleDateString("en-GB", { month: "2-digit" });
    const year = d.toLocaleDateString("en-GB", { year: "2-digit" });
    const shortTime = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${day}/${month}/${year} ${shortTime}`;
  } catch {
    return "-";
  }
}

function mapBackendTemplatesToRows(items: BackendTemplateListItem[]): TemplateRow[] {
  return items.map((item) => {
    const safeCode = item.template_code || "UNNAMED_TEMPLATE";
    const eventLabelByCode: Record<string, string> = {
      ACCOUNT_TIER_BALANCE_THRESHOLD: "Account Tier Balance Threshold",
      MATURITY_30_DAY_NOTICE: "30 Days To Maturity",
      MATURITY_DAY_OF_FOLLOW_UP: "Maturity Day Follow-up",
      CHILD_TURNS_18: "Child Turns 18",
      MIGRATION_UPGRADE: "Account Tier Balance Threshold",
      PASSPORT_EXPIRY_NOTICE: "Passport Expiry",
      DRIVERS_LICENSE_EXPIRY_NOTICE: "Driver's License Expiry",
    };
    const waveByCode: Partial<Record<string, WaveStage>> = {
      ACCOUNT_TIER_BALANCE_THRESHOLD: "Wave 1",
      MATURITY_30_DAY_NOTICE: "Wave 2",
      MATURITY_DAY_OF_FOLLOW_UP: "Final Wave",
      CHILD_TURNS_18: "Final Wave",
      MIGRATION_UPGRADE: "Wave 1",
    };
    const eventType = eventLabelByCode[safeCode] || safeCode
      .split("_")
      .slice(-2)
      .join(" ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return {
      id: String(item.template_id),
      templateCode: safeCode,
      name: safeCode.replace(/_/g, " "),
      templateCategory: "Recommendation Category",
      product: "General",
      eventCategory: eventType || "General Event",
      waveStage: waveByCode[safeCode] || "Wave 1",
      channel: "Email",
      subject: item.subject_template,
      headerImage: item.header_image ?? "",
      body: item.body_template,
      templateFooter: item.template_footer ?? "",
      footerImage: item.footer_image ?? "",
      footerTextAbove: item.footer_text_above ?? "",
      footerTextBelow: item.footer_text_below ?? "",
      videoThumbnail: item.video_thumbnail ?? "",
      gifThumbnail: item.gif_thumbnail ?? "",
      status: item.active === 0 ? "Draft" : "Active",
      updated: item.created_at ? new Date(item.created_at).toLocaleDateString() : "From API",
    };
  });
}

function toTemplateCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

const TEMPLATE_CODE_BY_JOB_EVENT: Record<string, Record<string, string>> = {
  "existing-life-updates": {
    "salary increase": "SALARY_INCREASE",
    "school fees": "SCHOOL_FEES",
    "passport expiry": "PASSPORT_EXPIRY_NOTICE",
    "driver's license expiry": "DRIVERS_LICENSE_EXPIRY_NOTICE",
    "drivers license expiry": "DRIVERS_LICENSE_EXPIRY_NOTICE",
    "loan": "LOAN_REPAYMENT",
    "new job": "SALARY_INCREASE",
    "wedding": "SALARY_INCREASE",
    "child birth": "CHILD_TURNS_18",
  },
  "existing-migration": {
    "account tier balance threshold": "ACCOUNT_TIER_BALANCE_THRESHOLD",
    "30 days to maturity": "MATURITY_30_DAY_NOTICE",
    "maturity day follow-up": "MATURITY_DAY_OF_FOLLOW_UP",
    "child turns 18": "CHILD_TURNS_18",
  },
};

function resolveTemplateCode(jobKey: string, draft: TemplateDraft, fallbackName: string): string | null {
  const normalizedEvent = draft.eventCategory.trim().toLowerCase();
  const mapped = TEMPLATE_CODE_BY_JOB_EVENT[jobKey]?.[normalizedEvent];
  if (mapped) {
    return mapped;
  }
  if (jobKey === "existing-life-updates" || jobKey === "existing-migration") {
    return null;
  }
  return toTemplateCode(fallbackName || draft.name);
}

const TEMPLATE_CODES_BY_MODULE: Record<string, Set<string>> = {
  "existing-life-updates": new Set([
    "SALARY_INCREASE",
    "SCHOOL_FEES",
    "FX_ACTIVITY",
    "RENT_PAYMENT",
    "LOAN_REPAYMENT",
    "CHILD_TURNS_18",
  ]),
  "existing-migration": new Set(["MIGRATION_UPGRADE", "ACCOUNT_TIER_BALANCE_THRESHOLD", "MATURITY_30_DAY_NOTICE", "MATURITY_DAY_OF_FOLLOW_UP", "CHILD_TURNS_18"]),
  "inactive-transaction": new Set(["REACTIVATION_PROMPT", "DORMANCY_SAVE"]),
  "inactive-onebank": new Set(["APP_RETURN", "FEATURE_SPOTLIGHT"]),
};

function inferModuleFromTemplateCode(templateCode?: string): string | null {
  if (!templateCode) return null;
  const code = templateCode.trim().toUpperCase();
  const moduleMatch = Object.entries(TEMPLATE_CODES_BY_MODULE).find(([, codes]) => codes.has(code));
  return moduleMatch ? moduleMatch[0] : null;
}

const MODULE_EVENT_ROWS: Record<string, Array<{ time: string; customer: string; event: string; status: string }>> = {
  "existing-life-updates": [
    { time: "21:34", customer: "CUS-00491", event: "Birthday Credit", status: "Running" },
    { time: "21:19", customer: "CUS-00519", event: "Salary Credit", status: "Queued" },
    { time: "20:57", customer: "CUS-00602", event: "Quiet Window", status: "Suppressed" },
  ],
  "existing-migration": [
    { time: "21:31", customer: "CUS-00388", event: "Account Tier Balance Threshold", status: "Running" },
    { time: "21:12", customer: "CUS-00577", event: "KYC Cleared", status: "Queued" },
    { time: "20:49", customer: "CUS-00231", event: "Rule Conflict", status: "Escalated" },
  ],
  "inactive-transaction": [
    { time: "21:28", customer: "CUS-01122", event: "90d inactivity", status: "Running" },
    { time: "20:58", customer: "CUS-01301", event: "Re-engagement Sent", status: "Delivered" },
    { time: "20:11", customer: "CUS-01445", event: "Debit Card Usage", status: "Recovered" },
  ],
  "inactive-onebank": [
    { time: "21:22", customer: "CUS-00774", event: "Push Timeout", status: "Failed" },
    { time: "20:44", customer: "CUS-00819", event: "Feature Nudge", status: "Delivered" },
    { time: "19:58", customer: "CUS-00971", event: "Login Success", status: "Recovered" },
  ],
};

const AUDIT_LOG_ROWS: AuditLogRow[] = [
  { time: "19 Mar 21:34", actor: "System", action: "Auto Trigger", module: "Life Updates", details: "Triggered birthday workflow", result: "Success" },
  { time: "19 Mar 21:23", actor: "jsmith", action: "Manual Trigger", module: "Transaction Inactive", details: "Triggered reactivation batch", result: "Pending" },
  { time: "19 Mar 20:41", actor: "ops.admin", action: "Update Threshold", module: "Onebank Inactive", details: "Changed login threshold to 60 days", result: "Success" },
  { time: "19 Mar 20:09", actor: "growth.lead", action: "Edit Template", module: "Lifecycle Triggers", details: "Updated upgrade invitation subject", result: "Success" },
];

const USER_ROWS: UserRow[] = [
  { name: "Jane Smith", role: "Operations Admin", team: "Operations", status: "Active", lastSeen: "Today 21:11" },
  { name: "Kunle Ade", role: "Growth Lead", team: "Retail Growth", status: "Active", lastSeen: "Today 20:45" },
  { name: "Favour Obi", role: "Retention Analyst", team: "Retention", status: "Active", lastSeen: "Today 19:08" },
  { name: "Tolu Ahmed", role: "Support Reviewer", team: "Support", status: "Suspended", lastSeen: "18 Mar 17:30" },
];

const EMPTY_OTP_VALUES = ["", "", "", "", "", ""];
const DEMO_OTP_CODE = "123456";

const RICH_EMOJIS = [
  "😊","👋","🎉","💡","✅","🏆","📱","💰","🌟","🎁",
  "📞","💳","🔔","📧","🎯","💬","🏦","💵","🎊","🙌",
  "👍","❤️","🚀","📈","🔑","💎","🤝","📋","⭐","🎓",
  "🙏","😃","💼","🏅","🎀","📌","🌈","✨","🔥","💯",
];

function RichBodyEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);
  const lastExternal = useRef(value);
  const savedRange = useRef<Range | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [fontSize, setFontSize] = useState("16px");

  // Seed content on mount only
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
      lastExternal.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. switching to edit mode) while not focused
  useEffect(() => {
    if (!isFocused.current && editorRef.current && value !== lastExternal.current) {
      editorRef.current.innerHTML = value;
      lastExternal.current = value;
    }
  }, [value]);

  function syncOut() {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastExternal.current = html;
      onChange(html);
    }
  }

  function exec(cmd: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg ?? undefined);
    syncOut();
  }

  function saveRange() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  }

  function restoreRange() {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }

  function insertEmoji(emoji: string) {
    editorRef.current?.focus();
    restoreRange();
    document.execCommand("insertText", false, emoji);
    syncOut();
    setShowEmoji(false);
  }

  function insertFontSize(size: string) {
    editorRef.current?.focus();
    document.execCommand("fontSize", false, "7");
    const fontEls = editorRef.current?.querySelectorAll("font[size='7']");
    fontEls?.forEach((el) => {
      const span = document.createElement("span");
      span.style.fontSize = size;
      span.innerHTML = el.innerHTML;
      el.replaceWith(span);
    });
    syncOut();
  }

  function applyCase(mode: "uppercase" | "lowercase") {
    restoreRange();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const text = sel.toString();
    document.execCommand("insertText", false, mode === "uppercase" ? text.toUpperCase() : text.toLowerCase());
    syncOut();
  }

  function insertLink() {
    const safeUrl = normalizeLinkUrl(linkUrl);
    if (!safeUrl) return;
    editorRef.current?.focus();
    restoreRange();
    const display = linkText.trim() || safeUrl;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const anchor = document.createElement("a");
      anchor.href = safeUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = display;
      range.insertNode(anchor);
      range.setStartAfter(anchor);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      document.execCommand("insertHTML", false, `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${display}</a>`);
    }
    syncOut();
    setLinkUrl("");
    setLinkText("");
    setShowLink(false);
  }

  return (
    <div className="cc-rich-editor">
      <div className="cc-rich-toolbar" role="toolbar" aria-label="Text formatting">
        <button type="button" className="cc-rtb-btn" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} title="Bold"><strong>B</strong></button>
        <button type="button" className="cc-rtb-btn cc-rtb-italic" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} title="Italic"><em>I</em></button>
        <button type="button" className="cc-rtb-btn cc-rtb-underline" onMouseDown={(e) => { e.preventDefault(); exec("underline"); }} title="Underline"><u>U</u></button>
        <span className="cc-rtb-sep" />
        <button type="button" className="cc-rtb-btn" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "h2"); }} title="Heading 1">H1</button>
        <button type="button" className="cc-rtb-btn" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "h3"); }} title="Heading 2">H2</button>
        <button type="button" className="cc-rtb-btn" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "p"); }} title="Normal text">¶</button>
        <span className="cc-rtb-sep" />
        <button type="button" className="cc-rtb-btn" onMouseDown={(e) => { e.preventDefault(); exec("justifyLeft"); }} title="Align left">Left</button>
        <button type="button" className="cc-rtb-btn" onMouseDown={(e) => { e.preventDefault(); exec("justifyCenter"); }} title="Align centre">Center</button>
        <button type="button" className="cc-rtb-btn" onMouseDown={(e) => { e.preventDefault(); exec("justifyRight"); }} title="Align right">Right</button>
        <button type="button" className="cc-rtb-btn" onMouseDown={(e) => { e.preventDefault(); exec("justifyFull"); }} title="Justify">Justify</button>
        <span className="cc-rtb-sep" />
        <select
          className="cc-rtb-select"
          value={fontSize}
          title="Font size"
          onMouseDown={(e) => { e.stopPropagation(); }}
          onChange={(e) => { setFontSize(e.target.value); editorRef.current?.focus(); insertFontSize(e.target.value); }}
        >
          {["10px","12px","14px","16px","18px","20px","24px","28px","32px","36px"].map((s) => (
            <option key={s} value={s}>{s.replace("px","pt")}</option>
          ))}
        </select>
        <span className="cc-rtb-sep" />
        <button type="button" className="cc-rtb-btn" onMouseDown={(e) => { e.preventDefault(); applyCase("uppercase"); }} title="UPPERCASE">AA</button>
        <button type="button" className="cc-rtb-btn" onMouseDown={(e) => { e.preventDefault(); applyCase("lowercase"); }} title="lowercase">aa</button>
        <span className="cc-rtb-sep" />
        <div className="cc-rtb-popup-wrap">
          <button type="button" className="cc-rtb-btn" title="Insert emoji" onMouseDown={(e) => { e.preventDefault(); saveRange(); setShowEmoji((v) => !v); setShowLink(false); }}>😊</button>
          {showEmoji && (
            <div className="cc-emoji-picker">
              {RICH_EMOJIS.map((em) => (
                <button key={em} type="button" onMouseDown={(e) => { e.preventDefault(); insertEmoji(em); }}>{em}</button>
              ))}
            </div>
          )}
        </div>
        <div className="cc-rtb-popup-wrap">
          <button type="button" className="cc-rtb-btn" title="Insert hyperlink" onMouseDown={(e) => { e.preventDefault(); saveRange(); setShowLink((v) => !v); setShowEmoji(false); }}>🔗</button>
          {showLink && (
            <div className="cc-link-dialog">
              <input autoFocus placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } }} />
              <input placeholder="Display text (optional)" value={linkText} onChange={(e) => setLinkText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } }} />
              <div className="cc-link-dialog-actions">
                <button type="button" className="cc-btn-primary" onMouseDown={(e) => { e.preventDefault(); insertLink(); }}>Insert link</button>
                <button type="button" className="cc-btn-soft" onMouseDown={(e) => { e.preventDefault(); setShowLink(false); }}>✕</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="cc-rich-content"
        onMouseUp={saveRange}
        onKeyUp={saveRange}
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => { isFocused.current = false; syncOut(); }}
        onInput={syncOut}
      />
    </div>
  );
}

export default function Home() {
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [authStep, setAuthStep] = useState<AuthStep>("credentials");
  const [otpValues, setOtpValues] = useState(EMPTY_OTP_VALUES);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [customerScope, setCustomerScope] = useState<CustomerScope>("all");
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [manualMessage, setManualMessage] = useState<string>("");
  const [reportFilterMode, setReportFilterMode] = useState<ReportFilterMode>("date");
  const [reportMonth, setReportMonth] = useState<string>("2026-03");
  const [reportStartDate, setReportStartDate] = useState<string>("2026-03-01");
  const [reportEndDate, setReportEndDate] = useState<string>("2026-03-19");
  const [reportModuleFilter, setReportModuleFilter] = useState<string>("All Modules");
  const [reportSubModuleFilter, setReportSubModuleFilter] = useState<string>("All Sub Modules");
  const [templatesByJob, setTemplatesByJob] = useState<Record<string, TemplateRow[]>>(INITIAL_TEMPLATES);
  const [templateDrafts, setTemplateDrafts] = useState<Record<string, TemplateDraft>>(INITIAL_TEMPLATE_DRAFTS);
  const [editingTemplateByJob, setEditingTemplateByJob] = useState<Record<string, string | null>>({
    "existing-life-updates": null,
    "existing-migration": null,
    "inactive-transaction": null,
    "inactive-onebank": null,
  });
  const [templateComposerOpenByJob, setTemplateComposerOpenByJob] = useState<Record<string, boolean>>({
    "existing-life-updates": false,
    "existing-migration": false,
    "inactive-transaction": false,
    "inactive-onebank": false,
  });
  const [openTemplateActionMenuByJob, setOpenTemplateActionMenuByJob] = useState<Record<string, string | null>>({
    "existing-life-updates": null,
    "existing-migration": null,
    "inactive-transaction": null,
    "inactive-onebank": null,
  });
  const [viewingTemplate, setViewingTemplate] = useState<TemplateRow | null>(null);
  const [globalSignature, setGlobalSignature] = useState<string>("Warm regards,\nThe Sterling Team");
  const [globalFooter, setGlobalFooter] = useState<string>("Sterling Bank Limited · Sterling Towers, 20 Marina, Lagos · RC 6253");
  const [txCustomerOptions, setTxCustomerOptions] = useState<CustomerOption[]>([]);
  const [txForm, setTxForm] = useState<TxForm>({
    accountNumber: "",
    eventType: "salary_increase",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [txLoading, setTxLoading] = useState(false);
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [txSeedLoading, setTxSeedLoading] = useState(false);
  const [txSeedResult, setTxSeedResult] = useState<TxSeedResult | null>(null);
  const [bulkCampaignRows, setBulkCampaignRows] = useState<BulkCampaignRow[]>([]);
  const [bulkCampaignUploadError, setBulkCampaignUploadError] = useState<string>("");
  const [bulkCampaignUploadNote, setBulkCampaignUploadNote] = useState<string>("");
  const [bulkCampaignTriggering, setBulkCampaignTriggering] = useState(false);
  const [manualStartDate, setManualStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [manualEndDate, setManualEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [manualCustomerId, setManualCustomerId] = useState<string>("");
  const [manualAccountNumber, setManualAccountNumber] = useState<string>("");
  const [manualModuleKey, setManualModuleKey] = useState<string>("existing-life-updates");
  const [manualTriggerSignal, setManualTriggerSignal] = useState<string>("salary_increase");
  const [manualAmount, setManualAmount] = useState<string>("320000");
  const [manualSubmitting, setManualSubmitting] = useState<boolean>(false);
  const [moduleWavePlans, setModuleWavePlans] = useState<Record<string, ModuleWavePlan>>(MODULE_WAVE_PLAN_DEFAULTS);
  const [migrationTriggerPlan, setMigrationTriggerPlan] = useState<MigrationTriggerPlan>(MIGRATION_TRIGGER_PLAN_DEFAULTS);

  const manualSignalOptionsByModule: Record<string, Array<{ value: string; label: string }>> = {
    "existing-life-updates": LIFE_EVENT_TRIGGER_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
    "existing-migration": [
      { value: "account_tier_balance_threshold", label: "Account Tier Balance Threshold" },
      { value: "child_turns_18", label: "Child Turns 18" },
      { value: "investment_maturity", label: "Investment Maturity" },
      { value: "both", label: "Combined Signals" },
    ],
    "inactive-transaction": [
      { value: "reactivation", label: "Reactivation" },
    ],
    "inactive-onebank": [
      { value: "app_return", label: "App Return" },
    ],
  };

  async function fetchBackendTemplateRows(): Promise<TemplateRow[] | null> {
    try {
      const response = await fetch(V2_ENDPOINTS.emailTemplates, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as { templates?: BackendTemplateListItem[] };
      return mapBackendTemplatesToRows(Array.isArray(payload.templates) ? payload.templates : []);
    } catch {
      return null;
    }
  }

  function applyBackendTemplatesByModule(rows: TemplateRow[]) {
    const grouped: Record<string, TemplateRow[]> = {
      "existing-life-updates": [],
      "existing-migration": [],
      "inactive-transaction": [],
      "inactive-onebank": [],
    };

    rows.forEach((row) => {
      const moduleKey = inferModuleFromTemplateCode(row.templateCode);
      if (moduleKey) {
        grouped[moduleKey].push(row);
      }
    });

    setTemplatesByJob((prev) => {
      const mergeModuleRows = (moduleKey: string): TemplateRow[] => {
        const incoming = grouped[moduleKey];
        if (incoming.length === 0) return prev[moduleKey];
        const current = prev[moduleKey] ?? [];
        return incoming.map((row) => {
          const existing = current.find((item) => item.templateCode === row.templateCode || item.id === row.id);
          return existing
            ? {
                ...row,
                headerImage: existing.headerImage,
                footerImage: existing.footerImage,
                footerTextAbove: existing.footerTextAbove,
                footerTextBelow: existing.footerTextBelow,
                videoThumbnail: existing.videoThumbnail,
                gifThumbnail: existing.gifThumbnail,
              }
            : row;
        });
      };

      return {
        ...prev,
        "existing-life-updates": mergeModuleRows("existing-life-updates"),
        "existing-migration": mergeModuleRows("existing-migration"),
        "inactive-transaction": mergeModuleRows("inactive-transaction"),
        "inactive-onebank": mergeModuleRows("inactive-onebank"),
      };
    });
  }

  async function syncWorkflowJobsFromBackend() {
    try {
      const response = await fetch(V2_ENDPOINTS.workflowJobs, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { jobs?: BackendWorkflowJob[] };
      const backendJobs = Array.isArray(payload.jobs) ? payload.jobs : [];
      if (!backendJobs.length) {
        return;
      }

      setJobs((prev) =>
        prev.map((job) => {
          const backend = backendJobs.find((item) => item.key === job.key);
          if (!backend) {
            return job;
          }

          return {
            ...job,
            enabled: backend.enabled,
            lastRun: formatJobTime(backend.last_run_at),
            nextRun: backend.enabled ? formatJobTime(backend.next_run_at) : "-",
          };
        }),
      );
    } catch {
      // Keep existing local workflow state if backend is unavailable.
    }
  }

  async function loadTxCustomers(): Promise<void> {
    try {
      const res = await fetch(V2_ENDPOINTS.customers, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        customers: Array<{ customer_id: number; name: string; account_number: string }>;
      };
      const options = (Array.isArray(data.customers) ? data.customers : []).map((c) => ({
        customerId: c.customer_id,
        name: c.name,
        accountNumber: c.account_number ?? "",
      }));
      setTxCustomerOptions(options);
      if (options.length > 0 && !txForm.accountNumber) {
        setTxForm((prev) => ({ ...prev, accountNumber: options[0].accountNumber }));
      }
    } catch {
      // Backend unavailable — customer dropdown stays empty
    }
  }

  async function processTransaction(): Promise<void> {
    const selectedEvent = LIFE_EVENT_TRIGGER_OPTIONS.find((item) => item.value === txForm.eventType);
    if (!txForm.accountNumber || !selectedEvent || !txForm.amount) return;
    setTxLoading(true);
    setTxResult(null);
    try {
      const res = await fetch(V2_ENDPOINTS.processTransaction, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          account_number: txForm.accountNumber,
          narration: selectedEvent.narration,
          amount: parseFloat(txForm.amount),
          transaction_date: txForm.date,
          trigger_email: true,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { detail?: string };
        setTxResult({ lifeEvent: "", eventDetected: false, product: null, emailStatus: null, error: err.detail ?? "Request failed" });
        return;
      }
      const KNOWN_EVENTS = new Set(["salary_increase", "school_fees", "fx_transfer", "loan_repayment", "rent_payment", "child_turns_18", "migration_upgrade", "account_tier_balance_threshold", "investment_maturity"]);
      const data = (await res.json()) as {
        life_event?: string | { detected?: boolean; event_type?: string; reason?: string };
        recommendation_result?: { recommended?: boolean; event_type?: string; product?: string; email?: { status?: string } };
      };
      const recommendationEvent = (data.recommendation_result?.event_type ?? "").trim().toLowerCase();
      let lifeEvent = "unknown";
      let eventDetected = false;

      if (typeof data.life_event === "string") {
        lifeEvent = data.life_event.trim().toLowerCase() || "unknown";
        eventDetected = KNOWN_EVENTS.has(lifeEvent);
      } else if (data.life_event && typeof data.life_event === "object") {
        const nestedEvent = (data.life_event.event_type ?? "").trim().toLowerCase();
        lifeEvent = nestedEvent || "unknown";
        eventDetected = Boolean(data.life_event.detected) || KNOWN_EVENTS.has(nestedEvent);
      }

      if (!eventDetected && data.recommendation_result?.recommended) {
        eventDetected = true;
        if (lifeEvent === "unknown" && KNOWN_EVENTS.has(recommendationEvent)) {
          lifeEvent = recommendationEvent;
        }
      }

      const rec = data.recommendation_result;
      setTxResult({
        lifeEvent,
        eventDetected,
        product: rec?.product ?? null,
        emailStatus: rec?.email?.status ?? null,
        error: null,
      });
    } catch {
      setTxResult({ lifeEvent: "", eventDetected: false, product: null, emailStatus: null, error: "Network error — backend may be offline" });
    } finally {
      setTxLoading(false);
    }
  }

  async function seedLifeEventHistory(): Promise<void> {
    setTxSeedLoading(true);
    setTxSeedResult(null);
    try {
      const res = await fetch(V2_ENDPOINTS.seedLifeEventHistory, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ months: 6, force: false }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { detail?: string };
        setTxSeedResult({
          seededTransactions: 0,
          skippedAccounts: [],
          error: err.detail ?? "Failed to seed demo history",
        });
        return;
      }

      const data = (await res.json()) as {
        seeded_transactions?: number;
        skipped_accounts?: string[];
      };

      setTxSeedResult({
        seededTransactions: Number(data.seeded_transactions ?? 0),
        skippedAccounts: Array.isArray(data.skipped_accounts) ? data.skipped_accounts : [],
        error: null,
      });

      await loadTxCustomers();
    } catch {
      setTxSeedResult({
        seededTransactions: 0,
        skippedAccounts: [],
        error: "Network error while seeding demo history",
      });
    } finally {
      setTxSeedLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadBackendTemplates() {
      const mapped = await fetchBackendTemplateRows();
      if (!mapped || cancelled) {
        return;
      }

      applyBackendTemplatesByModule(mapped);
    }

    loadBackendTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void syncWorkflowJobsFromBackend();
  }, []);

  useEffect(() => {
    if (!ENABLE_MANUAL_TRIGGER_PANEL) {
      return;
    }
    void loadTxCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleJobs = useMemo(() => {
    if (customerScope === "existing") {
      return jobs.filter((job) => job.key.startsWith("existing-"));
    }
    if (customerScope === "inactive") {
      return jobs.filter((job) => job.key.startsWith("inactive-"));
    }
    return jobs;
  }, [jobs, customerScope]);

  const filteredReportRows = useMemo(() => {
    const withinRange = WORKFLOW_LOG_ROWS.filter((row) => row.date >= reportStartDate && row.date <= reportEndDate);
    const monthFiltered = reportFilterMode === "month" ? withinRange.filter((row) => row.date.startsWith(reportMonth)) : withinRange;
    const moduleFiltered =
      reportModuleFilter === "All Modules" ? monthFiltered : monthFiltered.filter((row) => row.module === reportModuleFilter);

    return reportSubModuleFilter === "All Sub Modules"
      ? moduleFiltered
      : moduleFiltered.filter((row) => row.subModule === reportSubModuleFilter);
  }, [reportEndDate, reportFilterMode, reportModuleFilter, reportMonth, reportStartDate, reportSubModuleFilter]);

  const reportTotals = useMemo(
    () =>
      filteredReportRows.reduce(
        (acc, row) => {
          acc.totalSent += Number(row.totalSent);
          acc.failed += Number(row.failed);
          acc.success += Number(row.success);
          acc.pending += Number(row.pending);
          acc.manualTrigger += Number(row.manualTrigger);
          return acc;
        },
        { totalSent: 0, failed: 0, success: 0, pending: 0, manualTrigger: 0 },
      ),
    [filteredReportRows],
  );

  const isAgentOnline = jobs.some((job) => job.enabled);

  async function toggleJob(key: string) {
    const current = jobs.find((job) => job.key === key);
    if (!current) {
      return;
    }

    const nextEnabled = !current.enabled;

    try {
      const response = await fetch(V2_ENDPOINTS.workflowJobByKey(key), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ enabled: nextEnabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update workflow state");
      }

      const updatedJob = ((await response.json()) as { job?: BackendWorkflowJob }).job;
      setJobs((prev) =>
        prev.map((job) =>
          job.key === key
            ? {
                ...job,
                enabled: nextEnabled,
                lastRun: updatedJob ? formatJobTime(updatedJob.last_run_at) : job.lastRun,
                nextRun: updatedJob
                  ? (nextEnabled ? formatJobTime(updatedJob.next_run_at) : "-")
                  : (nextEnabled ? job.nextRun : "-"),
              }
            : job,
        ),
      );
      setManualMessage(`${current.name} workflow ${nextEnabled ? "enabled" : "disabled"} successfully.`);
      window.setTimeout(() => setManualMessage(""), 3000);
    } catch {
      setManualMessage("Unable to update workflow state in backend right now.");
      window.setTimeout(() => setManualMessage(""), 3000);
    }
  }

  async function triggerJobNow(key: string) {
    const job = jobs.find((item) => item.key === key);
    try {
      const response = await fetch(V2_ENDPOINTS.workflowJobTrigger(key), {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const data = (await response.json()) as { job?: BackendWorkflowJob };
        setJobs((prev) =>
          prev.map((j) =>
            j.key === key
              ? {
                  ...j,
                  lastRun: data.job ? formatJobTime(data.job.last_run_at) : "just now",
                  nextRun: data.job
                    ? (j.enabled ? formatJobTime(data.job.next_run_at) : "-")
                    : (j.enabled ? j.nextRun : "-"),
                }
              : j,
          ),
        );
      }
    } catch {
      // Fallback to local update if backend unavailable
      setJobs((prev) =>
        prev.map((j) =>
          j.key === key
            ? { ...j, lastRun: "just now", nextRun: j.enabled ? "in 5m" : "-" }
            : j,
        ),
      );
    }
    if (job) {
      setManualMessage(`${job.name} triggered successfully.`);
      window.setTimeout(() => setManualMessage(""), 4000);
    }
  }

  async function submitManualTrigger() {
    if (!manualStartDate || !manualEndDate) {
      setManualMessage("Please set both start date and end date before triggering.");
      window.setTimeout(() => setManualMessage(""), 4000);
      return;
    }

    if (new Date(manualEndDate) < new Date(manualStartDate)) {
      setManualMessage("End date cannot be earlier than start date.");
      window.setTimeout(() => setManualMessage(""), 4000);
      return;
    }

    setManualSubmitting(true);
    try {
      if (manualModuleKey === "existing-life-updates") {
        const selectedEvent = LIFE_EVENT_TRIGGER_OPTIONS.find((item) => item.value === manualTriggerSignal) ?? LIFE_EVENT_TRIGGER_OPTIONS[0];
        const response = await fetch(V2_ENDPOINTS.processTransaction, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            account_number: manualAccountNumber,
            narration: selectedEvent.narration,
            amount: Number(manualAmount || selectedEvent.defaultAmount),
            transaction_date: manualStartDate,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to trigger life updates workflow");
        }

        setManualMessage(`Life Updates triggered with signal ${selectedEvent.label}.`);
      } else if (manualModuleKey === "existing-migration") {
        const response = await fetch(V2_ENDPOINTS.lifecycleTriggersExecute, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            scenario: manualTriggerSignal || "both",
            customer_id: manualCustomerId ? Number(manualCustomerId) : undefined,
            account_number: manualAccountNumber || undefined,
            amount: Number(manualAmount || "350000"),
            maturity_date: manualEndDate,
            auto_trigger_window_days: 30,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to trigger lifecycle trigger workflow");
        }

        setManualMessage("Lifecycle Triggers workflow triggered successfully.");
      } else {
        const response = await fetch(V2_ENDPOINTS.workflowJobTrigger(manualModuleKey), {
          method: "POST",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("Failed to trigger workflow job");
        }

        const jobName = manualModuleKey === "inactive-transaction" ? "Transaction Inactive" : "Onebank Inactive";
        setManualMessage(`${jobName} workflow triggered successfully.`);
      }
    } catch {
      setManualMessage("Trigger failed. Please confirm required values and backend availability.");
    } finally {
      setManualSubmitting(false);
      window.setTimeout(() => setManualMessage(""), 4500);
    }
  }

  function onBulkCampaignFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setBulkCampaignUploadError("");
    setBulkCampaignUploadNote("");

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      const parsed = parseBulkCampaignCsv(content);
      setBulkCampaignRows(parsed.rows);

      if (parsed.errors.length > 0) {
        setBulkCampaignUploadError(parsed.errors.join(" "));
      } else {
        setBulkCampaignUploadNote(
          `Loaded ${parsed.rows.length} request${parsed.rows.length === 1 ? "" : "s"}. Ready for backend bulk run.`,
        );
      }
    };

    reader.onerror = () => {
      setBulkCampaignUploadError("Unable to read file. Please upload a valid CSV template.");
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  async function triggerBulkCampaignWorkflow() {
    if (bulkCampaignRows.length === 0) {
      setBulkCampaignUploadError("Upload a populated CSV before triggering workflow.");
      return;
    }

    setBulkCampaignTriggering(true);
    setBulkCampaignUploadError("");
    setBulkCampaignUploadNote("");

    try {
      const response = await fetch(V2_ENDPOINTS.bulkCampaignTrigger, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ requests: bulkCampaignRows }),
      });

      if (!response.ok) {
        throw new Error("Unable to trigger bulk workflow");
      }

      const payload = (await response.json()) as {
        queued?: number;
        skipped?: number;
        run_id?: string;
      };
      setBulkCampaignUploadNote(
        `Workflow triggered. Queued: ${payload.queued ?? bulkCampaignRows.length}, Skipped: ${payload.skipped ?? 0}, Run ID: ${payload.run_id ?? "N/A"}.`,
      );
    } catch {
      setBulkCampaignUploadError("Bulk workflow trigger failed. Confirm backend is running and try again.");
    } finally {
      setBulkCampaignTriggering(false);
    }
  }

  function updateOtp(index: number, value: string) {
    const cleaned = value.replace(/[^0-9]/g, "").slice(0, 1);
    setOtpValues((prev) => prev.map((item, i) => (i === index ? cleaned : item)));
  }

  function focusOtp(index: number) {
    const input = otpInputRefs.current[index];
    if (!input) {
      return;
    }

    input.focus();
    input.select();
  }

  function fillOtpFrom(index: number, digits: string) {
    if (!digits) {
      return;
    }

    setOtpValues((prev) => {
      const next = [...prev];
      let cursor = index;
      for (const digit of digits) {
        if (cursor >= next.length) {
          break;
        }
        next[cursor] = digit;
        cursor += 1;
      }
      return next;
    });

    const lastFilled = Math.min(index + digits.length - 1, EMPTY_OTP_VALUES.length - 1);
    const nextFocus = Math.min(lastFilled + 1, EMPTY_OTP_VALUES.length - 1);
    focusOtp(nextFocus);
  }

  function handleOtpInputChange(index: number, rawValue: string) {
    const digits = rawValue.replace(/[^0-9]/g, "");
    if (!digits) {
      updateOtp(index, "");
      return;
    }

    fillOtpFrom(index, digits);
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      event.preventDefault();
      updateOtp(index - 1, "");
      focusOtp(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusOtp(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < EMPTY_OTP_VALUES.length - 1) {
      event.preventDefault();
      focusOtp(index + 1);
    }
  }

  function handleOtpPaste(index: number, event: React.ClipboardEvent<HTMLInputElement>) {
    const pastedDigits = event.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!pastedDigits) {
      return;
    }

    event.preventDefault();
    fillOtpFrom(index, pastedDigits);
  }

  function handleCredentialsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError("Enter your username and password to continue.");
      return;
    }

    setAuthError("");
    setOtpValues(EMPTY_OTP_VALUES);
    setAuthStep("otp");
  }

  function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const enteredOtp = otpValues.join("");
    if (enteredOtp.length !== DEMO_OTP_CODE.length) {
      setAuthError("Enter the full 6-digit OTP code.");
      return;
    }
    if (enteredOtp !== DEMO_OTP_CODE) {
      setAuthError("The OTP code is invalid. Please try again.");
      return;
    }

    setAuthError("");
    setAuthStep("app");
  }

  function returnToCredentials() {
    setAuthError("");
    setOtpValues(EMPTY_OTP_VALUES);
    setAuthStep("credentials");
  }

  function signOut() {
    setAuthError("");
    setUsername("");
    setPassword("");
    setOtpValues(EMPTY_OTP_VALUES);
    setAuthStep("credentials");
  }

  useEffect(() => {
    if (authStep !== "otp") {
      return;
    }

    const firstEmptyIndex = otpValues.findIndex((value) => !value);
    focusOtp(firstEmptyIndex === -1 ? 0 : firstEmptyIndex);
  }, [authStep, otpValues]);

  function navigate(page: PageId) {
    setActivePage(page);
    if (page.startsWith("existing-")) {
      setCustomerScope("existing");
      return;
    }
    if (page.startsWith("inactive-")) {
      setCustomerScope("inactive");
      return;
    }
    setCustomerScope("all");
  }

  function applyCustomerScope(scope: CustomerScope) {
    setCustomerScope(scope);
    if (scope === "existing") {
      setActivePage("existing-life-updates");
      return;
    }
    if (scope === "inactive") {
      setActivePage("inactive-transaction");
      return;
    }
    if (activePage.startsWith("existing-") || activePage.startsWith("inactive-")) {
      setActivePage("dashboard");
    }
  }

  function downloadCsv(fileName: string, headers: string[], rows: string[][]) {
    const escapeCsv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function downloadReportCsv() {
    downloadCsv(
      `ai-sales-reports-${reportFilterMode === "month" ? reportMonth : `${reportStartDate}-to-${reportEndDate}`}.csv`,
      ["Date", "Module", "Sub Module", "Total Sent", "Failed", "Success", "Pending", "Manual Trigger"],
      filteredReportRows.map((row) => [row.date, row.module, row.subModule, row.totalSent, row.failed, row.success, row.pending, row.manualTrigger]),
    );
  }

  async function createTemplate(jobKey: string) {
    const draft = templateDrafts[jobKey];
    const editingId = editingTemplateByJob[jobKey];

    if (!draft?.name.trim() || !draft.product.trim() || !draft.eventCategory.trim() || !draft.subject.trim() || !draft.body.trim()) {
      setManualMessage("Template name, product, event category, subject, and body are required.");
      window.setTimeout(() => setManualMessage(""), 3500);
      return;
    }

    if (editingId) {
      const currentTemplate = (templatesByJob[jobKey] ?? []).find((item) => item.id === editingId);
      const templateCode = resolveTemplateCode(jobKey, draft, currentTemplate?.templateCode ?? draft.name);
      if (!templateCode) {
        setManualMessage("Selected event category is not wired to a backend trigger code yet. Choose a supported event category.");
        window.setTimeout(() => setManualMessage(""), 3500);
        return;
      }

      try {
        const response = await fetch(V2_ENDPOINTS.emailTemplateByCode(templateCode), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            subject_template: draft.subject,
            body_template: draft.body,
            header_image: draft.headerImage,
            template_footer: draft.templateFooter,
            footer_image: draft.footerImage,
            footer_text_above: draft.footerTextAbove,
            footer_text_below: draft.footerTextBelow,
            video_thumbnail: draft.videoThumbnail,
            gif_thumbnail: draft.gifThumbnail,
            active: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update template");
        }
      } catch {
        setManualMessage("Unable to save to backend right now. Please try again.");
        window.setTimeout(() => setManualMessage(""), 3500);
        return;
      }

      setTemplatesByJob((prev) => ({
        ...prev,
        [jobKey]: (prev[jobKey] ?? []).map((item) =>
          item.id === editingId
            ? {
                ...item,
                templateCode,
                name: draft.name,
                templateCategory: draft.templateCategory,
                product: draft.product,
                eventCategory: draft.eventCategory,
                channel: draft.channel,
                subject: draft.subject,
                header: draft.header,
                headerImage: draft.headerImage,
                body: draft.body,
                templateFooter: draft.templateFooter,
                footerImage: draft.footerImage,
                footerTextAbove: draft.footerTextAbove,
                footerTextBelow: draft.footerTextBelow,
                videoThumbnail: draft.videoThumbnail,
                gifThumbnail: draft.gifThumbnail,
              }
            : item,
        ),
      }));
      if (viewingTemplate?.id === editingId) {
        setViewingTemplate((prev) =>
          prev
            ? {
                ...prev,
                name: draft.name,
                templateCategory: draft.templateCategory,
                product: draft.product,
                eventCategory: draft.eventCategory,
                waveStage: draft.waveStage,
                channel: draft.channel,
                subject: draft.subject,
                header: draft.header,
                headerImage: draft.headerImage,
                body: draft.body,
                templateFooter: draft.templateFooter,
                footerImage: draft.footerImage,
                footerTextAbove: draft.footerTextAbove,
                footerTextBelow: draft.footerTextBelow,
                videoThumbnail: draft.videoThumbnail,
                gifThumbnail: draft.gifThumbnail,
              }
            : prev,
        );
      }
      setEditingTemplateByJob((prev) => ({ ...prev, [jobKey]: null }));
      setTemplateComposerOpenByJob((prev) => ({ ...prev, [jobKey]: false }));
      setTemplateDrafts((prev) => ({ ...prev, [jobKey]: INITIAL_TEMPLATE_DRAFTS[jobKey] }));

      const refreshed = await fetchBackendTemplateRows();
      if (refreshed) {
        applyBackendTemplatesByModule(refreshed);
      }

      setManualMessage("Template updated successfully.");
      window.setTimeout(() => setManualMessage(""), 3500);
      return;
    }

    const templateCode = resolveTemplateCode(jobKey, draft, draft.name);
    if (!templateCode) {
      setManualMessage("Selected event category is not wired to a backend trigger code yet. Choose a supported event category.");
      window.setTimeout(() => setManualMessage(""), 3500);
      return;
    }
    if (!templateCode) {
      setManualMessage("Template name is required.");
      window.setTimeout(() => setManualMessage(""), 3500);
      return;
    }

    let createdTemplateId = `${jobKey}-${Date.now()}`;
    try {
      const response = await fetch(V2_ENDPOINTS.emailTemplates, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          template_code: templateCode,
          subject_template: draft.subject,
          body_template: draft.body,
          header_image: draft.headerImage,
          template_footer: draft.templateFooter,
          footer_image: draft.footerImage,
          footer_text_above: draft.footerTextAbove,
          footer_text_below: draft.footerTextBelow,
          video_thumbnail: draft.videoThumbnail,
          gif_thumbnail: draft.gifThumbnail,
          active: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create template");
      }

      const payload = (await response.json()) as BackendTemplateUpsertResponse;
      if (payload?.template?.template_id) {
        createdTemplateId = String(payload.template.template_id);
      }
    } catch {
      setManualMessage("Unable to create template in backend right now. Please try again.");
      window.setTimeout(() => setManualMessage(""), 3500);
      return;
    }

    setTemplatesByJob((prev) => ({
      ...prev,
      [jobKey]: [
        {
          id: createdTemplateId,
          templateCode,
          name: draft.name,
          templateCategory: draft.templateCategory,
          product: draft.product,
          eventCategory: draft.eventCategory,
          waveStage: draft.waveStage,
          channel: draft.channel,
          subject: draft.subject,
          header: draft.header,
          headerImage: draft.headerImage,
          body: draft.body,
          templateFooter: draft.templateFooter,
          footerImage: draft.footerImage,
          footerTextAbove: draft.footerTextAbove,
          footerTextBelow: draft.footerTextBelow,
          videoThumbnail: draft.videoThumbnail,
          gifThumbnail: draft.gifThumbnail,
          status: "Draft",
          updated: "Just now",
        },
        ...(prev[jobKey] ?? []),
      ],
    }));

    const refreshed = await fetchBackendTemplateRows();
    if (refreshed) {
      applyBackendTemplatesByModule(refreshed);
    }

    setTemplateComposerOpenByJob((prev) => ({ ...prev, [jobKey]: false }));
    setTemplateDrafts((prev) => ({ ...prev, [jobKey]: INITIAL_TEMPLATE_DRAFTS[jobKey] }));
    setManualMessage("Template created successfully.");
    window.setTimeout(() => setManualMessage(""), 3500);
  }

  function startTemplateCreate(jobKey: string) {
    setEditingTemplateByJob((prev) => ({ ...prev, [jobKey]: null }));
    setTemplateDrafts((prev) => ({ ...prev, [jobKey]: INITIAL_TEMPLATE_DRAFTS[jobKey] }));
    setTemplateComposerOpenByJob((prev) => ({ ...prev, [jobKey]: true }));
    setOpenTemplateActionMenuByJob((prev) => ({ ...prev, [jobKey]: null }));
  }

  async function viewTemplate(template: TemplateRow) {
    if (!template.templateCode) {
      setViewingTemplate(template);
      return;
    }

    try {
      const response = await fetch(V2_ENDPOINTS.emailTemplateByCode(template.templateCode), {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch template detail");
      }

      const detail = (await response.json()) as BackendTemplateDetail;
      setViewingTemplate({
        ...template,
        id: String(detail.template_id),
        templateCode: detail.template_code,
        name: detail.template_code.replace(/_/g, " "),
        subject: detail.subject_template,
        body: detail.body_template,
        headerImage: detail.header_image ?? template.headerImage,
        templateFooter: detail.template_footer ?? template.templateFooter,
        footerImage: detail.footer_image ?? template.footerImage,
        footerTextAbove: detail.footer_text_above ?? template.footerTextAbove,
        footerTextBelow: detail.footer_text_below ?? template.footerTextBelow,
        videoThumbnail: detail.video_thumbnail ?? template.videoThumbnail,
        gifThumbnail: detail.gif_thumbnail ?? template.gifThumbnail,
      });
    } catch {
      setViewingTemplate(template);
      setManualMessage("Showing cached template preview. Backend detail unavailable.");
      window.setTimeout(() => setManualMessage(""), 2500);
    }
  }

  function toggleTemplateActionMenu(jobKey: string, templateId: string) {
    setOpenTemplateActionMenuByJob((prev) => ({
      ...prev,
      [jobKey]: prev[jobKey] === templateId ? null : templateId,
    }));
  }

  function handleTemplateAction(jobKey: string, template: TemplateRow, action: "edit" | "view" | "delete") {
    setOpenTemplateActionMenuByJob((prev) => ({ ...prev, [jobKey]: null }));

    if (action === "edit") {
      editTemplate(jobKey, template.id);
      return;
    }

    if (action === "view") {
      void viewTemplate(template);
      return;
    }

    deleteTemplate(jobKey, template.id);
  }

  function updateTemplateDraft(jobKey: string, field: keyof TemplateDraft, value: string) {
    setTemplateDrafts((prev) => ({
      ...prev,
      [jobKey]: {
        ...(prev[jobKey] ?? INITIAL_TEMPLATE_DRAFTS[jobKey]),
        [field]: value,
      },
    }));
  }

  async function handleTemplateImageUpload(jobKey: string, field: keyof TemplateDraft, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const allowedTypes = ["image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setManualMessage("Only PNG or JPG images are supported for banners and thumbnails.");
      window.setTimeout(() => setManualMessage(""), 3500);
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateTemplateDraft(jobKey, field, dataUrl);
    } catch {
      setManualMessage("Unable to read image file. Please try another image.");
      window.setTimeout(() => setManualMessage(""), 3500);
    }
  }

  function updateModuleWavePlan(jobKey: string, field: keyof ModuleWavePlan, value: string | number) {
    setModuleWavePlans((prev) => {
      const current = prev[jobKey] ?? MODULE_WAVE_PLAN_DEFAULTS[jobKey];
      return {
        ...prev,
        [jobKey]: {
          ...current,
          [field]: value,
        } as ModuleWavePlan,
      };
    });
  }

  function updateMigrationTriggerPlan(field: keyof MigrationTriggerPlan, value: string | number) {
    setMigrationTriggerPlan((prev) => ({
      ...prev,
      [field]: value,
    }) as MigrationTriggerPlan);
  }

  function editTemplate(jobKey: string, templateId: string) {
    const current = (templatesByJob[jobKey] ?? []).find((item) => item.id === templateId);
    if (!current) {
      return;
    }
    setTemplateDrafts((prev) => ({
      ...prev,
      [jobKey]: {
        name: current.name,
        templateCategory: current.templateCategory,
        product: current.product,
        eventCategory: current.eventCategory,
        waveStage: current.waveStage,
        channel: current.channel,
        subject: current.subject,
        header: current.header ?? "",
        headerImage: current.headerImage ?? "",
        body: current.body,
        templateFooter: current.templateFooter ?? "",
        footerImage: current.footerImage ?? "",
        footerTextAbove: current.footerTextAbove ?? "",
        footerTextBelow: current.footerTextBelow ?? "",
        videoThumbnail: current.videoThumbnail ?? "",
        gifThumbnail: current.gifThumbnail ?? "",
      },
    }));
    setEditingTemplateByJob((prev) => ({ ...prev, [jobKey]: templateId }));
    setTemplateComposerOpenByJob((prev) => ({ ...prev, [jobKey]: true }));
    setManualMessage(`Editing ${current.name}. Update fields and click Save Template.`);
    window.setTimeout(() => setManualMessage(""), 3000);
  }

  function cancelTemplateEdit(jobKey: string) {
    setEditingTemplateByJob((prev) => ({ ...prev, [jobKey]: null }));
    setTemplateComposerOpenByJob((prev) => ({ ...prev, [jobKey]: false }));
    setOpenTemplateActionMenuByJob((prev) => ({ ...prev, [jobKey]: null }));
    setTemplateDrafts((prev) => ({ ...prev, [jobKey]: INITIAL_TEMPLATE_DRAFTS[jobKey] }));
  }

  async function deleteTemplate(jobKey: string, templateId: string) {
    const current = (templatesByJob[jobKey] ?? []).find((item) => item.id === templateId);
    if (!current) {
      return;
    }

    if (current.templateCode) {
      try {
        const response = await fetch(V2_ENDPOINTS.emailTemplateByCode(current.templateCode), {
          method: "DELETE",
          headers: { Accept: "application/json" },
        });

        if (!response.ok && response.status !== 404) {
          throw new Error("Failed to delete template");
        }
      } catch {
        setManualMessage("Unable to delete template from backend right now. Please try again.");
        window.setTimeout(() => setManualMessage(""), 3500);
        return;
      }
    }

    setTemplatesByJob((prev) => ({
      ...prev,
      [jobKey]: (prev[jobKey] ?? []).filter((item) => item.id !== templateId),
    }));

    const refreshed = await fetchBackendTemplateRows();
    if (refreshed) {
      applyBackendTemplatesByModule(refreshed);
    }

    if (editingTemplateByJob[jobKey] === templateId) {
      cancelTemplateEdit(jobKey);
    }

    if (viewingTemplate?.id === templateId) {
      setViewingTemplate(null);
    }

    setOpenTemplateActionMenuByJob((prev) => ({ ...prev, [jobKey]: null }));
    setManualMessage("Template deleted successfully.");
    window.setTimeout(() => setManualMessage(""), 2500);
  }

  function renderCustomerToggle() {
    return (
      <div className="cc-customer-toggle" role="tablist" aria-label="Customer category toggle">
        <button className={customerScope === "all" ? "active" : ""} onClick={() => applyCustomerScope("all")}>
          All
        </button>
        <button className={customerScope === "existing" ? "active" : ""} onClick={() => applyCustomerScope("existing")}>
          Existing
        </button>
        <button className={customerScope === "inactive" ? "active" : ""} onClick={() => applyCustomerScope("inactive")}>
          Inactive
        </button>
      </div>
    );
  }

  function renderDashboard() {
    return (
      <div className="cc-dashboard-stack">
        <section className="cc-banner cc-banner-plain cc-reveal">
          <div>
            <p className="cc-banner-kicker">Live overview</p>
            <h2 className="cc-banner-title">OneEngage Command Centre</h2>
            <p className="cc-banner-sub">Switch modules on or off and monitor live activity from one place.</p>
          </div>
        </section>

        <section className="cc-kpi-grid cc-reveal cc-delay-1">
          {[
            { label: "Active Workflows", value: "1,284", delta: "up", note: "+12% today" },
            { label: "Messages Delivered", value: "9,431", delta: "up", note: "+8.4% vs yesterday" },
            { label: "Accounts Processed", value: "3,672", delta: "flat", note: "steady" },
            { label: "Errors / Failures", value: "23", delta: "down", note: "3 unresolved" },
          ].map((item) => (
            <article key={item.label} className="cc-kpi-card cc-kpi-card-balanced">
              <p>{item.label}</p>
              <h3>{item.value}</h3>
              <span className={`cc-delta cc-delta-${item.delta}`}>{item.note}</span>
            </article>
          ))}
        </section>

        <section className="cc-grid-two cc-reveal cc-delay-2">
          <article className="cc-panel cc-chart-panel">
            <div className="cc-panel-head">
              <h3>7 Day Delivery Trend</h3>
              <span>successful sends</span>
            </div>
            <div className="cc-delivery-chart">
              {[
                { day: "Mon", value: 72 },
                { day: "Tue", value: 68 },
                { day: "Wed", value: 81 },
                { day: "Thu", value: 76 },
                { day: "Fri", value: 90 },
                { day: "Sat", value: 64 },
                { day: "Sun", value: 79 },
              ].map((item) => (
                <div key={item.day} className="cc-delivery-col">
                  <div className="cc-delivery-track">
                    <span className="cc-delivery-bar" style={{ height: `${item.value}%` }} />
                  </div>
                  <small>{item.day}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="cc-panel cc-chart-panel">
            <div className="cc-panel-head">
              <h3>Module Distribution</h3>
              <span>today volume share</span>
            </div>
            <div className="cc-donut-wrap">
              <div className="cc-donut-chart" aria-label="Module distribution chart" />
              <div className="cc-donut-legend">
                <div><i className="cc-legend-dot cc-legend-red" />Life Updates <strong>34%</strong></div>
                <div><i className="cc-legend-dot cc-legend-blue" />Lifecycle Triggers <strong>26%</strong></div>
                <div><i className="cc-legend-dot cc-legend-amber" />Txn Inactive <strong>22%</strong></div>
                <div><i className="cc-legend-dot cc-legend-green" />Onebank Inactive <strong>18%</strong></div>
              </div>
            </div>
          </article>
        </section>

        <section className="cc-panel cc-reveal cc-delay-3">
          <div className="cc-panel-head">
            <h3>Recent workflow activity</h3>
            <span>latest events</span>
          </div>
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Module</th>
                  <th>Customer</th>
                  <th>Account</th>
                  <th>Trigger</th>
                  <th>Status</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITY_ROWS.map((row) => (
                  <tr key={`${row.timestamp}-${row.customerId}`}>
                    <td>{row.timestamp}</td>
                    <td>{row.module}</td>
                    <td>{row.customerId}</td>
                    <td>{row.account}</td>
                    <td>{row.trigger}</td>
                    <td>
                      <span
                        className={`cc-tag ${
                          row.status === "Delivered"
                            ? "cc-tag-green"
                            : row.status === "Failed"
                              ? "cc-tag-red"
                              : "cc-tag-amber"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{row.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  function renderAgentControl() {
    const jobGroups = [
      {
        key: "existing",
        title: "Existing Customer",
        items: visibleJobs.filter((job) => job.key.startsWith("existing-")),
      },
      {
        key: "inactive",
        title: "Inactive Customer",
        items: visibleJobs.filter((job) => job.key.startsWith("inactive-")),
      },
    ].filter((group) => group.items.length > 0);

    return (
      <div className="cc-page-stack">
        <section className="cc-panel">
          <div className="cc-panel-head">
            <h3>Background Job Management</h3>
            <span>Start, stop and configure autonomous AI workflow jobs per module</span>
          </div>
          {renderCustomerToggle()}
          <div className="cc-metric-strip">
            <div className="cc-stat-card">
              <p>Running Jobs (All Customers)</p>
              <strong>{jobs.filter((job) => job.enabled).length}</strong>
            </div>
            <div className="cc-stat-card">
              <p>Stopped Jobs (All Customers)</p>
              <strong>{jobs.filter((job) => !job.enabled).length}</strong>
            </div>
            <div className="cc-stat-card">
              <p>Existing Customer Jobs</p>
              <strong>{jobs.filter((job) => job.key.startsWith("existing-")).length}</strong>
            </div>
            <div className="cc-stat-card">
              <p>Inactive Customer Jobs</p>
              <strong>{jobs.filter((job) => job.key.startsWith("inactive-")).length}</strong>
            </div>
          </div>
        </section>

        <section className="cc-grid-two">
          <article className="cc-panel">
            <div className="cc-panel-head">
              <h3>Job Switches</h3>
              <span>on and off control</span>
            </div>
            {jobGroups.map((group) => (
              <div key={group.key} className="cc-job-group">
                <p className="cc-job-group-title">{group.title}</p>
                <div className="cc-job-list">
                  {group.items.map((job) => (
                    <div key={job.key} className="cc-job-row">
                      <div>
                        <strong>{job.name}</strong>
                        <span>{job.trigger}</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={job.enabled}
                        aria-label={`${job.enabled ? "Disable" : "Enable"} ${job.name}`}
                        onClick={() => toggleJob(job.key)}
                        className={`cc-switch ${job.enabled ? "cc-switch-on" : "cc-switch-off"}`}
                      >
                        <span className="cc-switch-knob" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </article>

          <article className="cc-panel">
            <div className="cc-panel-head">
              <h3>Job Status Summary</h3>
              <span>current runtime positions</span>
            </div>
            {jobGroups.map((group) => (
              <div key={`${group.key}-summary`} className="cc-job-group">
                <p className="cc-job-group-title">{group.title}</p>
                <div className="cc-kv-list">
                  {group.items.map((job) => (
                    <div key={`${job.key}-summary`} className="cc-kv-row">
                      <span>{job.name}</span>
                      <strong>{job.enabled ? `Running / ${job.nextRun}` : "Stopped"}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </article>
        </section>

        <section>
          <article className="cc-panel">
            <div className="cc-panel-head">
              <h3>Manual Trigger Panel</h3>
              <span>audit logged</span>
            </div>
            <div className="cc-form-grid">
              <label>
                Customer ID
                <input value={manualCustomerId} onChange={(event) => setManualCustomerId(event.target.value)} placeholder="CUS-XXXXX" />
              </label>
              <label>
                Account Number
                <input value={manualAccountNumber} onChange={(event) => setManualAccountNumber(event.target.value)} placeholder="0012345678" />
              </label>
              <label>
                Module
                <select
                  value={manualModuleKey}
                  onChange={(event) => {
                    const nextModule = event.target.value;
                    const nextSignal = manualSignalOptionsByModule[nextModule]?.[0]?.value ?? "";
                    setManualModuleKey(nextModule);
                    setManualTriggerSignal(nextSignal);
                    if (nextModule === "existing-life-updates") {
                      const selectedEvent = LIFE_EVENT_TRIGGER_OPTIONS.find((item) => item.value === nextSignal) ?? LIFE_EVENT_TRIGGER_OPTIONS[0];
                      setManualAmount(selectedEvent.defaultAmount);
                    }
                  }}
                >
                  {customerScope !== "inactive" && <option value="existing-life-updates">Life Updates</option>}
                  {customerScope !== "inactive" && <option value="existing-migration">Lifecycle Triggers</option>}
                  {customerScope !== "existing" && <option value="inactive-transaction">Transaction Inactive</option>}
                  {customerScope !== "existing" && <option value="inactive-onebank">Onebank Inactive</option>}
                </select>
              </label>
              <label>
                Trigger Signal
                <select
                  value={manualTriggerSignal}
                  onChange={(event) => {
                    const nextSignal = event.target.value;
                    setManualTriggerSignal(nextSignal);
                    if (manualModuleKey === "existing-life-updates") {
                      const selectedEvent = LIFE_EVENT_TRIGGER_OPTIONS.find((item) => item.value === nextSignal);
                      if (selectedEvent) {
                        setManualAmount(selectedEvent.defaultAmount);
                      }
                    }
                  }}
                >
                  {(manualSignalOptionsByModule[manualModuleKey] ?? []).map((item) => (
                    <option key={`${manualModuleKey}-${item.value}`} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              {manualModuleKey === "existing-life-updates" ? (
                <label>
                  Amount (₦)
                  <input
                    type="number"
                    min="0"
                    value={manualAmount}
                    onChange={(event) => setManualAmount(event.target.value)}
                    placeholder="320000"
                  />
                </label>
              ) : null}
              <label>
                Effective Date
                <input type="date" value={manualStartDate} onChange={(event) => setManualStartDate(event.target.value)} />
              </label>
              <label>
                Start Date
                <input type="date" value={manualStartDate} onChange={(event) => setManualStartDate(event.target.value)} />
              </label>
              <label>
                End Date
                <input type="date" value={manualEndDate} onChange={(event) => setManualEndDate(event.target.value)} />
              </label>
            </div>
            <button className="cc-btn-primary" onClick={() => void submitManualTrigger()} disabled={manualSubmitting}>
              {manualSubmitting ? "Triggering..." : "Trigger workflow"}
            </button>
            {manualMessage ? <p className="cc-inline-feedback">{manualMessage}</p> : null}
          </article>

          <article className="cc-panel" style={{ marginTop: "16px" }}>
            <div className="cc-panel-head">
              <h3>Bulk Campaign Upload</h3>
              <span>download template, populate, and re-upload</span>
            </div>
            <div className="cc-form-grid">
              <label>
                CSV Template
                <a className="cc-btn-soft" href="/templates/campaign-bulk-template.csv" download>
                  Download sample template
                </a>
              </label>
              <label>
                Upload Populated File
                <input type="file" accept=".csv,text/csv" onChange={onBulkCampaignFileUpload} />
              </label>
            </div>
            {bulkCampaignUploadError ? <p className="cc-inline-feedback">{bulkCampaignUploadError}</p> : null}
            {bulkCampaignUploadNote ? <p className="cc-inline-feedback">{bulkCampaignUploadNote}</p> : null}
            <button
              className="cc-btn-primary"
              onClick={() => void triggerBulkCampaignWorkflow()}
              disabled={bulkCampaignRows.length === 0 || bulkCampaignTriggering}
              style={{ marginTop: "10px" }}
            >
              {bulkCampaignTriggering ? "Triggering..." : "Trigger bulk workflow"}
            </button>
            {bulkCampaignRows.length > 0 ? (
              <div className="cc-table-wrap" style={{ marginTop: "12px" }}>
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Module</th>
                      <th>Customer ID</th>
                      <th>Account</th>
                      <th>Template</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Recurrence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkCampaignRows.slice(0, 8).map((row, index) => (
                      <tr key={`${row.customer_id}-${row.account_number}-${index}`}>
                        <td>{row.campaign_name}</td>
                        <td>{row.module_key}</td>
                        <td>{row.customer_id}</td>
                        <td>{row.account_number}</td>
                        <td>{row.template_code}</td>
                        <td>{row.start_date || "-"}</td>
                        <td>{row.end_date || "-"}</td>
                        <td>{row.recurrence || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
        </section>
      </div>
    );
  }

  function renderPlaceholder(title: string, body: string) {
    return (
      <section className="cc-panel cc-placeholder">
        <h3>{title}</h3>
        <p>{body}</p>
      </section>
    );
  }

  function renderModulePage(config: { title: string; jobKey: Job["key"] }) {
    const moduleJob = jobs.find((job) => job.key === config.jobKey);
    const moduleTemplates = templatesByJob[config.jobKey] ?? [];
    const templateDraft = templateDrafts[config.jobKey] ?? INITIAL_TEMPLATE_DRAFTS[config.jobKey];
    const moduleWavePlan = moduleWavePlans[config.jobKey] ?? MODULE_WAVE_PLAN_DEFAULTS[config.jobKey];
    const moduleEvents = MODULE_EVENT_ROWS[config.jobKey] ?? [];
    const eventStatusCounts = moduleEvents.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const eventStatusEntries = Object.entries(eventStatusCounts);
    const moduleCategoryOptions = TEMPLATE_EVENT_CATEGORIES[config.jobKey] ?? [];
    const editingTemplateId = editingTemplateByJob[config.jobKey];
    const editingTemplate = moduleTemplates.find((item) => item.id === editingTemplateId);
    const isComposerOpen = templateComposerOpenByJob[config.jobKey];
    const openActionMenuId = openTemplateActionMenuByJob[config.jobKey];
    const selectedLifeEvent = LIFE_EVENT_TRIGGER_OPTIONS.find((item) => item.value === txForm.eventType) ?? LIFE_EVENT_TRIGGER_OPTIONS[0];

    return (
      <>
        {/* Row 1 — Control Center, full width */}
        <article className="cc-panel cc-module-control-panel">
          <div className="cc-module-control-left">
            <h3>{config.title}</h3>
            <p className="cc-muted-text">Module Control Center</p>
          </div>
          <div className="cc-module-control-stats">
            <div className="cc-module-stat-item">
              <p className="cc-label-micro">Last run</p>
              <strong>{moduleJob?.lastRun ?? "—"}</strong>
            </div>
            <div className="cc-module-stat-item">
              <p className="cc-label-micro">Next run</p>
              <strong>{moduleJob?.nextRun ?? "—"}</strong>
            </div>
          </div>
          <div className="cc-module-control-right">
            <div className="cc-module-power">
              <span>Workflow</span>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(moduleJob?.enabled)}
                aria-label={`${moduleJob?.enabled ? "Disable" : "Enable"} ${config.title}`}
                onClick={() => moduleJob && toggleJob(moduleJob.key)}
                className={`cc-switch ${moduleJob?.enabled ? "cc-switch-on" : "cc-switch-off"}`}
              >
                <span className="cc-switch-knob" />
              </button>
            </div>
            <div className="cc-module-quick-actions">
              <button
                className="cc-btn-soft"
                onClick={() => moduleJob && void triggerJobNow(moduleJob.key)}
                disabled={!moduleJob}
              >
                Run Now
              </button>
              <button className="cc-btn-soft" onClick={() => navigate("reports")}>Reports</button>
              <button className="cc-btn-soft" onClick={() => navigate("audit")}>Audit Trail</button>
            </div>
          </div>
        </article>

        {config.jobKey === "existing-migration" ? (
          <article className="cc-panel">
            <div className="cc-panel-head">
              <h3>Notification Trigger Rules</h3>
              <span>use event-driven triggers for threshold, age maturity, and investment maturity journeys</span>
            </div>
            <div className="cc-form-grid">
              <label>
                Account Tier Balance Threshold Notification Cadence
                <select
                  value={migrationTriggerPlan.thresholdCadence}
                  onChange={(event) => updateMigrationTriggerPlan("thresholdCadence", event.target.value)}
                >
                  <option value="realtime">Realtime (at threshold breach)</option>
                  <option value="daily_batch">Daily Batch Review</option>
                </select>
              </label>
              <label>
                Threshold Follow-up (days)
                <input
                  type="number"
                  min="1"
                  value={migrationTriggerPlan.thresholdFollowUpDays}
                  onChange={(event) => updateMigrationTriggerPlan("thresholdFollowUpDays", Number(event.target.value || 1))}
                />
              </label>
              <label>
                Age Trigger Minimum
                <input type="number" value={migrationTriggerPlan.ageTriggerMinimum} disabled />
              </label>
              <label>
                Age Reminder Offsets (days)
                <input
                  value={migrationTriggerPlan.ageReminderDays}
                  onChange={(event) => updateMigrationTriggerPlan("ageReminderDays", event.target.value)}
                  placeholder="e.g. 14,7,0"
                />
              </label>
              <label>
                Investment Maturity Offsets (days)
                <input
                  value={migrationTriggerPlan.investmentReminderDays}
                  onChange={(event) => updateMigrationTriggerPlan("investmentReminderDays", event.target.value)}
                  placeholder="e.g. 30,14,7,0"
                />
              </label>
              <label>
                Post-maturity Follow-up (days)
                <input
                  type="number"
                  min="1"
                  value={migrationTriggerPlan.postMaturityFollowUpDays}
                  onChange={(event) => updateMigrationTriggerPlan("postMaturityFollowUpDays", Number(event.target.value || 1))}
                />
              </label>
            </div>
            <p className="cc-muted-text">Age and investment reminders fire from maturity dates; threshold notifications fire from account-credit tier breaches.</p>
          </article>
        ) : (
          <article className="cc-panel">
            <div className="cc-panel-head">
              <h3>Email Notification Frequency</h3>
              <span>configure campaign duration and notification spacing for 1-3 waves</span>
            </div>
            <div className="cc-form-grid">
              <label>
                Start Date
                <input
                  type="date"
                  value={moduleWavePlan.startDate}
                  onChange={(event) => updateModuleWavePlan(config.jobKey, "startDate", event.target.value)}
                />
              </label>
              <label>
                End Date
                <input
                  type="date"
                  value={moduleWavePlan.endDate}
                  onChange={(event) => updateModuleWavePlan(config.jobKey, "endDate", event.target.value)}
                />
              </label>
              <label>
                Number of Waves
                <select
                  value={String(moduleWavePlan.waves)}
                  onChange={(event) => updateModuleWavePlan(config.jobKey, "waves", Number(event.target.value))}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </label>
              <label>
                Spacing (days)
                <input
                  type="number"
                  min="1"
                  value={moduleWavePlan.spacingDays}
                  onChange={(event) => updateModuleWavePlan(config.jobKey, "spacingDays", Number(event.target.value || 1))}
                />
              </label>
              <label>
                Final Wave Action
                <select
                  value={moduleWavePlan.finalWaveAction}
                  onChange={(event) => updateModuleWavePlan(config.jobKey, "finalWaveAction", event.target.value)}
                >
                  <option value="stop">Stop Campaign</option>
                  <option value="escalate">Escalate to Follow-up</option>
                </select>
              </label>
            </div>
          </article>
        )}

        {config.jobKey === "existing-life-updates" && ENABLE_MANUAL_TRIGGER_PANEL ? (
          <article className="cc-panel cc-process-tx-panel">
            <div className="cc-panel-head">
              <div>
                <h3>Process Transaction</h3>
                <span>Add a transaction and trigger the life event pipeline — detects patterns, runs recommendations, fires email</span>
              </div>
            </div>
            <div className="cc-process-tx-form">
              <label>
                Account Number
                <input
                  value={txForm.accountNumber}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="e.g. 1234567890"
                  inputMode="numeric"
                  list="cc-demo-account-options"
                />
                <datalist id="cc-demo-account-options">
                  {txCustomerOptions.map((c) => (
                    <option key={c.customerId} value={c.accountNumber}>
                      {c.name}
                    </option>
                  ))}
                </datalist>
                <span className="cc-muted-text">Type any 10-digit account number. Demo accounts will appear as suggestions.</span>
              </label>
              <label>
                Life Event Type
                <select
                  value={txForm.eventType}
                  onChange={(e) => {
                    const next = LIFE_EVENT_TRIGGER_OPTIONS.find((item) => item.value === e.target.value);
                    setTxForm((prev) => ({
                      ...prev,
                      eventType: e.target.value,
                      amount: next ? next.defaultAmount : prev.amount,
                    }));
                  }}
                >
                  {LIFE_EVENT_TRIGGER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="cc-muted-text">This maps to the backend narration pattern: {selectedLifeEvent.narration}</span>
              </label>
              <label>
                Amount (₦)
                <input
                  type="number"
                  min="0"
                  value={txForm.amount}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder={`e.g. ${selectedLifeEvent.defaultAmount}`}
                />
              </label>
              <label>
                Transaction Date
                <input
                  type="date"
                  value={txForm.date}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </label>
            </div>
            <div className="cc-process-tx-actions">
              <button
                className="cc-btn-primary"
                onClick={() => void processTransaction()}
                disabled={txLoading || !txForm.accountNumber || !txForm.eventType || !txForm.amount}
              >
                {txLoading ? "Processing…" : "Process Transaction"}
              </button>
              {ENABLE_DEMO_SEED_BUTTON ? (
                <button
                  className="cc-btn-soft"
                  onClick={() => void seedLifeEventHistory()}
                  disabled={txSeedLoading}
                >
                  {txSeedLoading ? "Seeding…" : "Seed 6-Month Demo History"}
                </button>
              ) : null}
            </div>
            {ENABLE_DEMO_SEED_BUTTON && txSeedResult !== null ? (
              <div className="cc-process-seed-note">
                {txSeedResult.error ? (
                  <p className="cc-result-error">{txSeedResult.error}</p>
                ) : (
                  <p className="cc-muted-text">
                    Seeded {txSeedResult.seededTransactions} transactions.
                    {txSeedResult.skippedAccounts.length > 0
                      ? ` Skipped: ${txSeedResult.skippedAccounts.join(", ")}`
                      : ""}
                  </p>
                )}
              </div>
            ) : null}
            {txResult !== null ? (
              <div className={`cc-process-tx-result ${txResult.eventDetected ? "cc-result-detected" : "cc-result-none"}`}>
                {txResult.error !== null ? (
                  <p className="cc-result-error">{txResult.error}</p>
                ) : txResult.eventDetected ? (
                  <>
                    <div className="cc-result-badge cc-result-badge-detected">Life Event Detected</div>
                    <div className="cc-result-detail-grid">
                      <span>Event Type</span>
                      <strong>{txResult.lifeEvent.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</strong>
                      <span>Recommended Product</span>
                      <strong>{txResult.product ?? "—"}</strong>
                      <span>Email</span>
                      <strong>{txResult.emailStatus ?? "—"}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="cc-result-badge cc-result-badge-none">No Pattern Detected</div>
                    <p className="cc-muted-text">No life event pattern found yet. More transaction history may be needed (3–6 months of consistent behavior).</p>
                  </>
                )}
              </div>
            ) : null}
          </article>
        ) : null}

        <article className="cc-panel cc-template-library-panel">
          <div className="cc-panel-head cc-template-library-head">
            <div>
              <h3>Template Library</h3>
              <span>template table and popup workflow</span>
            </div>
            <div className="cc-template-library-summary">
              <span>{moduleTemplates.length} saved templates</span>
              <button className="cc-btn-primary" onClick={() => startTemplateCreate(config.jobKey)}>Create Template</button>
            </div>
          </div>
          <div className="cc-table-wrap">
            <table className="cc-table cc-template-library-table">
              <colgroup>
                <col className="cc-template-col-name" />
                <col className="cc-template-col-event" />
                <col className="cc-template-col-date" />
                <col className="cc-template-col-category" />
                <col className="cc-template-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Event / Life Update Type</th>
                  <th>Date Created</th>
                  <th>Recommendation Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {moduleTemplates.map((row) => (
                  <tr key={row.id} className={editingTemplateId === row.id ? "cc-row-active" : ""}>
                    <td>{row.name}</td>
                    <td>{row.eventCategory}</td>
                    <td>{row.updated}</td>
                    <td>{row.templateCategory}</td>
                    <td className="cc-template-action-cell">
                      <div className="cc-template-action-wrap">
                        <button
                          type="button"
                          className="cc-template-menu-trigger"
                          aria-haspopup="menu"
                          aria-expanded={openActionMenuId === row.id}
                          aria-label="Template actions"
                          onClick={() => toggleTemplateActionMenu(config.jobKey, row.id)}
                        >
                          ...
                        </button>
                        {openActionMenuId === row.id ? (
                          <div className="cc-template-row-menu" role="menu" aria-label={`${row.name} actions`}>
                            <button type="button" onClick={() => handleTemplateAction(config.jobKey, row, "edit")}>Edit</button>
                            <button type="button" onClick={() => handleTemplateAction(config.jobKey, row, "view")}>View</button>
                            <button type="button" onClick={() => handleTemplateAction(config.jobKey, row, "delete")}>Delete</button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {moduleTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="cc-template-empty-state">
                        <p>No templates yet for this module.</p>
                        <button className="cc-btn-primary" onClick={() => startTemplateCreate(config.jobKey)}>Create the first template</button>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        {/* Row 3 — Event Table, full width */}
        <article className="cc-panel">
          <div className="cc-panel-head">
            <div>
              <h3>{config.title} — Event Table</h3>
              <span>delivery status and report export</span>
            </div>
            <button
              className="cc-btn-soft"
              onClick={() => downloadCsv(`${config.jobKey}-events.csv`, ["Time", "Customer", "Event", "Status"], moduleEvents.map((row) => [row.time, row.customer, row.event, row.status]))}
            >
              Download Report
            </button>
          </div>
          <div className="cc-event-status-strip">
            {eventStatusEntries.map(([status, count]) => (
              <div key={`${config.jobKey}-${status}`} className="cc-event-status-pill">
                <span>{status}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Event</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {moduleEvents.map((row) => (
                  <tr key={`${config.jobKey}-${row.customer}-${row.time}`}>
                    <td>{row.time}</td>
                    <td>{row.customer}</td>
                    <td>{row.event}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {isComposerOpen ? (
          <section className="cc-template-modal-overlay" role="dialog" aria-modal="true" aria-label={editingTemplate ? "Edit template" : "Create template"}>
            <div className="cc-panel cc-template-modal cc-template-modal-wide">
              <div className="cc-template-composer-head">
                <div>
                  <h4>{editingTemplate ? "Edit Template" : "Create Template"}</h4>
                  <p>Populate the template with event type, life update category, product, and recommendation details.</p>
                </div>
                <div className="cc-inline-actions">
                  <button className="cc-btn-soft" onClick={() => setViewingTemplate({ id: "__preview__", updated: new Date().toLocaleDateString("en-GB"), name: templateDraft.name || "(untitled)", templateCategory: templateDraft.templateCategory, product: templateDraft.product, eventCategory: templateDraft.eventCategory, waveStage: templateDraft.waveStage, channel: templateDraft.channel, subject: templateDraft.subject, header: templateDraft.header, headerImage: templateDraft.headerImage, body: templateDraft.body, templateFooter: templateDraft.templateFooter, footerImage: templateDraft.footerImage, footerTextAbove: templateDraft.footerTextAbove, footerTextBelow: templateDraft.footerTextBelow, videoThumbnail: templateDraft.videoThumbnail, gifThumbnail: templateDraft.gifThumbnail, status: "draft" })}>Preview</button>
                  <button className="cc-btn-primary" onClick={() => createTemplate(config.jobKey)}>{editingTemplate ? "Save Template" : "Create Template"}</button>
                  <button className="cc-btn-soft" onClick={() => cancelTemplateEdit(config.jobKey)}>Close</button>
                </div>
              </div>
              <div className="cc-form-grid cc-template-form-grid cc-template-composer-grid">
                <label>
                  Template Name
                  <input value={templateDraft.name} onChange={(event) => updateTemplateDraft(config.jobKey, "name", event.target.value)} placeholder="Template name" />
                </label>
                <label>
                  Recommendation Category
                  <select value={templateDraft.templateCategory} onChange={(event) => updateTemplateDraft(config.jobKey, "templateCategory", event.target.value)}>
                    {TEMPLATE_LIBRARY_CATEGORIES.map((item) => (
                      <option key={`${config.jobKey}-template-category-${item}`}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Product Category
                  <select value={templateDraft.product} onChange={(event) => updateTemplateDraft(config.jobKey, "product", event.target.value)}>
                    {TEMPLATE_PRODUCTS.map((item) => (
                      <option key={`${config.jobKey}-${item}`}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Event / Life Update Type
                  <select value={templateDraft.eventCategory} onChange={(event) => updateTemplateDraft(config.jobKey, "eventCategory", event.target.value)}>
                    {moduleCategoryOptions.map((item) => (
                      <option key={`${config.jobKey}-event-${item}`}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {config.jobKey === "existing-migration" ? "Trigger Stage" : "Wave Assignment"}
                  <select value={templateDraft.waveStage} onChange={(event) => updateTemplateDraft(config.jobKey, "waveStage", event.target.value)}>
                    {WAVE_STAGE_OPTIONS.map((stage) => (
                      <option key={`${config.jobKey}-stage-${stage}`} value={stage}>
                        {formatWaveStageLabel(config.jobKey, stage)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Channel
                  <select value={templateDraft.channel} onChange={(event) => updateTemplateDraft(config.jobKey, "channel", event.target.value)}>
                    <option>Email</option>
                    <option>SMS</option>
                  </select>
                </label>
                <label className="cc-template-subject-field">
                  Subject
                  <input value={templateDraft.subject} onChange={(event) => updateTemplateDraft(config.jobKey, "subject", event.target.value)} placeholder="Email subject line" />
                </label>
                <label className="cc-template-subject-field">
                  Header Banner Image <span className="cc-field-note">(PNG or JPG, displayed at the top of the email)</span>
                  <input type="file" accept="image/png,image/jpeg" onChange={(event) => { void handleTemplateImageUpload(config.jobKey, "headerImage", event.target.files); }} />
                </label>
                <label className="cc-template-body-field">
                  Template Body
                  <RichBodyEditor value={templateDraft.body} onChange={(html) => updateTemplateDraft(config.jobKey, "body", html)} />
                </label>
                <label className="cc-template-subject-field">
                  Template Footer <span className="cc-field-note">(optional closing note before the global signature)</span>
                  <input value={templateDraft.templateFooter} onChange={(event) => updateTemplateDraft(config.jobKey, "templateFooter", event.target.value)} placeholder="e.g. This offer is valid until 31 May 2026." />
                </label>
                <label className="cc-template-subject-field">
                  Footer Text (above banner)
                  <textarea rows={3} value={templateDraft.footerTextAbove} onChange={(event) => updateTemplateDraft(config.jobKey, "footerTextAbove", event.target.value)} placeholder="e.g. Need help? Call 07008220000" />
                </label>
                <label className="cc-template-subject-field">
                  Footer Banner Image (PNG/JPG)
                  <input type="file" accept="image/png,image/jpeg" onChange={(event) => { void handleTemplateImageUpload(config.jobKey, "footerImage", event.target.files); }} />
                </label>
                <label className="cc-template-subject-field">
                  Footer Text (below banner)
                  <textarea rows={3} value={templateDraft.footerTextBelow} onChange={(event) => updateTemplateDraft(config.jobKey, "footerTextBelow", event.target.value)} placeholder="e.g. Terms and conditions apply." />
                </label>
                <label className="cc-template-subject-field">
                  Video Thumbnail Image (PNG/JPG)
                  <input type="file" accept="image/png,image/jpeg" onChange={(event) => { void handleTemplateImageUpload(config.jobKey, "videoThumbnail", event.target.files); }} />
                </label>
                <label className="cc-template-subject-field">
                  GIF Thumbnail Image (PNG/JPG)
                  <input type="file" accept="image/png,image/jpeg" onChange={(event) => { void handleTemplateImageUpload(config.jobKey, "gifThumbnail", event.target.files); }} />
                </label>
              </div>
            </div>
          </section>
        ) : null}

        {viewingTemplate ? (
          <section className="cc-template-modal-overlay cc-template-viewer" role="dialog" aria-modal="true" aria-label="Template preview">
            <div className="cc-panel cc-template-modal cc-template-modal-view">
              <div className="cc-panel-head">
                <h3>Template Preview</h3>
                <button className="cc-btn-soft" onClick={() => setViewingTemplate(null)}>Close</button>
              </div>
              <div className="cc-template-preview-meta">
                <span><strong>Name:</strong> {viewingTemplate.name}</span>
                <span><strong>Category:</strong> {viewingTemplate.templateCategory}</span>
                <span><strong>Date Created:</strong> {viewingTemplate.updated}</span>
                <span><strong>Product:</strong> {viewingTemplate.product}</span>
                <span><strong>Event:</strong> {viewingTemplate.eventCategory}</span>
                <span><strong>{config.jobKey === "existing-migration" ? "Trigger Stage" : "Wave"}:</strong> {formatWaveStageLabel(config.jobKey, viewingTemplate.waveStage)}</span>
                <span><strong>Channel:</strong> {viewingTemplate.channel}</span>
              </div>
              {viewingTemplate.headerImage ? <img className="cc-preview-banner" src={viewingTemplate.headerImage} alt="Header banner" /> : null}
              <h4>{applyPreviewTokens(viewingTemplate.subject)}</h4>
              {viewingTemplate.header ? (
                <p className="cc-preview-header">{applyPreviewTokens(viewingTemplate.header)}</p>
              ) : null}
              <article className="cc-rich-preview-body-wrap">
                <div
                  className="cc-rich-preview-body"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: applyPreviewTokens(viewingTemplate.body) }}
                />
              </article>
              {viewingTemplate.templateFooter ? (
                <p className="cc-preview-template-footer">{applyPreviewTokens(viewingTemplate.templateFooter)}</p>
              ) : null}
              {viewingTemplate.videoThumbnail || viewingTemplate.gifThumbnail ? (
                <div className="cc-preview-media-grid">
                  {viewingTemplate.videoThumbnail ? (
                    <div className="cc-preview-media-card">
                      <span>Video Thumbnail</span>
                      <img src={viewingTemplate.videoThumbnail} alt="Video thumbnail" />
                    </div>
                  ) : null}
                  {viewingTemplate.gifThumbnail ? (
                    <div className="cc-preview-media-card">
                      <span>GIF Thumbnail</span>
                      <img src={viewingTemplate.gifThumbnail} alt="GIF thumbnail" />
                    </div>
                  ) : null}
                </div>
              ) : null}
              {viewingTemplate.footerTextAbove ? (
                <p
                  className="cc-preview-footer-text"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: renderFooterTextHtml(viewingTemplate.footerTextAbove) }}
                />
              ) : null}
              {viewingTemplate.footerImage ? <img className="cc-preview-banner" src={viewingTemplate.footerImage} alt="Footer banner" /> : null}
              {viewingTemplate.footerTextBelow ? (
                <p
                  className="cc-preview-footer-text cc-preview-footer-text-under"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: renderFooterTextHtml(viewingTemplate.footerTextBelow) }}
                />
              ) : null}
              {globalSignature ? (
                <p style={{ whiteSpace: "pre-line", marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--cc-border, #e5e7eb)", fontSize: "0.875rem" }}>{globalSignature}</p>
              ) : null}
              {globalFooter ? (
                <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "8px" }}>{globalFooter}</p>
              ) : null}
            </div>
          </section>
        ) : null}
      </>
    );
  }

  function renderOperationsPage(config: { title: string; subtitle: string; columns: string[]; rows: string[][] }) {
    return (
      <section className="cc-panel">
        <div className="cc-panel-head">
          <h3>{config.title}</h3>
          <span>{config.subtitle}</span>
        </div>
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                {config.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.rows.map((row, rowIndex) => (
                <tr key={`${config.title}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${config.title}-${rowIndex}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderPerformancePage() {
    return (
      <div className="cc-page-stack">
        <section className="cc-kpi-grid">
          {[
            { label: "Delivery Rate", value: "94.2%", note: "+1.3% WoW", delta: "up", icon: "📬", bg: "#e8f8ef" },
            { label: "Avg. Response", value: "1.8m", note: "trigger to send", delta: "flat", icon: "⏱", bg: "#dbeafe" },
            { label: "Engagement", value: "38.6%", note: "open + click blended", delta: "up", icon: "👆", bg: "#fef3c7" },
            { label: "Conversion Rate", value: "12.4%", note: "offer acceptance", delta: "up", icon: "✨", bg: "var(--cc-red-soft)" },
          ].map((item) => (
            <article key={item.label} className="cc-kpi-card cc-kpi-card-balanced">
              <div className="cc-kpi-card-icon" style={{ background: item.bg }}>{item.icon}</div>
              <p>{item.label}</p>
              <h3>{item.value}</h3>
              <span className={`cc-delta cc-delta-${item.delta}`}>{item.note}</span>
            </article>
          ))}
        </section>

        <section className="cc-panel">
          <div className="cc-panel-head">
            <h3>Per Module Performance</h3>
            <span>sub categories and conversion quality</span>
          </div>
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Sub Category</th>
                  <th>Delivered</th>
                  <th>Delivery Rate</th>
                  <th>Avg. Response</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {PERFORMANCE_MODULE_ROWS.map((row) => (
                  <tr key={row.join("-")}>
                    {row.map((cell, index) => (
                      <td key={`${row[1]}-${index}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="cc-grid-three">
          {SLA_ROWS.map((item) => (
            <article key={item.label} className="cc-panel">
              <div className="cc-panel-head">
                <h3>{item.label}</h3>
                <span className={`cc-tag ${item.status === "Healthy" ? "cc-tag-green" : item.status === "Watch" ? "cc-tag-amber" : "cc-tag-red"}`}>
                  {item.status}
                </span>
              </div>
              <div className="cc-sla-value">{item.value}</div>
              <p className="cc-sla-note">{item.note}</p>
            </article>
          ))}
        </section>
      </div>
    );
  }

  function renderDowntimePage() {
    return (
      <div className="cc-page-stack">
        <section className="cc-kpi-grid">
          {[
            { label: "Current Uptime", value: "99.94%", note: "30-day rolling", delta: "up", icon: "🟢", bg: "#e8f8ef" },
            { label: "Active Alerts", value: "3", note: "1 high severity", delta: "down", icon: "🚨", bg: "var(--cc-red-soft)" },
            { label: "Incidents", value: "7", note: "this month", delta: "flat", icon: "📋", bg: "#fef3c7" },
            { label: "Avg. Resolution", value: "11m", note: "incident MTTR", delta: "flat", icon: "⚙️", bg: "#dbeafe" },
          ].map((item) => (
            <article key={item.label} className="cc-kpi-card cc-kpi-card-balanced">
              <div className="cc-kpi-card-icon" style={{ background: item.bg }}>{item.icon}</div>
              <p>{item.label}</p>
              <h3>{item.value}</h3>
              <span className={`cc-delta cc-delta-${item.delta}`}>{item.note}</span>
            </article>
          ))}
        </section>

        <section className="cc-panel">
          <div className="cc-panel-head">
            <h3>90 Day Uptime History Chart</h3>
            <span>operation, degraded, outage</span>
          </div>
          <div className="cc-uptime-legend">
            <span><i className="cc-dot cc-dot-green" />Operational</span>
            <span><i className="cc-dot cc-dot-amber" />Degraded</span>
            <span><i className="cc-dot cc-dot-red" />Outage</span>
          </div>
          <div className="cc-uptime-chart">
            {UPTIME_HISTORY.map((item) => {
              const total = item.operational + item.degraded + item.outage;
              return (
                <div key={item.label} className="cc-uptime-col">
                  <div className="cc-uptime-stack">
                    <span className="cc-uptime-operational" style={{ height: `${(item.operational / total) * 100}%` }} />
                    <span className="cc-uptime-degraded" style={{ height: `${(item.degraded / total) * 100}%` }} />
                    <span className="cc-uptime-outage" style={{ height: `${(item.outage / total) * 100}%` }} />
                  </div>
                  <small>{item.label}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="cc-panel">
          <div className="cc-panel-head">
            <h3>Active Alerts</h3>
            <span>module, severity, duration, action</span>
          </div>
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Description</th>
                  <th>Started</th>
                  <th>Severity</th>
                  <th>Duration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ALERT_ROWS.map((row) => (
                  <tr key={`${row.module}-${row.started}`}>
                    <td>{row.module}</td>
                    <td>{row.description}</td>
                    <td>{row.started}</td>
                    <td>
                      <span className={`cc-tag ${row.severity === "High" ? "cc-tag-red" : row.severity === "Medium" ? "cc-tag-amber" : "cc-tag-blue"}`}>
                        {row.severity}
                      </span>
                    </td>
                    <td>{row.duration}</td>
                    <td><button className="cc-btn-soft">{row.action}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  function renderAuditPage() {
    return (
      <section className="cc-panel">
        <div className="cc-panel-head">
          <h3>Audit Log</h3>
          <span>downloadable in csv</span>
        </div>
        <button
          className="cc-btn-primary"
          onClick={() => downloadCsv("audit-log.csv", ["Time", "Actor", "Action", "Module", "Details", "Result"], AUDIT_LOG_ROWS.map((row) => [row.time, row.actor, row.action, row.module, row.details, row.result]))}
        >
          Download Audit CSV
        </button>
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG_ROWS.map((row) => (
                <tr key={`${row.time}-${row.actor}`}>
                  <td>{row.time}</td>
                  <td>{row.actor}</td>
                  <td>{row.action}</td>
                  <td>{row.module}</td>
                  <td>{row.details}</td>
                  <td>{row.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderSettingsPage() {
    return (
      <div className="cc-page-stack">
        <section className="cc-grid-two">
          <article className="cc-panel">
            <div className="cc-panel-head">
              <h3>User Management</h3>
              <span>roles and operational access</span>
            </div>
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Team</th>
                    <th>Status</th>
                    <th>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {USER_ROWS.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.role}</td>
                      <td>{row.team}</td>
                      <td>
                        <span className={`cc-tag ${row.status === "Active" ? "cc-tag-green" : row.status === "Suspended" ? "cc-tag-red" : "cc-tag-amber"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td>{row.lastSeen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="cc-panel">
            <div className="cc-panel-head">
              <h3>Inactivity Thresholds</h3>
              <span>standard retention settings</span>
            </div>
            <div className="cc-kv-list">
              <div className="cc-kv-row"><span>Transaction Inactive</span><strong>90 days</strong></div>
              <div className="cc-kv-row"><span>Onebank Inactive</span><strong>60 days</strong></div>
              <div className="cc-kv-row"><span>Quiet Window</span><strong>22:00 - 06:00</strong></div>
              <div className="cc-kv-row"><span>Escalation Policy</span><strong>3 failed attempts</strong></div>
            </div>
          </article>
        </section>

        <section className="cc-grid-two">
          <article className="cc-panel">
            <div className="cc-panel-head">
              <h3>Channel Standards</h3>
              <span>recommended governance</span>
            </div>
            <ul className="cc-check-list">
              <li>Email templates require review before activation.</li>
              <li>Manual triggers log actor, customer, module, and time.</li>
              <li>Retry controls prevent duplicate customer contact.</li>
            </ul>
          </article>

          <article className="cc-panel">
            <div className="cc-panel-head">
              <h3>Operational Defaults</h3>
              <span>based on standards</span>
            </div>
            <ul className="cc-check-list">
              <li>SLA monitoring enabled for DB latency, workflow execution, and message delivery.</li>
              <li>CSV exports enabled for Reports, Workflow Logs, Audit Logs, and Event Tables.</li>
              <li>Role based access applied across operations, growth, retention, and support teams.</li>
            </ul>
          </article>
        </section>

        <section className="cc-panel">
          <div className="cc-panel-head">
            <h3>Message Branding</h3>
            <span>global signature and footer applied to all outbound messages</span>
          </div>
          <div className="cc-form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Global Signature
              <textarea rows={3} value={globalSignature} onChange={(event) => setGlobalSignature(event.target.value)} placeholder={"e.g. Warm regards,\nThe Sterling Team"} style={{ resize: "vertical" }} />
            </label>
            <label>
              Global Footer
              <textarea rows={3} value={globalFooter} onChange={(event) => setGlobalFooter(event.target.value)} placeholder="e.g. Sterling Bank Limited · 20 Marina, Lagos" style={{ resize: "vertical" }} />
            </label>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#777", marginTop: "10px" }}>Teams may override the signature per template in the template composer. Changes here apply to all new previews immediately.</p>
        </section>
      </div>
    );
  }

  function renderReportsPage() {
    return (
      <div className="cc-page-stack">
        <section className="cc-kpi-grid">
          <article className="cc-kpi-card"><p>Total Sent</p><h3>{reportTotals.totalSent}</h3><span className="cc-delta cc-delta-flat">Filtered result</span></article>
          <article className="cc-kpi-card"><p>Failed</p><h3>{reportTotals.failed}</h3><span className="cc-delta cc-delta-down">Requires review</span></article>
          <article className="cc-kpi-card"><p>Success</p><h3>{reportTotals.success}</h3><span className="cc-delta cc-delta-up">Completed</span></article>
          <article className="cc-kpi-card"><p>Pending Manual Trigger</p><h3>{reportTotals.pending}</h3><span className="cc-delta cc-delta-flat">Operator queue</span></article>
        </section>

        <section className="cc-panel">
          <div className="cc-panel-head">
            <h3>Report and Sent</h3>
            <span>download by module and sub modules</span>
          </div>
          <div className="cc-report-toolbar cc-report-toolbar-wide">
            <div className="cc-report-filter-mode">
              <button className={reportFilterMode === "date" ? "active" : ""} onClick={() => setReportFilterMode("date")}>Date Range</button>
              <button className={reportFilterMode === "month" ? "active" : ""} onClick={() => setReportFilterMode("month")}>Month</button>
            </div>
            <div className="cc-report-filters">
              <label>
                Start Date
                <input type="date" value={reportStartDate} onChange={(event) => setReportStartDate(event.target.value)} />
              </label>
              <label>
                End Date
                <input type="date" value={reportEndDate} onChange={(event) => setReportEndDate(event.target.value)} />
              </label>
              <label>
                Month
                <input type="month" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} />
              </label>
              <label>
                Module
                <select value={reportModuleFilter} onChange={(event) => setReportModuleFilter(event.target.value)}>
                  <option>All Modules</option>
                  <option>Existing</option>
                  <option>Inactive</option>
                </select>
              </label>
              <label>
                Sub Module
                <select value={reportSubModuleFilter} onChange={(event) => setReportSubModuleFilter(event.target.value)}>
                  <option>All Sub Modules</option>
                  <option>Life Updates</option>
                  <option>Lifecycle Triggers</option>
                  <option>Transaction Inactive</option>
                  <option>Onebank Inactive</option>
                </select>
              </label>
              <button className="cc-btn-primary" onClick={downloadReportCsv}>Export CSV</button>
            </div>
          </div>
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Module</th>
                  <th>Sub Module</th>
                  <th>Total Sent</th>
                  <th>Failed</th>
                  <th>Success</th>
                  <th>Pending</th>
                  <th>Manual Trigger</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportRows.map((row) => (
                  <tr key={`${row.date}-${row.subModule}`}>
                    <td>{row.date}</td>
                    <td>{row.module}</td>
                    <td>{row.subModule}</td>
                    <td>{row.totalSent}</td>
                    <td>{row.failed}</td>
                    <td>{row.success}</td>
                    <td>{row.pending}</td>
                    <td>{row.manualTrigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="cc-panel">
          <div className="cc-panel-head">
            <h3>Full Workflow Log</h3>
            <span>complete execution history</span>
          </div>
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Module</th>
                  <th>Sub Module</th>
                  <th>Total Sent</th>
                  <th>Failed</th>
                  <th>Success</th>
                  <th>Pending</th>
                  <th>Manual Trigger</th>
                </tr>
              </thead>
              <tbody>
                {WORKFLOW_LOG_ROWS.map((row) => (
                  <tr key={`${row.date}-${row.subModule}-full`}>
                    <td>{row.date}</td>
                    <td>{row.module}</td>
                    <td>{row.subModule}</td>
                    <td>{row.totalSent}</td>
                    <td>{row.failed}</td>
                    <td>{row.success}</td>
                    <td>{row.pending}</td>
                    <td>{row.manualTrigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  function renderPage() {
    if (activePage === "dashboard") {
      return renderDashboard();
    }
    if (activePage === "agent-control") {
      return renderAgentControl();
    }
    if (activePage === "performance") {
      return renderPerformancePage();
    }
    if (activePage === "downtime") {
      return renderDowntimePage();
    }
    if (activePage === "prospective") {
      return renderPlaceholder(
        "Prospective Customers",
        "Prospective workflows are intentionally marked as coming soon. Existing and Inactive categories are fully active.",
      );
    }
    if (activePage === "existing-life-updates") {
      return renderModulePage({
        title: "Life Updates",
        jobKey: "existing-life-updates",
      });
    }
    if (activePage === "existing-migration") {
      return renderModulePage({
        title: "Lifecycle Triggers",
        jobKey: "existing-migration",
      });
    }
    if (activePage === "inactive-transaction") {
      return renderModulePage({
        title: "Transaction Inactive",
        jobKey: "inactive-transaction",
      });
    }
    if (activePage === "inactive-onebank") {
      return renderModulePage({
        title: "Onebank Inactive",
        jobKey: "inactive-onebank",
      });
    }
    if (activePage === "reports") {
      return renderReportsPage();
    }
    if (activePage === "audit") {
      return renderAuditPage();
    }
    return renderSettingsPage();
  }

  if (authStep !== "app") {
    return (
      <main className="cc-auth-shell">
        <section className="cc-auth-left">
          <div className="cc-auth-brand">
            <div className="cc-auth-brand-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sterling-logo-icon.png" alt="Sterling" className="cc-auth-brand-logo" />
            </div>
            <div>
              <strong className="cc-auth-brand-name">OneEngage</strong>
            </div>
          </div>
          <h1>Intelligent customer engagement</h1>
          <p>Autonomous workflows for existing and inactive customers, with manual controls for support operations.</p>
          <ul>
            <li>Prospective Customers: coming soon</li>
            <li>Existing Customers: Life Updates, Lifecycle Triggers</li>
            <li>Inactive Customers: Transaction Inactive, Onebank Inactive</li>
          </ul>
        </section>

        <section className="cc-auth-right">
          {authStep === "credentials" ? (
            <form className="cc-auth-card cc-reveal" onSubmit={handleCredentialsSubmit}>
              <h2>Welcome back</h2>
              <p>Sign in to the OneEngage command centre.</p>
              <label>
                Username
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="jsmith" />
              </label>
              <label>
                Password
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="********" />
              </label>
              {authError ? <p className="cc-auth-error">{authError}</p> : null}
              <button className="cc-btn-primary" type="submit">
                Continue
              </button>
            </form>
          ) : (
            <form className="cc-auth-card cc-reveal" onSubmit={handleOtpSubmit}>
              <h2>Verify OTP</h2>
              <p>Enter the 6-digit code sent to your email.</p>
              <div className="cc-otp-grid">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpInputRefs.current[index] = element;
                    }}
                    value={value}
                    onChange={(event) => handleOtpInputChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={(event) => handleOtpPaste(index, event)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                  />
                ))}
              </div>
              {authError ? <p className="cc-auth-error">{authError}</p> : null}
              <button className="cc-btn-primary" type="submit">
                Verify and sign in
              </button>
              <button className="cc-btn-soft" type="button" onClick={returnToCredentials}>
                Back
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="cc-app-shell">
      <aside className="cc-sidebar">
        <div className="cc-sidebar-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sterling-logo-icon.png" alt="Sterling" className="cc-sidebar-brand-logo" />
          <strong>OneEngage</strong>
          <span>Command Centre</span>
        </div>

        <nav>
          <p>Overview</p>
          <button className={activePage === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}>
            Dashboard
          </button>
          <button className={activePage === "agent-control" ? "active" : ""} onClick={() => navigate("agent-control")}>
            Agent Control
          </button>
          <button className={activePage === "performance" ? "active" : ""} onClick={() => navigate("performance")}>
            Performance
          </button>
          <button className={activePage === "downtime" ? "active" : ""} onClick={() => navigate("downtime")}>
            Downtime
          </button>

          <p>Customer Modules</p>
          <span className="cc-nav-group-label">Prospective</span>
          <button className={`cc-nav-child${activePage === "prospective" ? " active" : ""}`} onClick={() => navigate("prospective")}>
            Prospecting journeys
          </button>

          <span className="cc-nav-group-label">Existing</span>
          <button className={`cc-nav-child${activePage === "existing-life-updates" ? " active" : ""}`} onClick={() => navigate("existing-life-updates")}>
            Life Updates
          </button>
          <button className={`cc-nav-child${activePage === "existing-migration" ? " active" : ""}`} onClick={() => navigate("existing-migration")}>
            Lifecycle Triggers
          </button>

          <span className="cc-nav-group-label">Inactive</span>
          <button className={`cc-nav-child${activePage === "inactive-transaction" ? " active" : ""}`} onClick={() => navigate("inactive-transaction")}>
            Transaction Inactive
          </button>
          <button className={`cc-nav-child${activePage === "inactive-onebank" ? " active" : ""}`} onClick={() => navigate("inactive-onebank")}>
            Onebank Inactive
          </button>

          <p>Operations</p>
          <button className={activePage === "reports" ? "active" : ""} onClick={() => navigate("reports")}>
            Reports
          </button>
          <button className={activePage === "audit" ? "active" : ""} onClick={() => navigate("audit")}>
            Audit Logs
          </button>
          <button className={activePage === "settings" ? "active" : ""} onClick={() => navigate("settings")}>
            Settings
          </button>
        </nav>

        <button className="cc-signout" onClick={signOut}>
          Sign out
        </button>
      </aside>

      <section className="cc-main">
        <header className="cc-topbar">
          <div>
            <h1>{PAGE_TITLES[activePage]}</h1>
            <p>OneEngage / {PAGE_TITLES[activePage]}</p>
          </div>
          <div className="cc-topbar-actions">
            {renderCustomerToggle()}
            <div className={`cc-status ${isAgentOnline ? "online" : "offline"}`}>{isAgentOnline ? "Agent online" : "Agent offline"}</div>
          </div>
        </header>

        {manualMessage ? (
          <p className="cc-inline-feedback" style={{ margin: "10px 0 0" }}>
            {manualMessage}
          </p>
        ) : null}

        <div className="cc-content">{renderPage()}</div>
      </section>
    </main>
  );
}
