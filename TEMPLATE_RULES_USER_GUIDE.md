# Template Rules - Complete User Guide

## What Are Template Rules?

Template Rules control which email template is sent to a customer based on their profile and situation. Instead of always sending the same email to everyone, template rules let you:

- Send **different emails** to different customer tiers (TIER1, TIER2, TIER3)
- Target by **account type** (Savings vs Current)
- Consider **balance ranges** (customers with ₦100k+ get one template, others get another)
- Set **time windows** (campaign only runs Jan 15-31)
- Define **priorities** (more specific rules match first)

---

## Getting Started

### Step 1: Navigate to Template Rules Page

1. In the left sidebar, look for **"Operations"** section
2. Click **"Template Rules"** button
3. You'll see a form to create rules and a list of existing rules

### Step 2: Select a Category

Before creating rules, choose which life event you want to manage:

- **Salary Increase** - For salary payment events
- **School Fees** - For school fee payment patterns
- **FX Activity** - For forex transactions
- **Rent Payment** - For rent payment patterns
- **Loan Repayment** - For loan repayment patterns
- **Child Turns 18** - For age milestone events
- **Account Tier Migration** - For account upgrade events

The category dropdown is at the top of the page. Select one, and the page will show rules **only for that category**.

---

## Creating Your First Rule

### Example 1: Basic Rule (No Constraints)

**Scenario**: You want all "Salary Increase" events to use the `SALARY_INCREASE_DEFAULT` template.

1. Select category: **"Salary Increase"**
2. Click **"+ New Rule"** button
3. Fill in the form:
   - **Template Code**: `SALARY_INCREASE_DEFAULT`
   - **Priority**: `100`
   - **Set as Default**: ✓ CHECK (important!)
   - Leave rest blank
4. Click **"Create Rule"**
5. ✅ Rule appears in the table below

**What happens now**: Any Salary Increase event without a more specific rule will use this template.

---

### Example 2: Tier-Specific Rule (With Constraint)

**Scenario**: VIP customers (TIER1) should get a premium template for salary increases.

1. Select category: **"Salary Increase"**
2. Click **"+ New Rule"**
3. Fill in:
   - **Template Code**: `SALARY_INCREASE_PREMIUM`
   - **Priority**: `200` (higher than the default)
   - **Customer Tier**: `TIER1`
   - Leave rest blank
4. Click **"Create Rule"**

**What happens**: 
- When a TIER1 customer has a salary increase → Uses `SALARY_INCREASE_PREMIUM`
- When a TIER2/TIER3 customer has a salary increase → Uses `SALARY_INCREASE_DEFAULT`

---

### Example 3: Balance Range Rule

**Scenario**: Customers with balance ₦500k+ get an investment offer template.

1. Select category: **"Salary Increase"**
2. Click **"+ New Rule"**
3. Fill in:
   - **Template Code**: `SALARY_INCREASE_INVESTMENT`
   - **Priority**: `150`
   - **Min Balance**: `500000`
   - Leave rest blank (applies to all tiers/account types)
4. Click **"Create Rule"**

**What happens**:
- Salary increase + Balance ≥ ₦500k → `SALARY_INCREASE_INVESTMENT`
- Salary increase + Balance < ₦500k → Uses default template

---

### Example 4: Complex Rule (Multiple Constraints)

**Scenario**: Current account holders in TIER1 with balance >₦1M get ultra-premium treatment.

1. Select category: **"Salary Increase"**
2. Click **"+ New Rule"**
3. Fill in:
   - **Template Code**: `SALARY_ULTRA_PREMIUM`
   - **Priority**: `300` (highest)
   - **Customer Tier**: `TIER1`
   - **Account Type**: `Current`
   - **Min Balance**: `1000000`
4. Click **"Create Rule"**

**What happens**:
- TIER1 + Current + ₦1M+ → `SALARY_ULTRA_PREMIUM`
- Any other combination → Falls back to other rules based on their priorities

---

## Understanding Priority

**Priority = Selection Order**

Higher priority = checked first

### Priority Example:

Imagine 3 Salary Increase rules:

| Template | Priority | Customer Tier | Min Balance |
|----------|----------|---------------|------------|
| ULTRA_PREMIUM | 300 | TIER1 | ₦1M+ |
| PREMIUM | 200 | TIER1 | Any |
| DEFAULT | 100 | Any | Any |

When a TIER1 customer with ₦1.5M receives salary increase:
1. Check Priority 300: ✓ Matches (TIER1 + ₦1.5M > ₦1M)
2. **Use ULTRA_PREMIUM** ← Stops here, highest match wins

If the same customer had ₦500k:
1. Check Priority 300: ✗ Doesn't match (balance only ₦500k, needs ₦1M+)
2. Check Priority 200: ✓ Matches (TIER1)
3. **Use PREMIUM** ← Wins

If a TIER2 customer with any balance:
1. Check Priority 300: ✗ (Not TIER1)
2. Check Priority 200: ✗ (Not TIER1)
3. Check Priority 100: ✓ Matches (no constraints)
4. **Use DEFAULT** ← Wins

---

## Default Rules

**What's a Default Rule?**

A default rule is like a "catch-all" - used when NO specific rule matches.

### Rules:
- ✓ Every category should have ONE default rule
- ✓ Only ONE rule per category can have "Set as Default" checked
- ✓ Backend automatically demotes old defaults when you create a new one
- ✗ Cannot delete the last active default in a category

### Example:
```
TIER1 + ₦1M+ rule → No match
├─ TIER1 rule → No match  
└─ DEFAULT rule → Used! ✓
```

---

## Using Time Windows (Optional)

**Scenario**: Run a back-to-school promotion only in August-September.

1. Create rule: `SCHOOL_FEES_PROMO`
2. Set **Active From Date**: `2026-08-01`
3. Set **Active To Date**: `2026-09-30`
4. Click **"Create Rule"**

**What happens**:
- Aug 1 - Sep 30: Rule is active and can match
- Other times: Rule is skipped, uses default

---

## Editing Rules

### To Edit a Rule:

1. Find the rule in the table below **"Active Rules"**
2. Click the **"Edit"** button for that rule
3. Form opens with current values filled in
4. Make changes
5. Click **"Update Rule"**

**Note**: You cannot change the template code or category - these define the rule. If you need different code, delete and create new.

---

## Deleting Rules

### To Delete a Rule:

1. Click **"Delete"** button next to the rule
2. Confirm dialog appears
3. Click "OK" to confirm deletion

### ⚠️ Important:
- Cannot delete the **last active default** in a category
- Error message will tell you why if this happens
- Solution: Create a new default first, then delete the old one

---

## Conflict Detection (⚠️ Yellow Warning)

**What's a Conflict?**

Two rules at the **same priority** that could match the **same customer**.

### Example of Conflict:

| Template | Priority | Tier |
|----------|----------|------|
| A | 200 | TIER1 |
| B | 200 | TIER1 |

Both have priority 200 and match TIER1 customers → **CONFLICT**

### What It Means:
- System doesn't know which rule to use
- Template selection becomes unpredictable

### How to Fix:
Change one rule's priority to be higher or lower.

**Example fix**:

| Template | Priority | Tier |
|----------|----------|------|
| A | 200 | TIER1 |
| B | 250 | TIER1 |

Now B (250) is checked first → No conflict

---

## Audit Trail (Bottom Section)

**What It Shows:**

Every time a template is selected for an email, it's logged here.

### Reading the Audit:

| Customer ID | Category | Selected Template | Reason | Fallback |
|-----------|----------|-----------------|--------|----------|
| CUS-00001 | salary_increase | SALARY_PREMIUM | Active rule matched | No |
| CUS-00002 | salary_increase | SALARY_DEFAULT | Default rule used | No |
| CUS-00003 | salary_increase | SALARY_INCREASE | Fallback mapping | Yes |

- **Reason = "Active rule matched"**: A specific rule with constraints matched
- **Reason = "Default rule used"**: No specific rule matched, default was used
- **Reason = "Fallback mapping"**: No rule in database, hardcoded fallback used
- **Fallback column**: Whether this used the emergency fallback template

### Use the Audit To:
- Verify correct template was sent ✓
- Debug why a rule didn't match ✓
- Track customer journey ✓

---

## Practical Workflow

### Complete Example: Back-to-School Campaign

**Goal**: Run a targeted back-to-school promotion in August

**Step 1**: Go to **"School Fees"** category

**Step 2**: Create Rule #1 (Premium)
```
Template Code: SCHOOL_FEES_PREMIUM
Priority: 200
Customer Tier: TIER1
Active From: 2026-08-01
Active To: 2026-08-31
Set as Default: NO
```

**Step 3**: Create Rule #2 (Regular)
```
Template Code: SCHOOL_FEES_REGULAR
Priority: 150
Customer Tier: TIER2
Active From: 2026-08-01
Active To: 2026-08-31
Set as Default: NO
```

**Step 4**: Create Rule #3 (Default/Fallback)
```
Template Code: SCHOOL_FEES_STANDARD
Priority: 100
(No constraints)
Set as Default: YES
```

**Result**: 
- Aug: TIER1 gets premium, TIER2 gets regular, others get standard
- Sep onward: All get standard (rules 1-2 inactive due to date window)

---

## Common Questions

### Q: Can I target by both Tier AND Product?
**A:** Yes! Fill in both fields, rule only matches if BOTH match.

### Q: What if I don't set "Active From" date?
**A:** Rule starts immediately and never expires (runs forever).

### Q: Can I deactivate a rule without deleting it?
**A:** Currently no. Create without the "Active" checkbox unchecked if you want to disable it, or delete and recreate later.

### Q: Why can't I edit the Template Code?
**A:** Template code defines which template the rule uses. To change it, delete and create a new rule.

### Q: What's the difference between Min/Max Balance?
**A:** 
- **Min Balance**: Customer must have AT LEAST this much
- **Max Balance**: Customer must have AT MOST this much
- Both optional; if blank = any balance

### Q: Can I have 0 in Min Balance?
**A:** Yes, that means "any balance above zero"

### Q: How do conflicts get resolved automatically?
**A:** First rule checked (by priority) wins. If two rules have same priority and both match, the one with highest Rule ID wins.

### Q: Where does the audit data come from?
**A:** Automatically logged whenever a recommendation is made and sent.

---

## Tips & Best Practices

### ✓ DO:
- Start with a basic default rule
- Add specific rules as needed
- Use priorities strategically (gap them by 50-100)
- Check for conflicts regularly
- Review audit trail weekly

### ✗ DON'T:
- Delete rules without backup plan
- Set all rules to default = true (system will demote them)
- Use very small priority gaps (harder to insert new rules later)
- Leave many conflicting rules (causes confusion)
- Forget time windows are inclusive dates (01:00-23:59)

---

## Troubleshooting

### Rule not matching customers?
1. Check rule is **"Active"** checkbox is checked
2. Verify date window (if set) includes today
3. Check all constraints match actual customer data
4. Review audit trail to see what DID match

### Getting "Cannot delete last default" error?
1. Create new default rule for this category first
2. Then delete the old one

### Seeing yellow conflict warning?
1. Find which rules conflict (shown in warning)
2. Increase one rule's priority
3. Or add more constraints to make them different

### Template not being sent?
1. Check rule exists and is active
2. Check template code matches actual template
3. Check audit trail to see if rule matched
4. Check user's email settings are correct

---

## Next Steps

1. **Create your first rule** - Follow Example 1 above
2. **Test it** - Trigger an event that should match
3. **Check audit trail** - Verify it used your rule
4. **Add more rules** - Build your targeting strategy
5. **Monitor conflicts** - Fix any yellow warnings

You're ready to go! 🚀
