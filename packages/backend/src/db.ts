import { Pool } from "pg";

export const adminPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
