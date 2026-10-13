export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex min-h-[112px] flex-col justify-between rounded-2xl border border-ink-100 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-semibold leading-4 text-ink-400">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-ink-900" title={value}>{value}</p>
      {hint && <p className="mt-1 truncate text-[11px] text-ink-400" title={hint}>{hint}</p>}
    </div>
  );
}
