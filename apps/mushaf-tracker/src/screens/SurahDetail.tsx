import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  ayahKey,
  getSurah,
  surahProgress,
  type AyahState,
} from "@hifz/core";
import { useStore } from "../store";
import { theme } from "../theme";
import { ProgressBar } from "../components/ProgressBar";
import { AyahCell } from "../components/AyahCell";
import { AyahSheet } from "../components/AyahSheet";
import { RangeMarker } from "../components/RangeMarker";

interface Props {
  surahId: number;
  onBack(): void;
}

export function SurahDetail({ surahId, onBack }: Props) {
  const surah = getSurah(surahId);
  const records = useStore((s) => s.records);
  const needsReview = useStore((s) => s.needsReview);
  const setState = useStore((s) => s.setState);
  const cycleState = useStore((s) => s.cycleState);
  const markRangeState = useStore((s) => s.markRangeState);
  const reviewRange = useStore((s) => s.reviewRange);

  const [sheetAyah, setSheetAyah] = useState<number | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);

  const progress = useMemo(
    () => surahProgress(records, surahId, needsReview),
    [records, needsReview, surahId],
  );

  const stateOf = (ayah: number): AyahState => {
    const rec = records.get(ayahKey(surahId, ayah));
    if (!rec) return "none";
    if (rec.state === "memorized" && needsReview.has(ayahKey(surahId, ayah))) {
      return "needsReview";
    }
    return rec.state;
  };

  const ayat = Array.from({ length: surah.ayahCount }, (_, i) => i + 1);
  const currentSheetState: AyahState = sheetAyah ? stateOf(sheetAyah) : "none";

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          padding: theme.spacing(4),
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderColor: theme.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing(3) }}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => ({
              padding: theme.spacing(2),
              marginRight: theme.spacing(2),
              borderRadius: theme.radius,
              backgroundColor: pressed ? theme.surfaceRaised : "transparent",
            })}
          >
            <Text style={{ color: theme.accent, fontSize: 16 }}>← Back</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "700" }}>
              {surah.nameTransliterated}
            </Text>
            <Text style={{ color: theme.textDim, fontSize: 13 }}>
              {surah.nameArabic} · {surah.ayahCount} ayat · Juz {surah.juzSpan.join(", ")}
            </Text>
          </View>
          <Pressable
            onPress={() => setRangeOpen(true)}
            style={({ pressed }) => ({
              paddingHorizontal: theme.spacing(3),
              paddingVertical: theme.spacing(2),
              borderRadius: theme.radius,
              borderWidth: 1,
              borderColor: theme.accent,
              backgroundColor: pressed ? theme.surfaceRaised : "transparent",
            })}
          >
            <Text style={{ color: theme.accent }}>Mark range…</Text>
          </Pressable>
        </View>
        <View style={{ marginBottom: theme.spacing(2) }}>
          <ProgressBar progress={progress} height={8} />
          <Text style={{ color: theme.textDim, fontSize: 12, marginTop: theme.spacing(1) }}>
            {progress.memorized + progress.needsReview} memorized ·{" "}
            {progress.needsReview} to review · {progress.learning} learning · {Math.round(progress.percent)}%
          </Text>
        </View>
        <Legend />
      </View>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(3) }}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
          }}
        >
          {ayat.map((a) => (
            <AyahCell
              key={a}
              ayah={a}
              state={stateOf(a)}
              onPress={() => setSheetAyah(a)}
              onLongPress={() => cycleState(surahId, a)}
            />
          ))}
        </View>
      </ScrollView>
      <AyahSheet
        visible={sheetAyah !== null}
        surah={surahId}
        ayah={sheetAyah ?? 1}
        state={currentSheetState}
        onClose={() => setSheetAyah(null)}
        onSetState={(target) => sheetAyah && setState(surahId, sheetAyah, target)}
        onMarkReviewed={() =>
          sheetAyah && reviewRange(surahId, sheetAyah, sheetAyah)
        }
      />
      <RangeMarker
        visible={rangeOpen}
        surah={surahId}
        ayahCount={surah.ayahCount}
        onClose={() => setRangeOpen(false)}
        onConfirm={(from, to, target) => markRangeState(surahId, from, to, target)}
      />
    </View>
  );
}

function Legend() {
  const items: { label: string; color: string; border?: string; badge?: boolean }[] = [
    { label: "Not started", color: "transparent", border: theme.border },
    { label: "Learning", color: theme.learningDim, border: theme.learning },
    { label: "Memorized", color: theme.memorizedDim, border: theme.memorized },
    { label: "Needs review", color: theme.memorizedDim, border: theme.needsReview, badge: true },
  ];
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(3) }}>
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              backgroundColor: it.color,
              borderWidth: 1.5,
              borderColor: it.border,
              marginRight: theme.spacing(1),
              position: "relative",
            }}
          >
            {it.badge && (
              <View
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.needsReview,
                }}
              />
            )}
          </View>
          <Text style={{ color: theme.textDim, fontSize: 12 }}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}
