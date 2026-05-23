// Combined fixture file. Specs import `test` and `expect` from here to get
// both auth personas and the fresh-PGlite auto-fixture.
import { mergeTests } from '@playwright/test';
import { test as authTest } from './auth';
import { test as pgliteTest } from './pglite';

export const test = mergeTests(authTest, pgliteTest);
export { expect } from '@playwright/test';
export { SEED_USERS, type Role, type SeedUser } from './auth';
