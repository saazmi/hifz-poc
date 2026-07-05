import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SURAHS,
  overallProgress,
  surahProgress,
  TOTAL_AYAT,
  type SurahMeta,
} from "@hifz/core";
import { useStore } from "../store";
import { theme } from "../theme";
import { ProgressBar } from "../components/ProgressBar";
import { t } from "../i18n";

interface Props {
  onOpenSurah(id: number): void;
}

export function SurahList({ onOpenSurah }: Props) {
  const records = useStore((s) => s.records);
  const [query, setQuery] = useState("");

  const overall = useMemo(() => overallProgress(records), [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SURAHS;
    return SURAHS.filter(
      (s) =>
        s.nameTransliterated.toLowerCase().includes(q) ||
        s.nameArabic.includes(query.trim()) ||
        String(s.id).startsWith(q),
    );
  }, [query]);

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
        <Text
          style={{
            color: theme.text,
            fontSize: 22,
            fontWeight: "700",
            marginBottom: theme.spacing(1),
          }}
        >
          {t.appTitle}
        </Text>
        <Text style={{ color: theme.textDim, marginBottom: theme.spacing(3) }}>
          {t.overallSummary(overall.memorized, TOTAL_AYAT, overall.learning)}
        </Text>
        <ProgressBar progress={overall} height={8} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={theme.textFaint}
          style={{
            marginTop: theme.spacing(3),
            padding: theme.spacing(2),
            borderRadius: theme.radius,
            borderWidth: 1,
            borderColor: theme.border,
            color: theme.text,
            backgroundColor: theme.surfaceRaised,
          }}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(s) => String(s.id)}
        renderItem={({ item }) => (
          <SurahRow surah={item} onPress={() => onOpenSurah(item.id)} />
        )}
        contentContainerStyle={{ paddingBottom: theme.spacing(8) }}
      />
    </View>
  );
}

function SurahRow({
  surah,
  onPress,
}: {
  surah: SurahMeta;
  onPress(): void;
}) {
  const records = useStore((s) => s.records);
  const progress = useMemo(
    () => surahProgress(records, surah.id),
    [records, surah.id],
  );
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: theme.spacing(3),
        borderBottomWidth: 1,
        borderColor: theme.border,
        backgroundColor: pressed ? theme.surfaceRaised : theme.bg,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{
            color: theme.textFaint,
            width: 32,
            fontVariant: ["tabular-nums"],
          }}
        >
          {surah.id}
        </Text>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: theme.spacing(1),
            }}
          >
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>
              {surah.nameTransliterated}
            </Text>
            <Text style={{ color: theme.textDim }}>
              {surah.nameArabic}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing(1),
            }}
          >
            <Text style={{ color: theme.textFaint, fontSize: 12 }}>
              {t.surahRowMeta(surah.ayahCount, surah.juzSpan.join(", "))}
            </Text>
            <Text style={{ color: theme.textDim, fontSize: 12 }}>
              {Math.round(progress.percent)}%
            </Text>
          </View>
          <ProgressBar progress={progress} />
        </View>
      </View>
    </Pressable>
  );
}
