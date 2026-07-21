import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { ClientRecord, ClientStatus } from './ClientCardV3';

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

function getStatusPalette(status: ClientStatus) {
  switch (status) {
    case 'vip':
      return { fg: theme.color.gold, bg: theme.color.goldSoft };
    case 'active':
      return { fg: theme.color.green, bg: theme.color.greenSoft };
    case 'new':
      return { fg: theme.color.cyan, bg: theme.color.cyanSoft };
    case 'returning':
      return { fg: theme.color.blue, bg: theme.color.blueSoft };
    case 'inactive':
    default:
      return { fg: theme.color.textTertiary, bg: 'rgba(255,255,255,0.06)' };
  }
}

export interface ClientDetailFormValues {
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: ClientStatus;
}

export interface ClientDetailSheetV2Labels {
  nameField: string;
  namePlaceholder: string;
  phoneField: string;
  phonePlaceholder: string;
  emailField: string;
  emailPlaceholder: string;
  notesField: string;
  notesPlaceholder: string;
  lastVisitField: string;
  upcomingAppointmentField: string;
  visitCountField: string;
  lifetimeValueField: string;
  statusField: string;
  editAction: string;
  saveAction: string;
  cancelAction: string;
  closeAction: string;
  savingLabel: string;
  noUpcomingAppointment: string;
  noNotes: string;
}

export const DEFAULT_CLIENT_DETAIL_SHEET_LABELS: ClientDetailSheetV2Labels = {
  nameField: 'Full name',
  namePlaceholder: 'Client name',
  phoneField: 'Phone',
  phonePlaceholder: 'Add a phone number',
  emailField: 'Email',
  emailPlaceholder: 'Add an email address',
  notesField: 'Notes',
  notesPlaceholder: 'Add a note about this client',
  lastVisitField: 'Last visit',
  upcomingAppointmentField: 'Next appointment',
  visitCountField: 'Visits',
  lifetimeValueField: 'Lifetime value',
  statusField: 'Status',
  editAction: 'Edit',
  saveAction: 'Save changes',
  cancelAction: 'Cancel',
  closeAction: 'Close',
  savingLabel: 'Saving…',
  noUpcomingAppointment: 'None scheduled',
  noNotes: 'No notes yet',
};

export interface ClientDetailSheetV2Props {
  visible: boolean;
  mode: 'view' | 'edit';
  client: ClientRecord | null;
  formValues: ClientDetailFormValues;
  formErrors?: Partial<Record<keyof ClientDetailFormValues, string>>;
  statusOptions?: { key: ClientStatus; label: string }[];
  loading?: boolean;
  disabled?: boolean;
  labels?: Partial<ClientDetailSheetV2Labels>;
  onChangeField?: (field: keyof ClientDetailFormValues, value: string) => void;
  onRequestEdit?: () => void;
  onSave?: () => void;
  onCancelEdit?: () => void;
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

export default function ClientDetailSheetV2({
  visible,
  mode,
  client,
  formValues,
  formErrors,
  statusOptions = [],
  loading = false,
  disabled = false,
  labels,
  onChangeField,
  onRequestEdit,
  onSave,
  onCancelEdit,
  onClose,
}: ClientDetailSheetV2Props) {
  const t: ClientDetailSheetV2Labels = { ...DEFAULT_CLIENT_DETAIL_SHEET_LABELS, ...labels };
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const isEdit = mode === 'edit';
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {client ? client.name : ''}
            </Text>
            <View style={styles.headerActions}>
              {!isEdit && !!client && (
                <Pressable
                  onPress={interactive ? onRequestEdit : undefined}
                  disabled={!interactive}
                  accessibilityRole="button"
                  accessibilityLabel={t.editAction}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.editButton,
                    pressed && interactive && styles.editButtonPressed,
                  ]}
                >
                  <Text style={styles.editButtonText}>{t.editAction}</Text>
                </Pressable>
              )}
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
          </View>

          {!!client && (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              <View style={styles.identityRow}>
                <View
                  style={[
                    styles.avatar,
                    { borderColor: client.status === 'vip' ? theme.color.gold : theme.color.violet },
                  ]}
                >
                  <Text style={styles.avatarText}>{client.initials}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: theme.space.md }}>
                  {isEdit ? (
                    <>
                      <Text style={styles.sectionLabel}>{t.nameField}</Text>
                      <TextInput
                        value={formValues.name}
                        onChangeText={(value: string) => onChangeField?.('name', value)}
                        placeholder={t.namePlaceholder}
                        placeholderTextColor={theme.color.textTertiary}
                        editable={interactive}
                        style={styles.input}
                        accessibilityLabel={t.nameField}
                      />
                      {!!formErrors?.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
                    </>
                  ) : (
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusPalette(client.status).bg, alignSelf: 'flex-start' },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: getStatusPalette(client.status).fg }]}>
                        {client.statusLabel}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {isEdit && statusOptions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>{t.statusField}</Text>
                  <View style={styles.statusOptionsRow}>
                    {statusOptions.map((option) => {
                      const active = option.key === formValues.status;
                      const palette = getStatusPalette(option.key);
                      return (
                        <Pressable
                          key={option.key}
                          onPress={() => interactive && onChangeField?.('status', option.key)}
                          disabled={!interactive}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active, disabled: !interactive }}
                          accessibilityLabel={option.label}
                          style={({ pressed }: { pressed: boolean }) => [
                            styles.statusOption,
                            { borderColor: active ? palette.fg : theme.color.border },
                            active && { backgroundColor: palette.bg },
                            pressed && interactive && styles.statusOptionPressed,
                          ]}
                        >
                          <Text style={[styles.statusOptionText, active && { color: palette.fg }]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t.phoneField}</Text>
                {isEdit ? (
                  <>
                    <TextInput
                      value={formValues.phone}
                      onChangeText={(value: string) => onChangeField?.('phone', value)}
                      placeholder={t.phonePlaceholder}
                      placeholderTextColor={theme.color.textTertiary}
                      editable={interactive}
                      keyboardType="phone-pad"
                      style={styles.input}
                      accessibilityLabel={t.phoneField}
                    />
                    {!!formErrors?.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}
                  </>
                ) : (
                  <Text style={styles.sectionValue}>{client.phone || '—'}</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t.emailField}</Text>
                {isEdit ? (
                  <>
                    <TextInput
                      value={formValues.email}
                      onChangeText={(value: string) => onChangeField?.('email', value)}
                      placeholder={t.emailPlaceholder}
                      placeholderTextColor={theme.color.textTertiary}
                      editable={interactive}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                      accessibilityLabel={t.emailField}
                    />
                    {!!formErrors?.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
                  </>
                ) : (
                  <Text style={styles.sectionValue}>{client.email || '—'}</Text>
                )}
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>{t.lastVisitField}</Text>
                  <Text style={styles.statValue}>{client.lastVisitLabel || '—'}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>{t.upcomingAppointmentField}</Text>
                  <Text style={styles.statValue}>{client.upcomingAppointmentLabel || t.noUpcomingAppointment}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>{t.visitCountField}</Text>
                  <Text style={styles.statValue}>{client.visitCountLabel || '—'}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>{t.lifetimeValueField}</Text>
                  <Text style={styles.statValue}>{client.lifetimeValueLabel || '—'}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t.notesField}</Text>
                {isEdit ? (
                  <>
                    <TextInput
                      value={formValues.notes}
                      onChangeText={(value: string) => onChangeField?.('notes', value)}
                      placeholder={t.notesPlaceholder}
                      placeholderTextColor={theme.color.textTertiary}
                      editable={interactive}
                      multiline
                      numberOfLines={4}
                      style={[styles.input, styles.textArea]}
                      accessibilityLabel={t.notesField}
                    />
                    {!!formErrors?.notes && <Text style={styles.errorText}>{formErrors.notes}</Text>}
                  </>
                ) : (
                  <Text style={styles.notesValue}>{client.notes || client.notesPreview || t.noNotes}</Text>
                )}
              </View>
            </ScrollView>
          )}

          {isEdit && !!client && (
            <View style={styles.footer}>
              <Pressable
                onPress={interactive ? onCancelEdit : undefined}
                disabled={!interactive}
                accessibilityRole="button"
                accessibilityLabel={t.cancelAction}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.secondaryButton,
                  pressed && interactive && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>{t.cancelAction}</Text>
              </Pressable>
              <Pressable
                onPress={interactive ? onSave : undefined}
                disabled={!interactive}
                accessibilityRole="button"
                accessibilityLabel={loading ? t.savingLabel : t.saveAction}
                accessibilityState={{ disabled: !interactive, busy: loading }}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.primaryButton,
                  pressed && interactive && styles.primaryButtonPressed,
                  !interactive && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.primaryButtonText}>{loading ? t.savingLabel : t.saveAction}</Text>
              </Pressable>
            </View>
          )}
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
    width: 420,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border,
  },
  headerTitle: {
    color: theme.color.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: theme.space.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
  },
  editButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonPressed: {
    backgroundColor: theme.color.violetSoft,
  },
  editButtonText: {
    color: theme.color.violet,
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -theme.space.md,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: theme.space.xl,
    gap: theme.space.xl,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surfaceAlt,
  },
  avatarText: {
    color: theme.color.textPrimary,
    fontWeight: '700',
    fontSize: 17,
  },
  statusBadge: {
    paddingHorizontal: theme.space.md,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  section: {
    gap: theme.space.sm,
  },
  sectionLabel: {
    color: theme.color.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionValue: {
    color: theme.color.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  notesValue: {
    color: theme.color.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  statChip: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: theme.color.surfaceAlt,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
  },
  statLabel: {
    color: theme.color.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    color: theme.color.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  statusOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  statusOption: {
    minHeight: 44,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionPressed: {
    opacity: 0.8,
  },
  statusOptionText: {
    color: theme.color.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.space.md,
    padding: theme.space.xl,
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: theme.color.surfaceAlt,
  },
  secondaryButtonText: {
    color: theme.color.textPrimary,
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
