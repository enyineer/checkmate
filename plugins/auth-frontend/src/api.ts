import { createApiRef } from "@checkmate/frontend-api";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface AuthSession {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  };
  user: AuthUser;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface AuthStrategy {
  id: string;
  displayName: string;
  description?: string;
  enabled: boolean;
  configVersion: number;
  configSchema: Record<string, unknown>; // JSON Schema
  config?: Record<string, unknown>;
}

export interface AuthApi {
  signIn(
    email: string,
    password: string
  ): Promise<{ data?: AuthSession; error?: Error }>;
  signOut(): Promise<void>;
  getSession(): Promise<{ data?: AuthSession; error?: Error }>;
  useSession(): {
    data?: AuthSession;
    isPending: boolean;
    error?: Error;
  };

  // Management APIs
  getUsers(): Promise<AuthUser[] & { roles: string[] }[]>;
  deleteUser(userId: string): Promise<void>;
  getRoles(): Promise<Role[]>;
  updateUserRoles(userId: string, roles: string[]): Promise<void>;
  getStrategies(): Promise<AuthStrategy[]>;
  toggleStrategy(strategyId: string, enabled: boolean): Promise<void>;
  updateStrategy(
    strategyId: string,
    config: { enabled?: boolean; config?: Record<string, unknown> }
  ): Promise<void>;
  reloadAuth(): Promise<void>;
}

export const authApiRef = createApiRef<AuthApi>("auth.api");
