# Template Rules - Quick Start Guide

## 5-Minute Setup: Get Your First Rule Running

### Step 1: Log into Operations Panel
1. Open the application
2. Find **"Operations"** in the left sidebar
3. Click **"Template Rules"**

### Step 2: Select a Category
From the dropdown at the top, choose one:
- Salary Increase
- School Fees
- FX Activity
- Rent Payment
- Loan Repayment
- Child Turns 18
- Account Tier Migration

**Tip**: Start with whichever applies to your next campaign

### Step 3: Create a Default Rule (Required)
1. Click **"+ New Rule"** button
2. Fill in:
   - **Template Code**: Ask your admin/template team
     - Example: `SALARY_INCREASE_DEFAULT`
   - **Priority**: `100`
3. CHECK: **"Set as Default"** box
4. Leave everything else blank
5. Click **"Create Rule"**

✅ Done! You now have a fallback rule.

---

## Add Your First Targeted Rule

### Scenario: Premium Emails for VIP (TIER1) Customers

1. Click **"+ New Rule"** again
2. Fill in:
   - **Template Code**: `SALARY_INCREASE_PREMIUM`
   - **Priority**: `200` (higher = checked first)
   - **Customer Tier**: `TIER1`
3. Leave other fields blank
4. Click **"Create Rule"**

✅ Result:
- TIER1 customers → Premium template
- Everyone else → Default template

---

## Common Task: Time-Limited Campaign

**Goal**: Run "Back to School" offer in August only

1. Select **"School Fees"** category
2. Click **"+ New Rule"**
3. Fill in:
   - **Template Code**: `SCHOOL_PROMO_AUGUST`
   - **Priority**: `150`
   - **Active From Date**: `2026-08-01`
   - **Active To Date**: `2026-08-31`
   - Check **"Set as Default"**: NO
4. Click **"Create Rule"**

✅ The rule auto-activates August 1 and deactivates September 1

**Note**: Dates are INCLUSIVE (August 1–31)

---

## Common Task: Balance-Based Targeting

**Goal**: Investment offer for customers with ₦500k+ balance

1. Create rule:
   - **Template Code**: `SALARY_INVESTMENT_OFFER`
   - **Priority**: `150`
   - **Min Balance**: `500000`
2. Click **"Create Rule"**

✅ Only customers with ≥₦500,000 get this template

**Play with it**:
- Raise `Min Balance` to target wealthier customers
- This doesn't affect other rules

---

## Common Task: Multi-Factor Targeting

**Goal**: Premium service for TIER1 + Current Account + High Balance

1. Create rule:
   - **Template Code**: `PREMIUM_VIP_SERVICE`
   - **Priority**: `300`
   - **Customer Tier**: `TIER1`
   - **Account Type**: `Current`
   - **Min Balance**: `1000000`
2. Click **"Create Rule"**

✅ Matches: TIER1 AND Current Account AND ≥₦1M

**All 3 must match**. If customer is TIER1 but has Savings account, rule doesn't match.

---

## Common Task: Edit a Rule

**Looking at your rule and need to change it?**

1. Find the rule in the table below
2. Click **"Edit"** button
3. Change values (but NOT template code or category)
4. Click **"Update Rule"**

**Can't change template code?** - That defines which rule it is. Delete and recreate if needed.

---

## Common Task: Delete a Rule

**Need to remove a rule?**

1. Click **"Delete"** next to the rule
2. Confirm dialog appears
3. Click "OK"

⚠️ **⚠️ Cannot delete the ONLY default rule** - Create a new default first, then delete the old one

---

## Understanding Conflicts (Yellow ⚠️ Warning)

**What's a conflict?**

Two rules at the same priority that match the same customers.

**Example conflict**:

```
Rule A: Priority 200, TIER1
Rule B: Priority 200, TIER1
```

Both match TIER1? → CONFLICT ⚠️

**How to fix it**: Change one rule's priority:

```
Rule A: Priority 200, TIER1
Rule B: Priority 250, TIER1
```

Now rule B (250) is checked first → No conflict ✓

---

## Checking What Actually Happened

### Audit Trail = Selection Log

At the bottom, you'll see **"Latest Template Selections"** - a list of every template selection.

**Read like this**:

| Customer | Category | Template Used | Why | When |
|----------|----------|--------------|-----|------|
| CUS-001 | salary_increase | PREMIUM | Active rule | 2h ago |
| CUS-002 | salary_increase | DEFAULT | Default used | 1h ago |
| CUS-003 | salary_increase | FALLBACK | Emergency | 30m ago |

- **Active rule**: A specific rule matched ✓
- **Default used**: No specific rule, used fallback ✓
- **Emergency fallback**: No rules at all (!!)

---

## Priority System Explained

**Just remember**: Higher number = checked first

### Easy Way to Think About It:

**Priorities are like a restaurant menu**:

```
Priority 300 → Expensive special (most specific)
Priority 200 → Regular item (moderate)
Priority 100 → Cheap default (catches all)
```

Waiter checks:
1. Does customer want the expensive special? (300)
2. No? → Do they want the regular item? (200)
3. No? → Give them the cheap default (100)

### Setting Priority in Your Rules:

- **Priority 100**: Default rule (low priority)
- **Priority 150-200**: Regular specific rules
- **Priority 250+**: VIP/premium specific rules

**Gap them by 10-50** so you can insert new rules later.

---

## Testing Your Rules

### How to Check If Your Rule Works

**Option 1**: Ask admin to trigger event for test customer
- They'll show you if the right template was selected

**Option 2**: Look at Audit Trail
- Sort by newest first
- Look up your customer
- See which template was used
- Check the "Why" column

**Option 3**: Look for yellow conflicts
- If you see ⚠️ warnings, fix them first

---

## Troubleshooting

### Rule Not Working?

**Q: Created a rule but it's not being used?**
- A: Check date window is active (if set)
- Check constraints match your customer (tier, balance, etc)
- Check other rules at higher priority aren't matching first
- Look in audit trail to see what DID match

**Q: Can't delete my rule?**
- A: It's probably the last default rule. Create a new one first.

**Q: Seeing "Conflict" warnings?**
- A: Two rules at same priority could match same customer
- Increase one rule's priority to fix it

**Q: Sent wrong template to customer?**
- A: Check audit trail - see which rule matched
- If wrong rule, adjust priorities or constraints

**Q: Template never gets selected?**
- A: Check template code is spelled correctly
- Make sure code exists in template library
- Ask admin to verify

---

## Pro Tips

### ✓ Do These Things:

1. **Start small** - Begin with one default rule
2. **Add gradually** - Create one new rule, test it, move on
3. **Use clear names** - Template codes like `SALARY_PREMIUM` = good, `SP` = bad
4. **Check conflicts regularly** - Fix ⚠️ warnings when they appear
5. **Review audit monthly** - Make sure right templates are being used
6. **Leave gaps in priority** - Use 100, 150, 200, 250 not 100, 101, 102

### ✗ Don't Do These Things:

1. **Don't cluster rules** - Having 10 rules all at priority 100 is confusing
2. **Don't forget defaults** - Every category needs one
3. **Don't delete without backup** - Recreate new rule before deleting old
4. **Don't set conflicting dates** - "Active From" after "Active To"
5. **Don't ignore warnings** - Fix conflicts as soon as you see them

---

## Real-World Examples

### Example 1: School Fees Campaign (August Only)

**Goal**: Run targeted campaign in August only

Rules needed:
1. Default (always active)
2. School promotion (active Aug 1-31 only)

```
Rule 1: School Fees Default
- Template: SCHOOL_FEES_STANDARD
- Priority: 100
- Active From: (blank)
- Active To: (blank)

Rule 2: School Promo (Aug only)
- Template: SCHOOL_FEES_PROMO
- Priority: 150
- Active From: 2026-08-01
- Active To: 2026-08-31
```

**What happens**:
- Aug 1-31: Customers see promo template
- Sep 1+: Customers see standard template
- No manual switching needed ✓

---

### Example 2: Tiered Salary Increase Campaign

**Goal**: Different templates for different tiers

Rules needed:
1. Default rule
2. TIER1 premium rule
3. TIER2 standard rule

```
Rule 1: Default
- Template: SALARY_BUDGET
- Priority: 100
- Tier: (any)

Rule 2: TIER2 Standard
- Template: SALARY_STANDARD
- Priority: 150
- Tier: TIER2

Rule 3: TIER1 Premium
- Template: SALARY_PREMIUM
- Priority: 200
- Tier: TIER1
```

**What happens**:
- TIER1 → SALARY_PREMIUM (checked first)
- TIER2 → SALARY_STANDARD (checked second)
- TIER3 → SALARY_BUDGET (no rule, use default)

---

### Example 3: Wealth-Based Targeting

**Goal**: Investment offer only for customers with ₦1M+

Rules:
```
Rule 1: Default (everyone)
- Template: SALARY_STANDARD
- Priority: 100
- Min Balance: (blank)

Rule 2: Investment Offer (rich customers)
- Template: SALARY_INVESTMENT
- Priority: 150
- Min Balance: 1000000
```

**What happens**:
- ≥₦1M → SALARY_INVESTMENT
- <₦1M → SALARY_STANDARD

---

### Example 4: Complex Targeting (Multi-Constraint)

**Goal**: Premium service = TIER1 + Current Account + ≥₦500k

Rules:
```
Rule 1: Default
- Template: FX_STANDARD
- Priority: 100
- (no constraints)

Rule 2: Premium VIP
- Template: FX_PREMIUM
- Priority: 200
- Tier: TIER1
- Account Type: Current
- Min Balance: 500000
```

**Matches only if ALL 3 are true**:
1. TIER1 ✓
2. Current account ✓
3. ≥₦500k balance ✓

---

## Next Steps

1. ✅ Create your first default rule (follow 5-minute setup above)
2. ✅ Create one targeted rule (follow tier targeting example)
3. ✅ Check audit trail to see them in action
4. ✅ Adjust priorities if conflicts appear
5. ✅ Expand to more categories when ready

**First rule should take ≤10 minutes. You've got this!** 🚀

---

## Need Help?

**In the app**: Look for "Help" or "?" icons next to fields

**Questions**:
- Who templates are available? → Ask template manager
- Template code already in use? → Check unique names
- Rule not matching? → Post example customer + rule to team channel
- System acting weird? → Check audit trail first, then contact admin

---

## Keyboard Shortcuts (Coming Soon)

Not yet implemented, but planned:
- `Ctrl+K` to quick-create rule
- `Ctrl+Shift+F` to filter audit trail
- `R` on a rule row to edit

Check back in future updates!

