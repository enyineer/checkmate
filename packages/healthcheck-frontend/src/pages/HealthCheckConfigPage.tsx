import { useEffect, useState } from "react";
import {
  useApi,
  wrapInSuspense,
  permissionApiRef,
} from "@checkmate/frontend-api";
import { healthCheckApiRef } from "../api";
import {
  HealthCheckConfiguration,
  HealthCheckStrategyDto,
  CreateHealthCheckConfiguration,
} from "@checkmate/healthcheck-common";
import { HealthCheckList } from "../components/HealthCheckList";
import { HealthCheckEditor } from "../components/HealthCheckEditor";
import { Button, ConfirmationModal, PageLayout } from "@checkmate/ui";
import { Plus } from "lucide-react";

const HealthCheckConfigPageContent = () => {
  const api = useApi(healthCheckApiRef);
  const permissionApi = useApi(permissionApiRef);
  const { allowed: canRead, loading: permissionLoading } =
    permissionApi.useResourcePermission("healthcheck", "read");

  const [configurations, setConfigurations] = useState<
    HealthCheckConfiguration[]
  >([]);
  const [strategies, setStrategies] = useState<HealthCheckStrategyDto[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<
    HealthCheckConfiguration | undefined
  >();

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    const [configs, strats] = await Promise.all([
      api.getConfigurations(),
      api.getStrategies(),
    ]);
    setConfigurations(configs);
    setStrategies(strats);
  };

  useEffect(() => {
    fetchData();
  }, [api]);

  const handleCreate = () => {
    setEditingConfig(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (config: HealthCheckConfiguration) => {
    setEditingConfig(config);
    setIsEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    setIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteConfiguration(idToDelete);
      await fetchData();
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setIdToDelete(undefined);
    }
  };

  const handleSave = async (data: CreateHealthCheckConfiguration) => {
    await (editingConfig
      ? api.updateConfiguration({ id: editingConfig.id, body: data })
      : api.createConfiguration(data));
    setIsEditorOpen(false);
    await fetchData();
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingConfig(undefined);
  };

  return (
    <PageLayout
      title="Health Checks"
      subtitle="Manage health check configurations"
      loading={permissionLoading}
      allowed={canRead}
      actions={
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create Check
        </Button>
      }
    >
      <HealthCheckList
        configurations={configurations}
        strategies={strategies}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <HealthCheckEditor
        open={isEditorOpen}
        strategies={strategies}
        initialData={editingConfig}
        onSave={handleSave}
        onCancel={handleEditorClose}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Health Check"
        message="Are you sure you want to delete this health check configuration? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </PageLayout>
  );
};

export const HealthCheckConfigPage = wrapInSuspense(
  HealthCheckConfigPageContent
);
