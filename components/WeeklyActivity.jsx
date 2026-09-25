export default function WeeklyActivity({ days, className = "mb-8" }) {
  const maxCount = Math.max(1, ...days.map((day) => day.count));

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Weekly activity</h2>
        <p className="mt-1 text-sm text-slate-500">Saved study sessions for the last 7 calendar days.</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {days.map((day) => {
          const width = day.count === 0 ? 0 : Math.max(8, Math.round((day.count / maxCount) * 100));

          return (
            <div key={day.dateKey} className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-xs font-semibold text-slate-500">{day.label}</span>
              <div className="h-3 min-w-0 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-indigo-500 transition-[width]"
                  style={{ width: `${width}%` }}
                  title={`${day.count} session${day.count === 1 ? "" : "s"}`}
                />
              </div>
              <span className="w-5 shrink-0 text-right text-xs font-medium text-slate-400">{day.count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
