# Business Logic: Bonus Days Proration System

## 🎯 Core Concept

When a user upgrades mid-cycle, they get a **new subscription** that starts immediately but has **two billing cycles**:
1. **First billing cycle**: 30 days (standard)
2. **Authenticated trial period**: 10 bonus days (free access between cycles)
3. **Second billing cycle**: Starts after trial, runs for 30 days

---

## 📅 Complete 55-Day Upgrade Flow

### Timeline Breakdown

```
Day 1-15:   Using ₹349 plan (paid)
Day 15:     Upgrade to ₹999 plan
Day 15-45:  First billing cycle of ₹999 plan (30 days)
Day 45:     First billing attempt for ₹999
Day 45-55:  Authenticated trial period (10 bonus days)
Day 55:     Trial expires, second subscription starts
Day 56-85:  Second billing cycle (30 days)
Day 85:     Next billing attempt
```

### Detailed Flow

#### Phase 1: Initial Plan (Days 1-15)
- User purchases ₹349/month plan
- Uses it for 15 days
- Has 15 days remaining when they decide to upgrade

#### Phase 2: Upgrade Initiation (Day 15)
- User clicks "Upgrade to ₹999 Premium"
- **Backend creates NEW subscription** for ₹999 plan
- **Day 15 becomes "Day 1"** of the new subscription
- Old ₹349 subscription is marked for cancellation (happens after payment)

#### Phase 3: First Billing Cycle (Days 15-45)
- User immediately gets Premium features (200GB, etc.)
- Subscription status: `"created"` → `"active"` (after payment)
- **Day 45 (30 days after upgrade)**: Razorpay attempts first billing
- If payment succeeds: User enters authenticated trial period
- If payment fails: Grace period starts

#### Phase 4: Authenticated Trial (Days 45-55)
- **10 bonus days of free access**
- User still has full Premium features
- Subscription status: `"authenticated"` (new state)
- No billing attempts during this period
- This is the "reward" for upgrading mid-cycle

#### Phase 5: Second Subscription Start (Day 56)
- Trial expires
- **New billing cycle starts**
- Subscription status: `"active"`
- Next billing: Day 85 (30 days later)

---

## 🔄 State Transitions

```
created → active (after first payment on day 15)
  ↓
active (days 15-45, first billing cycle)
  ↓
active (day 45, billing succeeds)
  ↓
authenticated (days 45-55, trial period)
  ↓
active (day 56+, second billing cycle)
```

### Grace Period Flow (If Payment Fails)

```
Day 45: Billing fails
  ↓
pending (days 45-48, 3-day grace period)
  ↓
Day 48: Still no payment
  ↓
halted (day 48+, account blocked)
```

**Important**: If payment fails on day 45, user does NOT get the 10 bonus days. They go straight to grace period.

---

## 💰 Billing Timeline

### Scenario: Upgrade on Day 15

| Day | Event | Amount | Status |
|-----|-------|--------|--------|
| 1 | Buy ₹349 plan | ₹349 | active |
| 15 | Upgrade to ₹999 | ₹999 | created → active |
| 45 | First billing (30 days) | ₹999 | active → authenticated |
| 45-55 | Trial period | ₹0 | authenticated |
| 56 | Second cycle starts | ₹0 | active |
| 85 | Second billing (30 days) | ₹999 | active |
| 115 | Third billing | ₹999 | active |

**Total cost for first 115 days**: ₹349 + ₹999 + ₹999 + ₹999 = ₹3,346

---

## 🧮 Bonus Days Calculation

### Formula
```javascript
// Step 1: Calculate remaining credit value
const daysRemaining = 15; // Days left on old plan
const currentPrice = 349; // Old plan price
const creditAmount = Math.floor((currentPrice / 30) * daysRemaining);
// creditAmount = (349 / 30) * 15 = 174.5 → 174

// Step 2: Convert credit to bonus days on new plan
const targetPlanPrice = 999; // New plan price
const bonusDays = Math.floor((creditAmount / targetPlanPrice) * 30);
// bonusDays = (174 / 999) * 30 = 5.22 → 5 days

// Step 3: Apply constraints
const finalBonusDays = Math.min(bonusDays, 15); // Cap at 15
// finalBonusDays = 5 days
```

### Edge Cases

#### Case 1: Upgrade on Day 1 (30 days remaining)
```javascript
creditAmount = (349 / 30) * 30 = 349
bonusDays = (349 / 999) * 30 = 10.48 → 10 days
```

#### Case 2: Upgrade on Day 29 (1 day remaining)
```javascript
creditAmount = (349 / 30) * 1 = 11.63 → 11
bonusDays = (11 / 999) * 30 = 0.33 → 0 days
Result: ERROR - "Wait 1 day to upgrade"
```

#### Case 3: Upgrade from ₹999 to ₹999 Yearly (30 days remaining)
```javascript
creditAmount = (999 / 30) * 30 = 999
bonusDays = (999 / 7999) * 30 = 3.75 → 3 days
```

---

## 🚦 Subscription States

### New State: `authenticated`

**Purpose**: Represents the trial period between billing cycles.

**Characteristics**:
- User has full access to Premium features
- No billing attempts
- Time-limited (10 days max)
- Automatically transitions to `active` when trial expires

**Database Schema**:
```javascript
{
    status: "authenticated",
    authenticatedPeriodStart: Date, // Day 45
    authenticatedPeriodEnd: Date,   // Day 55
    bonusDays: 10
}
```

---

## 📊 Database Timeline

### Subscription Record Evolution

#### At Upgrade (Day 15)
```javascript
{
    razorpaySubscriptionId: "sub_new123",
    planId: "plan_RuC2evjqwSxHOH",
    userId: "user123",
    status: "created",
    bonusDays: 10,
    currentPeriodStart: null,
    currentPeriodEnd: null
}
```

#### After First Payment (Day 15)
```javascript
{
    status: "active",
    currentPeriodStart: "2025-01-15", // Day 15
    currentPeriodEnd: "2025-02-14",   // Day 45 (30 days later)
    bonusDays: 10
}
```

#### After First Billing Success (Day 45)
```javascript
{
    status: "authenticated",
    authenticatedPeriodStart: "2025-02-14", // Day 45
    authenticatedPeriodEnd: "2025-02-24",   // Day 55 (10 days later)
    bonusDays: 10
}
```

#### After Trial Expires (Day 56)
```javascript
{
    status: "active",
    currentPeriodStart: "2025-02-25", // Day 56
    currentPeriodEnd: "2025-03-27",   // Day 85 (30 days later)
    bonusDays: 0 // Consumed
}
```

---

## ⚠️ Edge Cases & Validations

### 1. Minimum Bonus Days (< 1 day)
**Scenario**: User upgrades with only 1 day remaining on old plan.

**Calculation**: bonusDays = 0

**Action**: Block upgrade, show error
```
"Please wait 1 day before upgrading to accumulate minimum bonus days"
```

### 2. Maximum Bonus Days (> 15 days)
**Scenario**: User upgrades from ₹349 to ₹349 yearly with 30 days remaining.

**Calculation**: bonusDays = 30

**Action**: Cap at 15 days
```javascript
const finalBonusDays = Math.min(bonusDays, 15);
```

### 3. Payment Failure on Day 45
**Scenario**: First billing attempt fails.

**Flow**:
```
Day 45: Billing fails
  ↓
Status: pending
  ↓
Day 45-48: Grace period (3 days)
  ↓
Day 48: Still no payment
  ↓
Status: halted (NO bonus days given)
```

**Important**: Bonus days are ONLY given if payment succeeds.

### 4. Multiple Upgrade Attempts
**Scenario**: User tries to upgrade twice in 1 hour.

**Action**: Rate limiter blocks second attempt
```
"You can only upgrade once per hour. Please try again later."
```

### 5. Expired Subscription
**Scenario**: User's subscription expired yesterday, tries to upgrade.

**Action**: Block upgrade
```
"Your current subscription has expired. Please purchase a new plan."
```

---

## 🔄 Webhook Event Handling

### Event 1: `invoice.paid` (Day 15 - Initial Payment)
```javascript
// User just upgraded and paid ₹999
// Activate first billing cycle

await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: newSubId },
    {
        status: "active",
        currentPeriodStart: new Date(rzpSub.current_start * 1000),
        currentPeriodEnd: new Date(rzpSub.current_end * 1000), // 30 days later
        bonusDays: parseInt(rzpSub.notes.bonusDays)
    }
);

// Cancel old subscription
await rzpInstance.subscriptions.cancel(oldSubId);
```

### Event 2: `invoice.paid` (Day 45 - First Billing)
```javascript
// First billing cycle completed, payment succeeded
// Start authenticated trial period

const bonusDays = subscription.bonusDays;
const trialStart = new Date();
const trialEnd = new Date(trialStart);
trialEnd.setDate(trialEnd.getDate() + bonusDays);

await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: subId },
    {
        status: "authenticated",
        authenticatedPeriodStart: trialStart,
        authenticatedPeriodEnd: trialEnd
    }
);
```

### Event 3: Cron Job (Day 55 - Trial Expires)
```javascript
// Authenticated trial period ended
// Start second billing cycle

const now = new Date();
const subscription = await Subscription.findOne({
    status: "authenticated",
    authenticatedPeriodEnd: { $lte: now }
});

const newPeriodStart = now;
const newPeriodEnd = new Date(now);
newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

await Subscription.findOneAndUpdate(
    { _id: subscription._id },
    {
        status: "active",
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        bonusDays: 0 // Consumed
    }
);
```

---

## 🎯 Key Differences from Standard Flow

| Aspect | Standard Purchase | Upgrade with Bonus Days |
|--------|------------------|------------------------|
| **Billing Cycles** | 1 cycle (30 days) | 2 cycles (30 + 30 days) |
| **Trial Period** | None | 10 days (between cycles) |
| **States** | created → active | created → active → authenticated → active |
| **Total Days** | 30 | 55 (30 + 10 + 30) |
| **Payments** | 1 payment | 2 payments (day 15, day 85) |

---

## 📝 Summary

1. **Upgrade creates NEW subscription** starting immediately
2. **First billing**: 30 days after upgrade (day 45)
3. **If payment succeeds**: User gets 10 bonus trial days
4. **Trial period**: Days 45-55 (authenticated state)
5. **Second cycle starts**: Day 56
6. **Next billing**: Day 85 (30 days after trial ends)
7. **Total access**: 55 days before second billing

This system rewards users for upgrading mid-cycle by giving them extra time, while maintaining a clean billing structure.
