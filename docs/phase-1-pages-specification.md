# MOMENT v2 Phase 1 — 5 Core Pages Specification

## Overview
These 5 pages form the core user experience for MOMENT v2. Each page must have consistent typography, spacing, and interactive elements following the cyan accent (#00d9ff) design system.

---

## 1️⃣ UPLOAD PAGE (`/upload`)

### Purpose
Creators upload videos once and auto-post to multiple platforms simultaneously.

### Page Components

#### Header Section
- Back link to Discovery
- Page eyebrow: "Creator Dashboard"
- Main heading: "Upload once, post everywhere"
- Description text: "Select your platforms. We'll auto-post your video at the same time across all of them."

#### Upload Zone
- Large drag-and-drop area
- File input button
- Icon (film/video)
- Supported formats text: "MP4, MOV up to 500MB. Recommended: vertical 9:16"
- Hover state with cyan glow

#### Platform Selector
- Label: "Auto-post to"
- 3 platform options as buttons:
  - TikTok (🎵 icon)
  - Instagram (📷 icon)
  - Facebook (f icon)
- Each shows selected state with cyan highlight
- Checkmark on selected

#### Caption Input
- Label: "Caption (optional)"
- Textarea with placeholder
- Character counter: "0 / 300"
- Focus state with cyan border

#### Stats Preview
- Grid showing:
  - "Platforms selected" + count
  - "Estimated reach" + number
- Background: cyan accent with low opacity

#### Submit Button
- "Upload & Preview" (primary action)
- Disabled state while uploading
- Loading text: "Uploading & approving…"

#### Upload History Section
- Label: "Recent uploads"
- Heading: "Your posted stories"
- List of video cards showing:
  - Thumbnail (placeholder video icon)
  - Title
  - Caption
  - Platform chips (🎵 TikTok, 📷 Instagram, f Facebook)
  - Status badge (Posted/Pending/Approved)

#### Preview Modal
- Title: "Upload preview"
- Content showing:
  - Confirmation message
  - Submission ID (code format)
  - "24h voting window" info
  - "Payout cycle" info
- Notice box explaining MOMENT mechanics
- Footer buttons: Cancel, Confirm & post

---

## 2️⃣ DISCOVERY/VOTING PAGE (`/discovery`)

### Purpose
Community votes on stories to predict viral moments. Core engagement loop earning parrot points.

### Page Components

#### Header Stats Grid
- 3 stat cards:
  1. "Your parrot points" + value + "+10 per vote" (green verdict)
  2. "Voting accuracy" + percentage
  3. "Level" + number + "X pts to next" (neutral verdict)

#### Banner Section
- Heading: "Predict viral moments."
- Description: "Vote on stories to predict which will hit 5K views. Earn parrot points for accuracy."
- Stats grid showing:
  - "5K" Viral threshold
  - "24h" Voting window
  - "+50" Points per correct prediction

#### Story Voting Cards (Grid Layout)
Each card contains:

**Thumbnail Section**
- Video placeholder (▶ icon)
- Status badge:
  - "🔥 Going viral" (if >5K views)
  - "📈 XX%" (progress to viral)

**Creator Info Row**
- Avatar (circular, gradient background, 1st letter)
- Creator name (strong text)
- Creator handle (@username, muted text)

**Story Title**
- Main heading for the video

**View Breakdown Grid** (2x2)
- 🎵 TikTok: [number]
- 📷 Instagram: [number]
- f Facebook: [number]
- 📱 App: [number]

**Progress to Viral**
- Label row: "Views: X" and "5000 to go viral"
- Progress bar (cyan → green gradient, animated)
- Height: 8px

**Progress Timer (ProgressBar Component)**
- Shows: "Xh Ym remaining"
- Progress percentage
- Updates every 1 second

**Voting Prompt**
- Question: "Will this hit 5K views?"
- Two buttons side by side:
  - 👍 Yes [count] (green, up vote)
  - 👎 No [count] (red, down vote)
- Voted state: border + background highlight + inset shadow

**Vote Feedback** (conditional)
- "✓ You predicted viral" OR "✓ You predicted it won't go viral"
- "+ X parrot points if correct"
- Colored background (green/red) with left border

#### CTA Section
- Heading: "Ready to earn?"
- Description: "Upload your own story. Let the community predict your virality. Earn from views + accuracy."
- Button: "Upload your story"
- Visual: Wallet icon (low opacity)

#### Info Notice
- Title: "How you earn"
- Bullet list:
  - 0.1 parrot points per view (all platforms combined)
  - +10 points for voting participation
  - +5 points for correct predictions
  - Payout every 24 hours from upload approval

---

## 3️⃣ WALLET PAGE (`/wallet-moment`)

### Purpose
Users see parrot points balance, earnings breakdown, and cashout interface.

### Page Components

#### Page Header
- Eyebrow: "Wallet"
- Title: "Your parrot points earnings"
- Description: "Track your points from video views, voting accuracy, referrals, and creator rewards. Convert to USD on your schedule."

#### Stats Hero Grid
- 4 stat cards:
  1. "Available parrot points" + value + "$X USD" (green verdict)
  2. "Voting accuracy" + percentage
  3. "Level" + number
  4. "Lifetime earned" + value + "All time" (neutral)

#### Tab Navigation
- Segmented control with 2 options:
  - "Parrot Points" (active)
  - "Cash out"

#### TAB 1: Parrot Points

**How You Earn Section**
- Heading: "How you earn parrot points"
- Grid of earning methods:
  - 📺 icon | "0.1 point per view" | "+145 pts"
  - ✓ icon | "+5 points for correct prediction" | "+15 pts"
  - +10 icon | "+10 points per vote" | "+40 pts"
  - 🎁 icon | "+50 points per referral" | "+50 pts"

**Earnings History Section**
- Heading: "Earnings history"
- List of earning records (each showing):
  - Icon (📺/✓/🎁/💰)
  - Source label: "Video views", "Correct predictions", etc.
  - Story title (if applicable, italicized)
  - Timestamp (date + time)
  - Amount: "+X pts" (green)

#### TAB 2: Cash Out

**Cash Out Card**
- Heading: "Ready to cash out"
- Display:
  - 💎 icon | "XXX points = $XX USD"
- Button: "Cash out now"
- Info grid (3 columns):
  - "Exchange rate" | "1 point = $0.01 USD"
  - "Processing time" | "2-3 business days"
  - "Minimum cashout" | "$1 USD (100 points)"

**Payout Methods Card**
- Eyebrow: "Connected accounts"
- Heading: "Payout methods"
- Method options (3 grid items):
  - 🏦 | "Direct bank transfer" | "Available in 150+ countries"
  - 💳 | "Debit card" | "US & Europe"
  - ₿ | "Crypto wallet" | "Bitcoin, Ethereum, USDC"
- Button: "+ Add payout method"

**Safety Notice**
- Title: "Your payouts are safe"
- Message: "All withdrawals are instant, fees-free, and go directly to your account. We partner with Stripe & Wise for secure transfers."

---

## 4️⃣ PROFILE PAGE (`/profile`)

### Purpose
Creators showcase their level, voting accuracy, and geographic influence zones.

### Page Components

#### Hero Section
- Avatar (large, 82px, shows tier badge)
- Creator name (or "Name your creator profile")
- Location + role: "City, State · Creator"
- Tier badge: Shows level with crown icon and color

#### Action Buttons
- "Customize character"
- "Edit profile"
- "Upload photo" (file input)
- "Refresh avatar"

#### Stats Grid
- 4 stat cards:
  1. 💰 "Lifetime earnings" + value
  2. 👑 "Taste score" + number
  3. 🔥 "Voting streak" + number (or "Streak paused")
  4. 🎯 "Rally XP" + number

#### Share Section (SharePanel)
- Heading: "Share your journey"
- Profile URL: "yourname.moment.app"
- Share buttons for platforms
- Message template

#### Creator Links Grid (2 columns)

**Rally Link Card**
- Eyebrow: "Audience momentum"
- Heading: "Your rally link"
- Description: "It always points to your current battle. Supporters can help the crowd-favourite score, but never decide the main prize."
- Code display: "/v/[referral-code]"
- Copy button
- Stats:
  - "XXX" Voters recruited
  - "XXX" Rally XP

**Referral Link Card**
- Eyebrow: "Invite loop"
- Heading: "Bring a creator in."
- Description: "Earn $5 after someone you invite completes their first eligible vote or entry."
- Code display: "/r/[referral-code]"
- Copy button
- Stats:
  - "XXX" People referred
  - "$XX" Referral earnings

#### Journey Taskbar
- Milestones showing creator progression
- Status: completed, current, or locked
- Action labels for next steps

#### Verification Section
- Eyebrow: "Account readiness"
- Heading: "Verification and payouts"
- Settings rows:
  1. "Phone verification" | "Verified" badge
  2. "Creator payouts" | "Connected" badge or "Set up" button

#### Edit Profile Modal
- Title: "Edit public profile"
- Form fields:
  - "Display name" (text input, max 60)
  - "Location" (text input, max 80)
- Footer: Cancel and Save buttons

---

## 5️⃣ PROCESS/PAYOUT PAGE (`/process`)

### Purpose
Shows real-time 24-hour payout cycle with voting window, view counting, and reward calculation.

### Page Components

#### Page Header
- Eyebrow: "Voting Process"
- Title: "24-Hour Payout Cycle"
- Description: "Your story's voting window and view counting happen simultaneously. Payouts process automatically at the end."

#### Active Stories Section
For each story in voting phase:

**Story Card**
- Creator info (avatar + name)
- Story title
- Status: "⏳ Voting in progress"

**Timeline Section**
- Stage 1: "T+0 — Upload Approved"
  - Timestamp when approved
  - Status: ✓ Complete

- Stage 2: "T+12H — Halfway Point"
  - Real-time view count across platforms
  - Vote distribution (upvotes vs downvotes %)
  - Progress to 5K viral threshold

- Stage 3: "T+24H — Payout Moment"
  - Countdown timer (ProgressBar component)
  - Hours:Minutes remaining

**Live Metrics Display**
- Current views: [number with breakdown by platform]
- Current votes: [upvotes] 👍 vs [downvotes] 👎
- Viral prediction: "XX% of community predicts viral"
- Your predicted earnings:
  - Views points: "+ X pts"
  - Vote participation: "+ X pts"
  - Voting accuracy: "+ X pts (if correct)"
  - Total estimated: "+ XX pts"

**Progress Bars**
1. Views to viral (5K threshold)
   - Cyan → Green gradient
   - Percentage + remaining count

2. Vote health
   - Green: upvotes, Red: downvotes
   - Stacked bar or side-by-side

#### Payout Summary (T+24H Ready)
- Heading: "Your payout is ready"
- Breakdown table:
  - Views: 2,850 views × 0.1 = +285 points
  - Voting: +10 participation bonus
  - Accuracy: +5 (if vote was correct)
  - Creator reward pool: +0 (split among voters)
- Total earned: [big number]
- USD equivalent: $[value]

#### Claim Button
- "Claim payout to wallet"
- Status after claiming: "✓ Payout claimed"

#### Past Payouts Section
- List of completed cycles
- Each showing:
  - Story title
  - Final view count
  - Your prediction (correct ✓ or incorrect ✗)
  - Points earned
  - USD value
  - Date

#### Live Feed
- Real-time updates showing:
  - "15 people just voted on this story"
  - "+500 views from Instagram"
  - "Vote is 60/40 upvote - going viral!"

---

# Typography Generation Prompts

## Prompt 1: Upload Page Typography
```
Generate typography specifications for MOMENT v2 Upload Page.

Page Purpose: Creators upload videos once and auto-post to multiple platforms.

Components to style:
1. Main heading: "Upload once, post everywhere"
2. Section labels: "Creator Dashboard", "Auto-post to", "Recent uploads"
3. Instructional text: "Select your platforms. We'll auto-post..."
4. Platform button labels: "TikTok", "Instagram", "Facebook"
5. Caption input label: "Caption (optional)"
6. Form helper text: "MP4, MOV up to 500MB. Recommended: vertical 9:16"
7. Stats labels: "Platforms selected", "Estimated reach"
8. Video card titles: Story titles in history
9. Status badges: "Posted", "Pending", "Approved"
10. Button text: "Upload & Preview", "Confirm & post"

Design context:
- Dark theme with cyan accent (#00d9ff)
- Premium agency aesthetic
- Target: Creators (diverse backgrounds, global)
- Device: Mobile-first, desktop optimized
- Motion: 220ms smooth transitions

Requirements:
- Font family: System fonts (Geist, Inter, SF Pro)
- Weight hierarchy: 900 (headlines), 700 (bold), 600 (labels), 400 (body)
- Font sizes: 2.25rem (h1), 1.125rem (h2), 1rem (body), 0.875rem (label)
- Line heights: 1.1 (headlines), 1.5 (body), 1.6 (descriptive)
- Letter spacing: -0.02em (headlines), 0 (body), 0.15em (labels)
- Color: #f8f8f8 (primary text), #999999 (secondary), #00d9ff (accent)

Output format:
Provide a CSS-in-JS or CSS module structure with:
- Typography tokens/variables
- Component-specific styles
- Responsive breakpoints (mobile < 768px)
- Interaction states (hover, focus, active, disabled)
- Accessibility considerations (contrast ratios, focus indicators)
```

## Prompt 2: Discovery/Voting Page Typography
```
Generate typography specifications for MOMENT v2 Discovery/Voting Page.

Page Purpose: Community votes on stories to predict viral moments and earn parrot points.

Components to style:
1. Page heading: "Predict viral moments."
2. Subheading: "Vote on stories to predict which will hit 5K views..."
3. Stat labels: "Your parrot points", "Voting accuracy", "Level"
4. Stat values: Large numbers showing points/percentage/level
5. Card titles: Story titles (e.g., "Urban Fashion Drop")
6. Creator name: Display names
7. Creator handle: @username format
8. View source labels: "🎵 TikTok", "📷 Instagram"
9. View counts: Large numbers (e.g., "1,200")
10. Progress labels: "Views: 2,850", "5,000 to go viral"
11. Voting prompt: "Will this hit 5K views?"
12. Vote button labels: "Yes", "No"
13. Vote counts: Numbers in buttons
14. Voting feedback: "✓ You predicted viral"
15. Points estimate: "+10 parrot points if correct"
16. CTA heading: "Ready to earn?"
17. Earning rules: Bullet list of point sources

Design context:
- Dark theme with cyan accent
- Engagement-first (encourages interaction)
- Real-time updates (view counts, vote counts change)
- Target: All users (broad audience)
- Emotion: Excitement, urgency, achievement

Requirements:
- Font family: System fonts (Geist, Inter, SF Pro)
- Weight hierarchy: 900 (h1), 700 (h2/titles), 600 (labels), 400 (body)
- Font sizes: 2.25rem (h1), 1.125rem (titles), 1rem (body), 0.875rem (label)
- Line heights: 1.1 (headlines), 1.5 (body), 1.6 (descriptive)
- Letter spacing: -0.02em (headlines), 0.15em (labels uppercase)
- Colors: #f8f8f8 (primary), #999999 (secondary), #00d9ff (accent)
- Status colors: #4ade80 (upvote/correct), #ef4444 (downvote/incorrect)

Output format:
Provide complete typography styles for:
- Story card text hierarchy
- Voting interaction text (buttons, feedback)
- Progress metrics (large numbers, labels)
- Responsive text sizing
- Hover/active/disabled states
- Animation timing for text changes
```

## Prompt 3: Wallet/Earnings Page Typography
```
Generate typography specifications for MOMENT v2 Wallet/Earnings Page.

Page Purpose: Users view parrot points balance, earnings history, and cash out options.

Components to style:
1. Page title: "Your parrot points earnings"
2. Page description: Long-form explanation text
3. Stat labels: "Available parrot points", "Voting accuracy", "Level", "Lifetime earned"
4. Stat values: Large numbers/percentages
5. Tab labels: "Parrot Points", "Cash out"
6. Section heading: "How you earn parrot points"
7. Earning method titles: "0.1 point per view", "+5 points for correct prediction"
8. Earning descriptions: Detailed explanations
9. Earning amounts: Large green numbers (+X pts)
10. Earnings history labels: "Video views", "Correct predictions"
11. Earnings timestamps: Date and time format
12. Cashout amount display: "XXX points = $XX USD"
13. Exchange rate info: "1 point = $0.01 USD"
14. Processing time: "2-3 business days"
15. Payout method titles: "Direct bank transfer", "Debit card", "Crypto wallet"
16. Safety notice: Important information in notice box
17. Button text: "Cash out now", "Add payout method"

Design context:
- Dark theme with cyan accent
- Finance-focused (trust, clarity, precision)
- Numbers are central (large, readable)
- Target: Earning creators
- Emotion: Confidence, reward, accomplishment

Requirements:
- Font family: System fonts for body, monospace for numbers (#00d9ff accent)
- Weight hierarchy: 900 (h1), 700 (h2), 600 (labels), 400 (body)
- Font sizes: 1.75rem (section titles), 1.5rem (values), 1rem (body), 0.875rem (label)
- Line heights: 1.1 (titles), 1.5 (body), 1.6 (description)
- Letter spacing: -0.02em (titles), 0.15em (uppercase labels)
- Colors: #f8f8f8 (primary), #999999 (secondary), #4ade80 (positive/earnings)
- Monospace: "Courier New" for amounts/codes with cyan (#00d9ff) color

Output format:
Provide typography for:
- Numeric hierarchy (amounts, counts, codes)
- Tab navigation (active/inactive states)
- Data visualization text (labels, legends)
- Informational sections (descriptions, instructions)
- Responsive sizing for mobile vs desktop
- Accessibility for financial information
```

## Prompt 4: Creator Profile Page Typography
```
Generate typography specifications for MOMENT v2 Creator Profile Page.

Page Purpose: Creators showcase their level, stats, and influence zones.

Components to style:
1. Creator name: Display name or placeholder
2. Location + role: "City, State · Creator"
3. Tier badge: "Level X - [Title]"
4. Stats labels: "Lifetime earnings", "Taste score", "Voting streak", "Rally XP"
5. Stats values: Large numbers with icons
6. Section eyebrow: "Account readiness", "Audience momentum", "Invite loop"
7. Section heading: "Verification and payouts", "Your rally link", "Bring a creator in"
8. Description text: Explanatory paragraphs
9. Share code display: "/v/[code]" format
10. Share code description: "Copy and share" instructions
11. Button labels: "Edit profile", "Upload photo", "Customize character", "Set up", "Copy"
12. Milestone labels: Journey/progression text
13. Modal title: "Edit public profile"
14. Form labels: "Display name", "Location"
15. Form helper: "Max 60 characters", "Only your display name appears publicly"
16. Badge text: "Verified", "Connected"

Design context:
- Dark theme with cyan accent
- Identity-focused (personal branding)
- Share-friendly (referral links prominent)
- Target: Ambitious creators
- Emotion: Pride, achievement, community

Requirements:
- Font family: System fonts (Geist, Inter, SF Pro)
- Weight hierarchy: 900 (creator name), 700 (section headings), 600 (labels), 400 (body)
- Font sizes: 2rem (creator name), 1.875rem (section heading), 1rem (body), 0.875rem (label)
- Line heights: 1.1 (names/titles), 1.5 (body), 1.6 (description)
- Letter spacing: -0.02em (names/titles), 0.15em (uppercase labels)
- Colors: #f8f8f8 (primary), #999999 (secondary), #00d9ff (accent/links)
- Status colors: #4ade80 (verified/connected), #f2b84b (pending)

Output format:
Provide typography for:
- Name/identity hierarchy
- Stats display (icon + number + label)
- Share link formatting (code styling)
- Form field styling
- Milestone/progression text
- Section organization and visual separation
- Mobile vs desktop responsive adjustments
```

## Prompt 5: Process/24H Payout Cycle Page Typography
```
Generate typography specifications for MOMENT v2 Process/Payout Cycle Page.

Page Purpose: Shows real-time 24-hour voting + view counting + automatic payout distribution.

Components to style:
1. Page title: "24-Hour Payout Cycle"
2. Page description: Explanation of the cycle
3. Section heading: "Active Stories", "Payout Summary", "Past Payouts"
4. Story title: Video titles in timeline
5. Creator info: Name and handle
6. Status text: "Voting in progress", "Payout ready", "Payout claimed"
7. Timeline stage labels: "T+0 — Upload Approved", "T+12H — Halfway Point", "T+24H — Payout Moment"
8. Timeline timestamp: Actual date/time approved
9. Stage status: "✓ Complete"
10. Metrics labels: "Current views", "Current votes", "Viral prediction"
11. Metrics values: Large numbers with icons
12. Platform breakdown: "TikTok: 1,200", "Instagram: 950"
13. Vote distribution: "XX% upvotes", "XX% downvotes"
14. Earnings breakdown rows: "Views", "Voting", "Accuracy bonus"
15. Points calculations: "2,850 views × 0.1 = +285 points"
16. USD conversion: "$XX value"
17. Countdown timer: "Xh Ym remaining"
18. Progress labels: "XX% complete", "X of 5,000 views"
19. Live feed updates: "15 people just voted", "+500 views from Instagram"
20. Button text: "Claim payout to wallet", "View details"

Design context:
- Dark theme with cyan accent
- Real-time + urgency (countdown, live updates)
- Data-heavy (metrics, calculations, timelines)
- Target: Engaged creators actively uploading
- Emotion: Excitement, momentum, reward

Requirements:
- Font family: System fonts for body, monospace for numbers/calculations
- Weight hierarchy: 900 (h1), 700 (stage labels/h2), 600 (metric labels), 400 (body)
- Font sizes: 2rem (title), 1.25rem (stage), 1.5rem (metric values), 1rem (body), 0.75rem (caption)
- Line heights: 1.1 (titles), 1.5 (body), 1.4 (dense metrics)
- Letter spacing: -0.02em (headlines), 0.1em (stage labels), 0 (monospace)
- Colors: #f8f8f8 (primary), #999999 (secondary), #00d9ff (accent)
- Real-time colors: #4ade80 (upvotes), #ef4444 (downvotes), #f2b84b (warning/soon)

Output format:
Provide typography for:
- Timeline/stage progression layout
- Metric display (large numbers + descriptions)
- Calculation formatting (views × rate = points)
- Live feed updates (minimal, scannable)
- Countdown timer styling
- Tab/section navigation
- Data tables (earnings breakdown)
- Status indicators and color coding
- Animation for number updates
- Mobile responsive adjustments
```

---

# Implementation Notes

## Color Palette
- **Primary Background:** #0a0e14
- **Surface 1:** #1a1f28
- **Surface 2:** #2a3038
- **Text Primary:** #f8f8f8
- **Text Secondary:** #999999
- **Accent (Cyan):** #00d9ff
- **Accent Dark:** #0099cc
- **Success/Growth:** #4ade80
- **Decline/Error:** #ef4444
- **Border:** #2a3038

## Motion & Interaction
- Standard transition: 220ms cubic-bezier(0.23, 1, 0.32, 1)
- Fast transition: 140ms
- Hover: Accent border + low opacity glow
- Active: Accent border + solid background
- Disabled: 50% opacity

## Accessibility
- Minimum contrast ratio: 4.5:1
- Focus indicators: Cyan border on interactive elements
- Font size minimum: 16px (1rem) for body text
- Line height minimum: 1.5 for body text
- Color not sole indicator: Use icons + text
