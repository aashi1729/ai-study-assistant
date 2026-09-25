"use client";

import { useState } from "react";
import SummaryResult from "./SummaryResult";
import QuizQuestion from "./QuizQuestion";
import QuizResults from "./QuizResults";
import FlashcardCard from "./FlashcardCard";
import FlashcardSummary from "./FlashcardSummary";
import { saveStudySession } from "../lib/studyHistory";

export default function PdfStudyPanel({ extractedText }) {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [quizError, setQuizError] = useState("");
  const [flashcardsError, setFlashcardsError] = useState("");
  const [summary, setSummary] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [cards, setCards] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStatuses, setCardStatuses] = useState([]);
  const [showCardSummary, setShowCardSummary] = useState(false);
  const [quizHistoryMessage, setQuizHistoryMessage] = useState("");
  const [flashcardHistoryMessage, setFlashcardHistoryMessage] = useState("");

  const canStudy = Boolean(extractedText);
  const currentQuestion = questions[quizIndex];
  const currentCard = cards[cardIndex];
  const currentStatus = cardStatuses[cardIndex] || "unanswered";
  const knownCount = cardStatuses.filter((status) => status === "known").length;
  const reviewCount = cardStatuses.filter((status) => status === "review").length;
  const unansweredCount = cardStatuses.filter((status) => status === "unanswered").length;

  async function handleSummary() {
    if (!canStudy || summaryLoading) {
      return;
    }

    setSummaryError("");
    setSummaryLoading(true);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: extractedText,
          summaryLength: "medium",
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSummaryError(data.message || "Something went wrong while generating the summary.");
        return;
      }

      setSummary(data.summary || null);
    } catch {
      setSummaryError("Could not reach the summarizer. Check that the app is running and try again.");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleQuiz() {
    if (!canStudy || quizLoading) {
      return;
    }

    setQuizError("");
    setQuizLoading(true);

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: extractedText,
          questionCount: 5,
          difficulty: "Medium",
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setQuizError(data.message || "Something went wrong while generating the quiz.");
        return;
      }

      const nextQuestions = Array.isArray(data.questions) ? data.questions : [];
      if (nextQuestions.length === 0) {
        setQuizError("The quiz generator returned no questions. Try again.");
        return;
      }

      setQuestions(nextQuestions);
      setSelectedAnswers(nextQuestions.map(() => null));
      setQuizIndex(0);
      setQuizSubmitted(false);
    } catch {
      setQuizError("Could not reach the quiz generator. Check that the app is running and try again.");
    } finally {
      setQuizLoading(false);
    }
  }

  async function handleFlashcards() {
    if (!canStudy || flashcardsLoading) {
      return;
    }

    setFlashcardsError("");
    setFlashcardsLoading(true);

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: extractedText,
          cardCount: 5,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFlashcardsError(data.message || "Something went wrong while generating flashcards.");
        return;
      }

      const nextCards = Array.isArray(data.flashcards) ? data.flashcards : [];
      if (nextCards.length === 0) {
        setFlashcardsError("The flashcard generator returned no cards. Try again.");
        return;
      }

      setCards(nextCards);
      setCardStatuses(nextCards.map(() => "unanswered"));
      setCardIndex(0);
      setIsFlipped(false);
      setShowCardSummary(false);
    } catch {
      setFlashcardsError("Could not reach the flashcard generator. Check that the app is running and try again.");
    } finally {
      setFlashcardsLoading(false);
    }
  }

  function handleSelectOption(optionId) {
    setSelectedAnswers((previous) => {
      const next = [...previous];
      next[quizIndex] = optionId;
      return next;
    });
    if (quizError) {
      setQuizError("");
    }
  }

  function handleQuizNext() {
    if (!selectedAnswers[quizIndex]) {
      setQuizError("Please choose an answer before going to the next question.");
      return;
    }
    setQuizError("");
    setQuizIndex((index) => Math.min(questions.length - 1, index + 1));
  }

  function handleQuizSubmit() {
    if (!selectedAnswers[quizIndex]) {
      setQuizError("Please choose an answer before submitting the quiz.");
      return;
    }
    if (selectedAnswers.some((answer) => !answer)) {
      setQuizError("Please answer every question before submitting.");
      return;
    }
    setQuizError("");
    setQuizSubmitted(true);

    const score = selectedAnswers.filter((answer, index) => answer === questions[index].correctOptionId).length;
    saveStudySession({
      type: "quiz",
      title: "PDF quiz",
      sourceName: "PDF Study",
      score,
      totalQuestions: questions.length,
    });
    setQuizHistoryMessage("Saved to Study History");
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Study with this PDF</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Use the extracted text with your existing AI tools</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        These buttons send the extracted PDF text to the same summary, quiz, and flashcard routes already
        in the app. The PDF file itself is not sent to Gemini.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleSummary}
          disabled={!canStudy || summaryLoading}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {summaryLoading ? "Generating summary..." : "Generate Summary"}
        </button>
        <button
          type="button"
          onClick={handleQuiz}
          disabled={!canStudy || quizLoading}
          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
        >
          {quizLoading ? "Generating quiz..." : "Generate Quiz"}
        </button>
        <button
          type="button"
          onClick={handleFlashcards}
          disabled={!canStudy || flashcardsLoading}
          className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-400"
        >
          {flashcardsLoading ? "Creating flashcards..." : "Create Flashcards"}
        </button>
      </div>

      {summaryError ? <p className="mt-3 text-sm font-medium text-rose-600">{summaryError}</p> : null}
      {quizError && questions.length === 0 ? <p className="mt-3 text-sm font-medium text-rose-600">{quizError}</p> : null}
      {flashcardsError && cards.length === 0 ? <p className="mt-3 text-sm font-medium text-rose-600">{flashcardsError}</p> : null}

      <div className="mt-6 space-y-6">
        {summaryLoading ? (
          <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-5 text-sm text-indigo-800">
            Generating a medium summary from the extracted PDF text...
          </div>
        ) : null}
        {summary ? <SummaryResult summary={summary} sourceName="PDF" /> : null}

        {quizLoading ? (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 p-5 text-sm text-sky-800">
            Generating a 5-question Medium quiz from the extracted PDF text...
          </div>
        ) : null}

        {!quizLoading && questions.length > 0 && !quizSubmitted && currentQuestion ? (
          <div>
            <QuizQuestion
              question={currentQuestion}
              questionNumber={quizIndex + 1}
              totalQuestions={questions.length}
              selectedOptionId={selectedAnswers[quizIndex] ?? null}
              onSelectOption={handleSelectOption}
            />
            {quizError ? <p className="mt-3 text-sm font-medium text-rose-600">{quizError}</p> : null}
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setQuizIndex((index) => Math.max(0, index - 1))}
                disabled={quizIndex === 0}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Previous
              </button>
              {quizIndex === questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleQuizSubmit}
                  className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuizNext}
                  className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        ) : null}

        {!quizLoading && quizSubmitted ? (
          <QuizResults
            questions={questions}
            selectedAnswers={selectedAnswers}
            onRestart={() => {
              setSelectedAnswers(questions.map(() => null));
              setQuizIndex(0);
              setQuizSubmitted(false);
              setQuizError("");
              setQuizHistoryMessage("");
            }}
            historyMessage={quizHistoryMessage}
          />
        ) : null}

        {flashcardsLoading ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-5 text-sm text-amber-900">
            Creating 5 flashcards from the extracted PDF text...
          </div>
        ) : null}

        {!flashcardsLoading && cards.length > 0 && !showCardSummary && currentCard ? (
          <div>
            <FlashcardCard
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped((flipped) => !flipped)}
              cardNumber={cardIndex + 1}
              totalCards={cards.length}
            />
            {flashcardsError ? <p className="mt-3 text-sm font-medium text-rose-600">{flashcardsError}</p> : null}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setCardStatuses((previous) => {
                    const next = [...previous];
                    next[cardIndex] = "known";
                    return next;
                  });
                }}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  currentStatus === "known"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                I Know This
              </button>
              <button
                type="button"
                onClick={() => {
                  setCardStatuses((previous) => {
                    const next = [...previous];
                    next[cardIndex] = "review";
                    return next;
                  });
                }}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  currentStatus === "review"
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Need to Review
              </button>
            </div>
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCardIndex((index) => Math.max(0, index - 1));
                }}
                disabled={cardIndex === 0}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Previous
              </button>
              {cardIndex === cards.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setShowCardSummary(true)}
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                >
                  Finish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIndex((index) => Math.min(cards.length - 1, index + 1));
                  }}
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        ) : null}

        {!flashcardsLoading && showCardSummary ? (
          <FlashcardSummary
            total={cards.length}
            knownCount={knownCount}
            reviewCount={reviewCount}
            unansweredCount={unansweredCount}
            onRestart={() => {
              setCardStatuses(cards.map(() => "unanswered"));
              setCardIndex(0);
              setIsFlipped(false);
              setShowCardSummary(false);
              setFlashcardHistoryMessage("");
            }}
            onStudyAgain={() => {
              setCardStatuses(cards.map(() => "unanswered"));
              setCardIndex(0);
              setIsFlipped(false);
              setShowCardSummary(false);
              setFlashcardHistoryMessage("");
            }}
            onSaveToHistory={() => {
              const session = saveStudySession({
                type: "flashcards",
                title: "PDF flashcard review",
                sourceName: "PDF Study",
                totalQuestions: cards.length,
              });
              if (session) {
                setFlashcardHistoryMessage("Saved to Study History");
              }
            }}
            historyMessage={flashcardHistoryMessage}
          />
        ) : null}
      </div>
    </section>
  );
}
