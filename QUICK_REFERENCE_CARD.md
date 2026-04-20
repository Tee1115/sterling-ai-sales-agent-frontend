# Template Rules - Quick Reference Card
## Print This for Your Desk!

---

## 🚀 YOUR FIRST RULE (5 Minutes)

### Step 1: Open Template Rules
1. Find **"Operations"** in sidebar
2. Click **"Template Rules"**

### Step 2: Choose Category
Select from dropdown:
- Salary Increase
- School Fees
- FX Activity
- Rent Payment
- Loan Repayment
- Child Turns 18
- Account Tier Migration

### Step 3: Create Default Rule
Click **"+ New Rule"**:
- **Template Code**: `SALARY_INCREASE_DEFAULT` (example)
- **Priority**: `100`
- ✓ CHECK: **"Set as Default"**
- Click **"Create Rule"**

✅ Done! Your first rule is live.

---

## 🎯 PRIORITY SYSTEM

**Higher number = Checked first**

```
300 ← TIER1 (Premium) - checked first
200 ← TIER2 (Standard) - checked second  
100 ← Everyone (Default) - fallback
```

**Rule of thumb**: Gap by 25-50
- Salary Increase: 100 (default), 150, 200, 250
- School Fees: 100 (default), 150, 200

---

## ⚙️ COMMON PARAMETERS

| Parameter | Example | Use Case |
|-----------|---------|----------|
| **Template Code** | SALARY_PREMIUM | Which template to send |
| **Priority** | 200 | Check order |
| **Customer Tier** | TIER1 | Target VIP customers |
| **Account Type** | Current | Target specific accounts |
| **Min Balance** | 500000 | Target wealthy customers |
| **Max Balance** | 100000 | Target budget customers |

---

## 📅 TIME WINDOWS

**Run campaign Aug 1-31 only?**

- **Active From Date**: `2026-08-01`
- **Active To Date**: `2026-08-31`

Rule is **inactive outside dates**.

---

## ⚠️ CONFLICTS (Yellow Warning)

**Two rules at SAME priority matching SAME customers**

**Example conflict**:
```
Rule A: Priority 200, Tier=TIER1
Rule B: Priority 200, Tier=TIER1
```

**Fix it**:
```
Rule A: Priority 200, Tier=TIER1
Rule B: Priority 250, Tier=TIER1  ← Changed!
```

---

## 🧪 TEST YOUR RULE

1. Create rule (5 min)
2. Go to **Audit Trail** (bottom section)
3. Look for your customer
4. Check **"Selected Template"** column
5. Verify correct template was used

---

## 🐛 QUICK TROUBLESHOOTING

| Problem | Check |
|---------|-------|
| Rule not matching | Is it active? (date window) |
| | Does tier match customer? |
| | Is balance in range? |
| | Check priority order |
| | Look at audit trail |
| Wrong template sent | Check priority (higher wins) |
| Cannot delete rule | It's the last default |
| | Create new default first |
| Conflicts warning | Change one priority |
| | Or add differentiating constraint |

---

## 📋 AUDIT TRAIL = SELECTION LOG

**Shows every template selection made**

| Column | Means |
|--------|-------|
| Customer ID | Who got the email |
| Category | What event triggered it |
| Selected Template | Which template was sent |
| Reason | Why that template |
| Fallback | Emergency fallback? |

**Read "Reason" column**:
- "Active rule matched" = Your rule worked ✓
- "Default rule used" = No specific rule matched
- "Fallback mapping" = No rules at all (!)

---

## ✅ BEST PRACTICES

**DO:**
- ✓ Start with simple default rule
- ✓ Add complex rules gradually
- ✓ Gap priorities by 25-50
- ✓ Check audit trail weekly
- ✓ Fix conflicts immediately

**DON'T:**
- ✗ Delete your last default
- ✗ Have overlapping priorities
- ✗ Use vague template codes
- ✗ Leave conflicts unfixed
- ✗ Forget date windows are inclusive

---

## 💡 EXAMPLES

### Example 1: All Customers Get Same Template
```
Rule: SALARY_INCREASE_DEFAULT
Priority: 100
(no constraints)
✓ Default: YES
```

### Example 2: VIPs Get Premium
```
Rule 1: DEFAULT
Priority: 100
(no constraints, ✓ default)

Rule 2: PREMIUM
Priority: 200
Tier: TIER1
(no default)
```

### Example 3: Time-Limited Campaign (Aug Only)
```
Rule: SCHOOL_PROMO
Priority: 150
Active From: 2026-08-01
Active To: 2026-08-31
(can be any template)
```

### Example 4: Wealthy Customers
```
Rule: INVESTMENT_OFFER
Priority: 150
Min Balance: 1000000
(targets ₦1M+)
```

---

## 🎓 LEARNING RESOURCES

**Need more help?**
- Quick Start: 30 min detailed walkthrough
- User Guide: Complete reference
- Technical Docs: For developers
- Index: Navigation guide

All docs here:
`ai-sales-agent-frontend` folder

---

## 📞 QUICK CONTACTS

**Operations Help**: [contact]
**Technical Issues**: [contact]
**Template Questions**: [contact]

---

## 🔗 QUICK LINKS

- **Quick Start**: TEMPLATE_RULES_QUICKSTART.md
- **Full Guide**: TEMPLATE_RULES_USER_GUIDE.md
- **Navigation**: TEMPLATE_RULES_INDEX.md
- **Troubleshooting**: TEMPLATE_RULES_USER_GUIDE.md#troubleshooting

---

## 📊 YOUR FIRST CAMPAIGN: Step-by-Step

**Goal: Send different emails to TIER1 vs Others for salary increase**

**Time: 15 minutes**

### Step 1 (3 min): Create default rule
- Category: Salary Increase
- Template Code: SALARY_INCREASE_STANDARD
- Priority: 100
- ✓ Set as Default

### Step 2 (3 min): Create VIP rule
- Category: Salary Increase
- Template Code: SALARY_INCREASE_PREMIUM
- Priority: 200
- Tier: TIER1

### Step 3 (2 min): Verify priority
- Check dashboard shows:
  - Priority 200 (TIER1) above
  - Priority 100 (default) below

### Step 4 (2 min): Test
- Check audit trail
- Verify TIER1 customer got PREMIUM
- Verify TIER2 customer got STANDARD

### Step 5 (5 min): Adjust if needed
- If wrong template sent, check priority
- If conflict warning, change priority
- If missing, check date window

✅ Campaign now live!

---

## 🎯 SUCCESS CHECKLIST

Running your first campaign? Check these:

- [ ] Created default rule ✓
- [ ] Created targeted rule ✓
- [ ] No conflicts (no yellow warnings) ✓
- [ ] Priorities set correctly ✓
- [ ] Audit trail shows right templates ✓
- [ ] Team trained on this card ✓

---

## 🚨 EMERGENCY FIXES

**Something went wrong? Quick fixes:**

### Wrong Template Being Sent
1. Check audit trail
2. Find which rule is matching
3. Increase its priority OR
4. Add constraints to differentiate rules

### Rule Not Matching Anyone
1. Check date window (not expired?)
2. Check constraints match your customers
3. Check tier/account type values
4. Look at audit trail to see what DID match

### Can't Create Rule
1. Template code must exist
2. Category must be selected
3. Priority can't conflict (usually fixable)
4. Check error message for details

### Can't Delete Rule
1. It's probably the last default
2. Create new default first
3. THEN delete old one

---

## 📈 WHAT TO MONITOR

**Weekly check**:
- [ ] Audit trail shows selections
- [ ] No conflicts warning
- [ ] Correct templates being sent
- [ ] No high fallback rate

**Monthly check**:
- [ ] Rules still relevant?
- [ ] Tier distribution changed?
- [ ] Campaigns successful?
- [ ] Team comfortable?

---

## 🎓 DEFINITIONS

**Default Rule**: Catch-all when no other rule matches

**Priority**: Order of checking (higher = first)

**Constraint**: Requirement (tier, balance, account type)

**Time Window**: Date range when rule is active

**Audit Trail**: Log of every template selection

**Conflict**: Two rules could match same customer at same priority

**Fallback**: Emergency template if no rules exist

---

## 🌟 PRO TIPS

1. **Name templates clearly**
   - SALARY_INCREASE_PREMIUM = good
   - SP = bad

2. **Space priorities**
   - Use: 100, 150, 200, 250
   - Not: 100, 101, 102, 103

3. **Check audit weekly**
   - Makes sure right templates sent
   - Catches rule issues early

4. **Fix conflicts immediately**
   - Yellow warning = attention needed
   - Usually just change one priority

5. **Test before campaign**
   - Create rule
   - Check audit trail
   - Verify one customer got right template

---

## ✨ REMEMBER

- **TIER1** = Most valuable customers
- **Priority 200+** = Specific rules
- **Priority 100** = Default (catches all)
- **Higher priority** = Checked first
- **Audit trail** = Your best friend for debugging

---

**Print me out and keep at your desk!**

Questions? See full documentation:
- Quick Start: 30 min guide
- User Guide: Complete reference
- Index: Navigation guide

