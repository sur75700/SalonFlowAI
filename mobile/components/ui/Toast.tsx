import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(1);

  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  };

  const showToast = (message: string, tone: ToastTone = "info") => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const nextToast: ToastItem = {
      id: idRef.current++,
      message,
      tone,
    };

    setToast(nextToast);
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(() => {
      hideToast();
    }, 2400);
  };

  const value = useMemo(
    () => ({
      showToast,
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toast ? (
        <SafeAreaView pointerEvents="none" style={styles.overlay}>
          <Animated.View
            style={[
              styles.toast,
              toast.tone === "success" && styles.successToast,
              toast.tone === "error" && styles.errorToast,
              toast.tone === "info" && styles.infoToast,
              { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }) }] },
            ]}
          >
            <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        </SafeAreaView>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    minWidth: 240,
    maxWidth: 520,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  successToast: {
    backgroundColor: "#14311d",
    borderColor: "#2f7a47",
  },
  errorToast: {
    backgroundColor: "#301218",
    borderColor: "#7c2e3c",
  },
  infoToast: {
    backgroundColor: "#141b30",
    borderColor: "#3356a5",
  },
  toastText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
});
