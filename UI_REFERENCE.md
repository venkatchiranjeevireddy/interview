# Interview Feature - Visual Reference

## 🎨 UI Layout

### Interview Setup Screen
```
┌─────────────────────────────────────────────────────────────┐
│         Interview Prep                                      │
│         AI-Powered Mock Interview                           │
├─────────────────────────────────────────────────────────────┤
│  Job Description          │      Resume Upload              │
│  ┌─────────────────────┐  │  ┌─────────────────────┐       │
│  │ Paste JD here...    │  │  │  Upload Resume      │       │
│  │                     │  │  │  PDF or DOCX        │       │
│  │ (Large text area)   │  │  │  ☑ Loaded           │       │
│  │                     │  │  │  Or Select:         │       │
│  │                     │  │  │  [Resume #1]        │       │
│  └─────────────────────┘  │  │  [Resume #2]        │       │
│                           │  └─────────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  Select Interview Difficulty                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Level 1      │  │ Level 2      │  │ Level 3      │     │
│  │ BASIC        │  │ MEDIUM       │  │ HARD         │     │
│  │ 15 min       │  │ 30 min       │  │ 45 min       │     │
│  │ Core         │  │ Technical    │  │ Architect    │     │
│  │              │  │ 🔒 Locked    │  │ 🔒 Locked    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  [Back to Dashboard]         [Select a Difficulty Above]   │
└─────────────────────────────────────────────────────────────┘
```

### Interview Session Screen
```
┌─────────────────────────────────────────────────────────────┐
│  Interview in Progress              14:32 ⏱️               │
├─────────────────────────────────────────────────────────────┤
│  Transcript Area                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 AI: Tell me about yourself...                    │   │
│  │                                                      │   │
│  │ 👤 You: I'm a senior developer with 5 years...     │   │
│  │                                                      │   │
│  │ 🤖 AI: Great, what technologies do you...          │   │
│  │ ⏳ AI is thinking...                               │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Progress: ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
├─────────────────────────────────────────────────────────────┤
│  [Exit Interview]           [Finish Interview]             │
└─────────────────────────────────────────────────────────────┘
```

### Results Screen
```
┌───────────────────────────────────────────────────────────────────┐
│  QUALIFIED  Level: BASIC                                         │
│  Interview Report                                                │
├──────────────────────────────────────┬───────────────────────────┤
│ Overall Feedback                     │  Score                    │
│ ┌──────────────────────────────────┐ │  ┌──────────────────────┐ │
│ │ "Good technical knowledge but    │ │  │      Overall: 82%    │ │
│ │ needs to improve communication..." │ │  │  ◯━━━━━━━━━━░░░░     │ │
│ └──────────────────────────────────┘ │  │                      │ │
│                                       │  │  Technical:    75%   │ │
│ Question Breakdown                   │  │  Communication: 82%  │ │
│ ┌──────────────────────────────────┐ │  │  Alignment:     82%  │ │
│ │ Q: Tell about yourself  Rating:95%│ │  │                      │ │
│ │ Q: Technical skills     Rating:75%│ │  │ [Back to Setup]      │ │
│ │ Q: Problem solving      Rating:82%│ │  │ [Dashboard]          │ │
│ └──────────────────────────────────┘ │  └──────────────────────┘ │
│                                       │                          │
│ Suggestions                          │                          │
│ ┌──────────────────────────────────┐ │                          │
│ │ 1. Work on communication skills │ │                          │
│ │ 2. Deep dive into architecture  │ │                          │
│ │ 3. Practice system design       │ │                          │
│ └──────────────────────────────────┘ │                          │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Mobile (< 640px)
```
Interview Setup
├─ Single column layout
├─ Job description on top
├─ Resume upload below
└─ Difficulty cards stack vertically

Interview Session
├─ Full width transcript
├─ Timer visible at top
└─ Buttons stack vertically

Results
├─ Score circle on top
├─ Feedback below
├─ Suggestions as full width cards
```

### Tablet (640px - 1024px)
```
Interview Setup
├─ Two columns (Job + Resume)
├─ Difficulty cards in 2x2 grid
└─ Buttons side by side

Interview Session
├─ Transcript takes full width
├─ Timer and title on same line
└─ Buttons side by side

Results
├─ Score circle on right (sticky)
├─ Content on left
└─ Full layout
```

### Desktop (> 1024px)
```
Interview Setup
├─ Two columns (Job + Resume)
├─ Difficulty cards in 3 columns
└─ Buttons on bottom

Interview Session
├─ Full width transcript (600px height)
├─ Progress bar full width
└─ Buttons centered at bottom

Results
├─ Score circle sticky on right
├─ Content on left (lg:col-span-2)
└─ Full comparison layout
```

---

## 🎨 Color Scheme

### Difficulty Levels
- **BASIC**: Emerald Green (#10b981)
- **MEDIUM**: Blue (#3b82f6)
- **HARD**: Purple (#a855f7)

### Score Ranges
- **90-100%**: Emerald (Excellent)
- **80-89%**: Blue (Good)
- **70-79%**: Orange (Fair)
- **Below 70%**: Red (Needs Improvement)

### UI Elements
- **Background**: Dark with glass-morphism effect
- **Borders**: White 5-10% opacity
- **Text**: White for headings, gray-300 for body
- **Hover**: White 10% opacity background
- **Active**: Blue 500 with ring effect

---

## 🔘 Button States

### Normal Button
```
┌─────────────────┐
│  Click Me       │
└─────────────────┘
```

### Hover Button
```
┌─────────────────┐
│  Click Me  (bg) │
└─────────────────┘
Transition: 200ms
```

### Active Button
```
┌═════════════════┐
│ ✓ Click Me      │
└═════════════════┘
Scale: 1.05
Shadow: blue glow
```

### Disabled Button
```
┌─────────────────┐
│  Click Me (gray)│
└─────────────────┘
Opacity: 50%
Cursor: not-allowed
```

---

## 🎯 Focus States

All interactive elements have:
- **Keyboard Focus**: Blue ring outline
- **Hover State**: Slight background color change
- **Active State**: Scale 105% + shadow
- **Disabled State**: 50% opacity + cursor not-allowed

---

## 📏 Spacing Reference

```
Container Padding:     48px (p-12)
Section Gap:           32px (gap-8)
Card Padding:          24px (p-6)
Element Padding:       16px (p-4)
Text Spacing:          12px (mb-3)
Button Padding:        16px vertical (py-4)
```

---

## 🎬 Animations

### Fade In
- Duration: 500ms
- Used for: Page transitions

### Zoom In
- Duration: 500ms
- Used for: Modal openings

### Spin
- Infinite rotation
- Used for: Loading states

### Slide In
- From bottom: 500ms
- Used for: Card reveals

### Progress Bar
- Smooth transition: 300ms
- Used for: Time indicator

---

## 📊 Icon Usage

- 🤖 AI responses
- 👤 User responses
- 🎤 Audio input
- 🔒 Locked levels
- ✅ Completed tasks
- ⏳ Processing
- ⏱️ Timer
- 📊 Results
- 💡 Tips
- ⚠️ Warnings

---

## 🎓 Accessibility

- ✅ Color contrast > 4.5:1 WCAG AA
- ✅ Focus indicators visible
- ✅ Keyboard navigation supported
- ✅ Screen reader friendly labels
- ✅ Responsive text sizes
- ✅ Clear hierarchy

---

## 📐 Typography

```
Headings (h1):     5xl (3rem)    font-black
Headings (h2):     4xl (2.25rem) font-black
Headings (h3):     2xl (1.5rem)  font-bold
Subheading:        lg (1.125rem) font-bold
Body:              base (1rem)   text-gray-300
Small:             sm (0.875rem) text-gray-500
Tiny:              xs (0.75rem)  text-gray-600 uppercase
```

---

**Design System**: Custom Tailwind CSS
**Breakpoints**: Mobile-first responsive
**Theme**: Dark mode only
**Icons**: Inline SVG
