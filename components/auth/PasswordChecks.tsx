import { View, Text, StyleSheet } from "react-native";
import { useLang } from "@/context/LangContext";

interface PasswordChecksProps {
  password: string;
}

export default function PasswordChecks({ password }: PasswordChecksProps) {
  const { t } = useLang();

  const checks = [
    { key: "length", valid: password.length >= 8, label: t.login.checks.length },
    { key: "uppercase", valid: /[A-Z]/.test(password), label: t.login.checks.uppercase },
    { key: "lowercase", valid: /[a-z]/.test(password), label: t.login.checks.lowercase },
    { key: "number", valid: /[0-9]/.test(password), label: t.login.checks.number },
    { key: "special", valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), label: t.login.checks.special },
  ];

  return (
    <View style={styles.container}>
      {checks.map((check) => (
        <Text
          key={check.key}
          style={[styles.check, check.valid ? styles.valid : styles.invalid]}
        >
          {check.valid ? "✓" : "✗"} {check.label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 3,
  },
  check: {
    fontSize: 11,
    fontWeight: "500",
  },
  valid: {
    color: "#4CAF50",
  },
  invalid: {
    color: "#E53935",
  },
});
