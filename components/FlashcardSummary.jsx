export default function FlashcardSummary({
  total,
  knownCount,
  reviewCount,
  unansweredCount,
  onRestart,
  onStudyAgain,
  onSaveToHistory,
  historyMessage,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Flashcard summary</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">Review complete</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        See how many cards you know, still need to review, or left unmarked.
      </p>

      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total cards</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{total}</dd>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-800">I Know This</dt>
          <dd className="mt-1 text-2xl font-semibold text-emerald-900">{knownCount}</dd>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-amber-800">Need to Review</dt>
          <dd className="mt-1 text-2xl font-semibold text-amber-900">{reviewCount}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Not answered</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{unansweredCount}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Restart
        </button>
        {onSaveToHistory ? (
          <button
            type="button"
            onClick={onSaveToHistory}
            className="rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-50"
          >
            {historyMessage || "Save to Study History"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onStudyAgain}
          className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Study Again
        </button>
      </div>
    </section>
  );
}
