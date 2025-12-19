import { createServiceRef } from "@checkmate/backend/src/services/service-ref";

export interface AuthService {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  verify(token: string): Promise<any>;
}

export const authServiceRef = createServiceRef<AuthService>(
  "auth-backend.service"
);
