import { Stack } from "expo-router";
import { LangProvider } from "@/context/LangContext";

export default function RootLayout() {
  return (
    <LangProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </LangProvider>
  );
}
