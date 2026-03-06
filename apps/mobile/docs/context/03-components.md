# Reusable Components

All exported from `src/components/index.ts`. Use design tokens from `@/styles/tokens` (colors, spacing, typography).

---

## Button

- **File:** `Button.tsx`
- **Props:** `variant` ('primary' | 'secondary' | 'ghost'), `size` ('small' | 'medium' | 'large'), `fullWidth?`, `disabled?`, `onPress`, `icon?`, `iconPosition?` ('left' | 'right'), `style?`, `children`
- **Use:** Primary and secondary CTAs across the app.

---

## ProgressIndicator

- **File:** `ProgressIndicator.tsx`
- **Props:** Progress value and styling (e.g. ring or bar).
- **Use:** Lesson progress, loading states.

---

## BottomNav

- **File:** `BottomNav.tsx`
- **Props:** `activePage`: 'Home' | 'Review' | 'Challenge' | 'Profile'
- **Exports:** `BOTTOM_NAV_BAR_HEIGHT`, `useBottomNavPadding()` for safe area above nav.
- **Behavior:** Four tabs + green FAB for Capture (`navigation.push('Capture')`). Use for layout padding so content isn’t hidden behind the nav.

---

## Card, HeroCard, HorizontalCard

- **File:** `Card.tsx`
- **Card:** Generic pressable card with optional onPress.
- **HeroCard:** Large card with image, title, description, badge, children.
- **HorizontalCard:** Horizontal layout (image + content).
- **Use:** Home sections, Review hero card, lesson/drill cards.

---

## IconButton

- **File:** `IconButton.tsx`
- **Props:** `icon` (string emoji or ReactNode for Phosphor icons), `onPress?`, `size?` ('small' | 'medium' | 'large'), `variant?` ('default' | 'ghost'), `disabled?`, `style?`
- **Use:** Back, close, help, bookmark, etc.

---

## FilterChip

- **File:** `FilterChip.tsx`
- **Props:** Label, selected state, onPress.
- **Use:** Filters (e.g. leaderboard, history).

---

## MetaTag

- **File:** `MetaTag.tsx`
- **Props:** `icon?` (string or ReactNode), `label`, `variant?` ('default' | 'compact'), `style?`
- **Use:** Drill/lesson meta (difficulty, duration, equipment) — supports Phosphor icons.

---

## VideoPlayer

- **File:** `VideoPlayer.tsx`
- **Props:** `thumbnailUrl` (string), `duration?`, `onPlayPress?`, `style?`
- **Use:** Lesson and drill video placeholders (thumbnail + duration badge).
