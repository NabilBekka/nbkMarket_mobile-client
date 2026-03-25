import { View, Text, ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import Header from "@/components/Header";
import CategoryPills from "@/components/CategoryPills";
import ProductCard from "@/components/ProductCard";
import BottomTabBar from "@/components/BottomTabBar";
import { colors } from "@/constants/colors";

const products = [
  { emoji: "👕", emojiBg: "#E3F2FD", name: "T-shirt Premium Coton", shop: "Boutique El Yasmine", price: "2 500 DA", location: "Bab El Oued" },
  { emoji: "👟", emojiBg: "#FFF3E0", name: "Baskets Sport 2025", shop: "StreetWear DZ", price: "8 900 DA", location: "Hussein Dey" },
  { emoji: "📱", emojiBg: "#E8F5E9", name: "Coque iPhone 15", shop: "TechZone DZ", price: "1 200 DA", location: "Hammamet" },
  { emoji: "💄", emojiBg: "#F3E5F5", name: "Kit Beauté Natural", shop: "Beauté d'Orient", price: "3 400 DA", location: "Kouba" },
  { emoji: "🧥", emojiBg: "#E0F2F1", name: "Veste Cuir Classic", shop: "El Yasmine Store", price: "12 500 DA", location: "Alger Centre" },
  { emoji: "👖", emojiBg: "#FFF8E1", name: "Jean Slim Homme", shop: "Mode DZ", price: "4 200 DA", location: "Oran" },
  { emoji: "👗", emojiBg: "#FCE4EC", name: "Robe d'été Femme", shop: "Nour Fashion", price: "3 800 DA", location: "Constantine" },
  { emoji: "🧢", emojiBg: "#E8EAF6", name: "Casquette NBK Style", shop: "Urban DZ", price: "1 800 DA", location: "Sétif" },
];

export default function Home() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView style={styles.scrollView} stickyHeaderIndices={[0, 1]}>
        <Header />
        <CategoryPills />

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tendances à Alger</Text>
            <Text style={styles.viewAll}>Voir tout</Text>
          </View>

          <View style={styles.grid}>
            {products.map((product, i) => (
              <View key={product.name} style={styles.gridItem}>
                <ProductCard {...product} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgGray,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
  },
  viewAll: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "48.5%",
  },
});
