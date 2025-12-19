import React from "react";

export interface FrontendPlugin {
  name: string;
  routes?: {
    path: string;
    element: React.ReactNode;
  }[];
}

class PluginRegistry {
  private plugins: FrontendPlugin[] = [];

  register(plugin: FrontendPlugin) {
    console.log(`🔌 Registering frontend plugin: ${plugin.name}`);
    this.plugins.push(plugin);
  }

  getPlugins() {
    return this.plugins;
  }
}

export const pluginRegistry = new PluginRegistry();
