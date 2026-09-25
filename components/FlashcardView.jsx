"use client";

import { useMemo, useRef, useState } from "react";
import AppShell from "./AppShell";
import FlashcardCard from "./FlashcardCard";
import FlashcardSummary from "./FlashcardSummary";
import { currentUser } from "../data/sampleData";
import { saveStudySession } from "../lib/studyHistory";

const COUNT_OPTIONS = [
  { id: 5, label: "5 cards", hint: "Quick set" },
  { id: 10, label: "10 cards", hint: "Standard set" },
  { id: 15, label: "15 cards", hint: "Full practice" },
];

export default function FlashcardView() {
  const [searchValue, setSearchValue] = useState("");
  const [notes, setNotes] = useState("");
  const [cardCount, setCardCount] = useState(5);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStatuses, setCardStatuses] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [historyMessage, setHistoryMessage] = useState("");
  const generateRequest = useRef(null);

  const characterCount = notes.length;
  const wordCount = useMemo(() => {
    const words = notes.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [notes]);

  const inStudy = cards.length > 0 && !showSummary;
  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;
  const currentStatus = cardStatuses[currentIndex] || "unanswered";

  const knownCount = cardStatuses.filter((status) => status === "known").length;
  const reviewCount = cardStatuses.filter((status) => status === "review").length;
  const unansweredCount = cardStatuses.filter((status) => status === "unanswered").length;

  function resetDeckState() {
    if (generateRequest.current) {
      generateRequest.current.abort();
    }
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStatuses([]);
    setShowSummary(false);
    setLoading(false);
  }

  async function handleGenerate(event) {
    event.preventDefault();

    if (!notes.trim()) {
      setError("Please paste some study notes first. I need text before I can generate flashcards.");
      resetDeckState();
      return;
    }

    if (![5, 10, 15].includes(cardCount)) {
      setError("Choose 5, 10, or 15 cards.");
      return;
    }

    setError("");
    setLoading(true);
    setShowSummary(false);
    setCards([]);
    setCardStatuses([]);
    setCurrentIndex(0);
    setIsFlipped(false);

    if (generateRequest.current) {
      generateRequest.current.abort();
    }

    const controller = new AbortController();
    generateRequest.current = controller;

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes,
          cardCount,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Something went wrong while generating flashcards.");
        setCards([]);
        return;
      }

      const nextCards = Array.isArray(data.flashcards) ? data.flashcards : [];

      if (nextCards.length === 0) {
        setError("The flashcard generator returned no cards. Try again.");
        setCards([]);
        return;
      }

      setCards(nextCards);
      setCardStatuses(nextCards.map(() => "unanswered"));
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        return;
      }

      setError("Could not reach the flashcard generator. Check that the app is running and try again.");
      setCards([]);
    } finally {
      if (generateRequest.current === controller) {
        setLoading(false);
      }
    }
  }

  function handleFlip() {
    setIsFlipped((flipped) => !flipped);
  }

  function handlePrevious() {
    setError("");
    setIsFlipped(false);
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function handleNext() {
    setError("");
    setIsFlipped(false);
    setCurrentIndex((index) => Math.min(cards.length - 1, index + 1));
  }

  function handleFinish() {
    setError("");
    setShowSummary(true);
  }

  function handleStatus(status) {
    setCardStatuses((previous) => {
      const next = [...previous];
      next[currentIndex] = status;
      return next;
    });
  }

  function handleRestart() {
    setError("");
    setHistoryMessage("");
    resetDeckState();
  }

  function handleStudyAgain() {
    setError("");
    setHistoryMessage("");
    setCardStatuses(cards.map(() => "unanswered"));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowSummary(false);
  }

  function handleSaveToHistory() {
    const session = saveStudySession({
      type: "flashcards",
      title: "Flashcard review",
      sourceName: "Flashcard Generator",
      totalQuestions: cards.length,
    });

    if (session) {
      setHistoryMessage("Saved to Study History");
    }
  }

  return (
    <AppShell user={currentUser} searchValue={searchValue} onSearchChange={setSearchValue}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a href="/" className="w-fit text-sm font-semibold text-amber-800 transition hover:text-amber-900">
          ← Back to Dashboard
        </a>
      </div>

      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">AI Flashcards</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Turn your study notes into flashcards for active recall.
        </p>
      </section>

      {!inStudy && !showSummary ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
          <form onSubmit={handleGenerate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <label htmlFor="flashcard-notes" className="text-sm font-semibold text-slate-900">
              Study notes
            </label>
            <textarea
              id="flashcard-notes"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              rows={12}
              placeholder="Paste lecture notes, textbook paragraphs, or revision points here..."
              className="mt-3 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100"
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-slate-400">
                {wordCount} {wordCount === 1 ? "word" : "words"} · {characterCount}{" "}
                {characterCount === 1 ? "character" : "characters"}
              </p>
              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-slate-900">Number of flashcards</legend>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {COUNT_OPTIONS.map((option) => {
                  const selected = cardCount === option.id;

                  return (
                    <label
                      key={option.id}
                      className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
                        selected
                          ? "border-amber-300 bg-amber-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cardCount"
                        value={option.id}
                        checked={selected}
                        onChange={() => setCardCount(option.id)}
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
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-400"
              >
                {loading ? "Generating..." : "Generate Flashcards"}
              </button>
            </div>
          </form>

          <div className="min-w-0">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-6">
                <p className="text-sm font-semibold text-amber-900">Creating your flashcards</p>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Waiting for the server to talk to Gemini. This is no longer a mock deck.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-500">
                Your flashcards will appear here after you click Generate Flashcards. Your notes are
                sent to a server route at /api/flashcards — not to a mock function in the browser.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {inStudy && currentCard ? (
        <div className="mx-auto max-w-3xl">
          <FlashcardCard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            cardNumber={currentIndex + 1}
            totalCards={cards.length}
          />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleStatus("known")}
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
              onClick={() => handleStatus("review")}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                currentStatus === "review"
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Need to Review
            </button>
          </div>

          <p className="mt-3 text-center text-xs font-medium text-slate-400">
            Status: {currentStatus === "known" ? "I Know This" : currentStatus === "review" ? "Need to Review" : "Not answered"}
          </p>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Previous
            </button>
            {isLastCard ? (
              <button
                type="button"
                onClick={handleFinish}
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Finish
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      ) : null}

      {showSummary ? (
        <div className="mx-auto max-w-4xl">
          <FlashcardSummary
            total={cards.length}
            knownCount={knownCount}
            reviewCount={reviewCount}
            unansweredCount={unansweredCount}
            onRestart={handleRestart}
            onStudyAgain={handleStudyAgain}
            onSaveToHistory={handleSaveToHistory}
            historyMessage={historyMessage}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
