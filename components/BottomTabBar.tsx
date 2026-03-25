import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { colors } from "@/constants/colors";

const tabs = [
  { icon: "🏠", label: "Accueil" },
  { icon: "🔍", label: "Explorer" },
  { icon: "💬", label: "Messages" },
  { icon: "❤️", label: "Favoris" },
  { icon: "👤", label: "Profil" },
];

export default function BottomTabBar() {
  const [active, setActive] = useState(0);

  return (
    <View style={styles.container}>
      {tabs.map((tab, i) => (
        <TouchableOpacity
          key={tab.label}
          style={styles.tab}
          onPress={() => setActive(i)}
        >
          <Text style={styles.icon}>{tab.icon}</Text>
          <Text style={[styles.label, i === active && styles.labelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    paddingVertical: 8,
    paddingBottom: 24,
  },
  tab: {
    alignItems: "center",
    gap: 2,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    color: "#999999",
  },
  labelActive: {
    color: colors.accent,
    fontWeight: "600",
  },
});
