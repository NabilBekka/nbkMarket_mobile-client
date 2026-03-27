import { Tabs } from "expo-router";
import { Text, StyleSheet } from "react-native";
import { useLang } from "@/context/LangContext";
import { colors } from "@/constants/colors";

export default function TabsLayout() {
  const { t } = useLang();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#999999",
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ focused }) => (
            <Text style={styles.tabIcon}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t.tabs.explore,
          tabBarIcon: ({ focused }) => (
            <Text style={styles.tabIcon}>🔍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t.tabs.messages,
          tabBarIcon: ({ focused }) => (
            <Text style={styles.tabIcon}>💬</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t.tabs.favorites,
          tabBarIcon: ({ focused }) => (
            <Text style={styles.tabIcon}>❤️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ focused }) => (
            <Text style={styles.tabIcon}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    paddingBottom: 20,
    paddingTop: 6,
    height: 70,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  tabIcon: {
    fontSize: 20,
  },
});
