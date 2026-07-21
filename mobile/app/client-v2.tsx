import ClientCenterContainerV2 from "../components/client-v2/ClientCenterContainerV2";

export default function ClientV2Preview() {
  return (
    <ClientCenterContainerV2
      header={{
        title: "Client Command Center",
        subtitle: "Royal Cosmos client intelligence",
        liveStatusLabel: "Live",
        liveStatusTone: "active",
      }}
      kpis={[]}
      clients={[]}
      listState="loading"
      searchValue=""
      onSearchChange={() => {}}
      filters={[]}
      activeFilterKey="all"
      onFilterChange={() => {}}
      createForm={{
        values: {
          fullName: "",
          phone: "",
          email: "",
          notes: "",
        },
        onChangeField: () => {},
        onCreate: () => {},
      }}
      detailForm={{
        values: {
          name: "",
          phone: "",
          email: "",
          notes: "",
          status: "active",
        },
        onChangeField: () => {},
        onSave: () => {},
      }}
      onDeleteClient={() => {}}
    />
  );
}
