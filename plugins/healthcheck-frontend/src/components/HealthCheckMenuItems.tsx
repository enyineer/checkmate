import React from "react";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { useApi, permissionApiRef } from "@checkmate/frontend-api";
import { DropdownMenuItem } from "@checkmate/ui";
import { permissions } from "@checkmate/healthcheck-common";

export const HealthCheckMenuItems = () => {
  const permissionApi = useApi(permissionApiRef);
  const { allowed: canRead, loading } = permissionApi.usePermission(
    permissions.healthCheckRead.id
  );

  if (loading || !canRead) {
    return <React.Fragment />;
  }

  return (
    <Link to="/healthcheck/config">
      <DropdownMenuItem icon={<Activity className="w-4 h-4" />}>
        Health Checks
      </DropdownMenuItem>
    </Link>
  );
};
