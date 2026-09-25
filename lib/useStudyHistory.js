"use client";

import { useEffect, useState } from "react";
import { getStudyHistory, HISTORY_UPDATED_EVENT } from "./studyHistory";

export default function useStudyHistory() {
  const [sessions, setSessions] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function refresh() {
      setSessions(getStudyHistory());
      setReady(true);
    }

    refresh();
    window.addEventListener(HISTORY_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(HISTORY_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return { sessions, ready };
}
