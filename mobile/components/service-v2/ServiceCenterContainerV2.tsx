import React, { useMemo, useState } from "react";

import DevLoginCard from "../auth/DevLoginCard";
import ServiceCenterCompositionV2, {
  ServiceFilterKey,
  ServiceFormErrorsV2,
  ServiceFormValuesV2,
  ServiceKpiV2,
  ServiceMetricV2,
} from "./ServiceCenterCompositionV2";

import { useConfirmAction } from "../../hooks/useConfirmAction";
import { useServiceMutations } from "../../hooks/useMutations";
import {
  useAppointmentsData,
  useServicesData,
} from "../../hooks/useResourceData";
import { useSession } from "../../hooks/useSession";
import { useToast } from "../ui/Toast";
import { useAppPreferences } from "../../hooks/useAppPreferences";

import { APP_PREFERENCES } from "../../lib/config/appPreferences";
import { t } from "../../lib/i18n";
import type { AppCurrency } from "../../lib/i18n/types";
import type { ServiceItem } from "../../types/models";
import { money } from "../../utils/money";

function normalizeCurrency(
  value: string | null | undefined
): AppCurrency {
  if (value === "USD" || value === "EUR" || value === "AMD") {
    return value;
  }

  return APP_PREFERENCES.defaultCurrency;
}

function emptyForm(currency: AppCurrency): ServiceFormValuesV2 {
  return {
    name: "",
    duration_minutes: "",
    price: "",
    currency,
    is_active: true,
  };
}

export default function ServiceCenterContainerV2() {
  const { locale, currency: preferredCurrency } =
    useAppPreferences();

  const {
    token,
    booting,
    clearToken,
  } = useSession();

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

  const appointmentsData = useAppointmentsData(
    token,
    clearToken
  );

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

  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<ServiceFilterKey>("all");

  const [createVisible, setCreateVisible] = useState(false);
  const [createValues, setCreateValues] =
    useState<ServiceFormValuesV2>(() =>
      emptyForm(preferredCurrency)
    );
  const [createErrors, setCreateErrors] =
    useState<ServiceFormErrorsV2>({});

  const [selectedServiceId, setSelectedServiceId] =
    useState<string | null>(null);
  const [detailMode, setDetailMode] =
    useState<"view" | "edit">("view");
  const [editValues, setEditValues] =
    useState<ServiceFormValuesV2>(() =>
      emptyForm(preferredCurrency)
    );
  const [editErrors, setEditErrors] =
    useState<ServiceFormErrorsV2>({});

  const selectedService = useMemo(
    () =>
      services.find(
        (service) => service.id === selectedServiceId
      ) ?? null,
    [selectedServiceId, services]
  );

  const activeServices = useMemo(
    () => services.filter((service) => service.is_active),
    [services]
  );

  const inactiveServices = useMemo(
    () => services.filter((service) => !service.is_active),
    [services]
  );

  const averageDuration = useMemo(() => {
    if (services.length === 0) {
      return 0;
    }

    return Math.round(
      services.reduce(
        (total, service) =>
          total + Number(service.duration_minutes || 0),
        0
      ) / services.length
    );
  }, [services]);

  const serviceMetrics = useMemo<
    Record<string, ServiceMetricV2>
  >(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekStart = now - 7 * dayMs;
    const fourWeekStart = now - 28 * dayMs;

    const aggregates = new Map<
      string,
      {
        bookingsWeek: number;
        revenueWeek: number;
        demandCount: number;
        trend: number[];
      }
    >();

    services.forEach((service) => {
      aggregates.set(service.id, {
        bookingsWeek: 0,
        revenueWeek: 0,
        demandCount: 0,
        trend: [0, 0, 0, 0],
      });
    });

    appointmentsData.appointments.forEach(
      (appointment) => {
        const serviceId = appointment.service_id;

        if (!serviceId) {
          return;
        }

        const aggregate = aggregates.get(serviceId);

        if (!aggregate) {
          return;
        }

        const timestamp = new Date(
          appointment.starts_at
        ).getTime();

        if (
          !Number.isFinite(timestamp) ||
          timestamp > now
        ) {
          return;
        }

        const status = String(
          appointment.status || ""
        ).toLowerCase();

        if (status === "cancelled") {
          return;
        }

        if (timestamp >= weekStart) {
          aggregate.bookingsWeek += 1;

          if (status === "completed") {
            aggregate.revenueWeek += Number(
              appointment.price_snapshot || 0
            );
          }
        }

        if (timestamp >= fourWeekStart) {
          aggregate.demandCount += 1;

          const weeksAgo = Math.min(
            3,
            Math.floor(
              (now - timestamp) / (7 * dayMs)
            )
          );

          const trendIndex = 3 - weeksAgo;

          if (
            trendIndex >= 0 &&
            trendIndex < aggregate.trend.length
          ) {
            aggregate.trend[trendIndex] += 1;
          }
        }
      }
    );

    let popularServiceId: string | null = null;
    let highestDemand = 0;

    services.forEach((service) => {
      const demand =
        aggregates.get(service.id)?.demandCount ?? 0;

      if (demand > highestDemand) {
        highestDemand = demand;
        popularServiceId = service.id;
      }
    });

    const ready =
      !appointmentsData.loading &&
      !appointmentsData.error;

    return Object.fromEntries(
      services.map((service) => {
        const aggregate = aggregates.get(service.id) ?? {
          bookingsWeek: 0,
          revenueWeek: 0,
          demandCount: 0,
          trend: [0, 0, 0, 0],
        };

        const demandPercent =
          highestDemand > 0
            ? Math.round(
                (aggregate.demandCount /
                  highestDemand) *
                  100
              )
            : 0;

        return [
          service.id,
          {
            ready,
            bookingsWeek: aggregate.bookingsWeek,
            revenueWeekLabel: money(
              aggregate.revenueWeek,
              normalizeCurrency(
                service.currency ||
                  preferredCurrency
              )
            ),
            demandPercent,
            trend: aggregate.trend,
            popular:
              highestDemand > 0 &&
              service.id === popularServiceId,
          },
        ];
      })
    ) as Record<string, ServiceMetricV2>;
  }, [
    appointmentsData.appointments,
    appointmentsData.error,
    appointmentsData.loading,
    preferredCurrency,
    services,
  ]);

  const filteredServices = useMemo(() => {
    const query = searchValue.trim().toLocaleLowerCase();

    return services.filter((service) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "popular" &&
          Boolean(serviceMetrics[service.id]?.popular)) ||
        (activeFilter === "active" && service.is_active) ||
        (activeFilter === "inactive" && !service.is_active);

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        service.name,
        service.currency,
        String(service.price ?? ""),
        String(service.duration_minutes ?? ""),
      ].some((value) =>
        (value || "").toLocaleLowerCase().includes(query)
      );
    });
  }, [
    activeFilter,
    searchValue,
    serviceMetrics,
    services,
  ]);

  const kpis = useMemo<ServiceKpiV2[]>(
    () => [
      {
        label: t("Total", locale),
        value: String(services.length),
      },
      {
        label: t("Active", locale),
        value: String(activeServices.length),
      },
      {
        label: t("Inactive", locale),
        value: String(inactiveServices.length),
      },
      {
        label: t("Duration In Minutes", locale),
        value: String(averageDuration),
      },
    ],
    [
      activeServices.length,
      averageDuration,
      inactiveServices.length,
      locale,
      services.length,
    ]
  );

  const filters = useMemo(
    () => [
      {
        key: "all" as const,
        label: t("All", locale),
        count: services.length,
      },
      {
        key: "popular" as const,
        label: t("Popular", locale),
        count: services.filter((service) =>
          Boolean(serviceMetrics[service.id]?.popular)
        ).length,
      },
      {
        key: "active" as const,
        label: t("Active", locale),
        count: activeServices.length,
      },
      {
        key: "inactive" as const,
        label: t("Inactive", locale),
        count: inactiveServices.length,
      },
    ],
    [
      activeServices.length,
      inactiveServices.length,
      locale,
      serviceMetrics,
      services,
    ]
  );

  const validateForm = (
    values: ServiceFormValuesV2
  ): ServiceFormErrorsV2 => {
    const nextErrors: ServiceFormErrorsV2 = {};
    const requiredMessage = t(
      "Service Fields Required",
      locale
    );
    const numericMessage = t(
      "Service Numeric Invalid",
      locale
    );

    if (!values.name.trim()) {
      nextErrors.name = requiredMessage;
    }

    const duration = Number(values.duration_minutes);
    if (
      !values.duration_minutes.trim() ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      nextErrors.duration_minutes = numericMessage;
    }

    const price = Number(values.price);
    if (
      !values.price.trim() ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      nextErrors.price = numericMessage;
    }

    if (!values.currency.trim()) {
      nextErrors.currency = requiredMessage;
    }

    return nextErrors;
  };

  const handleCreateFieldChange = (
    field: keyof ServiceFormValuesV2,
    value: string | boolean
  ) => {
    setCreateValues((current) => ({
      ...current,
      [field]: value,
    }));

    setCreateErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleEditFieldChange = (
    field: keyof ServiceFormValuesV2,
    value: string | boolean
  ) => {
    setEditValues((current) => ({
      ...current,
      [field]: value,
    }));

    setEditErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleOpenCreate = () => {
    setCreateValues(emptyForm(preferredCurrency));
    setCreateErrors({});
    setMutationError("");
    setCreateVisible(true);
  };

  const handleCloseCreate = () => {
    if (mutationLoading) {
      return;
    }

    setCreateVisible(false);
    setCreateErrors({});
  };

  const handleCreate = async () => {
    const nextErrors = validateForm(createValues);

    if (Object.values(nextErrors).some(Boolean)) {
      setCreateErrors(nextErrors);
      return;
    }

    const created = await createService({
      name: createValues.name.trim(),
      duration_minutes: Number(
        createValues.duration_minutes
      ),
      price: Number(createValues.price),
      currency: normalizeCurrency(
        createValues.currency.trim().toUpperCase()
      ),
      is_active: createValues.is_active,
    });

    if (created) {
      setCreateVisible(false);
      setCreateValues(emptyForm(preferredCurrency));
      setCreateErrors({});

      showToast(
        t("Service Added Successfully", locale),
        "success"
      );
    }
  };

  const handleOpenService = (service: ServiceItem) => {
    setSelectedServiceId(service.id);
    setDetailMode("view");
    setEditErrors({});
    setMutationError("");

    setEditValues({
      name: service.name || "",
      duration_minutes: String(
        service.duration_minutes ?? ""
      ),
      price: String(service.price ?? ""),
      currency: normalizeCurrency(
        service.currency || preferredCurrency
      ),
      is_active: Boolean(service.is_active),
    });
  };

  const handleRequestEdit = () => {
    if (!selectedService) {
      return;
    }

    setEditValues({
      name: selectedService.name || "",
      duration_minutes: String(
        selectedService.duration_minutes ?? ""
      ),
      price: String(selectedService.price ?? ""),
      currency: normalizeCurrency(
        selectedService.currency || preferredCurrency
      ),
      is_active: Boolean(selectedService.is_active),
    });

    setEditErrors({});
    setDetailMode("edit");
  };

  const handleCancelEdit = () => {
    setEditErrors({});
    setDetailMode("view");
  };

  const handleCloseDetail = () => {
    if (mutationLoading) {
      return;
    }

    setSelectedServiceId(null);
    setDetailMode("view");
    setEditErrors({});
  };

  const handleSave = async () => {
    if (!selectedService) {
      return;
    }

    const nextErrors = validateForm(editValues);

    if (Object.values(nextErrors).some(Boolean)) {
      setEditErrors(nextErrors);
      return;
    }

    const updated = await updateService(
      selectedService.id,
      {
        name: editValues.name.trim(),
        duration_minutes: Number(
          editValues.duration_minutes
        ),
        price: Number(editValues.price),
        currency: normalizeCurrency(
          editValues.currency.trim().toUpperCase()
        ),
        is_active: editValues.is_active,
      }
    );

    if (updated) {
      setDetailMode("view");
      setEditErrors({});

      showToast(
        t("Service Updated Successfully", locale),
        "success"
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedService) {
      return;
    }

    const approved = await confirm(
      t("Delete Service Title", locale),
      t("DeleteServiceConfirmMessage", locale)
    );

    if (!approved) {
      return;
    }

    const deleted = await deleteService(
      selectedService.id
    );

    if (deleted) {
      setSelectedServiceId(null);
      setDetailMode("view");

      showToast(
        t("Service Deleted Successfully", locale),
        "success"
      );
    }
  };

  if (!booting && !token) {
    return (
      <DevLoginCard
        title={t("Service Catalog", locale)}
        subtitle={t(
          "Session Unavailable Subtitle",
          locale
        )}
      />
    );
  }

  const noServicesAtAll = services.length === 0;

  return (
    <ServiceCenterCompositionV2
      overline="SALONFLOW AI"
      title={t("Service Catalog", locale)}
      subtitle={t(
        "Service CatalogHeroSubtitle",
        locale
      )}
      labels={{
        addService: t("Create Service", locale),
        searchPlaceholder: t("Search Services", locale),
        retry: t("Retry", locale),
        serviceName: t("Service Name", locale),
        duration: t("Duration In Minutes", locale),
        price: t("Price", locale),
        currency: t("Currency", locale),
        active: t("Active", locale),
        inactive: t("Inactive", locale),
        edit: t("Edit", locale),
        delete: t("Delete", locale),
        save: t("Save", locale),
        cancel: t("Cancel", locale),
        close: t("Close", locale),
        create: t("Create Service", locale),
        creating: t("Creating", locale),
        working: t("Working", locale),
        popular: t("Popular", locale),
        bookingsWeek: t("Bookings / Week", locale),
        revenueWeek: t("Revenue / Week", locale),
        demand: t("Demand", locale),
        weeklyPerformance: t(
          "Weekly Performance",
          locale
        ),
        emptyTitle: noServicesAtAll
          ? t("No Services Yet", locale)
          : t("No Matching Services", locale),
        emptySubtitle: noServicesAtAll
          ? t("No Services Yet Subtitle", locale)
          : t("No Matching ServicesSubtitle", locale),
        errorTitle: t(
          "Service catalog needs attention",
          locale
        ),
        createTitle: t("Create Service", locale),
        createSubtitle: t(
          "Create ServiceEntrySubtitle",
          locale
        ),
      }}
      kpis={kpis}
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      services={filteredServices}
      serviceMetrics={serviceMetrics}
      formatPrice={(service) =>
        money(
          service.price,
          normalizeCurrency(
            service.currency || preferredCurrency
          )
        )
      }
      loading={booting || loading}
      refreshing={refreshing}
      error={mutationError || error}
      workingId={workingId}
      onRefresh={() => {
        void Promise.all([
          refresh(),
          appointmentsData.refresh(),
        ]);
      }}
      onRetry={() => {
        void Promise.all([
          reload(),
          appointmentsData.reload(),
        ]);
      }}
      onOpenCreate={handleOpenCreate}
      onOpenService={handleOpenService}
      createSheet={{
        visible: createVisible,
        values: createValues,
        errors: createErrors,
        loading: mutationLoading,
        onChangeField: handleCreateFieldChange,
        onSubmit: handleCreate,
        onClose: handleCloseCreate,
      }}
      detailSheet={{
        visible: selectedService !== null,
        service: selectedService,
        metrics: selectedService
          ? serviceMetrics[selectedService.id] ?? null
          : null,
        mode: detailMode,
        values: editValues,
        errors: editErrors,
        loading:
          mutationLoading ||
          workingId === selectedService?.id,
        priceLabel: selectedService
          ? money(
              selectedService.price,
              normalizeCurrency(
                selectedService.currency ||
                  preferredCurrency
              )
            )
          : "",
        onChangeField: handleEditFieldChange,
        onRequestEdit: handleRequestEdit,
        onSave: handleSave,
        onDelete: handleDelete,
        onCancelEdit: handleCancelEdit,
        onClose: handleCloseDetail,
      }}
    />
  );
}
