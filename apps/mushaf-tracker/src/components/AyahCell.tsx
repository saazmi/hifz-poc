import { Pressable, Text } from "react-native";
import type { AyahState } from "@hifz/core";
import { stateColors, theme } from "../theme";

interface Props {
  ayah: number;
  state: AyahState;
  selected?: boolean;
  onPress(): void;
  onLongPress?(): void;
}

const CELL = 40;

export function AyahCell({ ayah, state, selected, onPress, onLongPress }: Props) {
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
        borderWidth: selected ? 2 : 1.5,
        borderColor: selected ? theme.accent : colors.border,
        backgroundColor: pressed ? theme.surfaceRaised : colors.fill,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text style={{ color: colors.text, fontSize: 13, fontVariant: ["tabular-nums"] }}>
        {ayah}
      </Text>
    </Pressable>
  );
}
