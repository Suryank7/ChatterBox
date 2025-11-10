# Design Guidelines: Real-Time Chat Application

## Design Approach

**Reference-Based with System Principles**
Drawing inspiration from WhatsApp and Telegram's clean messaging interfaces combined with modern web design systems. Focus on clarity, efficiency, and real-time feedback that doesn't distract from conversations.

---

## Core Design Principles

1. **Conversation-First**: Every design decision prioritizes readability and ease of communication
2. **Immediate Feedback**: Real-time states (typing, online, read) must be instantly visible
3. **Spatial Efficiency**: Maximize message display area, minimize chrome
4. **Clear Hierarchy**: Sent vs received messages immediately distinguishable

---

## Typography

**Font Stack:**
- Primary: Inter or System UI fonts via Google Fonts
- Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI"

**Hierarchy:**
- Page Titles: 24px/semibold
- User Names: 16px/medium
- Message Text: 15px/regular
- Timestamps: 12px/regular
- Metadata (status, counts): 13px/medium

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 3, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Message spacing: gap-2 between messages, gap-6 between conversation groups
- Input areas: p-3 or p-4
- Screen margins: px-4 on mobile, px-6 on desktop

**Grid Structure:**
- Auth screens: Single column, max-w-md centered
- User list: Single column, full width with max-w-2xl
- Chat interface: Full viewport height layout

---

## Component Library

### Authentication Screens (Login/Register)

**Layout:**
- Centered card (max-w-md) with generous padding (p-8)
- Logo/app name at top (mb-8)
- Form fields with clear labels above inputs
- Primary CTA button full width
- Secondary action (switch to login/register) as text link below

**Form Inputs:**
- Height: h-12
- Rounded: rounded-lg
- Border on all states with focus ring
- Padding: px-4

### User List Screen

**Structure:**
- Fixed header with app title and user profile icon
- Scrollable list of user cards
- Each user card contains:
  - Avatar (left, 48x48px, rounded-full)
  - User info block (flex-1):
    - Name (top, font-medium)
    - Last message preview (text-sm, truncate, 1 line)
  - Right metadata:
    - Timestamp (text-xs, text-right)
    - Unread count badge (if applicable, rounded-full)
    - Online status indicator (8x8px dot, absolute on avatar)

**User Card Spacing:**
- Padding: p-4
- Gap between avatar and content: gap-3
- Border bottom for separation

### Chat Interface

**Layout Structure (Full Height):**
```
[Header: Fixed top, h-16]
├─ Back button
├─ User name + online status
└─ Menu icon

[Messages: flex-1, overflow-scroll, p-4]
├─ Date separators (text-center, text-xs, my-4)
├─ Message bubbles
└─ Typing indicator (when active)

[Input Area: Fixed bottom, border-top]
├─ Text input (flex-1)
└─ Send button
```

**Message Bubbles:**
- Max width: 75% of screen
- Sent messages: Align right, rounded-2xl (rounded-br-sm)
- Received messages: Align left, rounded-2xl (rounded-bl-sm)
- Padding: px-4 py-2.5
- Margin between bubbles: mb-2
- Consecutive messages from same sender: Reduced gap (mb-1)

**Message Metadata:**
- Timestamp: text-xs, mt-1 below message text
- Read receipts: Small icons (14x14px) inline with timestamp
- States: Sent (single tick), Delivered (double tick), Read (double tick filled)

**Typing Indicator:**
- Positioned like a received message
- Animated dots (3 dots, simple fade animation)
- Text: "[Name] is typing..."

**Input Area:**
- Container: border-t, p-3, flex gap-2
- Input: flex-1, rounded-full, px-4, h-11
- Send button: Icon button (Paper plane/arrow), 40x40px, rounded-full

### Status Indicators

**Online Status Dot:**
- Size: 8x8px or 10x10px
- Position: Absolute bottom-right on avatar (with white border ring)
- Online: Solid fill
- Offline: Hidden or gray

**Unread Badge:**
- Rounded-full, min-w-[20px], h-5
- Padding: px-1.5
- Font: text-xs, font-medium
- Position: Top right of user card

---

## Responsive Behavior

**Mobile (default):**
- User list: Full width
- Chat: Full width
- Single column layouts

**Desktop (md: and up):**
- Combined view: User list (w-80 or w-96) + Chat area (flex-1)
- User list: Fixed sidebar with border-right
- Chat: Takes remaining space
- Both sections full viewport height

---

## Micro-interactions

**Keep Minimal:**
- Hover states on user cards: Subtle background change
- Message send: Instant append to chat (optimistic UI)
- Typing indicator: Fade in/out smoothly
- Read receipts: Update instantly without animation
- Online status: Update without animation (avoid distraction)

**NO complex animations** - focus on instant, clear state changes

---

## Images

**Avatars:**
- User avatars throughout (user list, chat header)
- Use placeholder service: `https://ui-avatars.com/api/?name=[UserName]&background=random`
- Size: 48x48px (user list), 40x40px (chat header)
- Always rounded-full

**No hero images** - This is a utility application focused on conversations

---

## Accessibility

- All interactive elements min 44x44px touch target
- Clear focus states with visible outline rings
- Proper contrast ratios for all text (especially timestamps/metadata)
- Semantic HTML: `<main>`, `<nav>`, `<form>`, `<button>`
- ARIA labels for icon-only buttons (send, back, menu)
- Screen reader announcements for new messages (aria-live)

---

## Critical Implementation Notes

1. **Message Alignment**: Use flexbox with `justify-end` for sent, `justify-start` for received
2. **Scroll Behavior**: Chat container should auto-scroll to bottom on new messages
3. **Input Focus**: Auto-focus message input when entering chat
4. **Viewport Height**: Use `h-screen` or `h-[100dvh]` for full-height mobile experience
5. **Overflow**: Messages container must be `overflow-y-auto` with flex-1 to enable scrolling