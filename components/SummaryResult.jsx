"use client";

import { useEffect, useState } from "react";
import { CopyIcon } from "./icons";
import { formatSummaryForCopy } from "../lib/formatSummary";
import { saveStudySession } from "../lib/studyHistory";

export default function SummaryResult({ summary, sourceName }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [summary]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatSummaryForCopy(summary));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function handleSave() {
    const session = saveStudySession({
      type: "summary",
      title: summary.heading || "Study summary",
      sourceName: sourceName || "Notes",
    });

    if (session) {
      setSaved(true);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">AI summary</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{summary.heading}</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            {saved ? "Saved to Study History" : "Save to Study History"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <CopyIcon />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{summary.overview}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Key points</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            {summary.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Important concepts</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {summary.concepts.map((concept) => (
              <li
                key={concept}
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
              >
                {concept}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
