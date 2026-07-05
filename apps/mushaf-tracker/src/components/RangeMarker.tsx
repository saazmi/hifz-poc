import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import type { PersistedAyahState } from "@hifz/core";
import { theme } from "../theme";

interface Props {
  visible: boolean;
  surah: number;
  ayahCount: number;
  onClose(): void;
  onConfirm(from: number, to: number, target: PersistedAyahState | "none"): void;
}

const OPTIONS: { label: string; value: PersistedAyahState | "none" }[] = [
  { label: "Not started", value: "none" },
  { label: "Learning", value: "learning" },
  { label: "Memorized", value: "memorized" },
];

export function RangeMarker({ visible, surah, ayahCount, onClose, onConfirm }: Props) {
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState(String(ayahCount));
  const [target, setTarget] = useState<PersistedAyahState | "none">("memorized");

  const submit = (): void => {
    const f = Math.max(1, Math.min(ayahCount, Number(from) || 1));
    const t = Math.max(1, Math.min(ayahCount, Number(to) || ayahCount));
    onConfirm(Math.min(f, t), Math.max(f, t), target);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: theme.spacing(4),
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            width: "100%",
            maxWidth: 380,
            padding: theme.spacing(5),
            backgroundColor: theme.surface,
            borderRadius: theme.radius,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "600", marginBottom: theme.spacing(4) }}>
            Mark range in surah {surah}
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing(2), marginBottom: theme.spacing(4) }}>
            <NumField label="From" value={from} onChange={setFrom} max={ayahCount} />
            <NumField label="To" value={to} onChange={setTo} max={ayahCount} />
          </View>
          <Text style={{ color: theme.textDim, marginBottom: theme.spacing(2) }}>Target state</Text>
          <View style={{ gap: theme.spacing(2), marginBottom: theme.spacing(4) }}>
            {OPTIONS.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => setTarget(o.value)}
                style={{
                  padding: theme.spacing(3),
                  borderRadius: theme.radius,
                  borderWidth: 1,
                  borderColor: target === o.value ? theme.accent : theme.border,
                  backgroundColor: target === o.value ? theme.surfaceRaised : theme.surface,
                }}
              >
                <Text style={{ color: theme.text }}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: theme.spacing(2) }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                padding: theme.spacing(3),
                borderRadius: theme.radius,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.textDim }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              style={{
                flex: 1,
                padding: theme.spacing(3),
                borderRadius: theme.radius,
                backgroundColor: theme.memorizedDim,
                borderWidth: 1,
                borderColor: theme.memorized,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function NumField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: string;
  onChange(v: string): void;
  max: number;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: theme.textDim, fontSize: 12, marginBottom: theme.spacing(1) }}>
        {label} (1–{max})
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        style={{
          padding: theme.spacing(2),
          borderRadius: theme.radius,
          borderWidth: 1,
          borderColor: theme.border,
          color: theme.text,
          backgroundColor: theme.surfaceRaised,
        }}
      />
    </View>
  );
}
