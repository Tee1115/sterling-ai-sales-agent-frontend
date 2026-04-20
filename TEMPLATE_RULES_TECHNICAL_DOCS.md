# Template Rules - Technical Documentation

## System Architecture

### Components

```
Frontend (Next.js)
    ├─ TemplateRulesPage.tsx
    └─ Uses: useTemplateRules hook
        ├─ GET /api/template-rules (fetch rules)
        ├─ POST /api/template-rules (create)
        ├─ PUT /api/template-rules/:id (update)
        ├─ DELETE /api/template-rules/:id (delete)
        └─ GET /api/template-rules/audit (fetch audit)

Backend (Django)
    ├─ models.py
    │   ├─ TemplateRule model
    │   ├─ TemplateRuleAudit model
    │   └─ Validators
    │
    ├─ views.py
    │   ├─ TemplateRuleViewSet (CRUD)
    │   ├─ AuditViewSet (read-only)
    │   └─ TemplateSelectionView (returns recommendation)
    │
    ├─ serializers.py
    │   ├─ TemplateRuleSerializer
    │   ├─ AuditSerializer
    │   └─ Validation logic
    │
    └─ selectors.py
        ├─ get_applicable_rule()
        ├─ get_conflicting_rules()
        └─ get_rules_by_category()

Email Agent (Python)
    └─ When sending email:
        1. Call template_selector.get_recommended_template()
        2. Pass: customer, event_category, constraints
        3. Returns: template_code, selected_rule_id, fallback_used
        4. Log to TemplateRuleAudit
```

---

## Database Schema

### TemplateRule Model

```python
class TemplateRule(models.Model):
    # Identifiers
    rule_id = AutoField(primary_key=True)
    category = CharField(
        choices=TEMPLATE_CATEGORIES,
        help_text="salary_increase, school_fees, fx_activity, etc."
    )
    template_code = CharField(
        max_length=100,
        help_text="References actual template in template database"
    )
    
    # Constraints (optional - NULL = any)
    customer_tier = CharField(
        max_length=20,
        null=True,
        choices=['TIER1', 'TIER2', 'TIER3'],
        help_text="Target specific tier or NULL for all"
    )
    account_type = CharField(
        max_length=50,
        null=True,
        choices=['Savings', 'Current', 'Investment'],
        help_text="Target specific account type or NULL for all"
    )
    min_balance = DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        help_text="Minimum balance in Naira, NULL = no minimum"
    )
    max_balance = DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        help_text="Maximum balance in Naira, NULL = no maximum"
    )
    
    # Time window (optional)
    active_from_date = DateField(
        null=True,
        help_text="Campaign start date inclusive"
    )
    active_to_date = DateField(
        null=True,
        help_text="Campaign end date inclusive"
    )
    
    # Priority & Status
    priority = IntegerField(
        default=100,
        help_text="Higher number checked first"
    )
    is_default = BooleanField(
        default=False,
        help_text="Catch-all rule for this category"
    )
    
    # Audit
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    created_by = ForeignKey(User, on_delete=SET_NULL, null=True)
    
    class Meta:
        unique_together = [
            ('category', 'priority', 'customer_tier', 'account_type')
            # Can't have two rules at same priority matching same customers
        ]
        ordering = ['-priority', 'rule_id']

    def matches_customer(self, customer_profile) -> bool:
        """Check if this rule applies to the customer"""
        if self.customer_tier and customer_profile.tier != self.customer_tier:
            return False
        if self.account_type and customer_profile.account_type != self.account_type:
            return False
        if self.min_balance and customer_profile.balance < self.min_balance:
            return False
        if self.max_balance and customer_profile.balance > self.max_balance:
            return False
        return True
    
    def is_active_now(self) -> bool:
        """Check if rule is within its time window"""
        today = date.today()
        if self.active_from_date and today < self.active_from_date:
            return False
        if self.active_to_date and today > self.active_to_date:
            return False
        return True
```

### TemplateRuleAudit Model

```python
class TemplateRuleAudit(models.Model):
    audit_id = AutoField(primary_key=True)
    customer_id = CharField(max_length=50)
    category = CharField(max_length=50)
    selected_template = CharField(max_length=100)
    
    # Which rule led to selection
    matched_rule = ForeignKey(
        TemplateRule,
        on_delete=SET_NULL,
        null=True,
        help_text="NULL if no rule matched (used default)"
    )
    
    REASON_CHOICES = [
        ('active_rule', 'Active rule matched'),
        ('default_rule', 'Default rule used'),
        ('fallback_mapping', 'Fallback mapping used'),
        ('hardcoded_default', 'Hardcoded default (no rules exist)'),
    ]
    reason = CharField(max_length=20, choices=REASON_CHOICES)
    fallback_used = BooleanField(
        default=False,
        help_text="True if emergency fallback was used"
    )
    
    # Timestamp
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer_id', '-created_at']),
            models.Index(fields=['category', '-created_at']),
        ]
```

---

## API Endpoints

### 1. List Rules (GET /api/template-rules/)

```http
GET /api/template-rules/?category=salary_increase&format=json

Response: 200 OK
{
  "count": 3,
  "results": [
    {
      "rule_id": 5,
      "category": "salary_increase",
      "template_code": "SALARY_ULTRA_PREMIUM",
      "customer_tier": "TIER1",
      "account_type": "Current",
      "min_balance": "1000000.00",
      "max_balance": null,
      "priority": 300,
      "is_default": false,
      "active_from_date": null,
      "active_to_date": null,
      "created_at": "2024-12-15T10:30:00Z",
      "conflicts": []
    },
    ...
  ]
}
```

### 2. Create Rule (POST /api/template-rules/)

```http
POST /api/template-rules/
Content-Type: application/json
Authorization: Bearer <token>

{
  "category": "salary_increase",
  "template_code": "SALARY_PREMIUM",
  "customer_tier": "TIER1",
  "priority": 200,
  "is_default": false
}

Response: 201 Created
{
  "rule_id": 6,
  "category": "salary_increase",
  ...
}
```

### 3. Update Rule (PUT /api/template-rules/{id}/)

```http
PUT /api/template-rules/5/
Content-Type: application/json
Authorization: Bearer <token>

{
  "priority": 250,
  "max_balance": "500000.00"
}

Response: 200 OK
{...updated rule...}
```

### 4. Delete Rule (DELETE /api/template-rules/{id}/)

```http
DELETE /api/template-rules/5/
Authorization: Bearer <token>

Response: 204 No Content
```

### 5. Get Audit Trail (GET /api/template-rules/audit/)

```http
GET /api/template-rules/audit/?category=salary_increase&customer_id=CUS-00001&limit=50

Response: 200 OK
{
  "count": 150,
  "results": [
    {
      "audit_id": 12345,
      "customer_id": "CUS-00001",
      "category": "salary_increase",
      "selected_template": "SALARY_PREMIUM",
      "matched_rule": 5,
      "reason": "active_rule",
      "fallback_used": false,
      "created_at": "2024-12-20T15:45:00Z"
    },
    ...
  ]
}
```

### 6. Get Template Recommendation (POST /api/template-rules/recommend/)

**Called by email agent when sending message**

```http
POST /api/template-rules/recommend/
Content-Type: application/json

{
  "customer_id": "CUS-00001",
  "category": "salary_increase",
  "customer_tier": "TIER1",
  "account_type": "Current",
  "balance": 1500000.00
}

Response: 200 OK
{
  "template_code": "SALARY_ULTRA_PREMIUM",
  "rule_id": 5,
  "fallback_used": false,
  "reason": "active_rule",
  "note": "Matched priority 300 rule"
}
```

---

## Conflict Detection Algorithm

### Purpose
Identify rules that could create unpredictable behavior by matching the same customer at the same priority.

### Algorithm

```python
def get_conflicting_rules(category: str) -> List[List[TemplateRule]]:
    """
    Returns groups of rules that conflict
    Conflict = Same priority + Can match same customers
    """
    rules = TemplateRule.objects.filter(category=category).order_by('-priority')
    
    conflicts = []
    priority_groups = {}
    
    # Group by priority
    for rule in rules:
        if rule.priority not in priority_groups:
            priority_groups[rule.priority] = []
        priority_groups[rule.priority].append(rule)
    
    # Check each priority group for conflicts
    for priority, group in priority_groups.items():
        if len(group) <= 1:
            continue
        
        # Check if any two rules could match same customer
        for i, rule1 in enumerate(group):
            for rule2 in group[i+1:]:
                if can_both_match(rule1, rule2):
                    conflicts.append([rule1, rule2])
    
    return conflicts

def can_both_match(rule1: TemplateRule, rule2: TemplateRule) -> bool:
    """
    Check if two rules could both match the same customer profile
    Rules conflict if there exists a customer matching both
    """
    # Tier conflict?
    if rule1.customer_tier and rule2.customer_tier:
        if rule1.customer_tier != rule2.customer_tier:
            return False  # Different tiers - no overlap
    
    # Account type conflict?
    if rule1.account_type and rule2.account_type:
        if rule1.account_type != rule2.account_type:
            return False  # Different accounts - no overlap
    
    # Balance range conflict?
    # Check if balance ranges can overlap
    min_balance = max(rule1.min_balance or 0, rule2.min_balance or 0)
    max_balance = min(rule1.max_balance or float('inf'), 
                      rule2.max_balance or float('inf'))
    
    if min_balance > max_balance:
        return False  # No overlapping balance range
    
    # If we got here, ranges overlap
    return True
```

### Example Usage

```python
# In serializer validation
conflicts = get_conflicting_rules(validated_data['category'])
if conflicts:
    raise ValidationError(
        f"Rule would conflict with {len(conflicts)} existing rule(s)"
    )
```

---

## Template Selection Algorithm

### Selection Process

```python
def get_recommended_template(
    customer_profile: Dict,
    event_category: str,
    fallback_template: str = None
) -> Dict:
    """
    Core algorithm for template selection
    Returns: {
        'template_code': str,
        'rule_id': int or None,
        'reason': str,
        'fallback_used': bool
    }
    """
    
    # 1. Get all rules for this category, ordered by priority DESC
    rules = TemplateRule.objects.filter(
        category=event_category
    ).order_by('-priority')
    
    if not rules.exists():
        # No rules at all - use hardcoded default
        return {
            'template_code': fallback_template or 'DEFAULT',
            'rule_id': None,
            'reason': 'hardcoded_default',
            'fallback_used': True
        }
    
    # 2. Try to find first matching active rule
    for rule in rules:
        # Check if rule is active (date window)
        if not rule.is_active_now():
            continue
        
        # Check if customer matches constraints
        if rule.matches_customer(customer_profile):
            # Found a match!
            log_audit(
                customer_id=customer_profile['id'],
                category=event_category,
                selected_template=rule.template_code,
                matched_rule=rule,
                reason='active_rule'
            )
            return {
                'template_code': rule.template_code,
                'rule_id': rule.rule_id,
                'reason': 'active_rule',
                'fallback_used': False
            }
    
    # 3. No active rule matched, use default
    default_rule = rules.filter(is_default=True).first()
    
    if default_rule:
        log_audit(
            customer_id=customer_profile['id'],
            category=event_category,
            selected_template=default_rule.template_code,
            matched_rule=default_rule,
            reason='default_rule'
        )
        return {
            'template_code': default_rule.template_code,
            'rule_id': default_rule.rule_id,
            'reason': 'default_rule',
            'fallback_used': False
        }
    
    # 4. No default rule either - use hardcoded fallback
    return {
        'template_code': fallback_template or 'DEFAULT',
        'rule_id': None,
        'reason': 'fallback_mapping',
        'fallback_used': True
    }
```

### Calling from Email Agent

```python
# In email agent before sending
from apps.api.selectors import get_recommended_template

customer = {
    'id': 'CUS-00001',
    'tier': 'TIER1',
    'account_type': 'Current',
    'balance': 1500000.00
}

recommendation = get_recommended_template(
    customer_profile=customer,
    event_category='salary_increase',
    fallback_template='SALARY_INCREASE_DEFAULT'
)

# Use recommendation['template_code'] to load actual template
template = TemplateLibrary.get(recommendation['template_code'])
email_body = template.render(customer=customer, ...)

# Send email...
```

---

## Permissions & Security

### Required Permissions

```python
# In views.py
class TemplateRuleViewSet(viewsets.ModelViewSet):
    queryset = TemplateRule.objects.all()
    serializer_class = TemplateRuleSerializer
    
    permission_classes = [
        IsAuthenticated,
        IsOperationsTeam,  # Custom permission
    ]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class AuditViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TemplateRuleAudit.objects.all()
    serializer_class = AuditSerializer
    
    permission_classes = [
        IsAuthenticated,
        IsOperationsTeamOrReadOnly,
    ]
```

### Django Permission Setup

```python
# In Django admin or through code
Group.objects.get_or_create(name='Operations Team')
# Grant: add_templaterule, change_templaterule, delete_templaterule
```

---

## Testing

### Unit Tests

```python
# tests/test_template_rules.py

class TemplateRuleTests(TestCase):
    
    def setUp(self):
        self.rule = TemplateRule.objects.create(
            category='salary_increase',
            template_code='TEST_TEMPLATE',
            priority=100,
            is_default=True
        )
    
    def test_rule_matching_basic(self):
        customer = {
            'id': 'CUS-001',
            'tier': 'TIER1',
            'account_type': 'Current',
            'balance': 100000
        }
        self.assertTrue(self.rule.matches_customer(customer))
    
    def test_rule_matching_tier_constraint(self):
        self.rule.customer_tier = 'TIER1'
        customer_tier2 = {
            'id': 'CUS-001',
            'tier': 'TIER2',
            'account_type': 'Current',
            'balance': 100000
        }
        self.assertFalse(self.rule.matches_customer(customer_tier2))
    
    def test_rule_matching_balance_range(self):
        self.rule.min_balance = 100000
        self.rule.max_balance = 500000
        
        # Within range
        customer_ok = {'tier': None, 'account_type': None, 'balance': 300000}
        self.assertTrue(self.rule.matches_customer(customer_ok))
        
        # Below range
        customer_low = {'tier': None, 'account_type': None, 'balance': 50000}
        self.assertFalse(self.rule.matches_customer(customer_low))
    
    def test_conflict_detection(self):
        rule2 = TemplateRule.objects.create(
            category='salary_increase',
            template_code='TEST_TEMPLATE_2',
            priority=100,
            customer_tier='TIER1'
        )
        conflicts = get_conflicting_rules('salary_increase')
        self.assertTrue(any(rule in conflicts[0] for rule in [self.rule, rule2]))
    
    def test_time_window_active(self):
        from datetime import date, timedelta
        self.rule.active_from_date = date.today() - timedelta(days=1)
        self.rule.active_to_date = date.today() + timedelta(days=1)
        self.assertTrue(self.rule.is_active_now())
    
    def test_time_window_inactive(self):
        from datetime import date, timedelta
        self.rule.active_from_date = date.today() + timedelta(days=1)
        self.assertTrue(not self.rule.is_active_now())

class TemplateSelectionTests(TestCase):
    
    def test_selection_with_exact_match(self):
        TemplateRule.objects.create(
            category='salary_increase',
            template_code='PREMIUM',
            priority=200,
            customer_tier='TIER1'
        )
        
        customer = {'tier': 'TIER1'}
        result = get_recommended_template(customer, 'salary_increase')
        self.assertEqual(result['template_code'], 'PREMIUM')
    
    def test_selection_with_priority_order(self):
        # Rule 1: Priority 100
        TemplateRule.objects.create(
            category='salary_increase',
            template_code='LOW_PRIORITY',
            priority=100,
            is_default=True
        )
        
        # Rule 2: Priority 200, more specific
        TemplateRule.objects.create(
            category='salary_increase',
            template_code='HIGH_PRIORITY',
            priority=200,
            customer_tier='TIER1'
        )
        
        customer = {'tier': 'TIER1'}
        result = get_recommended_template(customer, 'salary_increase')
        # Should pick HIGH_PRIORITY (200) before LOW_PRIORITY (100)
        self.assertEqual(result['template_code'], 'HIGH_PRIORITY')
```

### Integration Tests

```python
def test_api_endpoint_create_rule(self):
    client = APIClient()
    client.force_authenticate(user=self.operations_user)
    
    response = client.post('/api/template-rules/', {
        'category': 'salary_increase',
        'template_code': 'SALARY_PREMIUM',
        'priority': 200,
        'customer_tier': 'TIER1',
        'is_default': False
    })
    
    self.assertEqual(response.status_code, 201)
    self.assertEqual(TemplateRule.objects.count(), 1)

def test_api_endpoint_conflict_detection(self):
    # Create conflicting rules...
    response = client.get('/api/template-rules/?category=salary_increase')
    
    for rule in response.data['results']:
        self.assertIn('conflicts', rule)
```

---

## Deployment Checklist

- [ ] Database migrations run: `python manage.py migrate`
- [ ] Models registered in Django admin
- [ ] Permissions created for operations team
- [ ] Frontend environment variables set
- [ ] API base URL configured
- [ ] Template audit table has indexes
- [ ] Email agents updated to call `get_recommended_template()`
- [ ] Test rules created in all categories
- [ ] Audit trail monitoring set up
- [ ] Default rules exist in each category
- [ ] No orphaned template codes (all codes match actual templates)

---

## Monitoring & Debugging

### Key Metrics to Monitor

```python
# Audit queries
from django.db.models import Count
from apps.api.models import TemplateRuleAudit

# Count by category
audit_count = TemplateRuleAudit.objects.values('category').annotate(
    count=Count('*')
)

# Count by fallback usage (bad = high fallback %)
fallback_count = TemplateRuleAudit.objects.filter(
    fallback_used=True
).count()

# Count by reason
reasons = TemplateRuleAudit.objects.values('reason').annotate(
    count=Count('*')
)
```

### Debug Queries

```python
# Find all conflicts
from apps.api.selectors import get_conflicting_rules
for category in TEMPLATE_CATEGORIES:
    conflicts = get_conflicting_rules(category)
    if conflicts:
        print(f"Category {category}: {len(conflicts)} conflicts")

# Find missing default rules
from apps.api.models import TemplateRule
for category in TEMPLATE_CATEGORIES:
    default = TemplateRule.objects.filter(
        category=category,
        is_default=True
    ).exists()
    if not default:
        print(f"ERROR: No default rule for {category}")

# Find expired rules still marked active
from datetime import date
expired = TemplateRule.objects.filter(
    active_to_date__lt=date.today()
)
print(f"Expired rules still in db: {expired.count()}")
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Wrong template sent | Rule priority wrong | Check priority ordering |
| No template sent | No default rule | Create default rule |
| High fallback rate | Rules not matching | Debug audit trail |
| Conflicts yellow | Same priority rules | Change priority |
| Cannot delete rule | Last default | Create new default first |
| Date window ignored | Timezone issue | Check server timezone |
| Audit table huge | No cleanup | Implement archival strategy |

---

## Future Enhancements

1. **Rule Templates**: Pre-built rule sets for common scenarios
2. **A/B Testing Mode**: Run rules in shadow mode, track alt template performance
3. **Rule Versioning**: Keep history of rule changes
4. **Bulk Import**: Excel/CSV import for rules
5. **Rule Analytics**: Dashboard showing rule effectiveness
6. **ML-Assisted Rules**: Suggestions based on audit data
7. **Soft Delete**: Archive rules instead of hard delete
8. **Undo/Rollback**: Restore deleted rules from audit trail

