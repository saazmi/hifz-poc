import { Pressable, Text, View } from "react-native";
import type { PersistedAyahState } from "@hifz/core";
import { theme } from "../theme";
import { t } from "../i18n";

interface Props {
  count: number;
  onApply(target: PersistedAyahState | "none"): void;
  onCancel(): void;
}

const OPTIONS: { label: string; value: PersistedAyahState | "none"; tint: string; border: string }[] = [
  { label: t.stateButton.none, value: "none", tint: theme.surfaceRaised, border: theme.border },
  { label: t.stateButton.learning, value: "learning", tint: theme.learningDim, border: theme.learning },
  { label: t.stateButton.memorized, value: "memorized", tint: theme.memorizedDim, border: theme.memorized },
];

export function SelectionBar({ count, onApply, onCancel }: Props) {
  const disabled = count === 0;
  return (
    <View
      style={{
        position: "absolute",
        left: theme.spacing(3),
        right: theme.spacing(3),
        bottom: theme.spacing(6),
        padding: theme.spacing(3),
        borderRadius: theme.radius,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: theme.spacing(3),
        }}
      >
        <Text style={{ color: theme.text, fontWeight: "600" }}>
          {count === 0 ? t.selection.empty : t.selection.counter(count)}
        </Text>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => ({
            paddingHorizontal: theme.spacing(3),
            paddingVertical: theme.spacing(2),
            borderRadius: theme.radius,
            backgroundColor: pressed ? theme.surfaceRaised : "transparent",
          })}
        >
          <Text style={{ color: theme.accent }}>{t.selection.cancel}</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", gap: theme.spacing(2) }}>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.value}
            disabled={disabled}
            onPress={() => onApply(o.value)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: theme.spacing(3),
              borderRadius: theme.radius,
              borderWidth: 1,
              borderColor: o.border,
              backgroundColor: disabled
                ? theme.surface
                : pressed
                  ? theme.surfaceRaised
                  : o.tint,
              alignItems: "center",
              opacity: disabled ? 0.4 : 1,
            })}
          >
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: "500" }}>
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
