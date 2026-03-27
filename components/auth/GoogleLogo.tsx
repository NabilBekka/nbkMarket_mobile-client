import { View, Text, StyleSheet } from "react-native";

export default function GoogleLogo() {
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <Text style={styles.blue}>G</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  blue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4285F4",
    marginLeft: 1,
  },
});
