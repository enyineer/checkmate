import {
  useApi,
  wrapInSuspense,
  permissionApiRef,
} from "@checkmate/frontend-api";
import { healthCheckApiRef } from "../api";
import { healthcheckRoutes } from "@checkmate/healthcheck-common";
import { resolveRoute } from "@checkmate/common";
import {
  PageLayout,
  usePagination,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  BackLink,
} from "@checkmate/ui";
import { useParams } from "react-router-dom";
import {
  HealthCheckRunsTable,
  type HealthCheckRunDetailed,
} from "../components/HealthCheckRunsTable";

const HealthCheckHistoryDetailPageContent = () => {
  const { systemId, configurationId } = useParams<{
    systemId: string;
    configurationId: string;
  }>();

  const api = useApi(healthCheckApiRef);
  const permissionApi = useApi(permissionApiRef);
  const { allowed: canManage, loading: permissionLoading } =
    permissionApi.useResourcePermission("healthcheck", "manage");

  const {
    items: runs,
    loading,
    pagination,
  } = usePagination({
    fetchFn: (params: { limit: number; offset: number }) =>
      api.getDetailedHistory({
        systemId,
        configurationId,
        limit: params.limit,
        offset: params.offset,
      }),
    getItems: (response) => response.runs as HealthCheckRunDetailed[],
    getTotal: (response) => response.total,
    defaultLimit: 20,
  });

  return (
    <PageLayout
      title="Health Check Run History"
      subtitle={`System: ${systemId} • Configuration: ${configurationId?.slice(
        0,
        8
      )}...`}
      loading={permissionLoading}
      allowed={canManage}
    >
      <BackLink to={resolveRoute(healthcheckRoutes.routes.history)}>
        Back to All History
      </BackLink>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <HealthCheckRunsTable
            runs={runs}
            loading={loading}
            emptyMessage="No health check runs found for this configuration."
            pagination={pagination}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export const HealthCheckHistoryDetailPage = wrapInSuspense(
  HealthCheckHistoryDetailPageContent
);
