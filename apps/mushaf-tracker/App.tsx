import { useEffect, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { useStore } from "./src/store";
import { SurahList } from "./src/screens/SurahList";
import { SurahDetail } from "./src/screens/SurahDetail";
import { UndoBar } from "./src/components/UndoBar";
import { theme } from "./src/theme";

export default function App() {
  const load = useStore((s) => s.load);
  const loaded = useStore((s) => s.loaded);
  const [openSurah, setOpenSurah] = useState<number | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loaded) {
    return <SafeAreaView style={styles.root} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>
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
  root: {
    flex: 1,
    backgroundColor: theme.bg,
  },
});
