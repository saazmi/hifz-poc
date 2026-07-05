import { View } from "react-native";
import type { Progress } from "@hifz/core";
import { theme } from "../theme";

interface Props {
  progress: Progress;
  height?: number;
}

export function ProgressBar({ progress, height = 6 }: Props) {
  const total = progress.total || 1;
  const memPct = (progress.memorized / total) * 100;
  const revPct = (progress.needsReview / total) * 100;
  const learnPct = (progress.learning / total) * 100;
  return (
    <View
      style={{
        flexDirection: "row",
        height,
        borderRadius: height / 2,
        backgroundColor: theme.border,
        overflow: "hidden",
      }}
    >
      <View style={{ width: `${memPct}%`, backgroundColor: theme.memorized }} />
      <View style={{ width: `${revPct}%`, backgroundColor: theme.needsReview }} />
      <View style={{ width: `${learnPct}%`, backgroundColor: theme.learning }} />
    </View>
  );
}
