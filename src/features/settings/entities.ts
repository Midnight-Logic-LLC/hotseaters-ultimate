/**
 * settings/entities.ts — register SettingsType and EntitySetting with the
 * entity graph.
 *
 * Both tables already exist in the self-hosted Supabase DB.
 * Registering them here allows the graph to normalize REST responses and
 * Electric sync events into typed slices.
 *
 * RULE 6: no FK references to auth.users.id — user_info_id references
 * the user_info table, not auth.users.
 *
 * Architecture: pure registration — no I/O, idempotent, safe to call at boot.
 */

import { registerEntityJsonSchema } from '@prometheus-ags/prometheus-entity-management';

export interface SettingsTypeEntity {
  id: string;
  key: string;
  label: string;
  entity_scope: 'company' | 'user_info' | 'document_template';
  json_schema: Record<string, unknown> | null;
  created_at: string;
}

export interface EntitySettingEntity {
  id: string;
  settings_type_id: string;
  company_id: string | null;
  user_info_id: string | null;
  document_template_id: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

let registered = false;

export function registerSettingsEntities(): void {
  if (registered) return;
  registered = true;

  registerEntityJsonSchema({
    entityType: 'SettingsType',
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'string' },
        key: { type: 'string' },
        label: { type: 'string' },
        entity_scope: { type: 'string' },
        json_schema: { type: ['object', 'null'] },
        created_at: { type: ['string', 'null'] },
      },
      required: ['id', 'key', 'label', 'entity_scope'],
    },
  });

  registerEntityJsonSchema({
    entityType: 'EntitySetting',
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'string' },
        settings_type_id: { type: 'string' },
        company_id: { type: ['string', 'null'] },
        user_info_id: { type: ['string', 'null'] },
        document_template_id: { type: ['string', 'null'] },
        data: { type: 'object', additionalProperties: true },
        created_at: { type: ['string', 'null'] },
        updated_at: { type: ['string', 'null'] },
      },
      required: ['id', 'settings_type_id', 'data'],
    },
  });
}
