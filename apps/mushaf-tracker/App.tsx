import { useEffect, useState } from "react";
import { Platform, SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { useStore } from "./src/store";
import { SurahList } from "./src/screens/SurahList";
import { SurahDetail } from "./src/screens/SurahDetail";
import { UndoBar } from "./src/components/UndoBar";
import { theme } from "./src/theme";

const PHONE_WIDTH = 680;
const isWeb = Platform.OS === "web";

const injectWebStyles = (): void => {
  if (!isWeb || typeof document === "undefined") return;
  if (document.getElementById("mushaf-web-styles")) return;
  const style = document.createElement("style");
  style.id = "mushaf-web-styles";
  style.textContent = `
    html, body, #root { background: #05060a; }
    * { scrollbar-width: none; -ms-overflow-style: none; }
    *::-webkit-scrollbar { display: none; width: 0; height: 0; }
  `;
  document.head.appendChild(style);
};

export default function App() {
  const load = useStore((s) => s.load);
  const loaded = useStore((s) => s.loaded);
  const [openSurah, setOpenSurah] = useState<number | null>(null);

  useEffect(() => {
    injectWebStyles();
    void load();
  }, [load]);

  if (!loaded) {
    return <SafeAreaView style={styles.outer} />;
  }

  return (
    <SafeAreaView style={styles.outer}>
      <StatusBar barStyle="light-content" />
      <View style={isWeb ? styles.phoneFrame : styles.fill}>
        {openSurah === null ? (
          <SurahList onOpenSurah={setOpenSurah} />
        ) : (
          <SurahDetail surahId={openSurah} onBack={() => setOpenSurah(null)} />
        )}
        <UndoBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: isWeb ? "#05060a" : theme.bg,
    alignItems: isWeb ? "center" : "stretch",
  },
  fill: {
    flex: 1,
    width: "100%",
  },
  phoneFrame: {
    flex: 1,
    width: "100%",
    maxWidth: PHONE_WIDTH,
    backgroundColor: theme.bg,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  },
});
