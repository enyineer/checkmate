import { createFrontendPlugin } from "@checkmate-monitor/frontend-api";
import {
  registerProviderConfigExtension,
  type ProviderConfigExtension,
} from "@checkmate-monitor/integration-frontend";
import { pluginMetadata } from "@checkmate-monitor/integration-jira-common";
import { JiraConfigComponent } from "./components/JiraConfigComponent";

// Register the custom config component for the Jira provider
// Type cast through unknown needed because the registry uses the base Record<string, unknown> type
// but the component uses a specific JiraSubscriptionConfig type
registerProviderConfigExtension({
  providerId: "integration-jira.jira",
  ConfigComponent: JiraConfigComponent,
} as unknown as ProviderConfigExtension);

export const jiraFrontendPlugin = createFrontendPlugin({
  metadata: pluginMetadata,
  routes: [],
  extensions: [],
});

export default jiraFrontendPlugin;
