import clsx from "clsx";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-teal-600 text-white hover:bg-teal-700",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    uploaded: "bg-slate-100 text-slate-700",
    parsed: "bg-blue-50 text-blue-700",
    needs_review: "bg-amber-50 text-amber-800",
    approved: "bg-teal-50 text-teal-800",
    excluded: "bg-rose-50 text-rose-700",
  };
  return <span className={clsx("rounded px-2 py-1 text-xs font-semibold", map[status] ?? map.uploaded)}>{status}</span>;
}

export function Money({ value, currency = "EUR" }: { value: number | string | null | undefined; currency?: string | null }) {
  const numeric = typeof value === "string" ? Number(value) : value ?? 0;
  return (
    <span>
      {new Intl.NumberFormat("el-GR", { style: "currency", currency: currency || "EUR" }).format(Number(numeric || 0))}
    </span>
  );
}
