import { cn } from "../../lib/cn";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-lg shadow-black/20",
        "backdrop-blur supports-[backdrop-filter]:bg-white/5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-5">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-white/60">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardBody({ children }: { children?: React.ReactNode }) {
  return <div className="px-5 pb-5">{children}</div>;
}