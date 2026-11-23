import { migration001 } from './001_init';
import { migration002 } from './002_settings';
import type { Migration } from './migration';

export const migrations: Migration[] = [migration001, migration002].sort(
  (a, b) => a.version - b.version,
);

export const LATEST_VERSION = migrations[migrations.length - 1].version;