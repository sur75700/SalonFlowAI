import { useCallback, useState } from "react";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

import {
  deleteProfileAvatar,
  uploadProfileAvatar,
} from "../lib/api";
import { useSession } from "./useSession";

export function useProfileAvatar() {
  const {
    token,
    sessionUser,
    refreshProfile,
  } = useSession();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const choosePhoto = useCallback(async () => {
    if (!token || working) {
      return false;
    }

    setError("");
    setWorking(true);

    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          throw new Error(
            "Photo library permission is required to choose a profile picture."
          );
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.72,
      });

      if (result.canceled || !result.assets?.[0]) {
        return false;
      }

      const asset = result.assets[0];

      await uploadProfileAvatar(token, {
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        file: asset.file ?? null,
      });

      refreshProfile();
      return true;
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to update profile photo."
      );
      return false;
    } finally {
      setWorking(false);
    }
  }, [refreshProfile, token, working]);

  const resetPhoto = useCallback(async () => {
    if (!token || working) {
      return false;
    }

    setError("");
    setWorking(true);

    try {
      await deleteProfileAvatar(token);
      refreshProfile();
      return true;
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to reset profile photo."
      );
      return false;
    } finally {
      setWorking(false);
    }
  }, [refreshProfile, token, working]);

  return {
    avatarUrl: sessionUser?.avatar_url || null,
    avatarSource: sessionUser?.avatar_source || "initials",
    working,
    error,
    choosePhoto,
    resetPhoto,
  };
}
