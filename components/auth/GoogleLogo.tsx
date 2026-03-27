import { Image, StyleSheet } from "react-native";

const GOOGLE_LOGO_URI =
  "https://developers.google.com/identity/images/g-logo.png";

export default function GoogleLogo() {
  return (
    <Image
      source={{ uri: GOOGLE_LOGO_URI }}
      style={styles.logo}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 22,
    height: 22,
  },
});
