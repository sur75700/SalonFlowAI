import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, useWindowDimensions } from 'react-native';

const theme = {
  color: {
    bgBase: '#0A0A12',
    surface: '#14141F',
    surfaceAlt: '#191927',
    surfaceRaised: '#1D1D2E',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.16)',
    textPrimary: '#F2F2F8',
    textSecondary: '#A6A6BE',
    textTertiary: '#6C6C84',
    violet: '#8C7CFF',
    violetSoft: 'rgba(140,124,255,0.16)',
    blue: '#5C8CFF',
    blueSoft: 'rgba(92,140,255,0.16)',
    cyan: '#5FD3E8',
    cyanSoft: 'rgba(95,211,232,0.16)',
    gold: '#E8C275',
    goldSoft: 'rgba(232,194,117,0.18)',
    green: '#6FCF97',
    greenSoft: 'rgba(111,207,151,0.16)',
    red: '#E8748A',
    redSoft: 'rgba(232,116,138,0.16)',
  },
  radius: { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 },
};

export interface CreateClientFormValues {
  fullName: string;
  phone: string;
  email: string;
  notes: string;
}

export interface CreateClientSheetV2Labels {
  title: string;
  subtitle: string;
  fullNameField: string;
  fullNamePlaceholder: string;
  phoneField: string;
  phonePlaceholder: string;
  emailField: string;
  emailPlaceholder: string;
  notesField: string;
  notesPlaceholder: string;
  createAction: string;
  creatingLabel: string;
  resetAction: string;
  closeAction: string;
}

export const DEFAULT_CREATE_CLIENT_SHEET_LABELS: CreateClientSheetV2Labels = {
  title: 'Add client',
  subtitle: 'Start a new client relationship.',
  fullNameField: 'Full name',
  fullNamePlaceholder: 'e.g. Jordan Lee',
  phoneField: 'Phone',
  phonePlaceholder: 'Add a phone number',
  emailField: 'Email',
  emailPlaceholder: 'Add an email address',
  notesField: 'Notes',
  notesPlaceholder: 'Anything worth remembering about this client',
  createAction: 'Add client',
  creatingLabel: 'Adding…',
  resetAction: 'Reset',
  closeAction: 'Close',
};

export interface CreateClientSheetV2Props {
  visible: boolean;
  values: CreateClientFormValues;
  errors?: Partial<Record<keyof CreateClientFormValues, string>>;
  loading?: boolean;
  disabled?: boolean;
  labels?: Partial<CreateClientSheetV2Labels>;
  onChangeField: (field: keyof CreateClientFormValues, value: string) => void;
  onCreate?: () => void;
  onReset?: () => void;
  onClose?: () => void;
}

function CloseGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 14, height: 14 }}>
      <View style={{ position: 'absolute', top: 6, left: 0, width: 14, height: 1.6, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', top: 6, left: 0, width: 14, height: 1.6, backgroundColor: color, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}

export default function CreateClientSheetV2({
  visible,
  values,
  errors,
  loading = false,
  disabled = false,
  labels,
  onChangeField,
  onCreate,
  onReset,
  onClose,
}: CreateClientSheetV2Props) {
  const t: CreateClientSheetV2Labels = { ...DEFAULT_CREATE_CLIENT_SHEET_LABELS, ...labels };
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const interactive = !disabled && !loading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isDesktop ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={interactive ? onClose : undefined}
          accessibilityRole="button"
          accessibilityLabel={t.closeAction}
        />
        <View
          style={[styles.panel, isDesktop ? styles.panelDesktop : styles.panelMobile]}
          accessibilityViewIsModal
        >
          {!isDesktop && <View style={styles.dragHandle} />}

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{t.title}</Text>
              <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t.closeAction}
              style={styles.closeButton}
            >
              <CloseGlyph color={theme.color.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t.fullNameField}</Text>
              <TextInput
                value={values.fullName}
                onChangeText={(value: string) => onChangeField('fullName', value)}
                placeholder={t.fullNamePlaceholder}
                placeholderTextColor={theme.color.textTertiary}
                editable={interactive}
                style={styles.input}
                accessibilityLabel={t.fullNameField}
              />
              {!!errors?.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t.phoneField}</Text>
              <TextInput
                value={values.phone}
                onChangeText={(value: string) => onChangeField('phone', value)}
                placeholder={t.phonePlaceholder}
                placeholderTextColor={theme.color.textTertiary}
                editable={interactive}
                keyboardType="phone-pad"
                style={styles.input}
                accessibilityLabel={t.phoneField}
              />
              {!!errors?.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t.emailField}</Text>
              <TextInput
                value={values.email}
                onChangeText={(value: string) => onChangeField('email', value)}
                placeholder={t.emailPlaceholder}
                placeholderTextColor={theme.color.textTertiary}
                editable={interactive}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                accessibilityLabel={t.emailField}
              />
              {!!errors?.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t.notesField}</Text>
              <TextInput
                value={values.notes}
                onChangeText={(value: string) => onChangeField('notes', value)}
                placeholder={t.notesPlaceholder}
                placeholderTextColor={theme.color.textTertiary}
                editable={interactive}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
                accessibilityLabel={t.notesField}
              />
              {!!errors?.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={interactive ? onReset : undefined}
              disabled={!interactive}
              accessibilityRole="button"
              accessibilityLabel={t.resetAction}
              style={({ pressed }: { pressed: boolean }) => [
                styles.textButton,
                pressed && interactive && styles.textButtonPressed,
              ]}
            >
              <Text style={styles.textButtonText}>{t.resetAction}</Text>
            </Pressable>
            <Pressable
              onPress={interactive ? onCreate : undefined}
              disabled={!interactive}
              accessibilityRole="button"
              accessibilityLabel={loading ? t.creatingLabel : t.createAction}
              accessibilityState={{ disabled: !interactive, busy: loading }}
              style={({ pressed }: { pressed: boolean }) => [
                styles.primaryButton,
                pressed && interactive && styles.primaryButtonPressed,
                !interactive && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>{loading ? t.creatingLabel : t.createAction}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,4,10,0.6)',
  },
  panel: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.borderStrong,
  },
  panelDesktop: {
    width: 440,
    borderLeftWidth: 1,
    height: '100%',
  },
  panelMobile: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    width: '100%',
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.color.borderStrong,
    marginTop: theme.space.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border,
  },
  headerTitle: {
    color: theme.color.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: theme.color.textSecondary,
    fontSize: 13,
    marginTop: theme.space.xs,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -theme.space.md,
    marginTop: -theme.space.xs,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: theme.space.xl,
    gap: theme.space.lg,
  },
  field: {
    gap: theme.space.sm,
  },
  fieldLabel: {
    color: theme.color.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: theme.color.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    color: theme.color.textPrimary,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
    fontSize: 14,
    minHeight: 44,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  errorText: {
    color: theme.color.red,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.space.xl,
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
  },
  textButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
  },
  textButtonPressed: {
    backgroundColor: theme.color.surfaceAlt,
  },
  textButtonText: {
    color: theme.color.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.xl,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: '#7A69EF',
  },
  primaryButtonText: {
    color: theme.color.bgBase,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
