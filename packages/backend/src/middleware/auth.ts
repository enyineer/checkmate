import { MiddlewareHandler } from "hono";
import { PluginManager } from "../plugin-manager";
import { jwtService } from "../services/jwt";
import { coreServices } from "@checkmate/backend-api";

export const createAuthMiddleware = (
  pluginManager: PluginManager
): MiddlewareHandler => {
  return async (c, next) => {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");

    // 5. Dual Authentication Strategy
    // Strategy A: Service Token (Stateless, signed by Core)
    if (token) {
      const payload = await jwtService.verify(token);
      if (payload) {
        // It's a valid Service Token
        return next();
      }
    }

    // Strategy B: User Token (Stateful, validated by Auth Plugin)
    // We try to retrieve the registered AuthenticationStrategy
    const authStrategy = await pluginManager.getService(
      coreServices.authentication
    );

    if (authStrategy) {
      const user = await authStrategy.validate(c.req.raw);
      if (user) {
        // It's a valid User Session
        return next();
      }
    }

    // Both failed
    return c.json({ error: "Unauthorized: Invalid token or session" }, 401);
  };
};
