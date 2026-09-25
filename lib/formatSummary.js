export function formatSummaryForCopy(summary) {
  const points = (summary.keyPoints || []).map((point) => `- ${point}`).join("\n");
  const concepts = (summary.concepts || []).map((concept) => `- ${concept}`).join("\n");

  return `${summary.heading}\n\n${summary.overview}\n\nKey points:\n${points}\n\nImportant concepts:\n${concepts}`;
}
