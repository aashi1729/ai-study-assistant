export default function FlashcardCard({ card, isFlipped, onFlip, cardNumber, totalCards }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          {isFlipped ? "Back" : "Front"}
        </p>
        <p className="text-sm font-semibold text-slate-700">
          Card {cardNumber} of {totalCards}
        </p>
      </div>

      <div className="mt-4 min-h-40 rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
          {isFlipped ? "Answer" : "Question"}
        </p>
        <p className="mt-3 text-lg font-semibold leading-7 text-slate-900 sm:text-xl">
          {isFlipped ? card.answer : card.question}
        </p>
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onFlip}
          className="rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
        >
          Flip Card
        </button>
      </div>
    </section>
  );
}
