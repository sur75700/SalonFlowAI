import React from "react";
import { UI } from "../../lib/theme/tokens";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function CommandTile({ icon, title, subtitle, onPress, style }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.84} onPress={onPress} style={[styles.tile, style]}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
        {title}
      </Text>

      <Text style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>

      <Text style={styles.open}>OPEN →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 132,
    borderRadius: UI.radius.xl,
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: "rgba(10, 11, 16, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(242, 209, 122, 0.26)",
    boxShadow: UI.depth.card,
    elevation: 12,
    overflow: "hidden",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(242, 209, 122, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(242, 209, 122, 0.26)",
    marginBottom: 12,
  },
  icon: {
    fontSize: 17,
  },
  title: {
    color: "#f8fafc",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(232, 221, 255, 0.72)",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    minHeight: 32,
  },
  open: {
    marginTop: 12,
    color: "#f5d27a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
