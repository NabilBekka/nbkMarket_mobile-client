import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/colors";
import { useLang } from "@/context/LangContext";

export default function MessagesTab() {
  const { t } = useLang();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>{t.tabs.messages}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.emoji}>💬</Text>
        <Text style={styles.placeholder}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgGray },
  header: {
    backgroundColor: colors.navyDark,
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.white },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 40, marginBottom: 12 },
  placeholder: { fontSize: 15, color: colors.textGray },
});
