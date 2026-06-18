import { Pressable, ScrollView, Text, View } from "react-native";
import { t } from "../../lib/i18n";
import { useAppPreferences } from "../../hooks/useAppPreferences";

const ITEMS = [
  "Nav Core",
  "Nav AI",
  "Nav Revenue",
  "Nav Security",
  "Nav Operations",
  "Nav Enterprise",
];

export default function SmartNavigationBar({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { locale } = useAppPreferences();

  return (
    <View style={{ marginBottom: 14 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {ITEMS.map((item) => (
          <Pressable
            key={item}
            onPress={() => onNavigate(item)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              marginRight: 10,
              borderRadius: 999,
              backgroundColor: "rgba(242,209,122,0.12)",
              borderWidth: 1,
              borderColor: "rgba(242,209,122,0.35)",
            }}
          >
            <Text style={{ color: "#f2d17a", fontWeight: "900", fontSize: 11 }}>
              {t(item, locale)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
