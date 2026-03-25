import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { colors } from "@/constants/colors";

const categories = [
  "Tout",
  "Mode",
  "Électronique",
  "Maison",
  "Beauté",
  "Alimentation",
  "Artisanat",
  "Sport",
];

export default function CategoryPills() {
  const [active, setActive] = useState(0);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {categories.map((cat, i) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActive(i)}
            style={[styles.pill, i === active && styles.pillActive]}
          >
            <Text style={[styles.pillText, i === active && styles.pillTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navyMid,
    paddingVertical: 12,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },
  pillTextActive: {
    color: colors.navyDark,
  },
});
