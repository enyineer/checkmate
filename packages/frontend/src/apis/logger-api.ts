import { LoggerApi } from "@checkmate/frontend-api";

export class ConsoleLoggerApi implements LoggerApi {
  info(message: string, ...args: any[]) {
    console.info(`[INFO] ${message}`, ...args);
  }
  error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args);
  }
  warn(message: string, ...args: any[]) {
    console.warn(`[WARN] ${message}`, ...args);
  }
  debug(message: string, ...args: any[]) {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}
