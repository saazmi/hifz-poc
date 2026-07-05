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
import { RangeMarker } from "../components/RangeMarker";
import { SelectionBar } from "../components/SelectionBar";
import { t } from "../i18n";

interface Props {
  surahId: number;
  onBack(): void;
}

export function SurahDetail({ surahId, onBack }: Props) {
  const surah = getSurah(surahId);
  const records = useStore((s) => s.records);
  const cycleState = useStore((s) => s.cycleState);
  const markRangeState = useStore((s) => s.markRangeState);
  const markManyState = useStore((s) => s.markManyState);

  const [rangeOpen, setRangeOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const enterSelection = (): void => {
    setSelected(new Set());
    setSelectionMode(true);
  };
  const exitSelection = (): void => {
    setSelectionMode(false);
    setSelected(new Set());
  };
  const toggleSelected = (ayah: number): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ayah)) next.delete(ayah);
      else next.add(ayah);
      return next;
    });
  };
  const applySelection = (target: "learning" | "memorized" | "none"): void => {
    markManyState(surahId, Array.from(selected).sort((a, b) => a - b), target);
    exitSelection();
  };

  const progress = useMemo(
    () => surahProgress(records, surahId),
    [records, surahId],
  );

  const stateOf = (ayah: number): AyahState => {
    const rec = records.get(ayahKey(surahId, ayah));
    return rec?.state ?? "none";
  };

  const ayat = Array.from({ length: surah.ayahCount }, (_, i) => i + 1);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: theme.spacing(4),
          paddingTop: theme.spacing(3),
          paddingBottom: theme.spacing(4),
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderColor: theme.border,
        }}
      >
        {/* Row 1 — actions only, aligned */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: theme.spacing(3),
          }}
        >
          <Pressable
            onPress={onBack}
            style={({ pressed }) => ({
              paddingHorizontal: theme.spacing(2),
              paddingVertical: theme.spacing(2),
              borderRadius: theme.radius,
              backgroundColor: pressed ? theme.surfaceRaised : "transparent",
            })}
          >
            <Text style={{ color: theme.accent, fontSize: 15 }}>{t.back}</Text>
          </Pressable>
          <View style={{ flexDirection: "row", gap: theme.spacing(2) }}>
            <HeaderButton
              label={t.select}
              onPress={enterSelection}
              disabled={selectionMode}
            />
            <HeaderButton
              label={t.chooseInterval}
              onPress={() => setRangeOpen(true)}
              disabled={selectionMode}
            />
          </View>
        </View>

        {/* Row 2 — surah name (transliterated + Arabic) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: theme.spacing(1),
          }}
        >
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "700" }}>
            {surah.nameTransliterated}
          </Text>
          <Text style={{ color: theme.textDim, fontSize: 18 }}>
            {surah.nameArabic}
          </Text>
        </View>

        {/* Row 3 — metadata */}
        <Text
          style={{
            color: theme.textFaint,
            fontSize: 12,
            marginBottom: theme.spacing(4),
          }}
        >
          {t.surahHeaderMeta(surah.ayahCount, surah.juzSpan.join(", "))}
        </Text>

        {/* Progress bar + stats */}
        <ProgressBar progress={progress} height={8} />
        <Text
          style={{
            color: theme.textDim,
            fontSize: 12,
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(4),
          }}
        >
          {t.surahStats(
            progress.memorized,
            progress.learning,
            Math.round(progress.percent),
          )}
        </Text>

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
              selected={selectionMode && selected.has(a)}
              onPress={() =>
                selectionMode ? toggleSelected(a) : cycleState(surahId, a)
              }
            />
          ))}
        </View>
      </ScrollView>
      {selectionMode && (
        <SelectionBar
          count={selected.size}
          onApply={applySelection}
          onCancel={exitSelection}
        />
      )}
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

function HeaderButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress(): void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingHorizontal: theme.spacing(3),
        paddingVertical: theme.spacing(2),
        borderRadius: theme.radius,
        borderWidth: 1,
        borderColor: theme.accent,
        backgroundColor: pressed ? theme.surfaceRaised : "transparent",
        opacity: disabled ? 0.35 : 1,
      })}
    >
      <Text style={{ color: theme.accent, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

function Legend() {
  const items: { label: string; color: string; border?: string }[] = [
    { label: t.legend.none, color: "transparent", border: theme.border },
    { label: t.legend.learning, color: theme.learningDim, border: theme.learning },
    { label: t.legend.memorized, color: theme.memorizedDim, border: theme.memorized },
  ];
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        columnGap: theme.spacing(5),
        rowGap: theme.spacing(2),
      }}
    >
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
              marginRight: theme.spacing(2),
            }}
          />

          <Text style={{ color: theme.textDim, fontSize: 12 }}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}
