/**
 * Registry for provider configuration component extensions.
 * Allows integration providers to register custom React components for
 * subscription configuration instead of using the generic DynamicForm.
 */
import type { ComponentType } from "react";

/**
 * Props passed to custom provider config components.
 * @template TConfig The shape of the provider configuration
 */
export interface ProviderConfigProps<
  TConfig extends Record<string, unknown> = Record<string, unknown>
> {
  /** Current provider configuration values */
  value: TConfig;
  /** Callback to update configuration values */
  onChange: (value: TConfig) => void;
  /** Whether the form is in a saving/loading state */
  isSubmitting?: boolean;
}

/**
 * Extension registration for custom provider configuration components.
 * @template TConfig The shape of the provider configuration
 */
export interface ProviderConfigExtension<
  TConfig extends Record<string, unknown> = Record<string, unknown>
> {
  /** Qualified provider ID this extension applies to (e.g., "integration-jira.jira") */
  providerId: string;
  /**
   * React component to render for this provider's configuration.
   * Will be used instead of the generic DynamicForm.
   */
  ConfigComponent: ComponentType<ProviderConfigProps<TConfig>>;
}

const registeredExtensions = new Map<string, ProviderConfigExtension>();

/**
 * Register a custom configuration component for a provider.
 * @param extension The extension to register
 */
export function registerProviderConfigExtension(
  extension: ProviderConfigExtension
): void {
  registeredExtensions.set(extension.providerId, extension);
}

/**
 * Get a registered configuration component for a provider.
 * @param providerId Qualified provider ID (e.g., "integration-jira.jira")
 * @returns The extension if registered, undefined otherwise
 */
export function getProviderConfigExtension(
  providerId: string
): ProviderConfigExtension | undefined {
  return registeredExtensions.get(providerId);
}

/**
 * Check if a provider has a custom configuration component registered.
 * @param providerId Qualified provider ID
 */
export function hasProviderConfigExtension(providerId: string): boolean {
  return registeredExtensions.has(providerId);
}

/**
 * Get all registered provider config extensions.
 */
export function getAllProviderConfigExtensions(): ProviderConfigExtension[] {
  return [...registeredExtensions.values()];
}
