import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useStore } from "../store";
import { theme } from "../theme";
import { t } from "../i18n";

const UNDO_MS = 5000;

export function UndoBar() {
  const undo = useStore((s) => s.undo);
  const applyUndo = useStore((s) => s.applyUndo);
  const clearUndo = useStore((s) => s.clearUndo);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(clearUndo, UNDO_MS);
    return () => clearTimeout(t);
  }, [undo, clearUndo]);

  if (!undo) return null;

  return (
    <View
      style={{
        position: "absolute",
        left: theme.spacing(4),
        right: theme.spacing(4),
        bottom: theme.spacing(6),
        padding: theme.spacing(3),
        borderRadius: theme.radius,
        backgroundColor: theme.surfaceRaised,
        borderWidth: 1,
        borderColor: theme.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <Text style={{ color: theme.textDim, flex: 1, marginRight: theme.spacing(2) }}>
        {undo.label}
      </Text>
      <Pressable
        onPress={applyUndo}
        style={({ pressed }) => ({
          paddingHorizontal: theme.spacing(3),
          paddingVertical: theme.spacing(2),
          borderRadius: theme.radius,
          backgroundColor: pressed ? theme.border : "transparent",
        })}
      >
        <Text style={{ color: theme.accent, fontWeight: "600" }}>{t.undo}</Text>
      </Pressable>
    </View>
  );
}
