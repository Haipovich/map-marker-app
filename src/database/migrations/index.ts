import type { Migration } from './migration';
import { migration001 } from './001_init';

export const migrations: Migration[] = [migration001].sort((a, b) => a.version - b.version);

export const LATEST_VERSION = migrations[migrations.length - 1].version;