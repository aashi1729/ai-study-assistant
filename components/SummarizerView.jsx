"use client";

import { useMemo, useRef, useState } from "react";
import AppShell from "./AppShell";
import SummaryResult from "./SummaryResult";
import { currentUser } from "../data/sampleData";

const LENGTH_OPTIONS = [
  { id: "short", label: "Short", hint: "Quick recap" },
  { id: "medium", label: "Medium", hint: "Exam-ready" },
  { id: "detailed", label: "Detailed", hint: "Full review" },
];

export default function SummarizerView() {
  const [searchValue, setSearchValue] = useState("");
  const [notes, setNotes] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const summarizeRequest = useRef(null);

  const characterCount = notes.length;
  const wordCount = useMemo(() => {
    const words = notes.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [notes]);

  function handleClear() {
    if (summarizeRequest.current) {
      summarizeRequest.current.abort();
    }
    setNotes("");
    setError("");
    setSummary(null);
    setLoading(false);
  }

  async function handleSummarize(event) {
    event.preventDefault();

    if (!notes.trim()) {
      setError("Please paste some study notes first. I need text before I can summarize.");
      setSummary(null);
      return;
    }

    setError("");
    setLoading(true);
    setSummary(null);

    if (summarizeRequest.current) {
      summarizeRequest.current.abort();
    }

    const controller = new AbortController();
    summarizeRequest.current = controller;

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes,
          summaryLength,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Something went wrong while summarizing.");
        setSummary(null);
        return;
      }

      setSummary(data.summary);
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        return;
      }

      setError("Could not reach the summarizer. Check that the app is running and try again.");
      setSummary(null);
    } finally {
      if (summarizeRequest.current === controller) {
        setLoading(false);
      }
    }
  }

  return (
    <AppShell user={currentUser} searchValue={searchValue} onSearchChange={setSearchValue}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href="/"
          className="w-fit text-sm font-semibold text-indigo-700 transition hover:text-indigo-800"
        >
          ← Back to Dashboard
        </a>
      </div>

      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Summarize Your Notes</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Paste your notes, pick a length, and generate a summary. Your notes are sent to a server
          route at /api/summarize — not to a mock function in the browser.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <form onSubmit={handleSummarize} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label htmlFor="notes" className="text-sm font-semibold text-slate-900">
            Study notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              if (error) {
                setError("");
              }
            }}
            rows={12}
            placeholder="Paste lecture notes, textbook paragraphs, or revision points here..."
            className="mt-3 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-400">
              {wordCount} {wordCount === 1 ? "word" : "words"} · {characterCount}{" "}
              {characterCount === 1 ? "character" : "characters"}
            </p>
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-slate-900">Summary length</legend>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {LENGTH_OPTIONS.map((option) => {
                const selected = summaryLength === option.id;

                return (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
                      selected
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="summaryLength"
                      value={option.id}
                      checked={selected}
                      onChange={() => setSummaryLength(option.id)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{option.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {loading ? "Summarizing..." : "Summarize"}
            </button>
          </div>
        </form>

        <div className="min-w-0">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-6">
              <p className="text-sm font-semibold text-indigo-800">Creating your summary</p>
              <p className="mt-2 text-sm leading-6 text-indigo-700">
                Waiting for the server to talk to the AI model. This is no longer a fake timer.
              </p>
            </div>
          ) : summary ? (
            <SummaryResult summary={summary} sourceName="Notes" />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-500">
              Your summary will appear here after you click Summarize.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
