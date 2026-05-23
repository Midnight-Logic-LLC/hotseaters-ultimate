/**
 * features/auth/entities.ts — JSON Schema definitions for the entities this
 * feature owns (UserInfo, Company).
 *
 * **Pure data only.** No I/O, no side effects, no imports of the
 * entity-management engine/graph/adapters (eslint `boundaries/external`
 * disallows it from `feature-entities`).
 *
 * The actual `registerEntityJsonSchema()` call happens from a store-tier
 * bootstrap module (`stores/auth-store.ts`), so the registration side effect
 * stays at the data-seam layer per RULE 3.
 *
 * Schemas are derived from the V2 migration files at
 * `latest-data/supabase/migrations/` — see `20260523000004_v2_schema_company_user.sql`
 * for `company` and `user_info`, plus `20260523000015_auth_user_info_bridge.sql`
 * for the bridge columns (`auth_user_id`, `email`, `account_status`).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

/**
 * Minimal JSON Schema type — keep this local so `entities.ts` doesn't import
 * the entity-management package (eslint `boundaries/external` disallows it
 * from `feature-entities`). The shape mirrors `JsonSchemaObject` from
 * `@prometheus-ags/prometheus-entity-management`.
 */
type JsonSchemaObject = {
  type?: string | string[];
  required?: string[];
  properties?: Record<string, JsonSchemaObject>;
  enum?: ReadonlyArray<unknown>;
  format?: string;
  items?: JsonSchemaObject;
  additionalProperties?: boolean | JsonSchemaObject;
};

export const UserInfoSchema: JsonSchemaObject = {
  type: 'object',
  required: ['id', 'company_id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    legacy_id: { type: ['string', 'null'] },
    auth_user_id: { type: ['string', 'null'], format: 'uuid' },
    email: { type: ['string', 'null'], format: 'email' },
    account_status: {
      type: ['string', 'null'],
      enum: [null, 'pending', 'active', 'rejected', 'disabled'],
    },
    first_name: { type: ['string', 'null'] },
    last_name: { type: ['string', 'null'] },
    title: { type: ['string', 'null'] },
    phone: { type: ['string', 'null'] },
    profile_photo: { type: ['string', 'null'] },
    signature_image: { type: ['string', 'null'] },
    notes: { type: ['string', 'null'] },
    company_id: { type: ['string', 'null'], format: 'uuid' },
    company_role: {
      type: ['string', 'null'],
      enum: [null, 'Owner', 'Admin', 'Sales', 'Trial Consultant', 'System Admin'],
    },
    is_sales: { type: 'boolean' },
    status: { type: ['string', 'null'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

export const CompanySchema: JsonSchemaObject = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    legacy_id: { type: ['string', 'null'] },
    name: { type: 'string' },
    email: { type: ['string', 'null'], format: 'email' },
    sender_email: { type: ['string', 'null'], format: 'email' },
    phone: { type: ['string', 'null'] },
    website: { type: ['string', 'null'] },
    address: { type: ['string', 'null'] },
    city: { type: ['string', 'null'] },
    state: { type: ['string', 'null'] },
    zip: { type: ['string', 'null'] },
    owner_id: { type: ['string', 'null'], format: 'uuid' },
    subscription_tier: { type: ['string', 'null'] },
    is_active: { type: 'boolean' },
    marketplace_post_jobs: { type: 'boolean' },
    marketplace_fill_jobs: { type: 'boolean' },
    has_hsh_addon: { type: 'boolean' },
    theme: { type: ['object', 'null'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

/**
 * Map of entityType → schema. The auth-store bootstrap iterates this and
 * calls `registerEntityJsonSchema` for each. Idempotent at the registry level.
 */
export const AUTH_FEATURE_ENTITY_SCHEMAS: Record<string, JsonSchemaObject> = {
  UserInfo: UserInfoSchema,
  Company: CompanySchema,
};
