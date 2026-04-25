import { Alert, Platform } from "react-native";

export function useConfirmAction() {
  const confirm = async (title: string, message: string): Promise<boolean> => {
    if (Platform.OS === "web") {
      return window.confirm(title + "\n\n" + message);
    }

    return new Promise((resolve) => {
      Alert.alert(title, message, [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Confirm",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ]);
    });
  };

  return { confirm };
}
