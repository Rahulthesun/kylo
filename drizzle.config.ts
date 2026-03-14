import type { Config } from 'drizzle-kit';
 
export default {
  schema: './electron/db/schema.ts',
  out: './electron/db/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    // Local path just for drizzle-kit tooling
    // The real path is set at runtime via app.getPath('userData')
    url: './dev.db',
  },
} satisfies Config;