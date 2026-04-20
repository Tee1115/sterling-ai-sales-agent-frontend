# Template Rules - Implementation Checklist

## Pre-Launch Checklist (Week Before Going Live)

### Frontend Verification ✓

- [ ] `TemplateRulesPage.tsx` fully functional locally
- [ ] Create rule form validates all inputs
- [ ] Edit rule form works correctly
- [ ] Delete rule confirmation works
- [ ] Conflict detection shows yellow ⚠️ when needed
- [ ] Audit trail loads and displays correctly
- [ ] Category dropdown shows all 7 categories
- [ ] Date picker works correctly
- [ ] All error messages are clear
- [ ] Loading spinners appear during API calls
- [ ] Mobile responsive (tablet/mobile device testing)

### Backend API Verification ✓

- [ ] All endpoints return 200-201 status codes
- [ ] Validation rejects invalid inputs
- [ ] Cannot delete last default rule (returns 400 error)
- [ ] Conflict detection algorithm works
- [ ] Audit logging captures all selections
- [ ] Authentication/permissions working
- [ ] CORS headers set correctly for frontend
- [ ] Rate limiting not interfering
- [ ] Database migrations applied successfully
- [ ] Indexes created on audit table

### Data Preparation ✓

- [ ] Template library populated with all template codes
- [ ] Verify sample template codes work:
  - SALARY_INCREASE_DEFAULT
  - SALARY_INCREASE_PREMIUM
  - SCHOOL_FEES_DEFAULT
  - SCHOOL_FEES_PROMO
  - (etc. - one per category minimum)
- [ ] Customer test data has correct tier values (TIER1, TIER2, TIER3)
- [ ] Balance field populated for test customers
- [ ] Account type values consistent (Savings vs Current)

### Documentation Review ✓

- [ ] User guide complete: [TEMPLATE_RULES_USER_GUIDE.md](TEMPLATE_RULES_USER_GUIDE.md)
- [ ] Quick start guide complete: [TEMPLATE_RULES_QUICKSTART.md](TEMPLATE_RULES_QUICKSTART.md)
- [ ] Technical docs complete: [TEMPLATE_RULES_TECHNICAL_DOCS.md](TEMPLATE_RULES_TECHNICAL_DOCS.md)
- [ ] README updated with documentation links
- [ ] All guides reviewed by team lead
- [ ] Grammar/spelling checked
- [ ] Screenshots/examples validate current UI

### Testing ✓

- [ ] Create rule test: ✓ API returns 201, rule appears in table
- [ ] Edit rule test: ✓ Changes save, appear immediately
- [ ] Delete rule test: ✓ Rule removed from table
- [ ] Default rule test: ✓ Can't delete last default
- [ ] Conflict detection test: ✓ Yellow warning shows
- [ ] Time window test: ✓ Rule inactive outside date range
- [ ] Priority ordering test: ✓ Higher priority checked first
- [ ] Balance constraint test: ✓ Min/max balance filters work
- [ ] Tier constraint test: ✓ Only selected tier matches
- [ ] Account type constraint test: ✓ Only selected type matches
- [ ] Audit trail test: ✓ Selections logged correctly
- [ ] Empty state test: ✓ No rules = clear message
- [ ] Pagination test: ✓ Large rule lists paginate
- [ ] Search/filter test: ✓ Rules filter by category

### Security ✓

- [ ] Only operations team can create/edit/delete rules
- [ ] Audit viewing requires auth
- [ ] API validates user permissions
- [ ] No sensitive data in audit trail
- [ ] SQL injection tests pass
- [ ] XSS attack vectors blocked
- [ ] CSRF tokens working
- [ ] Rate limiting prevents abuse
- [ ] Soft delete option considered

### Performance ✓

- [ ] Rule creation < 500ms
- [ ] Rule update < 500ms
- [ ] Rule deletion < 500ms
- [ ] List rules loads < 1s (100 rules)
- [ ] Audit trail loads < 2s (1000 records)
- [ ] Database queries optimized (no N+1)
- [ ] Frontend renders smoothly (60fps)
- [ ] No memory leaks in React components

---

## Staging Environment Testing (Day Before Launch)

### Integration Testing ✓

- [ ] Frontend connects to staging backend
- [ ] All CRUD operations work end-to-end
- [ ] Email agent receives template recommendation from API
- [ ] Email agent logs selection to audit trail
- [ ] Template selection algorithm matches rules correctly
- [ ] Conflict detection catches all conflicts
- [ ] Date windows enforce correctly (test edge cases)
- [ ] Default rule serves as true fallback
- [ ] Fallback template used when no rules exist

### Load Testing ✓

- [ ] 10 concurrent rule creations ✓
- [ ] 50 audit trail queries simultaneously ✓
- [ ] Database load acceptable under stress
- [ ] API response times stay < 1s under load
- [ ] Frontend doesn't freeze during large audit loads

### Backup & Recovery ✓

- [ ] Database backup contains all rules
- [ ] Backup restore tested
- [ ] Audit trail backup separate (for long-term retention)
- [ ] Disaster recovery procedure documented
- [ ] Rollback plan if needed

---

## Launch Day Checklist

### Pre-Launch (1 hour before)

- [ ] All systems green (no errors in logs)
- [ ] Team assembled and ready
- [ ] Communication channels open (Slack, Teams)
- [ ] Monitoring dashboard up and running
- [ ] Incident response plan reviewed
- [ ] Support team briefed
- [ ] Default rules exist in all 7 categories
- [ ] One test rule created per category

### During Launch

- [ ] Monitor audit trail in real-time
- [ ] Check API error rates (should be <1%)
- [ ] Verify frontend loading speed
- [ ] Test rule creation with first live customer
- [ ] Confirm email template selection working
- [ ] Watch for database performance issues
- [ ] Check for any unexpected errors

### Post-Launch (First 24 hours)

- [ ] 100+ successful template selections confirmed
- [ ] Audit trail populated correctly
- [ ] No incorrect template selections reported
- [ ] Fallback mechanisms not being triggered
- [ ] Performance metrics within acceptable ranges
- [ ] Team familiar with monitoring dashboards
- [ ] Operations team comfortable creating rules

---

## Operational Readiness (Week 1)

### Team Training ✓

- [ ] Operations team trained on user guide
- [ ] 5 minute quick-start demonstrated
- [ ] Common tasks practiced (create, edit, delete)
- [ ] Conflict resolution demonstrated
- [ ] Audit trail review shown
- [ ] Troubleshooting scenarios covered

### Documentation ✓

- [ ] All guides posted to team wiki/confluence
- [ ] Quick reference card printed (for ops desk)
- [ ] Contact list for support issues
- [ ] Emergency procedures documented

### Monitoring Setup ✓

- [ ] Alert set if > 10% fallback usage (means rules failing)
- [ ] Alert set if conflicts detected
- [ ] Alert set if database queries slow (> 2s)
- [ ] Daily audit trail summary to team
- [ ] Weekly rule effectiveness report

### Initial Rule Creation ✓

- [ ] Default rule for each of 7 categories ✓
- [ ] One test rule per category ✓
- [ ] Test rules matching expected customers
- [ ] Verify audit trail shows correct selections

---

## Post-Launch Monitoring (Ongoing)

### Weekly Tasks

- [ ] Review audit trail for anomalies
- [ ] Check for new conflicts
- [ ] Verify no expired rules still active
- [ ] Review template code usage (are new codes needed?)
- [ ] Check if rules need adjustment based on audit data

### Monthly Tasks

- [ ] Performance review (database size, query times)
- [ ] Rule effectiveness review (are right templates being used?)
- [ ] Archive old audit records (if > 1M records)
- [ ] Update documentation based on user feedback
- [ ] Identify optimization opportunities

### Quarterly Tasks

- [ ] Full system health check
- [ ] User feedback review and feature requests
- [ ] Security audit of permissions
- [ ] Database schema optimization review

---

## Category Initialization (First Week)

**For each of the 7 categories**, complete this:

### 1. Salary Increase ✓
- [ ] Template codes identified
  - [ ] SALARY_INCREASE_DEFAULT (required)
  - [ ] SALARY_INCREASE_PREMIUM (optional)
  - [ ] SALARY_INCREASE_INVESTMENT (optional)
- [ ] Default rule created
- [ ] Test rule created
- [ ] Audit trail shows selections

### 2. School Fees ✓
- [ ] Template codes identified
  - [ ] SCHOOL_FEES_DEFAULT (required)
  - [ ] SCHOOL_FEES_PROMO (optional)
- [ ] Default rule created
- [ ] Test rule with date window
- [ ] Verify time window enforcement

### 3. FX Activity ✓
- [ ] Template codes identified
  - [ ] FX_DEFAULT (required)
  - [ ] FX_PREMIUM (optional)
- [ ] Default rule created
- [ ] Balance-based rule (if applicable)

### 4. Rent Payment ✓
- [ ] Template codes identified
  - [ ] RENT_DEFAULT (required)
- [ ] Default rule created
- [ ] Test tier-based rules

### 5. Loan Repayment ✓
- [ ] Template codes identified
  - [ ] LOAN_DEFAULT (required)
- [ ] Default rule created
- [ ] Multi-constraint rule (if applicable)

### 6. Child Turns 18 ✓
- [ ] Template codes identified
  - [ ] CHILD_18_DEFAULT (required)
- [ ] Default rule created
- [ ] Age-based targeting (if available)

### 7. Account Tier Migration ✓
- [ ] Template codes identified
  - [ ] TIER_MIGRATION_DEFAULT (required)
  - [ ] TIER_MIGRATION_CONGRATULATIONS (optional)
- [ ] Default rule created
- [ ] Tier-specific rules created

---

## Rollback Plan (If Issues Found)

**If major bugs found post-launch:**

1. [ ] Immediately disable new rules (flip frontend flag to hidden)
2. [ ] Keep email agent using old hardcoded templates
3. [ ] Document the issue
4. [ ] Fix in development environment
5. [ ] Re-test thoroughly
6. [ ] Re-launch with warning to team

**If data integrity issues:**

1. [ ] Stop email sending immediately
2. [ ] Restore database from last known good backup
3. [ ] Audit trail will show what went wrong
4. [ ] Investigate root cause
5. [ ] Fix and test thoroughly before re-enabling

---

## Success Metrics (Track These)

### Technical Metrics ✓

- [ ] API response time < 500ms (p95)
- [ ] Frontend load time < 2s
- [ ] Database query time < 200ms (p95)
- [ ] Error rate < 1%
- [ ] Zero data loss incidents
- [ ] 99.9% uptime

### Operational Metrics ✓

- [ ] Rules created per week (target: 5+)
- [ ] Rules edited per week (target: 2+)
- [ ] Audit trail queries per day (shows engagement)
- [ ] Average time to create rule < 5 minutes
- [ ] Zero wrong template sends (audit trail shows 100% correct)

### Business Metrics ✓

- [ ] Customers receiving targeted messages
- [ ] Template relevance improving
- [ ] Click-through rate up on targeted emails
- [ ] Operations team satisfaction (survey)
- [ ] Support tickets related to templates (target: <1/week)

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Rules not matching | Priority ordering wrong | Check ordering in UI |
| Cannot delete default | System preventing it | Create new default first |
| Audit shows fallback | No rules active | Check rule date windows |
| Conflicts appearing | Same priority + overlap | Change priority by 50+ |
| Slow rule creation | Database indexes missing | Ask DBA to create indexes |
| Wrong template sent | Rule priority incorrect | Reorder rules by priority |
| Date window ignored | Timezone mismatch | Check server timezone |

---

## Sign-Off Checklist

**Project Lead**: ☐ Approve for launch

**Backend Team Lead**: ☐ API fully tested

**Frontend Team Lead**: ☐ UI fully tested

**Operations Lead**: ☐ Team trained

**Security Team**: ☐ Security review passed

**Database Team**: ☐ Schema and indexes ready

**Support Team**: ☐ Ready to handle inquiries

---

## Post-Launch Contact Info

**Have questions?**
- Operations Support: [contact]
- Technical Support: [contact]
- Incident Response: [contact]

**Documentation**:
- User Guide: [TEMPLATE_RULES_USER_GUIDE.md](TEMPLATE_RULES_USER_GUIDE.md)
- Quick Start: [TEMPLATE_RULES_QUICKSTART.md](TEMPLATE_RULES_QUICKSTART.md)
- Technical Docs: [TEMPLATE_RULES_TECHNICAL_DOCS.md](TEMPLATE_RULES_TECHNICAL_DOCS.md)

**Key Contacts**:
- Product Owner: [name]
- Tech Lead: [name]
- Database Admin: [name]

---

## Sign-Off Sheet

**Date**: ___________

| Role | Name | Approval | Date |
|------|------|----------|------|
| Project Lead | | ☐ | |
| Backend Lead | | ☐ | |
| Frontend Lead | | ☐ | |
| Ops Lead | | ☐ | |
| Security Lead | | ☐ | |

**Notes**:
_________________________________________________________________________

_________________________________________________________________________

**Ready to launch**: ☐ YES   ☐ NO

