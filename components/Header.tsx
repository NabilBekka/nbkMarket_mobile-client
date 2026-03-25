import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";

export default function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.subtitle}>Bienvenue</Text>
          <Text style={styles.title}>NBK Market</Text>
        </View>
        <View style={styles.searchIcon}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
        </View>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Rechercher un produit, une boutique..."
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
  },
  searchIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.white,
  },
});
