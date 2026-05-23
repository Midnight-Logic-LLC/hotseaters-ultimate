'use strict';

var zustand = require('zustand');
var middleware = require('zustand/middleware');
var immer = require('zustand/middleware/immer');
var React6 = require('react');
var jsxRuntime = require('react/jsx-runtime');
var shallow = require('zustand/react/shallow');
var reactTable = require('@tanstack/react-table');
var lucideReact = require('lucide-react');
var clsx = require('clsx');
var tailwindMerge = require('tailwind-merge');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var React6__default = /*#__PURE__*/_interopDefault(React6);

// src/graph.ts
var EMPTY_IDS = [];
var EMPTY_ENTITY_STATE = {
  isFetching: false,
  lastFetched: null,
  error: null,
  stale: false
};
var EMPTY_SYNC_METADATA = {
  synced: true,
  origin: "server",
  updatedAt: null
};
var EMPTY_LIST_STATE = {
  ids: EMPTY_IDS,
  total: null,
  nextCursor: null,
  prevCursor: null,
  hasNextPage: false,
  hasPrevPage: false,
  isFetching: false,
  isFetchingMore: false,
  error: null,
  lastFetched: null,
  stale: false,
  currentPage: null,
  pageSize: null
};
function defaultEntityState() {
  return { ...EMPTY_ENTITY_STATE };
}
function defaultSyncMetadata() {
  return { ...EMPTY_SYNC_METADATA };
}
function defaultListState() {
  return { ...EMPTY_LIST_STATE, ids: [] };
}
function ek(type, id) {
  return `${type}:${id}`;
}
var useGraphStore = zustand.create()(
  middleware.subscribeWithSelector(
    immer.immer((set, get) => ({
      entities: {},
      patches: {},
      entityStates: {},
      syncMetadata: {},
      lists: {},
      upsertEntity: (type, id, data) => set((s) => {
        if (!s.entities[type]) s.entities[type] = {};
        s.entities[type][id] = { ...s.entities[type][id] ?? {}, ...data };
        const key = ek(type, id);
        if (!s.syncMetadata[key]) s.syncMetadata[key] = defaultSyncMetadata();
      }),
      upsertEntities: (type, entries) => set((s) => {
        if (!s.entities[type]) s.entities[type] = {};
        for (const { id, data } of entries) {
          s.entities[type][id] = { ...s.entities[type][id] ?? {}, ...data };
          const key = ek(type, id);
          if (!s.syncMetadata[key]) s.syncMetadata[key] = defaultSyncMetadata();
        }
      }),
      replaceEntity: (type, id, data) => set((s) => {
        if (!s.entities[type]) s.entities[type] = {};
        s.entities[type][id] = data;
        const key = ek(type, id);
        if (!s.syncMetadata[key]) s.syncMetadata[key] = defaultSyncMetadata();
      }),
      removeEntity: (type, id) => set((s) => {
        delete s.entities[type]?.[id];
        delete s.patches[type]?.[id];
        delete s.entityStates[ek(type, id)];
        delete s.syncMetadata[ek(type, id)];
      }),
      patchEntity: (type, id, patch) => set((s) => {
        if (!s.patches[type]) s.patches[type] = {};
        s.patches[type][id] = { ...s.patches[type][id] ?? {}, ...patch };
      }),
      unpatchEntity: (type, id, keys) => set((s) => {
        const p = s.patches[type]?.[id];
        if (!p) return;
        for (const k of keys) delete p[k];
      }),
      clearPatch: (type, id) => set((s) => {
        delete s.patches[type]?.[id];
      }),
      setEntityFetching: (type, id, fetching) => set((s) => {
        const k = ek(type, id);
        if (!s.entityStates[k]) s.entityStates[k] = defaultEntityState();
        s.entityStates[k].isFetching = fetching;
      }),
      setEntityError: (type, id, error) => set((s) => {
        const k = ek(type, id);
        if (!s.entityStates[k]) s.entityStates[k] = defaultEntityState();
        s.entityStates[k].error = error;
        s.entityStates[k].isFetching = false;
      }),
      setEntityFetched: (type, id) => set((s) => {
        const k = ek(type, id);
        if (!s.entityStates[k]) s.entityStates[k] = defaultEntityState();
        s.entityStates[k].lastFetched = Date.now();
        s.entityStates[k].isFetching = false;
        s.entityStates[k].error = null;
        s.entityStates[k].stale = false;
        s.syncMetadata[k] = { ...s.syncMetadata[k] ?? defaultSyncMetadata(), synced: true, origin: "server", updatedAt: Date.now() };
      }),
      setEntityStale: (type, id, stale) => set((s) => {
        const k = ek(type, id);
        if (!s.entityStates[k]) s.entityStates[k] = defaultEntityState();
        s.entityStates[k].stale = stale;
      }),
      setEntitySyncMetadata: (type, id, metadata) => set((s) => {
        const k = ek(type, id);
        s.syncMetadata[k] = { ...s.syncMetadata[k] ?? defaultSyncMetadata(), ...metadata };
      }),
      clearEntitySyncMetadata: (type, id) => set((s) => {
        delete s.syncMetadata[ek(type, id)];
      }),
      setListResult: (key, ids, meta) => set((s) => {
        const ex = s.lists[key] ?? defaultListState();
        s.lists[key] = { ...ex, ...meta, ids, isFetching: false, isFetchingMore: false, error: null, stale: false, lastFetched: Date.now() };
      }),
      appendListResult: (key, ids, meta) => set((s) => {
        const ex = s.lists[key] ?? defaultListState();
        s.lists[key] = { ...ex, ...meta, ids: Array.from(/* @__PURE__ */ new Set([...ex.ids, ...ids])), isFetching: false, isFetchingMore: false, error: null, stale: false, lastFetched: Date.now() };
      }),
      prependListResult: (key, ids, meta) => set((s) => {
        const ex = s.lists[key] ?? defaultListState();
        s.lists[key] = { ...ex, ...meta ?? {}, ids: Array.from(/* @__PURE__ */ new Set([...ids, ...ex.ids])), isFetching: false, isFetchingMore: false, error: null, stale: false, lastFetched: Date.now() };
      }),
      removeIdFromAllLists: (_type, id) => set((s) => {
        for (const key of Object.keys(s.lists)) {
          const list = s.lists[key];
          const idx = list.ids.indexOf(id);
          if (idx !== -1) {
            list.ids.splice(idx, 1);
            if (list.total !== null) list.total -= 1;
          }
        }
      }),
      insertIdInList: (key, id, position) => set((s) => {
        if (!s.lists[key]) s.lists[key] = defaultListState();
        const ids = s.lists[key].ids;
        const ex = ids.indexOf(id);
        if (ex !== -1) ids.splice(ex, 1);
        if (position === "start") ids.unshift(id);
        else if (position === "end") ids.push(id);
        else ids.splice(position, 0, id);
      }),
      setListFetching: (key, fetching) => set((s) => {
        if (!s.lists[key]) s.lists[key] = defaultListState();
        s.lists[key].isFetching = fetching;
      }),
      setListFetchingMore: (key, fetchingMore) => set((s) => {
        if (!s.lists[key]) s.lists[key] = defaultListState();
        s.lists[key].isFetchingMore = fetchingMore;
      }),
      setListError: (key, error) => set((s) => {
        if (!s.lists[key]) s.lists[key] = defaultListState();
        s.lists[key].error = error;
        s.lists[key].isFetching = false;
        s.lists[key].isFetchingMore = false;
      }),
      setListStale: (key, stale) => set((s) => {
        if (!s.lists[key]) s.lists[key] = defaultListState();
        s.lists[key].stale = stale;
      }),
      invalidateEntity: (type, id) => set((s) => {
        if (id) {
          const k = ek(type, id);
          if (s.entityStates[k]) s.entityStates[k].stale = true;
        } else {
          for (const k of Object.keys(s.entityStates)) if (k.startsWith(`${type}:`)) s.entityStates[k].stale = true;
        }
      }),
      invalidateLists: (matcher) => set((s) => {
        const pred = typeof matcher === "string" ? (k) => k.startsWith(matcher) : matcher;
        for (const key of Object.keys(s.lists)) if (pred(key)) s.lists[key].stale = true;
      }),
      invalidateType: (type) => {
        get().invalidateEntity(type);
        get().invalidateLists(type);
      },
      readEntity: (type, id) => {
        const s = get();
        const base = s.entities[type]?.[id];
        if (!base) return null;
        const patch = s.patches[type]?.[id];
        return patch ? { ...base, ...patch } : base;
      },
      readEntitySnapshot: (type, id) => {
        const s = get();
        const base = s.entities[type]?.[id];
        if (!base) return null;
        const patch = s.patches[type]?.[id];
        const metadata = s.syncMetadata[ek(type, id)] ?? EMPTY_SYNC_METADATA;
        return {
          ...patch ? { ...base, ...patch } : base,
          $synced: metadata.synced,
          $origin: metadata.origin,
          $updatedAt: metadata.updatedAt
        };
      }
    }))
  )
);

// src/graph-query.ts
function queryOnce(opts) {
  const store = useGraphStore.getState();
  const ids = resolveCandidateIds(store, opts);
  let rows = ids.map((id) => store.readEntitySnapshot(opts.type, id)).filter((row) => row !== null);
  if (opts.where) rows = rows.filter(opts.where);
  if (opts.sort) rows = [...rows].sort(opts.sort);
  const projected = rows.map((row) => applySelection(projectRow(row, opts.include, store), opts.select));
  if (opts.id) return projected[0] ?? null;
  return projected;
}
var selectGraph = queryOnce;
function resolveCandidateIds(store, opts) {
  if (opts.id) return [opts.id];
  if (opts.ids) return opts.ids;
  if (opts.listKey) return store.lists[opts.listKey]?.ids ?? [];
  return Object.keys(store.entities[opts.type] ?? {});
}
function projectRow(row, include, store) {
  if (!include) return row;
  const projected = { ...row };
  for (const [key, relation] of Object.entries(include)) {
    const related = resolveRelation(row, relation, store);
    projected[key] = related;
  }
  return projected;
}
function resolveRelation(entity, relation, store) {
  const include = relation.include;
  switch (relation.via.kind) {
    case "field": {
      const relatedId = entity[relation.via.field];
      if (typeof relatedId !== "string") return null;
      const related = store.readEntitySnapshot(relation.type, relatedId);
      return related ? projectRow(related, include, store) : null;
    }
    case "array": {
      const ids = entity[relation.via.field];
      if (!Array.isArray(ids)) return [];
      return ids.map((id) => typeof id === "string" ? store.readEntitySnapshot(relation.type, id) : null).filter((row) => row !== null).map((row) => projectRow(row, include, store));
    }
    case "list": {
      const key = typeof relation.via.key === "function" ? relation.via.key(entity) : relation.via.key;
      if (!key) return [];
      const ids = store.lists[key]?.ids ?? [];
      return ids.map((id) => store.readEntitySnapshot(relation.type, id)).filter((row) => row !== null).map((row) => projectRow(row, include, store));
    }
    case "resolver": {
      const resolved = relation.via.resolve(entity, store);
      if (Array.isArray(resolved)) {
        return resolved.map((id) => store.readEntitySnapshot(relation.type, id)).filter((row) => row !== null).map((row) => projectRow(row, include, store));
      }
      if (typeof resolved !== "string") return null;
      const related = store.readEntitySnapshot(relation.type, resolved);
      return related ? projectRow(related, include, store) : null;
    }
  }
}
function applySelection(row, select) {
  if (!select) return row;
  if (typeof select === "function") {
    const result = select(row);
    return result && typeof result === "object" ? result : { value: result };
  }
  const picked = {};
  for (const key of select) {
    if (key in row) picked[key] = row[key];
  }
  return picked;
}

// src/graph-actions.ts
var graphActionListeners = /* @__PURE__ */ new Set();
var graphActionReplayers = /* @__PURE__ */ new Map();
function createGraphTransaction() {
  const baseline = cloneGraphData();
  let closed = false;
  const tx = {
    upsertEntity(type, id, data) {
      useGraphStore.getState().upsertEntity(type, id, data);
      return tx;
    },
    replaceEntity(type, id, data) {
      useGraphStore.getState().replaceEntity(type, id, data);
      return tx;
    },
    removeEntity(type, id) {
      useGraphStore.getState().removeEntity(type, id);
      return tx;
    },
    patchEntity(type, id, patch) {
      useGraphStore.getState().patchEntity(type, id, patch);
      return tx;
    },
    clearPatch(type, id) {
      useGraphStore.getState().clearPatch(type, id);
      return tx;
    },
    insertIdInList(key, id, position) {
      useGraphStore.getState().insertIdInList(key, id, position);
      return tx;
    },
    removeIdFromAllLists(type, id) {
      useGraphStore.getState().removeIdFromAllLists(type, id);
      return tx;
    },
    setEntitySyncMetadata(type, id, metadata) {
      useGraphStore.getState().setEntitySyncMetadata(type, id, metadata);
      return tx;
    },
    markEntityPending(type, id, origin = "optimistic") {
      useGraphStore.getState().setEntitySyncMetadata(type, id, {
        synced: false,
        origin,
        updatedAt: Date.now()
      });
      return tx;
    },
    markEntitySynced(type, id, origin = "server") {
      useGraphStore.getState().setEntitySyncMetadata(type, id, {
        synced: true,
        origin,
        updatedAt: Date.now()
      });
      return tx;
    },
    commit() {
      closed = true;
    },
    rollback() {
      if (closed) return;
      useGraphStore.setState(cloneGraphData(baseline));
      closed = true;
    },
    snapshot() {
      return cloneGraphData();
    }
  };
  return tx;
}
function createGraphAction(opts) {
  if (opts.key) {
    graphActionReplayers.set(opts.key, async (record) => {
      const tx = createGraphTransaction();
      try {
        const result = await opts.run(tx, record.input);
        tx.commit();
        return result;
      } catch (error) {
        tx.rollback();
        throw error;
      }
    });
  }
  return async (input) => {
    const tx = createGraphTransaction();
    const record = opts.key ? {
      id: `${opts.key}:${Date.now()}`,
      key: opts.key,
      input: structuredClone(input),
      enqueuedAt: (/* @__PURE__ */ new Date()).toISOString()
    } : null;
    try {
      if (record) emitGraphActionEvent({ type: "enqueued", record });
      opts.optimistic?.(tx, input);
      const result = await opts.run(tx, input);
      opts.onSuccess?.(result, input, tx);
      tx.commit();
      if (record) emitGraphActionEvent({ type: "settled", record });
      return result;
    } catch (error) {
      tx.rollback();
      const normalized = error instanceof Error ? error : new Error(String(error));
      if (record) emitGraphActionEvent({ type: "settled", record });
      opts.onError?.(normalized, input);
      throw normalized;
    }
  };
}
function subscribeGraphActionEvents(listener) {
  graphActionListeners.add(listener);
  return () => graphActionListeners.delete(listener);
}
async function replayRegisteredGraphAction(record) {
  const replayer = graphActionReplayers.get(record.key);
  if (!replayer) throw new Error(`No graph action registered for key "${record.key}"`);
  return replayer(record);
}
function cloneGraphData(source = useGraphStore.getState()) {
  return {
    entities: structuredClone(source.entities),
    patches: structuredClone(source.patches),
    entityStates: structuredClone(source.entityStates),
    syncMetadata: structuredClone(source.syncMetadata),
    lists: structuredClone(source.lists)
  };
}
function emitGraphActionEvent(event) {
  for (const listener of graphActionListeners) listener(event);
}

// src/graph-effects.ts
function createGraphEffect(opts) {
  const getKey = opts.getKey ?? defaultGetKey;
  const isEqual = opts.isEqual ?? defaultIsEqual;
  let initialized = false;
  let previous = /* @__PURE__ */ new Map();
  const evaluate = () => {
    const nextValues = normalizeQueryResult(opts.query());
    const next = /* @__PURE__ */ new Map();
    nextValues.forEach((value, index) => {
      next.set(getKey(value, index), value);
    });
    if (!initialized) {
      initialized = true;
      previous = next;
      if (opts.skipInitial) return;
    }
    for (const [key, value] of next.entries()) {
      const previousValue = previous.get(key);
      if (previousValue === void 0) {
        opts.onEnter?.({ key, value });
        continue;
      }
      if (!isEqual(previousValue, value)) {
        opts.onUpdate?.({ key, value, previousValue });
      }
    }
    for (const [key, previousValue] of previous.entries()) {
      if (!next.has(key)) opts.onExit?.({ key, previousValue });
    }
    previous = next;
  };
  evaluate();
  const unsubscribe = useGraphStore.subscribe(() => {
    evaluate();
  });
  return {
    dispose: () => {
      unsubscribe();
    }
  };
}
function normalizeQueryResult(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
function defaultGetKey(value, index) {
  if (value && typeof value === "object") {
    const record = value;
    if (typeof record.id === "string") return record.id;
    if (typeof record.$key === "string") return record.$key;
  }
  return String(index);
}
function defaultIsEqual(previousValue, nextValue) {
  return JSON.stringify(previousValue) === JSON.stringify(nextValue);
}

// src/object-path.ts
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getValueAtPath(source, path) {
  if (!path) return source;
  const segments = path.split(".").filter(Boolean);
  let current = source;
  for (const segment of segments) {
    if (!isObject(current) && !Array.isArray(current)) return void 0;
    current = current[segment];
  }
  return current;
}
function setValueAtPath(source, path, value) {
  const segments = path.split(".").filter(Boolean);
  if (segments.length === 0) return source;
  const clone = structuredClone(source);
  let current = clone;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = current[segment];
    if (!isObject(next)) current[segment] = {};
    current = current[segment];
  }
  current[segments[segments.length - 1]] = value;
  return clone;
}
function collectDirtyPaths(current, original, prefix = "", acc = /* @__PURE__ */ new Set()) {
  if (isObject(current) && isObject(original)) {
    const keys = /* @__PURE__ */ new Set([...Object.keys(current), ...Object.keys(original)]);
    for (const key of keys) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      collectDirtyPaths(current[key], original[key], nextPrefix, acc);
    }
    return acc;
  }
  if (JSON.stringify(current) !== JSON.stringify(original) && prefix) acc.add(prefix);
  return acc;
}
var schemaRegistry = /* @__PURE__ */ new Map();
function registerEntityJsonSchema(config) {
  const key = registryKey(config.entityType, config.field, config.schemaId);
  schemaRegistry.set(key, config);
}
function registerRuntimeSchema(config) {
  registerEntityJsonSchema(config);
}
function getEntityJsonSchema(opts) {
  const exact = schemaRegistry.get(registryKey(opts.entityType, opts.field, opts.schemaId));
  if (exact) return exact;
  if (opts.field) {
    const byField = schemaRegistry.get(registryKey(opts.entityType, opts.field));
    if (byField) return byField;
  }
  if (opts.schemaId) {
    const byId = schemaRegistry.get(registryKey(opts.entityType, void 0, opts.schemaId));
    if (byId) return byId;
  }
  for (const schema of schemaRegistry.values()) {
    if (schema.entityType !== opts.entityType) continue;
    if (opts.field && schema.field !== opts.field) continue;
    return schema;
  }
  return null;
}
function useSchemaEntityFields(opts) {
  return React6.useMemo(() => {
    const schema = opts.schema ?? getEntityJsonSchema(opts)?.schema;
    if (!schema) return [];
    return buildEntityFieldsFromSchema({ schema, rootField: opts.rootField ?? opts.field });
  }, [opts.entityType, opts.field, opts.rootField, opts.schemaId, opts.schema]);
}
function buildEntityFieldsFromSchema(opts) {
  return buildSchemaFields(opts.schema, opts.rootField ?? "", "");
}
function exportGraphSnapshotWithSchemas(opts) {
  return JSON.stringify(
    {
      scope: opts.scope,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      data: opts.data,
      schemas: opts.schemas.filter(Boolean)
    },
    null,
    opts.pretty === false ? 0 : 2
  );
}
function escapeHtml(input) {
  return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function renderMarkdownToHtml(value) {
  const escaped = escapeHtml(value);
  const blocks = escaped.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block) => renderMarkdownBlock(block)).join("");
}
function MarkdownFieldRenderer({ value, className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className,
      dangerouslySetInnerHTML: { __html: renderMarkdownToHtml(value ?? "") }
    }
  );
}
function MarkdownFieldEditor({
  value,
  onChange,
  placeholder
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-2", children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "textarea",
      {
        value,
        onChange: (event) => onChange(event.target.value),
        placeholder,
        className: "w-full min-h-[120px] rounded-md border bg-muted/50 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "rounded-md border bg-background px-3 py-2", children: /* @__PURE__ */ jsxRuntime.jsx(MarkdownFieldRenderer, { value, className: "prose prose-sm max-w-none" }) })
  ] });
}
function createMarkdownDetailRenderer(field) {
  return (value, entity) => /* @__PURE__ */ jsxRuntime.jsx(MarkdownFieldRenderer, { value: String(value ?? getValueAtPath(entity, field) ?? ""), className: "prose prose-sm max-w-none" });
}
function buildSchemaFields(schema, pathPrefix, schemaPathPrefix) {
  if (schema.type === "object" && schema.properties) {
    const entries = Object.entries(schema.properties).sort(([, left], [, right]) => {
      const l = left["x-display-order"] ?? Number.MAX_SAFE_INTEGER;
      const r = right["x-display-order"] ?? Number.MAX_SAFE_INTEGER;
      return l - r;
    });
    return entries.flatMap(([key, childSchema]) => {
      if (childSchema["x-hidden"]) return [];
      const field = pathPrefix ? `${pathPrefix}.${key}` : key;
      const schemaPath = schemaPathPrefix ? `${schemaPathPrefix}.${key}` : key;
      if (childSchema.type === "object" && childSchema.properties) {
        return buildSchemaFields(childSchema, field, schemaPath);
      }
      return [schemaField(field, schemaPath, childSchema, schema.required?.includes(key) ?? false)];
    });
  }
  return [];
}
function schemaField(field, schemaPath, schema, required) {
  const type = inferFieldType(schema);
  const descriptor = {
    field,
    label: schema.title ?? humanize(field.split(".").pop() ?? field),
    type,
    required,
    hint: schema.description,
    schemaPath,
    schema,
    componentHint: schema["x-a2ui-component"]
  };
  if (schema.enum) {
    descriptor.options = schema.enum.map((value) => ({
      value: String(value),
      label: String(value)
    }));
  }
  if (type === "markdown") {
    descriptor.render = createMarkdownDetailRenderer(field);
  }
  return descriptor;
}
function inferFieldType(schema) {
  const forced = schema["x-field-type"];
  if (forced === "markdown") return "markdown";
  if (schema.format === "markdown") return "markdown";
  if (schema.enum) return "enum";
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  switch (type) {
    case "boolean":
      return "boolean";
    case "integer":
    case "number":
      return "number";
    case "string":
      if (schema.format === "email") return "email";
      if (schema.format === "uri" || schema.format === "url") return "url";
      if (schema.format === "date" || schema.format === "date-time") return "date";
      return "text";
    case "array":
    case "object":
      return "json";
    default:
      return "text";
  }
}
function registryKey(entityType, field, schemaId) {
  return `${entityType}::${field ?? "*"}::${schemaId ?? "*"}`;
}
function humanize(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
function renderMarkdownBlock(block) {
  if (block.startsWith("# ")) return `<h1>${renderInlineMarkdown(block.slice(2))}</h1>`;
  if (block.startsWith("## ")) return `<h2>${renderInlineMarkdown(block.slice(3))}</h2>`;
  return `<p>${renderInlineMarkdown(block).replaceAll("\n", "<br/>")}</p>`;
}
function renderInlineMarkdown(block) {
  return block.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// src/ai-interop.ts
function exportGraphSnapshot(opts) {
  const payload = {
    scope: opts.scope,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    data: opts.data
  };
  return JSON.stringify(payload, null, opts.pretty === false ? 0 : 2);
}
function createGraphTool(handler) {
  return (input) => handler(input, {
    store: useGraphStore.getState(),
    queryOnce,
    exportGraphSnapshot
  });
}
function createSchemaGraphTool(handler) {
  return (input) => handler(input, {
    store: useGraphStore.getState(),
    queryOnce,
    exportGraphSnapshot,
    getEntityJsonSchema,
    exportGraphSnapshotWithSchemas
  });
}
var DEFAULT_STORAGE_KEY = "prometheus:graph";
var useGraphSyncStatusStore = zustand.create((set) => ({
  status: {
    phase: "idle",
    isOnline: true,
    isSynced: true,
    pendingActions: 0,
    lastHydratedAt: null,
    lastPersistedAt: null,
    storageKey: null,
    error: null
  },
  setStatus: (status) => set((state) => ({
    status: {
      ...state.status,
      ...status
    }
  }))
}));
var pendingActions = /* @__PURE__ */ new Map();
function useGraphSyncStatus() {
  return useGraphSyncStatusStore((state) => state.status);
}
async function persistGraphToStorage(opts) {
  const payload = {
    version: 1,
    snapshot: cloneGraphSnapshot(),
    pendingActions: opts.pendingActions ?? Array.from(pendingActions.values())
  };
  const json = JSON.stringify(payload);
  await opts.storage.set(opts.key, json);
  const persistedAt = (/* @__PURE__ */ new Date()).toISOString();
  useGraphSyncStatusStore.getState().setStatus({
    lastPersistedAt: persistedAt,
    storageKey: opts.key,
    pendingActions: payload.pendingActions.length
  });
  return {
    ok: true,
    key: opts.key,
    bytes: json.length,
    persistedAt
  };
}
async function hydrateGraphFromStorage(opts) {
  const raw = await opts.storage.get(opts.key);
  if (!raw) {
    return {
      ok: false,
      key: opts.key,
      hydratedAt: null,
      entityCounts: {},
      error: "No persisted graph snapshot found"
    };
  }
  try {
    const parsed = JSON.parse(raw);
    useGraphStore.setState(parsed.snapshot);
    pendingActions.clear();
    for (const action of parsed.pendingActions ?? []) pendingActions.set(action.id, action);
    const hydratedAt = (/* @__PURE__ */ new Date()).toISOString();
    useGraphSyncStatusStore.getState().setStatus({
      lastHydratedAt: hydratedAt,
      storageKey: opts.key,
      pendingActions: pendingActions.size,
      error: null
    });
    return {
      ok: true,
      key: opts.key,
      hydratedAt,
      entityCounts: Object.fromEntries(
        Object.entries(parsed.snapshot.entities).map(([type, entities]) => [type, Object.keys(entities).length])
      ),
      pendingActions: Array.from(pendingActions.values())
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    useGraphSyncStatusStore.getState().setStatus({
      phase: "error",
      error: message,
      storageKey: opts.key
    });
    return {
      ok: false,
      key: opts.key,
      hydratedAt: null,
      entityCounts: {},
      error: message
    };
  }
}
function startLocalFirstGraph(opts) {
  const key = opts.key ?? DEFAULT_STORAGE_KEY;
  const persistDebounceMs = opts.persistDebounceMs ?? 50;
  const statusStore = useGraphSyncStatusStore.getState();
  statusStore.setStatus({
    phase: "hydrating",
    storageKey: key,
    isOnline: opts.onlineSource?.getIsOnline() ?? getDefaultOnlineSource().getIsOnline(),
    isSynced: pendingActions.size === 0,
    error: null
  });
  let persistTimer = null;
  const schedulePersist = () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      void persistGraphToStorage({ storage: opts.storage, key });
    }, persistDebounceMs);
  };
  const graphUnsub = useGraphStore.subscribe(() => {
    schedulePersist();
  });
  const actionUnsub = subscribeGraphActionEvents((event) => {
    if (event.type === "enqueued") pendingActions.set(event.record.id, event.record);
    if (event.type === "settled") pendingActions.delete(event.record.id);
    useGraphSyncStatusStore.getState().setStatus({
      pendingActions: pendingActions.size,
      isSynced: pendingActions.size === 0
    });
    schedulePersist();
  });
  const onlineSource = opts.onlineSource ?? getDefaultOnlineSource();
  const onlineUnsub = onlineSource.subscribe((online) => {
    useGraphSyncStatusStore.getState().setStatus({
      isOnline: online,
      phase: online ? "ready" : "offline"
    });
  });
  const ready = (async () => {
    const hydrated = await hydrateGraphFromStorage({ storage: opts.storage, key });
    if (opts.replayPendingActions && hydrated.ok && pendingActions.size > 0) {
      useGraphSyncStatusStore.getState().setStatus({
        phase: "syncing",
        isSynced: false
      });
      const policy = resolveRetryPolicy(opts.retryPolicy);
      for (const action of Array.from(pendingActions.values())) {
        await replayActionWithRetry(action, policy);
        pendingActions.delete(action.id);
      }
      await persistGraphToStorage({ storage: opts.storage, key });
    }
    const online = onlineSource.getIsOnline();
    useGraphSyncStatusStore.getState().setStatus({
      phase: online ? "ready" : "offline",
      isOnline: online,
      isSynced: pendingActions.size === 0,
      pendingActions: pendingActions.size
    });
  })();
  return {
    ready,
    dispose() {
      graphUnsub();
      actionUnsub();
      onlineUnsub();
      if (persistTimer) clearTimeout(persistTimer);
    },
    async persistNow() {
      await persistGraphToStorage({ storage: opts.storage, key });
    },
    hydrate() {
      return hydrateGraphFromStorage({ storage: opts.storage, key });
    },
    getStatus() {
      return useGraphSyncStatusStore.getState().status;
    }
  };
}
function cloneGraphSnapshot() {
  const state = useGraphStore.getState();
  return {
    entities: structuredClone(state.entities),
    patches: structuredClone(state.patches),
    entityStates: structuredClone(state.entityStates),
    syncMetadata: structuredClone(state.syncMetadata),
    lists: structuredClone(state.lists)
  };
}
function resolveRetryPolicy(policy) {
  return {
    maxAttempts: policy?.maxAttempts ?? 5,
    initialDelayMs: policy?.initialDelayMs ?? 500,
    maxDelayMs: policy?.maxDelayMs ?? 3e4,
    backoffFactor: policy?.backoffFactor ?? 2,
    jitter: policy?.jitter ?? "equal",
    poisonHandler: policy?.poisonHandler
  };
}
function computeDelay(policy, attempt) {
  const base = Math.min(
    policy.initialDelayMs * Math.pow(policy.backoffFactor, Math.max(0, attempt - 1)),
    policy.maxDelayMs
  );
  switch (policy.jitter) {
    case "none":
      return base;
    case "full":
      return Math.random() * base;
    case "equal":
    default:
      return base / 2 + Math.random() * (base / 2);
  }
}
function sleep(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
}
async function replayActionWithRetry(action, policy) {
  let lastError = null;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      await replayRegisteredGraphAction(action);
      return { ok: true };
    } catch (error) {
      lastError = error;
      if (attempt >= policy.maxAttempts) break;
      await sleep(computeDelay(policy, attempt));
    }
  }
  try {
    await policy.poisonHandler?.(action, lastError);
  } catch {
  }
  return { ok: false, poisoned: true, error: lastError };
}
function getDefaultOnlineSource() {
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    return {
      getIsOnline: () => window.navigator.onLine,
      subscribe: (listener) => {
        const onlineHandler = () => listener(true);
        const offlineHandler = () => listener(false);
        window.addEventListener("online", onlineHandler);
        window.addEventListener("offline", offlineHandler);
        return () => {
          window.removeEventListener("online", onlineHandler);
          window.removeEventListener("offline", offlineHandler);
        };
      }
    };
  }
  return {
    getIsOnline: () => true,
    subscribe: () => () => {
    }
  };
}

// src/engine.ts
function serializeKey(key) {
  return JSON.stringify(key, (_, v) => v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v);
}
function sleep2(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
var inflight = /* @__PURE__ */ new Map();
function dedupe(key, fn) {
  if (inflight.has(key)) return inflight.get(key);
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
var subscriberStatsListeners = /* @__PURE__ */ new Set();
function emitSubscriberStatsChange() {
  for (const cb of subscriberStatsListeners) cb();
}
var subscribers = /* @__PURE__ */ new Map();
function registerSubscriber(key) {
  const token = Symbol(key);
  if (!subscribers.has(key)) subscribers.set(key, /* @__PURE__ */ new Set());
  subscribers.get(key).add(token);
  emitSubscriberStatsChange();
  return token;
}
function unregisterSubscriber(key, token) {
  const set = subscribers.get(key);
  if (!set) return;
  set.delete(token);
  if (set.size === 0) subscribers.delete(key);
  emitSubscriberStatsChange();
}
function hasSubscribers(key) {
  return (subscribers.get(key)?.size ?? 0) > 0;
}
var DEFAULT_OPTIONS = {
  defaultStaleTime: 3e4,
  defaultGcTime: 3e5,
  gcInterval: 6e4,
  maxRetries: 3,
  retryBaseDelay: 1e3,
  revalidateOnFocus: true,
  revalidateOnReconnect: true
};
var engineOptions = { ...DEFAULT_OPTIONS };
function subscribeSubscriberStats(onChange) {
  subscriberStatsListeners.add(onChange);
  return () => subscriberStatsListeners.delete(onChange);
}
function getActiveSubscriberCount() {
  let n = 0;
  for (const set of subscribers.values()) n += set.size;
  return n;
}
var gcIntervalId = null;
function runGarbageCollection() {
  const store = useGraphStore.getState();
  const { defaultGcTime: gcTime } = getEngineOptions();
  const now = Date.now();
  const toRemove = [];
  for (const type of Object.keys(store.entities)) {
    const bucket = store.entities[type];
    if (!bucket) continue;
    for (const id of Object.keys(bucket)) {
      const key = `${type}:${id}`;
      if (hasSubscribers(key)) continue;
      const patch = store.patches[type]?.[id];
      if (patch !== void 0 && Object.keys(patch).length > 0) continue;
      const entityState = store.entityStates[key];
      if (entityState?.isFetching) continue;
      const lastFetched = entityState?.lastFetched;
      if (lastFetched == null) continue;
      if (now - lastFetched <= gcTime) continue;
      toRemove.push({ type, id });
    }
  }
  for (const { type, id } of toRemove) {
    store.removeEntity(type, id);
    store.removeIdFromAllLists(type, id);
  }
}
function stopGarbageCollector() {
  if (gcIntervalId != null && typeof clearInterval !== "undefined") {
    clearInterval(gcIntervalId);
    gcIntervalId = null;
  }
}
function startGarbageCollector() {
  stopGarbageCollector();
  if (typeof window === "undefined" || typeof setInterval === "undefined") return () => {
  };
  gcIntervalId = setInterval(() => runGarbageCollection(), getEngineOptions().gcInterval);
  return () => stopGarbageCollector();
}
function restartGarbageCollector() {
  startGarbageCollector();
}
function configureEngine(opts) {
  engineOptions = { ...DEFAULT_OPTIONS, ...opts };
  restartGarbageCollector();
}
function getEngineOptions() {
  return engineOptions;
}
async function fetchEntity(opts, engineOpts) {
  const { type, id, fetch: fetch2, normalize, sideEffects, idField = "id" } = opts;
  if (!id) return;
  useGraphStore.getState().setEntityFetching(type, id, true);
  const attempt = async (retries) => {
    try {
      const raw = await fetch2(id);
      const normalized = normalize(raw);
      const resolvedId = normalized[idField] ?? id;
      useGraphStore.getState().upsertEntity(type, resolvedId, normalized);
      useGraphStore.getState().setEntityFetched(type, resolvedId);
      if (sideEffects) sideEffects(raw, useGraphStore);
      opts.onSuccess?.(normalized);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (retries < engineOpts.maxRetries) {
        await sleep2(engineOpts.retryBaseDelay * Math.pow(2, retries));
        return attempt(retries + 1);
      }
      useGraphStore.getState().setEntityError(type, id, error.message);
      opts.onError?.(error);
    }
  };
  await dedupe(`${type}:${id}`, () => attempt(0));
}
async function fetchList(opts, params, engineOpts, isLoadMore = false) {
  const { type, queryKey, fetch: fetch2, normalize, sideEffects, mode = "replace" } = opts;
  const key = serializeKey(queryKey);
  const store = useGraphStore.getState();
  if (isLoadMore) store.setListFetchingMore(key, true);
  else store.setListFetching(key, true);
  const attempt = async (retries) => {
    try {
      const response = await fetch2(params);
      const normalized = response.items.map(normalize);
      useGraphStore.getState().upsertEntities(type, normalized.map(({ id, data }) => ({ id, data })));
      for (const { id } of normalized) useGraphStore.getState().setEntityFetched(type, id);
      const ids = normalized.map(({ id }) => id);
      const meta = { total: response.total ?? null, nextCursor: response.nextCursor ?? null, prevCursor: response.prevCursor ?? null, hasNextPage: response.hasNextPage ?? !!response.nextCursor, hasPrevPage: response.hasPrevPage ?? !!response.prevCursor, currentPage: response.page ?? null, pageSize: response.pageSize ?? null };
      if (mode === "append" && isLoadMore) useGraphStore.getState().appendListResult(key, ids, meta);
      else useGraphStore.getState().setListResult(key, ids, meta);
      if (sideEffects) sideEffects(response.items, useGraphStore);
      opts.onSuccess?.(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (retries < engineOpts.maxRetries) {
        await sleep2(engineOpts.retryBaseDelay * Math.pow(2, retries));
        return attempt(retries + 1);
      }
      useGraphStore.getState().setListError(key, error.message);
      opts.onError?.(error);
    }
  };
  await dedupe(isLoadMore ? `${key}:more` : key, () => attempt(0));
}
var focusListenerAttached = false;
function attachGlobalListeners() {
  if (typeof window === "undefined" || focusListenerAttached) return;
  focusListenerAttached = true;
  restartGarbageCollector();
  const revalidateAll = () => {
    const state = useGraphStore.getState();
    for (const key of subscribers.keys()) {
      if (!hasSubscribers(key)) continue;
      const colonIdx = key.indexOf(":");
      if (colonIdx === -1) continue;
      const type = key.slice(0, colonIdx);
      const id = key.slice(colonIdx + 1);
      state.setEntityStale(type, id, true);
    }
  };
  if (engineOptions.revalidateOnFocus) {
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") revalidateAll();
    });
    window.addEventListener("focus", revalidateAll);
  }
  if (engineOptions.revalidateOnReconnect) window.addEventListener("online", revalidateAll);
}
function collectGraphDevStats(entities, patches, entityStates, listsState) {
  const entityCounts = {};
  let totalEntities = 0;
  for (const type of Object.keys(entities)) {
    const bucket = entities[type];
    if (!bucket) continue;
    const n = Object.keys(bucket).length;
    if (n > 0) entityCounts[type] = n;
    totalEntities += n;
  }
  const listKeys = Object.keys(listsState);
  const listCount = listKeys.length;
  const patchedEntities = [];
  for (const type of Object.keys(patches)) {
    const bucket = patches[type];
    if (!bucket) continue;
    for (const id of Object.keys(bucket)) {
      const p = bucket[id];
      if (p && Object.keys(p).length > 0) patchedEntities.push({ type, id });
    }
  }
  const staleEntities = [];
  const fetchingEntities = [];
  for (const key of Object.keys(entityStates)) {
    const colon = key.indexOf(":");
    if (colon === -1) continue;
    const type = key.slice(0, colon);
    const id = key.slice(colon + 1);
    const es = entityStates[key];
    if (es.stale) staleEntities.push({ type, id });
    if (es.isFetching) fetchingEntities.push({ type, id });
  }
  const lists = listKeys.map((key) => ({
    key,
    idCount: listsState[key]?.ids.length ?? 0,
    isFetching: Boolean(listsState[key]?.isFetching || listsState[key]?.isFetchingMore),
    isStale: Boolean(listsState[key]?.stale)
  }));
  return {
    entityCounts,
    totalEntities,
    listCount,
    patchedEntities,
    staleEntities,
    fetchingEntities,
    lists
  };
}
function subscriberCountServerSnapshot() {
  return 0;
}
function useGraphDevTools() {
  const subscriberCount = React6.useSyncExternalStore(
    subscribeSubscriberStats,
    getActiveSubscriberCount,
    subscriberCountServerSnapshot
  );
  const entities = zustand.useStore(useGraphStore, (state) => state.entities);
  const patches = zustand.useStore(useGraphStore, (state) => state.patches);
  const entityStates = zustand.useStore(useGraphStore, (state) => state.entityStates);
  const listsState = zustand.useStore(useGraphStore, (state) => state.lists);
  const graphPart = React6.useMemo(
    () => collectGraphDevStats(entities, patches, entityStates, listsState),
    [entities, patches, entityStates, listsState]
  );
  return { ...graphPart, subscriberCount };
}
var listenersAttached = false;
function ensureListeners() {
  if (!listenersAttached) {
    attachGlobalListeners();
    listenersAttached = true;
  }
}
function useEntity(opts) {
  const { type, id, staleTime = getEngineOptions().defaultStaleTime, enabled = true } = opts;
  ensureListeners();
  const fetchRef = React6.useRef(opts.fetch);
  fetchRef.current = opts.fetch;
  const normalizeRef = React6.useRef(opts.normalize);
  normalizeRef.current = opts.normalize;
  const dataSelector = React6.useCallback((state) => {
    if (!id) return null;
    return state.readEntitySnapshot(type, id);
  }, [id, type]);
  const data = zustand.useStore(useGraphStore, shallow.useShallow(dataSelector));
  const entityState = zustand.useStore(useGraphStore, React6.useCallback(
    (state) => state.entityStates[`${type}:${id}`] ?? EMPTY_ENTITY_STATE,
    [type, id]
  ));
  const doFetch = React6.useCallback(() => {
    if (!id || !enabled) return;
    fetchEntity({ type, id, fetch: fetchRef.current, normalize: normalizeRef.current }, getEngineOptions());
  }, [id, enabled, type]);
  React6.useEffect(() => {
    if (!id || !enabled) return;
    const token = registerSubscriber(`${type}:${id}`);
    const state = useGraphStore.getState();
    const existingState = state.entityStates[`${type}:${id}`];
    const hasData = !!state.entities[type]?.[id];
    const isStale = !existingState?.lastFetched || existingState.stale || Date.now() - (existingState.lastFetched ?? 0) > staleTime;
    if (!hasData || isStale) doFetch();
    return () => unregisterSubscriber(`${type}:${id}`, token);
  }, [id, type, enabled, staleTime, doFetch]);
  React6.useEffect(() => {
    if (entityState.stale && id && enabled && !entityState.isFetching) doFetch();
  }, [entityState.stale, id, enabled, entityState.isFetching, doFetch]);
  return { data, isLoading: !data && entityState.isFetching, isFetching: entityState.isFetching, error: entityState.error, isStale: entityState.stale, refetch: doFetch };
}
function useEntityList(opts) {
  const { type, queryKey, staleTime = getEngineOptions().defaultStaleTime, enabled = true, mode = "replace" } = opts;
  ensureListeners();
  const key = React6.useMemo(() => serializeKey(queryKey), [queryKey]);
  const fetchRef = React6.useRef(opts.fetch);
  fetchRef.current = opts.fetch;
  const normalizeRef = React6.useRef(opts.normalize);
  normalizeRef.current = opts.normalize;
  const listState = zustand.useStore(useGraphStore, React6.useCallback((state) => state.lists[key] ?? EMPTY_LIST_STATE, [key]));
  const itemsSelector = React6.useCallback((state) => {
    const ids = state.lists[key]?.ids ?? EMPTY_IDS;
    return ids.map((id) => state.readEntitySnapshot(type, id)).filter((x) => x !== null);
  }, [key, type]);
  const items = zustand.useStore(useGraphStore, shallow.useShallow(itemsSelector));
  const doFetch = React6.useCallback((params = {}) => {
    if (!enabled) return;
    fetchList({ type, queryKey, mode, fetch: fetchRef.current, normalize: normalizeRef.current }, params, getEngineOptions(), false);
  }, [enabled, type, queryKey, mode]);
  const fetchNextPage = React6.useCallback(() => {
    if (!listState.hasNextPage || listState.isFetchingMore || !enabled) return;
    fetchList({ type, queryKey, mode, fetch: fetchRef.current, normalize: normalizeRef.current }, { cursor: listState.nextCursor ?? void 0, page: (listState.currentPage ?? 0) + 1, pageSize: listState.pageSize ?? void 0 }, getEngineOptions(), true);
  }, [listState.hasNextPage, listState.isFetchingMore, listState.nextCursor, listState.currentPage, listState.pageSize, enabled, type, queryKey, mode]);
  React6.useEffect(() => {
    if (!enabled) return;
    const state = useGraphStore.getState();
    const existing = state.lists[key];
    const isStale = !existing?.lastFetched || existing.stale || Date.now() - (existing.lastFetched ?? 0) > staleTime;
    if (!existing || isStale) doFetch({ page: 1, pageSize: listState.pageSize ?? void 0 });
  }, [key, enabled, staleTime, doFetch, listState.pageSize]);
  React6.useEffect(() => {
    if (listState.stale && enabled && !listState.isFetching) doFetch();
  }, [listState.stale, enabled, listState.isFetching, doFetch]);
  return { items, ids: listState.ids, isLoading: listState.ids.length === 0 && listState.isFetching, isFetching: listState.isFetching, isFetchingMore: listState.isFetchingMore, error: listState.error, hasNextPage: listState.hasNextPage, hasPrevPage: listState.hasPrevPage, total: listState.total, currentPage: listState.currentPage, fetchNextPage, refetch: doFetch };
}
function useEntityMutation(opts) {
  const [state, setState] = React6.useState({ isPending: false, isSuccess: false, isError: false, error: null });
  const optsRef = React6.useRef(opts);
  optsRef.current = opts;
  const mutate = React6.useCallback(async (input) => {
    const { type, mutate: apiFn, normalize, optimistic, invalidateLists, invalidateEntities, onSuccess, onError } = optsRef.current;
    setState({ isPending: true, isSuccess: false, isError: false, error: null });
    let rollback = null;
    if (optimistic) {
      const opt = optimistic(input);
      if (opt) {
        const { id, patch } = opt;
        const store = useGraphStore.getState();
        const previous = { ...store.patches[type]?.[id] };
        const previousSync = store.syncMetadata[`${type}:${id}`];
        store.patchEntity(type, id, patch);
        store.setEntitySyncMetadata(type, id, { synced: false, origin: "optimistic", updatedAt: Date.now() });
        rollback = () => {
          const currentStore = useGraphStore.getState();
          if (Object.keys(previous).length > 0) currentStore.patchEntity(type, id, previous);
          else currentStore.clearPatch(type, id);
          if (previousSync) currentStore.setEntitySyncMetadata(type, id, previousSync);
          else currentStore.clearEntitySyncMetadata(type, id);
        };
      }
    }
    try {
      const result = await apiFn(input);
      if (normalize) {
        const { id, data } = normalize(result, input);
        const store = useGraphStore.getState();
        store.upsertEntity(type, id, data);
        store.setEntitySyncMetadata(type, id, { synced: true, origin: "server", updatedAt: Date.now() });
        if (optimistic) {
          const opt = optimistic(input);
          if (opt) store.clearPatch(type, opt.id);
        }
      }
      if (invalidateLists) for (const k of invalidateLists) useGraphStore.getState().invalidateLists(k);
      if (invalidateEntities) for (const { type: t, id } of invalidateEntities) useGraphStore.getState().invalidateEntity(t, id);
      setState({ isPending: false, isSuccess: true, isError: false, error: null });
      onSuccess?.(result, input);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      rollback?.();
      setState({ isPending: false, isSuccess: false, isError: true, error: error.message });
      onError?.(error, input);
      return null;
    }
  }, []);
  const trigger = React6.useCallback((input) => {
    void mutate(input);
  }, [mutate]);
  const reset = React6.useCallback(() => setState({ isPending: false, isSuccess: false, isError: false, error: null }), []);
  return { mutate, trigger, reset, state };
}
function useEntityAugment(type, id) {
  const patch = zustand.useStore(useGraphStore, React6.useCallback((state) => id ? state.patches[type]?.[id] ?? null : null, [type, id]));
  const augment = React6.useCallback((fields) => {
    if (!id) return;
    useGraphStore.getState().patchEntity(type, id, fields);
  }, [type, id]);
  const unaugment = React6.useCallback((keys) => {
    if (!id) return;
    useGraphStore.getState().unpatchEntity(type, id, keys);
  }, [type, id]);
  const clear = React6.useCallback(() => {
    if (!id) return;
    useGraphStore.getState().clearPatch(type, id);
  }, [type, id]);
  return { patch, augment, unaugment, clear };
}
var suspenseEntityPromises = /* @__PURE__ */ new Map();
var suspenseListPromises = /* @__PURE__ */ new Map();
function getEntitySuspensePromise(type, id) {
  const key = `${type}:${id}`;
  const existing = suspenseEntityPromises.get(key);
  if (existing) return existing;
  let unsub = null;
  let settled = false;
  const promise = new Promise((resolve, reject) => {
    const settle = (fn) => {
      if (settled) return;
      settled = true;
      unsub?.();
      unsub = null;
      fn();
    };
    const inspect = (state) => {
      if (settled) return;
      const hasData = !!state.entities[type]?.[id];
      const es = state.entityStates[key];
      if (hasData) settle(() => resolve());
      else if (es != null && es.error != null && !es.isFetching) {
        const msg = es.error;
        settle(() => reject(new Error(msg)));
      }
    };
    inspect(useGraphStore.getState());
    if (!settled) unsub = useGraphStore.subscribe((state) => inspect(state));
  });
  const tracked = promise.finally(() => {
    suspenseEntityPromises.delete(key);
  });
  suspenseEntityPromises.set(key, tracked);
  return tracked;
}
function getListSuspensePromise(listKey) {
  const existing = suspenseListPromises.get(listKey);
  if (existing) return existing;
  let unsub = null;
  let settled = false;
  const promise = new Promise((resolve, reject) => {
    const settle = (fn) => {
      if (settled) return;
      settled = true;
      unsub?.();
      unsub = null;
      fn();
    };
    const inspect = (state) => {
      if (settled) return;
      const list = state.lists[listKey] ?? EMPTY_LIST_STATE;
      if (list.ids.length > 0) settle(() => resolve());
      else if (list.error != null && !list.isFetching) {
        const msg = list.error;
        settle(() => reject(new Error(msg)));
      } else if (list.ids.length === 0 && !list.isFetching && list.lastFetched != null) settle(() => resolve());
    };
    inspect(useGraphStore.getState());
    if (!settled) unsub = useGraphStore.subscribe((state) => inspect(state));
  });
  const tracked = promise.finally(() => {
    suspenseListPromises.delete(listKey);
  });
  suspenseListPromises.set(listKey, tracked);
  return tracked;
}
function useSuspenseEntity(opts) {
  const result = useEntity(opts);
  const { type, id } = opts;
  if (result.isLoading) {
    if (!id) throw new Error("useSuspenseEntity requires a non-null entity id");
    throw getEntitySuspensePromise(type, id);
  }
  if (result.error != null && result.data == null) {
    throw new Error(result.error);
  }
  if (result.data == null) {
    throw new Error(!id ? "useSuspenseEntity requires a non-null entity id" : "Entity not found");
  }
  return {
    data: result.data,
    isFetching: result.isFetching,
    isStale: result.isStale,
    refetch: result.refetch
  };
}
function useSuspenseEntityList(opts) {
  const key = React6.useMemo(() => serializeKey(opts.queryKey), [opts.queryKey]);
  const result = useEntityList(opts);
  if (result.isLoading) throw getListSuspensePromise(key);
  if (result.error != null && result.items.length === 0) {
    throw new Error(result.error);
  }
  const { isLoading: _isLoading, ...rest } = result;
  return rest;
}

// src/view/evaluator.ts
function matchesFilter(entity, filter) {
  if (Array.isArray(filter)) return filter.every((clause) => matchesClause(entity, clause));
  return matchesGroup(entity, filter);
}
function matchesGroup(entity, group) {
  const { logic, clauses } = group;
  if (logic === "and") return clauses.every((c) => "logic" in c ? matchesGroup(entity, c) : matchesClause(entity, c));
  return clauses.some((c) => "logic" in c ? matchesGroup(entity, c) : matchesClause(entity, c));
}
function matchesClause(entity, clause) {
  const { field, op, value, predicate } = clause;
  const fv = getNestedValue(entity, field);
  switch (op) {
    case "eq":
      return fv === value;
    case "neq":
      return fv !== value;
    case "gt":
      return fv > value;
    case "gte":
      return fv >= value;
    case "lt":
      return fv < value;
    case "lte":
      return fv <= value;
    case "in":
      return Array.isArray(value) && value.includes(fv);
    case "nin":
      return Array.isArray(value) && !value.includes(fv);
    case "isNull":
      return fv == null;
    case "isNotNull":
      return fv != null;
    case "contains":
      return typeof fv === "string" && typeof value === "string" && fv.toLowerCase().includes(value.toLowerCase());
    case "startsWith":
      return typeof fv === "string" && typeof value === "string" && fv.toLowerCase().startsWith(value.toLowerCase());
    case "endsWith":
      return typeof fv === "string" && typeof value === "string" && fv.toLowerCase().endsWith(value.toLowerCase());
    case "between": {
      const [lo, hi] = value;
      return fv >= lo && fv <= hi;
    }
    case "arrayContains":
      return Array.isArray(fv) && fv.includes(value);
    case "arrayOverlaps":
      return Array.isArray(fv) && Array.isArray(value) && value.some((v) => fv.includes(v));
    case "matches":
      return typeof fv === "string" && new RegExp(value).test(fv);
    case "custom":
      return predicate ? predicate(fv, entity) : true;
    default:
      return true;
  }
}
function matchesSearch(entity, query, fields) {
  if (!query.trim()) return true;
  const lq = query.toLowerCase();
  return fields.some((field) => {
    const v = getNestedValue(entity, field);
    return typeof v === "string" && v.toLowerCase().includes(lq);
  });
}
function compareEntities(a, b, sort) {
  for (const clause of sort) {
    const r = compareByClause(a, b, clause);
    if (r !== 0) return r;
  }
  return 0;
}
function compareByClause(a, b, clause) {
  const { field, direction, nulls = "last", comparator } = clause;
  const av = getNestedValue(a, field);
  const bv = getNestedValue(b, field);
  const aNull = av == null;
  const bNull = bv == null;
  if (aNull && bNull) return 0;
  if (aNull) return nulls === "first" ? -1 : 1;
  if (bNull) return nulls === "first" ? 1 : -1;
  let cmp;
  if (comparator) cmp = comparator(av, bv);
  else if (typeof av === "string" && typeof bv === "string") cmp = av.localeCompare(bv, void 0, { sensitivity: "base", numeric: true });
  else if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
  else cmp = String(av).localeCompare(String(bv));
  return direction === "desc" ? -cmp : cmp;
}
function findInsertionIndex(entity, sortedIds, getEntity, sort) {
  let lo = 0;
  let hi = sortedIds.length;
  while (lo < hi) {
    const mid = lo + hi >>> 1;
    const me = getEntity(sortedIds[mid]);
    if (!me) {
      lo = mid + 1;
      continue;
    }
    if (compareEntities(entity, me, sort) <= 0) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
function applyView(ids, getEntity, filter, sort, search) {
  let entries = [];
  for (const id of ids) {
    const entity = getEntity(id);
    if (!entity) continue;
    entries.push({ id, entity });
  }
  if (filter && entries.length > 0) entries = entries.filter(({ entity }) => matchesFilter(entity, filter));
  if (search?.query) entries = entries.filter(({ entity }) => matchesSearch(entity, search.query, search.fields));
  if (sort && sort.length > 0) entries.sort((a, b) => compareEntities(a.entity, b.entity, sort));
  return entries.map((e) => e.id);
}
function checkCompleteness(loadedCount, total, hasNextPage) {
  if (!hasNextPage && total !== null && loadedCount >= total) return { isComplete: true, reason: "all-loaded" };
  if (hasNextPage) return { isComplete: false, reason: "has-more-pages" };
  return { isComplete: true, reason: "no-more-pages" };
}
function getNestedValue(obj, path) {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return void 0;
    current = current[part];
  }
  return current;
}

// src/view/prisma-compile.ts
function nestWhereField(parts, leaf) {
  if (parts.length === 0) return {};
  if (parts.length === 1) return { [parts[0]]: leaf };
  return { [parts[0]]: nestWhereField(parts.slice(1), leaf) };
}
function clauseToPrismaLeaf(c) {
  switch (c.op) {
    case "eq":
      return { equals: c.value };
    case "neq":
      return { not: c.value };
    case "gt":
      return { gt: c.value };
    case "gte":
      return { gte: c.value };
    case "lt":
      return { lt: c.value };
    case "lte":
      return { lte: c.value };
    case "contains":
      return { contains: c.value, mode: "insensitive" };
    case "startsWith":
      return { startsWith: c.value, mode: "insensitive" };
    case "endsWith":
      return { endsWith: c.value, mode: "insensitive" };
    case "in":
      return { in: c.value };
    case "nin":
      return { notIn: c.value };
    case "arrayContains":
      return { has: c.value };
    case "between":
    case "arrayOverlaps":
    case "matches":
    case "custom":
    default:
      return null;
  }
}
function clauseToPrismaEntry(c) {
  const parts = c.field.split(".").filter(Boolean);
  if (parts.length === 0) return null;
  if (c.op === "isNull") {
    const equalsNull = c.value === void 0 || c.value === true;
    return nestWhereField(parts, equalsNull ? null : { not: null });
  }
  if (c.op === "isNotNull") {
    return nestWhereField(parts, { not: null });
  }
  const leaf = clauseToPrismaLeaf(c);
  if (leaf === null) return null;
  return nestWhereField(parts, leaf);
}
function groupToPrismaWhere(g) {
  const parts = [];
  for (const item of g.clauses) {
    if ("logic" in item) {
      const nested = groupToPrismaWhere(item);
      if (Object.keys(nested).length > 0) parts.push(nested);
    } else {
      const entry = clauseToPrismaEntry(item);
      if (entry) parts.push(entry);
    }
  }
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return g.logic === "or" ? { OR: parts } : { AND: parts };
}
function toPrismaWhere(filter) {
  if (Array.isArray(filter)) {
    const parts = [];
    for (const item of filter) {
      const entry = clauseToPrismaEntry(item);
      if (entry) parts.push(entry);
    }
    if (parts.length === 0) return {};
    if (parts.length === 1) return parts[0];
    return { AND: parts };
  }
  return groupToPrismaWhere(filter);
}
function toPrismaOrderBy(sort) {
  return sort.map((s) => ({ [s.field]: s.direction }));
}

// src/view/types.ts
function toRestParams(view) {
  const params = {};
  if (view.filter) {
    const clauses = flattenClauses(view.filter);
    for (const c of clauses) {
      if (c.op === "custom") continue;
      const key = c.op === "eq" ? c.field : `${c.field}[${c.op}]`;
      params[key] = Array.isArray(c.value) ? c.value.join(",") : String(c.value ?? "");
    }
  }
  if (view.sort) params["sort"] = view.sort.map((s) => `${s.direction === "desc" ? "-" : ""}${s.field}`).join(",");
  if (view.search?.query) params["q"] = view.search.query;
  return params;
}
function toSQLClauses(view) {
  const params = [];
  let paramIdx = 1;
  function clauseToSQL(c) {
    const col = `"${c.field}"`;
    switch (c.op) {
      case "eq":
        params.push(c.value);
        return `${col} = $${paramIdx++}`;
      case "neq":
        params.push(c.value);
        return `${col} != $${paramIdx++}`;
      case "gt":
        params.push(c.value);
        return `${col} > $${paramIdx++}`;
      case "gte":
        params.push(c.value);
        return `${col} >= $${paramIdx++}`;
      case "lt":
        params.push(c.value);
        return `${col} < $${paramIdx++}`;
      case "lte":
        params.push(c.value);
        return `${col} <= $${paramIdx++}`;
      case "in":
        params.push(c.value);
        return `${col} = ANY($${paramIdx++})`;
      case "nin":
        params.push(c.value);
        return `${col} != ALL($${paramIdx++})`;
      case "isNull":
        return `${col} IS NULL`;
      case "isNotNull":
        return `${col} IS NOT NULL`;
      case "contains":
        params.push(`%${c.value}%`);
        return `${col} ILIKE $${paramIdx++}`;
      case "startsWith":
        params.push(`${c.value}%`);
        return `${col} ILIKE $${paramIdx++}`;
      case "between": {
        const [lo, hi] = c.value;
        params.push(lo, hi);
        return `${col} BETWEEN $${paramIdx++} AND $${paramIdx++}`;
      }
      case "arrayContains":
        params.push(c.value);
        return `$${paramIdx++} = ANY(${col})`;
      default:
        return "TRUE";
    }
  }
  function groupToSQL(g) {
    const parts = g.clauses.map((c) => "logic" in c ? `(${groupToSQL(c)})` : clauseToSQL(c));
    return parts.join(` ${g.logic.toUpperCase()} `);
  }
  let where = "TRUE";
  if (view.filter) {
    if (Array.isArray(view.filter)) where = view.filter.map(clauseToSQL).join(" AND ") || "TRUE";
    else where = groupToSQL(view.filter) || "TRUE";
  }
  if (view.search?.query) {
    params.push(`%${view.search.query}%`);
    where += ` AND (${view.search.fields.map((f) => `"${f}"`).join(" || ' ' || ")}) ILIKE $${paramIdx++}`;
  }
  const orderBy = view.sort ? view.sort.map((s) => `"${s.field}" ${s.direction.toUpperCase()}${s.nulls ? ` NULLS ${s.nulls.toUpperCase()}` : ""}`).join(", ") : "";
  return { where, orderBy, params };
}
function toGraphQLVariables(view) {
  const result = {};
  if (view.filter) {
    const clauses = flattenClauses(view.filter);
    const where = {};
    for (const c of clauses) {
      if (c.op === "custom") continue;
      where[c.field] = { [`_${c.op}`]: c.value };
    }
    if (Object.keys(where).length) result.where = where;
  }
  if (view.sort) result.orderBy = view.sort.map((s) => ({ [s.field]: s.direction === "desc" ? "desc_nulls_last" : "asc_nulls_last" }));
  if (view.search?.query) result.search = view.search.query;
  return result;
}
function flattenClauses(filter) {
  if (Array.isArray(filter)) return filter;
  function walk(g) {
    return g.clauses.flatMap((c) => "logic" in c ? walk(c) : [c]);
  }
  return walk(filter);
}
function hasCustomPredicates(filter) {
  return flattenClauses(filter).some((c) => c.op === "custom");
}

// src/view/use-entity-view.ts
var EMPTY_ENTITY_BUCKET = {};
function useEntityView(opts) {
  const { type, baseQueryKey, mode: forcedMode, remoteFetch, remoteDebounce = 300, staleTime = getEngineOptions().defaultStaleTime, enabled = true, initialIds, initialTotal } = opts;
  const optsRef = React6.useRef(opts);
  optsRef.current = opts;
  const [liveView, setLiveView] = React6.useState(opts.view);
  const liveViewRef = React6.useRef(liveView);
  liveViewRef.current = liveView;
  const [isRemoteFetching, setIsRemoteFetching] = React6.useState(false);
  const [remoteError, setRemoteError] = React6.useState(null);
  const [remoteResultKey, setRemoteResultKey] = React6.useState(null);
  const debounceTimer = React6.useRef(null);
  const baseKey = React6.useMemo(() => serializeKey(baseQueryKey), [baseQueryKey]);
  const seededRef = React6.useRef(false);
  if (!seededRef.current && initialIds && initialIds.length > 0) {
    seededRef.current = true;
    const store = useGraphStore.getState();
    if (!store.lists[baseKey]) {
      store.setListResult(baseKey, initialIds, { total: initialTotal ?? null });
    }
  }
  const listState = zustand.useStore(
    useGraphStore,
    React6.useCallback((state) => state.lists[baseKey] ?? null, [baseKey])
  );
  const remoteListState = zustand.useStore(useGraphStore, React6.useCallback((state) => remoteResultKey ? state.lists[remoteResultKey] ?? null : null, [remoteResultKey]));
  const { isComplete } = React6.useMemo(() => {
    if (!listState) return { isComplete: false };
    return checkCompleteness(listState.ids.length, listState.total, listState.hasNextPage);
  }, [listState]);
  const completenessMode = React6.useMemo(() => {
    if (forcedMode) return forcedMode;
    if (liveView.filter && hasCustomPredicates(liveView.filter)) return "local";
    if (isComplete) return "local";
    if (!remoteFetch) return "local";
    return "hybrid";
  }, [forcedMode, isComplete, liveView.filter, remoteFetch]);
  const localViewIds = zustand.useStore(
    useGraphStore,
    shallow.useShallow((state) => {
      const list = state.lists[baseKey] ?? EMPTY_LIST_STATE;
      const sourceIds = completenessMode !== "remote" && remoteResultKey ? state.lists[remoteResultKey]?.ids ?? EMPTY_IDS : list.ids;
      const getEntity = (id) => state.readEntitySnapshot(type, id);
      return applyView(
        sourceIds,
        getEntity,
        liveView.filter,
        liveView.sort,
        liveView.search?.query ? { query: liveView.search.query, fields: liveView.search.fields } : null
      );
    })
  );
  const items = React6.useMemo(
    () => localViewIds.map((id) => useGraphStore.getState().readEntitySnapshot(type, id)).filter((item) => item !== null),
    [localViewIds, type]
  );
  const fireRemoteFetch = React6.useCallback(async (view, cursor) => {
    const { remoteFetch: rf, normalize: norm, baseQueryKey: bqk } = optsRef.current;
    if (!rf) return;
    const params = { rest: toRestParams(view), graphql: toGraphQLVariables(view), sql: toSQLClauses(view), view };
    const rKey = serializeKey([...bqk, "__view__", view, cursor]);
    setRemoteResultKey(rKey);
    setIsRemoteFetching(true);
    setRemoteError(null);
    const store = useGraphStore.getState();
    store.setListFetching(rKey, true);
    try {
      const response = await rf(params);
      const normalized = norm ? response.items.map(norm) : response.items.map((item) => ({ id: String(item.id), data: item }));
      store.upsertEntities(type, normalized.map(({ id, data }) => ({ id, data })));
      for (const { id } of normalized) store.setEntityFetched(type, id);
      store.setListResult(rKey, normalized.map(({ id }) => id), { total: response.total ?? null, nextCursor: response.nextCursor ?? null, hasNextPage: response.hasNextPage ?? !!response.nextCursor });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRemoteError(msg);
      store.setListError(rKey, msg);
    } finally {
      setIsRemoteFetching(false);
    }
  }, [type]);
  React6.useEffect(() => {
    if (!enabled || completenessMode === "local" || !remoteFetch) return;
    const searchQuery = liveView.search?.query ?? "";
    const minChars = liveView.search?.minChars ?? 2;
    if (searchQuery.length > 0 && searchQuery.length < minChars) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fireRemoteFetch(liveViewRef.current), remoteDebounce);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [liveView, completenessMode, enabled, remoteFetch, remoteDebounce, fireRemoteFetch]);
  React6.useEffect(() => {
    if (!enabled) return;
    const state = useGraphStore.getState();
    const existing = state.lists[baseKey];
    const isStale = !existing?.lastFetched || existing.stale || Date.now() - (existing.lastFetched ?? 0) > staleTime;
    if (!existing || isStale) fireRemoteFetch(liveViewRef.current);
  }, [baseKey, enabled, staleTime, fireRemoteFetch]);
  React6.useEffect(() => {
    const unsub = useGraphStore.subscribe((state) => state.entities[type] ?? EMPTY_ENTITY_BUCKET, (newEntities, prevEntities) => {
      const view = liveViewRef.current;
      const store = useGraphStore.getState();
      const list = store.lists[baseKey];
      if (!list) return;
      for (const id of /* @__PURE__ */ new Set([...Object.keys(newEntities), ...Object.keys(prevEntities)])) {
        const isPresent = id in newEntities;
        if (!isPresent) continue;
        const entity = newEntities[id];
        const merged = store.readEntitySnapshot(type, id) ?? entity;
        const matches = (!view.filter || matchesFilter(merged, view.filter)) && (!view.search?.query || matchesSearch(merged, view.search.query, view.search.fields));
        if (matches && !list.ids.includes(id)) {
          if (view.sort && view.sort.length > 0) {
            const idx = findInsertionIndex(merged, list.ids, (eid) => store.readEntitySnapshot(type, eid), view.sort);
            store.insertIdInList(baseKey, id, idx);
          } else store.insertIdInList(baseKey, id, "start");
        }
      }
    });
    return unsub;
  }, [type, baseKey]);
  const setView = React6.useCallback((partial) => setLiveView((prev) => ({ ...prev, ...partial })), []);
  const setFilter = React6.useCallback((filter) => setLiveView((prev) => ({ ...prev, filter: filter ?? void 0 })), []);
  const setSort = React6.useCallback((sort) => setLiveView((prev) => ({ ...prev, sort: sort ?? void 0 })), []);
  const setSearch = React6.useCallback((query) => setLiveView((prev) => ({ ...prev, search: prev.search ? { ...prev.search, query } : { query, fields: [] } })), []);
  const clearView = React6.useCallback(() => setLiveView({}), []);
  const fetchNextPage = React6.useCallback(() => {
    if (completenessMode === "local" || isRemoteFetching) return;
    fireRemoteFetch(liveViewRef.current, remoteListState?.nextCursor ?? void 0);
  }, [completenessMode, isRemoteFetching, remoteListState?.nextCursor, fireRemoteFetch]);
  const refetch = React6.useCallback(() => fireRemoteFetch(liveViewRef.current), [fireRemoteFetch]);
  const viewTotal = remoteListState?.total ?? (isComplete ? localViewIds.length : listState?.total ?? null);
  return {
    items,
    viewIds: localViewIds,
    viewTotal,
    isLoading: items.length === 0 && (listState?.isFetching ?? true) && !isRemoteFetching,
    isFetching: (listState?.isFetching ?? false) || isRemoteFetching,
    isRemoteFetching,
    isShowingLocalPending: completenessMode === "hybrid" && isRemoteFetching && items.length > 0,
    error: remoteError ?? listState?.error ?? null,
    hasNextPage: completenessMode === "local" ? false : remoteListState?.hasNextPage ?? listState?.hasNextPage ?? false,
    fetchNextPage,
    isLocallyComplete: isComplete,
    completenessMode,
    setView,
    setFilter,
    setSort,
    setSearch,
    clearView,
    refetch,
    isFetchingMore: remoteListState?.isFetching ?? false
  };
}

// src/crud/relations.ts
var schemaRegistry2 = /* @__PURE__ */ new Map();
function registerSchema(schema) {
  schemaRegistry2.set(schema.type, schema);
}
function getSchema(type) {
  return schemaRegistry2.get(type) ?? null;
}
function cascadeInvalidation(ctx) {
  const schema = schemaRegistry2.get(ctx.type);
  if (!schema) return;
  const store = useGraphStore.getState();
  if (schema.globalListKeys) for (const key of schema.globalListKeys) store.invalidateLists(key);
  if (!schema.relations) return;
  for (const [, relation] of Object.entries(schema.relations)) {
    switch (relation.cardinality) {
      case "belongsTo": {
        const prevFk = ctx.previous?.[relation.foreignKey];
        const nextFk = ctx.next?.[relation.foreignKey];
        if (prevFk && prevFk !== nextFk && relation.invalidateTargetLists) for (const kp of relation.invalidateTargetLists) store.invalidateLists((k) => k.startsWith(kp) && k.includes(prevFk));
        if (nextFk && relation.invalidateTargetLists) for (const kp of relation.invalidateTargetLists) store.invalidateLists((k) => k.startsWith(kp) && k.includes(nextFk));
        if (prevFk) store.invalidateEntity(relation.targetType, prevFk);
        if (nextFk) store.invalidateEntity(relation.targetType, nextFk);
        break;
      }
      case "hasMany":
        store.invalidateLists(serializeKey(relation.listKeyPrefix(ctx.id)));
        break;
      case "manyToMany": {
        const prevIds = ctx.previous?.[relation.localArrayField ?? ""];
        const nextIds = ctx.next?.[relation.localArrayField ?? ""];
        for (const relatedId of /* @__PURE__ */ new Set([...prevIds ?? [], ...nextIds ?? []])) store.invalidateLists(serializeKey(relation.listKeyPrefix(relatedId)));
        break;
      }
    }
  }
  for (const [, otherSchema] of schemaRegistry2) {
    if (!otherSchema.relations) continue;
    for (const [, rel] of Object.entries(otherSchema.relations)) {
      if (rel.targetType !== ctx.type) continue;
      if (rel.cardinality === "hasMany") store.invalidateLists(serializeKey(rel.listKeyPrefix(ctx.id)));
    }
  }
}
function readRelations(type, entity) {
  const schema = schemaRegistry2.get(type);
  if (!schema?.relations) return {};
  const store = useGraphStore.getState();
  const result = {};
  for (const [name, relation] of Object.entries(schema.relations)) {
    switch (relation.cardinality) {
      case "belongsTo": {
        const fkValue = entity[relation.foreignKey];
        result[name] = fkValue ? store.readEntity(relation.targetType, fkValue) : null;
        break;
      }
      case "hasMany": {
        const listKey = serializeKey(relation.listKeyPrefix(entity.id));
        const listState = store.lists[listKey];
        result[name] = listState ? listState.ids.map((id) => store.readEntity(relation.targetType, id)).filter(Boolean) : [];
        break;
      }
      case "manyToMany": {
        const ids = entity[relation.localArrayField ?? ""];
        result[name] = ids ? ids.map((id) => store.readEntity(relation.targetType, id)).filter(Boolean) : [];
        break;
      }
    }
  }
  return result;
}

// src/crud/use-entity-crud.ts
function useEntityCRUD(opts) {
  const { type, listQueryKey, listFetch, normalize, detailFetch, onCreate, onUpdate, onDelete, createDefaults = {}, initialView = {}, selectAfterCreate = true, clearSelectionAfterDelete = true } = opts;
  const optsRef = React6.useRef(opts);
  optsRef.current = opts;
  const [mode, setMode] = React6.useState("list");
  const [selectedId, setSelectedId] = React6.useState(null);
  const select = React6.useCallback((id) => {
    setSelectedId(id);
    setMode(id ? "detail" : "list");
  }, []);
  const openDetail = React6.useCallback((id) => {
    setSelectedId(id);
    setMode("detail");
  }, []);
  const list = useEntityView({ type, baseQueryKey: listQueryKey, view: initialView, remoteFetch: listFetch, normalize: (raw) => normalize(raw) });
  const { data: detail, isLoading: detailIsLoading, error: detailError } = useEntity({
    type,
    id: selectedId,
    fetch: detailFetch ?? ((id) => {
      const existing = useGraphStore.getState().readEntity(type, id);
      if (existing) return Promise.resolve(existing);
      return Promise.reject(new Error("No detailFetch"));
    }),
    normalize: (raw) => raw,
    enabled: !!selectedId
  });
  const relations = React6.useMemo(() => detail ? readRelations(type, detail) : {}, [type, detail]);
  const [editBuffer, setEditBuffer] = React6.useState({});
  const [isSaving, setIsSaving] = React6.useState(false);
  const [saveError, setSaveError] = React6.useState(null);
  React6.useEffect(() => {
    if (detail) setEditBuffer({ ...detail });
  }, [selectedId]);
  const setField = React6.useCallback((field, value) => setEditBuffer((prev) => setValueAtPath(prev, String(field), value)), []);
  const setFields = React6.useCallback((fields) => setEditBuffer((prev) => ({ ...prev, ...fields })), []);
  const resetBuffer = React6.useCallback(() => {
    const current = selectedId ? useGraphStore.getState().readEntity(type, selectedId) : null;
    setEditBuffer(current ? { ...current } : {});
  }, [type, selectedId]);
  const dirty = React6.useMemo(() => {
    if (!detail) return { changed: /* @__PURE__ */ new Set(), isDirty: false };
    const changed = collectDirtyPaths(editBuffer, detail);
    return { changed, isDirty: changed.size > 0 };
  }, [editBuffer, detail]);
  const startEdit = React6.useCallback((id) => {
    const targetId = id ?? selectedId;
    if (targetId) {
      setSelectedId(targetId);
      const entity = useGraphStore.getState().readEntity(type, targetId);
      setEditBuffer(entity ? { ...entity } : {});
    }
    setMode("edit");
  }, [selectedId, type]);
  const cancelEdit = React6.useCallback(() => {
    resetBuffer();
    setMode(selectedId ? "detail" : "list");
    setSaveError(null);
  }, [resetBuffer, selectedId]);
  const applyOptimistic = React6.useCallback(() => {
    if (!selectedId) return;
    const store = useGraphStore.getState();
    store.patchEntity(type, selectedId, editBuffer);
    store.setEntitySyncMetadata(type, selectedId, { synced: false, origin: "optimistic", updatedAt: Date.now() });
  }, [type, selectedId, editBuffer]);
  const save = React6.useCallback(async () => {
    if (!selectedId || !onUpdate) return null;
    setIsSaving(true);
    setSaveError(null);
    const store = useGraphStore.getState();
    const previous = store.readEntity(type, selectedId);
    const previousSync = store.syncMetadata[`${type}:${selectedId}`];
    store.upsertEntity(type, selectedId, editBuffer);
    store.setEntitySyncMetadata(type, selectedId, { synced: false, origin: "optimistic", updatedAt: Date.now() });
    try {
      const result = await onUpdate(selectedId, editBuffer);
      const { id, data } = normalize(result);
      store.replaceEntity(type, id, data);
      store.clearPatch(type, id);
      store.setEntitySyncMetadata(type, id, { synced: true, origin: "server", updatedAt: Date.now() });
      cascadeInvalidation({ type, id: selectedId, previous, next: data, op: "update" });
      setMode("detail");
      optsRef.current.onUpdateSuccess?.(result);
      return result;
    } catch (err) {
      if (previous) store.replaceEntity(type, selectedId, previous);
      if (previousSync) store.setEntitySyncMetadata(type, selectedId, previousSync);
      else store.clearEntitySyncMetadata(type, selectedId);
      const error = err instanceof Error ? err : new Error(String(err));
      setSaveError(error.message);
      optsRef.current.onError?.("update", error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [selectedId, type, editBuffer, normalize]);
  const [createBuffer, setCreateBuffer] = React6.useState({ ...createDefaults });
  const [isCreating, setIsCreating] = React6.useState(false);
  const [createError, setCreateError] = React6.useState(null);
  const setCreateField = React6.useCallback((field, value) => setCreateBuffer((prev) => setValueAtPath(prev, String(field), value)), []);
  const setCreateFields = React6.useCallback((fields) => setCreateBuffer((prev) => ({ ...prev, ...fields })), []);
  const resetCreateBuffer = React6.useCallback(() => setCreateBuffer({ ...optsRef.current.createDefaults ?? {} }), []);
  const startCreate = React6.useCallback(() => {
    resetCreateBuffer();
    setCreateError(null);
    setMode("create");
  }, [resetCreateBuffer]);
  const cancelCreate = React6.useCallback(() => {
    resetCreateBuffer();
    setMode("list");
    setCreateError(null);
  }, [resetCreateBuffer]);
  const create3 = React6.useCallback(async () => {
    if (!onCreate) return null;
    setIsCreating(true);
    setCreateError(null);
    const tempId = `__temp__${Date.now()}`;
    const optimisticData = { ...createBuffer, id: tempId, _optimistic: true };
    const store = useGraphStore.getState();
    store.upsertEntity(type, tempId, optimisticData);
    store.setEntitySyncMetadata(type, tempId, { synced: false, origin: "optimistic", updatedAt: Date.now() });
    store.insertIdInList(serializeKey(listQueryKey), tempId, "start");
    try {
      const result = await onCreate(createBuffer);
      const { id: realId, data } = normalize(result);
      store.removeEntity(type, tempId);
      store.upsertEntity(type, realId, data);
      store.setEntityFetched(type, realId);
      store.setEntitySyncMetadata(type, realId, { synced: true, origin: "server", updatedAt: Date.now() });
      for (const key of Object.keys(store.lists)) {
        const list2 = store.lists[key];
        const idx = list2.ids.indexOf(tempId);
        if (idx !== -1) {
          store.removeIdFromAllLists(type, tempId);
          store.insertIdInList(key, realId, idx);
        }
      }
      cascadeInvalidation({ type, id: realId, previous: null, next: data, op: "create" });
      if (selectAfterCreate) {
        setSelectedId(realId);
        setMode("detail");
      } else setMode("list");
      resetCreateBuffer();
      optsRef.current.onCreateSuccess?.(result);
      return result;
    } catch (err) {
      store.removeEntity(type, tempId);
      store.removeIdFromAllLists(type, tempId);
      const error = err instanceof Error ? err : new Error(String(err));
      setCreateError(error.message);
      optsRef.current.onError?.("create", error);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [type, createBuffer, normalize, listQueryKey, selectAfterCreate, resetCreateBuffer]);
  const [isDeleting, setIsDeleting] = React6.useState(false);
  const [deleteError, setDeleteError] = React6.useState(null);
  const deleteEntity = React6.useCallback(async (id) => {
    const targetId = id ?? selectedId;
    if (!targetId || !onDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    const previous = useGraphStore.getState().readEntity(type, targetId);
    useGraphStore.getState().removeIdFromAllLists(type, targetId);
    try {
      await onDelete(targetId);
      useGraphStore.getState().removeEntity(type, targetId);
      cascadeInvalidation({ type, id: targetId, previous, next: null, op: "delete" });
      if (clearSelectionAfterDelete && targetId === selectedId) {
        setSelectedId(null);
        setMode("list");
      }
      optsRef.current.onDeleteSuccess?.(targetId);
    } catch (err) {
      if (previous) {
        useGraphStore.getState().upsertEntity(type, targetId, previous);
        useGraphStore.getState().insertIdInList(serializeKey(listQueryKey), targetId, "end");
      }
      const error = err instanceof Error ? err : new Error(String(err));
      setDeleteError(error.message);
      optsRef.current.onError?.("delete", error);
    } finally {
      setIsDeleting(false);
    }
  }, [type, selectedId, listQueryKey, clearSelectionAfterDelete]);
  return { mode, setMode, list, selectedId, select, openDetail, detail: detail ?? null, detailIsLoading, detailError: detailError ?? null, relations, editBuffer, setField, setFields, resetBuffer, dirty, startEdit, cancelEdit, save, isSaving, saveError, applyOptimistic, createBuffer, setCreateField, setCreateFields, resetCreateBuffer, startCreate, cancelCreate, create: create3, isCreating, createError, deleteEntity, isDeleting, deleteError, isEditing: mode === "edit" || mode === "create" };
}

// src/adapters/realtime-manager.ts
var RealtimeManager = class {
  adapters = /* @__PURE__ */ new Map();
  pendingChanges = [];
  pendingListKeys = /* @__PURE__ */ new Set();
  flushTimer = null;
  opts;
  constructor(opts = {}) {
    this.opts = {
      flushInterval: opts.flushInterval ?? 16,
      onStatusChange: opts.onStatusChange ?? (() => {
      }),
      onChangeReceived: opts.onChangeReceived ?? (() => {
      })
    };
  }
  register(adapter, channels, normalize) {
    const existing = this.adapters.get(adapter.name);
    const registered = existing ?? { adapter, unsubscribes: [] };
    if (!existing) this.adapters.set(adapter.name, registered);
    if (adapter.onStatusChange) {
      registered.unsubscribes.push(adapter.onStatusChange((s) => this.opts.onStatusChange(adapter.name, s)));
    }
    for (const channel of channels) {
      const unsub = adapter.subscribe(
        { label: `${adapter.name}/${channel.type}`, replayOnConnect: true },
        (cs) => this.handleChangeset(adapter.name, cs, normalize)
      );
      registered.unsubscribes.push(unsub);
    }
    return () => this.unregister(adapter.name);
  }
  unregister(name) {
    const r = this.adapters.get(name);
    if (!r) return;
    for (const u of r.unsubscribes) u();
    this.adapters.delete(name);
  }
  unregisterAll() {
    for (const n of this.adapters.keys()) this.unregister(n);
  }
  handleChangeset(name, cs, normalize) {
    for (const rawChange of cs.changes) {
      const change = normalize ? normalize(rawChange) : rawChange;
      if (!change) continue;
      this.opts.onChangeReceived(name, change);
      this.pendingChanges.push(change);
    }
    if (cs.affectedListKeys) for (const k of cs.affectedListKeys) this.pendingListKeys.add(k);
    this.scheduleFlush();
  }
  scheduleFlush() {
    if (this.opts.flushInterval === 0) {
      this.flush();
      return;
    }
    if (this.flushTimer !== null) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.opts.flushInterval);
  }
  flush() {
    if (this.pendingChanges.length === 0 && this.pendingListKeys.size === 0) return;
    const changes = this.pendingChanges.splice(0);
    const listKeys = new Set(this.pendingListKeys);
    this.pendingListKeys.clear();
    const store = useGraphStore.getState();
    for (const change of coalesceChanges(changes)) {
      switch (change.op) {
        case "insert":
        case "upsert":
          if (change.data) {
            store.upsertEntity(change.type, change.id, change.data);
            store.setEntityFetched(change.type, change.id);
          }
          break;
        case "update":
          if (change.patch) {
            if (store.entities[change.type]?.[change.id]) store.upsertEntity(change.type, change.id, change.patch);
            else store.invalidateEntity(change.type, change.id);
          } else if (change.data) {
            store.upsertEntity(change.type, change.id, change.data);
            store.setEntityFetched(change.type, change.id);
          }
          break;
        case "delete":
          store.removeEntity(change.type, change.id);
          store.removeIdFromAllLists(change.type, change.id);
          break;
      }
    }
    for (const key of listKeys) store.invalidateLists(key);
  }
  forceFlush() {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
};
function coalesceChanges(changes) {
  const byKey = /* @__PURE__ */ new Map();
  for (const c of changes) {
    const key = `${c.type}:${c.id}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...c });
      continue;
    }
    if (c.op === "delete") {
      byKey.set(key, c);
      continue;
    }
    if (existing.op === "delete") continue;
    byKey.set(key, { ...existing, op: "upsert", data: c.data ?? existing.data, patch: c.patch ? { ...existing.patch ?? {}, ...c.patch } : existing.patch });
  }
  return Array.from(byKey.values());
}
var _manager = null;
function getRealtimeManager(opts) {
  if (!_manager) _manager = new RealtimeManager(opts);
  return _manager;
}
function resetRealtimeManager() {
  _manager?.unregisterAll();
  _manager = null;
}

// src/adapters/realtime-adapters.ts
function createWebSocketAdapter(opts) {
  const {
    url,
    parseMessage,
    protocols,
    reconnectBaseDelay = 1e3,
    maxReconnectAttempts = Infinity,
    pingInterval = 3e4,
    pingMessage = '{"type":"ping"}'
  } = opts;
  const statusCbs = /* @__PURE__ */ new Set();
  const handlers = /* @__PURE__ */ new Set();
  let ws = null;
  let attempts = 0;
  let reconnTimer = null;
  let pingTimer = null;
  let stopped = false;
  const emit = (s) => {
    for (const cb of statusCbs) cb(s);
  };
  function connect() {
    if (stopped) return;
    const u = typeof url === "function" ? url() : url;
    emit("connecting");
    ws = new WebSocket(u, protocols);
    ws.onopen = () => {
      attempts = 0;
      emit("connected");
      if (pingInterval > 0)
        pingTimer = setInterval(() => {
          if (ws?.readyState === 1) ws.send(pingMessage);
        }, pingInterval);
    };
    ws.onmessage = (ev) => {
      let parsed;
      try {
        parsed = JSON.parse(ev.data);
      } catch {
        return;
      }
      const changes = parseMessage ? parseMessage(parsed) : defaultParse(parsed);
      if (!changes?.length) return;
      for (const h of handlers) h({ changes, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    };
    ws.onclose = () => {
      emit("disconnected");
      clearInterval(pingTimer);
      if (!stopped && attempts < maxReconnectAttempts)
        reconnTimer = setTimeout(connect, reconnectBaseDelay * Math.pow(2, Math.min(attempts++, 6)));
    };
    ws.onerror = () => {
      emit("error");
      ws?.close();
    };
  }
  return {
    name: "websocket",
    subscribe(_cfg, handler) {
      handlers.add(handler);
      if (!ws || ws.readyState === WebSocket.CLOSED) connect();
      return () => {
        handlers.delete(handler);
        if (handlers.size === 0) {
          stopped = true;
          clearTimeout(reconnTimer);
          clearInterval(pingTimer);
          ws?.close();
          ws = null;
        }
      };
    },
    onStatusChange: (cb) => {
      statusCbs.add(cb);
      return () => statusCbs.delete(cb);
    }
  };
}
function defaultParse(data) {
  if (!data || typeof data !== "object") return null;
  const d = data;
  if (d.op && d.type && d.id) return [d];
  if (Array.isArray(d.changes)) return d.changes;
  return null;
}
function createSupabaseRealtimeAdapter(client, opts = {}) {
  const {
    tableTypeMap = {},
    extractId = (r) => String(r.id),
    schema = "public"
  } = opts;
  const statusCbs = /* @__PURE__ */ new Set();
  function resolveType(table) {
    return tableTypeMap[table] ?? table.charAt(0).toUpperCase() + table.slice(1);
  }
  function payloadToChange(p) {
    const type = resolveType(p.table);
    if (p.eventType === "DELETE") {
      const id2 = extractId(p.old);
      return id2 ? { op: "delete", type, id: id2 } : null;
    }
    const id = extractId(p.new);
    if (!id) return null;
    return { op: p.eventType === "INSERT" ? "insert" : "upsert", type, id, data: p.new };
  }
  return {
    name: "supabase-realtime",
    /**
     * Generic subscribe is a no-op for Supabase. Use `subscribeChannel()` instead,
     * which accepts a `ChannelConfig` with Supabase-specific table/filter parameters.
     */
    subscribe(_cfg, _handler) {
      return () => {
      };
    },
    onStatusChange: (cb) => {
      statusCbs.add(cb);
      return () => statusCbs.delete(cb);
    },
    subscribeChannel(config) {
      const tableName = Object.entries(tableTypeMap).find(([, t]) => t === config.type)?.[0] ?? config.type.toLowerCase();
      const filterStr = config.id ? `id=eq.${config.id}` : config.filter ? Object.entries(config.filter).map(([k, v]) => `${k}=eq.${v}`).join(",") : void 0;
      const channel = client.channel(`entity-store:${config.type}:${config.id ?? "all"}`).on("postgres_changes", { event: "*", schema, table: tableName, ...filterStr ? { filter: filterStr } : {} }, (payload) => {
        const change = payloadToChange(payload);
        if (!change) return;
        config._handler?.({ changes: [change], timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      }).subscribe((status) => {
        const s = status === "SUBSCRIBED" ? "connected" : status === "CHANNEL_ERROR" ? "error" : status === "CLOSED" ? "disconnected" : "connecting";
        for (const cb of statusCbs) cb(s);
      });
      return () => {
        channel.unsubscribe();
      };
    }
  };
}
function createConvexAdapter(opts) {
  const { client, channels } = opts;
  const statusCbs = /* @__PURE__ */ new Set();
  const snapshots = /* @__PURE__ */ new Map();
  function diffSnapshot(type, prev, next, extractId, normalize) {
    const changes = [];
    const nextIds = /* @__PURE__ */ new Set();
    for (const record of next) {
      const id = extractId(record);
      nextIds.add(id);
      const data = normalize ? normalize(record) : record;
      changes.push({ op: prev.has(id) ? "upsert" : "insert", type, id, data });
      prev.set(id, record);
    }
    for (const [id] of prev) {
      if (!nextIds.has(id)) {
        changes.push({ op: "delete", type, id });
        prev.delete(id);
      }
    }
    return changes;
  }
  return {
    name: "convex",
    subscribe(_cfg, handler) {
      const unsubs = [];
      for (const ch of channels) {
        const { type, query, args = {}, normalize } = ch;
        const extractId = ch.extractId ?? ((r) => String(
          r._id ?? r.id
        ));
        if (!snapshots.has(type)) snapshots.set(type, /* @__PURE__ */ new Map());
        const snap = snapshots.get(type);
        unsubs.push(
          client.onUpdate(query, args, (records) => {
            const changes = diffSnapshot(type, snap, records, extractId, normalize);
            if (changes.length > 0)
              handler({ changes, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
          })
        );
      }
      for (const cb of statusCbs) cb("connected");
      return () => {
        for (const u of unsubs) u();
        for (const cb of statusCbs) cb("disconnected");
      };
    },
    onStatusChange: (cb) => {
      statusCbs.add(cb);
      return () => statusCbs.delete(cb);
    }
  };
}
function createGraphQLSubscriptionAdapter(opts) {
  const {
    client,
    subscriptions,
    extractId = (n) => String(n.id),
    normalize
  } = opts;
  const statusCbs = /* @__PURE__ */ new Set();
  function payloadToChange(type, p) {
    const gqlType = p.type ?? "updated";
    if (gqlType === "deleted") {
      const id2 = p.id ?? (p.node ? extractId(p.node, type) : null);
      return id2 ? { op: "delete", type, id: id2 } : null;
    }
    if (!p.node) return null;
    const id = extractId(p.node, type);
    const data = normalize ? normalize(p.node, type) : stripTypename(p.node);
    const op = gqlType === "created" ? "insert" : "upsert";
    return { op, type, id, data };
  }
  return {
    name: "graphql-subscription",
    subscribe(_cfg, handler) {
      const unsubs = [];
      for (const sub of subscriptions) {
        const { type, document: document2, variables, getPayload } = sub;
        unsubs.push(
          client.subscribe(
            { query: document2, variables },
            {
              next: ({ data }) => {
                const raw = getPayload(data);
                if (!raw) return;
                const payloads = Array.isArray(raw) ? raw : [raw];
                const changes = payloads.map((p) => payloadToChange(type, p)).filter((c) => c !== null);
                if (changes.length > 0)
                  handler({ changes, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
              },
              error: (e) => {
                console.error(`[GQLSub] ${type}:`, e);
                for (const cb of statusCbs) cb("error");
              },
              complete: () => {
                for (const cb of statusCbs) cb("disconnected");
              }
            }
          )
        );
      }
      for (const cb of statusCbs) cb("connected");
      return () => {
        for (const u of unsubs) u();
      };
    },
    onStatusChange: (cb) => {
      statusCbs.add(cb);
      return () => statusCbs.delete(cb);
    }
  };
}
function stripTypename(obj) {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "__typename") continue;
    result[k] = v && typeof v === "object" && !Array.isArray(v) ? stripTypename(v) : v;
  }
  return result;
}

// src/adapters/prisma.ts
function trimSlash(s) {
  return s.replace(/\/+$/, "");
}
function joinEndpoint(base, ...segments) {
  let u = trimSlash(base);
  for (const seg of segments) {
    if (!seg) continue;
    u += `/${String(seg).replace(/^\/+/, "")}`;
  }
  return u;
}
function defaultNormalize(raw, idField) {
  const id = raw[idField];
  return { id: id != null ? String(id) : "", data: raw };
}
function listSearchParams(where, orderBy, p) {
  const sp = new URLSearchParams();
  if (Object.keys(where).length > 0) sp.set("where", JSON.stringify(where));
  if (orderBy && orderBy.length > 0) sp.set("orderBy", JSON.stringify(orderBy));
  if (p.page != null) sp.set("page", String(p.page));
  if (p.pageSize != null) sp.set("pageSize", String(p.pageSize));
  if (p.cursor) sp.set("cursor", p.cursor);
  if (p.params && typeof p.params === "object") {
    for (const [k, v] of Object.entries(p.params)) {
      if (v === void 0 || v === null) continue;
      sp.set(k, typeof v === "string" ? v : JSON.stringify(v));
    }
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}
async function readListResponse(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  const items = Array.isArray(json.items) ? json.items : Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
  return {
    items,
    total: typeof json.total === "number" ? json.total : void 0,
    nextCursor: typeof json.nextCursor === "string" ? json.nextCursor : void 0,
    prevCursor: typeof json.prevCursor === "string" ? json.prevCursor : void 0,
    hasNextPage: typeof json.hasNextPage === "boolean" ? json.hasNextPage : void 0,
    hasPrevPage: typeof json.hasPrevPage === "boolean" ? json.hasPrevPage : void 0,
    page: typeof json.page === "number" ? json.page : void 0,
    pageSize: typeof json.pageSize === "number" ? json.pageSize : void 0
  };
}
function toPrismaInclude(relations) {
  const include = {};
  for (const name of Object.keys(relations)) include[name] = true;
  return include;
}
function prismaRelationsToSchema(type, relations) {
  if (!relations || Object.keys(relations).length === 0) return { type };
  const out = {};
  for (const [name, rel] of Object.entries(relations)) {
    const targetType = rel.type;
    switch (rel.relation) {
      case "belongsTo":
        out[name] = {
          cardinality: "belongsTo",
          foreignKey: rel.foreignKey,
          targetType
        };
        break;
      case "hasMany":
        out[name] = {
          cardinality: "hasMany",
          targetType,
          foreignKey: rel.foreignKey,
          listKeyPrefix: (parentId) => [targetType, { [rel.foreignKey]: parentId }]
        };
        break;
      case "manyToMany":
        out[name] = {
          cardinality: "manyToMany",
          targetType,
          localArrayField: rel.foreignKey,
          listKeyPrefix: (thisId) => [targetType, name, thisId]
        };
        break;
    }
  }
  return { type, relations: out };
}
function createPrismaEntityConfig(config) {
  const { type, endpoint, idField = "id", relations } = config;
  const entityType = type;
  const normalize = (raw) => defaultNormalize(raw, idField);
  return {
    /**
     * Builds {@link EntityQueryOptions} for {@link useEntity} (GET `${endpoint}/:id`).
     */
    entity: (id) => ({
      type: entityType,
      id,
      idField,
      fetch: async (entityId) => {
        const res = await fetch(joinEndpoint(endpoint, String(entityId)));
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      },
      normalize: (raw) => raw
    }),
    /**
     * Builds {@link ListQueryOptions} for {@link useEntityList}. Encode `filter` / `sort` in the returned `queryKey` so
     * refetches track view changes; each fetch sends Prisma-shaped `where` / `orderBy` query params.
     */
    list: (params) => {
      const filter = params?.filter;
      const sort = params?.sort;
      const queryKey = [entityType, endpoint, "list", filter ?? null, sort ?? null];
      return {
        type: entityType,
        queryKey,
        normalize,
        fetch: async (p) => {
          const where = filter ? toPrismaWhere(filter) : {};
          const orderBy = sort && sort.length > 0 ? toPrismaOrderBy(sort) : void 0;
          const qs = listSearchParams(where, orderBy, p);
          const res = await fetch(`${trimSlash(endpoint)}${qs}`);
          return readListResponse(res);
        }
      };
    },
    /**
     * Builds partial {@link CRUDOptions} for {@link useEntityCRUD}: wires list fetch (Prisma query params from `ViewDescriptor`)
     * and detail fetch. Supply `onCreate` / `onUpdate` / `onDelete` at the call site.
     */
    crud: (opts) => {
      const initialView = opts?.initialView ?? {};
      return {
        type: entityType,
        listQueryKey: [entityType, endpoint, "crud"],
        normalize,
        initialView,
        listFetch: async (p) => {
          const where = p.view.filter ? toPrismaWhere(p.view.filter) : {};
          const orderBy = p.view.sort && p.view.sort.length > 0 ? toPrismaOrderBy(p.view.sort) : void 0;
          const qs = listSearchParams(where, orderBy, {});
          const res = await fetch(`${trimSlash(endpoint)}${qs}`);
          return readListResponse(res);
        },
        detailFetch: async (entityId) => {
          const res = await fetch(joinEndpoint(endpoint, String(entityId)));
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          return res.json();
        }
      };
    },
    /** Schemas to pass to {@link registerSchema} (one entry for this `type`). */
    schemas: () => [prismaRelationsToSchema(type, relations)]
  };
}
function createElectricAdapter(opts) {
  const { pglite, tables, onSynced } = opts;
  const statusCbs = /* @__PURE__ */ new Set();
  const syncedCbs = /* @__PURE__ */ new Set();
  const syncedTables = /* @__PURE__ */ new Set();
  let globalHandler = null;
  function checkAllSynced() {
    if (tables.every((t) => syncedTables.has(t.table))) {
      onSynced?.();
      for (const cb of syncedCbs) cb();
    }
  }
  function toChange(tc, msg) {
    const { type, idColumn = "id", normalize } = tc;
    const op = msg.headers.operation;
    const raw = msg.value;
    const id = String(raw[idColumn]);
    if (!id) return null;
    const data = normalize ? normalize(raw) : raw;
    if (op === "delete") return { op: "delete", type, id };
    return { op: op === "insert" ? "insert" : "upsert", type, id, data };
  }
  const shapeUnsubs = [];
  for (const tc of tables) {
    shapeUnsubs.push(tc.shapeStream.subscribe((msgs) => {
      if (!globalHandler) return;
      const changes = msgs.map((m) => toChange(tc, m)).filter((c) => c !== null);
      if (changes.length > 0) globalHandler({ changes, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      if (tc.shapeStream.isUpToDate) {
        syncedTables.add(tc.table);
        checkAllSynced();
      }
    }, (e) => {
      console.error(`[Electric] ${tc.table}:`, e);
      for (const cb of statusCbs) cb("error");
    }));
  }
  void (async () => {
    for (const tc of tables) {
      await pglite.listen(`entity_store_${tc.table}`, (payload) => {
        if (!globalHandler) return;
        try {
          const parsed = JSON.parse(payload);
          const change = toChange(tc, { headers: { operation: parsed.op }, offset: "", key: String(parsed.row[tc.idColumn ?? "id"]), value: parsed.row });
          if (change) globalHandler({ changes: [change] });
        } catch {
        }
      });
    }
  })();
  return {
    name: "electricsql",
    subscribe(_cfg, handler) {
      globalHandler = handler;
      for (const cb of statusCbs) cb("connected");
      return () => {
        globalHandler = null;
        for (const u of shapeUnsubs) u();
      };
    },
    onStatusChange(cb) {
      statusCbs.add(cb);
      return () => statusCbs.delete(cb);
    },
    async query(sql, params) {
      const r = await pglite.query(sql, params);
      return { rows: r.rows };
    },
    async execute(sql, _params) {
      await pglite.exec(sql);
    },
    isSynced() {
      return tables.every((t) => syncedTables.has(t.table));
    },
    onSyncComplete(cb) {
      if (this.isSynced()) {
        cb();
        return () => {
        };
      }
      syncedCbs.add(cb);
      return () => syncedCbs.delete(cb);
    }
  };
}
function useLocalFirst(adapter) {
  const [isSynced, setIsSynced] = React6.useState(adapter.isSynced());
  React6.useEffect(() => {
    const u1 = adapter.onSyncComplete(() => setIsSynced(true));
    const u2 = getRealtimeManager().register(adapter, []);
    return () => {
      u1();
      u2();
    };
  }, [adapter]);
  const query = React6.useCallback(async (sql, params) => (await adapter.query(sql, params)).rows, [adapter]);
  const execute = React6.useCallback((sql, params) => adapter.execute(sql, params), [adapter]);
  return { isSynced, query, execute };
}
function usePGliteQuery(opts) {
  const { adapter, type, sql, params, idColumn = "id", normalize, deps = [] } = opts;
  const [isLoading, setIsLoading] = React6.useState(true);
  const [error, setError] = React6.useState(null);
  React6.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    adapter.query(sql, params).then((r) => {
      if (cancelled) return;
      const store = useGraphStore.getState();
      store.upsertEntities(type, r.rows.map((row) => ({ id: String(row[idColumn]), data: normalize ? normalize(row) : row })));
      for (const row of r.rows) store.setEntityFetched(type, String(row[idColumn]));
      setIsLoading(false);
      setError(null);
    }).catch((e) => {
      if (!cancelled) {
        setError(String(e));
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sql, type, ...deps]);
  return { isLoading, error };
}

// src/adapters/electricsql-tenant.ts
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertUuid(companyId) {
  if (typeof companyId !== "string" || !UUID_RE.test(companyId)) {
    throw new Error(
      `tenant-scoped adapter: companyId must be a UUID, received "${companyId}".`
    );
  }
}
function assertSafeColumn(column) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(column)) {
    throw new Error(`tenant-scoped adapter: unsafe tenantColumn "${column}".`);
  }
}
function buildTenantWhere(tenantColumn, companyId, tableLabel) {
  if (typeof tenantColumn === "undefined") {
    throw new Error(
      `shape "${tableLabel}" lacks tenantColumn \u2014 tenant-scoped adapter refuses to attach unscoped shapes.`
    );
  }
  assertUuid(companyId);
  if (tenantColumn === null) {
    return `id = '${companyId}'`;
  }
  assertSafeColumn(tenantColumn);
  return `${tenantColumn} = '${companyId}'`;
}
function createTenantScopedElectricAdapter(opts) {
  const { pglite, tenantClaim, tables, onSynced } = opts;
  assertUuid(tenantClaim.companyId);
  const wired = tables.map((tc) => {
    const where = buildTenantWhere(tc.tenantColumn, tenantClaim.companyId, tc.table);
    const shapeStream = tc.shapeStreamFactory({ table: tc.table, where, tenantClaim });
    return {
      type: tc.type,
      table: tc.table,
      where,
      idColumn: tc.primaryKey?.[0] ?? "id",
      normalize: tc.normalize,
      shapeStream
    };
  });
  return createElectricAdapter({ pglite, tables: wired, onSynced });
}

// src/adapters/pglite-persistence.ts
var DEFAULT_TABLE = "_graph_snapshot";
async function createPGlitePersistenceAdapter(pglite, options = {}) {
  const tableName = options.tableName ?? DEFAULT_TABLE;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) {
    throw new Error(`createPGlitePersistenceAdapter: invalid tableName "${tableName}"`);
  }
  await pglite.exec(
    `CREATE TABLE IF NOT EXISTS ${tableName} (
       key        TEXT        PRIMARY KEY,
       value      TEXT        NOT NULL,
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`
  );
  return {
    async get(key) {
      const result = await pglite.query(
        `SELECT value FROM ${tableName} WHERE key = $1`,
        [key]
      );
      const row = result.rows[0];
      return row?.value ?? null;
    },
    async set(key, value) {
      await pglite.query(
        `INSERT INTO ${tableName} (key, value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value,
               updated_at = now()`,
        [key, value]
      );
    },
    async remove(key) {
      await pglite.query(`DELETE FROM ${tableName} WHERE key = $1`, [key]);
    }
  };
}

// src/schema-from-sql.ts
function parseCreateTable(sql) {
  const headerMatch = sql.match(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["]?([A-Za-z_][A-Za-z0-9_]*)["]?\s*\(([\s\S]*)\)\s*;?\s*$/im
  );
  if (!headerMatch) {
    throw new Error("parseCreateTable: could not locate a CREATE TABLE block");
  }
  const tableName = headerMatch[1];
  const body = headerMatch[2];
  const columns = [];
  for (const rawLine of splitTopLevelCommas(body)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(?:PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT|LIKE|EXCLUDE)\b/i.test(line)) {
      continue;
    }
    const colMatch = line.match(/^["]?([A-Za-z_][A-Za-z0-9_]*)["]?\s+([A-Za-z][A-Za-z0-9_]*(?:\s*\([^)]*\))?(?:\s*\[\s*\])?)([\s\S]*)$/);
    if (!colMatch) continue;
    const name = colMatch[1];
    const sqlType = colMatch[2].replace(/\s+/g, "").toUpperCase();
    const rest = colMatch[3].toUpperCase();
    const notNull = /\bNOT\s+NULL\b/.test(rest);
    const hasDefault = /\bDEFAULT\b/.test(rest);
    columns.push({ name, sqlType, notNull, hasDefault });
  }
  return { tableName, columns };
}
function splitTopLevelCommas(body) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}
function sqlTypeToJsonSchema(sqlType) {
  const t = sqlType.replace(/\s+/g, "").toUpperCase();
  if (/^TEXT\[\]$/.test(t)) {
    return { schema: { type: "array", items: { type: "string" } } };
  }
  if (t === "UUID" || t === "TEXT" || /^VARCHAR(\(.*\))?$/.test(t) || /^CHAR(\(.*\))?$/.test(t)) {
    return { schema: { type: "string" } };
  }
  if (t === "INTEGER" || t === "INT" || t === "BIGINT" || t === "SMALLINT" || t === "INT4" || t === "INT8" || t === "INT2") {
    return { schema: { type: "integer" } };
  }
  if (/^NUMERIC(\(.*\))?$/.test(t) || /^DECIMAL(\(.*\))?$/.test(t) || t === "REAL" || t === "DOUBLEPRECISION" || t === "FLOAT") {
    return { schema: { type: "number" } };
  }
  if (t === "BOOLEAN" || t === "BOOL") {
    return { schema: { type: "boolean" } };
  }
  if (t === "TIMESTAMPTZ" || t === "TIMESTAMP" || t === "TIMESTAMPWITHTIMEZONE" || t === "TIMESTAMPWITHOUTTIMEZONE") {
    return { schema: { type: "string", format: "date-time" } };
  }
  if (t === "DATE") {
    return { schema: { type: "string", format: "date" } };
  }
  if (t === "JSONB" || t === "JSON") {
    return { schema: { type: "object" } };
  }
  return {
    schema: { type: "string" },
    warning: `sql type "${sqlType}" not explicitly mapped; defaulting to string`
  };
}
function deepMergeUnknown(base, override) {
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = base[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value) && baseValue !== null && typeof baseValue === "object" && !Array.isArray(baseValue)) {
      out[key] = deepMergeUnknown(
        baseValue,
        value
      );
    } else {
      out[key] = value;
    }
  }
  return out;
}
function mergeEntityConfig(generated, overrides) {
  if (!overrides) return generated;
  const merged = deepMergeUnknown(
    generated,
    overrides
  );
  const refined = merged;
  return {
    ...refined,
    entityType: generated.entityType,
    schema: refined.schema ?? generated.schema
  };
}
function registerEntityFromSql(opts) {
  const parsed = parseCreateTable(opts.createTableSql);
  const properties = {};
  const required = [];
  for (const col of parsed.columns) {
    const { schema, warning } = sqlTypeToJsonSchema(col.sqlType);
    const propSchema = { ...schema };
    if (warning) {
      propSchema["x-warning"] = warning;
    }
    properties[col.name] = propSchema;
    if (col.notNull && !col.hasDefault) {
      required.push(col.name);
    }
  }
  const generated = {
    entityType: opts.entityType,
    source: "runtime",
    schema: {
      type: "object",
      title: parsed.tableName,
      properties,
      required
    }
  };
  const config = mergeEntityConfig(generated, opts.overrides);
  registerEntityJsonSchema(config);
  return config;
}
function useEntityListAsTable(opts) {
  const queryKey = opts.queryKey ?? ["entity-list-as-table", opts.type];
  const list = useEntityList({
    ...opts,
    queryKey
  });
  const lastDataRef = React6.useRef(null);
  const data = React6.useMemo(() => {
    const prev = lastDataRef.current;
    if (prev && prev.length === list.items.length) {
      let same = true;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i] !== list.items[i]) {
          same = false;
          break;
        }
      }
      if (same) return prev;
    }
    lastDataRef.current = list.items;
    return list.items;
  }, [list.items]);
  return {
    data,
    rowCount: list.total ?? list.ids.length,
    isLoading: list.isLoading,
    isFetching: list.isFetching,
    error: list.error,
    refetch: list.refetch
  };
}

// src/graphql/client.ts
async function executeGQL(cfg, document2, variables) {
  const headers = { "Content-Type": "application/json", ...cfg.headers?.() ?? {} };
  const res = await fetch(cfg.url, { method: "POST", headers, body: JSON.stringify({ query: document2, variables }) });
  if (!res.ok) throw new Error(`GQL request failed: ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) cfg.onError?.(json.errors);
  return json;
}
function normalizeGQLResponse(data, descriptors) {
  const store = useGraphStore.getState();
  const written = [];
  function resolvePath(obj, path) {
    return path.split(".").reduce((acc, key) => acc && typeof acc === "object" && !Array.isArray(acc) ? acc[key] : void 0, obj);
  }
  function walk(subtree, desc) {
    if (!subtree) return;
    const { type, extractId = (n) => String(n.id), normalize, relations } = desc;
    const process = (node) => {
      if (!node || typeof node !== "object") return;
      const id = extractId(node);
      const normalized = normalize(node);
      store.upsertEntity(type, id, normalized);
      store.setEntityFetched(type, id);
      written.push({ type, id });
      if (relations) for (const rel of relations) walk(resolvePath(node, rel.path), rel);
    };
    if (Array.isArray(subtree)) for (const item of subtree) process(item);
    else process(subtree);
  }
  for (const desc of descriptors) {
    const subtree = desc.path === "." ? data : data && typeof data === "object" ? resolvePath(data, desc.path) : void 0;
    walk(subtree, desc);
  }
  return written;
}
var GQLClient = class {
  constructor(cfg) {
    this.cfg = cfg;
  }
  cfg;
  async query(opts) {
    const key = opts.cacheKey ?? `gql:${opts.document.slice(0, 60)}:${JSON.stringify(opts.variables ?? {})}`;
    return dedupe(key, async () => {
      const r = await executeGQL(this.cfg, opts.document, opts.variables);
      if (r.data) normalizeGQLResponse(r.data, opts.descriptors);
      return r;
    });
  }
  async mutate(opts) {
    const snapshot = opts.optimistic ? takeSnapshot() : null;
    if (opts.optimistic) opts.optimistic();
    try {
      const r = await executeGQL(this.cfg, opts.document, opts.variables);
      if (r.data && opts.descriptors) normalizeGQLResponse(r.data, opts.descriptors);
      return r;
    } catch (err) {
      if (snapshot) restoreSnapshot(snapshot);
      throw err;
    }
  }
  subscribe(opts) {
    return opts.wsClient.subscribe(
      { query: opts.document, variables: opts.variables },
      { next: ({ data }) => {
        if (data) {
          normalizeGQLResponse(data, opts.descriptors);
          opts.onData?.(data);
        }
      }, error: opts.onError ?? console.error, complete: () => {
      } }
    );
  }
};
function takeSnapshot() {
  const s = useGraphStore.getState();
  return { entities: JSON.parse(JSON.stringify(s.entities)), patches: JSON.parse(JSON.stringify(s.patches)) };
}
function restoreSnapshot(snap) {
  useGraphStore.setState((s) => {
    for (const key of Object.keys(s.entities)) delete s.entities[key];
    for (const [key, val] of Object.entries(snap.entities)) s.entities[key] = val;
    for (const key of Object.keys(s.patches)) delete s.patches[key];
    for (const [key, val] of Object.entries(snap.patches)) s.patches[key] = val;
  });
}
function createGQLClient(cfg) {
  return new GQLClient(cfg);
}
function useGQLEntity(opts) {
  const { type, id, staleTime = getEngineOptions().defaultStaleTime, enabled = true } = opts;
  const optsRef = React6.useRef(opts);
  optsRef.current = opts;
  const data = zustand.useStore(useGraphStore, shallow.useShallow((s) => {
    if (!id) return null;
    return s.readEntitySnapshot(type, id);
  }));
  const entityState = zustand.useStore(useGraphStore, React6.useCallback(
    (s) => s.entityStates[`${type}:${id}`] ?? EMPTY_ENTITY_STATE,
    [type, id]
  ));
  const doFetch = React6.useCallback(() => {
    if (!id || !enabled) return;
    const { client, document: document2, variables, descriptor, sideDescriptors, onSuccess, onError } = optsRef.current;
    useGraphStore.getState().setEntityFetching(type, id, true);
    client.query({
      document: document2,
      variables: { ...variables, id },
      descriptors: sideDescriptors ? [descriptor, ...sideDescriptors] : [descriptor],
      cacheKey: `gql-entity:${type}:${id}:${document2.slice(0, 40)}`
    }).then((r) => {
      useGraphStore.getState().setEntityFetched(type, id);
      if (r.data) onSuccess?.(r.data);
    }).catch((e) => {
      useGraphStore.getState().setEntityError(type, id, e.message);
      onError?.(e);
    });
  }, [id, type, enabled]);
  React6.useEffect(() => {
    if (!id || !enabled) return;
    const token = registerSubscriber(`${type}:${id}`);
    const s = useGraphStore.getState();
    const ex = s.entityStates[`${type}:${id}`];
    if (!s.entities[type]?.[id] || !ex?.lastFetched || ex.stale || Date.now() - (ex.lastFetched ?? 0) > staleTime) doFetch();
    return () => unregisterSubscriber(`${type}:${id}`, token);
  }, [id, type, enabled, staleTime, doFetch]);
  React6.useEffect(() => {
    if (entityState.stale && id && enabled && !entityState.isFetching) doFetch();
  }, [entityState.stale, id, enabled, entityState.isFetching, doFetch]);
  return { data, isLoading: !data && entityState.isFetching, isFetching: entityState.isFetching, error: entityState.error, isStale: entityState.stale, refetch: doFetch };
}
function useGQLList(opts) {
  const { type, queryKey, staleTime = getEngineOptions().defaultStaleTime, enabled = true, mode = "replace" } = opts;
  const optsRef = React6.useRef(opts);
  optsRef.current = opts;
  const key = React6.useMemo(() => serializeKey(queryKey), [queryKey]);
  const listState = zustand.useStore(useGraphStore, React6.useCallback((s) => s.lists[key] ?? EMPTY_LIST_STATE, [key]));
  const items = zustand.useStore(
    useGraphStore,
    shallow.useShallow((s) => {
      const ids = s.lists[key]?.ids ?? EMPTY_IDS;
      return ids.map((id) => s.readEntitySnapshot(type, id)).filter((x) => x !== null);
    })
  );
  const doFetch = React6.useCallback((cursor, append = false) => {
    if (!enabled) return;
    const { client, document: document2, variables, descriptor, sideDescriptors, getItems, getPagination } = optsRef.current;
    const store = useGraphStore.getState();
    if (append) store.setListFetchingMore(key, true);
    else store.setListFetching(key, true);
    const vars = { ...variables, ...cursor ? { cursor } : {} };
    client.query({
      document: document2,
      variables: vars,
      descriptors: sideDescriptors ? [descriptor, ...sideDescriptors] : [descriptor],
      cacheKey: `gql-list:${key}:${cursor ?? "first"}`
    }).then((r) => {
      if (!r.data) return;
      const rawItems = getItems(r.data);
      const pag = getPagination?.(r.data) ?? {};
      const { extractId = (n) => String(n.id) } = descriptor;
      const ids = rawItems.map((item) => extractId(item));
      const meta = { total: pag.total ?? null, nextCursor: pag.nextCursor ?? null, hasNextPage: pag.hasNextPage ?? !!pag.nextCursor, currentPage: pag.page ?? null, pageSize: pag.pageSize ?? null };
      if (append && mode === "append") useGraphStore.getState().appendListResult(key, ids, meta);
      else useGraphStore.getState().setListResult(key, ids, meta);
    }).catch((e) => useGraphStore.getState().setListError(key, e.message));
  }, [key, enabled, mode]);
  React6.useEffect(() => {
    if (!enabled) return;
    const ex = useGraphStore.getState().lists[key];
    if (!ex || ex.stale || !ex.lastFetched || Date.now() - ex.lastFetched > staleTime) doFetch();
  }, [key, enabled, staleTime, doFetch]);
  React6.useEffect(() => {
    if (listState.stale && enabled && !listState.isFetching) doFetch();
  }, [listState.stale, enabled, listState.isFetching, doFetch]);
  const fetchNextPage = React6.useCallback(() => {
    if (!listState.hasNextPage || listState.isFetchingMore) return;
    doFetch(listState.nextCursor ?? void 0, true);
  }, [listState.hasNextPage, listState.isFetchingMore, listState.nextCursor, doFetch]);
  return { items, ids: listState.ids, isLoading: listState.ids.length === 0 && listState.isFetching, isFetching: listState.isFetching, isFetchingMore: listState.isFetchingMore, error: listState.error, hasNextPage: listState.hasNextPage, total: listState.total, currentPage: listState.currentPage, fetchNextPage, refetch: () => doFetch() };
}
function useGQLMutation(opts) {
  const optsRef = React6.useRef(opts);
  optsRef.current = opts;
  const [state, setState] = React6.useState({ isPending: false, isSuccess: false, isError: false, error: null });
  const mutate = React6.useCallback(async (variables) => {
    const { client, document: document2, descriptors, optimistic, invalidateLists, onSuccess, onError } = optsRef.current;
    setState({ isPending: true, isSuccess: false, isError: false, error: null });
    try {
      const r = await client.mutate({ document: document2, variables, descriptors, optimistic: optimistic ? () => optimistic(variables) : void 0 });
      if (invalidateLists) for (const k of invalidateLists) useGraphStore.getState().invalidateLists(k);
      setState({ isPending: false, isSuccess: true, isError: false, error: null });
      if (r.data) onSuccess?.(r.data);
      return r;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setState({ isPending: false, isSuccess: false, isError: true, error: e.message });
      onError?.(e);
      return null;
    }
  }, []);
  const trigger = React6.useCallback((v) => {
    void mutate(v);
  }, [mutate]);
  return { mutate, trigger, state };
}
function useGQLSubscription(opts) {
  const { document: document2, variables, enabled = true } = opts;
  const [status, setStatus] = React6.useState({ connected: false, error: null });
  const optsRef = React6.useRef(opts);
  optsRef.current = opts;
  React6.useEffect(() => {
    const { client, wsClient, descriptors, onData, onError } = optsRef.current;
    if (!enabled) return;
    const unsub = client.subscribe({ document: document2, variables, descriptors, wsClient, onData: (d) => {
      setStatus({ connected: true, error: null });
      onData?.(d);
    }, onError: (e) => {
      setStatus({ connected: false, error: String(e) });
      onError?.(e);
    } });
    setStatus({ connected: true, error: null });
    return unsub;
  }, [document2, variables, enabled]);
  return status;
}
function cn(...inputs) {
  return tailwindMerge.twMerge(clsx.clsx(inputs));
}
function InlineCellEditor({ initialValue, onCommit, onCancel, className }) {
  const [value, setValue] = React6.useState(initialValue);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "input",
    {
      value,
      onChange: (e) => setValue(e.target.value),
      autoFocus: true,
      onBlur: () => {
        if (value !== initialValue) onCommit(value);
        else onCancel();
      },
      onKeyDown: (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (value !== initialValue) onCommit(value);
          else onCancel();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        e.stopPropagation();
      },
      onClick: (e) => e.stopPropagation(),
      className: cn("h-7 px-2 py-0 text-sm rounded border border-ring bg-background focus:outline-none w-full", className)
    }
  );
}
function EntityTable({ viewResult, columns, getRowId = (r) => String(r.id), selectedId, onRowClick, onCellEdit, onBulkAction, paginationMode = "loadMore", pageSize = 50, searchPlaceholder = "Search\u2026", searchFields, toolbarChildren, showToolbar = true, emptyState, className }) {
  const { items, isLoading, isFetching, isRemoteFetching, isShowingLocalPending, hasNextPage, fetchNextPage, isFetchingMore, viewTotal, setSort, setSearch, refetch } = viewResult;
  const [sorting, setSorting] = React6.useState([]);
  const [rowSelection, setRowSelection] = React6.useState({});
  const [colVis, setColVis] = React6.useState({});
  const [search, setSearchLocal] = React6.useState("");
  const [editingCell, setEditingCell] = React6.useState(null);
  const [page, setPage] = React6.useState(1);
  const handleSort = React6.useCallback((updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    setSorting(next);
    setSort(next.length ? next.map((s) => ({ field: s.id, direction: s.desc ? "desc" : "asc" })) : null);
  }, [sorting, setSort]);
  const handleSearch = React6.useCallback((v) => {
    setSearchLocal(v);
    setSearch(v);
  }, [setSearch]);
  const pagedItems = React6.useMemo(() => paginationMode === "pages" ? items.slice((page - 1) * pageSize, page * pageSize) : items, [items, paginationMode, page, pageSize]);
  const totalPages = Math.ceil(items.length / pageSize);
  const table = reactTable.useReactTable({
    data: pagedItems,
    columns,
    getRowId,
    manualSorting: true,
    state: { sorting, rowSelection, columnVisibility: colVis },
    onSortingChange: handleSort,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColVis,
    getCoreRowModel: reactTable.getCoreRowModel(),
    getSortedRowModel: reactTable.getSortedRowModel(),
    enableRowSelection: true
  });
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: cn("flex flex-col h-full", className), children: [
    showToolbar && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2 px-3 py-2.5 border-b shrink-0", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative flex-1 max-w-xs", children: [
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            value: search,
            onChange: (e) => handleSearch(e.target.value),
            placeholder: searchPlaceholder,
            className: "w-full h-7 pl-8 pr-7 rounded-md bg-muted/50 border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          }
        ),
        search && /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: () => handleSearch(""), className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntime.jsx(lucideReact.X, { className: "w-3.5 h-3.5" }) })
      ] }),
      isShowingLocalPending && /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "text-[10px] text-muted-foreground flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Loader2, { className: "w-3 h-3 animate-spin" }),
        "Loading complete results\u2026"
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ml-auto flex items-center gap-1.5", children: [
        selectedRows.length > 0 && onBulkAction && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            selectedRows.length,
            " selected"
          ] }),
          onBulkAction(selectedRows)
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-xs text-muted-foreground", children: viewTotal != null ? `${viewTotal}` : "" }),
        /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: refetch, disabled: isRemoteFetching, className: "p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors", children: /* @__PURE__ */ jsxRuntime.jsx(lucideReact.RefreshCw, { className: cn("w-3.5 h-3.5", isRemoteFetching && "animate-spin") }) }),
        toolbarChildren
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntime.jsxs("table", { className: "w-full border-collapse text-sm", children: [
      /* @__PURE__ */ jsxRuntime.jsx("thead", { className: "sticky top-0 z-10", children: table.getHeaderGroups().map((hg) => /* @__PURE__ */ jsxRuntime.jsx("tr", { className: "bg-muted/50 border-b", children: hg.headers.map((h) => /* @__PURE__ */ jsxRuntime.jsx("th", { style: { width: h.getSize() }, className: "px-3 py-2 text-left font-normal text-muted-foreground", children: h.isPlaceholder ? null : reactTable.flexRender(h.column.columnDef.header, h.getContext()) }, h.id)) }, hg.id)) }),
      /* @__PURE__ */ jsxRuntime.jsx("tbody", { children: isLoading ? Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsxRuntime.jsx("tr", { className: "border-b", children: columns.map((_2, j) => /* @__PURE__ */ jsxRuntime.jsx("td", { className: "px-3 py-2.5", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "h-3 rounded bg-muted animate-pulse", style: { width: `${50 + (i * 7 + j * 13) % 40}%` } }) }, j)) }, i)) : table.getRowModel().rows.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx("tr", { children: /* @__PURE__ */ jsxRuntime.jsx("td", { colSpan: columns.length, className: "px-4 py-16 text-center text-sm text-muted-foreground", children: emptyState ?? "No results" }) }) : table.getRowModel().rows.map((row) => {
        const isSelected = row.id === selectedId;
        return /* @__PURE__ */ jsxRuntime.jsx(
          "tr",
          {
            onClick: () => onRowClick?.(row.original),
            className: cn("border-b group/row cursor-pointer transition-colors", isSelected ? "bg-primary/5" : "hover:bg-muted/40"),
            children: row.getVisibleCells().map((cell) => {
              const meta = cell.column.columnDef.meta?.entityMeta;
              const isEditingThis = editingCell?.rowId === row.id && editingCell?.field === cell.column.id;
              return /* @__PURE__ */ jsxRuntime.jsx(
                "td",
                {
                  style: { width: cell.column.getSize() },
                  className: "px-3 py-2.5",
                  onDoubleClick: (e) => {
                    if (!meta?.editable || !onCellEdit) return;
                    e.stopPropagation();
                    setEditingCell({ rowId: row.id, field: cell.column.id, value: String(cell.getValue() ?? "") });
                  },
                  children: isEditingThis ? /* @__PURE__ */ jsxRuntime.jsx(InlineCellEditor, { initialValue: editingCell.value, onCommit: (v) => {
                    onCellEdit(row.original, cell.column.id, v);
                    setEditingCell(null);
                  }, onCancel: () => setEditingCell(null) }) : reactTable.flexRender(cell.column.columnDef.cell, cell.getContext())
                },
                cell.id
              );
            })
          },
          row.id
        );
      }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-t shrink-0 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { children: isFetching && !isLoading ? "Updating\u2026" : `${items.length} loaded` }),
      paginationMode === "loadMore" && hasNextPage && /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: fetchNextPage, disabled: isFetchingMore, className: "flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs hover:bg-muted transition-colors disabled:opacity-50", children: isFetchingMore ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Loader2, { className: "w-3 h-3 animate-spin" }),
        "Loading\u2026"
      ] }) : "Load more" }),
      paginationMode === "pages" && totalPages > 1 && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "p-1 rounded hover:bg-muted disabled:opacity-50", children: /* @__PURE__ */ jsxRuntime.jsx(lucideReact.ChevronLeft, { className: "w-3.5 h-3.5" }) }),
        /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
          "Page ",
          page,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page >= totalPages, className: "p-1 rounded hover:bg-muted disabled:opacity-50", children: /* @__PURE__ */ jsxRuntime.jsx(lucideReact.ChevronRight, { className: "w-3.5 h-3.5" }) })
      ] })
    ] })
  ] });
}
function Sheet({ open, onClose, title, subtitle, children, footer, width = "w-[480px]" }) {
  React6__default.default.useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { onClick: onClose, className: cn("fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0 pointer-events-none") }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: cn("fixed top-0 right-0 h-full z-50 flex flex-col border-l bg-background shadow-2xl transition-transform duration-300", width, open ? "translate-x-0" : "translate-x-full"), children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b shrink-0", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h2", { className: "text-base font-semibold", children: title }),
          subtitle && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: subtitle })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: onClose, className: "p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mt-0.5", children: /* @__PURE__ */ jsxRuntime.jsx(lucideReact.X, { className: "w-4 h-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex-1 overflow-y-auto px-5 py-4", children }),
      footer && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "shrink-0 px-5 py-4 border-t flex items-center gap-2", children: footer })
    ] })
  ] });
}
function FieldControl({ descriptor, value, onChange, entity, readonly }) {
  if (descriptor.editControl && !readonly) return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: descriptor.editControl(value, onChange, entity) });
  if (readonly && descriptor.render) return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: descriptor.render(value, entity) });
  if (readonly) return /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm py-1", children: value != null && value !== "" ? String(value) : "\u2014" });
  const base = "h-8 px-2.5 rounded-md border bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors w-full";
  switch (descriptor.type) {
    case "text":
    case "email":
    case "url":
      return /* @__PURE__ */ jsxRuntime.jsx("input", { type: descriptor.type, value: String(value ?? ""), onChange: (e) => onChange(e.target.value), placeholder: descriptor.placeholder, className: base });
    case "number":
      return /* @__PURE__ */ jsxRuntime.jsx("input", { type: "number", value: String(value ?? ""), onChange: (e) => onChange(e.target.valueAsNumber), placeholder: descriptor.placeholder, className: base });
    case "textarea":
      return /* @__PURE__ */ jsxRuntime.jsx("textarea", { value: String(value ?? ""), onChange: (e) => onChange(e.target.value), placeholder: descriptor.placeholder, className: "w-full min-h-[80px] rounded-md border bg-muted/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors" });
    case "markdown":
      return /* @__PURE__ */ jsxRuntime.jsx(MarkdownFieldEditor, { value: String(value ?? ""), onChange: (nextValue) => onChange(nextValue), placeholder: descriptor.placeholder });
    case "date":
      return /* @__PURE__ */ jsxRuntime.jsx("input", { type: "date", value: value ? new Date(value).toISOString().split("T")[0] : "", onChange: (e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null), className: base });
    case "boolean":
      return /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          role: "switch",
          "aria-checked": !!value,
          onClick: () => onChange(!value),
          className: cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", value ? "bg-primary" : "bg-input"),
          children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: cn("inline-block h-3.5 w-3.5 rounded-full bg-background shadow transition-transform", value ? "translate-x-4" : "translate-x-0.5") })
        }
      );
    case "enum":
      return /* @__PURE__ */ jsxRuntime.jsxs("select", { value: String(value ?? ""), onChange: (e) => onChange(e.target.value), className: cn(base, "appearance-none cursor-pointer"), children: [
        !value && /* @__PURE__ */ jsxRuntime.jsx("option", { value: "", children: "Select\u2026" }),
        (descriptor.options ?? []).map((o) => /* @__PURE__ */ jsxRuntime.jsx("option", { value: o.value, children: o.label }, o.value))
      ] });
    case "json":
      return /* @__PURE__ */ jsxRuntime.jsx(
        "textarea",
        {
          value: value != null ? JSON.stringify(value, null, 2) : "",
          onChange: (event) => {
            const nextValue = event.target.value;
            try {
              onChange(nextValue ? JSON.parse(nextValue) : null);
            } catch {
              onChange(nextValue);
            }
          },
          placeholder: descriptor.placeholder,
          className: "w-full min-h-[120px] rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
        }
      );
    default:
      return /* @__PURE__ */ jsxRuntime.jsx("input", { value: String(value ?? ""), onChange: (e) => onChange(e.target.value), className: base });
  }
}
function FieldReadonlyValue({ descriptor, value, entity }) {
  if (descriptor.render) return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: descriptor.render(value, entity) });
  if (descriptor.type === "markdown") return /* @__PURE__ */ jsxRuntime.jsx(MarkdownFieldRenderer, { value: String(value ?? ""), className: "prose prose-sm max-w-none py-1" });
  if (descriptor.type === "json") return /* @__PURE__ */ jsxRuntime.jsx("pre", { className: "text-xs py-1 whitespace-pre-wrap break-words", children: JSON.stringify(value ?? null, null, 2) });
  return /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm py-1", children: value != null && value !== "" ? String(value) : "\u2014" });
}
function EntityDetailSheet({ crud, fields, title = "Details", description, children, showEditButton = true, showDeleteButton = true, deleteConfirmMessage = "This action cannot be undone." }) {
  const [confirmDelete, setConfirmDelete] = React6__default.default.useState(false);
  const open = crud.mode === "detail" && !!crud.selectedId;
  const entity = crud.detail;
  const resolvedTitle = entity && typeof title === "function" ? title(entity) : String(title);
  const resolvedDesc = entity && description ? typeof description === "function" ? description(entity) : description : void 0;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    Sheet,
    {
      open,
      onClose: () => crud.select(null),
      title: resolvedTitle,
      subtitle: resolvedDesc,
      footer: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
        showEditButton && /* @__PURE__ */ jsxRuntime.jsxs("button", { onClick: () => crud.startEdit(), className: "flex-1 h-8 rounded-md border text-sm hover:bg-muted transition-colors flex items-center justify-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Pencil, { className: "w-3.5 h-3.5" }),
          "Edit"
        ] }),
        showDeleteButton && /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: () => setConfirmDelete(true), className: "h-8 w-8 flex items-center justify-center rounded-md border text-destructive hover:bg-destructive/10 transition-colors", children: /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Trash2, { className: "w-3.5 h-3.5" }) })
      ] }),
      children: [
        crud.detailIsLoading && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center justify-center h-32", children: /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Loader2, { className: "w-4 h-4 animate-spin text-muted-foreground" }) }),
        entity && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-4", children: [
          fields.map((f) => /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1", children: f.label }),
            /* @__PURE__ */ jsxRuntime.jsx(FieldReadonlyValue, { descriptor: f, value: getValueAtPath(entity, f.field), entity })
          ] }, f.field)),
          children && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "border-t my-1" }),
            children(entity, crud)
          ] })
        ] }),
        confirmDelete && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [
          /* @__PURE__ */ jsxRuntime.jsx("div", { onClick: () => setConfirmDelete(false), className: "absolute inset-0 bg-black/50 backdrop-blur-sm" }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative bg-background border rounded-xl shadow-2xl w-full max-w-sm p-5 animate-in fade-in", children: [
            /* @__PURE__ */ jsxRuntime.jsxs("h3", { className: "text-sm font-semibold mb-1", children: [
              "Delete ",
              resolvedTitle,
              "?"
            ] }),
            /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-xs text-muted-foreground mb-4", children: deleteConfirmMessage }),
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-2 justify-end", children: [
              /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: () => setConfirmDelete(false), className: "h-7 px-3 rounded border text-sm hover:bg-muted transition-colors", children: "Cancel" }),
              /* @__PURE__ */ jsxRuntime.jsxs(
                "button",
                {
                  onClick: async () => {
                    await crud.deleteEntity();
                    setConfirmDelete(false);
                  },
                  disabled: crud.isDeleting,
                  className: "h-7 px-3 rounded bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-1",
                  children: [
                    crud.isDeleting && /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Loader2, { className: "w-3 h-3 animate-spin" }),
                    "Delete"
                  ]
                }
              )
            ] })
          ] })
        ] })
      ]
    }
  );
}
function EntityFormSheet({ crud, fields, createTitle = "Create", editTitle = "Edit" }) {
  const isCreate = crud.mode === "create";
  const isEdit = crud.mode === "edit";
  const open = isCreate || isEdit;
  const buf = isCreate ? crud.createBuffer : crud.editBuffer;
  const setField = isCreate ? crud.setCreateField : crud.setField;
  const handleSave = isCreate ? crud.create : crud.save;
  const handleClose = isCreate ? crud.cancelCreate : crud.cancelEdit;
  const isPending = isCreate ? crud.isCreating : crud.isSaving;
  const error = isCreate ? crud.createError : crud.saveError;
  const resolvedTitle = isCreate ? createTitle : crud.detail && typeof editTitle === "function" ? editTitle(crud.detail) : String(editTitle);
  const visibleFields = fields.filter((f) => isCreate ? !f.hideOnCreate : !f.hideOnEdit);
  return /* @__PURE__ */ jsxRuntime.jsx(
    Sheet,
    {
      open,
      onClose: handleClose,
      title: resolvedTitle,
      subtitle: isEdit && crud.dirty.isDirty ? `${crud.dirty.changed.size} field${crud.dirty.changed.size > 1 ? "s" : ""} modified` : void 0,
      footer: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
        /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: handleClose, disabled: isPending, className: "flex-1 h-8 rounded-md border text-sm hover:bg-muted transition-colors", children: "Cancel" }),
        /* @__PURE__ */ jsxRuntime.jsxs("button", { onClick: handleSave, disabled: isPending || isEdit && !crud.dirty.isDirty, className: "flex-1 h-8 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5", children: [
          isPending && /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Loader2, { className: "w-3.5 h-3.5 animate-spin" }),
          isCreate ? "Create" : "Save changes"
        ] })
      ] }),
      children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-4", children: [
        error && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive", children: error }),
        visibleFields.map((f) => {
          const isDirty = !isCreate && crud.dirty.changed.has(f.field);
          const currentValue = getValueAtPath(buf, f.field);
          return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntime.jsxs("label", { className: cn("text-xs font-medium", isDirty ? "text-primary" : "text-muted-foreground"), children: [
              f.label,
              f.required && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-destructive ml-0.5", children: "*" }),
              isDirty && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ml-1.5 text-[10px] font-normal opacity-70", children: "modified" })
            ] }),
            /* @__PURE__ */ jsxRuntime.jsx(FieldControl, { descriptor: f, value: currentValue, onChange: (v) => setField(f.field, v), entity: buf, readonly: f.readonlyOnEdit && isEdit }),
            f.hint && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-[10px] text-muted-foreground", children: f.hint })
          ] }, f.field);
        })
      ] })
    }
  );
}
function SortHeader({ column, label }) {
  const sorted = column.getIsSorted();
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "button",
    {
      type: "button",
      onClick: () => column.toggleSorting(sorted === "asc"),
      className: "flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
      children: [
        label,
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "opacity-50 group-hover:opacity-100 text-[10px]", children: sorted === "asc" ? "\u2191" : sorted === "desc" ? "\u2193" : "\u2195" })
      ]
    }
  );
}
function selectionColumn() {
  return {
    id: "__select__",
    size: 40,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => /* @__PURE__ */ jsxRuntime.jsx(
      "input",
      {
        type: "checkbox",
        checked: table.getIsAllPageRowsSelected(),
        ref: (el) => {
          if (el) el.indeterminate = table.getIsSomePageRowsSelected();
        },
        onChange: (e) => table.toggleAllPageRowsSelected(e.target.checked),
        className: "rounded border-border",
        "aria-label": "Select all rows on this page"
      }
    ),
    cell: ({ row }) => /* @__PURE__ */ jsxRuntime.jsx(
      "input",
      {
        type: "checkbox",
        checked: row.getIsSelected(),
        onChange: (e) => row.toggleSelected(e.target.checked),
        onClick: (e) => e.stopPropagation(),
        className: "rounded border-border",
        "aria-label": `Select row ${row.id}`
      }
    )
  };
}
function textColumn(opts) {
  const { field, header, size = 200, editable = false, filterType = "text", cell } = opts;
  return {
    id: field,
    accessorKey: field,
    size,
    header: ({ column }) => /* @__PURE__ */ jsxRuntime.jsx(SortHeader, { column, label: header }),
    cell: ({ getValue, row }) => {
      const v = getValue();
      return cell ? cell(v, row.original) : /* @__PURE__ */ jsxRuntime.jsx("span", { className: "truncate block", title: v, children: v });
    },
    meta: { entityMeta: { field, filterType, editable, hideable: true } }
  };
}
function numberColumn(opts) {
  const { field, header, size = 100, format = (v) => v.toLocaleString(), editable = false } = opts;
  return {
    id: field,
    accessorKey: field,
    size,
    header: ({ column }) => /* @__PURE__ */ jsxRuntime.jsx(SortHeader, { column, label: header }),
    cell: ({ getValue }) => {
      const v = getValue();
      return /* @__PURE__ */ jsxRuntime.jsx("span", { className: "tabular-nums text-right block", children: v != null ? format(v) : "\u2014" });
    },
    meta: { entityMeta: { field, filterType: "number", editable, hideable: true } }
  };
}
function dateColumn(opts) {
  const { field, header, size = 140, format = { year: "numeric", month: "short", day: "numeric" } } = opts;
  return {
    id: field,
    accessorKey: field,
    size,
    header: ({ column }) => /* @__PURE__ */ jsxRuntime.jsx(SortHeader, { column, label: header }),
    cell: ({ getValue }) => {
      const v = getValue();
      return v ? /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-sm", children: new Date(v).toLocaleDateString(void 0, format) }) : /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground", children: "\u2014" });
    },
    meta: { entityMeta: { field, filterType: "dateRange", hideable: true } }
  };
}
function booleanColumn(opts) {
  const { field, header, size = 80, trueLabel = "Yes", falseLabel = "No" } = opts;
  return {
    id: field,
    accessorKey: field,
    size,
    header,
    cell: ({ getValue }) => {
      const v = getValue();
      return /* @__PURE__ */ jsxRuntime.jsx("span", { className: v ? "text-green-600" : "text-muted-foreground", children: v ? trueLabel : falseLabel });
    },
    meta: { entityMeta: { field, filterType: "boolean", hideable: true } }
  };
}
function enumColumn(opts) {
  const { field, header, options, size = 120, editable = false } = opts;
  const map = new Map(options.map((o) => [o.value, o]));
  return {
    id: field,
    accessorKey: field,
    size,
    header: ({ column }) => /* @__PURE__ */ jsxRuntime.jsx(SortHeader, { column, label: header }),
    cell: ({ getValue }) => {
      const v = getValue();
      const opt = map.get(v);
      return opt ? /* @__PURE__ */ jsxRuntime.jsx("span", { className: `inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${opt.className ?? "bg-muted text-muted-foreground border-border"}`, children: opt.label }) : /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-xs text-muted-foreground", children: v });
    },
    meta: { entityMeta: { field, filterType: "enum", enumOptions: options.map((o) => ({ label: o.label, value: o.value })), editable, hideable: true } }
  };
}
function actionsColumn(actions) {
  return {
    id: "__actions__",
    size: 48,
    enableSorting: false,
    enableHiding: false,
    header: () => null,
    cell: ({ row }) => /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity", children: actions.filter((a) => !a.hidden?.(row.original)).map((action) => /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        type: "button",
        onClick: (e) => {
          e.stopPropagation();
          action.onClick(row.original);
        },
        disabled: action.disabled?.(row.original),
        className: `p-1 rounded text-xs transition-colors ${action.destructive ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`,
        children: action.icon ? /* @__PURE__ */ jsxRuntime.jsx(action.icon, { className: "w-3.5 h-3.5" }) : action.label
      },
      action.label
    )) })
  };
}

// src/table/row-models.ts
function resolveAccessor(columnDef, row, index) {
  if (columnDef.accessorFn) return columnDef.accessorFn(row, index);
  if (columnDef.accessorKey) return row[columnDef.accessorKey];
  return void 0;
}
var builtInFilterFns = {
  auto: (row, columnId, filterValue) => {
    const val = row.getValue(columnId);
    if (filterValue == null || filterValue === "") return true;
    if (typeof val === "string") return val.toLowerCase().includes(String(filterValue).toLowerCase());
    if (typeof val === "number") return val === Number(filterValue);
    if (typeof val === "boolean") return val === filterValue;
    return String(val).toLowerCase().includes(String(filterValue).toLowerCase());
  }
};
function defaultSortingFn(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b));
}
function createRow(original, index, columns, table, depth = 0, parentId, subRows = []) {
  const id = table.options.getRowId ? table.options.getRowId(original, index) : String(index);
  const row = {
    id,
    index,
    original,
    depth,
    parentId,
    subRows,
    getValue: (columnId) => {
      const col = columns.find((c) => c.id === columnId);
      if (!col) return void 0;
      return resolveAccessor(col.columnDef, original, index);
    },
    renderValue: (columnId) => {
      const val = row.getValue(columnId);
      return val ?? null;
    },
    getIsSelected: () => !!table.getState().rowSelection[id],
    getCanSelect: () => {
      const opt = table.options.enableRowSelection;
      if (opt === false) return false;
      if (typeof opt === "function") return opt(row);
      return true;
    },
    getIsAllSubRowsSelected: () => subRows.length > 0 && subRows.every((sr) => sr.getIsSelected()),
    getIsSomeSelected: () => subRows.some((sr) => sr.getIsSelected() || sr.getIsSomeSelected()),
    toggleSelected: (value) => {
      const next = value ?? !row.getIsSelected();
      table.setRowSelection((prev) => ({ ...prev, [id]: next }));
    },
    getToggleSelectedHandler: () => (e) => {
      row.toggleSelected();
    },
    getIsExpanded: () => {
      const expanded = table.getState().expanded;
      if (expanded === true) return true;
      return !!expanded[id];
    },
    getCanExpand: () => subRows.length > 0,
    toggleExpanded: (value) => {
      const next = value ?? !row.getIsExpanded();
      table.setExpanded((prev) => {
        if (prev === true) {
          const allRows = {};
          table.getCoreRowModel().flatRows.forEach((r) => {
            allRows[r.id] = true;
          });
          allRows[id] = next;
          return allRows;
        }
        return { ...prev, [id]: next };
      });
    },
    getToggleExpandedHandler: () => () => row.toggleExpanded(),
    getIsGrouped: () => !!row.groupingColumnId,
    groupingColumnId: void 0,
    groupingValue: void 0,
    getVisibleCells: () => row.getAllCells().filter((cell) => cell.column.getIsVisible()),
    getAllCells: () => columns.map((col) => createCell(row, col, table)),
    getIsPinned: () => false,
    pin: () => {
    }
  };
  return row;
}
function createCell(row, column, table) {
  const cellId = `${row.id}_${column.id}`;
  const cell = {
    id: cellId,
    row,
    column,
    getValue: () => row.getValue(column.id),
    renderValue: () => row.renderValue(column.id),
    getIsGrouped: () => row.getIsGrouped() && row.groupingColumnId === column.id,
    getIsPlaceholder: () => false,
    getIsAggregated: () => row.subRows.length > 0 && row.getIsGrouped() && row.groupingColumnId !== column.id,
    getContext: () => ({
      table,
      row,
      cell,
      column,
      getValue: cell.getValue,
      renderValue: cell.renderValue
    })
  };
  return cell;
}
function getCoreRowModel2(data, columns, table) {
  const getSubRows = table.options.getSubRows;
  const flatRows = [];
  function processRows(items, depth, parentId) {
    return items.map((item, index) => {
      const subData = getSubRows?.(item, index);
      const row = createRow(item, flatRows.length, columns, table, depth, parentId);
      flatRows.push(row);
      if (subData && subData.length > 0) {
        row.subRows = processRows(subData, depth + 1, row.id);
      }
      return row;
    });
  }
  const rows = processRows(data, 0);
  const rowsById = {};
  flatRows.forEach((r) => {
    rowsById[r.id] = r;
  });
  return { rows, flatRows, rowsById };
}
function getFilteredRowModel(rowModel, columnFilters, globalFilter, columns, globalFilterFn) {
  const hasColumnFilters = columnFilters.length > 0;
  const hasGlobalFilter = globalFilter != null && globalFilter !== "";
  if (!hasColumnFilters && !hasGlobalFilter) return rowModel;
  const filterFns = /* @__PURE__ */ new Map();
  for (const cf of columnFilters) {
    const col = columns.find((c) => c.id === cf.id);
    if (col) {
      const fn = col.columnDef.filterFn;
      filterFns.set(cf.id, typeof fn === "function" ? fn : builtInFilterFns.auto);
    }
  }
  const resolvedGlobalFilterFn = globalFilterFn ?? builtInFilterFns.auto;
  const flatRows = [];
  function filterRows(rows2) {
    return rows2.filter((row) => {
      for (const cf of columnFilters) {
        const fn = filterFns.get(cf.id);
        if (fn && !fn(row, cf.id, cf.value)) return false;
      }
      if (hasGlobalFilter) {
        const matches = columns.some(
          (col) => resolvedGlobalFilterFn(row, col.id, globalFilter)
        );
        if (!matches) return false;
      }
      flatRows.push(row);
      if (row.subRows.length > 0) {
        const filteredSubRows = filterRows(row.subRows);
        if (filteredSubRows.length > 0) {
          row = { ...row, subRows: filteredSubRows };
          return true;
        }
      }
      return true;
    });
  }
  const rows = filterRows(rowModel.rows);
  const rowsById = {};
  flatRows.forEach((r) => {
    rowsById[r.id] = r;
  });
  return { rows, flatRows, rowsById };
}
function getSortedRowModel2(rowModel, sorting, columns) {
  if (sorting.length === 0) return rowModel;
  const sortFns = sorting.map((s) => {
    const col = columns.find((c) => c.id === s.id);
    const colDef = col?.columnDef ?? null;
    let fn = null;
    if (colDef?.sortingFn && typeof colDef.sortingFn === "function") {
      fn = colDef.sortingFn;
    }
    return { columnId: s.id, desc: s.desc, fn, colDef };
  });
  function sortRows(rows2) {
    const sorted = [...rows2].sort((rowA, rowB) => {
      for (const { columnId, desc, fn, colDef } of sortFns) {
        let result;
        if (fn) {
          result = fn(rowA, rowB, columnId);
        } else {
          const a = rowA.getValue(columnId);
          const b = rowB.getValue(columnId);
          result = defaultSortingFn(a, b);
        }
        if (colDef?.invertSorting) result = -result;
        if (result !== 0) return desc ? -result : result;
      }
      return 0;
    });
    return sorted.map((row) => {
      if (row.subRows.length > 0) {
        return { ...row, subRows: sortRows(row.subRows) };
      }
      return row;
    });
  }
  const rows = sortRows(rowModel.rows);
  const flatRows = [];
  function flatten(rows2) {
    rows2.forEach((r) => {
      flatRows.push(r);
      if (r.subRows.length) flatten(r.subRows);
    });
  }
  flatten(rows);
  const rowsById = {};
  flatRows.forEach((r) => {
    rowsById[r.id] = r;
  });
  return { rows, flatRows, rowsById };
}
function getGroupedRowModel(rowModel, grouping, columns, table) {
  if (grouping.length === 0) return rowModel;
  function groupRows(rows2, depth) {
    if (depth >= grouping.length) return rows2;
    const columnId = grouping[depth];
    const groups = /* @__PURE__ */ new Map();
    for (const row of rows2) {
      const value = row.getValue(columnId);
      const key = value ?? "__null__";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    const groupedRows = [];
    let groupIndex = 0;
    for (const [key, groupItems] of groups) {
      const firstRow = groupItems[0];
      const groupRow = createRow(
        firstRow.original,
        groupIndex++,
        columns,
        table,
        depth
      );
      groupRow.groupingColumnId = columnId;
      groupRow.groupingValue = key === "__null__" ? null : key;
      groupRow.subRows = groupRows(groupItems, depth + 1);
      groupedRows.push(groupRow);
    }
    return groupedRows;
  }
  const rows = groupRows(rowModel.rows, 0);
  const flatRows = [];
  function flatten(items) {
    items.forEach((r) => {
      flatRows.push(r);
      if (r.subRows.length) flatten(r.subRows);
    });
  }
  flatten(rows);
  const rowsById = {};
  flatRows.forEach((r) => {
    rowsById[r.id] = r;
  });
  return { rows, flatRows, rowsById };
}
function getExpandedRowModel(rowModel, expanded) {
  const flatRows = [];
  function expandRows(rows2) {
    const result = [];
    for (const row of rows2) {
      result.push(row);
      flatRows.push(row);
      const isExpanded = expanded === true || typeof expanded === "object" && expanded[row.id];
      if (isExpanded && row.subRows.length > 0) {
        const expandedSubRows = expandRows(row.subRows);
        result.push(...expandedSubRows);
      }
    }
    return result;
  }
  const rows = expandRows(rowModel.rows);
  const rowsById = {};
  flatRows.forEach((r) => {
    rowsById[r.id] = r;
  });
  return { rows, flatRows, rowsById };
}
function getPaginatedRowModel(rowModel, pagination) {
  const { pageIndex, pageSize } = pagination;
  const start = pageIndex * pageSize;
  const end = start + pageSize;
  const rows = rowModel.rows.slice(start, end);
  const flatRows = rows;
  const rowsById = {};
  flatRows.forEach((r) => {
    rowsById[r.id] = r;
  });
  return { rows, flatRows, rowsById };
}
function getSelectedRowModel(rowModel, selection) {
  const rows = rowModel.flatRows.filter((r) => selection[r.id]);
  const rowsById = {};
  rows.forEach((r) => {
    rowsById[r.id] = r;
  });
  return { rows, flatRows: rows, rowsById };
}

// src/table/use-table.ts
var defaultState = {
  columnSizingInfo: {
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    columnSizingStart: []
  }};
function resolveUpdater(updater, prev) {
  return typeof updater === "function" ? updater(prev) : updater;
}
function getColumnId(def, index) {
  return def.id ?? def.accessorKey ?? `col_${index}`;
}
function buildColumns(defs, table, stateSetters, depth = 0, parent) {
  return defs.map((def, index) => {
    const id = getColumnId(def, index);
    const column = {
      id,
      depth,
      columnDef: def,
      columns: [],
      parent,
      getFlatColumns: () => {
        const flat = [column];
        column.columns.forEach((c) => {
          flat.push(...c.getFlatColumns());
        });
        return flat;
      },
      getLeafColumns: () => {
        if (column.columns.length === 0) return [column];
        return column.columns.flatMap((c) => c.getLeafColumns());
      },
      // Sorting
      getIsSorted: () => {
        const s = table.getState().sorting.find((s2) => s2.id === id);
        if (!s) return false;
        return s.desc ? "desc" : "asc";
      },
      getNextSortingOrder: () => {
        const current = column.getIsSorted();
        if (!current) return def.sortDescFirst ? "desc" : "asc";
        if (current === "asc") return "desc";
        return false;
      },
      getCanSort: () => def.enableSorting !== false,
      toggleSorting: (desc, isMulti) => {
        stateSetters.setSorting(((prev) => {
          const existingIndex = prev.findIndex((s) => s.id === id);
          if (desc === void 0) {
            const nextOrder = column.getNextSortingOrder();
            if (nextOrder === false) {
              return isMulti ? prev.filter((s) => s.id !== id) : [];
            }
            const newSort2 = { id, desc: nextOrder === "desc" };
            if (isMulti) {
              if (existingIndex >= 0) {
                const next = [...prev];
                next[existingIndex] = newSort2;
                return next;
              }
              return [...prev, newSort2];
            }
            return [newSort2];
          }
          const newSort = { id, desc };
          if (isMulti) {
            if (existingIndex >= 0) {
              const next = [...prev];
              next[existingIndex] = newSort;
              return next;
            }
            return [...prev, newSort];
          }
          return [newSort];
        }));
      },
      clearSorting: () => {
        stateSetters.setSorting(((prev) => prev.filter((s) => s.id !== id)));
      },
      getSortIndex: () => table.getState().sorting.findIndex((s) => s.id === id),
      getAutoSortingFn: () => (() => 0),
      getAutoSortDir: () => "asc",
      // Filtering
      getIsFiltered: () => table.getState().columnFilters.some((f) => f.id === id),
      getFilterValue: () => table.getState().columnFilters.find((f) => f.id === id)?.value,
      setFilterValue: (value) => {
        stateSetters.setColumnFilters(((prev) => {
          const existing = prev.findIndex((f) => f.id === id);
          if (value == null || value === "") {
            return existing >= 0 ? prev.filter((f) => f.id !== id) : prev;
          }
          if (existing >= 0) {
            const next = [...prev];
            next[existing] = { id, value };
            return next;
          }
          return [...prev, { id, value }];
        }));
      },
      getCanFilter: () => def.enableFiltering !== false,
      getAutoFilterFn: () => void 0,
      // Visibility
      getIsVisible: () => table.getState().columnVisibility[id] !== false,
      toggleVisibility: (value) => {
        stateSetters.setColumnVisibility(((prev) => ({
          ...prev,
          [id]: value ?? !column.getIsVisible()
        })));
      },
      getCanHide: () => def.enableHiding !== false,
      // Pinning
      getIsPinned: () => {
        const p = table.getState().columnPinning;
        if (p.left?.includes(id)) return "left";
        if (p.right?.includes(id)) return "right";
        return false;
      },
      pin: (position) => {
        stateSetters.setColumnPinning(((prev) => {
          const left = (prev.left ?? []).filter((c) => c !== id);
          const right = (prev.right ?? []).filter((c) => c !== id);
          if (position === "left") left.push(id);
          if (position === "right") right.push(id);
          return { left, right };
        }));
      },
      getCanPin: () => def.enablePinning !== false,
      // Grouping
      getIsGrouped: () => table.getState().grouping.includes(id),
      toggleGrouping: () => {
        stateSetters.setGrouping(((prev) => {
          if (prev.includes(id)) return prev.filter((g) => g !== id);
          return [...prev, id];
        }));
      },
      getCanGroup: () => def.enableGrouping !== false,
      getGroupedIndex: () => table.getState().grouping.indexOf(id),
      // Sizing
      getSize: () => {
        const custom = table.getState().columnSizing[id];
        return custom ?? def.size ?? 150;
      },
      getStart: (_position) => {
        return 0;
      },
      getCanResize: () => def.enableResizing !== false,
      resetSize: () => {
        stateSetters.setColumnSizing(((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        }));
      },
      getIndex: () => 0
    };
    if (def.columns) {
      column.columns = buildColumns(def.columns, table, stateSetters, depth + 1, column);
    }
    return column;
  });
}
function buildHeaderGroups(columns, table) {
  const leafColumns = columns.flatMap((c) => c.getLeafColumns());
  const headers = leafColumns.map((column, idx) => {
    const header = {
      id: column.id,
      index: idx,
      depth: 0,
      column,
      isPlaceholder: false,
      subHeaders: [],
      colSpan: 1,
      rowSpan: 1,
      getSize: () => column.getSize(),
      getStart: () => 0,
      getContext: () => ({ table, header, column }),
      getResizeHandler: () => {
        return (_event) => {
        };
      },
      getLeafHeaders: () => [header]
    };
    return header;
  });
  return [{ id: "headerGroup_0", depth: 0, headers }];
}
function useTable(options) {
  const { data, columns: columnDefs } = options;
  const ini = options.initialState;
  const [sorting, _setSorting] = React6.useState(
    options.state?.sorting ?? ini?.sorting ?? []
  );
  const [columnFilters, _setColumnFilters] = React6.useState(
    options.state?.columnFilters ?? ini?.columnFilters ?? []
  );
  const [globalFilter, _setGlobalFilter] = React6.useState(
    options.state?.globalFilter ?? ini?.globalFilter ?? ""
  );
  const [rowSelection, _setRowSelection] = React6.useState(
    options.state?.rowSelection ?? ini?.rowSelection ?? {}
  );
  const [columnVisibility, _setColumnVisibility] = React6.useState(
    options.state?.columnVisibility ?? ini?.columnVisibility ?? {}
  );
  const [columnOrder, _setColumnOrder] = React6.useState(
    options.state?.columnOrder ?? ini?.columnOrder ?? []
  );
  const [columnPinning, _setColumnPinning] = React6.useState(
    options.state?.columnPinning ?? ini?.columnPinning ?? { left: [], right: [] }
  );
  const [columnSizing, _setColumnSizing] = React6.useState(
    options.state?.columnSizing ?? ini?.columnSizing ?? {}
  );
  const [columnSizingInfo, _setColumnSizingInfo] = React6.useState(
    options.state?.columnSizingInfo ?? ini?.columnSizingInfo ?? defaultState.columnSizingInfo
  );
  const [expanded, _setExpanded] = React6.useState(
    options.state?.expanded ?? ini?.expanded ?? {}
  );
  const [grouping, _setGrouping] = React6.useState(
    options.state?.grouping ?? ini?.grouping ?? []
  );
  const [pagination, _setPagination] = React6.useState(
    options.state?.pagination ?? ini?.pagination ?? { pageIndex: 0, pageSize: 10 }
  );
  const state = React6.useMemo(
    () => ({
      sorting: options.state?.sorting ?? sorting,
      columnFilters: options.state?.columnFilters ?? columnFilters,
      globalFilter: options.state?.globalFilter ?? globalFilter,
      rowSelection: options.state?.rowSelection ?? rowSelection,
      columnVisibility: options.state?.columnVisibility ?? columnVisibility,
      columnOrder: options.state?.columnOrder ?? columnOrder,
      columnPinning: options.state?.columnPinning ?? columnPinning,
      columnSizing: options.state?.columnSizing ?? columnSizing,
      columnSizingInfo: options.state?.columnSizingInfo ?? columnSizingInfo,
      expanded: options.state?.expanded ?? expanded,
      grouping: options.state?.grouping ?? grouping,
      pagination: options.state?.pagination ?? pagination
    }),
    [
      options.state,
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
      columnOrder,
      columnPinning,
      columnSizing,
      columnSizingInfo,
      expanded,
      grouping,
      pagination
    ]
  );
  const stateRef = React6.useRef(state);
  stateRef.current = state;
  const setSorting = React6.useCallback((updater) => {
    options.onSortingChange?.(updater);
    if (!options.state?.sorting) _setSorting((prev) => resolveUpdater(updater, prev));
  }, [options.onSortingChange, options.state?.sorting]);
  const setColumnFilters = React6.useCallback((updater) => {
    options.onColumnFiltersChange?.(updater);
    if (!options.state?.columnFilters) _setColumnFilters((prev) => resolveUpdater(updater, prev));
    if (options.autoResetPageIndex !== false) {
      _setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [options.onColumnFiltersChange, options.state?.columnFilters, options.autoResetPageIndex]);
  const setGlobalFilter = React6.useCallback((value) => {
    options.onGlobalFilterChange?.(value);
    if (!options.state?.globalFilter) _setGlobalFilter(value);
    if (options.autoResetPageIndex !== false) {
      _setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [options.onGlobalFilterChange, options.state?.globalFilter, options.autoResetPageIndex]);
  const setRowSelection = React6.useCallback((updater) => {
    options.onRowSelectionChange?.(updater);
    if (!options.state?.rowSelection) _setRowSelection((prev) => resolveUpdater(updater, prev));
  }, [options.onRowSelectionChange, options.state?.rowSelection]);
  const setColumnVisibility = React6.useCallback((updater) => {
    options.onColumnVisibilityChange?.(updater);
    if (!options.state?.columnVisibility) _setColumnVisibility((prev) => resolveUpdater(updater, prev));
  }, [options.onColumnVisibilityChange, options.state?.columnVisibility]);
  const setColumnOrder = React6.useCallback((updater) => {
    options.onColumnOrderChange?.(updater);
    if (!options.state?.columnOrder) _setColumnOrder((prev) => resolveUpdater(updater, prev));
  }, [options.onColumnOrderChange, options.state?.columnOrder]);
  const setColumnPinning = React6.useCallback((updater) => {
    options.onColumnPinningChange?.(updater);
    if (!options.state?.columnPinning) _setColumnPinning((prev) => resolveUpdater(updater, prev));
  }, [options.onColumnPinningChange, options.state?.columnPinning]);
  const setColumnSizing = React6.useCallback((updater) => {
    options.onColumnSizingChange?.(updater);
    if (!options.state?.columnSizing) _setColumnSizing((prev) => resolveUpdater(updater, prev));
  }, [options.onColumnSizingChange, options.state?.columnSizing]);
  const setColumnSizingInfo = React6.useCallback((updater) => {
    options.onColumnSizingInfoChange?.(updater);
    if (!options.state?.columnSizingInfo) _setColumnSizingInfo((prev) => resolveUpdater(updater, prev));
  }, [options.onColumnSizingInfoChange, options.state?.columnSizingInfo]);
  const setExpanded = React6.useCallback((updater) => {
    options.onExpandedChange?.(updater);
    if (!options.state?.expanded) _setExpanded((prev) => resolveUpdater(updater, prev));
  }, [options.onExpandedChange, options.state?.expanded]);
  const setGrouping = React6.useCallback((updater) => {
    options.onGroupingChange?.(updater);
    if (!options.state?.grouping) _setGrouping((prev) => resolveUpdater(updater, prev));
  }, [options.onGroupingChange, options.state?.grouping]);
  const setPagination = React6.useCallback((updater) => {
    options.onPaginationChange?.(updater);
    if (!options.state?.pagination) _setPagination((prev) => resolveUpdater(updater, prev));
  }, [options.onPaginationChange, options.state?.pagination]);
  const stateSetters = React6.useMemo(() => ({
    setSorting,
    setColumnFilters,
    setGlobalFilter,
    setRowSelection,
    setColumnVisibility,
    setColumnOrder,
    setColumnPinning,
    setColumnSizing,
    setColumnSizingInfo,
    setExpanded,
    setGrouping,
    setPagination
  }), [
    setSorting,
    setColumnFilters,
    setGlobalFilter,
    setRowSelection,
    setColumnVisibility,
    setColumnOrder,
    setColumnPinning,
    setColumnSizing,
    setColumnSizingInfo,
    setExpanded,
    setGrouping,
    setPagination
  ]);
  const getState = React6.useCallback(() => state, [state]);
  const coreRowModelRef = React6.useRef(null);
  const emptyCoreRowModel = React6.useMemo(
    () => ({ rows: [], flatRows: [], rowsById: {} }),
    []
  );
  const rowModelTable = React6.useMemo(
    () => ({
      options,
      getState: () => stateRef.current,
      setRowSelection,
      setExpanded,
      getCoreRowModel: () => coreRowModelRef.current ?? emptyCoreRowModel
    }),
    [options, setRowSelection, setExpanded, emptyCoreRowModel]
  );
  const columns = React6.useMemo(
    () => buildColumns(columnDefs, { getState, ...stateSetters }, stateSetters),
    [columnDefs, getState, stateSetters]
  );
  const orderedColumns = React6.useMemo(() => {
    if (state.columnOrder.length === 0) return columns;
    const ordered = [];
    const remaining = [...columns];
    for (const id of state.columnOrder) {
      const idx = remaining.findIndex((c) => c.id === id);
      if (idx >= 0) {
        ordered.push(remaining[idx]);
        remaining.splice(idx, 1);
      }
    }
    ordered.push(...remaining);
    return ordered;
  }, [columns, state.columnOrder]);
  const visibleColumns = React6.useMemo(
    () => orderedColumns.filter((c) => c.getIsVisible()),
    [orderedColumns]
  );
  const leftPinnedColumns = React6.useMemo(
    () => visibleColumns.filter((c) => c.getIsPinned() === "left"),
    [visibleColumns]
  );
  const rightPinnedColumns = React6.useMemo(
    () => visibleColumns.filter((c) => c.getIsPinned() === "right"),
    [visibleColumns]
  );
  const centerColumns = React6.useMemo(
    () => visibleColumns.filter((c) => c.getIsPinned() === false),
    [visibleColumns]
  );
  const coreRowModel = React6.useMemo(() => {
    const cm = getCoreRowModel2(data, columns, rowModelTable);
    coreRowModelRef.current = cm;
    return cm;
  }, [data, columns, rowModelTable]);
  const filteredRowModel = React6.useMemo(() => {
    if (options.manualFiltering) return coreRowModel;
    return getFilteredRowModel(
      coreRowModel,
      state.columnFilters,
      state.globalFilter,
      columns,
      options.globalFilterFn
    );
  }, [coreRowModel, state.columnFilters, state.globalFilter, columns, options.manualFiltering, options.globalFilterFn]);
  const sortedRowModel = React6.useMemo(() => {
    if (options.manualSorting) return filteredRowModel;
    return getSortedRowModel2(filteredRowModel, state.sorting, columns);
  }, [filteredRowModel, state.sorting, columns, options.manualSorting]);
  const groupedRowModel = React6.useMemo(() => {
    if (options.manualGrouping || state.grouping.length === 0) return sortedRowModel;
    return getGroupedRowModel(sortedRowModel, state.grouping, columns, rowModelTable);
  }, [sortedRowModel, state.grouping, columns, options.manualGrouping, rowModelTable]);
  const expandedRowModel = React6.useMemo(
    () => getExpandedRowModel(groupedRowModel, state.expanded),
    [groupedRowModel, state.expanded]
  );
  const prePaginationRowModel = expandedRowModel;
  const paginatedRowModel = React6.useMemo(() => {
    if (options.manualPagination) return prePaginationRowModel;
    return getPaginatedRowModel(prePaginationRowModel, state.pagination);
  }, [prePaginationRowModel, state.pagination, options.manualPagination]);
  const selectedRowModel = React6.useMemo(
    () => getSelectedRowModel(coreRowModel, state.rowSelection),
    [coreRowModel, state.rowSelection]
  );
  const pageCount = React6.useMemo(() => {
    if (options.pageCount != null) return options.pageCount;
    return Math.ceil(prePaginationRowModel.rows.length / state.pagination.pageSize);
  }, [options.pageCount, prePaginationRowModel, state.pagination.pageSize]);
  const table = React6.useMemo(() => {
    const inst = {
      options,
      getState: () => state,
      setState: (updater) => {
        const next = resolveUpdater(updater, state);
        setSorting(next.sorting);
        setColumnFilters(next.columnFilters);
        setGlobalFilter(next.globalFilter);
        setRowSelection(next.rowSelection);
        setColumnVisibility(next.columnVisibility);
        setColumnOrder(next.columnOrder);
        setColumnPinning(next.columnPinning);
        setColumnSizing(next.columnSizing);
        setColumnSizingInfo(next.columnSizingInfo);
        setExpanded(next.expanded);
        setGrouping(next.grouping);
        setPagination(next.pagination);
      },
      reset: () => {
        setSorting([]);
        setColumnFilters([]);
        setGlobalFilter("");
        setRowSelection({});
        setColumnVisibility({});
        setColumnOrder([]);
        setColumnPinning({ left: [], right: [] });
        setColumnSizing({});
        setColumnSizingInfo(defaultState.columnSizingInfo);
        setExpanded({});
        setGrouping([]);
        setPagination({ pageIndex: 0, pageSize: 10 });
      },
      // Column access
      getAllColumns: () => columns,
      getAllFlatColumns: () => columns.flatMap((c) => c.getFlatColumns()),
      getAllLeafColumns: () => columns.flatMap((c) => c.getLeafColumns()),
      getColumn: (id) => columns.find((c) => c.id === id),
      // Header groups
      getHeaderGroups: () => buildHeaderGroups(visibleColumns, inst),
      getLeftHeaderGroups: () => buildHeaderGroups(leftPinnedColumns, inst),
      getCenterHeaderGroups: () => buildHeaderGroups(centerColumns, inst),
      getRightHeaderGroups: () => buildHeaderGroups(rightPinnedColumns, inst),
      getFooterGroups: () => buildHeaderGroups(visibleColumns, inst),
      // Row models
      getCoreRowModel: () => coreRowModel,
      getRowModel: () => paginatedRowModel,
      getPreFilteredRowModel: () => coreRowModel,
      getFilteredRowModel: () => filteredRowModel,
      getPreSortedRowModel: () => filteredRowModel,
      getSortedRowModel: () => sortedRowModel,
      getGroupedRowModel: () => groupedRowModel,
      getExpandedRowModel: () => expandedRowModel,
      getPrePaginationRowModel: () => prePaginationRowModel,
      getPaginationRowModel: () => paginatedRowModel,
      getSelectedRowModel: () => selectedRowModel,
      getRow: (id) => {
        const row = coreRowModel.rowsById[id];
        if (!row) throw new Error(`Row with id "${id}" not found`);
        return row;
      },
      // Sorting
      setSorting,
      resetSorting: () => setSorting([]),
      // Filtering
      setColumnFilters,
      resetColumnFilters: () => setColumnFilters([]),
      setGlobalFilter,
      resetGlobalFilter: () => setGlobalFilter(""),
      // Pagination
      setPageIndex: (updater) => setPagination((prev) => ({
        ...prev,
        pageIndex: resolveUpdater(updater, prev.pageIndex)
      })),
      resetPageIndex: () => setPagination((prev) => ({ ...prev, pageIndex: 0 })),
      setPageSize: (updater) => setPagination((prev) => ({
        ...prev,
        pageSize: resolveUpdater(updater, prev.pageSize),
        pageIndex: 0
      })),
      resetPageSize: () => setPagination((prev) => ({ ...prev, pageSize: 10 })),
      getPageCount: () => pageCount,
      getCanPreviousPage: () => state.pagination.pageIndex > 0,
      getCanNextPage: () => state.pagination.pageIndex < pageCount - 1,
      previousPage: () => setPagination((prev) => ({
        ...prev,
        pageIndex: Math.max(0, prev.pageIndex - 1)
      })),
      nextPage: () => setPagination((prev) => ({
        ...prev,
        pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1)
      })),
      firstPage: () => setPagination((prev) => ({ ...prev, pageIndex: 0 })),
      lastPage: () => setPagination((prev) => ({
        ...prev,
        pageIndex: Math.max(0, pageCount - 1)
      })),
      // Row selection
      setRowSelection,
      resetRowSelection: () => setRowSelection({}),
      toggleAllRowsSelected: (value) => {
        const next = {};
        const shouldSelect = value ?? !inst.getIsAllRowsSelected();
        if (shouldSelect) {
          coreRowModel.flatRows.forEach((r) => {
            if (r.getCanSelect()) next[r.id] = true;
          });
        }
        setRowSelection(next);
      },
      toggleAllPageRowsSelected: (value) => {
        const shouldSelect = value ?? !inst.getIsAllPageRowsSelected();
        setRowSelection((prev) => {
          const next = { ...prev };
          paginatedRowModel.rows.forEach((r) => {
            if (r.getCanSelect()) next[r.id] = shouldSelect;
          });
          return next;
        });
      },
      getIsAllRowsSelected: () => coreRowModel.flatRows.filter((r) => r.getCanSelect()).every((r) => state.rowSelection[r.id]),
      getIsAllPageRowsSelected: () => paginatedRowModel.rows.filter((r) => r.getCanSelect()).every((r) => state.rowSelection[r.id]),
      getIsSomeRowsSelected: () => coreRowModel.flatRows.some((r) => state.rowSelection[r.id]),
      getIsSomePageRowsSelected: () => paginatedRowModel.rows.some((r) => state.rowSelection[r.id]) && !inst.getIsAllPageRowsSelected(),
      getToggleAllRowsSelectedHandler: () => () => inst.toggleAllRowsSelected(),
      getToggleAllPageRowsSelectedHandler: () => () => inst.toggleAllPageRowsSelected(),
      // Column visibility
      setColumnVisibility,
      resetColumnVisibility: () => setColumnVisibility({}),
      toggleAllColumnsVisible: (value) => {
        const vis = {};
        const shouldShow = value ?? !inst.getIsAllColumnsVisible();
        columns.forEach((c) => {
          vis[c.id] = shouldShow;
        });
        setColumnVisibility(vis);
      },
      getIsAllColumnsVisible: () => columns.every((c) => c.getIsVisible()),
      getIsSomeColumnsVisible: () => columns.some((c) => c.getIsVisible()),
      getToggleAllColumnsVisibilityHandler: () => () => inst.toggleAllColumnsVisible(),
      getVisibleFlatColumns: () => visibleColumns,
      getVisibleLeafColumns: () => visibleColumns.flatMap((c) => c.getLeafColumns()),
      // Column ordering
      setColumnOrder,
      resetColumnOrder: () => setColumnOrder([]),
      // Column pinning
      setColumnPinning,
      resetColumnPinning: () => setColumnPinning({ left: [], right: [] }),
      getLeftFlatColumns: () => leftPinnedColumns,
      getRightFlatColumns: () => rightPinnedColumns,
      getCenterFlatColumns: () => centerColumns,
      getLeftLeafColumns: () => leftPinnedColumns.flatMap((c) => c.getLeafColumns()),
      getRightLeafColumns: () => rightPinnedColumns.flatMap((c) => c.getLeafColumns()),
      getCenterLeafColumns: () => centerColumns.flatMap((c) => c.getLeafColumns()),
      // Column sizing
      setColumnSizing,
      setColumnSizingInfo,
      resetColumnSizing: () => setColumnSizing({}),
      // Grouping
      setGrouping,
      resetGrouping: () => setGrouping([]),
      // Expanding
      setExpanded,
      resetExpanded: () => setExpanded({}),
      toggleAllRowsExpanded: (value) => {
        const shouldExpand = value ?? !inst.getIsAllRowsExpanded();
        if (shouldExpand) {
          const next = {};
          coreRowModel.flatRows.forEach((r) => {
            next[r.id] = true;
          });
          setExpanded(next);
        } else {
          setExpanded({});
        }
      },
      getIsAllRowsExpanded: () => {
        const exp = state.expanded;
        if (exp === true) return true;
        return coreRowModel.flatRows.filter((r) => r.subRows.length > 0).every((r) => exp[r.id]);
      },
      getIsSomeRowsExpanded: () => {
        const exp = state.expanded;
        if (exp === true) return true;
        return Object.values(exp).some(Boolean);
      },
      getCanSomeRowsExpand: () => coreRowModel.flatRows.some((r) => r.subRows.length > 0),
      getExpandedDepth: () => {
        let maxDepth = 0;
        coreRowModel.flatRows.forEach((r) => {
          if (r.depth > maxDepth) maxDepth = r.depth;
        });
        return maxDepth;
      }
    };
    return inst;
  }, [
    options,
    state,
    columns,
    visibleColumns,
    leftPinnedColumns,
    rightPinnedColumns,
    centerColumns,
    coreRowModel,
    filteredRowModel,
    sortedRowModel,
    groupedRowModel,
    expandedRowModel,
    prePaginationRowModel,
    paginatedRowModel,
    selectedRowModel,
    pageCount,
    setSorting,
    setColumnFilters,
    setGlobalFilter,
    setRowSelection,
    setColumnVisibility,
    setColumnOrder,
    setColumnPinning,
    setColumnSizing,
    setColumnSizingInfo,
    setExpanded,
    setGrouping,
    setPagination
  ]);
  return table;
}

// src/table/faceting.ts
function getFacetedUniqueValues(rowModel, columnId) {
  const counts = /* @__PURE__ */ new Map();
  for (const row of rowModel.flatRows) {
    const value = row.getValue(columnId);
    if (Array.isArray(value)) {
      for (const v of value) {
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    } else {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}
function getFacetedMinMaxValues(rowModel, columnId) {
  let min = Infinity;
  let max = -Infinity;
  let hasValue = false;
  for (const row of rowModel.flatRows) {
    const raw = row.getValue(columnId);
    const value = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isNaN(value)) {
      hasValue = true;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }
  return hasValue ? [min, max] : void 0;
}
function getFacetedRowModel(preFilteredRowModel, columnId, allFilteredRowModel) {
  return preFilteredRowModel;
}
var selectionStorePlaceholder = createSelectionStore();
function createSelectionStore() {
  return zustand.createStore((set, get) => ({
    selectedIds: /* @__PURE__ */ new Set(),
    isMultiSelectMode: false,
    toggle: (id) => set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
    select: (id) => set((state) => {
      if (state.selectedIds.has(id)) return state;
      const next = new Set(state.selectedIds);
      next.add(id);
      return { selectedIds: next };
    }),
    deselect: (id) => set((state) => {
      if (!state.selectedIds.has(id)) return state;
      const next = new Set(state.selectedIds);
      next.delete(id);
      return { selectedIds: next };
    }),
    selectAll: (ids) => set(() => ({ selectedIds: new Set(ids) })),
    deselectAll: () => set(() => ({ selectedIds: /* @__PURE__ */ new Set(), isMultiSelectMode: false })),
    setMultiSelectMode: (enabled) => set(() => ({
      isMultiSelectMode: enabled,
      selectedIds: enabled ? get().selectedIds : /* @__PURE__ */ new Set()
    })),
    toggleMultiSelectMode: () => {
      const current = get().isMultiSelectMode;
      get().setMultiSelectMode(!current);
    },
    isSelected: (id) => get().selectedIds.has(id),
    selectedCount: () => get().selectedIds.size,
    getSelectedIds: () => Array.from(get().selectedIds)
  }));
}
function useSelectionStore(store, selector) {
  return zustand.useStore(store, selector);
}
var SelectionContext = React6__default.default.createContext(null);
function useSelectionContext() {
  const store = React6__default.default.useContext(SelectionContext);
  if (!store) throw new Error("useSelectionContext must be used within a SelectionContext.Provider");
  return store;
}
var defaultSlice = {
  filters: [],
  columns: [],
  activeFilterId: null,
  activeColumnId: null,
  activeViewMode: "table"
};
function createPresetStore(realtimeMode = "auto-apply") {
  return zustand.createStore((set, get) => ({
    presets: {},
    pendingChanges: [],
    realtimeMode,
    getTablePresets: (tableId) => get().presets[tableId] ?? defaultSlice,
    loadPresets: async (tableId, adapter) => {
      const [filters, columns, active] = await Promise.all([
        adapter.loadFilterPresets(tableId),
        adapter.loadColumnPresets(tableId),
        adapter.loadActivePresets(tableId)
      ]);
      set((state) => ({
        presets: {
          ...state.presets,
          [tableId]: {
            filters,
            columns,
            activeFilterId: active.filterId ?? null,
            activeColumnId: active.columnId ?? null,
            activeViewMode: active.viewMode ?? "table"
          }
        }
      }));
    },
    applyFilterPreset: (tableId, presetId) => {
      set((state) => {
        const slice = state.presets[tableId] ?? { ...defaultSlice };
        return {
          presets: {
            ...state.presets,
            [tableId]: { ...slice, activeFilterId: presetId }
          }
        };
      });
    },
    applyColumnPreset: (tableId, presetId) => {
      set((state) => {
        const slice = state.presets[tableId] ?? { ...defaultSlice };
        return {
          presets: {
            ...state.presets,
            [tableId]: { ...slice, activeColumnId: presetId }
          }
        };
      });
    },
    setViewMode: (tableId, mode) => {
      set((state) => {
        const slice = state.presets[tableId] ?? { ...defaultSlice };
        return {
          presets: {
            ...state.presets,
            [tableId]: { ...slice, activeViewMode: mode }
          }
        };
      });
    },
    saveFilterPreset: async (tableId, preset, adapter) => {
      await adapter.saveFilterPreset(tableId, preset);
      set((state) => {
        const slice = state.presets[tableId] ?? { ...defaultSlice };
        const idx = slice.filters.findIndex((p) => p.id === preset.id);
        const filters = [...slice.filters];
        if (idx >= 0) filters[idx] = preset;
        else filters.push(preset);
        return {
          presets: {
            ...state.presets,
            [tableId]: { ...slice, filters }
          }
        };
      });
    },
    saveColumnPreset: async (tableId, preset, adapter) => {
      await adapter.saveColumnPreset(tableId, preset);
      set((state) => {
        const slice = state.presets[tableId] ?? { ...defaultSlice };
        const idx = slice.columns.findIndex((p) => p.id === preset.id);
        const columns = [...slice.columns];
        if (idx >= 0) columns[idx] = preset;
        else columns.push(preset);
        return {
          presets: {
            ...state.presets,
            [tableId]: { ...slice, columns }
          }
        };
      });
    },
    deleteFilterPreset: async (tableId, presetId, adapter) => {
      await adapter.deleteFilterPreset(tableId, presetId);
      set((state) => {
        const slice = state.presets[tableId] ?? { ...defaultSlice };
        return {
          presets: {
            ...state.presets,
            [tableId]: {
              ...slice,
              filters: slice.filters.filter((p) => p.id !== presetId),
              activeFilterId: slice.activeFilterId === presetId ? null : slice.activeFilterId
            }
          }
        };
      });
    },
    deleteColumnPreset: async (tableId, presetId, adapter) => {
      await adapter.deleteColumnPreset(tableId, presetId);
      set((state) => {
        const slice = state.presets[tableId] ?? { ...defaultSlice };
        return {
          presets: {
            ...state.presets,
            [tableId]: {
              ...slice,
              columns: slice.columns.filter((p) => p.id !== presetId),
              activeColumnId: slice.activeColumnId === presetId ? null : slice.activeColumnId
            }
          }
        };
      });
    },
    handleRemoteChange: (event, adapter) => {
      const mode = get().realtimeMode;
      if (mode === "auto-apply") {
        get().loadPresets(event.tableId, adapter);
      } else {
        set((state) => ({
          pendingChanges: [...state.pendingChanges, event]
        }));
      }
    },
    acknowledgePendingChange: (index) => {
      set((state) => ({
        pendingChanges: state.pendingChanges.filter((_, i) => i !== index)
      }));
    },
    dismissPendingChanges: (tableId) => {
      set((state) => ({
        pendingChanges: state.pendingChanges.filter(
          (e) => e.tableId !== tableId
        )
      }));
    }
  }));
}

// src/table/presets/memory-adapter.ts
var MemoryAdapter = class {
  filters = /* @__PURE__ */ new Map();
  columns = /* @__PURE__ */ new Map();
  active = /* @__PURE__ */ new Map();
  async loadFilterPresets(tableId) {
    return this.filters.get(tableId) ?? [];
  }
  async saveFilterPreset(tableId, preset) {
    const list = this.filters.get(tableId) ?? [];
    const idx = list.findIndex((p) => p.id === preset.id);
    if (idx >= 0) {
      list[idx] = preset;
    } else {
      list.push(preset);
    }
    this.filters.set(tableId, list);
  }
  async deleteFilterPreset(tableId, presetId) {
    const list = this.filters.get(tableId) ?? [];
    this.filters.set(
      tableId,
      list.filter((p) => p.id !== presetId)
    );
  }
  async loadColumnPresets(tableId) {
    return this.columns.get(tableId) ?? [];
  }
  async saveColumnPreset(tableId, preset) {
    const list = this.columns.get(tableId) ?? [];
    const idx = list.findIndex((p) => p.id === preset.id);
    if (idx >= 0) {
      list[idx] = preset;
    } else {
      list.push(preset);
    }
    this.columns.set(tableId, list);
  }
  async deleteColumnPreset(tableId, presetId) {
    const list = this.columns.get(tableId) ?? [];
    this.columns.set(
      tableId,
      list.filter((p) => p.id !== presetId)
    );
  }
  async loadActivePresets(tableId) {
    return this.active.get(tableId) ?? {};
  }
  async saveActivePresets(tableId, active) {
    this.active.set(tableId, active);
  }
};
var ZustandPersistAdapter = class {
  store;
  listeners = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    const storageKey = options.storageKey ?? "prometheus-table-presets";
    this.store = zustand.createStore()(
      middleware.persist(
        () => ({ tables: {} }),
        {
          name: storageKey,
          storage: options.storage
        }
      )
    );
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === storageKey && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed.state) {
              this.store.setState(parsed.state);
              for (const [tableId, callbacks] of this.listeners) {
                for (const cb of callbacks) {
                  cb({
                    tableId,
                    presetType: "filter",
                    presetId: "",
                    operation: "updated",
                    source: "remote",
                    timestamp: Date.now()
                  });
                }
              }
            }
          } catch {
          }
        }
      });
    }
  }
  getTable(tableId) {
    return this.store.getState().tables[tableId] ?? {
      filters: [],
      columns: [],
      active: {}
    };
  }
  setTable(tableId, updater) {
    this.store.setState((state) => ({
      tables: {
        ...state.tables,
        [tableId]: updater(
          state.tables[tableId] ?? { filters: [], columns: [], active: {} }
        )
      }
    }));
  }
  emit(event) {
    const callbacks = this.listeners.get(event.tableId);
    if (callbacks) {
      for (const cb of callbacks) cb(event);
    }
  }
  async loadFilterPresets(tableId) {
    return this.getTable(tableId).filters;
  }
  async saveFilterPreset(tableId, preset) {
    this.setTable(tableId, (prev) => {
      const idx = prev.filters.findIndex((p) => p.id === preset.id);
      const filters = [...prev.filters];
      if (idx >= 0) filters[idx] = preset;
      else filters.push(preset);
      return { ...prev, filters };
    });
    this.emit({
      tableId,
      presetType: "filter",
      presetId: preset.id,
      operation: this.getTable(tableId).filters.some((p) => p.id === preset.id) ? "updated" : "created",
      preset,
      source: "local",
      timestamp: Date.now()
    });
  }
  async deleteFilterPreset(tableId, presetId) {
    this.setTable(tableId, (prev) => ({
      ...prev,
      filters: prev.filters.filter((p) => p.id !== presetId)
    }));
    this.emit({
      tableId,
      presetType: "filter",
      presetId,
      operation: "deleted",
      source: "local",
      timestamp: Date.now()
    });
  }
  async loadColumnPresets(tableId) {
    return this.getTable(tableId).columns;
  }
  async saveColumnPreset(tableId, preset) {
    this.setTable(tableId, (prev) => {
      const idx = prev.columns.findIndex((p) => p.id === preset.id);
      const columns = [...prev.columns];
      if (idx >= 0) columns[idx] = preset;
      else columns.push(preset);
      return { ...prev, columns };
    });
    this.emit({
      tableId,
      presetType: "column",
      presetId: preset.id,
      operation: "updated",
      preset,
      source: "local",
      timestamp: Date.now()
    });
  }
  async deleteColumnPreset(tableId, presetId) {
    this.setTable(tableId, (prev) => ({
      ...prev,
      columns: prev.columns.filter((p) => p.id !== presetId)
    }));
    this.emit({
      tableId,
      presetType: "column",
      presetId,
      operation: "deleted",
      source: "local",
      timestamp: Date.now()
    });
  }
  async loadActivePresets(tableId) {
    return this.getTable(tableId).active;
  }
  async saveActivePresets(tableId, active) {
    this.setTable(tableId, (prev) => ({ ...prev, active }));
  }
  subscribe(tableId, callback) {
    if (!this.listeners.has(tableId)) this.listeners.set(tableId, /* @__PURE__ */ new Set());
    this.listeners.get(tableId).add(callback);
    return () => {
      this.listeners.get(tableId)?.delete(callback);
    };
  }
};

// src/table/presets/rest-adapter.ts
var RestApiAdapter = class {
  baseUrl;
  headers;
  pollInterval;
  sseEndpoint;
  constructor(options) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.headers = options.headers ?? {};
    this.pollInterval = options.pollInterval;
    this.sseEndpoint = options.sseEndpoint;
  }
  getHeaders() {
    const h = typeof this.headers === "function" ? this.headers() : this.headers;
    return { "Content-Type": "application/json", ...h };
  }
  async loadFilterPresets(tableId) {
    const res = await fetch(
      `${this.baseUrl}/tables/${encodeURIComponent(tableId)}/filter-presets`,
      { headers: this.getHeaders() }
    );
    if (!res.ok) return [];
    return res.json();
  }
  async saveFilterPreset(tableId, preset) {
    await fetch(
      `${this.baseUrl}/tables/${encodeURIComponent(tableId)}/filter-presets/${encodeURIComponent(preset.id)}`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(preset)
      }
    );
  }
  async deleteFilterPreset(tableId, presetId) {
    await fetch(
      `${this.baseUrl}/tables/${encodeURIComponent(tableId)}/filter-presets/${encodeURIComponent(presetId)}`,
      { method: "DELETE", headers: this.getHeaders() }
    );
  }
  async loadColumnPresets(tableId) {
    const res = await fetch(
      `${this.baseUrl}/tables/${encodeURIComponent(tableId)}/column-presets`,
      { headers: this.getHeaders() }
    );
    if (!res.ok) return [];
    return res.json();
  }
  async saveColumnPreset(tableId, preset) {
    await fetch(
      `${this.baseUrl}/tables/${encodeURIComponent(tableId)}/column-presets/${encodeURIComponent(preset.id)}`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(preset)
      }
    );
  }
  async deleteColumnPreset(tableId, presetId) {
    await fetch(
      `${this.baseUrl}/tables/${encodeURIComponent(tableId)}/column-presets/${encodeURIComponent(presetId)}`,
      { method: "DELETE", headers: this.getHeaders() }
    );
  }
  async loadActivePresets(tableId) {
    const res = await fetch(
      `${this.baseUrl}/tables/${encodeURIComponent(tableId)}/active`,
      { headers: this.getHeaders() }
    );
    if (!res.ok) return {};
    return res.json();
  }
  async saveActivePresets(tableId, active) {
    await fetch(
      `${this.baseUrl}/tables/${encodeURIComponent(tableId)}/active`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(active)
      }
    );
  }
  subscribe(tableId, callback) {
    if (this.sseEndpoint) {
      return this.subscribeSSE(tableId, callback);
    }
    if (this.pollInterval) {
      return this.subscribePoll(tableId, callback);
    }
    return () => {
    };
  }
  subscribeSSE(tableId, callback) {
    const url = `${this.sseEndpoint}?tableId=${encodeURIComponent(tableId)}`;
    const source = new EventSource(url);
    source.addEventListener("preset-change", (e) => {
      try {
        const event = JSON.parse(e.data);
        callback(event);
      } catch {
      }
    });
    return () => source.close();
  }
  subscribePoll(tableId, callback) {
    let lastFilterHash = "";
    let lastColumnHash = "";
    const check = async () => {
      const [filters, columns] = await Promise.all([
        this.loadFilterPresets(tableId),
        this.loadColumnPresets(tableId)
      ]);
      const filterHash = JSON.stringify(filters);
      const columnHash = JSON.stringify(columns);
      if (filterHash !== lastFilterHash && lastFilterHash !== "") {
        callback({
          tableId,
          presetType: "filter",
          presetId: "",
          operation: "updated",
          source: "remote",
          timestamp: Date.now()
        });
      }
      if (columnHash !== lastColumnHash && lastColumnHash !== "") {
        callback({
          tableId,
          presetType: "column",
          presetId: "",
          operation: "updated",
          source: "remote",
          timestamp: Date.now()
        });
      }
      lastFilterHash = filterHash;
      lastColumnHash = columnHash;
    };
    void check();
    const interval = setInterval(check, this.pollInterval);
    return () => clearInterval(interval);
  }
};

// src/table/presets/supabase-adapter.ts
var SupabaseRealtimeAdapter = class {
  client;
  tableName;
  userId;
  constructor(options) {
    this.client = options.supabaseClient;
    this.tableName = options.tableName ?? "table_presets";
    this.userId = options.userId ?? "anonymous";
  }
  async loadFilterPresets(tableId) {
    const { data } = await this.client.from(this.tableName).select("*").eq("table_id", tableId).eq("preset_type", "filter");
    if (!data) return [];
    return data.map(
      (row) => JSON.parse(row.preset_data)
    );
  }
  async saveFilterPreset(tableId, preset) {
    await this.client.from(this.tableName).upsert({
      id: `${tableId}:filter:${preset.id}`,
      table_id: tableId,
      preset_type: "filter",
      preset_id: preset.id,
      preset_data: JSON.stringify(preset),
      user_id: this.userId,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  async deleteFilterPreset(tableId, presetId) {
    await this.client.from(this.tableName).delete().eq("table_id", tableId).eq("preset_id", presetId);
  }
  async loadColumnPresets(tableId) {
    const { data } = await this.client.from(this.tableName).select("*").eq("table_id", tableId).eq("preset_type", "column");
    if (!data) return [];
    return data.map(
      (row) => JSON.parse(row.preset_data)
    );
  }
  async saveColumnPreset(tableId, preset) {
    await this.client.from(this.tableName).upsert({
      id: `${tableId}:column:${preset.id}`,
      table_id: tableId,
      preset_type: "column",
      preset_id: preset.id,
      preset_data: JSON.stringify(preset),
      user_id: this.userId,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  async deleteColumnPreset(tableId, presetId) {
    await this.client.from(this.tableName).delete().eq("table_id", tableId).eq("preset_id", presetId);
  }
  async loadActivePresets(tableId) {
    const result = await this.client.from(this.tableName).select("preset_data").eq("table_id", tableId).eq("preset_type", "active");
    const data = result.data;
    if (!data || data.length === 0) return {};
    return JSON.parse(data[0].preset_data);
  }
  async saveActivePresets(tableId, active) {
    await this.client.from(this.tableName).upsert({
      id: `${tableId}:active`,
      table_id: tableId,
      preset_type: "active",
      preset_id: "active",
      preset_data: JSON.stringify(active),
      user_id: this.userId,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  subscribe(tableId, callback) {
    const subscription = this.client.channel(`table-presets:${tableId}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: this.tableName,
        filter: `table_id=eq.${tableId}`
      },
      (payload) => {
        const row = payload.new ?? payload.old ?? {};
        const presetType = row.preset_type;
        if (presetType !== "filter" && presetType !== "column") return;
        const eventType = payload.eventType;
        let operation = "updated";
        if (eventType === "INSERT") operation = "created";
        else if (eventType === "DELETE") operation = "deleted";
        let preset;
        try {
          if (row.preset_data) {
            preset = JSON.parse(row.preset_data);
          }
        } catch {
        }
        callback({
          tableId,
          presetType,
          presetId: row.preset_id ?? "",
          operation,
          preset,
          source: "remote",
          timestamp: Date.now()
        });
      }
    ).subscribe();
    return () => subscription.unsubscribe();
  }
};

// src/table/presets/electricsql-adapter.ts
var ElectricSQLAdapter = class {
  db;
  tableName;
  initialized = false;
  constructor(options) {
    this.db = options.db;
    this.tableName = options.tableName ?? "table_presets";
  }
  async ensureTable() {
    if (this.initialized) return;
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        table_id TEXT NOT NULL,
        preset_type TEXT NOT NULL,
        preset_id TEXT NOT NULL,
        preset_data TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_table_type
        ON ${this.tableName}(table_id, preset_type);
    `);
    this.initialized = true;
  }
  makeId(tableId, presetType, presetId) {
    return `${tableId}:${presetType}:${presetId}`;
  }
  async loadFilterPresets(tableId) {
    await this.ensureTable();
    const { rows } = await this.db.query(
      `SELECT preset_data FROM ${this.tableName} WHERE table_id = $1 AND preset_type = $2`,
      [tableId, "filter"]
    );
    return rows.map((r) => JSON.parse(r.preset_data));
  }
  async saveFilterPreset(tableId, preset) {
    await this.ensureTable();
    const id = this.makeId(tableId, "filter", preset.id);
    await this.db.query(
      `INSERT INTO ${this.tableName} (id, table_id, preset_type, preset_id, preset_data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET preset_data = $5, updated_at = $6`,
      [id, tableId, "filter", preset.id, JSON.stringify(preset), (/* @__PURE__ */ new Date()).toISOString()]
    );
  }
  async deleteFilterPreset(tableId, presetId) {
    await this.ensureTable();
    const id = this.makeId(tableId, "filter", presetId);
    await this.db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }
  async loadColumnPresets(tableId) {
    await this.ensureTable();
    const { rows } = await this.db.query(
      `SELECT preset_data FROM ${this.tableName} WHERE table_id = $1 AND preset_type = $2`,
      [tableId, "column"]
    );
    return rows.map((r) => JSON.parse(r.preset_data));
  }
  async saveColumnPreset(tableId, preset) {
    await this.ensureTable();
    const id = this.makeId(tableId, "column", preset.id);
    await this.db.query(
      `INSERT INTO ${this.tableName} (id, table_id, preset_type, preset_id, preset_data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET preset_data = $5, updated_at = $6`,
      [id, tableId, "column", preset.id, JSON.stringify(preset), (/* @__PURE__ */ new Date()).toISOString()]
    );
  }
  async deleteColumnPreset(tableId, presetId) {
    await this.ensureTable();
    const id = this.makeId(tableId, "column", presetId);
    await this.db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }
  async loadActivePresets(tableId) {
    await this.ensureTable();
    const id = this.makeId(tableId, "active", "active");
    const { rows } = await this.db.query(
      `SELECT preset_data FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) return {};
    return JSON.parse(rows[0].preset_data);
  }
  async saveActivePresets(tableId, active) {
    await this.ensureTable();
    const id = this.makeId(tableId, "active", "active");
    await this.db.query(
      `INSERT INTO ${this.tableName} (id, table_id, preset_type, preset_id, preset_data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET preset_data = $5, updated_at = $6`,
      [id, tableId, "active", "active", JSON.stringify(active), (/* @__PURE__ */ new Date()).toISOString()]
    );
  }
  subscribe(tableId, callback) {
    if (!this.db.listen) return () => {
    };
    let unsub = null;
    this.db.listen(`preset_change_${tableId}`, (payload) => {
      try {
        const event = JSON.parse(payload);
        callback({ ...event, source: "remote" });
      } catch {
      }
    }).then((fn) => {
      unsub = fn;
    });
    return () => unsub?.();
  }
};
var nextId = 0;
function generateId() {
  return `preset_${Date.now()}_${++nextId}`;
}
function useTablePresets(tableId, options = {}) {
  const { adapter, realtimeMode = "auto-apply", enabled = true } = options;
  const resolvedAdapter = adapter ?? new MemoryAdapter();
  const adapterRef = React6.useRef(resolvedAdapter);
  adapterRef.current = resolvedAdapter;
  const storeRef = React6.useRef(createPresetStore(realtimeMode));
  const store = storeRef.current;
  const [isLoading, setIsLoading] = React6.useState(false);
  const [isSubscribed, setIsSubscribed] = React6.useState(false);
  React6.useEffect(() => {
    if (!enabled) return;
    setIsLoading(true);
    store.getState().loadPresets(tableId, adapterRef.current).finally(() => setIsLoading(false));
  }, [tableId, enabled, store]);
  React6.useEffect(() => {
    if (!enabled) return;
    const currentAdapter = adapterRef.current;
    if (!currentAdapter.subscribe) {
      setIsSubscribed(false);
      return;
    }
    const unsub = currentAdapter.subscribe(tableId, (event) => {
      store.getState().handleRemoteChange(event, currentAdapter);
    });
    setIsSubscribed(true);
    return () => unsub();
  }, [tableId, enabled, store]);
  const slice = zustand.useStore(store, (s) => s.presets[tableId] ?? s.getTablePresets(tableId));
  const allPendingChanges = zustand.useStore(store, (s) => s.pendingChanges);
  const pendingChanges = React6.useMemo(
    () => allPendingChanges.filter((e) => e.tableId === tableId),
    [allPendingChanges, tableId]
  );
  const activeFilterPreset = React6.useMemo(
    () => slice.filters.find((p) => p.id === slice.activeFilterId) ?? null,
    [slice.filters, slice.activeFilterId]
  );
  const activeColumnPreset = React6.useMemo(
    () => slice.columns.find((p) => p.id === slice.activeColumnId) ?? null,
    [slice.columns, slice.activeColumnId]
  );
  const applyFilterPreset = React6.useCallback(
    (id) => {
      store.getState().applyFilterPreset(tableId, id);
      adapterRef.current.saveActivePresets(tableId, {
        filterId: id ?? void 0,
        columnId: slice.activeColumnId ?? void 0,
        viewMode: slice.activeViewMode
      });
    },
    [tableId, slice.activeColumnId, slice.activeViewMode, store]
  );
  const applyColumnPreset = React6.useCallback(
    (id) => {
      store.getState().applyColumnPreset(tableId, id);
      adapterRef.current.saveActivePresets(tableId, {
        filterId: slice.activeFilterId ?? void 0,
        columnId: id ?? void 0,
        viewMode: slice.activeViewMode
      });
    },
    [tableId, slice.activeFilterId, slice.activeViewMode, store]
  );
  const setViewMode = React6.useCallback(
    (mode) => {
      store.getState().setViewMode(tableId, mode);
      adapterRef.current.saveActivePresets(tableId, {
        filterId: slice.activeFilterId ?? void 0,
        columnId: slice.activeColumnId ?? void 0,
        viewMode: mode
      });
    },
    [tableId, slice.activeFilterId, slice.activeColumnId, store]
  );
  const saveFilterPreset = React6.useCallback(
    async (preset) => {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const full = {
        ...preset,
        id: generateId(),
        createdAt: now,
        updatedAt: now
      };
      await store.getState().saveFilterPreset(tableId, full, adapterRef.current);
    },
    [tableId, store]
  );
  const updateFilterPreset = React6.useCallback(
    async (id, patch) => {
      const existing = slice.filters.find((p) => p.id === id);
      if (!existing) return;
      const updated = {
        ...existing,
        ...patch,
        id,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await store.getState().saveFilterPreset(tableId, updated, adapterRef.current);
    },
    [tableId, slice.filters, store]
  );
  const saveColumnPreset = React6.useCallback(
    async (preset) => {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const full = {
        ...preset,
        id: generateId(),
        createdAt: now,
        updatedAt: now
      };
      await store.getState().saveColumnPreset(tableId, full, adapterRef.current);
    },
    [tableId, store]
  );
  const updateColumnPreset = React6.useCallback(
    async (id, patch) => {
      const existing = slice.columns.find((p) => p.id === id);
      if (!existing) return;
      const updated = {
        ...existing,
        ...patch,
        id,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await store.getState().saveColumnPreset(tableId, updated, adapterRef.current);
    },
    [tableId, slice.columns, store]
  );
  const deleteFilterPreset = React6.useCallback(
    async (id) => {
      await store.getState().deleteFilterPreset(tableId, id, adapterRef.current);
    },
    [tableId, store]
  );
  const deleteColumnPreset = React6.useCallback(
    async (id) => {
      await store.getState().deleteColumnPreset(tableId, id, adapterRef.current);
    },
    [tableId, store]
  );
  const acknowledgePendingChange = React6.useCallback(
    (index) => {
      store.getState().acknowledgePendingChange(index);
    },
    [store]
  );
  const dismissPendingChanges = React6.useCallback(() => {
    store.getState().dismissPendingChanges(tableId);
  }, [tableId, store]);
  return {
    filterPresets: slice.filters,
    columnPresets: slice.columns,
    activeFilterPreset,
    activeColumnPreset,
    activeViewMode: slice.activeViewMode,
    pendingChanges,
    applyFilterPreset,
    applyColumnPreset,
    setViewMode,
    saveFilterPreset,
    updateFilterPreset,
    saveColumnPreset,
    updateColumnPreset,
    deleteFilterPreset,
    deleteColumnPreset,
    acknowledgePendingChange,
    dismissPendingChanges,
    isLoading,
    isSubscribed
  };
}
var TableStorageContext = React6.createContext({
  adapter: new MemoryAdapter(),
  realtimeMode: "auto-apply"
});
function TableStorageProvider({
  adapter,
  realtimeMode = "auto-apply",
  children
}) {
  const value = React6.useMemo(
    () => ({ adapter, realtimeMode }),
    [adapter, realtimeMode]
  );
  return /* @__PURE__ */ jsxRuntime.jsx(TableStorageContext.Provider, { value, children });
}
function useTableStorageAdapter() {
  return React6.useContext(TableStorageContext).adapter;
}
function useTableRealtimeMode() {
  return React6.useContext(TableStorageContext).realtimeMode;
}
var Table = React6__default.default.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsxRuntime.jsx(
  "table",
  {
    ref,
    className: cn("w-full caption-bottom text-sm", className),
    ...props
  }
) }));
Table.displayName = "Table";
var TableHeader = React6__default.default.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx("thead", { ref, className: cn("bg-muted/60", className), ...props }));
TableHeader.displayName = "TableHeader";
var TableBody = React6__default.default.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx("tbody", { ref, className: cn("bg-background", className), ...props }));
TableBody.displayName = "TableBody";
var TableFooter = React6__default.default.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "tfoot",
  {
    ref,
    className: cn("bg-muted/50 font-medium", className),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
var TableRow = React6__default.default.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "tr",
  {
    ref,
    className: cn(
      "transition-colors hover:bg-muted/30 data-[state=selected]:bg-primary/10",
      className
    ),
    ...props
  }
));
TableRow.displayName = "TableRow";
var TableHead = React6__default.default.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "th",
  {
    ref,
    className: cn(
      "h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
var TableCell = React6__default.default.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "td",
  {
    ref,
    className: cn(
      "px-3 py-2.5 align-middle text-sm [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    ),
    ...props
  }
));
TableCell.displayName = "TableCell";
var TableCaption = React6__default.default.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "caption",
  {
    ref,
    className: cn("mt-4 text-sm text-muted-foreground", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";
function DataTableColumnHeader({
  column,
  title,
  className
}) {
  if (!column.getCanSort()) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: cn(className), children: title });
  }
  const sorted = column.getIsSorted();
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "button",
    {
      type: "button",
      className: cn(
        "flex items-center gap-1 -ml-2 px-2 py-1.5 rounded-lg hover:bg-muted/60 text-left font-semibold transition-colors",
        className
      ),
      onClick: (e) => column.toggleSorting(void 0, e.shiftKey),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("span", { children: title }),
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ml-1 flex flex-col text-xs leading-none", children: sorted === "asc" ? /* @__PURE__ */ jsxRuntime.jsx(SortAscIcon, { className: "h-3.5 w-3.5" }) : sorted === "desc" ? /* @__PURE__ */ jsxRuntime.jsx(SortDescIcon, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntime.jsx(SortNoneIcon, { className: "h-3.5 w-3.5 text-muted-foreground/50" }) }),
        column.getSortIndex() >= 0 && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ml-0.5 text-[10px] text-muted-foreground tabular-nums", children: column.getSortIndex() + 1 })
      ]
    }
  );
}
function SortAscIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 16 16", fill: "currentColor", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Sorted ascending" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { fillRule: "evenodd", d: "M8 3.5a.5.5 0 01.354.146l3.5 3.5a.5.5 0 11-.708.708L8 4.707 4.854 7.854a.5.5 0 11-.708-.708l3.5-3.5A.5.5 0 018 3.5z" })
  ] });
}
function SortDescIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 16 16", fill: "currentColor", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Sorted descending" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { fillRule: "evenodd", d: "M8 12.5a.5.5 0 01-.354-.146l-3.5-3.5a.5.5 0 11.708-.708L8 11.293l3.146-3.147a.5.5 0 11.708.708l-3.5 3.5A.5.5 0 018 12.5z" })
  ] });
}
function SortNoneIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 16 16", fill: "currentColor", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Not sorted" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 3.5a.5.5 0 01.354.146l2.5 2.5a.5.5 0 11-.708.708L8 4.707 5.854 6.854a.5.5 0 11-.708-.708l2.5-2.5A.5.5 0 018 3.5z" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 12.5a.5.5 0 01-.354-.146l-2.5-2.5a.5.5 0 11.708-.708L8 11.293l2.146-2.147a.5.5 0 11.708.708l-2.5 2.5A.5.5 0 018 12.5z" })
  ] });
}
function InlineCellEditor2({
  value: initialValue,
  columnDef,
  onSave,
  onCancel,
  className,
  inputId,
  ariaLabel
}) {
  const [value, setValue] = React6.useState(initialValue);
  const inputRef = React6.useRef(null);
  const selectRef = React6.useRef(null);
  const filterType = columnDef.meta?.entityMeta?.filterType ?? "text";
  React6.useEffect(() => {
    if (filterType === "enum") {
      selectRef.current?.focus();
      return;
    }
    if (filterType === "boolean") return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [filterType]);
  const handleKeyDown = React6.useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSave(value);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [value, onSave, onCancel]
  );
  const handleBlur = React6.useCallback(() => {
    onSave(value);
  }, [value, onSave]);
  if (filterType === "boolean") {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: cn("flex items-center", className), children: /* @__PURE__ */ jsxRuntime.jsx(
      "input",
      {
        id: inputId,
        type: "checkbox",
        checked: !!value,
        onChange: (e) => {
          setValue(e.target.checked);
          onSave(e.target.checked);
        },
        className: "h-4 w-4 rounded border-primary text-primary focus:ring-ring",
        "aria-label": ariaLabel ?? "Edit boolean value"
      }
    ) });
  }
  if (filterType === "enum") {
    const options = columnDef.meta?.entityMeta?.enumOptions ?? [];
    return /* @__PURE__ */ jsxRuntime.jsx(
      "select",
      {
        ref: selectRef,
        id: inputId,
        value: String(value ?? ""),
        onChange: (e) => {
          setValue(e.target.value);
          onSave(e.target.value);
        },
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        className: cn(
          "h-8 w-full rounded-md border border-input bg-background px-2 text-sm",
          className
        ),
        "aria-label": ariaLabel ?? "Select value",
        children: options.map((opt) => /* @__PURE__ */ jsxRuntime.jsx("option", { value: opt.value, children: opt.label }, opt.value))
      }
    );
  }
  if (filterType === "number") {
    return /* @__PURE__ */ jsxRuntime.jsx(
      "input",
      {
        ref: inputRef,
        id: inputId,
        type: "number",
        value: value != null ? String(value) : "",
        onChange: (e) => setValue(e.target.value === "" ? null : Number(e.target.value)),
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        className: cn(
          "h-8 w-full rounded-md border border-input bg-background px-2 text-sm",
          className
        ),
        "aria-label": ariaLabel ?? "Edit number",
        placeholder: "0"
      }
    );
  }
  if (filterType === "date" || filterType === "dateRange") {
    return /* @__PURE__ */ jsxRuntime.jsx(
      "input",
      {
        ref: inputRef,
        id: inputId,
        type: "date",
        value: value != null ? String(value) : "",
        onChange: (e) => setValue(e.target.value),
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        className: cn(
          "h-8 w-full rounded-md border border-input bg-background px-2 text-sm",
          className
        ),
        "aria-label": ariaLabel ?? "Edit date"
      }
    );
  }
  return /* @__PURE__ */ jsxRuntime.jsx(
    "input",
    {
      ref: inputRef,
      id: inputId,
      type: "text",
      value: value != null ? String(value) : "",
      onChange: (e) => setValue(e.target.value),
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      className: cn(
        "h-8 w-full rounded-md border border-input bg-background px-2 text-sm",
        className
      ),
      "aria-label": ariaLabel ?? "Edit text",
      placeholder: "Value"
    }
  );
}
function InlineItemEditor({
  item,
  columns,
  itemDescriptor: _itemDescriptor,
  onSave,
  onCancel,
  className
}) {
  const baseId = React6.useId();
  const [editValues, setEditValues] = React6.useState({});
  const editableFields = columns.filter(
    (c) => c.meta?.entityMeta?.editable && c.accessorKey
  );
  function updateField(field, value) {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  }
  function handleSave() {
    const changes = {};
    for (const [key, val] of Object.entries(editValues)) {
      changes[key] = val;
    }
    onSave(changes);
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: cn(
        "space-y-3 rounded-md border bg-muted/30 p-4 animate-in slide-in-from-top-2 duration-200",
        className
      ),
      children: [
        editableFields.map((col) => {
          const key = col.accessorKey;
          const label = typeof col.header === "string" ? col.header : key;
          const currentValue = key in editValues ? editValues[key] : item[key];
          const fieldId = `${baseId}-${key}`;
          return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: fieldId, className: "text-xs font-medium text-muted-foreground", children: label }),
            /* @__PURE__ */ jsxRuntime.jsx(
              InlineCellEditor2,
              {
                value: currentValue,
                columnDef: col,
                onSave: (v) => updateField(key, v),
                onCancel: () => {
                },
                inputId: fieldId,
                ariaLabel: label
              }
            )
          ] }, key);
        }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              type: "button",
              onClick: onCancel,
              className: "inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              type: "button",
              onClick: handleSave,
              className: "inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90",
              children: "Save"
            }
          )
        ] })
      ]
    }
  );
}
function viewAction(opts) {
  return {
    id: "view",
    label: opts.label ?? "View",
    icon: EyeIcon,
    onClick: opts.onClick,
    variant: "ghost"
  };
}
function editAction(opts) {
  return {
    id: "edit",
    label: opts.label ?? "Edit",
    icon: PencilIcon,
    onClick: opts.onClick,
    variant: "ghost"
  };
}
function deleteAction(opts) {
  return {
    id: "delete",
    label: opts.label ?? "Delete",
    icon: TrashIcon,
    onClick: opts.onClick,
    destructive: true,
    confirm: opts.confirm ?? "Are you sure you want to delete this item?",
    variant: "destructive"
  };
}
function ActionDropdown({
  item,
  actions,
  className
}) {
  const [isOpen, setIsOpen] = React6.useState(false);
  const [confirmAction, setConfirmAction] = React6.useState(null);
  const menuRef = React6.useRef(null);
  const visibleActions = actions.filter((a) => !a.hidden?.(item));
  React6.useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);
  if (visibleActions.length === 0) return null;
  function executeAction(action) {
    if (action.confirm) {
      setConfirmAction(action);
      setIsOpen(false);
      return;
    }
    action.onClick(item);
    setIsOpen(false);
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: cn("relative inline-block", className), ref: menuRef, children: [
    /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setIsOpen(!isOpen),
        className: "inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground",
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(MoreIcon, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: "Actions" })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute right-0 z-50 mt-1 min-w-[160px] rounded-md border bg-popover py-1 shadow-md", children: visibleActions.map((action) => /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        type: "button",
        disabled: action.disabled?.(item),
        onClick: () => executeAction(action),
        className: cn(
          "flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
          action.destructive && "text-destructive hover:text-destructive"
        ),
        children: [
          action.icon && /* @__PURE__ */ jsxRuntime.jsx(action.icon, { className: "h-4 w-4" }),
          action.label
        ]
      },
      action.id
    )) }),
    confirmAction && /* @__PURE__ */ jsxRuntime.jsx(
      ConfirmDialog,
      {
        message: typeof confirmAction.confirm === "function" ? confirmAction.confirm(item) : confirmAction.confirm,
        destructive: confirmAction.destructive,
        onConfirm: () => {
          confirmAction.onClick(item);
          setConfirmAction(null);
        },
        onCancel: () => setConfirmAction(null)
      }
    )
  ] });
}
function ActionButtonRow({
  item,
  actions,
  maxVisible = 2,
  className
}) {
  const visibleActions = actions.filter((a) => !a.hidden?.(item));
  const inline = visibleActions.slice(0, maxVisible);
  const overflow = visibleActions.slice(maxVisible);
  const [confirmAction, setConfirmAction] = React6.useState(null);
  function executeAction(action) {
    if (action.confirm) {
      setConfirmAction(action);
      return;
    }
    action.onClick(item);
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: cn("flex items-center gap-1", className), children: [
    inline.map((action) => /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        type: "button",
        onClick: () => executeAction(action),
        disabled: action.disabled?.(item),
        "aria-label": action.label,
        title: action.label,
        className: cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
          action.destructive && "text-destructive hover:text-destructive"
        ),
        children: action.icon && /* @__PURE__ */ jsxRuntime.jsx(action.icon, { className: "h-3.5 w-3.5" })
      },
      action.id
    )),
    overflow.length > 0 && /* @__PURE__ */ jsxRuntime.jsx(ActionDropdown, { item, actions: overflow }),
    confirmAction && /* @__PURE__ */ jsxRuntime.jsx(
      ConfirmDialog,
      {
        message: typeof confirmAction.confirm === "function" ? confirmAction.confirm(item) : confirmAction.confirm,
        destructive: confirmAction.destructive,
        onConfirm: () => {
          confirmAction.onClick(item);
          setConfirmAction(null);
        },
        onCancel: () => setConfirmAction(null)
      }
    )
  ] });
}
function ConfirmDialog({
  message,
  destructive,
  onConfirm,
  onCancel
}) {
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg", children: [
    /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm", children: message }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: onCancel,
          className: "inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: onConfirm,
          className: cn(
            "inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-white",
            destructive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          ),
          children: "Confirm"
        }
      )
    ] })
  ] }) });
}
function MoreIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("title", { children: "More actions" }),
        /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "12", cy: "12", r: "1" }),
        /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "12", cy: "5", r: "1" }),
        /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "12", cy: "19", r: "1" })
      ]
    }
  );
}
function EyeIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("title", { children: "View" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }),
        /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "12", cy: "12", r: "3" })
      ]
    }
  );
}
function PencilIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Edit" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" })
      ]
    }
  );
}
function TrashIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Delete" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M3 6h18" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
      ]
    }
  );
}
function DataTable({
  table,
  actions,
  enableInlineEdit,
  onInlineSave,
  selectionStore,
  enableMultiSelect,
  getRowId,
  className
}) {
  const [editingCell, setEditingCell] = React6.useState(null);
  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();
  const handleCellDoubleClick = React6.useCallback(
    (rowId, columnId, columnDef) => {
      if (!enableInlineEdit) return;
      if (!columnDef.meta?.entityMeta?.editable) return;
      setEditingCell({ rowId, columnId });
    },
    [enableInlineEdit]
  );
  const handleInlineSave = React6.useCallback(
    async (row, columnId, value) => {
      const field = columnId;
      await onInlineSave?.(row.original, field, value);
      setEditingCell(null);
    },
    [onInlineSave]
  );
  return /* @__PURE__ */ jsxRuntime.jsxs(Table, { className, children: [
    /* @__PURE__ */ jsxRuntime.jsx(TableHeader, { children: headerGroups.map((headerGroup) => /* @__PURE__ */ jsxRuntime.jsxs(TableRow, { children: [
      enableMultiSelect && selectionStore && /* @__PURE__ */ jsxRuntime.jsx(TableHead, { className: "w-[40px]", children: /* @__PURE__ */ jsxRuntime.jsx(
        SelectAllCheckbox,
        {
          table,
          store: selectionStore,
          getRowId
        }
      ) }),
      headerGroup.headers.map((header) => /* @__PURE__ */ jsxRuntime.jsx(
        TableHead,
        {
          style: { width: header.getSize() },
          className: cn(
            header.column.getIsPinned() === "left" && "sticky left-0 z-10 bg-muted/60",
            header.column.getIsPinned() === "right" && "sticky right-0 z-10 bg-muted/60"
          ),
          children: header.isPlaceholder ? null : /* @__PURE__ */ jsxRuntime.jsx(
            DataTableColumnHeader,
            {
              column: header.column,
              title: typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : header.column.id
            }
          )
        },
        header.id
      )),
      actions && actions.length > 0 && /* @__PURE__ */ jsxRuntime.jsx(TableHead, { className: "w-[50px] text-right", children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: "Actions" }) })
    ] }, headerGroup.id)) }),
    /* @__PURE__ */ jsxRuntime.jsx(TableBody, { children: rowModel.rows.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntime.jsx(
      TableCell,
      {
        colSpan: (headerGroups[0]?.headers.length ?? 0) + (enableMultiSelect ? 1 : 0) + (actions?.length ? 1 : 0),
        className: "h-24 text-center text-muted-foreground",
        children: "No results."
      }
    ) }) : rowModel.rows.map((row) => /* @__PURE__ */ jsxRuntime.jsx(
      DataTableRow,
      {
        row,
        table,
        actions,
        enableMultiSelect,
        selectionStore,
        getRowId,
        editingCell,
        onCellDoubleClick: handleCellDoubleClick,
        onInlineSave: handleInlineSave,
        onCancelEdit: () => setEditingCell(null)
      },
      row.id
    )) })
  ] });
}
function DataTableRow({
  row,
  table: _table,
  actions,
  enableMultiSelect,
  selectionStore,
  getRowId,
  editingCell,
  onCellDoubleClick,
  onInlineSave,
  onCancelEdit
}) {
  const rowId = getRowId?.(row.original) ?? row.id;
  const selStore = selectionStore ?? selectionStorePlaceholder;
  const isSelected = useSelectionStore(
    selStore,
    (s) => selectionStore ? s.isSelected(rowId) : false
  );
  return /* @__PURE__ */ jsxRuntime.jsxs(TableRow, { "data-state": isSelected ? "selected" : void 0, children: [
    enableMultiSelect && selectionStore && /* @__PURE__ */ jsxRuntime.jsx(TableCell, { className: "w-[40px]", children: /* @__PURE__ */ jsxRuntime.jsx(RowCheckbox, { store: selectionStore, rowId }) }),
    row.getVisibleCells().map((cell) => {
      const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === cell.column.id;
      return /* @__PURE__ */ jsxRuntime.jsx(
        TableCell,
        {
          onDoubleClick: () => onCellDoubleClick(row.id, cell.column.id, cell.column.columnDef),
          className: cn(
            cell.column.getIsPinned() === "left" && "sticky left-0 z-10 bg-background group-hover:bg-muted/30",
            cell.column.getIsPinned() === "right" && "sticky right-0 z-10 bg-background group-hover:bg-muted/30"
          ),
          children: isEditing ? /* @__PURE__ */ jsxRuntime.jsx(
            InlineCellEditor2,
            {
              value: cell.getValue(),
              columnDef: cell.column.columnDef,
              onSave: (value) => onInlineSave(row, cell.column.id, value),
              onCancel: onCancelEdit
            }
          ) : /* @__PURE__ */ jsxRuntime.jsx(CellRenderer, { cell })
        },
        cell.id
      );
    }),
    actions && actions.length > 0 && /* @__PURE__ */ jsxRuntime.jsx(TableCell, { className: "w-[50px] text-right", children: /* @__PURE__ */ jsxRuntime.jsx(ActionDropdown, { item: row.original, actions }) })
  ] });
}
function CellRenderer({ cell }) {
  const cellDef = cell.column.columnDef.cell;
  if (typeof cellDef === "function") {
    return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: cellDef(cell.getContext()) });
  }
  const value = cell.renderValue();
  if (value == null) return null;
  if (typeof value === "boolean") {
    return /* @__PURE__ */ jsxRuntime.jsx("span", { children: value ? "Yes" : "No" });
  }
  return /* @__PURE__ */ jsxRuntime.jsx("span", { children: String(value) });
}
function SelectAllCheckbox({
  table,
  store,
  getRowId
}) {
  const selectedCount = useSelectionStore(store, (s) => s.selectedCount());
  const pageRows = table.getRowModel().rows;
  const allPageIds = pageRows.map((r) => getRowId?.(r.original) ?? r.id);
  const allSelected = allPageIds.length > 0 && selectedCount >= allPageIds.length;
  const selectAll = useSelectionStore(store, (s) => s.selectAll);
  const deselectAll = useSelectionStore(store, (s) => s.deselectAll);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "input",
    {
      type: "checkbox",
      checked: allSelected,
      onChange: () => {
        if (allSelected) deselectAll();
        else selectAll(allPageIds);
      },
      className: "h-4 w-4 rounded accent-primary",
      "aria-label": "Select all rows on this page"
    }
  );
}
function RowCheckbox({
  store,
  rowId
}) {
  const isSelected = useSelectionStore(store, (s) => s.isSelected(rowId));
  const toggle = useSelectionStore(store, (s) => s.toggle);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "input",
    {
      type: "checkbox",
      checked: isSelected,
      onChange: () => toggle(rowId),
      className: "h-4 w-4 rounded accent-primary",
      "aria-label": `Select row ${rowId}`
    }
  );
}
function GalleryView({
  rows,
  columns,
  itemDescriptor,
  renderCard,
  actions = [],
  enableInlineEdit,
  onInlineSave,
  selectionStore,
  enableMultiSelect,
  getRowId,
  galleryColumns,
  className
}) {
  const [editingId, setEditingId] = React6.useState(null);
  const breakpointClasses = galleryColumns ? buildBreakpointClasses(galleryColumns) : "";
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: cn(
        !galleryColumns && "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]",
        breakpointClasses,
        className
      ),
      children: rows.map((row) => {
        const id = getRowId?.(row.original) ?? row.id;
        const isEditing = editingId === id;
        return /* @__PURE__ */ jsxRuntime.jsx(
          GalleryCard,
          {
            row,
            itemId: id,
            columns,
            itemDescriptor,
            renderCard,
            actions,
            isEditing,
            enableInlineEdit,
            onStartEdit: () => setEditingId(id),
            onCancelEdit: () => setEditingId(null),
            onInlineSave: (changes) => {
              onInlineSave?.(row.original, changes);
              setEditingId(null);
            },
            selectionStore,
            enableMultiSelect
          },
          id
        );
      })
    }
  );
}
function GalleryCard({
  row,
  itemId,
  columns,
  itemDescriptor,
  renderCard,
  actions,
  isEditing,
  enableInlineEdit,
  onStartEdit,
  onCancelEdit,
  onInlineSave,
  selectionStore,
  enableMultiSelect
}) {
  const selStore = selectionStore ?? selectionStorePlaceholder;
  const isSelected = useSelectionStore(
    selStore,
    (s) => selectionStore ? s.isSelected(itemId) : false
  );
  const isMultiSelectMode = useSelectionStore(
    selStore,
    (s) => selectionStore ? s.isMultiSelectMode : false
  );
  const storeToggle = useSelectionStore(selStore, (s) => s.toggle);
  const toggle = React6.useCallback(
    (id) => {
      if (selectionStore) storeToggle(id);
    },
    [selectionStore, storeToggle]
  );
  const context = {
    isSelected,
    isEditing,
    isMultiSelectMode,
    onToggleSelect: () => toggle(itemId),
    onEdit: onStartEdit,
    onSave: onInlineSave,
    onCancel: onCancelEdit,
    actions,
    row
  };
  if (renderCard) {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className: cn(
          "relative rounded-lg border bg-card transition-shadow hover:shadow-md",
          isSelected && "ring-2 ring-primary"
        ),
        children: [
          enableMultiSelect && isMultiSelectMode && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute left-2 top-2 z-10", children: /* @__PURE__ */ jsxRuntime.jsx(
            "input",
            {
              type: "checkbox",
              checked: isSelected,
              onChange: () => toggle(itemId),
              className: "h-4 w-4 rounded border-primary text-primary focus:ring-ring",
              "aria-label": `Select item ${itemId}`
            }
          ) }),
          renderCard(row.original, context)
        ]
      }
    );
  }
  const item = row.original;
  const desc = itemDescriptor;
  const cardEditProps = enableInlineEdit ? {
    role: "button",
    tabIndex: 0,
    onDoubleClick: () => onStartEdit(),
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onStartEdit();
      }
    }
  } : {};
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: cn(
        "relative flex flex-col rounded-lg border bg-card transition-shadow hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        enableInlineEdit && "cursor-default"
      ),
      ...cardEditProps,
      children: [
        enableMultiSelect && isMultiSelectMode && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute left-2 top-2 z-10", children: /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            type: "checkbox",
            checked: isSelected,
            onChange: () => toggle(itemId),
            className: "h-4 w-4 rounded border-primary text-primary focus:ring-ring",
            "aria-label": `Select item ${itemId}`
          }
        ) }),
        desc?.image && !!item[desc.image] && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "aspect-video w-full overflow-hidden rounded-t-lg bg-muted", children: /* @__PURE__ */ jsxRuntime.jsx(
          "img",
          {
            src: String(item[desc.image]),
            alt: "",
            className: "h-full w-full object-cover"
          }
        ) }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-1 flex-col gap-1 p-4", children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-start gap-2", children: [
            desc?.avatar && !!item[desc.avatar] && /* @__PURE__ */ jsxRuntime.jsx(
              "img",
              {
                src: String(item[desc.avatar]),
                alt: "",
                className: "h-8 w-8 rounded-full object-cover"
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex-1 min-w-0", children: [
              desc?.title && /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "truncate font-medium text-sm", children: String(item[desc.title] ?? "") }),
              desc?.subtitle && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "truncate text-xs text-muted-foreground", children: String(item[desc.subtitle] ?? "") })
            ] })
          ] }),
          desc?.description && !!item[desc.description] && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "mt-1 text-xs text-muted-foreground line-clamp-2", children: String(item[desc.description]) }),
          desc?.badges && desc.badges.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: desc.badges.map((badge) => {
            const val = String(item[badge.field] ?? "");
            const opt = badge.options?.find((o) => o.value === val);
            return /* @__PURE__ */ jsxRuntime.jsx(
              "span",
              {
                className: cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  opt?.className
                ),
                children: opt?.label ?? val
              },
              badge.field
            );
          }) }),
          desc?.metadata && desc.metadata.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-2 space-y-0.5", children: desc.metadata.map((meta) => {
            const val = item[meta.field];
            return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-1 text-[11px] text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "font-medium", children: [
                meta.label,
                ":"
              ] }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { children: meta.format ? meta.format(val) : String(val ?? "") })
            ] }, meta.field);
          }) })
        ] }),
        isEditing && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "border-t p-4", children: /* @__PURE__ */ jsxRuntime.jsx(
          InlineItemEditor,
          {
            item,
            columns,
            itemDescriptor: desc,
            onSave: onInlineSave,
            onCancel: onCancelEdit
          }
        ) }),
        !isEditing && actions.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center justify-end border-t px-3 py-2", children: /* @__PURE__ */ jsxRuntime.jsx(ActionButtonRow, { item, actions }) })
      ]
    }
  );
}
function buildBreakpointClasses(cols) {
  const classes = ["grid gap-4"];
  if (cols.sm) classes.push(`grid-cols-${cols.sm}`);
  else classes.push("grid-cols-1");
  if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
  return classes.join(" ");
}
function ListView({
  rows,
  columns,
  itemDescriptor,
  renderItem,
  actions = [],
  enableInlineEdit,
  onInlineSave,
  selectionStore,
  enableMultiSelect,
  getRowId,
  className
}) {
  const [editingId, setEditingId] = React6.useState(null);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: cn("divide-y rounded-md border", className), children: rows.map((row) => {
    const id = getRowId?.(row.original) ?? row.id;
    const isEditing = editingId === id;
    return /* @__PURE__ */ jsxRuntime.jsx(
      ListItem,
      {
        row,
        itemId: id,
        columns,
        itemDescriptor,
        renderItem,
        actions,
        isEditing,
        enableInlineEdit,
        onStartEdit: () => setEditingId(id),
        onCancelEdit: () => setEditingId(null),
        onInlineSave: (changes) => {
          onInlineSave?.(row.original, changes);
          setEditingId(null);
        },
        selectionStore,
        enableMultiSelect
      },
      id
    );
  }) });
}
function ListItem({
  row,
  itemId,
  columns,
  itemDescriptor,
  renderItem,
  actions,
  isEditing,
  enableInlineEdit,
  onStartEdit,
  onCancelEdit,
  onInlineSave,
  selectionStore,
  enableMultiSelect
}) {
  const selStore = selectionStore ?? selectionStorePlaceholder;
  const isSelected = useSelectionStore(
    selStore,
    (s) => selectionStore ? s.isSelected(itemId) : false
  );
  const isMultiSelectMode = useSelectionStore(
    selStore,
    (s) => selectionStore ? s.isMultiSelectMode : false
  );
  const storeToggle = useSelectionStore(selStore, (s) => s.toggle);
  const toggle = React6.useCallback(
    (id) => {
      if (selectionStore) storeToggle(id);
    },
    [selectionStore, storeToggle]
  );
  const context = {
    isSelected,
    isEditing,
    isMultiSelectMode,
    onToggleSelect: () => toggle(itemId),
    onEdit: onStartEdit,
    onSave: onInlineSave,
    onCancel: onCancelEdit,
    actions,
    row
  };
  const item = row.original;
  const desc = itemDescriptor;
  const rowEditProps = enableInlineEdit ? {
    role: "button",
    tabIndex: 0,
    onDoubleClick: () => onStartEdit(),
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onStartEdit();
      }
    }
  } : {};
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: cn(
        "transition-colors",
        isSelected && "bg-muted/50"
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-3 px-4 py-3 hover:bg-muted/30", children: [
          enableMultiSelect && isMultiSelectMode && /* @__PURE__ */ jsxRuntime.jsx(
            "input",
            {
              type: "checkbox",
              checked: isSelected,
              onChange: () => toggle(itemId),
              className: "h-4 w-4 flex-shrink-0 rounded border-primary text-primary focus:ring-ring",
              "aria-label": `Select item ${itemId}`
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: cn("min-w-0 flex-1", enableInlineEdit && "cursor-default"),
                ...rowEditProps,
                children: renderItem ? renderItem(item, context) : /* @__PURE__ */ jsxRuntime.jsx(DefaultListItemContent, { item, descriptor: desc })
              }
            ),
            !isEditing && actions.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntime.jsx(ActionButtonRow, { item, actions, maxVisible: 2 }) })
          ] })
        ] }),
        isEditing && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "px-4 pb-3", children: /* @__PURE__ */ jsxRuntime.jsx(
          InlineItemEditor,
          {
            item,
            columns,
            itemDescriptor: desc,
            onSave: onInlineSave,
            onCancel: onCancelEdit
          }
        ) })
      ]
    }
  );
}
function DefaultListItemContent({
  item,
  descriptor
}) {
  if (!descriptor) {
    const rec = item;
    const keys = Object.keys(rec);
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "truncate text-sm font-medium", children: String(rec[keys[0]] ?? "") }),
      keys[1] && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "truncate text-xs text-muted-foreground", children: String(rec[keys[1]] ?? "") })
    ] });
  }
  const IconComponent = typeof descriptor.icon === "function" ? descriptor.icon : null;
  const iconField = typeof descriptor.icon === "string" ? descriptor.icon : null;
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-1 items-center gap-3 min-w-0", children: [
    descriptor.avatar && !!item[descriptor.avatar] && /* @__PURE__ */ jsxRuntime.jsx(
      "img",
      {
        src: String(item[descriptor.avatar]),
        alt: "",
        className: "h-9 w-9 flex-shrink-0 rounded-full object-cover"
      }
    ),
    !descriptor.avatar && IconComponent && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntime.jsx(IconComponent, { className: "h-4 w-4 text-muted-foreground" }) }),
    !descriptor.avatar && iconField && !!item[iconField] && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-sm", children: String(item[iconField]) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "truncate text-sm font-medium", children: String(item[descriptor.title] ?? "") }),
      descriptor.subtitle && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "truncate text-xs text-muted-foreground", children: String(item[descriptor.subtitle] ?? "") })
    ] }),
    descriptor.badges && descriptor.badges.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex flex-shrink-0 gap-1", children: descriptor.badges.map((badge) => {
      const val = String(item[badge.field] ?? "");
      const opt = badge.options?.find((o) => o.value === val);
      return /* @__PURE__ */ jsxRuntime.jsx(
        "span",
        {
          className: cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
            opt?.className
          ),
          children: opt?.label ?? val
        },
        badge.field
      );
    }) }),
    descriptor.metadata && descriptor.metadata.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "hidden flex-shrink-0 gap-4 sm:flex", children: descriptor.metadata.map((meta) => {
      const val = item[meta.field];
      return /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-xs text-muted-foreground", children: meta.format ? meta.format(val) : String(val ?? "") }, meta.field);
    }) })
  ] });
}
function ViewModeSwitcher({
  mode,
  onModeChange,
  enabledModes = ["table", "gallery", "list"],
  className
}) {
  if (enabledModes.length <= 1) return null;
  const modes = [
    { key: "table", icon: TableIcon, label: "Table view" },
    { key: "gallery", icon: GalleryIcon, label: "Gallery view" },
    { key: "list", icon: ListIcon, label: "List view" }
  ];
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: cn("inline-flex items-center rounded-lg bg-muted/60 p-1 gap-0.5", className), children: modes.filter((m) => enabledModes.includes(m.key)).map(({ key, icon: Icon, label }) => /* @__PURE__ */ jsxRuntime.jsxs(
    "button",
    {
      type: "button",
      onClick: () => onModeChange(key),
      title: label,
      className: cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        mode === key ? "bg-background text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(Icon, { className: "h-3.5 w-3.5" }),
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: label })
      ]
    },
    key
  )) });
}
function TableIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Table" }),
    /* @__PURE__ */ jsxRuntime.jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "3", y1: "15", x2: "21", y2: "15" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "9", y1: "3", x2: "9", y2: "21" })
  ] });
}
function GalleryIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Gallery" }),
    /* @__PURE__ */ jsxRuntime.jsx("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }),
    /* @__PURE__ */ jsxRuntime.jsx("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }),
    /* @__PURE__ */ jsxRuntime.jsx("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }),
    /* @__PURE__ */ jsxRuntime.jsx("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" })
  ] });
}
function ListIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "List" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "8", y1: "6", x2: "21", y2: "6" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "8", y1: "12", x2: "21", y2: "12" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "8", y1: "18", x2: "21", y2: "18" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "3", y1: "6", x2: "3.01", y2: "6" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "3", y1: "12", x2: "3.01", y2: "12" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "3", y1: "18", x2: "3.01", y2: "18" })
  ] });
}
function DataTableToolbar({
  table,
  viewMode,
  onViewModeChange,
  enabledViewModes,
  enableSearch = true,
  onRefresh,
  showColumnVisibility = true,
  className,
  children
}) {
  const [colVisOpen, setColVisOpen] = React6.useState(false);
  const globalFilter = table.getState().globalFilter;
  const columnFilters = table.getState().columnFilters;
  const hasFilters = columnFilters.length > 0;
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: cn("flex items-center justify-between gap-2", className), children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-1 items-center gap-2", children: [
      enableSearch && /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          type: "search",
          placeholder: "Search...",
          value: String(globalFilter ?? ""),
          onChange: (e) => table.setGlobalFilter(e.target.value || void 0),
          className: "flex h-9 w-full max-w-sm rounded-lg bg-muted/60 px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:bg-muted transition-colors",
          "aria-label": "Search table"
        }
      ),
      hasFilters && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-1", children: [
        columnFilters.map((f) => /* @__PURE__ */ jsxRuntime.jsxs(
          "span",
          {
            className: "inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-0.5 text-xs font-medium text-foreground",
            children: [
              f.id,
              ": ",
              String(f.value),
              /* @__PURE__ */ jsxRuntime.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => table.setColumnFilters(
                    (prev) => prev.filter((cf) => cf.id !== f.id)
                  ),
                  className: "ml-0.5 rounded-full hover:bg-muted p-0.5 transition-colors",
                  "aria-label": `Remove filter ${f.id}`,
                  children: /* @__PURE__ */ jsxRuntime.jsx(XIcon, { className: "h-3 w-3" })
                }
              )
            ]
          },
          f.id
        )),
        /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            type: "button",
            onClick: () => table.resetColumnFilters(),
            className: "text-xs text-muted-foreground hover:text-foreground transition-colors",
            children: "Clear all"
          }
        )
      ] }),
      children
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        ViewModeSwitcher,
        {
          mode: viewMode,
          onModeChange: onViewModeChange,
          enabledModes: enabledViewModes
        }
      ),
      showColumnVisibility && viewMode === "table" && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setColVisOpen(!colVisOpen),
            className: "inline-flex h-9 items-center gap-1.5 rounded-lg bg-muted/60 px-3 text-sm font-medium text-foreground hover:bg-muted transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(ColumnsIcon, { className: "h-4 w-4" }),
              "Columns"
            ]
          }
        ),
        colVisOpen && /* @__PURE__ */ jsxRuntime.jsx(
          ColumnVisibilityMenu,
          {
            table,
            onClose: () => setColVisOpen(false)
          }
        )
      ] }),
      onRefresh && /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: onRefresh,
          title: "Refresh",
          "aria-label": "Refresh",
          className: "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
          children: /* @__PURE__ */ jsxRuntime.jsx(RefreshIcon, { className: "h-4 w-4" })
        }
      )
    ] })
  ] });
}
function ColumnVisibilityMenu({
  table,
  onClose
}) {
  const columns = table.getAllLeafColumns().filter((c) => c.getCanHide());
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        type: "button",
        className: "fixed inset-0 z-40 cursor-default bg-transparent p-0",
        onClick: onClose,
        "aria-label": "Close column visibility menu"
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "absolute right-0 z-50 mt-1 min-w-[180px] rounded-xl bg-popover p-2 shadow-xl", children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Toggle columns" }),
      columns.map((column) => /* @__PURE__ */ jsxRuntime.jsxs(
        "label",
        {
          className: "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "input",
              {
                type: "checkbox",
                checked: column.getIsVisible(),
                onChange: () => column.toggleVisibility(),
                className: "h-4 w-4 rounded accent-primary"
              }
            ),
            typeof column.columnDef.header === "string" ? column.columnDef.header : column.id
          ]
        },
        column.id
      ))
    ] })
  ] });
}
function XIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Close" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M18 6 6 18" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m6 6 12 12" })
  ] });
}
function ColumnsIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Columns" }),
    /* @__PURE__ */ jsxRuntime.jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "12", y1: "3", x2: "12", y2: "21" })
  ] });
}
function RefreshIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Refresh" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M21 3v5h-5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 16H3v5" })
  ] });
}
function DataTablePagination({
  table,
  mode = "pages",
  pageSizeOptions = [10, 20, 30, 50, 100],
  onLoadMore,
  totalCount,
  className
}) {
  const pageSizeId = React6.useId();
  if (mode === "none") return null;
  const state = table.getState();
  const count = totalCount ?? table.getPrePaginationRowModel().rows.length;
  if (mode === "loadMore") {
    const hasMore = table.getCanNextPage();
    if (!hasMore) return null;
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: cn("flex justify-center py-4", className), children: /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        type: "button",
        onClick: onLoadMore ?? (() => table.nextPage()),
        className: "inline-flex items-center justify-center rounded-lg bg-muted/60 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors",
        children: "Load more"
      }
    ) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: cn(
        "flex items-center justify-between px-2 py-4",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex-1 text-sm text-muted-foreground", children: count > 0 && /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
          "Showing ",
          state.pagination.pageIndex * state.pagination.pageSize + 1,
          " - ",
          Math.min(
            (state.pagination.pageIndex + 1) * state.pagination.pageSize,
            count
          ),
          " ",
          "of ",
          count
        ] }) }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-6 lg:gap-8", children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: pageSizeId, className: "text-sm font-medium", children: "Rows per page" }),
            /* @__PURE__ */ jsxRuntime.jsx(
              "select",
              {
                id: pageSizeId,
                value: state.pagination.pageSize,
                onChange: (e) => table.setPageSize(Number(e.target.value)),
                className: "h-8 w-[70px] rounded-lg bg-muted/60 px-2 text-sm focus-visible:outline-none focus-visible:bg-muted transition-colors",
                "aria-label": "Rows per page",
                children: pageSizeOptions.map((size) => /* @__PURE__ */ jsxRuntime.jsx("option", { value: size, children: size }, size))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-1 text-sm font-medium", children: [
            "Page ",
            state.pagination.pageIndex + 1,
            " of ",
            table.getPageCount()
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              PaginationButton,
              {
                onClick: () => table.firstPage(),
                disabled: !table.getCanPreviousPage(),
                label: "First page",
                children: /* @__PURE__ */ jsxRuntime.jsx(ChevronsLeftIcon, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              PaginationButton,
              {
                onClick: () => table.previousPage(),
                disabled: !table.getCanPreviousPage(),
                label: "Previous page",
                children: /* @__PURE__ */ jsxRuntime.jsx(ChevronLeftIcon, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              PaginationButton,
              {
                onClick: () => table.nextPage(),
                disabled: !table.getCanNextPage(),
                label: "Next page",
                children: /* @__PURE__ */ jsxRuntime.jsx(ChevronRightIcon, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              PaginationButton,
              {
                onClick: () => table.lastPage(),
                disabled: !table.getCanNextPage(),
                label: "Last page",
                children: /* @__PURE__ */ jsxRuntime.jsx(ChevronsRightIcon, { className: "h-4 w-4" })
              }
            )
          ] })
        ] })
      ]
    }
  );
}
function PaginationButton({
  onClick,
  disabled,
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      title: label,
      className: "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 transition-colors",
      children: [
        children,
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: label })
      ]
    }
  );
}
function ChevronLeftIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Chevron left" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m15 18-6-6 6-6" })
  ] });
}
function ChevronRightIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Chevron right" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m9 18 6-6-6-6" })
  ] });
}
function ChevronsLeftIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Chevrons left" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m11 17-5-5 5-5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m18 17-5-5 5-5" })
  ] });
}
function ChevronsRightIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Chevrons right" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m6 17 5-5-5-5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m13 17 5-5-5-5" })
  ] });
}
function EmptyState({ config, isFiltered = false, className }) {
  if (React6__default.default.isValidElement(config)) {
    return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: config });
  }
  const cfg = config ?? {};
  const title = isFiltered ? cfg.filteredTitle ?? "No results found" : cfg.title ?? "No items";
  const description = isFiltered ? cfg.filteredDescription ?? "Try adjusting your search or filter criteria." : cfg.description ?? "Get started by creating your first item.";
  const action = isFiltered ? cfg.filteredAction : cfg.action;
  const IconComponent = cfg.icon;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      ),
      children: [
        IconComponent && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-4 rounded-full bg-muted p-3", children: /* @__PURE__ */ jsxRuntime.jsx(IconComponent, { className: "h-8 w-8 text-muted-foreground" }) }),
        !IconComponent && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-4 rounded-full bg-muted p-3", children: /* @__PURE__ */ jsxRuntime.jsx(EmptyBoxIcon, { className: "h-8 w-8 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "mb-1 text-base font-semibold", children: title }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "mb-4 max-w-sm text-sm text-muted-foreground", children: description }),
        action && /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            type: "button",
            onClick: action.onClick,
            className: "inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90",
            children: action.label
          }
        )
      ]
    }
  );
}
function EmptyBoxIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Empty" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }),
    /* @__PURE__ */ jsxRuntime.jsx("polyline", { points: "3.29 7 12 12 20.71 7" }),
    /* @__PURE__ */ jsxRuntime.jsx("line", { x1: "12", y1: "22", x2: "12", y2: "12" })
  ] });
}
function MultiSelectBar({
  store,
  batchActions = [],
  onBatchAction,
  totalCount,
  className
}) {
  const selectedIdsSet = useSelectionStore(store, (s) => s.selectedIds);
  const selectedCount = selectedIdsSet.size;
  const selectedIds = React6.useMemo(() => Array.from(selectedIdsSet), [selectedIdsSet]);
  const deselectAll = useSelectionStore(store, (s) => s.deselectAll);
  useSelectionStore(store, (s) => s.selectAll);
  if (selectedCount === 0) return null;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: cn(
        "sticky bottom-0 z-40 flex items-center justify-between gap-4 rounded-xl bg-foreground/[0.07] px-4 py-3",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "text-sm font-semibold", children: [
            selectedCount,
            " item",
            selectedCount !== 1 ? "s" : "",
            " selected"
          ] }),
          totalCount != null && totalCount > selectedCount && /* @__PURE__ */ jsxRuntime.jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
              },
              className: "text-xs font-medium text-primary hover:text-primary/80 transition-colors",
              children: [
                "Select all ",
                totalCount
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              type: "button",
              onClick: deselectAll,
              className: "text-xs text-muted-foreground hover:text-foreground transition-colors",
              children: "Deselect all"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center gap-2", children: batchActions.map((action) => /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onBatchAction?.(action.id, selectedIds),
            className: cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
              action.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-muted/80 text-foreground hover:bg-muted"
            ),
            children: [
              action.icon && /* @__PURE__ */ jsxRuntime.jsx(action.icon, { className: "h-3.5 w-3.5" }),
              action.label
            ]
          },
          action.id
        )) })
      ]
    }
  );
}
function PresetPicker({
  filterPresets,
  columnPresets,
  activeFilterId,
  activeColumnId,
  onApplyFilter,
  onApplyColumn,
  onEditFilter,
  onEditColumn,
  onDeleteFilter,
  onDeleteColumn,
  onNewFilter,
  onNewColumn,
  pendingChangesCount = 0,
  className
}) {
  const [isOpen, setIsOpen] = React6.useState(false);
  const [activeTab, setActiveTab] = React6.useState("filters");
  const popoverRef = React6.useRef(null);
  const triggerRef = React6.useRef(null);
  React6.useEffect(() => {
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target) && !triggerRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: cn("relative inline-block", className), children: [
    /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        ref: triggerRef,
        type: "button",
        onClick: () => setIsOpen(!isOpen),
        "aria-label": "Open presets menu",
        className: cn(
          "inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent",
          (activeFilterId || activeColumnId) && "border-primary text-primary"
        ),
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(BookmarkIcon, { className: "h-4 w-4" }),
          "Presets",
          pendingChangesCount > 0 && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white", children: pendingChangesCount })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        ref: popoverRef,
        className: "absolute right-0 z-50 mt-1 w-[280px] rounded-md border bg-popover shadow-md",
        children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex border-b", children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                type: "button",
                onClick: () => setActiveTab("filters"),
                className: cn(
                  "flex-1 px-4 py-2 text-sm font-medium",
                  activeTab === "filters" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                ),
                children: "Filters"
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                type: "button",
                onClick: () => setActiveTab("columns"),
                className: cn(
                  "flex-1 px-4 py-2 text-sm font-medium",
                  activeTab === "columns" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                ),
                children: "Columns"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "max-h-[300px] overflow-auto p-2", children: activeTab === "filters" ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            activeFilterId && /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  onApplyFilter(null);
                  setIsOpen(false);
                },
                className: "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent",
                children: "Clear active filter"
              }
            ),
            filterPresets.map((preset) => /* @__PURE__ */ jsxRuntime.jsx(
              PresetItem,
              {
                name: preset.name,
                description: preset.description,
                isActive: preset.id === activeFilterId,
                isDefault: preset.isDefault,
                onApply: () => {
                  onApplyFilter(preset.id);
                  setIsOpen(false);
                },
                onEdit: () => {
                  onEditFilter(preset);
                  setIsOpen(false);
                },
                onDelete: () => onDeleteFilter(preset.id)
              },
              preset.id
            )),
            filterPresets.length === 0 && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "px-3 py-4 text-center text-xs text-muted-foreground", children: "No saved filter presets" }),
            /* @__PURE__ */ jsxRuntime.jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  onNewFilter();
                  setIsOpen(false);
                },
                className: "mt-1 flex w-full items-center gap-1 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground",
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx(PlusIcon, { className: "h-3 w-3" }),
                  " Save current as preset"
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            activeColumnId && /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  onApplyColumn(null);
                  setIsOpen(false);
                },
                className: "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent",
                children: "Clear active column layout"
              }
            ),
            columnPresets.map((preset) => /* @__PURE__ */ jsxRuntime.jsx(
              PresetItem,
              {
                name: preset.name,
                description: preset.description,
                isActive: preset.id === activeColumnId,
                isDefault: preset.isDefault,
                onApply: () => {
                  onApplyColumn(preset.id);
                  setIsOpen(false);
                },
                onEdit: () => {
                  onEditColumn(preset);
                  setIsOpen(false);
                },
                onDelete: () => onDeleteColumn(preset.id)
              },
              preset.id
            )),
            columnPresets.length === 0 && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "px-3 py-4 text-center text-xs text-muted-foreground", children: "No saved column presets" }),
            /* @__PURE__ */ jsxRuntime.jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  onNewColumn();
                  setIsOpen(false);
                },
                className: "mt-1 flex w-full items-center gap-1 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground",
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx(PlusIcon, { className: "h-3 w-3" }),
                  " Save current as preset"
                ]
              }
            )
          ] }) })
        ]
      }
    )
  ] });
}
function PresetItem({
  name,
  description,
  isActive,
  isDefault,
  onApply,
  onEdit,
  onDelete
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React6.useState(false);
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent",
        isActive && "bg-primary/10"
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            onClick: onApply,
            className: "flex flex-1 flex-col items-start min-w-0",
            children: [
              /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "flex items-center gap-1 text-sm font-medium truncate", children: [
                name,
                isDefault && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-[10px] text-muted-foreground", children: "(default)" }),
                isActive && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-primary" })
              ] }),
              description && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-xs text-muted-foreground truncate", children: description })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "hidden items-center gap-0.5 group-hover:flex", children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              type: "button",
              onClick: onEdit,
              title: "Edit",
              "aria-label": "Edit preset",
              className: "inline-flex h-6 w-6 items-center justify-center rounded hover:bg-background",
              children: /* @__PURE__ */ jsxRuntime.jsx(PencilIcon2, { className: "h-3 w-3" })
            }
          ),
          showDeleteConfirm ? /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                onDelete();
                setShowDeleteConfirm(false);
              },
              className: "inline-flex h-6 items-center rounded px-1 text-[10px] font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground",
              children: "Confirm"
            }
          ) : /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowDeleteConfirm(true),
              title: "Delete",
              "aria-label": "Delete preset",
              className: "inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-destructive",
              children: /* @__PURE__ */ jsxRuntime.jsx(TrashIcon2, { className: "h-3 w-3" })
            }
          )
        ] })
      ]
    }
  );
}
function BookmarkIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Presets" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" })
  ] });
}
function PlusIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Add" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M5 12h14" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M12 5v14" })
  ] });
}
function PencilIcon2({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Edit" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" })
  ] });
}
function TrashIcon2({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Delete" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M3 6h18" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
  ] });
}
var operators = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "starts_with", label: "starts with" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "in", label: "in list" },
  { value: "is_null", label: "is empty" },
  { value: "is_not_null", label: "is not empty" }
];
var nextClauseId = 0;
function FilterPresetDialog({
  open,
  onOpenChange,
  columns,
  preset,
  onSave
}) {
  const nameId = React6.useId();
  const descriptionId = React6.useId();
  const [name, setName] = React6.useState(preset?.name ?? "");
  const [description, setDescription] = React6.useState(preset?.description ?? "");
  const [isDefault, setIsDefault] = React6.useState(preset?.isDefault ?? false);
  const [logic, setLogic] = React6.useState("and");
  const [clauses, setClauses] = React6.useState(() => {
    if (!preset?.filter) return [];
    const filterSpec = preset.filter;
    const rawClauses = Array.isArray(filterSpec) ? filterSpec : filterSpec.clauses ?? [];
    return rawClauses.filter((c) => "field" in c).map((c) => ({
      id: `clause_${++nextClauseId}`,
      field: c.field,
      operator: c.op,
      value: String(c.value ?? "")
    }));
  });
  const filterableColumns = columns.filter(
    (c) => c.enableFiltering !== false && (c.accessorKey || c.id)
  );
  function addClause() {
    setClauses((prev) => [
      ...prev,
      {
        id: `clause_${++nextClauseId}`,
        field: filterableColumns[0]?.accessorKey ?? filterableColumns[0]?.id ?? "",
        operator: "eq",
        value: ""
      }
    ]);
  }
  function removeClause(id) {
    setClauses((prev) => prev.filter((c) => c.id !== id));
  }
  function updateClause(id, updates) {
    setClauses(
      (prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c)
    );
  }
  function handleSave() {
    const filterClauses = clauses.filter((c) => c.field).map((c) => ({
      field: c.field,
      op: c.operator,
      value: c.value
    }));
    onSave({
      name,
      description: description || void 0,
      isDefault,
      filter: {
        logic,
        clauses: filterClauses
      }
    });
    onOpenChange(false);
  }
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full max-w-lg rounded-lg border bg-background shadow-lg", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center justify-between border-b px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { className: "text-lg font-semibold", children: preset ? "Edit Filter Preset" : "New Filter Preset" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: () => onOpenChange(false),
          className: "rounded-sm opacity-70 hover:opacity-100",
          "aria-label": "Close dialog",
          children: /* @__PURE__ */ jsxRuntime.jsx(XIcon2, { className: "h-4 w-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-4 px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: nameId, className: "text-sm font-medium", children: "Name" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            id: nameId,
            type: "text",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: "My filter",
            className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: descriptionId, className: "text-sm font-medium", children: "Description" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            id: descriptionId,
            type: "text",
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: "Optional description",
            className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("fieldset", { className: "space-y-2 border-0 p-0", children: [
        /* @__PURE__ */ jsxRuntime.jsx("legend", { className: "sr-only", children: "Filter conditions" }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-sm font-medium", children: "Conditions" }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-1 rounded-md border p-0.5", children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                type: "button",
                onClick: () => setLogic("and"),
                className: cn(
                  "rounded px-2 py-0.5 text-xs font-medium",
                  logic === "and" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                ),
                children: "AND"
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                type: "button",
                onClick: () => setLogic("or"),
                className: cn(
                  "rounded px-2 py-0.5 text-xs font-medium",
                  logic === "or" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                ),
                children: "OR"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "space-y-2", children: clauses.map((clause, idx) => /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
          idx > 0 && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-xs text-muted-foreground w-8 text-center", children: logic.toUpperCase() }),
          idx === 0 && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "w-8 text-center text-xs text-muted-foreground", children: "Where" }),
          /* @__PURE__ */ jsxRuntime.jsx(
            "select",
            {
              value: clause.field,
              onChange: (e) => updateClause(clause.id, { field: e.target.value }),
              className: "h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm",
              "aria-label": `Field for condition ${idx + 1}`,
              children: filterableColumns.map((col) => /* @__PURE__ */ jsxRuntime.jsx("option", { value: col.accessorKey ?? col.id, children: typeof col.header === "string" ? col.header : col.accessorKey ?? col.id }, col.accessorKey ?? col.id))
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "select",
            {
              value: clause.operator,
              onChange: (e) => updateClause(clause.id, { operator: e.target.value }),
              className: "h-8 w-[130px] rounded-md border border-input bg-background px-2 text-sm",
              "aria-label": `Operator for condition ${idx + 1}`,
              children: operators.map((op) => /* @__PURE__ */ jsxRuntime.jsx("option", { value: op.value, children: op.label }, op.value))
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "input",
            {
              type: "text",
              value: clause.value,
              onChange: (e) => updateClause(clause.id, { value: e.target.value }),
              placeholder: "Value",
              className: "h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm",
              "aria-label": `Value for condition ${idx + 1}`
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              type: "button",
              onClick: () => removeClause(clause.id),
              className: "inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground",
              "aria-label": `Remove condition ${idx + 1}`,
              children: /* @__PURE__ */ jsxRuntime.jsx(XIcon2, { className: "h-3.5 w-3.5" })
            }
          )
        ] }, clause.id)) }),
        /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            onClick: addClause,
            className: "inline-flex h-8 items-center gap-1 rounded-md border border-dashed border-input px-3 text-xs text-muted-foreground hover:text-foreground hover:border-foreground",
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(PlusIcon2, { className: "h-3 w-3" }),
              "Add condition"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            type: "checkbox",
            checked: isDefault,
            onChange: (e) => setIsDefault(e.target.checked),
            className: "h-4 w-4 rounded border-primary text-primary focus:ring-ring"
          }
        ),
        "Set as default filter"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex justify-end gap-2 border-t px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: () => onOpenChange(false),
          className: "inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsxs(
        "button",
        {
          type: "button",
          onClick: handleSave,
          disabled: !name.trim(),
          className: "inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
          children: [
            preset ? "Update" : "Save",
            " Preset"
          ]
        }
      )
    ] })
  ] }) });
}
function XIcon2({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Close" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M18 6 6 18" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m6 6 12 12" })
  ] });
}
function PlusIcon2({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Add" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M5 12h14" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M12 5v14" })
  ] });
}
function ColumnPresetDialog({
  open,
  onOpenChange,
  columns,
  preset,
  onSave
}) {
  const [name, setName] = React6.useState(preset?.name ?? "");
  const [description, setDescription] = React6.useState(preset?.description ?? "");
  const [isDefault, setIsDefault] = React6.useState(preset?.isDefault ?? false);
  const [entries, setEntries] = React6.useState(() => {
    if (preset?.columns) return [...preset.columns];
    return columns.map((col, idx) => ({
      id: col.accessorKey ?? col.id ?? `col_${idx}`,
      visible: true,
      width: col.size ?? 150,
      order: idx,
      pinned: false
    }));
  });
  const [dragIdx, setDragIdx] = React6.useState(null);
  function updateEntry(id, updates) {
    setEntries(
      (prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e)
    );
  }
  function handleDragStart(idx) {
    setDragIdx(idx);
  }
  function handleDragOver(e, idx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setEntries((prev) => {
      const items = [...prev];
      const [dragged] = items.splice(dragIdx, 1);
      items.splice(idx, 0, dragged);
      return items.map((item, i) => ({ ...item, order: i }));
    });
    setDragIdx(idx);
  }
  function handleDragEnd() {
    setDragIdx(null);
  }
  function getColumnLabel(id) {
    const col = columns.find((c) => (c.accessorKey ?? c.id) === id);
    if (col && typeof col.header === "string") return col.header;
    return id;
  }
  function handleSave() {
    onSave({
      name,
      description: description || void 0,
      isDefault,
      columns: entries
    });
    onOpenChange(false);
  }
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full max-w-lg rounded-lg border bg-background shadow-lg", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center justify-between border-b px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { className: "text-lg font-semibold", children: preset ? "Edit Column Preset" : "New Column Preset" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: () => onOpenChange(false),
          className: "rounded-sm opacity-70 hover:opacity-100",
          "aria-label": "Close dialog",
          children: /* @__PURE__ */ jsxRuntime.jsx(XIcon3, { className: "h-4 w-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-4 px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: "column-preset-name", className: "text-sm font-medium", children: "Name" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            id: "column-preset-name",
            type: "text",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: "My column layout",
            className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: "column-preset-description", className: "text-sm font-medium", children: "Description" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            id: "column-preset-description",
            type: "text",
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: "Optional description",
            className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("fieldset", { className: "space-y-2 border-0 p-0", children: [
        /* @__PURE__ */ jsxRuntime.jsx("legend", { className: "text-sm font-medium", children: "Columns" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "ul",
          {
            className: "max-h-[300px] list-none overflow-auto rounded-md border p-0",
            "aria-label": "Column order and visibility",
            children: entries.map((entry, idx) => /* @__PURE__ */ jsxRuntime.jsxs(
              "li",
              {
                onDragOver: (e) => handleDragOver(e, idx),
                className: cn(
                  "flex items-center gap-3 border-b px-3 py-2 last:border-b-0",
                  dragIdx === idx && "bg-muted"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx(
                    "button",
                    {
                      type: "button",
                      draggable: true,
                      onDragStart: () => handleDragStart(idx),
                      onDragEnd: handleDragEnd,
                      className: "inline-flex flex-shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-muted",
                      "aria-label": `Reorder column ${getColumnLabel(entry.id)}`,
                      children: /* @__PURE__ */ jsxRuntime.jsx(GripIcon, { className: "h-4 w-4" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: entry.visible,
                      onChange: (e) => updateEntry(entry.id, { visible: e.target.checked }),
                      className: "h-4 w-4 flex-shrink-0 rounded border-primary text-primary focus:ring-ring",
                      "aria-label": `Show column ${getColumnLabel(entry.id)}`
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsx("span", { className: "flex-1 text-sm font-medium truncate", children: getColumnLabel(entry.id) }),
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "input",
                      {
                        type: "number",
                        value: entry.width ?? 150,
                        onChange: (e) => updateEntry(entry.id, {
                          width: Number(e.target.value) || 150
                        }),
                        className: "h-7 w-16 rounded border border-input bg-background px-1 text-xs text-center",
                        "aria-label": `Width in pixels for ${getColumnLabel(entry.id)}`
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsxs(
                      "select",
                      {
                        value: entry.pinned || "none",
                        onChange: (e) => updateEntry(entry.id, {
                          pinned: e.target.value === "none" ? false : e.target.value
                        }),
                        className: "h-7 w-[70px] rounded border border-input bg-background px-1 text-xs",
                        "aria-label": `Pin ${getColumnLabel(entry.id)}`,
                        children: [
                          /* @__PURE__ */ jsxRuntime.jsx("option", { value: "none", children: "None" }),
                          /* @__PURE__ */ jsxRuntime.jsx("option", { value: "left", children: "Left" }),
                          /* @__PURE__ */ jsxRuntime.jsx("option", { value: "right", children: "Right" })
                        ]
                      }
                    )
                  ] })
                ]
              },
              entry.id
            ))
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            type: "checkbox",
            checked: isDefault,
            onChange: (e) => setIsDefault(e.target.checked),
            className: "h-4 w-4 rounded border-primary text-primary focus:ring-ring"
          }
        ),
        "Set as default column layout"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex justify-end gap-2 border-t px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: () => onOpenChange(false),
          className: "inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsxs(
        "button",
        {
          type: "button",
          onClick: handleSave,
          disabled: !name.trim(),
          className: "inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
          children: [
            preset ? "Update" : "Save",
            " Preset"
          ]
        }
      )
    ] })
  ] }) });
}
function XIcon3({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Close" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M18 6 6 18" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m6 6 12 12" })
      ]
    }
  );
}
function GripIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Drag handle" }),
        /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "9", cy: "12", r: "1" }),
        /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "9", cy: "5", r: "1" }),
        /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "9", cy: "19", r: "1" }),
        /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "15", cy: "12", r: "1" }),
        /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "15", cy: "5", r: "1" }),
        /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "15", cy: "19", r: "1" })
      ]
    }
  );
}
function EntityListView(props) {
  const {
    data: dataProp,
    viewResult,
    columns,
    itemDescriptor,
    renderCard,
    renderItem,
    defaultViewMode = "table",
    enabledViewModes = ["table", "gallery", "list"],
    actions,
    enableMultiSelect = false,
    onBatchAction,
    batchActions,
    enableInlineEdit = false,
    onInlineEdit,
    onInlineSave,
    emptyState,
    tableId,
    enablePresets = false,
    getRowId,
    paginationMode = "pages",
    pageSize = 10,
    galleryColumns,
    enableColumnResizing = false,
    enableColumnPinning = false,
    enableGrouping = false,
    enableSearch = true,
    onRefresh,
    className
  } = props;
  const data = React6.useMemo(
    () => viewResult?.items ?? dataProp ?? [],
    [viewResult?.items, dataProp]
  );
  const selectionStoreRef = React6.useRef(null);
  if (!selectionStoreRef.current) {
    selectionStoreRef.current = createSelectionStore();
  }
  const [viewMode, setViewMode] = React6.useState(defaultViewMode);
  const adapter = useTableStorageAdapter();
  const realtimeMode = useTableRealtimeMode();
  const presets = useTablePresets(tableId ?? "__no_table_id__", {
    adapter,
    realtimeMode,
    enabled: enablePresets && !!tableId
  });
  const [filterDialogOpen, setFilterDialogOpen] = React6.useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = React6.useState(false);
  const [editingFilterPreset, setEditingFilterPreset] = React6.useState(null);
  const [editingColumnPreset, setEditingColumnPreset] = React6.useState(null);
  const table = useTable({
    data,
    columns,
    getRowId: getRowId ? (row, idx) => getRowId(row) : void 0,
    enableSorting: true,
    enableFiltering: true,
    enableColumnResizing,
    enablePinning: enableColumnPinning,
    enableGrouping,
    enableRowSelection: enableMultiSelect,
    manualPagination: !!viewResult,
    pageCount: viewResult?.total ? Math.ceil(viewResult.total / pageSize) : void 0,
    initialState: {
      pagination: { pageIndex: 0, pageSize }
    }
  });
  const rowModel = table.getRowModel();
  const prePagRows = table.getPrePaginationRowModel();
  const isEmpty = data.length === 0;
  const isFilteredEmpty = !isEmpty && prePagRows.rows.length === 0;
  const handleViewModeChange = React6.useCallback(
    (mode) => {
      setViewMode(mode);
      if (enablePresets && tableId) {
        presets.setViewMode(mode);
      }
    },
    [enablePresets, tableId, presets]
  );
  const handleInlineSaveTable = React6.useCallback(
    (item, field, value) => {
      onInlineEdit?.(item, field, value);
    },
    [onInlineEdit]
  );
  const handleInlineSaveItem = React6.useCallback(
    (item, changes) => {
      onInlineSave?.(item, changes);
    },
    [onInlineSave]
  );
  const handleBatchAction = React6.useCallback(
    (actionId, selectedIds) => {
      if (!onBatchAction) return;
      const selectedItems = data.filter((item) => {
        const id = getRowId?.(item) ?? String(data.indexOf(item));
        return selectedIds.includes(id);
      });
      onBatchAction(actionId, selectedItems);
    },
    [onBatchAction, data, getRowId]
  );
  return /* @__PURE__ */ jsxRuntime.jsx(SelectionContext.Provider, { value: selectionStoreRef.current, children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: cn("flex flex-col gap-3", className), children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      DataTableToolbar,
      {
        table,
        viewMode,
        onViewModeChange: handleViewModeChange,
        enabledViewModes,
        enableSearch,
        onRefresh,
        showColumnVisibility: viewMode === "table",
        children: enablePresets && tableId && /* @__PURE__ */ jsxRuntime.jsx(
          PresetPicker,
          {
            filterPresets: presets.filterPresets,
            columnPresets: presets.columnPresets,
            activeFilterId: presets.activeFilterPreset?.id ?? null,
            activeColumnId: presets.activeColumnPreset?.id ?? null,
            onApplyFilter: presets.applyFilterPreset,
            onApplyColumn: presets.applyColumnPreset,
            onEditFilter: (p) => {
              setEditingFilterPreset(p);
              setFilterDialogOpen(true);
            },
            onEditColumn: (p) => {
              setEditingColumnPreset(p);
              setColumnDialogOpen(true);
            },
            onDeleteFilter: presets.deleteFilterPreset,
            onDeleteColumn: presets.deleteColumnPreset,
            onNewFilter: () => {
              setEditingFilterPreset(null);
              setFilterDialogOpen(true);
            },
            onNewColumn: () => {
              setEditingColumnPreset(null);
              setColumnDialogOpen(true);
            },
            pendingChangesCount: presets.pendingChanges.length
          }
        )
      }
    ),
    isEmpty || isFilteredEmpty ? /* @__PURE__ */ jsxRuntime.jsx(
      EmptyState,
      {
        config: emptyState,
        isFiltered: isFilteredEmpty
      }
    ) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      viewMode === "table" && /* @__PURE__ */ jsxRuntime.jsx(
        DataTable,
        {
          table,
          actions,
          enableInlineEdit,
          onInlineSave: handleInlineSaveTable,
          selectionStore: enableMultiSelect ? selectionStoreRef.current : void 0,
          enableMultiSelect,
          getRowId
        }
      ),
      viewMode === "gallery" && /* @__PURE__ */ jsxRuntime.jsx(
        GalleryView,
        {
          rows: rowModel.rows,
          columns,
          itemDescriptor,
          renderCard,
          actions,
          enableInlineEdit,
          onInlineSave: handleInlineSaveItem,
          selectionStore: enableMultiSelect ? selectionStoreRef.current : void 0,
          enableMultiSelect,
          getRowId,
          galleryColumns
        }
      ),
      viewMode === "list" && /* @__PURE__ */ jsxRuntime.jsx(
        ListView,
        {
          rows: rowModel.rows,
          columns,
          itemDescriptor,
          renderItem,
          actions,
          enableInlineEdit,
          onInlineSave: handleInlineSaveItem,
          selectionStore: enableMultiSelect ? selectionStoreRef.current : void 0,
          enableMultiSelect,
          getRowId
        }
      )
    ] }),
    enableMultiSelect && /* @__PURE__ */ jsxRuntime.jsx(
      MultiSelectBar,
      {
        store: selectionStoreRef.current,
        batchActions,
        onBatchAction: handleBatchAction,
        totalCount: prePagRows.rows.length
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      DataTablePagination,
      {
        table,
        mode: paginationMode
      }
    ),
    enablePresets && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        FilterPresetDialog,
        {
          open: filterDialogOpen,
          onOpenChange: setFilterDialogOpen,
          columns,
          preset: editingFilterPreset,
          onSave: presets.saveFilterPreset
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        ColumnPresetDialog,
        {
          open: columnDialogOpen,
          onOpenChange: setColumnDialogOpen,
          columns,
          preset: editingColumnPreset,
          onSave: presets.saveColumnPreset
        }
      )
    ] })
  ] }) });
}
function DataTableFilter({
  column,
  className
}) {
  const [isOpen, setIsOpen] = React6.useState(false);
  const popoverRef = React6.useRef(null);
  const triggerRef = React6.useRef(null);
  const filterType = column.columnDef.meta?.entityMeta?.filterType ?? "text";
  const isFiltered = column.getIsFiltered();
  React6.useEffect(() => {
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target) && !triggerRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: cn("relative inline-block", className), children: [
    /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        ref: triggerRef,
        type: "button",
        onClick: () => setIsOpen(!isOpen),
        className: cn(
          "inline-flex h-7 items-center rounded-md border px-2 text-xs",
          isFiltered ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:bg-accent"
        ),
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(FilterIcon, { className: "mr-1 h-3 w-3" }),
          "Filter"
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref: popoverRef,
        className: "absolute z-50 mt-1 min-w-[200px] rounded-md border bg-popover p-3 shadow-md",
        children: /* @__PURE__ */ jsxRuntime.jsx(FilterControl, { column, filterType, onClose: () => setIsOpen(false) })
      }
    )
  ] });
}
function FilterControl({
  column,
  filterType,
  onClose: _onClose
}) {
  switch (filterType) {
    case "text":
      return /* @__PURE__ */ jsxRuntime.jsx(TextFilter, { column });
    case "number":
      return /* @__PURE__ */ jsxRuntime.jsx(NumberFilter, { column });
    case "boolean":
      return /* @__PURE__ */ jsxRuntime.jsx(BooleanFilter, { column });
    case "enum":
      return /* @__PURE__ */ jsxRuntime.jsx(EnumFilter, { column });
    case "date":
    case "dateRange":
      return /* @__PURE__ */ jsxRuntime.jsx(DateFilter, { column });
    default:
      return /* @__PURE__ */ jsxRuntime.jsx(TextFilter, { column });
  }
}
function TextFilter({ column }) {
  const id = React6.useId();
  const value = column.getFilterValue() ?? "";
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: id, className: "text-xs font-medium", children: "Contains" }),
    /* @__PURE__ */ jsxRuntime.jsx(
      "input",
      {
        id,
        type: "text",
        value,
        onChange: (e) => column.setFilterValue(e.target.value || void 0),
        placeholder: "Filter...",
        className: "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      }
    ),
    value && /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        type: "button",
        onClick: () => column.setFilterValue(void 0),
        className: "text-xs text-muted-foreground hover:text-foreground",
        children: "Clear"
      }
    )
  ] });
}
function NumberFilter({ column }) {
  const minId = React6.useId();
  const maxId = React6.useId();
  const value = column.getFilterValue() ?? [void 0, void 0];
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-xs font-medium", children: "Range" }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          id: minId,
          type: "number",
          value: value[0] ?? "",
          onChange: (e) => {
            const v = e.target.value === "" ? void 0 : Number(e.target.value);
            column.setFilterValue([v, value[1]]);
          },
          placeholder: "Min",
          className: "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm",
          "aria-label": "Minimum value"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground", children: "\u2013" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          id: maxId,
          type: "number",
          value: value[1] ?? "",
          onChange: (e) => {
            const v = e.target.value === "" ? void 0 : Number(e.target.value);
            column.setFilterValue([value[0], v]);
          },
          placeholder: "Max",
          className: "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm",
          "aria-label": "Maximum value"
        }
      )
    ] })
  ] });
}
function BooleanFilter({ column }) {
  const value = column.getFilterValue();
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-xs font-medium", children: "Value" }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex gap-2", children: [
      { label: "All", val: void 0 },
      { label: "True", val: true },
      { label: "False", val: false }
    ].map(({ label, val }) => /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        type: "button",
        onClick: () => column.setFilterValue(val),
        className: cn(
          "inline-flex h-7 items-center rounded-md border px-3 text-xs font-medium transition-colors",
          value === val ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"
        ),
        children: label
      },
      label
    )) })
  ] });
}
function EnumFilter({ column }) {
  const options = column.columnDef.meta?.entityMeta?.enumOptions ?? [];
  const selected = new Set(
    column.getFilterValue() ?? []
  );
  function toggle(val) {
    const next = new Set(selected);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    column.setFilterValue(next.size > 0 ? Array.from(next) : void 0);
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("fieldset", { className: "space-y-2 border-0 p-0", children: [
    /* @__PURE__ */ jsxRuntime.jsx("legend", { className: "text-xs font-medium", children: "Select values" }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "max-h-[200px] space-y-1 overflow-auto", children: options.map((opt) => /* @__PURE__ */ jsxRuntime.jsxs(
      "label",
      {
        className: "flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent cursor-pointer",
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "input",
            {
              type: "checkbox",
              checked: selected.has(opt.value),
              onChange: () => toggle(opt.value),
              className: "h-4 w-4 rounded border-primary text-primary focus:ring-ring"
            }
          ),
          opt.color && /* @__PURE__ */ jsxRuntime.jsx(
            "span",
            {
              className: "h-2 w-2 rounded-full",
              style: { backgroundColor: opt.color }
            }
          ),
          opt.label
        ]
      },
      opt.value
    )) })
  ] });
}
function DateFilter({ column }) {
  const startId = React6.useId();
  const endId = React6.useId();
  const value = column.getFilterValue() ?? [void 0, void 0];
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-xs font-medium", children: "Date range" }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          id: startId,
          type: "date",
          value: value[0] ?? "",
          onChange: (e) => column.setFilterValue([e.target.value || void 0, value[1]]),
          className: "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm",
          "aria-label": "Start date"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          id: endId,
          type: "date",
          value: value[1] ?? "",
          onChange: (e) => column.setFilterValue([value[0], e.target.value || void 0]),
          className: "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm",
          "aria-label": "End date"
        }
      )
    ] })
  ] });
}
function FilterIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntime.jsx("title", { children: "Filter" }),
    /* @__PURE__ */ jsxRuntime.jsx("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" })
  ] });
}
function selectionColumn2() {
  return {
    id: "_select",
    size: 40,
    enableSorting: false,
    enableFiltering: false,
    enableHiding: false,
    enableResizing: false,
    header: ({ table }) => React6__default.default.createElement("input", {
      type: "checkbox",
      checked: table.getIsAllPageRowsSelected(),
      onChange: table.getToggleAllPageRowsSelectedHandler(),
      className: "h-4 w-4 rounded border-primary text-primary focus:ring-ring"
    }),
    cell: ({ row }) => React6__default.default.createElement("input", {
      type: "checkbox",
      checked: row.getIsSelected(),
      onChange: row.getToggleSelectedHandler(),
      className: "h-4 w-4 rounded border-primary text-primary focus:ring-ring"
    }),
    meta: {
      entityMeta: {
        field: "_select",
        filterType: "none"
      }
    }
  };
}
function textColumn2(options) {
  return {
    id: options.field,
    accessorKey: options.field,
    header: options.header,
    size: options.size ?? 200,
    minSize: options.minSize ?? 80,
    maxSize: options.maxSize,
    enableSorting: options.enableSorting ?? true,
    enableFiltering: options.enableFiltering ?? true,
    enableHiding: options.enableHiding ?? true,
    enableResizing: options.enableResizing ?? true,
    enablePinning: options.enablePinning,
    cell: options.cell,
    meta: {
      entityMeta: {
        field: options.field,
        filterType: "text",
        editable: options.editable
      }
    }
  };
}
function numberColumn2(options) {
  return {
    id: options.field,
    accessorKey: options.field,
    header: options.header,
    size: options.size ?? 120,
    minSize: options.minSize ?? 60,
    maxSize: options.maxSize,
    enableSorting: options.enableSorting ?? true,
    enableFiltering: options.enableFiltering ?? true,
    enableHiding: options.enableHiding ?? true,
    enableResizing: options.enableResizing ?? true,
    enablePinning: options.enablePinning,
    cell: options.cell ?? (({ getValue }) => {
      const val = getValue();
      return val != null ? String(val) : "";
    }),
    meta: {
      entityMeta: {
        field: options.field,
        filterType: "number",
        editable: options.editable
      }
    }
  };
}
function dateColumn2(options) {
  const formatDate = options.format ?? ((d) => d.toLocaleDateString());
  return {
    id: options.field,
    accessorKey: options.field,
    header: options.header,
    size: options.size ?? 150,
    minSize: options.minSize ?? 100,
    maxSize: options.maxSize,
    enableSorting: options.enableSorting ?? true,
    enableFiltering: options.enableFiltering ?? true,
    enableHiding: options.enableHiding ?? true,
    enableResizing: options.enableResizing ?? true,
    enablePinning: options.enablePinning,
    cell: options.cell ?? (({ getValue }) => {
      const val = getValue();
      if (!val) return "";
      const date = val instanceof Date ? val : new Date(val);
      return formatDate(date);
    }),
    meta: {
      entityMeta: {
        field: options.field,
        filterType: "date",
        editable: options.editable
      }
    }
  };
}
function booleanColumn2(options) {
  return {
    id: options.field,
    accessorKey: options.field,
    header: options.header,
    size: options.size ?? 100,
    minSize: options.minSize ?? 60,
    maxSize: options.maxSize,
    enableSorting: options.enableSorting ?? true,
    enableFiltering: options.enableFiltering ?? true,
    enableHiding: options.enableHiding ?? true,
    enableResizing: options.enableResizing ?? true,
    enablePinning: options.enablePinning,
    cell: options.cell ?? (({ getValue }) => {
      const val = getValue();
      return val ? options.trueLabel ?? "Yes" : options.falseLabel ?? "No";
    }),
    meta: {
      entityMeta: {
        field: options.field,
        filterType: "boolean",
        editable: options.editable
      }
    }
  };
}
function enumColumn2(options) {
  return {
    id: options.field,
    accessorKey: options.field,
    header: options.header,
    size: options.size ?? 150,
    minSize: options.minSize ?? 80,
    maxSize: options.maxSize,
    enableSorting: options.enableSorting ?? true,
    enableFiltering: options.enableFiltering ?? true,
    enableHiding: options.enableHiding ?? true,
    enableResizing: options.enableResizing ?? true,
    enablePinning: options.enablePinning,
    cell: options.cell ?? (({ getValue }) => {
      const val = String(getValue() ?? "");
      const opt = options.options.find((o) => o.value === val);
      if (!opt) return val;
      if (opt.badgeClassName) {
        return React6__default.default.createElement(
          "span",
          {
            className: `inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ${opt.badgeClassName}`
          },
          opt.label
        );
      }
      return React6__default.default.createElement(
        "span",
        {
          className: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
          style: opt.color ? { backgroundColor: `${opt.color}26`, color: opt.color } : void 0
        },
        opt.label
      );
    }),
    meta: {
      entityMeta: {
        field: options.field,
        filterType: "enum",
        enumOptions: options.options,
        editable: options.editable
      }
    }
  };
}
function actionsColumn2() {
  return {
    id: "_actions",
    header: "",
    size: 50,
    enableSorting: false,
    enableFiltering: false,
    enableHiding: false,
    enableResizing: false,
    meta: {
      entityMeta: {
        field: "_actions",
        filterType: "none"
      }
    }
  };
}

exports.ActionButtonRow = ActionButtonRow;
exports.ActionDropdown = ActionDropdown;
exports.ColumnPresetDialog = ColumnPresetDialog;
exports.DataTable = DataTable;
exports.DataTableColumnHeader = DataTableColumnHeader;
exports.DataTableFilter = DataTableFilter;
exports.DataTablePagination = DataTablePagination;
exports.DataTableToolbar = DataTableToolbar;
exports.ElectricSQLPresetAdapter = ElectricSQLAdapter;
exports.EmptyState = EmptyState;
exports.EntityDetailSheet = EntityDetailSheet;
exports.EntityFormSheet = EntityFormSheet;
exports.EntityListView = EntityListView;
exports.EntityTable = EntityTable;
exports.FilterPresetDialog = FilterPresetDialog;
exports.GQLClient = GQLClient;
exports.GalleryView = GalleryView;
exports.InlineCellEditor = InlineCellEditor;
exports.InlineItemEditor = InlineItemEditor;
exports.ListView = ListView;
exports.MarkdownFieldEditor = MarkdownFieldEditor;
exports.MarkdownFieldRenderer = MarkdownFieldRenderer;
exports.MemoryAdapter = MemoryAdapter;
exports.MultiSelectBar = MultiSelectBar;
exports.PresetPicker = PresetPicker;
exports.PureInlineCellEditor = InlineCellEditor2;
exports.RealtimeManager = RealtimeManager;
exports.RestApiAdapter = RestApiAdapter;
exports.SelectionContext = SelectionContext;
exports.Sheet = Sheet;
exports.SortHeader = SortHeader;
exports.SupabasePresetAdapter = SupabaseRealtimeAdapter;
exports.Table = Table;
exports.TableBody = TableBody;
exports.TableCaption = TableCaption;
exports.TableCell = TableCell;
exports.TableFooter = TableFooter;
exports.TableHead = TableHead;
exports.TableHeader = TableHeader;
exports.TableRow = TableRow;
exports.TableStorageProvider = TableStorageProvider;
exports.ViewModeSwitcher = ViewModeSwitcher;
exports.ZustandPersistAdapter = ZustandPersistAdapter;
exports.actionsColumn = actionsColumn;
exports.applyView = applyView;
exports.booleanColumn = booleanColumn;
exports.buildEntityFieldsFromSchema = buildEntityFieldsFromSchema;
exports.buildTenantWhere = buildTenantWhere;
exports.cascadeInvalidation = cascadeInvalidation;
exports.checkCompleteness = checkCompleteness;
exports.compareEntities = compareEntities;
exports.configureEngine = configureEngine;
exports.createConvexAdapter = createConvexAdapter;
exports.createElectricAdapter = createElectricAdapter;
exports.createGQLClient = createGQLClient;
exports.createGraphAction = createGraphAction;
exports.createGraphEffect = createGraphEffect;
exports.createGraphQLSubscriptionAdapter = createGraphQLSubscriptionAdapter;
exports.createGraphTool = createGraphTool;
exports.createGraphTransaction = createGraphTransaction;
exports.createPGlitePersistenceAdapter = createPGlitePersistenceAdapter;
exports.createPresetStore = createPresetStore;
exports.createPrismaEntityConfig = createPrismaEntityConfig;
exports.createRow = createRow;
exports.createSchemaGraphTool = createSchemaGraphTool;
exports.createSelectionStore = createSelectionStore;
exports.createSupabaseRealtimeAdapter = createSupabaseRealtimeAdapter;
exports.createTenantScopedElectricAdapter = createTenantScopedElectricAdapter;
exports.createWebSocketAdapter = createWebSocketAdapter;
exports.dateColumn = dateColumn;
exports.dedupe = dedupe;
exports.deleteAction = deleteAction;
exports.editAction = editAction;
exports.enumColumn = enumColumn;
exports.executeGQL = executeGQL;
exports.exportGraphSnapshot = exportGraphSnapshot;
exports.exportGraphSnapshotWithSchemas = exportGraphSnapshotWithSchemas;
exports.fetchEntity = fetchEntity;
exports.fetchList = fetchList;
exports.flattenClauses = flattenClauses;
exports.getCoreRowModel = getCoreRowModel2;
exports.getEntityJsonSchema = getEntityJsonSchema;
exports.getExpandedRowModel = getExpandedRowModel;
exports.getFacetedMinMaxValues = getFacetedMinMaxValues;
exports.getFacetedRowModel = getFacetedRowModel;
exports.getFacetedUniqueValues = getFacetedUniqueValues;
exports.getFilteredRowModel = getFilteredRowModel;
exports.getGroupedRowModel = getGroupedRowModel;
exports.getPaginatedRowModel = getPaginatedRowModel;
exports.getRealtimeManager = getRealtimeManager;
exports.getSchema = getSchema;
exports.getSelectedRowModel = getSelectedRowModel;
exports.getSortedRowModel = getSortedRowModel2;
exports.hasCustomPredicates = hasCustomPredicates;
exports.hydrateGraphFromStorage = hydrateGraphFromStorage;
exports.matchesFilter = matchesFilter;
exports.matchesSearch = matchesSearch;
exports.normalizeGQLResponse = normalizeGQLResponse;
exports.numberColumn = numberColumn;
exports.parseCreateTable = parseCreateTable;
exports.persistGraphToStorage = persistGraphToStorage;
exports.prismaRelationsToSchema = prismaRelationsToSchema;
exports.pureActionsColumn = actionsColumn2;
exports.pureBooleanColumn = booleanColumn2;
exports.pureDateColumn = dateColumn2;
exports.pureEnumColumn = enumColumn2;
exports.pureNumberColumn = numberColumn2;
exports.pureSelectionColumn = selectionColumn2;
exports.pureTextColumn = textColumn2;
exports.queryOnce = queryOnce;
exports.readRelations = readRelations;
exports.registerEntityFromSql = registerEntityFromSql;
exports.registerEntityJsonSchema = registerEntityJsonSchema;
exports.registerRuntimeSchema = registerRuntimeSchema;
exports.registerSchema = registerSchema;
exports.renderMarkdownToHtml = renderMarkdownToHtml;
exports.replayActionWithRetry = replayActionWithRetry;
exports.resetRealtimeManager = resetRealtimeManager;
exports.selectGraph = selectGraph;
exports.selectionColumn = selectionColumn;
exports.serializeKey = serializeKey;
exports.sqlTypeToJsonSchema = sqlTypeToJsonSchema;
exports.startGarbageCollector = startGarbageCollector;
exports.startLocalFirstGraph = startLocalFirstGraph;
exports.stopGarbageCollector = stopGarbageCollector;
exports.textColumn = textColumn;
exports.toGraphQLVariables = toGraphQLVariables;
exports.toPrismaInclude = toPrismaInclude;
exports.toPrismaOrderBy = toPrismaOrderBy;
exports.toPrismaWhere = toPrismaWhere;
exports.toRestParams = toRestParams;
exports.toSQLClauses = toSQLClauses;
exports.useEntity = useEntity;
exports.useEntityAugment = useEntityAugment;
exports.useEntityCRUD = useEntityCRUD;
exports.useEntityList = useEntityList;
exports.useEntityListAsTable = useEntityListAsTable;
exports.useEntityMutation = useEntityMutation;
exports.useEntityView = useEntityView;
exports.useGQLEntity = useGQLEntity;
exports.useGQLList = useGQLList;
exports.useGQLMutation = useGQLMutation;
exports.useGQLSubscription = useGQLSubscription;
exports.useGraphDevTools = useGraphDevTools;
exports.useGraphStore = useGraphStore;
exports.useGraphSyncStatus = useGraphSyncStatus;
exports.useLocalFirst = useLocalFirst;
exports.usePGliteQuery = usePGliteQuery;
exports.useSchemaEntityFields = useSchemaEntityFields;
exports.useSelectionContext = useSelectionContext;
exports.useSelectionStore = useSelectionStore;
exports.useSuspenseEntity = useSuspenseEntity;
exports.useSuspenseEntityList = useSuspenseEntityList;
exports.useTable = useTable;
exports.useTablePresets = useTablePresets;
exports.useTableRealtimeMode = useTableRealtimeMode;
exports.useTableStorageAdapter = useTableStorageAdapter;
exports.viewAction = viewAction;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map