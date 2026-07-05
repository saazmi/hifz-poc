export const theme = {
  bg: "#0f1115",
  surface: "#181b22",
  surfaceRaised: "#20242d",
  border: "#2b303b",
  text: "#e6e8ee",
  textDim: "#9aa1b1",
  textFaint: "#6b7180",
  primary: "#4ade80",
  primaryDim: "#166534",
  learning: "#f59e0b",
  learningDim: "#7c4a02",
  memorized: "#22c55e",
  memorizedDim: "#14532d",
  needsReview: "#facc15",
  danger: "#ef4444",
  accent: "#60a5fa",
  spacing: (n: number) => n * 4,
  radius: 8,
} as const;

export type StateColors = {
  fill: string;
  border: string;
  text: string;
};

export const stateColors = (
  state: "none" | "learning" | "memorized" | "needsReview",
): StateColors => {
  switch (state) {
    case "learning":
      return { fill: theme.learningDim, border: theme.learning, text: theme.text };
    case "memorized":
      return { fill: theme.memorizedDim, border: theme.memorized, text: theme.text };
    case "needsReview":
      return { fill: theme.memorizedDim, border: theme.needsReview, text: theme.text };
    case "none":
    default:
      return { fill: "transparent", border: theme.border, text: theme.textDim };
  }
};
