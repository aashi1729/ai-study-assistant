"use client";

import { useMemo } from "react";
import {
  CloseIcon,
  DashboardIcon,
  FlashcardsIcon,
  HistoryIcon,
  LogoMark,
  PdfIcon,
  QuizIcon,
  SummarizerIcon,
  TimerIcon,
  ProgressIcon,
} from "./icons";
import { getStudyStreak } from "../lib/studyHistory";
import useStudyHistory from "../lib/useStudyHistory";

const navItems = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/progress", label: "Progress", icon: ProgressIcon },
  { href: "/summarizer", label: "Summarizer", icon: SummarizerIcon },
  { href: "/quiz", label: "Quiz Generator", icon: QuizIcon },
  { href: "/flashcards", label: "Flashcards", icon: FlashcardsIcon },
  { href: "/pdf", label: "PDF Study", icon: PdfIcon },
  { href: "/timer", label: "Study Timer", icon: TimerIcon },
  { href: "/history", label: "Study History", icon: HistoryIcon },
];

export default function Sidebar({ open, onClose }) {
  const { sessions } = useStudyHistory();
  const streak = useMemo(() => getStudyStreak(sessions), [sessions]);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={`w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 ${
          open
            ? "fixed inset-y-0 left-0 z-50 flex shadow-xl lg:static lg:shadow-none"
            : "hidden lg:flex"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 text-slate-900" onClick={onClose}>
            <span className="text-indigo-600">
              <LogoMark />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">AI Study Assistant</span>
              <span className="block text-xs text-slate-500">Learn smarter</span>
            </span>
          </a>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Study streak</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            🔥 {streak} day streak
            {streak === 0 ? ". Save a session today to start a streak." : ". Keep going — a short session still counts."}
          </p>
        </div>
      </aside>
    </>
  );
}
