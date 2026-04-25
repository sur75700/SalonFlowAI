import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type SkeletonProps = {
  height?: number;
  width?: number | string;
  radius?: number;
  style?: ViewStyle;
};

export default function LoadingSkeleton({
  height = 16,
  width = "100%",
  radius = 12,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          height,
          width,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#1a1e27",
  },
});
