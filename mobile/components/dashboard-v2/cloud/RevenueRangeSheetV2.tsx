import * as React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDashboardTheme } from "../../../hooks/useDashboardTheme";

export interface RevenueRangeValue {
  dateFrom: string;
  dateTo: string;
}

interface RevenueRangeCopy {
  customRange: string;
  fromDate: string;
  toDate: string;
  applyRange: string;
  cancelRange: string;
}

interface RevenueRangeSheetV2Props {
  visible: boolean;
  value: RevenueRangeValue;
  copy: RevenueRangeCopy;
  onApply:
    (value: RevenueRangeValue) => void;
  onCancel: () => void;
}

const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}$/;

export default function RevenueRangeSheetV2({
  visible,
  value,
  copy,
  onApply,
  onCancel,
}: RevenueRangeSheetV2Props) {
  const { theme } = useDashboardTheme();
  const [
    draft,
    setDraft,
  ] =
    React.useState(value);

  const {
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
  } = value;

  React.useEffect(() => {
    if (visible) {
      setDraft({
        dateFrom:
          initialDateFrom,
        dateTo:
          initialDateTo,
      });
    }
  }, [
    visible,
    initialDateFrom,
    initialDateTo,
  ]);

  const normalizedFrom =
    draft.dateFrom.trim();

  const normalizedTo =
    draft.dateTo.trim();

  const valid =
    ISO_DATE_RE.test(
      normalizedFrom
    ) &&
    ISO_DATE_RE.test(
      normalizedTo
    ) &&
    normalizedFrom <=
      normalizedTo;

  const apply = () => {
    if (!valid) {
      return;
    }

    onApply({
      dateFrom:
        normalizedFrom,
      dateTo:
        normalizedTo,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View
        style={styles.backdrop}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor:
                theme.palette.surfaceRaised,
              borderColor:
                theme.palette.borderStrong,
            },
          ]}
          accessibilityRole="none"
        >
          <Text
            style={styles.title}
            accessibilityRole="header"
          >
            {copy.customRange}
          </Text>

          <Text
            style={styles.label}
          >
            {copy.fromDate}
          </Text>

          <TextInput
            value={draft.dateFrom}
            onChangeText={(dateFrom) =>
              setDraft(
                (current) => ({
                  ...current,
                  dateFrom,
                })
              )
            }
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                backgroundColor:
                  theme.palette.surface,
                borderColor:
                  theme.palette.border,
                color:
                  theme.palette.textPrimary,
              },
            ]}
            accessibilityLabel={
              copy.fromDate
            }
          />

          <Text
            style={styles.label}
          >
            {copy.toDate}
          </Text>

          <TextInput
            value={draft.dateTo}
            onChangeText={(dateTo) =>
              setDraft(
                (current) => ({
                  ...current,
                  dateTo,
                })
              )
            }
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                backgroundColor:
                  theme.palette.surface,
                borderColor:
                  theme.palette.border,
                color:
                  theme.palette.textPrimary,
              },
            ]}
            accessibilityLabel={
              copy.toDate
            }
          />

          <View
            style={styles.actions}
          >
            <Pressable
              onPress={onCancel}
              style={styles.secondary}
              accessibilityRole="button"
              accessibilityLabel={
                copy.cancelRange
              }
            >
              <Text
                style={
                  styles.secondaryText
                }
              >
                {copy.cancelRange}
              </Text>
            </Pressable>

            <Pressable
              onPress={apply}
              disabled={!valid}
              style={[
                styles.primary,
                !valid &&
                  styles.disabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                copy.applyRange
              }
              accessibilityState={{
                disabled: !valid,
              }}
            >
              <Text
                style={
                  styles.primaryText
                }
              >
                {copy.applyRange}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent:
        "center",
      padding: 20,
      backgroundColor:
        "rgba(3,5,18,0.78)",
    },
    sheet: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor:
        "rgba(155,130,255,0.34)",
      padding: 20,
      backgroundColor:
        "rgba(12,14,34,0.98)",
      gap: 10,
    },
    title: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 6,
    },
    label: {
      color:
        "rgba(232,235,255,0.78)",
      fontSize: 12,
      fontWeight: "700",
    },
    input: {
      minHeight: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.15)",
      paddingHorizontal: 14,
      color: "#FFFFFF",
      backgroundColor:
        "rgba(255,255,255,0.06)",
    },
    actions: {
      flexDirection: "row",
      justifyContent:
        "flex-end",
      gap: 10,
      marginTop: 8,
    },
    secondary: {
      minHeight: 44,
      justifyContent:
        "center",
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.15)",
    },
    secondaryText: {
      color:
        "rgba(240,242,255,0.82)",
      fontWeight: "700",
    },
    primary: {
      minHeight: 44,
      justifyContent:
        "center",
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor:
        "rgba(124,92,255,0.92)",
    },
    disabled: {
      opacity: 0.42,
    },
    primaryText: {
      color: "#FFFFFF",
      fontWeight: "800",
    },
  });
