/** Process steps — copy lives in messages under process.items.<key>. */
export const processSteps = [
  { key: "discovery", tone: "bg-blob-a" },
  { key: "design", tone: "bg-blob-c" },
  { key: "build", tone: "bg-blob-b" },
  { key: "ship", tone: "bg-secondary" },
  { key: "iterate", tone: "bg-surface" },
] as const;
