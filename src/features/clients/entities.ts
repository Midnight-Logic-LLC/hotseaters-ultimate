/**
 * entities.ts — register the clients aggregate with the entity graph.
 *
 * No I/O. Idempotent. Imported once at app start (sibling to the auth
 * registration). Components reach this data through hooks; hooks reach
 * stores; stores reach PGlite. This file only declares shapes so the graph
 * can normalize incoming rows.
 *
 * The JSON Schemas mirror the columns the local PGlite view exposes (see
 * `src/shared/db/local-schema.sql`). `client_service_override` is NOT
 * synced to PGlite in v0.1; we still register the schema so the graph can
 * normalize REST responses fetched on-demand by the override store.
 */

import {
  registerEntityJsonSchema,
  registerSchema,
} from '@prometheus-ags/prometheus-entity-management';

let registered = false;

export function registerClientEntities(): void {
  if (registered) return;
  registered = true;

  registerEntityJsonSchema({
    entityType: 'Client',
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'string' },
        legacy_id: { type: ['string', 'null'] },
        company_id: { type: 'string' },
        client_type_id: { type: ['string', 'null'] },
        firm_name: { type: ['string', 'null'] },
        phone: { type: ['string', 'null'] },
        website: { type: ['string', 'null'] },
        sales_lead: { type: ['string', 'null'] },
        is_lead: { type: 'boolean' },
        status: { type: ['string', 'null'] },
        notes: { type: ['string', 'null'] },
        created_at: { type: ['string', 'null'] },
        updated_at: { type: ['string', 'null'] },
        is_sample: { type: 'boolean' },
        created_by_id: { type: ['string', 'null'] },
        created_by: { type: ['string', 'null'] },
      },
      required: ['id', 'company_id'],
    },
  });

  registerEntityJsonSchema({
    entityType: 'ClientAddress',
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'string' },
        legacy_id: { type: ['string', 'null'] },
        company_id: { type: 'string' },
        client_id: { type: 'string' },
        label: { type: ['string', 'null'] },
        address: { type: ['string', 'null'] },
        city: { type: ['string', 'null'] },
        state: { type: ['string', 'null'] },
        zip: { type: ['string', 'null'] },
        is_primary: { type: 'boolean' },
        created_at: { type: ['string', 'null'] },
        updated_at: { type: ['string', 'null'] },
        is_sample: { type: 'boolean' },
        created_by_id: { type: ['string', 'null'] },
        created_by: { type: ['string', 'null'] },
      },
      required: ['id', 'company_id', 'client_id'],
    },
  });

  registerEntityJsonSchema({
    entityType: 'ClientServiceOverride',
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'string' },
        legacy_id: { type: ['string', 'null'] },
        company_id: { type: 'string' },
        client_id: { type: 'string' },
        service_id: { type: 'string' },
        rate_type: { type: ['string', 'null'] },
        custom_rate: { type: ['number', 'string', 'null'] },
        created_at: { type: ['string', 'null'] },
        updated_at: { type: ['string', 'null'] },
        is_sample: { type: 'boolean' },
      },
      required: ['id', 'company_id', 'client_id', 'service_id'],
    },
  });

  // CRUD relation registration so `cascadeInvalidation` fires correctly when
  // a Client / ClientAddress mutation lands.
  registerSchema({
    type: 'Client',
    relations: {
      addresses: {
        cardinality: 'hasMany',
        targetType: 'ClientAddress',
        foreignKey: 'client_id',
        listKeyPrefix: (parentId) => ['ClientAddress', 'list', String(parentId)],
      },
      serviceOverrides: {
        cardinality: 'hasMany',
        targetType: 'ClientServiceOverride',
        foreignKey: 'client_id',
        listKeyPrefix: (parentId) => [
          'ClientServiceOverride',
          'list',
          String(parentId),
        ],
      },
    },
    globalListKeys: ['Client'],
  });
  registerSchema({
    type: 'ClientAddress',
    relations: {
      client: {
        cardinality: 'belongsTo',
        targetType: 'Client',
        foreignKey: 'client_id',
      },
    },
  });
  registerSchema({
    type: 'ClientServiceOverride',
    relations: {
      client: {
        cardinality: 'belongsTo',
        targetType: 'Client',
        foreignKey: 'client_id',
      },
    },
  });
}
