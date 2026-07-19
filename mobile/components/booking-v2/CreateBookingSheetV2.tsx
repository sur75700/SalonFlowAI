import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

export interface BookingSelectOption {
  id: string;
  /** Pre-formatted display label (e.g. client name, service name). */
  label: string;
}

export interface CreateBookingQuickAction {
  /** Pre-translated label — e.g. real "Quick Next Hour" key text. */
  label: string;
  onPress: () => void;
}

export interface CreateBookingSheetV2Props {
  visible: boolean;
  onRequestClose: () => void;
  /** 'sheet' = mobile bottom sheet, 'panel' = desktop side panel. */
  layout: 'sheet' | 'panel';

  title: string;
  subtitle?: string;

  clientLabel: string;
  clientOptions: BookingSelectOption[];
  selectedClientId?: string;
  clientPlaceholder: string;
  onSelectClient: (id: string) => void;

  serviceLabel: string;
  serviceOptions: BookingSelectOption[];
  selectedServiceId?: string;
  servicePlaceholder: string;
  onSelectService: (id: string) => void;

  /**
   * Real underlying value is the datetime-local string produced by
   * formatDateTimeLocalInput() (e.g. "2026-07-15T09:00") — matches the
   * real screen's confirmed format exactly. Kept as a plain text field
   * (no new date-picker dependency assumed).
   */
  bookingTimeLabel: string;
  bookingTimeValue: string;
  onChangeBookingTime: (value: string) => void;
  quickActions: CreateBookingQuickAction[];

  notesLabel: string;
  notesValue: string;
  onChangeNotes: (value: string) => void;
  notesPlaceholder: string;

  submitLabel: string;
  onSubmit: () => void;
  submitting?: boolean;

  resetLabel: string;
  onReset: () => void;

  /** Pre-formatted validation/error presentation — this component never validates itself. */
  errorMessage?: string;
}

const colors = {
  scrim: 'rgba(7,7,15,0.6)',
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  surfaceOption: '#22244F',
  border: 'rgba(255,255,255,0.08)',
  royal: '#7C5CFF',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  danger: '#F2617A',
  dangerSoft: 'rgba(242,97,122,0.12)',
} as const;

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

/** Inline expandable select — no external picker/modal dependency. */
function SelectField({
  value,
  placeholder,
  options,
  onSelect,
}: {
  value?: string;
  placeholder: string;
  options: BookingSelectOption[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.selectField}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.selectFieldText, !selected && styles.placeholderText]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.selectChevron}>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open && (
        <View style={styles.optionList}>
          <ScrollView
            style={styles.optionScroll}
            contentContainerStyle={styles.optionScrollContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            {options.length === 0 ? (
              <Text style={styles.optionEmptyText}>—</Text>
            ) : (
              options.map((option) => {
                const isSelected = option.id === value;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onSelect(option.id);
                      setOpen(false);
                    }}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[styles.optionRowText, isSelected && styles.optionRowTextSelected]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/**
 * CreateBookingSheetV2 — fully controlled, presentation-only. No fetch,
 * no submit logic, no field validation logic — every value and handler
 * arrives via props. Same fields as the real screen (Client, Service,
 * Booking Time + quick actions, Notes); nothing added, nothing removed.
 */
function CreateBookingSheetV2(props: CreateBookingSheetV2Props) {
  const {
    visible,
    onRequestClose,
    layout,
    title,
    subtitle,
    clientLabel,
    clientOptions,
    selectedClientId,
    clientPlaceholder,
    onSelectClient,
    serviceLabel,
    serviceOptions,
    selectedServiceId,
    servicePlaceholder,
    onSelectService,
    bookingTimeLabel,
    bookingTimeValue,
    onChangeBookingTime,
    quickActions,
    notesLabel,
    notesValue,
    onChangeNotes,
    notesPlaceholder,
    submitLabel,
    onSubmit,
    submitting,
    resetLabel,
    onReset,
    errorMessage,
  } = props;

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const isSheet = layout === 'sheet';

  const containerAnimatedStyle = isSheet
    ? {
        transform: [
          { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [480, 0] }) },
        ],
      }
    : {
        transform: [
          { translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) },
        ],
      };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} accessibilityRole="button" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={isSheet ? styles.sheetOuter : styles.panelOuter}
        >
          <Animated.View style={[isSheet ? styles.sheet : styles.panel, containerAnimatedStyle]}>
            {isSheet && <View style={styles.grabber} />}

            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{title}</Text>
                {!!subtitle && (
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {subtitle}
                  </Text>
                )}
              </View>
              <Pressable onPress={onRequestClose} hitSlop={8} accessibilityRole="button">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!!errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <FieldLabel>{clientLabel}</FieldLabel>
              <SelectField
                value={selectedClientId}
                placeholder={clientPlaceholder}
                options={clientOptions}
                onSelect={onSelectClient}
              />

              <View style={styles.fieldGap} />

              <FieldLabel>{serviceLabel}</FieldLabel>
              <SelectField
                value={selectedServiceId}
                placeholder={servicePlaceholder}
                options={serviceOptions}
                onSelect={onSelectService}
              />

              <FieldLabel>{bookingTimeLabel}</FieldLabel>
              <TextInput
                value={bookingTimeValue}
                onChangeText={onChangeBookingTime}
                style={styles.textInput}
                placeholderTextColor={colors.textTertiary}
              />

              <View style={styles.quickRow}>
                {quickActions.map((action) => (
                  <Pressable
                    key={action.label}
                    onPress={action.onPress}
                    style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.quickChipText} numberOfLines={1}>
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <FieldLabel>{notesLabel}</FieldLabel>
              <TextInput
                value={notesValue}
                onChangeText={onChangeNotes}
                placeholder={notesPlaceholder}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                style={[styles.textInput, styles.notesInput]}
              />
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={onSubmit}
                disabled={submitting}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.submitBtn,
                  (pressed || submitting) && styles.submitBtnPressed,
                ]}
              >
                <Text style={styles.submitBtnText}>{submitting ? '…' : submitLabel}</Text>
              </Pressable>
              <Pressable onPress={onReset} accessibilityRole="button" style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>{resetLabel}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheetOuter: {
    width: '100%',
  },
  panelOuter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    maxHeight: '88%',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
  },
  panel: {
    width: 420,
    maxWidth: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  closeText: {
    fontSize: 16,
    color: colors.textTertiary,
    paddingLeft: 12,
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textTertiary,
    marginBottom: 6,
    marginTop: 14,
  },
  fieldGap: {
    height: 2,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  selectFieldText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginRight: 8,
  },
  selectChevron: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  optionList: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  optionScroll: {
    maxHeight: 168,
  },
  optionScrollContent: {
    flexGrow: 0,
  },
  optionRow: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionRowSelected: {
    backgroundColor: colors.surfaceOption,
  },
  optionRowText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  optionRowTextSelected: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  optionEmptyText: {
    padding: 14,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  textInput: {
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quickRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(124,92,255,0.14)',
    marginRight: 8,
    marginBottom: 8,
  },
  quickChipPressed: {
    backgroundColor: 'rgba(124,92,255,0.26)',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.royal,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
  footer: {
    marginTop: 16,
  },
  submitBtn: {
    backgroundColor: colors.royal,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F6F5FB',
  },
  resetBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
});

export default React.memo(CreateBookingSheetV2);
