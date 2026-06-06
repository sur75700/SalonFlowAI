import React from "react";
import {
  SafeAreaView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type RoyalCosmosBackgroundProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function RoyalCosmosBackground({
  children,
  style,
}: RoyalCosmosBackgroundProps) {
  return (
    <SafeAreaView style={[styles.container, style]}>
      <View pointerEvents="none" style={styles.cosmosLayer}>
        <View style={[styles.glow, styles.indigoGlow]} />
        <View style={[styles.glow, styles.violetGlow]} />
        <View style={[styles.glow, styles.blueMist]} />
        <View style={styles.deepFade} />
      </View>

      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050713",
    overflow: "hidden",
  },
  cosmosLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#050713",
  },
  glow: {
    position: "absolute",
    borderRadius: 999,
  },
  indigoGlow: {
    width: 360,
    height: 360,
    top: -120,
    right: -140,
    backgroundColor: "rgba(79, 70, 229, 0.18)",
  },
  violetGlow: {
    width: 300,
    height: 300,
    top: 180,
    left: -160,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
  },
  blueMist: {
    width: 260,
    height: 260,
    bottom: -120,
    right: 20,
    backgroundColor: "rgba(14, 165, 233, 0.08)",
  },
  deepFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 5, 8, 0.72)",
  },
  content: {
    flex: 1,
  },
});
