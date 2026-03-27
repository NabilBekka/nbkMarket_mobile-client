import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";
import { useLang } from "@/context/LangContext";

export default function Header() {
  const { t } = useLang();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        NBK<Text style={styles.logoAccent}>Market</Text>
      </Text>

      <TextInput
        style={styles.searchBar}
        placeholder={t.header.searchPlaceholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navyDark,
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.white,
    marginBottom: 12,
  },
  logoAccent: {
    color: colors.accent,
  },
  searchBar: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.white,
  },
});
