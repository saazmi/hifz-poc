import { Pressable, Text, View } from "react-native";
import type { AyahState } from "@hifz/core";
import { stateColors, theme } from "../theme";

interface Props {
  ayah: number;
  state: AyahState;
  onPress(): void;
  onLongPress(): void;
}

const CELL = 40;

export function AyahCell({ ayah, state, onPress, onLongPress }: Props) {
  const colors = stateColors(state);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        width: CELL,
        height: CELL,
        margin: 3,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: pressed ? theme.surfaceRaised : colors.fill,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text style={{ color: colors.text, fontSize: 13, fontVariant: ["tabular-nums"] }}>
        {ayah}
      </Text>
      {state === "needsReview" && (
        <View
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.needsReview,
            borderWidth: 1,
            borderColor: theme.bg,
          }}
        />
      )}
    </Pressable>
  );
}
