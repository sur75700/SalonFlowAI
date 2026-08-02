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
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  darkVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 5, 12, 0.60)",
  },
  blueCalmLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 16, 36, 0.27)",
  },
  bottomDepth: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
    backgroundColor: "rgba(10, 18, 42, 0.18)",
  },
  content: {
    flex: 1,
  },
});
