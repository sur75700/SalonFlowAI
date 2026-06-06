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
        <View style={styles.topNebula} />
        <View style={styles.midnightBand} />
        <View style={styles.violetHorizon} />
        <View style={styles.bottomDepth} />
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
  topNebula: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "38%",
    backgroundColor: "rgba(35, 42, 90, 0.34)",
  },
  midnightBand: {
    position: "absolute",
    top: "24%",
    left: 0,
    right: 0,
    height: "44%",
    backgroundColor: "rgba(16, 24, 52, 0.42)",
  },
  violetHorizon: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "16%",
    height: "30%",
    backgroundColor: "rgba(64, 38, 108, 0.2)",
  },
  bottomDepth: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "34%",
    backgroundColor: "rgba(4, 5, 8, 0.7)",
  },
  content: {
    flex: 1,
  },
});
