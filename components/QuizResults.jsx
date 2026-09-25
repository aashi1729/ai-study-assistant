function optionText(question, optionId) {
  const option = question.options.find((item) => item.id === optionId);
  return option ? option.text : "No answer selected";
}

export default function QuizResults({ questions, selectedAnswers, onRestart, historyMessage }) {
  const correctItems = [];
  const incorrectItems = [];

  questions.forEach((question, index) => {
    const selectedId = selectedAnswers[index];
    const isCorrect = selectedId === question.correctOptionId;
    const row = {
      id: question.id,
      question: question.question,
      selectedText: optionText(question, selectedId),
      correctText: optionText(question, question.correctOptionId),
    };

    if (isCorrect) {
      correctItems.push(row);
    } else {
      incorrectItems.push(row);
    }
  });

  const score = correctItems.length;
  const total = questions.length;
  const percent = total === 0 ? 0 : Math.round((score / total) * 100);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Quiz results</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">
        Score: {score} / {total} ({percent}%)
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Review which answers were correct, then restart if you want another attempt.
      </p>
      {historyMessage ? <p className="mt-2 text-sm font-medium text-emerald-700">{historyMessage}</p> : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-emerald-800">Correct answers ({correctItems.length})</h3>
          {correctItems.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">None of the answers were correct this time.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {correctItems.map((item) => (
                <li key={item.id} className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                  <p className="mt-1 text-sm text-emerald-800">Your answer: {item.selectedText}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-rose-800">Incorrect answers ({incorrectItems.length})</h3>
          {incorrectItems.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">You answered every question correctly.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {incorrectItems.map((item) => (
                <li key={item.id} className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                  <p className="mt-1 text-sm text-rose-800">Your answer: {item.selectedText}</p>
                  <p className="mt-1 text-sm text-slate-700">Correct answer: {item.correctText}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Restart Quiz
        </button>
      </div>
    </section>
  );
}
