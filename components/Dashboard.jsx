"use client";

import { useMemo, useState } from "react";
import AppShell from "./AppShell";
import RecentSession from "./RecentSession";
import StatCard from "./StatCard";
import StudyToolCard from "./StudyToolCard";
import WeeklyActivity from "./WeeklyActivity";
import {
  FlashcardsIcon,
  QuizIcon,
  ScoreIcon,
  SummarizerIcon,
  TopicsIcon,
} from "./icons";
import { currentUser, stats as statTemplates, studyTools } from "../data/sampleData";
import {
  buildHistoryStats,
  formatRelativeDate,
  getSessionTypeLabel,
  getStudyStreak,
  getWeeklyActivity,
} from "../lib/studyHistory";
import useStudyHistory from "../lib/useStudyHistory";

export default function Dashboard() {
  const [searchValue, setSearchValue] = useState("");
  const { sessions } = useStudyHistory();
  const historyStats = useMemo(() => buildHistoryStats(sessions), [sessions]);
  const streak = useMemo(() => getStudyStreak(sessions), [sessions]);
  const weeklyActivity = useMemo(() => getWeeklyActivity(sessions), [sessions]);

  const displayStats = [
    {
      ...statTemplates[0],
      value: String(historyStats.topicsCount),
      hint: historyStats.topicsCount === 0 ? "No saved sessions yet" : "Saved study sessions",
    },
    {
      ...statTemplates[1],
      value: String(historyStats.quizzesCount),
      hint: historyStats.quizzesCount === 0 ? "No quizzes completed yet" : "Quiz sessions saved",
    },
    {
      ...statTemplates[2],
      value: `${historyStats.averageScore}%`,
      hint: historyStats.quizzesCount === 0 ? "No scored quizzes yet" : "Average of saved quizzes",
    },
    {
      ...statTemplates[3],
      value: String(historyStats.flashcardsCount),
      hint: historyStats.flashcardsCount === 0 ? "No flashcard reviews saved" : "Cards from saved reviews",
    },
  ];

  const mappedSessions = useMemo(
    () =>
      sessions.map((session) => ({
        id: session.id,
        subject: session.sourceName || getSessionTypeLabel(session.type),
        topic: session.title,
        type: getSessionTypeLabel(session.type),
        duration:
          session.type === "quiz" && typeof session.score === "number" && typeof session.totalQuestions === "number"
            ? `Score ${session.score}/${session.totalQuestions}`
            : session.type === "flashcards" && typeof session.totalQuestions === "number"
              ? `${session.totalQuestions} cards`
              : session.type === "timer" && typeof session.durationMinutes === "number"
                ? `${session.durationMinutes} min`
                : "Saved session",
        date: formatRelativeDate(session.createdAt),
      })),
    [sessions],
  );

  const filteredSessions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return mappedSessions.slice(0, 6);
    }

    return mappedSessions.filter((session) =>
      `${session.subject} ${session.topic} ${session.type}`.toLowerCase().includes(query)
    );
  }, [searchValue, mappedSessions]);

  const statIcons = {
    topics: <TopicsIcon />,
    quizzes: <QuizIcon />,
    score: <ScoreIcon />,
    flashcards: <FlashcardsIcon />,
  };

  const toolIcons = {
    summarizer: <SummarizerIcon className="h-6 w-6" />,
    quiz: <QuizIcon className="h-6 w-6" />,
    flashcards: <FlashcardsIcon className="h-6 w-6" />,
  };

  return (
    <AppShell user={currentUser} searchValue={searchValue} onSearchChange={setSearchValue}>
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back 👋</h1>
        <p className="mt-2 text-base text-slate-500">What do you want to learn today?</p>
        <p className="mt-2 text-sm font-semibold text-slate-800">🔥 {streak} day streak</p>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {displayStats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            accent={stat.accent}
            icon={statIcons[stat.id]}
          />
        ))}
      </section>

      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">AI Study Tools</h2>
          <p className="mt-1 text-sm text-slate-500">Pick a tool to start your next study session.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {studyTools.map((tool) => (
            <StudyToolCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              href={tool.href}
              buttonLabel={tool.buttonLabel}
              accent={tool.accent}
              icon={toolIcons[tool.id]}
            />
          ))}
        </div>
      </section>

      <WeeklyActivity days={weeklyActivity} />

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Study Sessions</h2>
            <p className="mt-1 text-sm text-slate-500">Newest saved sessions from Study History.</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-slate-400 sm:block">{filteredSessions.length} shown</p>
            <a
              href="/history"
              className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-800"
            >
              View Study History
            </a>
          </div>
        </div>

        {filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredSessions.map((session) => (
              <RecentSession
                key={session.id}
                subject={session.subject}
                topic={session.topic}
                type={session.type}
                duration={session.duration}
                date={session.date}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            {searchValue.trim()
              ? `No sessions match “${searchValue}”. Try another topic or subject.`
              : "No saved study sessions yet. Save a summary, finish a quiz, or save a flashcard review."}
          </div>
        )}
      </section>
    </AppShell>
  );
}
