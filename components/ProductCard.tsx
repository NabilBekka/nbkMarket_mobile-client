import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";

interface ProductCardProps {
  emoji: string;
  emojiBg: string;
  name: string;
  shop: string;
  price: string;
  location: string;
}

export default function ProductCard({
  emoji,
  emojiBg,
  name,
  shop,
  price,
  location,
}: ProductCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.image, { backgroundColor: emojiBg }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.shop} numberOfLines={1}>
          {shop}
        </Text>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.location}>📍 {location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    flex: 1,
  },
  image: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 36,
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textDark,
  },
  shop: {
    fontSize: 10,
    color: colors.textGray,
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textDark,
    marginTop: 6,
  },
  location: {
    fontSize: 10,
    color: colors.accent,
    marginTop: 3,
  },
});
