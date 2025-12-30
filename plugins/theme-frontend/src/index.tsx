import { createFrontendPlugin } from "@checkmate/frontend-api";
import { SLOT_USER_MENU_ITEMS_BOTTOM } from "@checkmate/common";
import { ThemeToggleMenuItem } from "./components/ThemeToggleMenuItem";

export const themePlugin = createFrontendPlugin({
  name: "theme-frontend",
  routes: [],
  extensions: [
    {
      id: "theme.user-menu.toggle",
      slotId: SLOT_USER_MENU_ITEMS_BOTTOM,
      component: ThemeToggleMenuItem,
    },
  ],
});
