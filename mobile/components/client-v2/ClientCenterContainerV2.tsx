import { useCallback, useMemo, useState } from 'react';
import ClientCenterCompositionV2 from './ClientCenterCompositionV2';
import { ClientRecord, ClientStatus, ClientCardLayout, ClientCardV3Labels } from './ClientCardV3';
import { ClientListState, ClientListSectionV2Labels } from './ClientListSectionV2';
import { ClientSummaryKpi } from './ClientSummaryStripV2';
import {
  ClientFilterKey,
  ClientFilterOption,
  ClientSearchFiltersV2Labels,
} from './ClientSearchFiltersV2';
import { LiveStatusTone } from './ClientCommandHeaderV2';
import { ClientDetailFormValues, ClientDetailSheetV2Labels } from './ClientDetailSheetV2';
import { CreateClientFormValues, CreateClientSheetV2Labels } from './CreateClientSheetV2';

export interface ClientCenterHeaderContent {
  overline?: string;
  title: string;
  subtitle?: string;
  liveStatusLabel?: string;
  liveStatusTone?: LiveStatusTone;
  createClientLabel?: string;
  importLabel?: string;
  onImport?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface ClientCenterCreateForm {
  values: CreateClientFormValues;
  errors?: Partial<Record<keyof CreateClientFormValues, string>>;
  loading?: boolean;
  disabled?: boolean;
  onChangeField: (field: keyof CreateClientFormValues, value: string) => void;
  onCreate: () => void;
  onReset?: () => void;
}

export interface ClientCenterDetailForm {
  values: ClientDetailFormValues;
  errors?: Partial<Record<keyof ClientDetailFormValues, string>>;
  loading?: boolean;
  disabled?: boolean;
  statusOptions?: { key: ClientStatus; label: string }[];
  onChangeField: (field: keyof ClientDetailFormValues, value: string) => void;
  onSave: () => void;
}

export interface ClientCenterLabelOverrides {
  card?: Partial<ClientCardV3Labels>;
  list?: Partial<ClientListSectionV2Labels>;
  searchFilters?: Partial<ClientSearchFiltersV2Labels>;
  detailSheet?: Partial<ClientDetailSheetV2Labels>;
  createSheet?: Partial<CreateClientSheetV2Labels>;
}

export interface ClientCenterContainerV2Props {
  header: ClientCenterHeaderContent;

  kpis: ClientSummaryKpi[];
  summaryLoading?: boolean;

  clients: ClientRecord[];
  listState: ClientListState;
  skeletonCount?: number;
  columns?: number;
  cardLayout?: ClientCardLayout;
  loadingClientIds?: string[];
  disabledClientIds?: string[];

  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: ClientFilterOption[];
  activeFilterKey: ClientFilterKey;
  onFilterChange: (key: ClientFilterKey) => void;
  searchFiltersDisabled?: boolean;

  createForm: ClientCenterCreateForm;
  detailForm: ClientCenterDetailForm;

  onDeleteClient: (id: string) => void;
  onEmptyStateAction?: () => void;
  onErrorAction?: () => void;

  labels?: ClientCenterLabelOverrides;
}

export default function ClientCenterContainerV2({
  header,
  kpis,
  summaryLoading = false,
  clients,
  listState,
  skeletonCount,
  columns,
  cardLayout,
  loadingClientIds,
  disabledClientIds,
  searchValue,
  onSearchChange,
  filters,
  activeFilterKey,
  onFilterChange,
  searchFiltersDisabled = false,
  createForm,
  detailForm,
  onDeleteClient,
  onEmptyStateAction,
  onErrorAction,
  labels,
}: ClientCenterContainerV2Props) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit'>('view');
  const [isCreateSheetOpen, setCreateSheetOpen] = useState(false);

  const selectedClient = useMemo<ClientRecord | null>(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  const handleSelectClient = useCallback((id: string) => {
    setSelectedClientId(id);
    setDetailMode('view');
  }, []);

  const handleEditClient = useCallback((id: string) => {
    setSelectedClientId(id);
    setDetailMode('edit');
  }, []);

  const handleRequestEdit = useCallback(() => setDetailMode('edit'), []);
  const handleCancelEdit = useCallback(() => setDetailMode('view'), []);

  const handleCloseDetailSheet = useCallback(() => {
    setSelectedClientId(null);
    setDetailMode('view');
  }, []);

  const handleOpenCreateSheet = useCallback(() => setCreateSheetOpen(true), []);
  const handleCloseCreateSheet = useCallback(() => setCreateSheetOpen(false), []);

  return (
    <ClientCenterCompositionV2
      header={{
        overline: header.overline,
        title: header.title,
        subtitle: header.subtitle,
        liveStatusLabel: header.liveStatusLabel,
        liveStatusTone: header.liveStatusTone,
        createClientLabel: header.createClientLabel,
        importLabel: header.importLabel,
        onImport: header.onImport,
        disabled: header.disabled,
        loading: header.loading,
        onCreateClient: handleOpenCreateSheet,
      }}
      summary={{
        kpis,
        loading: summaryLoading,
      }}
      searchFilters={{
        searchValue,
        onSearchChange,
        filters,
        activeFilterKey,
        onFilterChange,
        disabled: searchFiltersDisabled,
        labels: labels?.searchFilters,
      }}
      list={{
        clients,
        state: listState,
        skeletonCount,
        columns,
        cardLayout,
        selectedClientId,
        loadingClientIds,
        disabledClientIds,
        cardLabels: labels?.card,
        labels: labels?.list,
        onSelectClient: handleSelectClient,
        onEditClient: handleEditClient,
        onDeleteClient,
        onEmptyStateAction,
        onErrorAction,
      }}
      detailSheet={{
        visible: selectedClient !== null,
        mode: detailMode,
        client: selectedClient,
        formValues: detailForm.values,
        formErrors: detailForm.errors,
        loading: detailForm.loading,
        disabled: detailForm.disabled,
        statusOptions: detailForm.statusOptions,
        labels: labels?.detailSheet,
        onChangeField: detailForm.onChangeField,
        onRequestEdit: handleRequestEdit,
        onSave: detailForm.onSave,
        onCancelEdit: handleCancelEdit,
        onClose: handleCloseDetailSheet,
      }}
      createSheet={{
        visible: isCreateSheetOpen,
        values: createForm.values,
        errors: createForm.errors,
        loading: createForm.loading,
        disabled: createForm.disabled,
        labels: labels?.createSheet,
        onChangeField: createForm.onChangeField,
        onCreate: createForm.onCreate,
        onReset: createForm.onReset,
        onClose: handleCloseCreateSheet,
      }}
    />
  );
}
