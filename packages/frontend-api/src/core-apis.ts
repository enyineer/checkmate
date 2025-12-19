import { createApiRef } from "./api-ref";

export interface LoggerApi {
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

export interface FetchApi {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export const loggerApiRef = createApiRef<LoggerApi>("core.logger");
export const fetchApiRef = createApiRef<FetchApi>("core.fetch");
