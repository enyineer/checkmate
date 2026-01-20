import React from "react";
import { useApi, loggerApiRef } from "@checkstack/frontend-api";
import { PageLayout } from "@checkstack/ui";
import { Layers } from "lucide-react";

export const CatalogPage = () => {
  const logger = useApi(loggerApiRef);

  React.useEffect(() => {
    logger.info("Catalog Page loaded");
  }, [logger]);

  return (
    <PageLayout title="Catalog" icon={Layers}>
      <p className="text-muted-foreground">Welcome to the Service Catalog.</p>
    </PageLayout>
  );
};
