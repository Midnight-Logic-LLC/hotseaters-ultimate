# change-422 — Welcome header matches bible exactly

## Why
Port `src/features/dashboard/widgets/welcome-header.tsx`:
```tsx
Welcome back{userInfo?.first_name ? `, ${userInfo.first_name}` : ''}
```
Bible `HotSeatersMVP/src/pages/Dashboard.jsx:703`:
```jsx
Welcome back, {userInfo?.first_name || 'User'}
```

Two divergences:
1. **No fallback name** in port → while `tier1.userInfo` is null at
   first paint, port renders "Welcome back" (no comma, no name).
   Bible renders "Welcome back, User".
2. **Comma conditional** → port suppresses the comma when name is
   missing, causing a visible layout shift from "Welcome back" →
   "Welcome back, Travis" when tier1 hydrates. Bible keeps the comma
   stable.

User's screenshot shows the divergence clearly: port = "Welcome back",
bible = "Welcome back, Travis" — for the same user with the same data.

## What changes
EDIT `src/features/dashboard/widgets/welcome-header.tsx` to match the
bible's JSX exactly:
```tsx
Welcome back, {userInfo?.first_name || 'User'}
```

## Out of scope
- Sidebar typography mismatches (assessment §B.3).
- Mobile welcome header (bible hides the desktop one at < lg;
  there's no mobile equivalent in the dashboard region).

## Tasks → see `tasks.md`.
