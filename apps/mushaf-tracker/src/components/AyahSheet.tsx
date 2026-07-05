import { Modal, Pressable, Text, View } from "react-native";
import type { AyahState, PersistedAyahState } from "@hifz/core";
import { theme } from "../theme";

interface Props {
  visible: boolean;
  surah: number;
  ayah: number;
  state: AyahState;
  onClose(): void;
  onSetState(target: PersistedAyahState | "none"): void;
  onMarkReviewed(): void;
}

const STATE_BUTTONS: { label: string; value: PersistedAyahState | "none" }[] = [
  { label: "Not started", value: "none" },
  { label: "Learning", value: "learning" },
  { label: "Memorized", value: "memorized" },
];

export function AyahSheet({
  visible,
  surah,
  ayah,
  state,
  onClose,
  onSetState,
  onMarkReviewed,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: theme.spacing(5),
            borderTopWidth: 1,
            borderColor: theme.border,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
              marginBottom: theme.spacing(4),
            }}
          />
          <Text
            style={{
              color: theme.textDim,
              fontSize: 12,
              marginBottom: theme.spacing(1),
            }}
          >
            Surah {surah} · Ayah {ayah}
          </Text>
          <Text
            style={{
              color: theme.text,
              fontSize: 18,
              fontWeight: "600",
              marginBottom: theme.spacing(4),
            }}
          >
            Current: {labelFor(state)}
          </Text>
          <View style={{ gap: theme.spacing(2) }}>
            {STATE_BUTTONS.map((b) => (
              <StateButton
                key={b.value}
                label={b.label}
                selected={effectiveMatches(state, b.value)}
                onPress={() => {
                  onSetState(b.value);
                  onClose();
                }}
              />
            ))}
            {(state === "memorized" || state === "needsReview") && (
              <StateButton
                label="Reviewed just now ✓"
                variant="primary"
                onPress={() => {
                  onMarkReviewed();
                  onClose();
                }}
              />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const labelFor = (s: AyahState): string => {
  switch (s) {
    case "learning":
      return "Learning";
    case "memorized":
      return "Memorized";
    case "needsReview":
      return "Needs review";
    case "none":
    default:
      return "Not started";
  }
};

const effectiveMatches = (
  current: AyahState,
  target: PersistedAyahState | "none",
): boolean => {
  if (target === "memorized") return current === "memorized" || current === "needsReview";
  return current === target;
};

function StateButton({
  label,
  selected,
  variant,
  onPress,
}: {
  label: string;
  selected?: boolean;
  variant?: "primary";
  onPress(): void;
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: theme.spacing(3),
        borderRadius: theme.radius,
        borderWidth: 1,
        borderColor: primary ? theme.memorized : selected ? theme.accent : theme.border,
        backgroundColor: pressed
          ? theme.surfaceRaised
          : primary
            ? theme.memorizedDim
            : selected
              ? theme.surfaceRaised
              : theme.surface,
        alignItems: "center",
      })}
    >
      <Text
        style={{
          color: theme.text,
          fontWeight: primary || selected ? "600" : "400",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
