import { fetchApiRef, ApiRef } from "@checkmate/frontend-api";
import { CatalogClient } from "./client";
import { Link, Route } from "react-router-dom";
import { catalogApiRef } from "./api";
import { FrontendPlugin } from "@checkmate/frontend-api";

import { CatalogPage } from "./components/CatalogPage";

const CatalogRoutes = () => (
  <>
    <Route path="/catalog" element={<CatalogPage />} />
  </>
);

const CatalogNavbarItem = () => (
  <Link
    to="/catalog"
    className="text-sm font-medium hover:text-indigo-600 transition-colors"
  >
    Catalog
  </Link>
);

export const catalogPlugin: FrontendPlugin = {
  name: "catalog-frontend",
  apis: [
    {
      ref: catalogApiRef,
      factory: (deps: { get: <T>(ref: ApiRef<T>) => T }) => {
        const fetchApi = deps.get(fetchApiRef);
        return new CatalogClient(fetchApi);
      },
    },
  ],
  extensions: [
    {
      id: "catalog.routes",
      slotId: "core.routes",
      component: CatalogRoutes,
    },
    {
      id: "catalog.navbar.item",
      slotId: "core.layout.navbar",
      component: CatalogNavbarItem,
    },
  ],
};

export * from "./api";
export * from "./client";
