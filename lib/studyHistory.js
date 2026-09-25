const STORAGE_KEY = "ai-study-assistant-history";
export const HISTORY_UPDATED_EVENT = "study-history-updated";

const ALLOWED_TYPES = ["summary", "quiz", "flashcards", "timer"];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function notifyHistoryUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
  }
}

function isValidSession(session) {
  return (
    session &&
    typeof session === "object" &&
    typeof session.id === "string" &&
    ALLOWED_TYPES.includes(session.type) &&
    typeof session.title === "string" &&
    session.title.trim() &&
    typeof session.createdAt === "string"
  );
}

export function getStudyHistory() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isValidSession)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

function writeHistory(sessions) {
  if (!canUseStorage()) {
    return [];
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    notifyHistoryUpdated();
    return sessions;
  } catch {
    return getStudyHistory();
  }
}

export function saveStudySession(input) {
  const type = ALLOWED_TYPES.includes(input?.type) ? input.type : null;
  const title = typeof input?.title === "string" ? input.title.trim() : "";

  if (!type || !title) {
    return null;
  }

  const session = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title,
    createdAt: new Date().toISOString(),
  };

  if (typeof input.sourceName === "string" && input.sourceName.trim()) {
    session.sourceName = input.sourceName.trim();
  }

  if (typeof input.score === "number" && Number.isFinite(input.score)) {
    session.score = input.score;
  }

  if (typeof input.totalQuestions === "number" && Number.isFinite(input.totalQuestions)) {
    session.totalQuestions = input.totalQuestions;
  }

  if (typeof input.durationMinutes === "number" && Number.isFinite(input.durationMinutes) && input.durationMinutes > 0) {
    session.durationMinutes = input.durationMinutes;
  }

  const next = [session, ...getStudyHistory()];
  writeHistory(next);
  return session;
}

export function deleteStudySession(id) {
  if (typeof id !== "string" || !id) {
    return getStudyHistory();
  }

  return writeHistory(getStudyHistory().filter((session) => session.id !== id));
}

export function clearStudyHistory() {
  if (!canUseStorage()) {
    return [];
  }

  window.localStorage.removeItem(STORAGE_KEY);
  notifyHistoryUpdated();
  return [];
}

export function formatSessionDate(isoString) {
  try {
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "Unknown date";
  }
}

export function getSessionTypeLabel(type) {
  if (type === "summary") {
    return "Summary";
  }
  if (type === "quiz") {
    return "Quiz";
  }
  if (type === "flashcards") {
    return "Flashcards";
  }
  if (type === "timer") {
    return "Timer";
  }
  return "Session";
}

export function getLocalDateKey(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sessionDateKey(session) {
  try {
    return getLocalDateKey(new Date(session?.createdAt));
  } catch {
    return null;
  }
}

export function formatRelativeDate(isoString) {
  try {
    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thatDay = new Date(date);
    thatDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - thatDay.getTime()) / 86400000);

    if (diffDays === 0) {
      return "Today";
    }
    if (diffDays === 1) {
      return "Yesterday";
    }
    if (diffDays > 1 && diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return formatSessionDate(isoString);
  } catch {
    return "Unknown date";
  }
}

export function getStudyStreak(sessions) {
  const days = uniqueStudyDayKeys(sessions);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!days.has(getLocalDateKey(today))) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(today);

  while (days.has(getLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function uniqueStudyDayKeys(sessions) {
  const days = new Set();

  for (const session of Array.isArray(sessions) ? sessions : []) {
    const key = sessionDateKey(session);
    if (key) {
      days.add(key);
    }
  }

  return days;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getLongestStreak(sessions) {
  const keys = [...uniqueStudyDayKeys(sessions)].sort();

  if (keys.length === 0) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < keys.length; index += 1) {
    const diffDays = Math.round((dateFromKey(keys[index]).getTime() - dateFromKey(keys[index - 1]).getTime()) / 86400000);

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function getWeeklyActivity(sessions) {
  const counts = {};

  for (const session of Array.isArray(sessions) ? sessions : []) {
    const key = sessionDateKey(session);
    if (!key) {
      continue;
    }
    counts[key] = (counts[key] || 0) + 1;
  }

  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const dateKey = getLocalDateKey(day);
    result.push({
      dateKey,
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      count: counts[dateKey] || 0,
    });
  }

  return result;
}

function scoredQuizSessions(list) {
  return list.filter(
    (session) =>
      session.type === "quiz" &&
      typeof session.score === "number" &&
      Number.isFinite(session.score) &&
      typeof session.totalQuestions === "number" &&
      session.totalQuestions > 0,
  );
}

function quizPercent(session) {
  return (session.score / session.totalQuestions) * 100;
}

export function getQuizPerformance(sessions) {
  const list = Array.isArray(sessions) ? sessions : [];
  const quizzes = list.filter((session) => session.type === "quiz");
  const scored = scoredQuizSessions(list);
  const percents = scored.map(quizPercent);
  const average =
    percents.length === 0 ? 0 : Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length);

  return {
    quizzesCount: quizzes.length,
    averageScore: average,
    highestScore: percents.length === 0 ? 0 : Math.round(Math.max(...percents)),
    lowestScore: percents.length === 0 ? 0 : Math.round(Math.min(...percents)),
  };
}

export function getActivityBreakdown(sessions) {
  const list = Array.isArray(sessions) ? sessions : [];

  return [
    { id: "summary", label: "Summaries", count: list.filter((session) => session.type === "summary").length, accent: "bg-indigo-500" },
    { id: "quiz", label: "Quizzes", count: list.filter((session) => session.type === "quiz").length, accent: "bg-sky-500" },
    { id: "flashcards", label: "Flashcards", count: list.filter((session) => session.type === "flashcards").length, accent: "bg-amber-500" },
    { id: "timer", label: "Timer", count: list.filter((session) => session.type === "timer").length, accent: "bg-rose-500" },
  ];
}

export function getFocusStats(sessions) {
  const timers = (Array.isArray(sessions) ? sessions : []).filter((session) => session.type === "timer");
  const minutes = timers.reduce((sum, session) => {
    if (typeof session.durationMinutes === "number" && Number.isFinite(session.durationMinutes) && session.durationMinutes > 0) {
      return sum + session.durationMinutes;
    }
    return sum;
  }, 0);

  return {
    count: timers.length,
    minutes,
    averageMinutes: timers.length === 0 ? 0 : Math.round(minutes / timers.length),
  };
}

export function getEarnedAchievements(sessions) {
  const list = Array.isArray(sessions) ? sessions : [];
  const earned = [];

  if (list.length >= 1) {
    earned.push({ id: "first-session", title: "First Study Session", detail: "You saved your first study session." });
  }
  if (list.some((session) => session.type === "quiz")) {
    earned.push({ id: "first-quiz", title: "First Quiz Completed", detail: "You finished and saved a quiz." });
  }
  if (list.some((session) => session.type === "timer")) {
    earned.push({ id: "first-focus", title: "First Focus Session", detail: "You completed a focus timer." });
  }
  if (list.length >= 5) {
    earned.push({ id: "five-sessions", title: "5 Sessions Completed", detail: "You have five saved study sessions." });
  }
  if (list.length >= 10) {
    earned.push({ id: "ten-sessions", title: "10 Sessions Completed", detail: "You have ten saved study sessions." });
  }
  if (getLongestStreak(list) >= 7) {
    earned.push({ id: "seven-day-streak", title: "7 Day Streak", detail: "You studied on seven consecutive days." });
  }

  return earned;
}

export function buildHistoryStats(sessions) {
  const list = Array.isArray(sessions) ? sessions : [];
  const flashcards = list.filter((session) => session.type === "flashcards");
  const quiz = getQuizPerformance(list);

  const cardsReviewed = flashcards.reduce((sum, session) => {
    if (typeof session.totalQuestions === "number" && Number.isFinite(session.totalQuestions) && session.totalQuestions > 0) {
      return sum + session.totalQuestions;
    }
    return sum;
  }, 0);

  return {
    topicsCount: list.filter((session) => session.type !== "timer").length,
    quizzesCount: quiz.quizzesCount,
    averageScore: quiz.averageScore,
    flashcardsCount: cardsReviewed,
  };
}

export function getTodayFocusStats(sessions) {
  const today = getLocalDateKey(new Date());
  const timers = (Array.isArray(sessions) ? sessions : []).filter(
    (session) => session.type === "timer" && sessionDateKey(session) === today,
  );

  const minutes = timers.reduce((sum, session) => {
    if (typeof session.durationMinutes === "number" && Number.isFinite(session.durationMinutes) && session.durationMinutes > 0) {
      return sum + session.durationMinutes;
    }
    return sum;
  }, 0);

  return {
    count: timers.length,
    minutes,
  };
}
