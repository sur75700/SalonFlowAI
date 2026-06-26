import Constants from "expo-constants";
import { Platform } from "react-native";

declare const process: {
  env?: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
  };
};

type ExtraConfig = {
  apiBaseUrlWeb?: string;
  apiBaseUrlNative?: string;
};

function getExtra(): ExtraConfig {
  const extra =
    (Constants.expoConfig?.extra as ExtraConfig | undefined) ||
    (Constants.manifest2?.extra as ExtraConfig | undefined) ||
    {};

  return extra;
}

function getPublicApiUrl(): string {
  if (typeof process === "undefined") return "";
  return process.env?.EXPO_PUBLIC_API_URL?.trim() || "";
}

export function getApiBaseUrl(): string {
  const publicApiUrl = getPublicApiUrl();

  if (publicApiUrl) {
    return publicApiUrl;
  }

  const extra = getExtra();

  const productionDefault = "https://salonflowai-backend.onrender.com";
  const webDefault = extra.apiBaseUrlWeb || productionDefault;
  const nativeDefault = extra.apiBaseUrlNative || productionDefault;

  if (Platform.OS === "web") {
    return webDefault;
  }

  return nativeDefault;
}


export function getGoogleClientIds() {
  const env = typeof process === "undefined" ? {} : process.env || {};

  return {
    webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "",
    androidClientId: env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || "",
    iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || "",
  };
}

export function isGoogleAuthConfigured(): boolean {
  const ids = getGoogleClientIds();
  return Boolean(ids.webClientId || ids.androidClientId || ids.iosClientId);
}
