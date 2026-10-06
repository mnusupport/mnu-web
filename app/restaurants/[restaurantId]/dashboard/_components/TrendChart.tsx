import type { DashboardPeriod, DashboardTrendPoint } from '@/lib/api';

type Props = {
  trend: DashboardTrendPoint[];
  period: DashboardPeriod;
  hasData: boolean;
};

function isValidPoint(point: DashboardTrendPoint): boolean {
  return Boolean(
    point &&
      typeof point.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(point.date) &&
      Number.isFinite(Number(point.sales)) &&
      Number.isFinite(Number(point.orders)),
  );
}

function formatLabel(date: string, period: DashboardPeriod) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    ...(period === 'week' ? { weekday: 'short' } : {}),
    month: period === 'month' ? 'short' : undefined,
    timeZone: 'UTC',
  });
}

export function TrendChart({ trend, period, hasData }: Props) {
  const points = Array.isArray(trend)
    ? trend.filter(isValidPoint).map((point) => ({
        ...point,
        sales: Math.max(0, Number(point.sales)),
        orders: Math.max(0, Number(point.orders)),
      }))
    : [];

  const maxSales = Math.max(1, ...points.map((point) => point.sales));
  const showData = hasData && points.length > 0;
  const chartWidth = Math.max(560, points.length * 72);
  const chartHeight = 220;
  const baseline = 170;
  const chartTop = 18;
  const plotHeight = baseline - chartTop;
  const step = points.length > 1 ? (chartWidth - 48) / (points.length - 1) : 0;

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">Sales trend</p>
          <p className="mt-0.5 text-xs text-ink-400">
            {period === 'week' ? 'Daily sales · Monday to today' : 'Daily sales · month start to today'}
          </p>
        </div>
        {showData && (
          <span className="rounded-full bg-terracotta-50 px-2.5 py-1 text-[11px] font-semibold text-terracotta-600">
            {points.length} day{points.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {!showData ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl bg-ink-50 px-4 text-center text-sm text-ink-400">
          No data available for this period.
        </div>
      ) : (
        <div className="w-full overflow-x-auto overflow-y-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-[220px] w-full min-w-[560px]"
            role="img"
            aria-label={`Daily sales trend for ${period === 'week' ? 'this week' : 'this month'}`}
            preserveAspectRatio="none"
          >
            {[0, 0.5, 1].map((ratio) => {
              const y = baseline - ratio * plotHeight;
              return (
                <line
                  key={ratio}
                  x1="24"
                  x2={chartWidth - 24}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-ink-100"
                  strokeWidth="1"
                />
              );
            })}

            {points.map((point, index) => {
              const x = points.length === 1 ? chartWidth / 2 : 24 + index * step;
              const y = baseline - (point.sales / maxSales) * plotHeight;
              const label = formatLabel(point.date, period);
              return (
                <g key={point.date}>
                  <line x1={x} x2={x} y1={baseline} y2={y} stroke="currentColor" className="text-terracotta-100" strokeWidth="14" strokeLinecap="round" />
                  <circle cx={x} cy={y} r="5" fill="#E07A5F" />
                  <title>{`${label}: ₹${point.sales} · ${point.orders} orders`}</title>
                  <text x={x} y={baseline + 22} textAnchor="middle" className="fill-ink-400 text-[10px] font-medium">
                    {label}
                  </text>
                </g>
              );
            })}

            <line x1="24" x2={chartWidth - 24} y1={baseline} y2={baseline} stroke="currentColor" className="text-ink-200" strokeWidth="1" />
          </svg>
        </div>
      )}
    </div>
  );
}
