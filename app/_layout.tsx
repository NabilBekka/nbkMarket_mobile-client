import { Stack } from "expo-router";
import { LangProvider } from "@/context/LangContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  return (
    <LangProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: "none" }} />
      </AuthProvider>
    </LangProvider>
  );
}
