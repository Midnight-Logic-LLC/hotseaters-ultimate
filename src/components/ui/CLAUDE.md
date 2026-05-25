# `src/components/ui/` — base primitives

This directory holds the shadcn-derived primitives the entire app
consumes (`Button`, `Card`, `Dialog`, `Input`, `Tabs`, etc.). When
a primitive's look diverges from the bible
(`/Users/gqadonis/Projects/courtroom/HotSeatersMVP`), the fix lives
here — NOT in each feature widget.

The bible is the ground truth for cosmetic parity (RULE 0, RULE 2 of
the project CLAUDE.md, RULE 3 of the assessment for
dashboard-bible-parity-build).

## The token-binding contract (Card example)

`Card` binds its chrome (border + shadow + radius + background) to
the bible's `--theme-card-*` tokens via inline `style={}`. The bible
does the same thing at every consumer site
(`Dashboard.jsx:926` and friends override
`borderRadius/borderWidth/boxShadow/backgroundColor` per-card); we
collapse those overrides into a single primitive default so the
port doesn't need per-widget boilerplate.

```tsx
// src/components/ui/card.tsx — DO NOT REGRESS
const cardDefaultStyle: React.CSSProperties = {
  borderRadius: "var(--theme-card-radius)",
  boxShadow: "var(--theme-card-shadow)",
  borderWidth: "var(--theme-card-border)",
  borderStyle: "solid",
  borderColor: "var(--theme-stone-200)",
  backgroundColor: "var(--theme-card-bg)",
}

function Card({ className, style, ...props }) {
  return (
    <div
      style={{ ...cardDefaultStyle, ...style }}  // spread style AFTER defaults
      className={cn(
        // Layout-only classes here. NO chrome classes.
        "group/card flex flex-col gap-4 text-sm text-card-foreground ...",
        className
      )}
      {...props}
    />
  )
}
```

### Why this matters

- **Tokens come first, classes second.** Inline `style` beats class
  rules for the same property in browser specificity. The bible
  widgets rely on this — they pass `style={{ borderRadius: '...' }}`
  expecting it to win. If you add `rounded-xl` to the primitive's
  default className, that overrides the token at low specificity but
  the inline style wins again — *unless* the class uses something
  the inline style can't reach (like `ring-1`, which is a synthetic
  `box-shadow` overlay). In that case the widget can never look
  right and you'll spend a debugging round (see May 2026 regression
  on the dashboard cards — the primitive had `ring-1 ring-foreground/10`
  that no widget override could touch).

- **Per-call overrides still work.** `props.style` is spread AFTER
  the defaults, so a consumer that genuinely needs a different
  border color or radius can still pass `<Card style={{ borderColor: '...' }} />`.

## Anti-patterns to NEVER reintroduce

- `ring-*`, `rounded-*`, `bg-card`, `overflow-hidden`, `border-*`,
  `shadow-*` in `Card`'s default className. Use the token-bound
  inline style instead. If a different look is required, change the
  token value in `src/index.css` (both `:root` and `.dark` blocks).
- Per-widget `style={{ borderRadius: 'var(--theme-card-radius)', ... }}`
  boilerplate. The primitive default already binds the same tokens;
  passing them again is redundant. (The dashboard `widgets/_styles.ts`
  `cardStyle()` helper is kept for now as a no-op compat layer but
  is on the deprecation list — a future change can remove it.)

## Token sources

All `--theme-*` tokens are declared in `src/index.css` in BOTH the
`:root` block (light mode) and the `.dark` block (dark mode). Always
add both at the same time when introducing a new token. Cross-check
against `HotSeatersMVP/src/index.css` to make sure the values match.

## When to deviate from the bible

Only when the bible itself is a known defect (e.g. a button missing
a focus ring). Document the deviation in the diverging primitive's
file header with a `// DELIBERATE BIBLE DIVERGENCE:` comment block.
Without that comment, drift from the bible is treated as a defect
(see `docs/LESSONS.md` for the running record).
