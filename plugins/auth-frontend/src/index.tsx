import { FrontendPlugin } from "@checkmate/frontend-api";
import { Route } from "react-router-dom";
import { LoginNavbarAction, LoginPage } from "./components/LoginPage";

const AuthRoutes = () => (
  <>
    <Route path="/auth/login" element={<LoginPage />} />
    {/* Register route would go here */}
  </>
);

export const authPlugin: FrontendPlugin = {
  name: "auth-frontend",
  extensions: [
    {
      id: "auth.routes",
      slotId: "core.routes",
      component: AuthRoutes,
    },
    {
      id: "auth.navbar.action",
      slotId: "core.layout.navbar",
      component: LoginNavbarAction,
    },
  ],
};
