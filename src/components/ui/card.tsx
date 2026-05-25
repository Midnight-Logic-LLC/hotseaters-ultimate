/**
 * Card primitive — bible-parity look.
 *
 * Default chrome (border + shadow + radius + background) binds to the
 * `--theme-card-*` tokens declared in `src/index.css`. The bible
 * (`HotSeatersMVP/src/components/ui/card.jsx`) renders each Card as a
 * `div` with `rounded-xl border bg-card text-card-foreground shadow`
 * and every consuming widget (see `Dashboard.jsx:926+`) overrides
 * `borderRadius`, `boxShadow`, `borderWidth`, and `backgroundColor`
 * via inline `style={}` pointing at the same `--theme-card-*` tokens.
 * We collapse those two layers into one default-bound primitive so
 * every Card consumer in the port inherits the bible look without
 * per-call boilerplate.
 *
 * Spread order: `props.style` is spread AFTER the defaults, so any
 * consumer that genuinely needs to override a token can do so via
 * `<Card style={{ borderRadius: '...' }} />`. The matching dashboard
 * widgets keep using `cardStyle()` from `widgets/_styles.ts` — same
 * values, so the spread is a no-op for them today but the boilerplate
 * stays useful when a feature wants to deviate.
 *
 * DO NOT add `ring-*`, `rounded-*`, or hard `bg-*` classes back to
 * the default className. If a different look is required, change the
 * token in `src/index.css` (light + dark blocks).
 */

import * as React from "react"

import { cn } from "@/shared/lib/cn"

const cardDefaultStyle: React.CSSProperties = {
  borderRadius: "var(--theme-card-radius)",
  boxShadow: "var(--theme-card-shadow)",
  borderWidth: "var(--theme-card-border)",
  borderStyle: "solid",
  borderColor: "var(--theme-stone-200)",
  backgroundColor: "var(--theme-card-bg)",
}

function Card({
  className,
  size = "default",
  style,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      style={{ ...cardDefaultStyle, ...style }}
      className={cn(
        // Layout-only classes. Chrome (border / shadow / radius / bg)
        // lives in `cardDefaultStyle` above so consumers' inline
        // `style={}` overrides actually win (inline > class for the
        // same property).
        "group/card flex flex-col gap-4 text-sm text-card-foreground has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      style={{ padding: "var(--theme-card-header-padding)", ...style }}
      className={cn(
        // Padding now token-driven via inline style above. Keep the
        // layout grid + size variants; per-call style can still
        // override the padding.
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      // Default to full token padding on all four sides — matches how
      // dashboard widgets explicitly override (`<CardContent style={{
      // padding: 'var(--theme-card-padding)' }}>`) in the bible. The
      // bible's own primitive uses `p-6 pt-0`, but every consuming
      // widget overrides that to all-four-sides padding, so the
      // effective default is "all four". Consumers needing `pt: 0`
      // (e.g. when their header has no border-bottom and they want
      // the title hugging the body) can still override via `style`.
      style={{ padding: "var(--theme-card-padding)", ...style }}
      className={cn("", className)}
      {...props}
    />
  )
}

function CardFooter({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      style={{ padding: "var(--theme-card-padding)", ...style }}
      className={cn(
        // Keep the bible-aligned divider + muted background; padding now
        // token-driven via inline style above.
        "flex items-center border-t bg-muted/50",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
