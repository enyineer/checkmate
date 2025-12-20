import { FrontendPlugin } from "@checkmate/frontend-api";
import { LoginPage, LoginNavbarAction } from "./components/LoginPage";

export const authPlugin: FrontendPlugin = {
  name: "auth-frontend",
  routes: [
    {
      path: "/auth/login",
      element: <LoginPage />,
    },
  ],
  extensions: [
    {
      id: "auth.navbar.action",
      slotId: "core.layout.navbar",
      component: LoginNavbarAction,
    },
  ],
};
