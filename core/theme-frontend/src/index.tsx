import {
  createFrontendPlugin,
  UserMenuItemsBottomSlot,
} from "@checkmate/frontend-api";
import { pluginMetadata } from "@checkmate/theme-common";
import { ThemeToggleMenuItem } from "./components/ThemeToggleMenuItem";

export const themePlugin = createFrontendPlugin({
  metadata: pluginMetadata,
  routes: [],
  extensions: [
    {
      id: "theme.user-menu.toggle",
      slot: UserMenuItemsBottomSlot,
      component: ThemeToggleMenuItem,
    },
  ],
});
