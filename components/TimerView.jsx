"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "./AppShell";
import { TimerIcon } from "./icons";
import { currentUser } from "../data/sampleData";
import { getTodayFocusStats, saveStudySession } from "../lib/studyHistory";
import useStudyHistory from "../lib/useStudyHistory";

const MODES = [
  { id: "focus", label: "Focus", minutes: 25, title: "Focus Session" },
  { id: "deep", label: "Deep Study", minutes: 50, title: "Deep Study Session" },
  { id: "break", label: "Short Break", minutes: 5, title: "Short Break" },
];

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function statusLabel(status, modeLabel) {
  if (status === "running") {
    return `${modeLabel} timer running`;
  }
  if (status === "paused") {
    return `${modeLabel} timer paused`;
  }
  if (status === "completed") {
    return `${modeLabel} timer completed`;
  }
  return `${modeLabel} timer ready`;
}

export default function TimerView() {
  const [searchValue, setSearchValue] = useState("");
  const [modeId, setModeId] = useState("focus");
  const [status, setStatus] = useState("idle");
  const [remainingMs, setRemainingMs] = useState(25 * 60 * 1000);
  const [testSeconds, setTestSeconds] = useState(null);
  const endAtRef = useRef(null);
  const frameRef = useRef(null);
  const savedRef = useRef(false);
  const { sessions } = useStudyHistory();
  const todayFocus = useMemo(() => getTodayFocusStats(sessions), [sessions]);

  const mode = MODES.find((item) => item.id === modeId) || MODES[0];
  const durationMs = (testSeconds ?? mode.minutes * 60) * 1000;
  const isDev = process.env.NODE_ENV === "development";

  const stopFrame = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const applyDuration = useCallback(
    (nextMode, nextTestSeconds = null) => {
      stopFrame();
      endAtRef.current = null;
      savedRef.current = false;
      setStatus("idle");
      setTestSeconds(nextTestSeconds);
      const seconds = nextTestSeconds ?? nextMode.minutes * 60;
      setRemainingMs(seconds * 1000);
    },
    [stopFrame],
  );

  const completeTimer = useCallback(() => {
    stopFrame();
    endAtRef.current = null;
    setRemainingMs(0);
    setStatus("completed");

    if (savedRef.current || mode.id === "break") {
      return;
    }

    savedRef.current = true;
    saveStudySession({
      type: "timer",
      title: mode.title,
      sourceName: "Study Timer",
      durationMinutes: mode.minutes,
    });
  }, [mode, stopFrame]);

  useEffect(() => {
    if (status !== "running") {
      stopFrame();
      return undefined;
    }

    function tick() {
      const left = Math.max(0, (endAtRef.current || 0) - Date.now());
      setRemainingMs(left);

      if (left <= 0) {
        completeTimer();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => stopFrame();
  }, [status, completeTimer, stopFrame]);

  function handleSelectMode(nextMode) {
    setModeId(nextMode.id);
    applyDuration(nextMode, null);
  }

  function handleStart() {
    if (status === "running") {
      return;
    }

    const remaining = status === "completed" ? durationMs : remainingMs || durationMs;
    if (status === "completed") {
      savedRef.current = false;
      setRemainingMs(remaining);
    }

    endAtRef.current = Date.now() + remaining;
    setStatus("running");
  }

  function handlePause() {
    if (status !== "running") {
      return;
    }

    const left = Math.max(0, (endAtRef.current || 0) - Date.now());
    stopFrame();
    endAtRef.current = null;
    setRemainingMs(left);
    setStatus("paused");
  }

  function handleReset() {
    applyDuration(mode, testSeconds);
  }

  const clock = formatClock(remainingMs);
  const completedMessage =
    mode.id === "break" ? "Break finished. Ready to focus?" : "Focus session completed! 🎉";

  return (
    <AppShell user={currentUser} searchValue={searchValue} onSearchChange={setSearchValue}>
      <div className="mb-6">
        <a href="/" className="w-fit text-sm font-semibold text-rose-700 transition hover:text-rose-800">
          ← Back to Dashboard
        </a>
      </div>

      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Study Timer</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Focus on one task at a time.</p>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section
          className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-8 ${
            status === "completed" ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
          }`}
        >
          <div className="flex flex-wrap gap-2">
            {MODES.map((item) => {
              const selected = item.id === mode.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => handleSelectMode(item)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    selected ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-white"
                  }`}
                >
                  {item.label} — {item.minutes} min
                </button>
              );
            })}
          </div>

          <p className="sr-only" aria-live="polite">
            {statusLabel(status, mode.label)}. {clock} remaining.
          </p>

          <p
            className="mt-8 text-center font-semibold tracking-tight text-slate-900"
            style={{ fontSize: "clamp(3.5rem, 12vw, 6rem)" }}
            role="timer"
            aria-label={`${mode.label} countdown ${clock}`}
          >
            {clock}
          </p>

          <p className="mt-2 text-center text-sm font-medium text-slate-500">
            {status === "running" ? "Running" : status === "paused" ? "Paused" : status === "completed" ? "Completed" : "Ready"}
            {" · "}
            {mode.label}
          </p>

          {status === "completed" ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
              {completedMessage}
            </p>
          ) : null}

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              aria-label="Start timer"
              onClick={handleStart}
              disabled={status === "running"}
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
            >
              Start
            </button>
            <button
              type="button"
              aria-label="Pause timer"
              onClick={handlePause}
              disabled={status !== "running"}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Pause
            </button>
            <button
              type="button"
              aria-label="Reset timer"
              onClick={handleReset}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>

          {isDev ? (
            <button
              type="button"
              onClick={() => applyDuration(mode, 5)}
              className="mt-4 w-full rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
            >
              Dev only: set 5-second test duration
            </button>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Focus</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Completed Focus and Deep Study timers saved today.</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
              <TimerIcon />
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sessions</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{todayFocus.count}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minutes</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{todayFocus.minutes}</dd>
            </div>
          </dl>
        </section>
      </div>
    </AppShell>
  );
}
