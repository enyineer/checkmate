import { generateKeyPair, exportJWK, importJWK } from "jose";
import { db } from "../db";
import { jwtKeys } from "../schema";
import { eq, and, isNull, desc, lt } from "drizzle-orm";
import { rootLogger } from "../logger";

const logger = rootLogger.child({ service: "KeyStore" });

const ALG = "RS256";
const ROTATION_INTERVAL_MS = 1000 * 60 * 60; // 1 hour
const ROTATION_GRACE_PERIOD_MS = 1000 * 60 * 60 * 24; // 24 hours

export class KeyStore {
  /**
   * Generates a new key pair and stores it
   */
  async generateKey() {
    logger.info("Generating new JWKS key pair...");
    const { publicKey, privateKey } = await generateKeyPair(ALG, {
      extractable: true,
    });
    const publicJwk = await exportJWK(publicKey);
    const privateJwk = await exportJWK(privateKey);

    const kid = crypto.randomUUID();
    publicJwk.kid = kid;
    publicJwk.use = "sig";
    publicJwk.alg = ALG;

    privateJwk.kid = kid;
    privateJwk.use = "sig";
    privateJwk.alg = ALG;

    const now = new Date(); // Use Date object for timestamp

    await db.insert(jwtKeys).values({
      id: kid,
      publicKey: JSON.stringify(publicJwk),
      privateKey: JSON.stringify(privateJwk),
      algorithm: ALG,
      createdAt: now.toISOString(),
      expiresAt: undefined,
      revokedAt: undefined,
    });

    return { kid, publicKey, privateKey };
  }

  /**
   * Gets the current signing key, rotating if necessary
   */
  async getSigningKey() {
    const validKeys = await db
      .select()
      .from(jwtKeys)
      .where(and(isNull(jwtKeys.revokedAt), isNull(jwtKeys.expiresAt)))
      .orderBy(desc(jwtKeys.createdAt))
      .limit(1);

    let activeKey = validKeys[0];
    const now = Date.now();
    let shouldRotate = false;

    if (activeKey) {
      const created = new Date(activeKey.createdAt).getTime();
      if (now - created > ROTATION_INTERVAL_MS) {
        shouldRotate = true;
      }
    } else {
      shouldRotate = true;
    }

    if (shouldRotate) {
      if (activeKey) {
        // Set expiry on old key
        const expiresAt = new Date(Date.now() + ROTATION_GRACE_PERIOD_MS);
        logger.info(
          `Rotating key ${
            activeKey.id
          }, setting expiry to ${expiresAt.toISOString()}`
        );
        await db
          .update(jwtKeys)
          .set({ expiresAt: expiresAt.toISOString() })
          .where(eq(jwtKeys.id, activeKey.id));
      }

      const { kid } = await this.generateKey();
      const newKeys = await db
        .select()
        .from(jwtKeys)
        .where(eq(jwtKeys.id, kid));
      activeKey = newKeys[0];

      // Clean up old keys on rotation
      await this.cleanupKeys();
    }

    if (!activeKey) {
      throw new Error("Failed to get signing key");
    }

    const privateJwk = JSON.parse(activeKey.privateKey);
    const privateKey = await importJWK(privateJwk, ALG);
    return { kid: activeKey.id, key: privateKey };
  }

  /**
   * Returns public keys in JWKS format
   */
  async getPublicJWKS() {
    const validKeys = await db
      .select({
        publicKey: jwtKeys.publicKey,
      })
      .from(jwtKeys)
      .where(isNull(jwtKeys.revokedAt)); // Return all non-revoked keys (even if old, for grace period)

    const keys = validKeys.map((k) => JSON.parse(k.publicKey));
    return { keys };
  }

  /**
   * Cleans up expired keys that are past their grace period
   */
  async cleanupKeys() {
    const now = new Date().toISOString();
    logger.info("Cleaning up expired JWKS keys...");

    // We only delete keys that have an expiresAt set AND that date is in the past.
    // Since we set expiresAt to now + grace_period, we can just check if expiresAt < now.
    await db.delete(jwtKeys).where(lt(jwtKeys.expiresAt, now));
  }
}

export const keyStore = new KeyStore();
