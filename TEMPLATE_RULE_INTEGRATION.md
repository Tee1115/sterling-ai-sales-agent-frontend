# Template Rules Management - Frontend Integration Guide

**📚 Documentation Hub**: See [TEMPLATE_RULES_INDEX.md](TEMPLATE_RULES_INDEX.md) for complete documentation links and learning paths.

This document outlines the components and code needed to add full template rule management to the frontend.

## Related Documentation

**For different audiences**, start with:
- 👥 **Operations Teams**: [User Guide](TEMPLATE_RULES_USER_GUIDE.md) + [Quick Start](TEMPLATE_RULES_QUICKSTART.md)
- 👨‍💻 **Developers**: [Technical Docs](TEMPLATE_RULES_TECHNICAL_DOCS.md) + this document
- 🚀 **Project Managers**: [Launch Checklist](TEMPLATE_RULES_LAUNCH_CHECKLIST.md)

## 1. State Variables (Add to Home component useState section)

```typescript
const [templateRules, setTemplateRules] = useState<TemplateRule[]>([]);
const [ruleConflicts, setRuleConflicts] = useState<any[]>([]);
const [auditEntries, setAuditEntries] = useState<SelectionAuditEntry[]>([]);
const [selectedRuleCategory, setSelectedRuleCategory] = useState<string>("salary_increase");
const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
const [ruleDraft, setRuleDraft] = useState<RuleDraft>({
  template_code: "",
  category: "salary_increase",
  priority: 100,
  is_default: false,
  active: true,
  active_from: "",
  active_to: "",
  customer_tier: "",
  account_type: "",
  recommended_product: "",
  balance_min: "",
  balance_max: "",
  currency: "",
  channel: "",
});
const [ruleFormOpen, setRuleFormOpen] = useState(false);
const [ruleLoading, setRuleLoading] = useState(false);
const [ruleMessage, setRuleMessage] = useState("");
```

## 2. Rule Category Constants

```typescript
const RULE_CATEGORIES = [
  { value: "salary_increase", label: "Salary Increase" },
  { value: "school_fees", label: "School Fees" },
  { value: "fx_transfer", label: "FX Activity" },
  { value: "rent_payment", label: "Rent Payment" },
  { value: "loan_repayment", label: "Loan Repayment" },
  { value: "child_turns_18", label: "Child Turns 18" },
  { value: "migration_upgrade", label: "Account Tier Migration" },
];

const CUSTOMER_TIERS = ["TIER1", "TIER2", "TIER3"];
const ACCOUNT_TYPES = ["Savings", "Current", "Investment"];
const CHANNELS = ["Email", "SMS", "Push"];
```

## 3. API Functions to Add

```typescript
async function loadTemplateRules(category: string): Promise<void> {
  try {
    const response = await fetch(`${V2_ENDPOINTS.templateRules}?category=${encodeURIComponent(category)}&active_only=true`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Failed to load rules");
    const data = (await response.json()) as { rules?: TemplateRule[] };
    setTemplateRules(Array.isArray(data.rules) ? data.rules : []);
  } catch {
    setRuleMessage("Unable to load rules from backend");
    setTimeout(() => setRuleMessage(""), 3000);
  }
}

async function loadRuleConflicts(category: string): Promise<void> {
  try {
    const response = await fetch(V2_ENDPOINTS.templateRuleConflicts(category), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Failed to load conflicts");
    const data = (await response.json()) as  { conflicts?: any[] };
    setRuleConflicts(Array.isArray(data.conflicts) ? data.conflicts : []);
  } catch {
    setRuleConflicts([]);
  }
}

async function loadAuditTrail(customerId?: number): Promise<void> {
  try {
    const url = V2_ENDPOINTS.templateSelectionAudit(customerId, selectedRuleCategory, 100);
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Failed to load audit");
    const data = (await response.json()) as { audit?: SelectionAuditEntry[] };
    setAuditEntries(Array.isArray(data.audit) ? data.audit : []);
  } catch {
    setAuditEntries([]);
  }
}

async function createRule(): Promise<void> {
  if (!ruleDraft.template_code.trim()) {
    setRuleMessage("Template code is required");
    return;
  }

  setRuleLoading(true);
  try {
    const payload: any = {
      template_code: ruleDraft.template_code.toUpperCase(),
      category: ruleDraft.category,
      priority: Number(ruleDraft.priority),
      is_default: Boolean(ruleDraft.is_default),
      active: Boolean(ruleDraft.active),
    };

    if (ruleDraft.active_from) payload.active_from = `${ruleDraft.active_from}T00:00:00`;
    if (ruleDraft.active_to) payload.active_to = `${ruleDraft.active_to}T23:59:59`;
    if (ruleDraft.customer_tier) payload.customer_tier = ruleDraft.customer_tier;
    if (ruleDraft.account_type) payload.account_type = ruleDraft.account_type;
    if (ruleDraft.recommended_product) payload.recommended_product = ruleDraft.recommended_product;
    if (ruleDraft.balance_min) payload.balance_min = parseFloat(ruleDraft.balance_min);
    if (ruleDraft.balance_max) payload.balance_max = parseFloat(ruleDraft.balance_max);
    if (ruleDraft.currency) payload.currency = ruleDraft.currency.toUpperCase();
    if (ruleDraft.channel) payload.channel = ruleDraft.channel;

    const url = editingRuleId ? `${V2_ENDPOINTS.templateRuleById(editingRuleId)}` : V2_ENDPOINTS.templateRules;
    const method = editingRuleId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to save rule");

    setRuleMessage(editingRuleId ? "Rule updated successfully" : "Rule created successfully");
    setRuleFormOpen(false);
    setEditingRuleId(null);
    setRuleDraft({
      template_code: "",
      category: "salary_increase",
      priority: 100,
      is_default: false,
      active: true,
      active_from: "",
      active_to: "",
      customer_tier: "",
      account_type: "",
      recommended_product: "",
      balance_min: "",
      balance_max: "",
      currency: "",
      channel: "",
    });
    
    await loadTemplateRules(ruleDraft.category);
    await loadRuleConflicts(ruleDraft.category);
  } catch {
    setRuleMessage("Failed to save rule. Check backend and try again.");
  } finally {
    setRuleLoading(false);
    setTimeout(() => setRuleMessage(""), 3000);
  }
}

async function deleteRule(ruleId: number): Promise<void> {
  if (!confirm("Are you sure? This removes the rule from targeting.")) return;

  try {
    const response = await fetch(V2_ENDPOINTS.templateRuleById(ruleId), {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Failed to delete");
    
    setRuleMessage("Rule deleted successfully");
    await loadTemplateRules(selectedRuleCategory);
    await loadRuleConflicts(selectedRuleCategory);
  } catch {
    setRuleMessage("Failed to delete rule");
  }
  setTimeout(() => setRuleMessage(""), 3000);
}

function editRule(rule: TemplateRule): void {
  setRuleDraft({
    template_code: rule.template_code,
    category: rule.category,
    priority: rule.priority,
    is_default: rule.is_default,
    active: rule.active,
    active_from: rule.active_from ? rule.active_from.split("T")[0] : "",
    active_to: rule.active_to ? rule.active_to.split("T")[0] : "",
    customer_tier: rule.customer_tier || "",
    account_type: rule.account_type || "",
    recommended_product: rule.recommended_product || "",
    balance_min: rule.balance_min ? String(rule.balance_min) : "",
    balance_max: rule.balance_max ? String(rule.balance_max) : "",
    currency: rule.currency || "",
    channel: rule.channel || "",
  });
  setEditingRuleId(rule.rule_id);
  setRuleFormOpen(true);
}
```

## 4. useEffect to Load Data

Add this useEffect hook to load initial data:

```typescript
useEffect(() => {
  if (activePage === "template-rules") {
    void loadTemplateRules(selectedRuleCategory);
    void loadRuleConflicts(selectedRuleCategory);
    void loadAuditTrail();
  }
}, [activePage, selectedRuleCategory]);
```

## 5. Update navigate function

Add handling for "template-rules" in the navigate function if needed.

## 6. Add Navigation Link

In the navigation/menu section, add:

```typescript
<button
  className={activePage === "template-rules" ? "active" : ""}
  onClick={() => navigate("template-rules")}
>
  Template Rules
</button>
```

## 7. Add Render Function

Add this to your main render section (in the conditional that checks activePage):

```typescript
function renderTemplateRules() {
  return (
    <div className="cc-page-stack">
      <article className="cc-panel">
        <div className="cc-panel-head">
          <h3>Template Rules & Governance</h3>
          <span>Manage rule-based template selection with conflict detection and audit logging</span>
        </div>
        {renderCustomerToggle()}

        <div className="cc-form-grid">
          <label>
            Select Category
            <select
              value={selectedRuleCategory}
              onChange={(e) => setSelectedRuleCategory(e.target.value)}
            >
              {RULE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </label>
          <button
            className="cc-btn-primary"
            onClick={() => {
              setEditingRuleId(null);
              setRuleDraft({
                template_code: "",
                category: selectedRuleCategory,
                priority: 100,
                is_default: false,
                active: true,
                active_from: "",
                active_to: "",
                customer_tier: "",
                account_type: "",
                recommended_product: "",
                balance_min: "",
                balance_max: "",
                currency: "",
                channel: "",
              });
              setRuleFormOpen(true);
            }}
          >
            + New Rule
          </button>
        </div>

        {ruleMessage && <p className="cc-inline-feedback">{ruleMessage}</p>}
      </article>

      {ruleFormOpen && (
        <article className="cc-panel">
          <div className="cc-panel-head">
            <h3>{editingRuleId ? "Edit Rule" : "Create New Rule"}</h3>
            <span>Define targeting criteria and priority</span>
          </div>

          <div className="cc-form-grid">
            <label>
              Template Code
              <input
                value={ruleDraft.template_code}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, template_code: e.target.value }))}
                placeholder="e.g. SALARY_INCREASE"
              />
            </label>

            <label>
              Priority (Higher = More specific)
              <input
                type="number"
                min="0"
                max="1000"
                value={ruleDraft.priority}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, priority: Number(e.target.value) }))}
              />
            </label>

            <label>
              <input
                type="checkbox"
                checked={ruleDraft.is_default}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, is_default: e.target.checked }))}
              />
              Set as Default
            </label>

            <label>
              <input
                type="checkbox"
                checked={ruleDraft.active}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, active: e.target.checked }))}
              />
              Active
            </label>

            <label>
              Active From (Optional)
              <input
                type="date"
                value={ruleDraft.active_from || ""}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, active_from: e.target.value }))}
              />
            </label>

            <label>
              Active To (Optional)
              <input
                type="date"
                value={ruleDraft.active_to || ""}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, active_to: e.target.value }))}
              />
            </label>

            <label>
              Customer Tier (Optional)
              <select
                value={ruleDraft.customer_tier || ""}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, customer_tier: e.target.value }))}
              >
                <option value="">Not specified</option>
                {CUSTOMER_TIERS.map((tier) => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
            </label>

            <label>
              Account Type (Optional)
              <select
                value={ruleDraft.account_type || ""}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, account_type: e.target.value }))}
              >
                <option value="">Not specified</option>
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Recommended Product (Optional)
              <input
                value={ruleDraft.recommended_product || ""}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, recommended_product: e.target.value }))}
                placeholder="e.g. Savings Account"
              />
            </label>

            <label>
              Min Balance (Optional)
              <input
                type="number"
                min="0"
                value={ruleDraft.balance_min || ""}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, balance_min: e.target.value }))}
                placeholder="0.00"
              />
            </label>

            <label>
              Max Balance (Optional)
              <input
                type="number"
                min="0"
                value={ruleDraft.balance_max || ""}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, balance_max: e.target.value }))}
                placeholder="999999999.99"
              />
            </label>

            <label>
              Currency (Optional)
              <input
                value={ruleDraft.currency || ""}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, currency: e.target.value }))}
                placeholder="NGN"
              />
            </label>

            <label>
              Channel (Optional)
              <select
                value={ruleDraft.channel || ""}
                onChange={(e) => setRuleDraft((prev) => ({ ...prev, channel: e.target.value }))}
              >
                <option value="">Not specified</option>
                {CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
            <button className="cc-btn-primary" onClick={() => void createRule()} disabled={ruleLoading}>
              {ruleLoading ? "Saving..." : editingRuleId ? "Update Rule" : "Create Rule"}
            </button>
            <button className="cc-btn-soft" onClick={() => setRuleFormOpen(false)}>
              Cancel
            </button>
          </div>
        </article>
      )}

      {templateRules.length > 0 && (
        <article className="cc-panel">
          <div className="cc-panel-head">
            <h3>Active Rules for {selectedRuleCategory}</h3>
            <span>{templateRules.length} rule(s) found</span>
          </div>

          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Priority</th>
                  <th>Default</th>
                  <th>Tier</th>
                  <th>Account Type</th>
                  <th>Balance Range</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templateRules.map((rule) => (
                  <tr key={rule.rule_id}>
                    <td>{rule.template_code}</td>
                    <td>{rule.priority}</td>
                    <td>{rule.is_default ? "✓" : "—"}</td>
                    <td>{rule.customer_tier or "—"}</td>
                    <td>{rule.account_type || "—"}</td>
                    <td>
                      {rule.balance_min || rule.balance_max
                        ? `₦${rule.balance_min || "0"} - ₦${rule.balance_max || "∞"}`
                        : "—"}
                    </td>
                    <td>{rule.active ? "✓" : "✗"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          className="cc-btn-soft"
                          onClick={() => editRule(rule)}
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        >
                          Edit
                        </button>
                        <button
                          className="cc-btn-soft"
                          onClick={() => void deleteRule(rule.rule_id)}
                          style={{ fontSize: "12px", padding: "4px 8px", color: "#dc2626" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {ruleConflicts.length > 0 && (
        <article className="cc-panel" style={{ backgroundColor: "#fef3c7", borderLeftColor: "#f59e0b" }}>
          <div className="cc-panel-head">
            <h3>⚠ Rule Conflicts Detected</h3>
            <span>{ruleConflicts.length} conflict(s) found in this category</span>
          </div>
          <p>Multiple rules at same priority match the same customer segments. Consider adjusting priorities:</p>
          <ul style={{ marginTop: "12px" }}>
            {ruleConflicts.map((c, i) => (
              <li key={i}>
                Priority {c.priority}: {c.left_rule?.template_code} ↔ {c.right_rule?.template_code}
              </li>
            ))}
          </ul>
        </article>
      )}

      <article className="cc-panel">
        <div className="cc-panel-head">
          <h3>Template Selection Audit Trail</h3>
          <span>Last 100 template selections</span>
        </div>

        {auditEntries.length > 0 ? (
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Selected Template</th>
                  <th>Reason</th>
                  <th>Fallback</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.slice(0, 20).map((entry) => (
                  <tr key={entry.audit_id}>
                    <td>{new Date(entry.audit_id).toLocaleString()}</td>
                    <td>CUS-{entry.customer_id.toString().padStart(5, "0")}</td>
                    <td>{entry.category}</td>
                    <td>{entry.selected_template_code}</td>
                    <td>{entry.selection_reason}</td>
                    <td>{entry.was_fallback ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No selection audit entries yet</p>
        )}
      </article>
    </div>
  );
}
```

## Integration Steps

1. Add types before existing types
2. Add API endpoints to V2_ENDPOINTS
3. Add state variables in Home component
4. Add rule constants
5. Add API/handler functions
6. Add useEffect hook
7. Add navigation link
8. Add renderTemplateRules() function and call it inside the main conditional that renders pages

Then add to the main page rendering:

```typescript
{activePage === "template-rules" && renderTemplateRules()}
```

That's the complete integration!
