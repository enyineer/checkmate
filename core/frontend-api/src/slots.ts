/**
 * A type-safe slot definition that can be exported from plugin common packages.
 * The context type parameter defines what props extensions will receive.
 */
export interface SlotDefinition<TContext = undefined> {
  /** Unique slot identifier, recommended format: "plugin-name.area.purpose" */
  readonly id: string;
  /** Phantom type for context type inference - do not use directly */
  readonly _contextType?: TContext;
}

/**
 * Creates a type-safe slot definition that can be exported from any package.
 *
 * @example
 * // In @checkmate-monitor/catalog-common
 * export const SystemDetailsSlot = createSlot<{ systemId: string }>(
 *   "catalog.system.details"
 * );
 *
 * // In your frontend plugin
 * extensions: [{
 *   id: "my-plugin.system-details",
 *   slot: SystemDetailsSlot,
 *   component: MySystemDetailsExtension, // Receives { systemId: string }
 * }]
 *
 * @param id - Unique slot identifier
 * @returns A slot definition that can be used for type-safe extension registration
 */
export function createSlot<TContext = undefined>(
  id: string
): SlotDefinition<TContext> {
  return { id } as SlotDefinition<TContext>;
}

/**
 * Core layout slots - no context required
 */
export const DashboardSlot = createSlot("dashboard");
export const NavbarSlot = createSlot("core.layout.navbar");
export const NavbarMainSlot = createSlot("core.layout.navbar.main");

/**
 * Context for user menu item slots.
 * Provides the user's permissions array and authentication info for synchronous checks.
 */
export interface UserMenuItemsContext {
  permissions: string[];
  hasCredentialAccount: boolean;
}

export const UserMenuItemsSlot = createSlot<UserMenuItemsContext>(
  "core.layout.navbar.user-menu.items"
);
export const UserMenuItemsBottomSlot = createSlot<UserMenuItemsContext>(
  "core.layout.navbar.user-menu.items.bottom"
);
