"use client";

import { useMemo, useState } from "react";
import AppShell from "./AppShell";
import { currentUser } from "../data/sampleData";
import {
  deleteStudySession,
  clearStudyHistory,
  formatSessionDate,
  getSessionTypeLabel,
} from "../lib/studyHistory";
import useStudyHistory from "../lib/useStudyHistory";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "summary", label: "Summaries" },
  { id: "quiz", label: "Quizzes" },
  { id: "flashcards", label: "Flashcards" },
  { id: "timer", label: "Timers" },
];

const typeStyles = {
  summary: "bg-indigo-50 text-indigo-700",
  quiz: "bg-sky-50 text-sky-700",
  flashcards: "bg-amber-50 text-amber-700",
  timer: "bg-rose-50 text-rose-700",
};

function sessionDetail(session) {
  if (session.type === "quiz" && typeof session.score === "number" && typeof session.totalQuestions === "number") {
    return `Score ${session.score} / ${session.totalQuestions}`;
  }

  if (session.type === "flashcards" && typeof session.totalQuestions === "number") {
    return `${session.totalQuestions} cards reviewed`;
  }

  if (session.type === "timer" && typeof session.durationMinutes === "number") {
    return `${session.durationMinutes} min`;
  }

  return session.sourceName || "Saved session";
}

export default function HistoryView() {
  const [searchValue, setSearchValue] = useState("");
  const [titleQuery, setTitleQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const { sessions } = useStudyHistory();

  const visibleSessions = useMemo(() => {
    const query = titleQuery.trim().toLowerCase() || searchValue.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesFilter = filter === "all" || session.type === filter;
      const matchesQuery = !query || session.title.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [sessions, filter, titleQuery, searchValue]);

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }

    clearStudyHistory();
    setConfirmClear(false);
  }

  return (
    <AppShell user={currentUser} searchValue={searchValue} onSearchChange={setSearchValue}>
      <div className="mb-6">
        <a href="/" className="w-fit text-sm font-semibold text-indigo-700 transition hover:text-indigo-800">
          ← Back to Dashboard
        </a>
      </div>

      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Study History</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Saved summaries, quizzes, flashcard reviews, and focus timers from this browser.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          disabled={sessions.length === 0}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {confirmClear ? "Confirm clear" : "Clear History"}
        </button>
      </section>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => {
            const selected = filter === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  selected ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <label className="w-full lg:max-w-xs">
          <span className="sr-only">Search session titles</span>
          <input
            type="search"
            value={titleQuery}
            onChange={(event) => setTitleQuery(event.target.value)}
            placeholder="Search session titles..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        </label>
      </div>

      {visibleSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
          <p className="text-sm font-semibold text-slate-800">No study sessions yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {sessions.length === 0
              ? "Generate a summary, finish a quiz, or save a flashcard review to see it here."
              : "No sessions match this filter or search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {visibleSessions.map((session) => (
            <article
              key={session.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{session.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {sessionDetail(session)} · {formatSessionDate(session.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    typeStyles[session.type] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {getSessionTypeLabel(session.type)}
                </span>
                <button
                  type="button"
                  onClick={() => deleteStudySession(session.id)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
