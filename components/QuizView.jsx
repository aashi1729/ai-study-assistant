"use client";

import { useMemo, useRef, useState } from "react";
import AppShell from "./AppShell";
import QuizQuestion from "./QuizQuestion";
import QuizResults from "./QuizResults";
import { currentUser } from "../data/sampleData";
import { saveStudySession } from "../lib/studyHistory";

const COUNT_OPTIONS = [
  { id: 5, label: "5 questions", hint: "Quick check" },
  { id: 10, label: "10 questions", hint: "Standard set" },
  { id: 15, label: "15 questions", hint: "Full practice" },
];

const DIFFICULTY_OPTIONS = [
  { id: "easy", label: "Easy", hint: "Warm-up" },
  { id: "medium", label: "Medium", hint: "Exam-ready" },
  { id: "hard", label: "Hard", hint: "Challenge" },
];

const DIFFICULTY_TO_API = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export default function QuizView() {
  const [searchValue, setSearchValue] = useState("");
  const [notes, setNotes] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [historyMessage, setHistoryMessage] = useState("");
  const generateRequest = useRef(null);

  const characterCount = notes.length;
  const wordCount = useMemo(() => {
    const words = notes.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [notes]);

  const inQuiz = questions.length > 0 && !submitted;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const selectedOptionId = selectedAnswers[currentIndex] ?? null;

  function resetQuizState() {
    if (generateRequest.current) {
      generateRequest.current.abort();
    }
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setSubmitted(false);
    setLoading(false);
  }

  async function handleGenerate(event) {
    event.preventDefault();

    if (!notes.trim()) {
      setError("Please paste some study notes first. I need text before I can generate a quiz.");
      resetQuizState();
      return;
    }

    if (![5, 10, 15].includes(questionCount)) {
      setError("Choose 5, 10, or 15 questions.");
      return;
    }

    setError("");
    setLoading(true);
    setSubmitted(false);
    setQuestions([]);
    setSelectedAnswers([]);
    setCurrentIndex(0);

    if (generateRequest.current) {
      generateRequest.current.abort();
    }

    const controller = new AbortController();
    generateRequest.current = controller;

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes,
          questionCount,
          difficulty: DIFFICULTY_TO_API[difficulty],
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Something went wrong while generating the quiz.");
        setQuestions([]);
        return;
      }

      const nextQuestions = Array.isArray(data.questions) ? data.questions : [];

      if (nextQuestions.length === 0) {
        setError("The quiz generator returned no questions. Try again.");
        setQuestions([]);
        return;
      }

      setQuestions(nextQuestions);
      setSelectedAnswers(nextQuestions.map(() => null));
      setCurrentIndex(0);
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        return;
      }

      setError("Could not reach the quiz generator. Check that the app is running and try again.");
      setQuestions([]);
    } finally {
      if (generateRequest.current === controller) {
        setLoading(false);
      }
    }
  }

  function handleSelectOption(optionId) {
    setSelectedAnswers((previous) => {
      const next = [...previous];
      next[currentIndex] = optionId;
      return next;
    });
    if (error) {
      setError("");
    }
  }

  function handlePrevious() {
    setError("");
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function handleNext() {
    if (!selectedAnswers[currentIndex]) {
      setError("Please choose an answer before going to the next question.");
      return;
    }

    setError("");
    setCurrentIndex((index) => Math.min(questions.length - 1, index + 1));
  }

  function handleSubmit() {
    if (!selectedAnswers[currentIndex]) {
      setError("Please choose an answer before submitting the quiz.");
      return;
    }

    const unanswered = selectedAnswers.some((answer) => !answer);
    if (unanswered) {
      setError("Please answer every question before submitting.");
      return;
    }

    setError("");
    setSubmitted(true);

    const score = selectedAnswers.filter((answer, index) => answer === questions[index].correctOptionId).length;
    saveStudySession({
      type: "quiz",
      title: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} quiz`,
      sourceName: "Quiz Generator",
      score,
      totalQuestions: questions.length,
    });
    setHistoryMessage("Saved to Study History");
  }

  function handleRestart() {
    setError("");
    setHistoryMessage("");
    resetQuizState();
  }

  return (
    <AppShell user={currentUser} searchValue={searchValue} onSearchChange={setSearchValue}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a href="/" className="w-fit text-sm font-semibold text-sky-700 transition hover:text-sky-800">
          ← Back to Dashboard
        </a>
      </div>

      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">AI Quiz Generator</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Turn your study notes into an interactive quiz.
        </p>
      </section>

      {!inQuiz && !submitted ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
          <form onSubmit={handleGenerate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <label htmlFor="quiz-notes" className="text-sm font-semibold text-slate-900">
              Study notes
            </label>
            <textarea
              id="quiz-notes"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              rows={12}
              placeholder="Paste lecture notes, textbook paragraphs, or revision points here..."
              className="mt-3 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-slate-400">
                {wordCount} {wordCount === 1 ? "word" : "words"} · {characterCount}{" "}
                {characterCount === 1 ? "character" : "characters"}
              </p>
              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-slate-900">Question count</legend>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {COUNT_OPTIONS.map((option) => {
                  const selected = questionCount === option.id;

                  return (
                    <label
                      key={option.id}
                      className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
                        selected
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="questionCount"
                        value={option.id}
                        checked={selected}
                        onChange={() => setQuestionCount(option.id)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                      <span className="mt-1 block text-xs text-slate-500">{option.hint}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-slate-900">Difficulty</legend>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {DIFFICULTY_OPTIONS.map((option) => {
                  const selected = difficulty === option.id;

                  return (
                    <label
                      key={option.id}
                      className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
                        selected
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        value={option.id}
                        checked={selected}
                        onChange={() => setDifficulty(option.id)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                      <span className="mt-1 block text-xs text-slate-500">{option.hint}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
              >
                {loading ? "Generating..." : "Generate Quiz"}
              </button>
            </div>
          </form>

          <div className="min-w-0">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 p-6">
                <p className="text-sm font-semibold text-sky-800">Creating your quiz</p>
                <p className="mt-2 text-sm leading-6 text-sky-700">
                  Waiting for the server to talk to Gemini. This is no longer a mock quiz.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-500">
                Your quiz will appear here after you click Generate Quiz. Your notes are sent to a
                server route at /api/quiz — not to a mock function in the browser.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {inQuiz && currentQuestion ? (
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} · {questions.length} questions
            </p>
            <p className="text-sm font-semibold text-slate-700">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>

          <QuizQuestion
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedOptionId={selectedOptionId}
            onSelectOption={handleSelectOption}
          />

          {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Previous
            </button>
            {isLastQuestion ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      ) : null}

      {submitted ? (
        <div className="mx-auto max-w-4xl">
          <QuizResults
            questions={questions}
            selectedAnswers={selectedAnswers}
            onRestart={handleRestart}
            historyMessage={historyMessage}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
