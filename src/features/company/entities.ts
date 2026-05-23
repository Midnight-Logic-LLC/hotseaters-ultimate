/**
 * features/company/entities.ts — entity schemas owned by the company feature.
 *
 * `Company` is also registered by `features/auth/entities.ts` (auth needs it
 * for the current-company hook). `registerEntityJsonSchema` is idempotent per
 * entityType, so dual registration is safe. Both files share the same shape.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
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

export const CompanySchema: JsonSchemaObject = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    email: { type: ['string', 'null'], format: 'email' },
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
  },
};

export const COMPANY_FEATURE_ENTITY_SCHEMAS: Record<string, JsonSchemaObject> = {
  Company: CompanySchema,
};
