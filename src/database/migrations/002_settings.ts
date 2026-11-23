import type { Migration } from './migration';

export const migration002: Migration = {
  version: 2,
  name: 'settings',
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  },
};