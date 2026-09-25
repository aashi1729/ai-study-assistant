const typeStyles = {
  Summary: "bg-indigo-50 text-indigo-700",
  Quiz: "bg-sky-50 text-sky-700",
  Flashcards: "bg-amber-50 text-amber-700",
  Timer: "bg-rose-50 text-rose-700",
};

export default function RecentSession({ subject, topic, type, duration, date }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {subject} <span className="font-medium text-slate-400">—</span> {topic}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {duration} · {date}
        </p>
      </div>
      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${typeStyles[type] || "bg-slate-100 text-slate-600"}`}>
        {type}
      </span>
    </article>
  );
}
