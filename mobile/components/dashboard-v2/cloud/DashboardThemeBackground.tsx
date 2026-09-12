import React from "react";
import {
  ImageBackground,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  type ImageSourcePropType,
} from "react-native";

import {
  useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

import type {
  DashboardThemeId,
} from "../../../lib/theme/dashboardThemes";

type DashboardThemeBackgroundProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const backgroundSources:
  Record<DashboardThemeId, ImageSourcePropType> = {
    royal_cosmos:
      require(
        "../../../assets/backgrounds/royal-cosmos.jpg"
      ),

    royal_gold_cosmos:
      require(
        "../../../assets/backgrounds/royal-gold-cosmos.jpg"
      ),
  };

export default function DashboardThemeBackground({
  children,
  style,
}: DashboardThemeBackgroundProps) {
  const {
    selectedThemeId,
    theme,
  } = useDashboardTheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            theme.backgroundFallback,
        },
        style,
      ]}
    >
      <ImageBackground
        source={backgroundSources[selectedThemeId]}
        resizeMode="cover"
        style={styles.image}
      >
        <View
          pointerEvents="none"
          style={styles.overlay}
        >
          <View
            style={[
              styles.fullLayer,
              {
                backgroundColor:
                  theme.overlay.darkVeil,
              },
            ]}
          />

          <View
            style={[
              styles.fullLayer,
              {
                backgroundColor:
                  theme.overlay.toneVeil,
              },
            ]}
          />

          <View
            style={[
              styles.bottomDepth,
              {
                backgroundColor:
                  theme.overlay.bottomDepth,
              },
            ]}
          />
        </View>

        <View style={styles.content}>
          {children}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  fullLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  bottomDepth: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
  },

  content: {
    flex: 1,
  },
});
