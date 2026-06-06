import React from "react";
import {
  ImageBackground,
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
      <ImageBackground
        source={require("../../assets/backgrounds/royal-cosmos.jpg")}
        resizeMode="cover"
        style={styles.image}
      >
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.darkVeil} />
          <View style={styles.blueCalmLayer} />
          <View style={styles.bottomDepth} />
        </View>

        <View style={styles.content}>{children}</View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040508",
    overflow: "hidden",
  },
  image: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  darkVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 5, 12, 0.78)",
  },
  blueCalmLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 16, 36, 0.34)",
  },
  bottomDepth: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "40%",
    backgroundColor: "rgba(4, 5, 8, 0.72)",
  },
  content: {
    flex: 1,
  },
});
