"use client";

import { useMemo, useState } from "react";
import AppShell from "./AppShell";
import StatCard from "./StatCard";
import WeeklyActivity from "./WeeklyActivity";
import {
  ProgressIcon,
  ScoreIcon,
  TimerIcon,
  TopicsIcon,
} from "./icons";
import { currentUser } from "../data/sampleData";
import {
  getActivityBreakdown,
  getEarnedAchievements,
  getFocusStats,
  getLongestStreak,
  getQuizPerformance,
  getStudyStreak,
  getWeeklyActivity,
} from "../lib/studyHistory";
import useStudyHistory from "../lib/useStudyHistory";

export default function ProgressView() {
  const [searchValue, setSearchValue] = useState("");
  const { sessions } = useStudyHistory();

  const analytics = useMemo(
    () => ({
      totalSessions: sessions.length,
      weekly: getWeeklyActivity(sessions),
      breakdown: getActivityBreakdown(sessions),
      quiz: getQuizPerformance(sessions),
      focus: getFocusStats(sessions),
      currentStreak: getStudyStreak(sessions),
      longestStreak: getLongestStreak(sessions),
      achievements: getEarnedAchievements(sessions),
    }),
    [sessions],
  );

  const breakdownMax = Math.max(1, ...analytics.breakdown.map((item) => item.count));
  const hasHistory = analytics.totalSessions > 0;

  return (
    <AppShell user={currentUser} searchValue={searchValue} onSearchChange={setSearchValue}>
      <div className="mb-6">
        <a href="/" className="w-fit text-sm font-semibold text-indigo-700 transition hover:text-indigo-800">
          ← Back to Dashboard
        </a>
      </div>

      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Progress & Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Real totals from the study sessions saved in this browser.
        </p>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Study Sessions"
          value={String(analytics.totalSessions)}
          hint={hasHistory ? "Every saved session" : "No saved sessions yet"}
          accent="indigo"
          icon={<ProgressIcon />}
        />
        <StatCard
          label="Quiz Average Score"
          value={`${analytics.quiz.averageScore}%`}
          hint={analytics.quiz.quizzesCount === 0 ? "No scored quizzes yet" : `${analytics.quiz.quizzesCount} quiz sessions`}
          accent="emerald"
          icon={<ScoreIcon />}
        />
        <StatCard
          label="Total Focus Minutes"
          value={String(analytics.focus.minutes)}
          hint={analytics.focus.count === 0 ? "No completed timers yet" : `${analytics.focus.count} focus sessions`}
          accent="rose"
          icon={<TimerIcon />}
        />
        <StatCard
          label="Current Study Streak"
          value={String(analytics.currentStreak)}
          hint={analytics.currentStreak === 0 ? "Study today to start a streak" : "Consecutive days including today"}
          accent="amber"
          icon={<TopicsIcon />}
        />
      </section>

      {!hasHistory ? (
        <section className="mb-8 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
          <p className="text-sm font-semibold text-slate-800">Start studying to see your progress here.</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Save a summary, complete a quiz, or finish a focus timer. Values stay at 0 until then.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/summarizer"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Summarizer
            </a>
            <a
              href="/quiz"
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Quiz Generator
            </a>
            <a
              href="/timer"
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Study Timer
            </a>
          </div>
        </section>
      ) : null}

      <WeeklyActivity days={analytics.weekly} />

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Activity breakdown</h2>
        <p className="mt-1 text-sm text-slate-500">Saved sessions by type.</p>
        <div className="mt-5 grid grid-cols-1 gap-3">
          {analytics.breakdown.map((item) => {
            const width = item.count === 0 ? 0 : Math.max(8, Math.round((item.count / breakdownMax) * 100));

            return (
              <div key={item.id} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-semibold text-slate-500">{item.label}</span>
                <div className="h-3 min-w-0 flex-1 rounded-full bg-slate-100">
                  <div className={`h-3 rounded-full ${item.accent}`} style={{ width: `${width}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-medium text-slate-400">{item.count}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quiz performance</h2>
          {analytics.quiz.quizzesCount === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
              Complete a quiz to see count, average, highest, and lowest scores.
            </p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quizzes</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{analytics.quiz.quizzesCount}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{analytics.quiz.averageScore}%</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highest</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{analytics.quiz.highestScore}%</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lowest</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{analytics.quiz.lowestScore}%</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Focus time</h2>
          {analytics.focus.count === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
              Complete a Focus or Deep Study timer to track minutes here.
            </p>
          ) : (
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minutes</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{analytics.focus.minutes}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sessions</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{analytics.focus.count}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{analytics.focus.averageMinutes}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Study streak</h2>
        <p className="mt-1 text-sm text-slate-500">Calendar days with at least one saved session. Same-day sessions count once.</p>
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current streak</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900">{analytics.currentStreak}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Longest streak</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900">{analytics.longestStreak}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent achievements</h2>
        {analytics.achievements.length === 0 ? (
          <p className="mt-4 text-sm leading-6 text-slate-500">No achievements yet. Save a study session to earn your first one.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {analytics.achievements.map((item) => (
              <li key={item.id} className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-900">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-800">{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
