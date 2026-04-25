import Constants from "expo-constants";
import { Platform } from "react-native";

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

export function getApiBaseUrl(): string {
  const extra = getExtra();

  const webDefault = "http://127.0.0.1:8000";
  const nativeDefault = "http://10.0.2.2:8000";

  if (Platform.OS === "web") {
    return extra.apiBaseUrlWeb || webDefault;
  }

  return extra.apiBaseUrlNative || nativeDefault;
}
