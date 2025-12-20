import {
  createFrontendPlugin,
  discoveryApiRef,
  DiscoveryApi,
} from "@checkmate/frontend-api";
import { healthCheckApiRef, HealthCheckClient } from "./api";
import { HealthCheckConfigPage } from "./pages/HealthCheckConfigPage";

export default createFrontendPlugin({
  name: "healthcheck-frontend",
  routes: [
    {
      path: "/healthcheck",
      element: <HealthCheckConfigPage />,
      title: "Health Checks",
    },
  ],
  apis: [
    {
      ref: healthCheckApiRef,
      factory: (deps) => {
        const discoveryApi = deps.get(discoveryApiRef) as DiscoveryApi;
        return new HealthCheckClient(discoveryApi);
      },
    },
  ],
});
