import React from "react";
import { ApiRef } from "./api-ref";
import type { SlotDefinition } from "./slots";
import type { RouteDefinition } from "@checkmate/common";

/**
 * Extract the context type from a SlotDefinition
 */
export type SlotContext<T> = T extends SlotDefinition<infer C> ? C : never;

/**
 * Type-safe extension that infers component props from the slot definition.
 * Use this when registering extensions for type safety.
 */
export interface SlotExtension<TSlot extends SlotDefinition<unknown>> {
  id: string;
  slotId: TSlot["id"];
  component: React.ComponentType<SlotContext<TSlot>>;
}

/**
 * Extension interface for slot registration.
 */
export interface Extension<T = unknown> {
  id: string;
  slotId: string;
  component: React.ComponentType<T>;
}

/**
 * Helper to create a type-safe extension from a slot definition.
 * This ensures the component props match the slot's expected context.
 */
export function createSlotExtension<TSlot extends SlotDefinition<unknown>>(
  slot: TSlot,
  extension: Omit<SlotExtension<TSlot>, "slotId">
): SlotExtension<TSlot> {
  return {
    ...extension,
    slotId: slot.id,
  };
}

// Type that accepts both Extension and SlotExtension
type AnyExtension = Extension<unknown> | SlotExtension<SlotDefinition<unknown>>;

/**
 * Route configuration for a frontend plugin.
 * Uses RouteDefinition from the plugin's common package.
 */
export interface PluginRoute {
  /** Route definition from common package */
  route: RouteDefinition;

  /** React element to render */
  element?: React.ReactNode;

  /** Page title */
  title?: string;

  /** Permission required to access this route */
  permission?: string;
}

export interface FrontendPlugin {
  name: string;
  extensions?: AnyExtension[];
  apis?: {
    ref: ApiRef<unknown>;
    factory: (deps: { get: <T>(ref: ApiRef<T>) => T }) => unknown;
  }[];
  routes?: PluginRoute[];
  navItems?: {
    title: string;
    path: string;
    icon?: React.ComponentType | React.ReactNode;
  }[];
}

export function createFrontendPlugin(plugin: FrontendPlugin): FrontendPlugin {
  return plugin;
}
