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

/**
 * DocumentTemplate — minimal list-view shape for S09. Full editor (sections,
 * page settings, placeholder mapping) is deferred to Wave W8.
 *
 * Bible source: HotSeatersMVP/src/components/settings/DocumentTemplateManagement.jsx
 *   base44.entities.DocumentTemplate.{filter,create,update,delete}
 */
export const DocumentTemplateSchema: JsonSchemaObject = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    template_type: { type: ['string', 'null'] }, // 'document' | 'billing' | 'email'
    category_id: { type: ['string', 'null'], format: 'uuid' },
    company_id: { type: ['string', 'null'], format: 'uuid' },
    is_active: { type: 'boolean' },
    has_signature_fields: { type: 'boolean' },
    is_contract: { type: 'boolean' },
    created_at: { type: ['string', 'null'] },
    updated_at: { type: ['string', 'null'] },
  },
};

export const COMPANY_FEATURE_ENTITY_SCHEMAS: Record<string, JsonSchemaObject> = {
  Company: CompanySchema,
  DocumentTemplate: DocumentTemplateSchema,
};
