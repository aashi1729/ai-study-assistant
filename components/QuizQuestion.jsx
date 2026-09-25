const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  onSelectOption,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
        Question {questionNumber} of {totalQuestions}
      </p>
      <h2 className="mt-2 text-lg font-semibold leading-7 text-slate-900 sm:text-xl">{question.question}</h2>

      <fieldset className="mt-5">
        <legend className="sr-only">Choose an answer</legend>
        <div className="grid grid-cols-1 gap-2">
          {question.options.map((option, index) => {
            const selected = selectedOptionId === option.id;

            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                  selected
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={selected}
                  onChange={() => onSelectOption(option.id)}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    selected ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {OPTION_LETTERS[index]}
                </span>
                <span className="text-sm leading-6 text-slate-800">{option.text}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
