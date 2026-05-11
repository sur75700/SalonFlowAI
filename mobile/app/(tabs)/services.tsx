import React, { useMemo, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import DevLoginCard from "../../components/auth/DevLoginCard";
import SessionStatusBanner from "../../components/auth/SessionStatusBanner";
import { useLogout } from "../../hooks/useLogout";
import SessionActionBar from "../../components/auth/SessionActionBar";
import ActionButton from "../../components/dashboard/ActionButton";
import SectionCard from "../../components/dashboard/SectionCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/Toast";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import { useFormState } from "../../hooks/useFormState";
import { useServicesData } from "../../hooks/useResourceData";
import { useServiceMutations } from "../../hooks/useMutations";
import { useSession } from "../../hooks/useSession";
import type { ServiceItem } from "../../types/models";
import { money } from "../../utils/money";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { APP_PREFERENCES } from "../../lib/config/appPreferences";
import type { AppCurrency } from "../../lib/i18n/types";
import { t } from "../../lib/i18n";

const emptyCreateForm = {
  name: "",
  duration_minutes: "",
  price: "",
  currency: APP_PREFERENCES.defaultCurrency,
};

const emptyEditForm = {
  name: "",
  duration_minutes: "",
  price: "",
  currency: APP_PREFERENCES.defaultCurrency,
  is_active: "true",
};

function ServicesSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LoadingSkeleton height={12} width={110} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={36} width={160} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="95%" style={{ marginBottom: 8 }} />
          <LoadingSkeleton height={14} width="80%" />
        </View>

        <View style={styles.sectionCard}>
          <LoadingSkeleton height={20} width={150} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="76%" style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 14 }} />
          <LoadingSkeleton height={46} width={170} />
        </View>

        <View style={styles.sectionCard}>
          <LoadingSkeleton height={20} width={170} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="85%" style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 14 }} />
          <LoadingSkeleton height={122} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={122} width="100%" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizeCurrency(value: string | null | undefined): AppCurrency {
  if (value === "USD" || value === "EUR" || value === "AMD") return value;
  return APP_PREFERENCES.defaultCurrency;
}

export default function ServicesScreen() {
  const { locale, currency: preferredCurrency } = useAppPreferences();
  const { token, booting, clearToken, sessionEmail } = useSession();
  const { logout, loggingOut } = useLogout();
  const { showToast } = useToast();
  const { confirm } = useConfirmAction();

  const {
    services,
    setServices,
    loading,
    refreshing,
    error,
    refresh,
    reload,
  } = useServicesData(token, clearToken);

  const {
    error: mutationError,
    loading: mutationLoading,
    workingId,
    setError: setMutationError,
    createService,
    updateService,
    deleteService,
  } = useServiceMutations({
    token,
    clearToken,
    onSuccessReload: reload,
    onAuthFailure: () => {
      setServices([]);
    },
  });

  const [serviceSearch, setServiceSearch] = useState("");
  const [editingServiceId, setEditingServiceId] = useState("");

  const createForm = useFormState(emptyCreateForm);
  const editForm = useFormState(emptyEditForm);

  const screenError = mutationError || error;

  const handleCreateService = async () => {
    if (
      !createForm.values.name.trim() ||
      !createForm.values.duration_minutes.trim() ||
      !createForm.values.price.trim()
    ) {
      setMutationError(t("common.serviceFieldsRequired", locale));
      showToast(t("common.serviceFieldsRequired", locale), "error");
      return;
    }

    const duration = Number(createForm.values.duration_minutes);
    const price = Number(createForm.values.price);

    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(price) || price < 0) {
      setMutationError(t("common.serviceNumericInvalid", locale));
      showToast(t("common.serviceNumericInvalid", locale), "error");
      return;
    }

    const ok = await createService({
      name: createForm.values.name.trim(),
      duration_minutes: duration,
      price: price,
      currency: createForm.values.currency.trim() || "AMD",
      is_active: true,
    });

    if (ok) {
      createForm.reset();
      showToast(t("common.serviceAddedSuccessfully", locale), "success");
    }
  };

  const startEditService = (service: ServiceItem) => {
    setEditingServiceId(service.id);
    editForm.fill({
      name: service.name || "",
      duration_minutes: String(service.duration_minutes ?? ""),
      price: String(service.price ?? ""),
      currency: normalizeCurrency(service.currency || preferredCurrency),
      is_active: service.is_active ? "true" : "false",
    });
    setMutationError("");
  };

  const cancelEditService = () => {
    setEditingServiceId("");
    editForm.reset();
    setMutationError("");
  };

  const handleSaveService = async (serviceId: string) => {
    if (
      !editForm.values.name.trim() ||
      !editForm.values.duration_minutes.trim() ||
      !editForm.values.price.trim()
    ) {
      setMutationError(t("common.serviceFieldsRequired", locale));
      showToast(t("common.serviceFieldsRequired", locale), "error");
      return;
    }

    const duration = Number(editForm.values.duration_minutes);
    const price = Number(editForm.values.price);

    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(price) || price < 0) {
      setMutationError(t("common.serviceNumericInvalid", locale));
      showToast(t("common.serviceNumericInvalid", locale), "error");
      return;
    }

    const ok = await updateService(serviceId, {
      name: editForm.values.name.trim(),
      duration_minutes: duration,
      price: price,
      currency: editForm.values.currency.trim() || "AMD",
      is_active: editForm.values.is_active === "true",
    });

    if (ok) {
      cancelEditService();
      showToast(t("common.serviceUpdatedSuccessfully", locale), "success");
    }
  };

  const handleDeleteService = async (service: ServiceItem) => {
    const approved = await confirm(
      t("common.deleteServiceTitle", locale),
        t("common.deleteServiceConfirmMessage", locale)
    );

    if (!approved) return;

    const ok = await deleteService(service.id);

    if (ok) {
      showToast(t("common.serviceDeletedSuccessfully", locale), "success");
    }
  };

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return services;

    return services.filter(
      (item) =>
        (item.name || "").toLowerCase().includes(q) ||
        String(item.price || "").toLowerCase().includes(q) ||
        (item.currency || "").toLowerCase().includes(q) ||
        String(item.duration_minutes || "").toLowerCase().includes(q)
    );
  }, [services, serviceSearch]);

  if (booting || loading) {
    return <ServicesSkeleton />;
  }

  if (!token) {
    return (
      <DevLoginCard
        title={t("common.serviceCatalog", locale)}
        subtitle={t("common.sessionUnavailableSubtitle", locale)}
      />
    );
  }

  const noServicesAtAll = services.length === 0;
  const noSearchMatches = services.length > 0 && filteredServices.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroOverline}>SALONFLOW AI</Text>
          <Text style={styles.heroTitle}>{t("common.serviceCatalog", locale)}</Text>
          <Text style={styles.heroText}>
            {t("common.serviceCatalogHeroSubtitle", locale)}
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title={t("common.catalogReady", locale)}
          subtitle={t("common.servicesSessionReadySubtitle", locale)}
        />

        {screenError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{screenError}</Text>
          </View>
        ) : null}

        <SectionCard
          title={t("common.createServiceEntry", locale)}
          subtitle={t("common.createServiceEntrySubtitle", locale)}
        >
          <TextInput
            style={styles.input}
            placeholder={t("common.serviceName", locale)}
            placeholderTextColor="#9a92a3"
            value={createForm.values.name}
            onChangeText={(value) => createForm.setField("name", value)}
          />
          <TextInput
            style={styles.input}
            placeholder={t("common.durationInMinutes", locale)}
            placeholderTextColor="#9a92a3"
            value={createForm.values.duration_minutes}
            onChangeText={(value) =>
              createForm.setField("duration_minutes", value)
            }
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder={t("common.price", locale)}
            placeholderTextColor="#9a92a3"
            value={createForm.values.price}
            onChangeText={(value) => createForm.setField("price", value)}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder={t("common.currency", locale)}
            placeholderTextColor="#9a92a3"
            value={createForm.values.currency}
            onChangeText={(value) => createForm.setField("currency", normalizeCurrency(value))}
            autoCapitalize="characters"
          />

          <ActionButton
            title={mutationLoading ? t("common.creating", locale) : t("common.createService", locale)}
            onPress={handleCreateService}
            disabled={mutationLoading}
            tone="success"
          />
        </SectionCard>

        <SectionCard
          title={t("common.catalogSnapshot", locale)}
          subtitle={t("common.catalogSnapshotSubtitle", locale)}
        >
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{services.length}</Text>
              <Text style={styles.summaryLabel}>{t("common.total", locale)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{services.filter((item) => item.is_active).length}</Text>
              <Text style={styles.summaryLabel}>{t("common.active", locale)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{services.filter((item) => !item.is_active).length}</Text>
              <Text style={styles.summaryLabel}>{t("common.inactive", locale)}</Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard
          title={t("common.serviceCatalog", locale)}
          subtitle={t("common.serviceCatalogSubtitle", locale)}
        >
          <TextInput
            style={styles.searchInput}
            placeholder={t("common.searchServices", locale)}
            placeholderTextColor="#9a92a3"
            value={serviceSearch}
            onChangeText={setServiceSearch}
          />

          {noServicesAtAll ? (
            <EmptyState
              title={t("common.noServicesYet", locale)}
              subtitle={t("common.noServicesYetSubtitle", locale)}
            />
          ) : noSearchMatches ? (
            <EmptyState
              title={t("common.noMatchingServices", locale)}
              subtitle={t("common.noMatchingServicesSubtitle", locale)}
            />
          ) : (
            filteredServices.map((service) => (
              <View key={service.id} style={styles.listCard}>
                {editingServiceId === service.id ? (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder={t("common.serviceName", locale)}
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.name}
                      onChangeText={(value) => editForm.setField("name", value)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={t("common.durationInMinutes", locale)}
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.duration_minutes}
                      onChangeText={(value) =>
                        editForm.setField("duration_minutes", value)
                      }
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={t("common.price", locale)}
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.price}
                      onChangeText={(value) => editForm.setField("price", value)}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={t("common.currency", locale)}
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.currency}
                      onChangeText={(value) =>
                        editForm.setField("currency", normalizeCurrency(value))
                      }
                      autoCapitalize="characters"
                    />

                    <View style={styles.pickerWrap}>
                      <Picker
                        selectedValue={editForm.values.is_active}
                        onValueChange={(value) =>
                          editForm.setField("is_active", String(value))
                        }
                        dropdownIconColor="#f5d27a"
                        style={styles.picker}
                      >
                        <Picker.Item label={t("common.active", locale)} value="true" />
                        <Picker.Item label={t("common.inactive", locale)} value="false" />
                      </Picker>
                    </View>

                    <View style={styles.actionRow}>
                      <ActionButton
                        title={workingId === service.id ? t("common.working", locale) : t("common.save", locale)}
                        onPress={() => handleSaveService(service.id)}
                        disabled={workingId === service.id}
                        tone="success"
                      />
                      <ActionButton title={t("common.cancel", locale)} onPress={cancelEditService} />
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.cardTitle}>{service.name}</Text>
                    <Text style={styles.item}>
                      Duration: {service.duration_minutes} min
                    </Text>
                    <Text style={styles.item}>
                      Price: {money(service.price, normalizeCurrency(service.currency))}
                    </Text>
                    <View style={{ marginTop: 6, marginBottom: 6 }}>
                      <StatusBadge status={service.is_active ? "active" : "inactive"} />
                    </View>

                    <View style={styles.actionRow}>
                      <ActionButton
                        title={t("common.edit", locale)}
                        onPress={() => startEditService(service)}
                        tone="success"
                      />
                      <ActionButton
                        title={workingId === service.id ? t("common.working", locale) : t("common.delete", locale)}
                        onPress={() => handleDeleteService(service)}
                        disabled={workingId === service.id}
                        tone="danger"
                      />
                    </View>
                  </>
                )}
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040508" },
  content: { padding: 22, paddingBottom: 40 },
  hero: {
    backgroundColor: "#0a0b10",
    borderRadius: 30,
    padding: 26,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#27212c",
  },
  heroOverline: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroText: {
    color: "#b7adbf",
    fontSize: 15,
    lineHeight: 23,
  },
  sectionCard: {
    backgroundColor: "#0f1118",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#241f27",
    marginBottom: 18,
  },
  searchInput: {
    backgroundColor: "#11131a",
    color: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2e2631",
  },
  input: {
    backgroundColor: "#11131a",
    color: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2e2631",
  },
  pickerWrap: {
    backgroundColor: "#11131a",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2e2631",
    overflow: "hidden",
  },
  picker: {
    color: "#ffffff",
    backgroundColor: "#11131a",
  },
  listCard: {
    backgroundColor: "#0f1118",
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#241f27",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  item: {
    color: "#ece7ef",
    fontSize: 14,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },
  errorBox: {
    backgroundColor: "#301218",
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#5a232e",
  },
  errorText: {
    color: "#ffcad3",
    fontSize: 14,
  },


  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  summaryCard: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 160,
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#2a3140",
    borderRadius: 16,
    padding: 14,
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  summaryLabel: {
    color: "#c9c2cf",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
