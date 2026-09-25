"use client";

import { useState } from "react";

const SUGGESTED_QUESTIONS = [
  "What are the main concepts?",
  "Explain this in simple terms.",
  "What are the most important points for an exam?",
  "Give me an example based on the PDF.",
];

export default function PdfAskPanel({ extractedText }) {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState("");
  const [history, setHistory] = useState([]);

  const canAsk = Boolean(extractedText);

  async function handleAsk() {
    const nextQuestion = question.trim();

    if (!canAsk) {
      setError("Upload and extract a PDF first, then you can ask questions about it.");
      return;
    }

    if (!nextQuestion) {
      setError("Please enter a question about this PDF first.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/pdf/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: nextQuestion,
          pdfText: extractedText,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Something went wrong while asking about this PDF.");
        return;
      }

      const answer = typeof data.answer === "string" ? data.answer.trim() : "";

      if (!answer) {
        setError("The assistant returned an empty answer. Try asking again.");
        return;
      }

      setLatestAnswer(answer);
      setHistory((previous) => [...previous, { question: nextQuestion, answer }]);
    } catch {
      setError("Could not reach the PDF assistant. Check that the app is running and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">PDF Q&A</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Ask AI About This PDF</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Questions use the extracted PDF text only. The PDF file itself is not sent to Gemini.
      </p>

      {!canAsk ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
          Upload a PDF and extract its text first. Ask AI stays inactive until extracted text is available.
        </p>
      ) : null}

      <label htmlFor="pdf-ask-question" className="mt-4 block text-sm font-semibold text-slate-900">
        Your question
      </label>
      <textarea
        id="pdf-ask-question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Ask a question about this PDF..."
        rows={3}
        disabled={!canAsk || loading}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={!canAsk || loading}
            onClick={() => {
              setQuestion(suggestion);
              setError("");
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleAsk}
          disabled={!canAsk || loading}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-4 text-sm text-indigo-800">
          Thinking...
        </div>
      ) : null}

      {!loading && latestAnswer ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest answer</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{latestAnswer}</p>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Questions in this session</h3>
          {history.map((item, index) => (
            <article key={`${item.question}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">You</p>
              <p className="mt-1 text-sm leading-6 text-slate-800">{item.question}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">AI</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
