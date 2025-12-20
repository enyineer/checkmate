import React, { useEffect, useState } from "react";
import { useApi } from "@checkmate/frontend-api";
import { catalogApiRef, Group } from "@checkmate/catalog-frontend-plugin";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  SectionHeader,
  StatusCard,
  EmptyState,
  LoadingSpinner,
} from "@checkmate/ui";
import { LayoutGrid, Info, Server, Activity } from "lucide-react";

export const Dashboard: React.FC = () => {
  const catalogApi = useApi(catalogApiRef);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogApi
      .getGroups()
      .then(setGroups)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [catalogApi]);

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (groups.length === 0) {
      return (
        <EmptyState
          title="No system groups found"
          description="Visit the Catalog to create your first group."
          icon={<Server className="w-12 h-12" />}
        />
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <Card
            key={group.id}
            className="group hover:shadow-md transition-all duration-200 border-gray-100"
          >
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {group.name}
                </CardTitle>
                <Server className="w-4 h-4 text-gray-400" />
              </div>
              <CardDescription className="text-xs mt-1">
                ID: {group.id}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section>
        <SectionHeader
          title="Site Information"
          icon={<Info className="w-5 h-5" />}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatusCard
            variant="gradient"
            title="Instance Status"
            value="Operational"
            description="Checkmate Core v0.0.1"
            icon={<Activity className="w-4 h-4 animate-pulse" />}
          />

          <StatusCard
            title="Region"
            value="eu-central-1"
            description="Frankfurt, Germany"
          />

          <StatusCard
            title="Environment"
            value="Production"
            description="Managed by Checkmate"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          title="System Groups"
          icon={<LayoutGrid className="w-5 h-5" />}
        />
        {renderContent()}
      </section>
    </div>
  );
};
