import { cn } from "../../lib/cn";

type Variant = "default" | "success" | "warning" | "danger" | "muted";

const variantClasses: Record<Variant, string> = {
  default: "bg-white/10 text-white",
  success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  danger: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
  muted: "bg-zinc-500/10 text-zinc-300 ring-1 ring-white/10",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}