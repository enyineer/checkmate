/**
 * Mock PluginInstaller for testing plugin installation flows.
 * Tracks all install calls and allows configuring responses.
 */

export interface InstallResult {
  name: string;
  path: string;
}

export interface MockPluginInstallerOptions {
  /** Custom install result generator */
  installResult?: (packageName: string) => InstallResult;
  /** If true, install will throw an error */
  shouldFail?: boolean;
  /** Error message to throw when shouldFail is true */
  errorMessage?: string;
}

export interface MockPluginInstaller {
  install: (packageName: string) => Promise<InstallResult>;

  // Test helpers
  _installCalls: string[];
  _setInstallResult: (fn: (packageName: string) => InstallResult) => void;
  _setShouldFail: (shouldFail: boolean, errorMessage?: string) => void;
  _clear: () => void;
}

export function createMockPluginInstaller(
  options?: MockPluginInstallerOptions
): MockPluginInstaller {
  const installCalls: string[] = [];
  let installResultFn =
    options?.installResult ||
    ((packageName: string) => ({
      name: packageName,
      path: `/runtime_plugins/node_modules/${packageName}`,
    }));
  let shouldFail = options?.shouldFail || false;
  let errorMessage = options?.errorMessage || "Mock install failed";

  return {
    install: async (packageName: string) => {
      installCalls.push(packageName);
      if (shouldFail) {
        throw new Error(errorMessage);
      }
      return installResultFn(packageName);
    },

    // Test helpers
    _installCalls: installCalls,

    _setInstallResult: (fn: (packageName: string) => InstallResult) => {
      installResultFn = fn;
    },

    _setShouldFail: (fail: boolean, msg?: string) => {
      shouldFail = fail;
      if (msg) errorMessage = msg;
    },

    _clear: () => {
      installCalls.length = 0;
      shouldFail = false;
    },
  };
}
