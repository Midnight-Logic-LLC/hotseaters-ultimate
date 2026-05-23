import * as zustand from 'zustand';
import { StoreApi } from 'zustand';
import * as react_jsx_runtime from 'react/jsx-runtime';
import React$1, { ReactNode } from 'react';
import { ColumnDef as ColumnDef$1 } from '@tanstack/react-table';
import { PersistStorage } from 'zustand/middleware';

/** Logical entity kind (e.g. `"Post"`). Used to partition the normalized graph. */
type EntityType = string;
/** Primary key for an entity within its `type`. Lists and relations reference this, not row copies. */
type EntityId = string;
/** Stable string key for a list query (often `JSON.stringify`-shaped). Lists store IDs only under this key. */
type QueryKey = string;
/** Provenance of the latest known entity state. */
type SyncOrigin = "server" | "client" | "optimistic";
/** Optional sync-facing metadata kept outside canonical entity payloads. */
interface EntitySyncMetadata {
    synced: boolean;
    origin: SyncOrigin;
    updatedAt: number | null;
}
/** Snapshot shape returned by sync-aware reads and graph-native query helpers. */
type EntitySnapshot<T extends object> = T & {
    $synced: boolean;
    $origin: SyncOrigin;
    $updatedAt: number | null;
};
/**
 * Fetch/cache metadata for a single entity instance (`type:id`).
 * Separates transport concerns from canonical `entities` data so hooks can show spinners and stale-while-revalidate without mutating server-shaped fields.
 */
interface EntityState {
    isFetching: boolean;
    lastFetched: number | null;
    error: string | null;
    stale: boolean;
}
/**
 * Ordered **IDs** for a list query plus pagination metadata — never embedded entity payloads.
 * Cross-view reactivity depends on this: when `entities[type][id]` updates, every list containing that id re-resolves rows from the graph.
 */
interface ListState {
    ids: EntityId[];
    total: number | null;
    nextCursor: string | null;
    prevCursor: string | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    isFetching: boolean;
    isFetchingMore: boolean;
    error: string | null;
    lastFetched: number | null;
    stale: boolean;
    currentPage: number | null;
    pageSize: number | null;
}
/**
 * Canonical Zustand store: **entities** (server truth), **patches** (UI-only overlay), **lists** (id order + list meta), and **entityStates** (per-entity fetch state).
 * Prefer hooks for React reads; use `useGraphStore.getState()` inside stores/adapters/engine code where React is not available.
 */
interface GraphState {
    /** Normalized server-confirmed records. Mutate only via upsert/replace/remove — not from components. */
    entities: Record<EntityType, Record<EntityId, Record<string, unknown>>>;
    /** Local-only fields merged at read time (`readEntity` / hooks). Never send patches to the server. */
    patches: Record<EntityType, Record<EntityId, Record<string, unknown>>>;
    /** Per-entity fetch lifecycle keyed as `${type}:${id}`. */
    entityStates: Record<string, EntityState>;
    /** Optional sync/provenance state layered beside the canonical entity payload. */
    syncMetadata: Record<string, EntitySyncMetadata>;
    /** List slots keyed by serialized query keys. Values hold id arrays and pagination — not entity clones. */
    lists: Record<QueryKey, ListState>;
    /**
     * Shallow-merge `data` into the canonical entity. Use when the API returns partial updates or normalized fragments.
     * @param type - Entity kind
     * @param id - Entity id
     * @param data - Fields to merge into existing canonical data
     */
    upsertEntity: (type: EntityType, id: EntityId, data: Record<string, unknown>) => void;
    /**
     * Batch upsert for list endpoints — avoids N separate writes when hydrating many rows at once.
     * @param type - Entity kind
     * @param entries - Pairs of id + partial/full payloads to merge
     */
    upsertEntities: (type: EntityType, entries: Array<{
        id: EntityId;
        data: Record<string, unknown>;
    }>) => void;
    /**
     * Replace the canonical entity entirely (no merge). Use when the server returns a full snapshot and partial merge would leave stale keys behind.
     */
    replaceEntity: (type: EntityType, id: EntityId, data: Record<string, unknown>) => void;
    /** Remove canonical entity, its patches, and its entityState. Does not remove the id from lists — use `removeIdFromAllLists` if needed. */
    removeEntity: (type: EntityType, id: EntityId) => void;
    /**
     * Merge UI-only fields into `patches` so every subscriber sees selection, expansion, optimistic toggles, etc., without forking canonical data.
     */
    patchEntity: (type: EntityType, id: EntityId, patch: Record<string, unknown>) => void;
    /** Remove specific patch keys; other patch keys remain. */
    unpatchEntity: (type: EntityType, id: EntityId, keys: string[]) => void;
    /** Drop all patches for an entity (e.g. after successful mutation when server data is authoritative). */
    clearPatch: (type: EntityType, id: EntityId) => void;
    /** Reflect in-flight GET for a single entity (deduped fetches in the engine still flip this once per logical request). */
    setEntityFetching: (type: EntityType, id: EntityId, fetching: boolean) => void;
    /** Persist terminal fetch failure message and clear fetching — hooks surface `error` while leaving prior data if any. */
    setEntityError: (type: EntityType, id: EntityId, error: string | null) => void;
    /** Mark entity successfully loaded; clears error, fetching, stale, and updates `lastFetched`. */
    setEntityFetched: (type: EntityType, id: EntityId) => void;
    /** Drive background revalidation: when true, hooks refetch while still showing cached `readEntity` data. */
    setEntityStale: (type: EntityType, id: EntityId, stale: boolean) => void;
    /** Merge sync metadata for one entity without polluting canonical server fields. */
    setEntitySyncMetadata: (type: EntityType, id: EntityId, metadata: Partial<EntitySyncMetadata>) => void;
    /** Clear sync metadata for one entity. */
    clearEntitySyncMetadata: (type: EntityType, id: EntityId) => void;
    /**
     * Replace list ids and merge pagination meta after a primary list fetch (not load-more).
     * Resets fetching flags and clears list error on success path (engine calls this after normalize).
     */
    setListResult: (key: QueryKey, ids: EntityId[], meta: Partial<Omit<ListState, "ids" | "isFetching" | "isFetchingMore" | "error" | "stale">>) => void;
    /** Append unique ids (e.g. infinite scroll) while merging meta; dedupes id order. */
    appendListResult: (key: QueryKey, ids: EntityId[], meta: Partial<Omit<ListState, "ids" | "isFetching" | "isFetchingMore" | "error" | "stale">>) => void;
    /** Prepend ids (e.g. “new item at top”) with optional meta merge. */
    prependListResult: (key: QueryKey, ids: EntityId[], meta?: Partial<ListState>) => void;
    /** After deletes, keep every list consistent by removing an id everywhere it appears and decrementing `total` when tracked. */
    removeIdFromAllLists: (type: EntityType, id: EntityId) => void;
    /**
     * Insert or move an id in one list. If the id already exists, it is removed first then re-inserted at `position`.
     * @param position - `"start"`, `"end"`, or numeric index
     */
    insertIdInList: (key: QueryKey, id: EntityId, position: "start" | "end" | number) => void;
    /** Initial or full list fetch in progress (not page-2+). */
    setListFetching: (key: QueryKey, fetching: boolean) => void;
    /** Pagination / “load more” in progress for the same list key. */
    setListFetchingMore: (key: QueryKey, fetchingMore: boolean) => void;
    /** Record list fetch failure; clears both fetching flags. */
    setListError: (key: QueryKey, error: string | null) => void;
    /** Mark a list query stale so hooks can refetch without discarding current ids (stale-while-revalidate). */
    setListStale: (key: QueryKey, stale: boolean) => void;
    /**
     * Mark one or all entities of a type stale for subscriber-driven refetch. Does not delete data.
     * @param id - Omit to stale every entity of `type`
     */
    invalidateEntity: (type: EntityType, id?: EntityId) => void;
    /**
     * Mark lists stale by key prefix or custom predicate so the next access triggers background refresh without dropping ids immediately.
     */
    invalidateLists: (matcher: string | ((key: QueryKey) => boolean)) => void;
    /** Convenience: stale all entities of a type and lists whose keys start with `type`. */
    invalidateType: (type: EntityType) => void;
    /**
     * Single read path: `{ ...entities[type][id], ...patches[type][id] }` or null if no canonical row exists.
     * @returns Merged view suitable for rendering; not a deep clone
     */
    readEntity: <T = Record<string, unknown>>(type: EntityType, id: EntityId) => T | null;
    /**
     * Sync-aware read path: canonical entity + patches + virtual sync metadata (`$synced`, `$origin`, `$updatedAt`).
     */
    readEntitySnapshot: <T = Record<string, unknown>>(type: EntityType, id: EntityId) => EntitySnapshot<T & Record<string, unknown>> | null;
}
/**
 * Global entity graph store (Zustand + Immer). **Components should not subscribe directly** — use hooks so layering stays `Component → hook → store`.
 * `getState()` is intended for non-React code paths (engine, adapters, mutations) that must write or read the graph synchronously.
 */
declare const useGraphStore: zustand.UseBoundStore<Omit<Omit<zustand.StoreApi<GraphState>, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: GraphState, previousSelectedState: GraphState) => void): () => void;
        <U>(selector: (state: GraphState) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: ((a: U, b: U) => boolean) | undefined;
            fireImmediately?: boolean;
        } | undefined): () => void;
    };
}, "setState"> & {
    setState(nextStateOrUpdater: GraphState | Partial<GraphState> | ((state: {
        entities: {
            [x: string]: {
                [x: string]: {
                    [x: string]: unknown;
                };
            };
        };
        patches: {
            [x: string]: {
                [x: string]: {
                    [x: string]: unknown;
                };
            };
        };
        entityStates: {
            [x: string]: {
                isFetching: boolean;
                lastFetched: number | null;
                error: string | null;
                stale: boolean;
            };
        };
        syncMetadata: {
            [x: string]: {
                synced: boolean;
                origin: SyncOrigin;
                updatedAt: number | null;
            };
        };
        lists: {
            [x: string]: {
                ids: string[];
                total: number | null;
                nextCursor: string | null;
                prevCursor: string | null;
                hasNextPage: boolean;
                hasPrevPage: boolean;
                isFetching: boolean;
                isFetchingMore: boolean;
                error: string | null;
                lastFetched: number | null;
                stale: boolean;
                currentPage: number | null;
                pageSize: number | null;
            };
        };
        upsertEntity: (type: EntityType, id: EntityId, data: Record<string, unknown>) => void;
        upsertEntities: (type: EntityType, entries: Array<{
            id: EntityId;
            data: Record<string, unknown>;
        }>) => void;
        replaceEntity: (type: EntityType, id: EntityId, data: Record<string, unknown>) => void;
        removeEntity: (type: EntityType, id: EntityId) => void;
        patchEntity: (type: EntityType, id: EntityId, patch: Record<string, unknown>) => void;
        unpatchEntity: (type: EntityType, id: EntityId, keys: string[]) => void;
        clearPatch: (type: EntityType, id: EntityId) => void;
        setEntityFetching: (type: EntityType, id: EntityId, fetching: boolean) => void;
        setEntityError: (type: EntityType, id: EntityId, error: string | null) => void;
        setEntityFetched: (type: EntityType, id: EntityId) => void;
        setEntityStale: (type: EntityType, id: EntityId, stale: boolean) => void;
        setEntitySyncMetadata: (type: EntityType, id: EntityId, metadata: Partial<EntitySyncMetadata>) => void;
        clearEntitySyncMetadata: (type: EntityType, id: EntityId) => void;
        setListResult: (key: QueryKey, ids: EntityId[], meta: Partial<Omit<ListState, "ids" | "isFetching" | "isFetchingMore" | "error" | "stale">>) => void;
        appendListResult: (key: QueryKey, ids: EntityId[], meta: Partial<Omit<ListState, "ids" | "isFetching" | "isFetchingMore" | "error" | "stale">>) => void;
        prependListResult: (key: QueryKey, ids: EntityId[], meta?: Partial<ListState>) => void;
        removeIdFromAllLists: (type: EntityType, id: EntityId) => void;
        insertIdInList: (key: QueryKey, id: EntityId, position: "start" | "end" | number) => void;
        setListFetching: (key: QueryKey, fetching: boolean) => void;
        setListFetchingMore: (key: QueryKey, fetchingMore: boolean) => void;
        setListError: (key: QueryKey, error: string | null) => void;
        setListStale: (key: QueryKey, stale: boolean) => void;
        invalidateEntity: (type: EntityType, id?: EntityId) => void;
        invalidateLists: (matcher: string | ((key: QueryKey) => boolean)) => void;
        invalidateType: (type: EntityType) => void;
        readEntity: <T = Record<string, unknown>>(type: EntityType, id: EntityId) => T | null;
        readEntitySnapshot: <T = Record<string, unknown>>(type: EntityType, id: EntityId) => EntitySnapshot<T & Record<string, unknown>> | null;
    }) => void), shouldReplace?: false): void;
    setState(nextStateOrUpdater: GraphState | ((state: {
        entities: {
            [x: string]: {
                [x: string]: {
                    [x: string]: unknown;
                };
            };
        };
        patches: {
            [x: string]: {
                [x: string]: {
                    [x: string]: unknown;
                };
            };
        };
        entityStates: {
            [x: string]: {
                isFetching: boolean;
                lastFetched: number | null;
                error: string | null;
                stale: boolean;
            };
        };
        syncMetadata: {
            [x: string]: {
                synced: boolean;
                origin: SyncOrigin;
                updatedAt: number | null;
            };
        };
        lists: {
            [x: string]: {
                ids: string[];
                total: number | null;
                nextCursor: string | null;
                prevCursor: string | null;
                hasNextPage: boolean;
                hasPrevPage: boolean;
                isFetching: boolean;
                isFetchingMore: boolean;
                error: string | null;
                lastFetched: number | null;
                stale: boolean;
                currentPage: number | null;
                pageSize: number | null;
            };
        };
        upsertEntity: (type: EntityType, id: EntityId, data: Record<string, unknown>) => void;
        upsertEntities: (type: EntityType, entries: Array<{
            id: EntityId;
            data: Record<string, unknown>;
        }>) => void;
        replaceEntity: (type: EntityType, id: EntityId, data: Record<string, unknown>) => void;
        removeEntity: (type: EntityType, id: EntityId) => void;
        patchEntity: (type: EntityType, id: EntityId, patch: Record<string, unknown>) => void;
        unpatchEntity: (type: EntityType, id: EntityId, keys: string[]) => void;
        clearPatch: (type: EntityType, id: EntityId) => void;
        setEntityFetching: (type: EntityType, id: EntityId, fetching: boolean) => void;
        setEntityError: (type: EntityType, id: EntityId, error: string | null) => void;
        setEntityFetched: (type: EntityType, id: EntityId) => void;
        setEntityStale: (type: EntityType, id: EntityId, stale: boolean) => void;
        setEntitySyncMetadata: (type: EntityType, id: EntityId, metadata: Partial<EntitySyncMetadata>) => void;
        clearEntitySyncMetadata: (type: EntityType, id: EntityId) => void;
        setListResult: (key: QueryKey, ids: EntityId[], meta: Partial<Omit<ListState, "ids" | "isFetching" | "isFetchingMore" | "error" | "stale">>) => void;
        appendListResult: (key: QueryKey, ids: EntityId[], meta: Partial<Omit<ListState, "ids" | "isFetching" | "isFetchingMore" | "error" | "stale">>) => void;
        prependListResult: (key: QueryKey, ids: EntityId[], meta?: Partial<ListState>) => void;
        removeIdFromAllLists: (type: EntityType, id: EntityId) => void;
        insertIdInList: (key: QueryKey, id: EntityId, position: "start" | "end" | number) => void;
        setListFetching: (key: QueryKey, fetching: boolean) => void;
        setListFetchingMore: (key: QueryKey, fetchingMore: boolean) => void;
        setListError: (key: QueryKey, error: string | null) => void;
        setListStale: (key: QueryKey, stale: boolean) => void;
        invalidateEntity: (type: EntityType, id?: EntityId) => void;
        invalidateLists: (matcher: string | ((key: QueryKey) => boolean)) => void;
        invalidateType: (type: EntityType) => void;
        readEntity: <T = Record<string, unknown>>(type: EntityType, id: EntityId) => T | null;
        readEntitySnapshot: <T = Record<string, unknown>>(type: EntityType, id: EntityId) => EntitySnapshot<T & Record<string, unknown>> | null;
    }) => void), shouldReplace: true): void;
}>;

type GraphStore = ReturnType<typeof useGraphStore.getState>;
type GraphIncludeMap = Record<string, GraphIncludeRelation>;
type GraphIncludeRelation = {
    type: EntityType;
    via: {
        kind: "field";
        field: string;
    };
    include?: GraphIncludeMap;
} | {
    type: EntityType;
    via: {
        kind: "array";
        field: string;
    };
    include?: GraphIncludeMap;
} | {
    type: EntityType;
    via: {
        kind: "list";
        key: QueryKey | ((entity: Record<string, unknown>) => QueryKey | null | undefined);
    };
    include?: GraphIncludeMap;
} | {
    type: EntityType;
    via: {
        kind: "resolver";
        resolve: (entity: Record<string, unknown>, store: GraphStore) => EntityId | EntityId[] | null | undefined;
    };
    include?: GraphIncludeMap;
};
interface GraphQueryOptions<TEntity extends object> {
    type: EntityType;
    id?: EntityId;
    ids?: EntityId[];
    listKey?: QueryKey;
    where?: (entity: EntitySnapshot<TEntity>) => boolean;
    sort?: (a: EntitySnapshot<TEntity>, b: EntitySnapshot<TEntity>) => number;
    include?: GraphIncludeMap;
    select?: ((entity: Record<string, unknown>) => unknown) | string[];
}
type ProjectedRow = Record<string, unknown>;
declare function queryOnce<TEntity extends object>(opts: GraphQueryOptions<TEntity> & {
    id: EntityId;
}): ProjectedRow | null;
declare function queryOnce<TEntity extends object>(opts: GraphQueryOptions<TEntity>): ProjectedRow[];
declare const selectGraph: typeof queryOnce;

interface GraphDataSnapshot {
    entities: ReturnType<typeof useGraphStore.getState>["entities"];
    patches: ReturnType<typeof useGraphStore.getState>["patches"];
    entityStates: ReturnType<typeof useGraphStore.getState>["entityStates"];
    syncMetadata: ReturnType<typeof useGraphStore.getState>["syncMetadata"];
    lists: ReturnType<typeof useGraphStore.getState>["lists"];
}
interface GraphTransaction {
    upsertEntity: (type: EntityType, id: EntityId, data: Record<string, unknown>) => GraphTransaction;
    replaceEntity: (type: EntityType, id: EntityId, data: Record<string, unknown>) => GraphTransaction;
    removeEntity: (type: EntityType, id: EntityId) => GraphTransaction;
    patchEntity: (type: EntityType, id: EntityId, patch: Record<string, unknown>) => GraphTransaction;
    clearPatch: (type: EntityType, id: EntityId) => GraphTransaction;
    insertIdInList: (key: QueryKey, id: EntityId, position: "start" | "end" | number) => GraphTransaction;
    removeIdFromAllLists: (type: EntityType, id: EntityId) => GraphTransaction;
    setEntitySyncMetadata: (type: EntityType, id: EntityId, metadata: Partial<EntitySyncMetadata>) => GraphTransaction;
    markEntityPending: (type: EntityType, id: EntityId, origin?: SyncOrigin) => GraphTransaction;
    markEntitySynced: (type: EntityType, id: EntityId, origin?: SyncOrigin) => GraphTransaction;
    commit: () => void;
    rollback: () => void;
    snapshot: () => GraphDataSnapshot;
}
interface GraphActionOptions<TInput, TResult> {
    key?: string;
    optimistic?: (tx: GraphTransaction, input: TInput) => void;
    run: (tx: GraphTransaction, input: TInput) => Promise<TResult> | TResult;
    onSuccess?: (result: TResult, input: TInput, tx: GraphTransaction) => void;
    onError?: (error: Error, input: TInput) => void;
}
interface GraphActionRecord$1 {
    id: string;
    key: string;
    input: unknown;
    enqueuedAt: string;
}
type GraphActionEvent = {
    type: "enqueued";
    record: GraphActionRecord$1;
} | {
    type: "settled";
    record: GraphActionRecord$1;
};
declare function createGraphTransaction(): GraphTransaction;
declare function createGraphAction<TInput, TResult>(opts: GraphActionOptions<TInput, TResult>): (input: TInput) => Promise<TResult>;

interface GraphEffectEvent<T> {
    key: string;
    value: T;
    previousValue: T;
}
interface GraphEffectOptions<T> {
    query: () => T[] | T | null;
    getKey?: (value: T, index: number) => string;
    skipInitial?: boolean;
    isEqual?: (previousValue: T, nextValue: T) => boolean;
    onEnter?: (event: {
        key: string;
        value: T;
    }) => void;
    onUpdate?: (event: GraphEffectEvent<T>) => void;
    onExit?: (event: {
        key: string;
        previousValue: T;
    }) => void;
}
interface GraphEffectHandle {
    dispose: () => void;
}
declare function createGraphEffect<T>(opts: GraphEffectOptions<T>): GraphEffectHandle;

/**
 * Compiles a {@link FilterSpec} into a Prisma `where` object (plain JSON-serializable shape).
 *
 * Operator mapping matches common Prisma filter APIs: `eq` → `equals`, string ops use `mode: "insensitive"`,
 * `nin` → `notIn`, `arrayContains` → `has`, `isNull` uses `null` / `{ not: null }` per `value`, and `isNotNull` → `{ not: null }`.
 * Unsupported ops (`between`, `arrayOverlaps`, `matches`, `custom`) are omitted from the result.
 *
 * Top-level clause arrays are combined with `AND`. {@link FilterGroup} uses `AND` / `OR` to match `group.logic`.
 */
declare function toPrismaWhere(filter: FilterSpec): Record<string, unknown>;
/**
 * Compiles a {@link SortSpec} into Prisma `orderBy` form: `[{ fieldName: "asc" | "desc" }, …]`.
 * `nulls` and `comparator` on {@link SortClause} are ignored (local-only); extend callers if your Prisma version supports null ordering.
 */
declare function toPrismaOrderBy(sort: SortSpec): Record<string, string>[];

/**
 * Transport-agnostic comparison operators. Same spec can compile to REST, SQL, GraphQL, or local JS (`evaluator`).
 * `custom` opts out of automatic serialization — use for predicates only the client can evaluate.
 */
type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains" | "startsWith" | "endsWith" | "isNull" | "isNotNull" | "between" | "arrayContains" | "arrayOverlaps" | "matches" | "custom";
/** Atomic filter: field path, operator, optional value, and optional JS predicate for `custom`. */
interface FilterClause {
    field: string;
    op: FilterOperator;
    value?: unknown;
    predicate?: (fieldValue: unknown, entity: Record<string, unknown>) => boolean;
}
type FilterLogic = "and" | "or";
/** Nested boolean group so you can express `(A AND B) OR C` without losing structure when compiling to backends. */
interface FilterGroup {
    logic: FilterLogic;
    clauses: Array<FilterClause | FilterGroup>;
}
/** Top-level filter: flat AND list of clauses, or a recursive `FilterGroup`. */
type FilterSpec = FilterGroup | FilterClause[];
type SortDirection = "asc" | "desc";
/** Single sort key with optional null ordering and custom comparator for local sort parity with remote semantics. */
interface SortClause {
    field: string;
    direction: SortDirection;
    nulls?: "first" | "last";
    comparator?: (a: unknown, b: unknown) => number;
}
/** Ordered multi-key sort (stable application in `compareEntities`). */
type SortSpec = SortClause[];
/**
 * Everything `useEntityView` needs to describe a virtualized collection: filters, sorts, and simple multi-field search.
 * One descriptor can drive local evaluation, remote query compilation, or hybrid mode.
 */
interface ViewDescriptor {
    filter?: FilterSpec;
    sort?: SortSpec;
    search?: {
        query: string;
        fields: string[];
        minChars?: number;
    };
}
/**
 * How complete local graph data is relative to the view: **local** (all in memory), **remote** (server must filter/sort), **hybrid** (show local fast + remote reconcile).
 */
type CompletenessMode = "local" | "remote" | "hybrid";
/**
 * Compile a view to flat REST query params (`sort`, `q`, and `field[op]=value` keys). Skips `custom` clauses — those cannot be expressed as strings.
 */
declare function toRestParams(view: ViewDescriptor): Record<string, string>;
/**
 * Compile a view to parameterized SQL fragments for server-side filtering/sorting. Unknown ops become `TRUE` — validate or restrict ops at the edge.
 */
declare function toSQLClauses(view: ViewDescriptor): {
    where: string;
    orderBy: string;
    params: unknown[];
};
/**
 * Produce a GraphQL-variable-shaped object from a view (Hasura/Postgraphile-style `_op` maps). Intended as a starting point — wire to your actual schema.
 */
declare function toGraphQLVariables(view: ViewDescriptor): {
    where?: Record<string, unknown>;
    orderBy?: Array<Record<string, unknown>>;
    search?: string;
};

/**
 * Normalize nested `FilterGroup` trees to a flat clause list for compilers that only understand atomic predicates.
 */
declare function flattenClauses(filter: FilterSpec): FilterClause[];
/** True if any clause requires client-side `predicate` logic — forces local/hybrid evaluation paths that cannot be pushed to generic REST/SQL. */
declare function hasCustomPredicates(filter: FilterSpec): boolean;

/**
 * Process-wide defaults for stale times, retries, and background revalidation.
 * Keeps hook signatures small: `useEntity` / `useEntityList` merge these with per-query overrides.
 */
interface EngineOptions {
    defaultStaleTime?: number;
    /** Max age (`Date.now() - lastFetched`) for evicting entities with zero subscribers during GC. */
    defaultGcTime?: number;
    /** Interval between GC passes when the collector is active (default 60s). */
    gcInterval?: number;
    maxRetries?: number;
    retryBaseDelay?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
}
/**
 * Declarative **instruction** for loading one entity: wire transport (`fetch`), normalization, and graph writes.
 * Hooks pass this to `fetchEntity`; the graph remains source of truth after success.
 */
interface EntityQueryOptions<TRaw, TEntity extends object> {
    type: EntityType;
    id: EntityId | null | undefined;
    fetch: (id: EntityId) => Promise<TRaw>;
    normalize: (raw: TRaw) => TEntity;
    idField?: string;
    sideEffects?: (raw: TRaw, store: typeof useGraphStore) => void;
    staleTime?: number;
    enabled?: boolean;
    onSuccess?: (entity: TEntity) => void;
    onError?: (error: Error) => void;
}
/** Cursor/page knobs passed through to list `fetch` implementations (REST, GraphQL, etc.). */
interface ListFetchParams {
    cursor?: string;
    page?: number;
    pageSize?: number;
    params?: Record<string, unknown>;
}
/**
 * Normalized list page shape from any backend. Items are mapped through `normalize` into `{ id, data }` upserts — the list stores ids only.
 */
interface ListResponse<T> {
    items: T[];
    total?: number | null;
    nextCursor?: string | null;
    prevCursor?: string;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    page?: number;
    pageSize?: number;
}
/**
 * Declarative **instruction** for a collection query: stable `queryKey`, fetcher, and per-row normalization into the graph.
 * `mode` controls whether a fetch replaces ids or appends (infinite scroll) when used with load-more.
 */
interface ListQueryOptions<TRaw, TEntity extends object> {
    type: EntityType;
    queryKey: unknown[];
    fetch: (params: ListFetchParams) => Promise<ListResponse<TRaw>>;
    normalize: (raw: TRaw) => {
        id: EntityId;
        data: TEntity;
    };
    sideEffects?: (items: TRaw[], store: typeof useGraphStore) => void;
    mode?: "replace" | "append";
    staleTime?: number;
    enabled?: boolean;
    onSuccess?: (result: ListResponse<TRaw>) => void;
    onError?: (error: Error) => void;
}
/**
 * Deterministic string key for list queries so object order in nested keys does not create duplicate cache entries.
 * @param key - Hook-provided query key array (serializable values)
 */
declare function serializeKey(key: unknown[]): string;
/**
 * Collapse concurrent identical requests into one Promise (prevents stampedes when many components mount the same entity/list).
 * @param key - Logical dedupe key (e.g. `type:id` or serialized list key)
 * @param fn - Async work that performs the fetch + graph writes
 */
declare function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T>;
/**
 * Stops the periodic garbage-collection timer started by `startGarbageCollector` / `configureEngine`.
 */
declare function stopGarbageCollector(): void;
/**
 * Starts periodic garbage collection using current `getEngineOptions().gcInterval`.
 * Stops any previous interval first. No-ops during SSR (`window` is undefined) or without `setInterval`.
 * @returns Disposer that stops this collector (equivalent to `stopGarbageCollector`).
 */
declare function startGarbageCollector(): () => void;
/** Override global engine behavior (typically once at app bootstrap). Restarts GC with merged options. */
declare function configureEngine(opts: EngineOptions): void;
/**
 * Run a single-entity fetch with dedupe, retries, normalization, and graph updates.
 * Call from hooks/adapters — not from presentational components.
 */
declare function fetchEntity<TRaw, TEntity extends object>(opts: EntityQueryOptions<TRaw, TEntity>, engineOpts: Required<EngineOptions>): Promise<void>;
/**
 * Fetch a list page: upserts all rows, writes ids to the list key, supports append mode for pagination.
 * @param isLoadMore - When true, uses a separate dedupe key and `appendListResult` / `setListFetchingMore`.
 */
declare function fetchList<TRaw, TEntity extends object>(opts: ListQueryOptions<TRaw, TEntity>, params: ListFetchParams, engineOpts: Required<EngineOptions>, isLoadMore?: boolean): Promise<void>;

/**
 * Precompiled transport payloads for one view snapshot — pass to REST, GraphQL, or SQL backends without re-deriving from `ViewDescriptor`.
 */
interface ViewFetchParams {
    rest: Record<string, string>;
    graphql: ReturnType<typeof toGraphQLVariables>;
    sql: ReturnType<typeof toSQLClauses>;
    view: ViewDescriptor;
}
/**
 * Configure a **live view** over a base list: filter/sort/search in JS when data is complete, or compile the same spec to remote params when not.
 * `baseQueryKey` identifies the underlying id list in the graph; the hook may create additional keys for remote result sets.
 */
interface UseEntityViewOptions<TEntity extends object> {
    type: EntityType;
    baseQueryKey: unknown[];
    view: ViewDescriptor;
    mode?: CompletenessMode;
    remoteFetch?: (params: ViewFetchParams) => Promise<ListResponse<TEntity>>;
    normalize?: (raw: TEntity) => {
        id: EntityId;
        data: TEntity;
    };
    remoteDebounce?: number;
    staleTime?: number;
    enabled?: boolean;
    /** SSR-seeded ids written once into `lists[baseKey]` to avoid empty-state flash before hydration fetch. */
    initialIds?: EntityId[];
    /** SSR-seeded total for completeness heuristics when ids are preloaded. */
    initialTotal?: number;
}
/**
 * Rich list UI state: projected `items`/`viewIds`, completeness mode, remote vs local fetching flags, and imperative view updaters.
 * `isShowingLocalPending` signals hybrid mode where stale local rows are visible while a remote round-trip runs.
 */
interface UseEntityViewResult<TEntity> {
    items: TEntity[];
    viewIds: EntityId[];
    viewTotal: number | null;
    isLoading: boolean;
    isFetching: boolean;
    isRemoteFetching: boolean;
    isShowingLocalPending: boolean;
    error: string | null;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    isLocallyComplete: boolean;
    completenessMode: CompletenessMode;
    setView: (v: Partial<ViewDescriptor>) => void;
    setFilter: (f: FilterSpec | null) => void;
    setSort: (s: SortSpec | null) => void;
    setSearch: (q: string) => void;
    clearView: () => void;
    refetch: () => void;
    isFetchingMore: boolean;
}
/**
 * Higher-level list hook: combines **graph-backed id lists**, declarative `ViewDescriptor`, local `applyView`, optional remote fetch, and realtime sorted insertion.
 * Solves “filters tied to one query cache” by deriving the visible id order from the shared graph whenever possible.
 *
 * @param opts - Base type/key, initial view, optional `remoteFetch` + `normalize`, SSR seeds, forced `mode`
 * @returns Projected entities, view metadata, completeness, and setters for interactive toolbars
 *
 * @example
 * ```tsx
 * const view = useEntityView({
 *   type: "Task",
 *   baseQueryKey: ["tasks", projectId],
 *   view: { filter: [{ field: "status", op: "eq", value: "open" }], sort: [{ field: "dueAt", direction: "asc" }] },
 *   remoteFetch: (p) => api.tasksQuery(p.rest),
 *   normalize: (raw) => ({ id: raw.id, data: raw }),
 * });
 * ```
 */
declare function useEntityView<TEntity extends object>(opts: UseEntityViewOptions<TEntity>): UseEntityViewResult<TEntity>;

/** UI mode for a single CRUD surface: drives which panels/forms are active without scattering boolean flags. */
type CRUDMode = "list" | "detail" | "edit" | "create";
/**
 * Wire one entity type into list+detail+forms: remote list via `useEntityView`, optional detail fetch, and create/update/delete callbacks.
 * Mutations call `cascadeInvalidation` on success so related lists/entities refresh per registered schemas.
 */
interface CRUDOptions<TEntity extends object> {
    type: EntityType;
    listQueryKey: unknown[];
    listFetch: (params: ViewFetchParams) => Promise<ListResponse<TEntity>>;
    normalize: (raw: TEntity) => {
        id: EntityId;
        data: TEntity;
    };
    detailFetch?: (id: EntityId) => Promise<TEntity>;
    onCreate?: (data: Partial<TEntity>) => Promise<TEntity>;
    onUpdate?: (id: EntityId, patch: Partial<TEntity>) => Promise<TEntity>;
    onDelete?: (id: EntityId) => Promise<void>;
    createDefaults?: Partial<TEntity>;
    initialView?: ViewDescriptor;
    onCreateSuccess?: (entity: TEntity) => void;
    onUpdateSuccess?: (entity: TEntity) => void;
    onDeleteSuccess?: (id: EntityId) => void;
    onError?: (op: "create" | "update" | "delete", error: Error) => void;
    selectAfterCreate?: boolean;
    clearSelectionAfterDelete?: boolean;
}
/** Public field input for CRUD setters: supports classic `keyof T` calls and dotted nested paths for JSON-backed forms. */
type EntityFieldPath<TEntity extends object> = keyof TEntity | string;
/** Tracks which fields diverge from loaded detail — edit buffer stays in React state so other views keep showing canonical graph data until save. */
interface DirtyFields<TEntity extends object> {
    changed: ReadonlySet<EntityFieldPath<TEntity>>;
    isDirty: boolean;
}
/**
 * Everything a CRUD screen needs: composed `list` view, selection, detail subscription, relation joins, edit/create buffers, and mutating actions.
 * `applyOptimistic` is the escape hatch to mirror the buffer into `patches` for instant sliders/toggles without committing `save` yet.
 */
interface CRUDState<TEntity extends object> {
    mode: CRUDMode;
    setMode: (mode: CRUDMode) => void;
    list: UseEntityViewResult<TEntity>;
    selectedId: EntityId | null;
    select: (id: EntityId | null) => void;
    openDetail: (id: EntityId) => void;
    detail: TEntity | null;
    detailIsLoading: boolean;
    detailError: string | null;
    relations: Record<string, unknown>;
    editBuffer: Partial<TEntity>;
    setField: (field: EntityFieldPath<TEntity>, value: unknown) => void;
    setFields: (fields: Partial<TEntity>) => void;
    resetBuffer: () => void;
    dirty: DirtyFields<TEntity>;
    startEdit: (id?: EntityId) => void;
    cancelEdit: () => void;
    save: () => Promise<TEntity | null>;
    isSaving: boolean;
    saveError: string | null;
    applyOptimistic: () => void;
    createBuffer: Partial<TEntity>;
    setCreateField: (field: EntityFieldPath<TEntity>, value: unknown) => void;
    setCreateFields: (fields: Partial<TEntity>) => void;
    resetCreateBuffer: () => void;
    startCreate: () => void;
    cancelCreate: () => void;
    create: () => Promise<TEntity | null>;
    isCreating: boolean;
    createError: string | null;
    deleteEntity: (id?: EntityId) => Promise<void>;
    isDeleting: boolean;
    deleteError: string | null;
    isEditing: boolean;
}
/**
 * Batteries-included CRUD orchestration over the entity graph: list filtering/sorting, detail fetch, isolated edit buffer, optimistic create row, and transactional save/delete with rollback.
 * Prefer this over ad-hoc `useEntity` wiring when building admin-style tables + side panels + forms for one resource.
 *
 * @param opts - `CRUDOptions` for type, list key/fetch, normalization, lifecycle callbacks
 * @returns `CRUDState` with list/detail/edit/create controls
 */
declare function useEntityCRUD<TEntity extends object>(opts: CRUDOptions<TEntity>): CRUDState<TEntity>;

type FieldType = "text" | "textarea" | "number" | "email" | "url" | "date" | "boolean" | "enum" | "json" | "markdown" | "custom";
interface FieldDescriptor<TEntity> {
    field: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: Array<{
        value: string;
        label: string;
    }>;
    hint?: string;
    render?: (value: unknown, entity: TEntity) => React$1.ReactNode;
    editControl?: (value: unknown, onChange: (v: unknown) => void, entity: Partial<TEntity>) => React$1.ReactNode;
    hideOnCreate?: boolean;
    hideOnEdit?: boolean;
    readonlyOnEdit?: boolean;
}
declare function Sheet({ open, onClose, title, subtitle, children, footer, width }: {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React$1.ReactNode;
    footer?: React$1.ReactNode;
    width?: string;
}): react_jsx_runtime.JSX.Element;
declare function EntityDetailSheet<TEntity extends object>({ crud, fields, title, description, children, showEditButton, showDeleteButton, deleteConfirmMessage }: {
    crud: CRUDState<TEntity>;
    fields: FieldDescriptor<TEntity>[];
    title?: string | ((e: TEntity) => string);
    description?: string | ((e: TEntity) => string);
    children?: (entity: TEntity, crud: CRUDState<TEntity>) => React$1.ReactNode;
    showEditButton?: boolean;
    showDeleteButton?: boolean;
    deleteConfirmMessage?: string;
}): react_jsx_runtime.JSX.Element;
declare function EntityFormSheet<TEntity extends object>({ crud, fields, createTitle, editTitle }: {
    crud: CRUDState<TEntity>;
    fields: FieldDescriptor<TEntity>[];
    createTitle?: string;
    editTitle?: string | ((e: TEntity) => string);
}): react_jsx_runtime.JSX.Element;

interface JsonSchemaObject {
    $id?: string;
    title?: string;
    description?: string;
    type?: string | string[];
    format?: string;
    enum?: readonly unknown[];
    default?: unknown;
    properties?: Record<string, JsonSchemaObject>;
    items?: JsonSchemaObject;
    required?: string[];
    additionalProperties?: boolean | JsonSchemaObject;
    ["x-a2ui-component"]?: string;
    ["x-display-order"]?: number;
    ["x-field-type"]?: string;
    ["x-hidden"]?: boolean;
}
interface EntityJsonSchemaConfig {
    entityType: string;
    schemaId?: string;
    field?: string;
    version?: string;
    source?: "static" | "runtime" | "ai";
    schema: JsonSchemaObject;
}
interface GetEntityJsonSchemaOptions {
    entityType: string;
    schemaId?: string;
    field?: string;
}
interface SchemaFieldDescriptor<TEntity extends object = Record<string, unknown>> extends FieldDescriptor<TEntity> {
    schemaPath: string;
    schema: JsonSchemaObject;
    componentHint?: string;
}
interface BuildEntityFieldsFromSchemaOptions {
    schema: JsonSchemaObject;
    rootField?: string;
}
interface GraphSnapshotWithSchemasOptions {
    scope: string;
    data: unknown;
    schemas: Array<EntityJsonSchemaConfig | null | undefined>;
    pretty?: boolean;
}
declare function registerEntityJsonSchema(config: EntityJsonSchemaConfig): void;
declare function registerRuntimeSchema(config: EntityJsonSchemaConfig): void;
declare function getEntityJsonSchema(opts: GetEntityJsonSchemaOptions): EntityJsonSchemaConfig | null;
declare function useSchemaEntityFields<TEntity extends object = Record<string, unknown>>(opts: GetEntityJsonSchemaOptions & {
    schema?: JsonSchemaObject;
    rootField?: string;
}): SchemaFieldDescriptor<TEntity>[];
declare function buildEntityFieldsFromSchema<TEntity extends object = Record<string, unknown>>(opts: BuildEntityFieldsFromSchemaOptions): SchemaFieldDescriptor<TEntity>[];
declare function exportGraphSnapshotWithSchemas(opts: GraphSnapshotWithSchemasOptions): string;
declare function renderMarkdownToHtml(value: string): string;
declare function MarkdownFieldRenderer({ value, className }: {
    value: string;
    className?: string;
}): react_jsx_runtime.JSX.Element;
declare function MarkdownFieldEditor({ value, onChange, placeholder, }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}): react_jsx_runtime.JSX.Element;

interface GraphSnapshotExportOptions {
    scope: string;
    data: unknown;
    pretty?: boolean;
}
interface GraphToolContext {
    store: ReturnType<typeof useGraphStore.getState>;
    queryOnce: typeof queryOnce;
    exportGraphSnapshot: typeof exportGraphSnapshot;
}
interface SchemaGraphToolContext extends GraphToolContext {
    getEntityJsonSchema: typeof getEntityJsonSchema;
    exportGraphSnapshotWithSchemas: typeof exportGraphSnapshotWithSchemas;
}
declare function exportGraphSnapshot(opts: GraphSnapshotExportOptions): string;
declare function createGraphTool<TInput, TResult>(handler: (input: TInput, ctx: GraphToolContext) => Promise<TResult> | TResult): (input: TInput) => TResult | Promise<TResult>;
declare function createSchemaGraphTool<TInput, TResult>(handler: (input: TInput, ctx: SchemaGraphToolContext) => Promise<TResult> | TResult): (input: TInput) => TResult | Promise<TResult>;

interface GraphPersistenceAdapter {
    get: (key: string) => Promise<string | null> | string | null;
    set: (key: string, value: string) => Promise<void> | void;
    remove?: (key: string) => Promise<void> | void;
}
interface GraphActionRecord {
    id: string;
    key: string;
    input: unknown;
    enqueuedAt: string;
}
interface GraphSyncStatus {
    phase: "idle" | "hydrating" | "syncing" | "ready" | "offline" | "error";
    isOnline: boolean;
    isSynced: boolean;
    pendingActions: number;
    lastHydratedAt: string | null;
    lastPersistedAt: string | null;
    storageKey: string | null;
    error: string | null;
}
interface GraphSnapshotPayload {
    version: 1;
    snapshot: {
        entities: ReturnType<typeof useGraphStore.getState>["entities"];
        patches: ReturnType<typeof useGraphStore.getState>["patches"];
        entityStates: ReturnType<typeof useGraphStore.getState>["entityStates"];
        syncMetadata: ReturnType<typeof useGraphStore.getState>["syncMetadata"];
        lists: ReturnType<typeof useGraphStore.getState>["lists"];
    };
    pendingActions: GraphActionRecord[];
}
interface PersistGraphToStorageOptions {
    storage: GraphPersistenceAdapter;
    key: string;
    pendingActions?: GraphActionRecord[];
}
interface HydrateGraphFromStorageOptions {
    storage: GraphPersistenceAdapter;
    key: string;
}
/**
 * Retry-with-backoff policy for replaying pending offline actions.
 *
 * The replay loop tracks per-action attempt counts. After `maxAttempts`
 * failed attempts the action is considered "poisoned" — it is removed from
 * the in-memory pending queue (so it won't block other actions) and the
 * optional `poisonHandler` is invoked. Consumers typically log the action,
 * surface a UI prompt, or persist it to a dead-letter store.
 *
 * Defaults: 5 attempts, starting at 500ms, doubling up to 30s, with
 * "equal" jitter (random in `[delay/2, delay]`).
 */
interface ReplayRetryPolicy {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    jitter?: "full" | "equal" | "none";
    poisonHandler?: (action: GraphActionRecord, error: unknown) => void | Promise<void>;
}
interface StartLocalFirstGraphOptions {
    storage: GraphPersistenceAdapter;
    key?: string;
    replayPendingActions?: boolean;
    onlineSource?: {
        getIsOnline: () => boolean;
        subscribe: (listener: (online: boolean) => void) => () => void;
    };
    persistDebounceMs?: number;
    /** Retry-with-backoff policy for offline action replay. */
    retryPolicy?: ReplayRetryPolicy;
}
interface LocalFirstGraphRuntime {
    ready: Promise<void>;
    dispose: () => void;
    persistNow: () => Promise<void>;
    hydrate: () => Promise<Awaited<ReturnType<typeof hydrateGraphFromStorage>>>;
    getStatus: () => GraphSyncStatus;
}
declare function useGraphSyncStatus(): GraphSyncStatus;
declare function persistGraphToStorage(opts: PersistGraphToStorageOptions): Promise<{
    ok: true;
    key: string;
    bytes: number;
    persistedAt: string;
}>;
declare function hydrateGraphFromStorage(opts: HydrateGraphFromStorageOptions): Promise<{
    ok: false;
    key: string;
    hydratedAt: null;
    entityCounts: {};
    error: string;
    pendingActions?: undefined;
} | {
    ok: true;
    key: string;
    hydratedAt: string;
    entityCounts: {
        [k: string]: number;
    };
    pendingActions: GraphActionRecord[];
    error?: undefined;
}>;
declare function startLocalFirstGraph(opts: StartLocalFirstGraphOptions): LocalFirstGraphRuntime;
interface ResolvedRetryPolicy {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
    jitter: "full" | "equal" | "none";
    poisonHandler?: (action: GraphActionRecord, error: unknown) => void | Promise<void>;
}
/**
 * Attempt to replay an action up to `maxAttempts` times. On exhaustion the
 * action goes to "poison" — the optional handler is invoked and the function
 * resolves. Exposed for unit testing.
 */
declare function replayActionWithRetry(action: GraphActionRecord, policy: ResolvedRetryPolicy): Promise<{
    ok: true;
} | {
    ok: false;
    poisoned: true;
    error: unknown;
}>;

/**
 * Debug-time snapshot of entity graph health: counts, list queries, patches, staleness,
 * in-flight fetches, and engine subscriber ref-counts.
 *
 * Mount inside a DevTools panel or debug route; subscriber totals update via
 * `useSyncExternalStore` when hooks register/unregister interest, and graph fields
 * update through the Zustand store.
 */
declare function useGraphDevTools(): {
    subscriberCount: number;
    entityCounts: Record<string, number>;
    totalEntities: number;
    listCount: number;
    patchedEntities: {
        type: string;
        id: string;
    }[];
    staleEntities: {
        type: string;
        id: string;
    }[];
    fetchingEntities: {
        type: string;
        id: string;
    }[];
    lists: {
        key: string;
        idCount: number;
        isFetching: boolean;
        isStale: boolean;
    }[];
};

/**
 * View-model for one entity row: merged canonical + patch data plus fetch lifecycle flags.
 * `isLoading` is true only when there is no data yet; `isFetching` includes background refreshes.
 */
interface UseEntityResult<T> {
    data: T | null;
    isLoading: boolean;
    isFetching: boolean;
    error: string | null;
    isStale: boolean;
    refetch: () => void;
}
/**
 * Subscribe to a single normalized entity: populates the graph via `fetch`/`normalize`, dedupes in-flight work, and revalidates when stale.
 * Solves “query-owned silos” by keeping **one** canonical record every list/detail reads through.
 *
 * @param opts - Entity query instruction (`EntityQueryOptions`): `type`, `id`, `fetch`, `normalize`, optional `staleTime` / `enabled`
 * @returns Merged entity (`entities` + `patches`), loading/error/stale flags, and `refetch`
 *
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = useEntity({
 *   type: "Project",
 *   id: projectId,
 *   fetch: (id) => api.getProject(id),
 *   normalize: (raw) => ({ ...raw, id: String(raw.id) }),
 * });
 * ```
 */
declare function useEntity<TRaw, TEntity extends object>(opts: EntityQueryOptions<TRaw, TEntity>): UseEntityResult<TEntity>;
/**
 * Resolved rows for a list query: **`items` joins `ids` to the graph** at render time so shared entities update everywhere.
 */
interface UseEntityListResult<TEntity> {
    items: TEntity[];
    ids: EntityId[];
    isLoading: boolean;
    isFetching: boolean;
    isFetchingMore: boolean;
    error: string | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    total: number | null;
    currentPage: number | null;
    fetchNextPage: () => void;
    refetch: () => void;
}
/**
 * Subscribe to a collection: stores **ordered ids** under a serialized `queryKey`, upserts each row into `entities`, and supports pagination.
 * Use when you need a table or feed backed by the shared graph (not an isolated query cache).
 *
 * @param opts - List query instruction (`ListQueryOptions`)
 * @returns Hydrated `items`, raw `ids`, pagination helpers, and fetch flags
 *
 * @example
 * ```tsx
 * const { items, fetchNextPage, hasNextPage } = useEntityList({
 *   type: "Task",
 *   queryKey: ["tasks", { projectId }],
 *   fetch: (p) => api.listTasks({ ...p, projectId }),
 *   normalize: (raw) => ({ id: raw.id, data: raw }),
 *   mode: "append",
 * });
 * ```
 */
declare function useEntityList<TRaw, TEntity extends object>(opts: ListQueryOptions<TRaw, TEntity>): UseEntityListResult<TEntity>;
/**
 * Options for graph-aware mutations: API call + optional normalization into `entities`, optimistic patches, and targeted invalidation.
 * Prefer `invalidateLists` prefixes / `invalidateEntities` over ad-hoc store calls so list UIs stay coherent.
 */
interface MutationOptions<TInput, TRaw, TEntity extends object> {
    type: EntityType;
    mutate: (input: TInput) => Promise<TRaw>;
    normalize?: (raw: TRaw, input: TInput) => {
        id: EntityId;
        data: TEntity;
    };
    optimistic?: (input: TInput) => {
        id: EntityId;
        patch: Partial<TEntity>;
    } | null;
    invalidateLists?: string[];
    invalidateEntities?: Array<{
        type: EntityType;
        id: EntityId;
    }>;
    onSuccess?: (result: TRaw, input: TInput) => void;
    onError?: (error: Error, input: TInput) => void;
}
/** Imperative mutation handle plus explicit async `state` for UI pending/error/success. */
interface UseMutationResult<TInput, TRaw> {
    mutate: (input: TInput) => Promise<TRaw | null>;
    trigger: (input: TInput) => void;
    reset: () => void;
    state: {
        isPending: boolean;
        isSuccess: boolean;
        isError: boolean;
        error: string | null;
    };
}
/**
 * Perform writes through your API while keeping the entity graph authoritative: optional optimistic `patchEntity`, commit via `upsertEntity`, rollback on failure.
 * Use when `useEntity`/`useEntityList` describe reads and you need a consistent mutation story without a second client cache.
 *
 * @example
 * ```tsx
 * const { mutate, state } = useEntityMutation({
 *   type: "Task",
 *   mutate: (input) => api.updateTask(input.id, input.patch),
 *   normalize: (raw) => ({ id: raw.id, data: raw }),
 * });
 * ```
 */
declare function useEntityMutation<TInput, TRaw, TEntity extends object>(opts: MutationOptions<TInput, TRaw, TEntity>): UseMutationResult<TInput, TRaw>;
/**
 * Read/write **UI-only** fields for one entity (`patches` layer) so selection, hover, or transient state is visible in every view that reads that id.
 * Does not replace `useEntityCRUD`’s edit buffer for form drafts — patches are for shared, non-persisted overlays.
 *
 * @param type - Entity kind
 * @param id - Entity id (no-ops when null/undefined)
 * @returns Current patch slice and helpers `augment` / `unaugment` / `clear`
 */
declare function useEntityAugment<TEntity extends object>(type: EntityType, id: EntityId | null | undefined): {
    patch: Partial<TEntity> | null;
    augment: (fields: Partial<TEntity>) => void;
    unaugment: (keys: (keyof TEntity)[]) => void;
    clear: () => void;
};
/**
 * Suspense-compatible version of `useEntity`. Throws a promise while the entity
 * is loading, allowing React Suspense boundaries to show fallback UI.
 * Once data is available, returns the entity data directly (never null).
 *
 * @param opts - Same as `useEntity` (`EntityQueryOptions`)
 * @returns `data` plus `isFetching`, `isStale`, and `refetch`
 * @throws Promise while loading (caught by the nearest Suspense boundary)
 * @throws Error if the fetch fails with no data, if `id` is missing when required, or if the entity never resolves
 */
declare function useSuspenseEntity<TRaw, TEntity extends object>(opts: EntityQueryOptions<TRaw, TEntity>): {
    data: TEntity;
    isFetching: boolean;
    isStale: boolean;
    refetch: () => void;
};
/**
 * Suspense-compatible version of `useEntityList`. Throws a promise during
 * initial load, allowing Suspense boundaries to handle loading state.
 *
 * @param opts - Same as `useEntityList` (`ListQueryOptions`)
 * @returns Same shape as `useEntityList` except `isLoading` is omitted (always false when not suspended)
 * @throws Promise while initially loading (caught by the nearest Suspense boundary)
 * @throws Error if the fetch fails while the list is still empty
 */
declare function useSuspenseEntityList<TRaw, TEntity extends object>(opts: ListQueryOptions<TRaw, TEntity>): Omit<UseEntityListResult<TEntity>, "isLoading">;

/**
 * Evaluate `FilterSpec` against one in-memory entity — mirrors remote semantics as closely as plain JS allows.
 * Use for **local** and **hybrid** `useEntityView` paths so UI filtering matches what users expect from the declarative spec.
 */
declare function matchesFilter(entity: Record<string, unknown>, filter: FilterSpec): boolean;
/**
 * Case-insensitive substring match across configured string fields; empty query is a no-op pass.
 * Keeps quick search consistent between client-only and debounced remote `q` params.
 */
declare function matchesSearch(entity: Record<string, unknown>, query: string, fields: string[]): boolean;
/**
 * Multi-key comparator implementing `SortSpec` (null ordering, optional custom comparators, locale-aware string fallback).
 * Shared by local sorting and binary insertion for realtime updates.
 */
declare function compareEntities(a: Record<string, unknown>, b: Record<string, unknown>, sort: SortSpec): number;
/**
 * Pure list projection: map ids → entities, drop missing, filter/sort/search, return **ids** in display order.
 * Bridges stored id lists with on-the-fly view descriptors without duplicating entity payloads.
 */
declare function applyView(ids: string[], getEntity: (id: string) => Record<string, unknown> | null, filter?: FilterSpec | null, sort?: SortSpec | null, search?: {
    query: string;
    fields: string[];
} | null): string[];
/**
 * Heuristic for whether the graph likely holds **all** rows for a list key (enables local-only filtering/sorting in `useEntityView`).
 * `total` and `hasNextPage` come from list metadata written by fetchers.
 */
declare function checkCompleteness(loadedCount: number, total: number | null, hasNextPage: boolean): {
    isComplete: boolean;
    reason: string;
};

/**
 * FK edge: this entity points at one parent row. Used to invalidate parent aggregates and optional list keys when the FK changes.
 */
interface BelongsToRelation {
    cardinality: "belongsTo";
    foreignKey: string;
    targetType: EntityType;
    invalidateTargetLists?: string[];
}
/**
 * Inverse collection: children carry `foreignKey` pointing here; `listKeyPrefix` builds the child list query key for a given parent id.
 */
interface HasManyRelation {
    cardinality: "hasMany";
    targetType: EntityType;
    foreignKey: string;
    listKeyPrefix: (parentId: EntityId) => unknown[];
}
/**
 * Join-style relation stored as an id array on this entity; invalidates partner lists derived via `listKeyPrefix` for each touched id.
 */
interface ManyToManyRelation {
    cardinality: "manyToMany";
    targetType: EntityType;
    localArrayField?: string;
    listKeyPrefix: (thisId: EntityId) => unknown[];
}
type RelationDescriptor = BelongsToRelation | HasManyRelation | ManyToManyRelation;
/**
 * Declarative relation metadata for one `EntityType`: optional named relations and list key prefixes to invalidate on any mutation.
 */
interface EntitySchema {
    type: EntityType;
    relations?: Record<string, RelationDescriptor>;
    globalListKeys?: string[];
}
/**
 * Snapshot diff passed to cascade rules after CRUD: compare `previous` vs `next` to find FK moves, array membership changes, etc.
 */
interface CascadeContext {
    type: EntityType;
    id: EntityId;
    previous: Record<string, unknown> | null;
    next: Record<string, unknown> | null;
    op: "create" | "update" | "delete";
}
/** Register or replace schema for `schema.type` (typically at app init). */
declare function registerSchema(schema: EntitySchema): void;
/** Lookup schema for cascade/join reads; returns null if unregistered. */
declare function getSchema(type: EntityType): EntitySchema | null;
/**
 * After a successful mutation, mark related entities/lists stale so hooks refetch without manually hunting query keys.
 * Traverses registered schemas (including reverse `hasMany`) so denormalized UIs stay eventually consistent with the graph.
 */
declare function cascadeInvalidation(ctx: CascadeContext): void;
/**
 * Resolve relation **placeholders** for detail panels: joins graph reads for belongs-to targets, has-many id lists, or many-to-many id arrays.
 * Returns plain objects suitable for rendering; does not mutate the graph.
 */
declare function readRelations(type: EntityType, entity: Record<string, unknown>): Record<string, unknown>;

/**
 * adapters/types.ts
 *
 * Common contract every data-source adapter implements.
 * The entity graph doesn't care whether data comes from REST, GraphQL,
 * WebSocket, Supabase, Convex, PGlite shape sync — they all speak this
 * interface and write into the same graph.
 */

type ChangeOperation = "insert" | "update" | "delete" | "upsert";
interface EntityChange<T = Record<string, unknown>> {
    op: ChangeOperation;
    type: EntityType;
    id: EntityId;
    data?: T;
    patch?: Partial<T>;
}
interface ChangeSet<T = Record<string, unknown>> {
    changes: EntityChange<T>[];
    affectedListKeys?: string[];
    timestamp?: string;
}
type UnsubscribeFn$1 = () => void;
interface SubscriptionConfig {
    label?: string;
    replayOnConnect?: boolean;
}
interface RealtimeAdapter {
    readonly name: string;
    subscribe(config: SubscriptionConfig, handler: (changeset: ChangeSet) => void): UnsubscribeFn$1;
    onStatusChange?: (cb: (status: AdapterStatus) => void) => UnsubscribeFn$1;
}
type AdapterStatus = "connecting" | "connected" | "disconnected" | "error";
interface SyncQueryResult<T> {
    rows: T[];
    total?: number;
}
interface SyncAdapter extends RealtimeAdapter {
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<SyncQueryResult<T>>;
    execute(sql: string, params?: unknown[]): Promise<void>;
    isSynced(): boolean;
    onSyncComplete(cb: () => void): UnsubscribeFn$1;
}
interface ChannelConfig {
    type: EntityType;
    filter?: Record<string, unknown>;
    id?: EntityId;
    operations?: ChangeOperation[];
}

interface ManagerOptions {
    flushInterval?: number;
    onStatusChange?: (adapter: string, status: AdapterStatus) => void;
    onChangeReceived?: (adapter: string, change: EntityChange) => void;
}
declare class RealtimeManager {
    private adapters;
    private pendingChanges;
    private pendingListKeys;
    private flushTimer;
    private opts;
    constructor(opts?: ManagerOptions);
    register(adapter: RealtimeAdapter, channels: ChannelConfig[], normalize?: (raw: unknown) => EntityChange | null): UnsubscribeFn$1;
    unregister(name: string): void;
    unregisterAll(): void;
    private handleChangeset;
    private scheduleFlush;
    flush(): void;
    forceFlush(): void;
}
declare function getRealtimeManager(opts?: ManagerOptions): RealtimeManager;
declare function resetRealtimeManager(): void;

/**
 * adapters/realtime-adapters.ts
 *
 * WebSocket, Supabase Realtime, Convex, and GraphQL subscription adapters.
 * All implement RealtimeAdapter and route through RealtimeManager → entity graph.
 */

interface WebSocketAdapterOptions {
    url: string | (() => string);
    parseMessage?: (data: unknown) => EntityChange[] | null;
    protocols?: string | string[];
    reconnectBaseDelay?: number;
    maxReconnectAttempts?: number;
    pingInterval?: number;
    pingMessage?: string;
}
declare function createWebSocketAdapter(opts: WebSocketAdapterOptions): RealtimeAdapter;
interface SupabaseClient$1 {
    channel(name: string): SupabaseChannel;
}
interface SupabaseChannel {
    on(event: "postgres_changes", config: {
        event: "*" | "INSERT" | "UPDATE" | "DELETE";
        schema: string;
        table: string;
        filter?: string;
    }, handler: (payload: SupabasePayload) => void): SupabaseChannel;
    subscribe(cb?: (status: string) => void): SupabaseChannel;
    unsubscribe(): Promise<void>;
}
interface SupabasePayload {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: Record<string, unknown>;
    old: Record<string, unknown>;
    table: string;
}
interface SupabaseAdapterOptions$1 {
    tableTypeMap?: Record<string, string>;
    extractId?: (record: Record<string, unknown>) => string;
    schema?: string;
}
declare function createSupabaseRealtimeAdapter(client: SupabaseClient$1, opts?: SupabaseAdapterOptions$1): RealtimeAdapter & {
    subscribeChannel: (config: ChannelConfig & {
        _handler?: (cs: ChangeSet) => void;
    }) => UnsubscribeFn$1;
};
interface ConvexClient {
    onUpdate<T>(query: unknown, args: Record<string, unknown>, handler: (result: T) => void): UnsubscribeFn$1;
}
interface ConvexChannelConfig<T extends object> {
    type: string;
    query: unknown;
    args?: Record<string, unknown>;
    extractId?: (record: T) => string;
    normalize?: (record: T) => Record<string, unknown>;
}
declare function createConvexAdapter<T extends object>(opts: {
    client: ConvexClient;
    channels: ConvexChannelConfig<T>[];
}): RealtimeAdapter;
interface GQLWsClient {
    subscribe<T>(payload: {
        query: string;
        variables?: Record<string, unknown>;
    }, sink: {
        next: (value: {
            data: T;
        }) => void;
        error: (err: unknown) => void;
        complete: () => void;
    }): UnsubscribeFn$1;
}
interface GQLSubscriptionConfig<T extends object> {
    type: string;
    document: string;
    variables?: Record<string, unknown>;
    getPayload: (data: T) => GQLPayload | GQLPayload[] | null;
}
interface GQLPayload {
    type?: string;
    node?: Record<string, unknown>;
    id?: string;
}
declare function createGraphQLSubscriptionAdapter<T extends object>(opts: {
    client: GQLWsClient;
    subscriptions: GQLSubscriptionConfig<T>[];
    extractId?: (node: Record<string, unknown>, type: string) => string;
    normalize?: (node: Record<string, unknown>, type: string) => Record<string, unknown>;
}): RealtimeAdapter;

/**
 * Options for {@link createPrismaEntityConfig}: one REST-backed resource aligned with Prisma-style `where` / `orderBy` / `include` payloads.
 */
interface PrismaEntityConfigOptions<TEntity extends object> {
    /** Graph entity type key (e.g. `"Task"`). */
    type: string;
    /** Base REST URL for the collection (list) and detail as `${endpoint}/:id`. */
    endpoint: string;
    /** Primary key field on normalized entities (default `"id"`). */
    idField?: string;
    /**
     * Declarative relations (Prisma-flavored names) used to build {@link EntitySchema} and {@link toPrismaInclude}.
     * `type` is the **related** model; `foreignKey` is the FK or scalar list field name as in your API.
     */
    relations?: Record<string, {
        type: string;
        foreignKey: string;
        relation: "belongsTo" | "hasMany" | "manyToMany";
    }>;
}
/**
 * Converts registered {@link RelationDescriptor} entries into a Prisma `include` map (`true` for each relation name).
 */
declare function toPrismaInclude(relations: Record<string, RelationDescriptor>): Record<string, boolean | Record<string, unknown>>;
/**
 * Maps Prisma-style relation declarations from {@link PrismaEntityConfigOptions} into a single {@link EntitySchema}
 * for {@link registerSchema} / cascade invalidation. `hasMany` uses `listKeyPrefix: (id) => [targetType, { [foreignKey]: id }]`.
 * `manyToMany` uses `localArrayField: foreignKey` and a stable `listKeyPrefix` of `[targetType, relationName, id]`.
 */
declare function prismaRelationsToSchema(type: string, relations: PrismaEntityConfigOptions<Record<string, unknown>>["relations"]): EntitySchema;
/**
 * Factory for REST-backed entity/list/CRUD options that serialize filters and sorts with {@link toPrismaWhere} / {@link toPrismaOrderBy}.
 *
 * - {@link PrismaEntityConfigOptions.endpoint `endpoint`} — GET list; GET `${endpoint}/:id` for detail.
 * - List/CRUD fetchers send `where` and `orderBy` as JSON query strings unless you override via {@link ListFetchParams.params}.
 */
declare function createPrismaEntityConfig<TEntity extends object>(config: PrismaEntityConfigOptions<TEntity>): {
    /**
     * Builds {@link EntityQueryOptions} for {@link useEntity} (GET `${endpoint}/:id`).
     */
    entity: (id: EntityId) => EntityQueryOptions<TEntity, TEntity>;
    /**
     * Builds {@link ListQueryOptions} for {@link useEntityList}. Encode `filter` / `sort` in the returned `queryKey` so
     * refetches track view changes; each fetch sends Prisma-shaped `where` / `orderBy` query params.
     */
    list: (params?: {
        page?: number;
        pageSize?: number;
        filter?: FilterSpec;
        sort?: SortSpec;
    }) => ListQueryOptions<TEntity, TEntity>;
    /**
     * Builds partial {@link CRUDOptions} for {@link useEntityCRUD}: wires list fetch (Prisma query params from `ViewDescriptor`)
     * and detail fetch. Supply `onCreate` / `onUpdate` / `onDelete` at the call site.
     */
    crud: (opts?: {
        initialView?: ViewDescriptor;
    }) => CRUDOptions<TEntity>;
    /** Schemas to pass to {@link registerSchema} (one entry for this `type`). */
    schemas: () => EntitySchema[];
};

interface PGlite$1 {
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{
        rows: T[];
    }>;
    exec(sql: string): Promise<unknown>;
    listen(channel: string, handler: (payload: string) => void): Promise<() => void>;
}
interface ShapeMessage$1<T = Record<string, unknown>> {
    headers: {
        operation: "insert" | "update" | "delete";
    };
    offset: string;
    value: T;
    key: string;
}
interface ShapeStream$1<T = Record<string, unknown>> {
    subscribe(onMsg: (msgs: ShapeMessage$1<T>[]) => void, onErr?: (e: Error) => void): () => void;
    isUpToDate: boolean;
    lastOffset: string;
}
interface ElectricTableConfig<T extends object> {
    type: EntityType;
    table: string;
    where?: string;
    idColumn?: string;
    normalize?: (row: T) => Record<string, unknown>;
    shapeStream: ShapeStream$1<T>;
}
interface ElectricAdapterOptions {
    pglite: PGlite$1;
    tables: ElectricTableConfig<Record<string, unknown>>[];
    onSynced?: () => void;
}
declare function createElectricAdapter(opts: ElectricAdapterOptions): SyncAdapter;
interface UseLocalFirstResult {
    isSynced: boolean;
    query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
    execute: (sql: string, params?: unknown[]) => Promise<void>;
}
declare function useLocalFirst(adapter: SyncAdapter): UseLocalFirstResult;
declare function usePGliteQuery<T extends object>(opts: {
    adapter: SyncAdapter;
    type: EntityType;
    sql: string;
    params?: unknown[];
    idColumn?: string;
    normalize?: (row: T) => Record<string, unknown>;
    deps?: unknown[];
}): {
    isLoading: boolean;
    error: string | null;
};

/**
 * adapters/electricsql-tenant.ts
 *
 * Tenant-scoped Electric adapter — the safety primitive that enforces
 * **RULE 5 — Shape predicates ⊆ RLS** (see hotseaters constraints).
 *
 * PGlite has no row-level security. The only way to guarantee a client
 * never sees cross-tenant data through Electric is to refuse to attach
 * any shape that lacks a tenant predicate. This wrapper does exactly that:
 *
 *   - Validates the tenant claim (currently `{ companyId }`) is a UUID.
 *   - Refuses to attach a shape whose `tenantColumn` is `undefined`. We
 *     accept explicit `null` for the company root itself (filtered by `id`).
 *   - Builds the `where` clause from `tenantColumn` and the validated
 *     companyId so individual shape factories cannot drift from RLS.
 *   - Delegates to the existing `createElectricAdapter` for the actual
 *     sync wiring.
 *
 * This also fulfils Change 13 item 11 (auth-claim-aware shape registration):
 * the `tenantClaim` is the typed seam where authn meets shape registration.
 *
 * Self-hosted Supabase only. Local stack and `https://electricsql.prometheusags.ai`
 * are the only acceptable Electric endpoints — this module does not
 * hard-code either; it only governs the predicate.
 */

interface PGlite {
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{
        rows: T[];
    }>;
    exec(sql: string): Promise<unknown>;
    listen(channel: string, handler: (payload: string) => void): Promise<() => void>;
}
interface ShapeMessage<T = Record<string, unknown>> {
    headers: {
        operation: "insert" | "update" | "delete";
    };
    offset: string;
    value: T;
    key: string;
}
interface ShapeStream<T = Record<string, unknown>> {
    subscribe(onMsg: (msgs: ShapeMessage<T>[]) => void, onErr?: (e: Error) => void): () => void;
    isUpToDate: boolean;
    lastOffset: string;
}
/** Auth claim required to register tenant-scoped shapes. */
interface TenantClaim {
    companyId: string;
}
interface TenantScopedTableConfig<T extends object = Record<string, unknown>> {
    type: EntityType;
    table: string;
    /**
     * Column used for tenant filtering.
     *
     * - A string (`"company_id"`) yields `WHERE company_id = '<companyId>'`.
     * - Explicit `null` means the table IS the tenant root and is filtered by
     *   `id = '<companyId>'`. Only the `company` table qualifies.
     * - `undefined` is **rejected** — this is the safety gate.
     */
    tenantColumn: string | null;
    primaryKey?: string[];
    /**
     * Factory invoked with the constructed `where` clause and the tenant claim.
     * Consumers wire their preferred Electric `ShapeStream` builder here. The
     * factory must use the supplied `where` verbatim (no widening).
     */
    shapeStreamFactory: (params: {
        table: string;
        where: string;
        tenantClaim: TenantClaim;
    }) => ShapeStream<T>;
    normalize?: (row: T) => Record<string, unknown>;
}
interface TenantScopedAdapterOptions {
    pglite: PGlite;
    tenantClaim: TenantClaim;
    tables: TenantScopedTableConfig[];
    onSynced?: () => void;
}
/**
 * Build the `where` clause for a single shape. Exposed for tests.
 *
 * - `tenantColumn === null` → `id = '<companyId>'` (company-root case)
 * - `tenantColumn === string` → `<tenantColumn> = '<companyId>'`
 *
 * Throws if `tenantColumn` is `undefined` or `companyId` is not a UUID.
 */
declare function buildTenantWhere(tenantColumn: string | null | undefined, companyId: string, tableLabel: string): string;
/**
 * Build a tenant-scoped {@link SyncAdapter}.
 *
 * For each table in `tables`:
 *   1. Validates `tenantColumn` is defined (string or explicit null).
 *   2. Validates `companyId` is a UUID.
 *   3. Builds the predicate and calls `shapeStreamFactory(...)` to get the
 *      actual `ShapeStream`.
 *   4. Hands the resulting list off to `createElectricAdapter` for wiring.
 *
 * @throws if any table lacks `tenantColumn`, or the company id is not a UUID.
 */
declare function createTenantScopedElectricAdapter(opts: TenantScopedAdapterOptions): SyncAdapter;

/**
 * adapters/pglite-persistence.ts
 *
 * PGlite-backed implementation of {@link GraphPersistenceAdapter}.
 *
 * Stores the local-first runtime's graph snapshot inside a PGlite table
 * (`_graph_snapshot` by default) instead of `localStorage`/`IndexedDB`.
 *
 * Why this exists:
 *   - The app already has a PGlite handle for ElectricSQL sync.
 *   - Putting the graph snapshot alongside synced data means one storage
 *     surface to back up, clear, and reason about.
 *   - Works in Tauri WebView + Node (PGlite is a WASM Postgres) without
 *     pulling in browser-only storage.
 *
 * Contract:
 *   - `get(key)`    -> returns the stored string or null
 *   - `set(key, v)` -> upserts (insert-or-replace), stamping `updated_at`
 *   - `remove(key)` -> deletes the row (no-op if absent)
 *
 * The function lazily ensures the storage table exists on first call.
 * That `CREATE TABLE IF NOT EXISTS` is idempotent so it's safe to retry.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible. This module does
 * not import `@electric-sql/pglite` — consumers pass a PGlite-shaped handle.
 */

interface PGlitePersistenceClient {
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{
        rows: T[];
    }>;
    exec(sql: string): Promise<unknown>;
}
interface CreatePGlitePersistenceAdapterOptions {
    /** Name of the snapshot table. Defaults to `_graph_snapshot`. */
    tableName?: string;
}
/**
 * Returns a {@link GraphPersistenceAdapter} that reads/writes the graph
 * snapshot through a PGlite-shaped client.
 *
 * @example
 * ```ts
 * import { PGlite } from "@electric-sql/pglite";
 * import { startLocalFirstGraph, createPGlitePersistenceAdapter } from "@prometheus-ags/prometheus-entity-management";
 *
 * const pglite = await PGlite.create("idb://hotseaters");
 * const storage = await createPGlitePersistenceAdapter(pglite);
 * const runtime = startLocalFirstGraph({ storage, key: "hotseaters:graph" });
 * ```
 */
declare function createPGlitePersistenceAdapter(pglite: PGlitePersistenceClient, options?: CreatePGlitePersistenceAdapterOptions): Promise<GraphPersistenceAdapter>;

/**
 * schema-from-sql.ts
 *
 * Generates a JSON Schema (and registers it via `registerEntityJsonSchema`)
 * directly from a Postgres `CREATE TABLE` statement. Lets a consumer keep
 * `latest-data/supabase/migrations/*.sql` as the single source of truth for
 * column shapes — no hand-maintained TypeScript schema duplicates.
 *
 * Deliberately regex-based: a real SQL parser is overkill for the slice of
 * DDL we care about, and would add a non-trivial runtime dep.
 *
 * Type mapping
 * ------------
 *   UUID, TEXT, VARCHAR(*)             -> { type: "string" }
 *   INTEGER, INT, BIGINT, SMALLINT     -> { type: "integer" }
 *   NUMERIC(*), DECIMAL(*)             -> { type: "number" }
 *   BOOLEAN, BOOL                      -> { type: "boolean" }
 *   TIMESTAMPTZ, TIMESTAMP             -> { type: "string", format: "date-time" }
 *   DATE                               -> { type: "string", format: "date" }
 *   JSONB, JSON                        -> { type: "object" }
 *   TEXT[]                             -> { type: "array", items: { type: "string" } }
 *   anything else                      -> { type: "string" } + "x-warning"
 *
 * `required` is populated from `NOT NULL` columns that lack a `DEFAULT`.
 * Callers can pass `overrides` to deep-merge a partial config (typically to
 * narrow a JSONB column to an array, or to add `enum`/`format` hints).
 */

interface RegisterEntityFromSqlOptions {
    entityType: string;
    /** A single `CREATE TABLE` statement (extra DDL around it is ignored). */
    createTableSql: string;
    /** Optional deep-merge overrides (overrides win). */
    overrides?: Partial<EntityJsonSchemaConfig>;
}
interface ParsedColumn {
    name: string;
    sqlType: string;
    notNull: boolean;
    hasDefault: boolean;
}
interface ParsedTable {
    tableName: string;
    columns: ParsedColumn[];
}
/**
 * Parse a `CREATE TABLE` block. Exposed for tests and for callers who need
 * the intermediate representation.
 */
declare function parseCreateTable(sql: string): ParsedTable;
/**
 * Map a normalized (uppercased, whitespace-stripped) SQL type to a JSON
 * schema fragment.
 *
 * Returns `{ schema, warning }` so the caller can surface "unmapped type"
 * notes via `x-warning` on the property.
 */
declare function sqlTypeToJsonSchema(sqlType: string): {
    schema: JsonSchemaObject;
    warning?: string;
};
/**
 * Build (and register) an `EntityJsonSchemaConfig` from a CREATE TABLE
 * statement. Returns the registered config so callers can introspect it.
 */
declare function registerEntityFromSql(opts: RegisterEntityFromSqlOptions): EntityJsonSchemaConfig;

/**
 * table/use-entity-list-as-table.ts
 *
 * Adapter hook that shapes a `useEntityList` result for TanStack Table (or
 * any data-grid that wants a plain `data` array + `rowCount`).
 *
 * It deliberately does NOT bring `@tanstack/react-table` as a dependency.
 * Consumers wire the table; this helper only stabilizes the array reference
 * so the table doesn't re-render unnecessarily, and exposes the same
 * loading/error surface as `useEntityList`.
 *
 * @example
 * ```tsx
 * const tableProps = useEntityListAsTable({
 *   type: "Client",
 *   fetch: (params) => api.listClients(params),
 *   normalize: (raw) => ({ id: raw.id, data: raw }),
 * });
 *
 * const table = useReactTable({
 *   data: tableProps.data,
 *   rowCount: tableProps.rowCount,
 *   columns,
 *   getCoreRowModel: getCoreRowModel(),
 * });
 * ```
 */

interface UseEntityListAsTableOptions<TRaw, TEntity extends object> extends Omit<ListQueryOptions<TRaw, TEntity>, "type" | "queryKey"> {
    type: EntityType;
    /** Optional override for the cache key. Defaults to `["entity-list-as-table", type]`. */
    queryKey?: unknown[];
}
interface UseEntityListAsTableResult<TEntity> {
    data: TEntity[];
    rowCount: number;
    isLoading: boolean;
    isFetching: boolean;
    error: string | null;
    refetch: () => void;
}
/**
 * Wraps `useEntityList` for table consumers.
 *
 * Returns a referentially-stable `data` array (replaced only when items
 * actually change). TanStack Table treats `data` by identity for memoization,
 * so this is essential to avoid blowing away row state on every render.
 */
declare function useEntityListAsTable<TRaw, TEntity extends object>(opts: UseEntityListAsTableOptions<TRaw, TEntity>): UseEntityListAsTableResult<TEntity>;

interface GQLClientConfig {
    url: string;
    headers?: () => Record<string, string>;
    onError?: (errors: GQLError[]) => void;
}
interface GQLError {
    message: string;
    locations?: Array<{
        line: number;
        column: number;
    }>;
    path?: string[];
    extensions?: Record<string, unknown>;
}
interface GQLResponse<T> {
    data: T | null;
    errors?: GQLError[];
}
interface EntityDescriptor<TNode, TEntity extends object> {
    type: EntityType;
    path: string;
    extractId?: (node: TNode) => EntityId;
    normalize: (node: TNode) => TEntity;
    relations?: EntityDescriptor<unknown, Record<string, unknown>>[];
}
declare function executeGQL<T>(cfg: GQLClientConfig, document: string, variables?: Record<string, unknown>): Promise<GQLResponse<T>>;
declare function normalizeGQLResponse<T>(data: T, descriptors: EntityDescriptor<unknown, Record<string, unknown>>[]): Array<{
    type: EntityType;
    id: EntityId;
}>;
declare class GQLClient {
    private cfg;
    constructor(cfg: GQLClientConfig);
    query<TData, TEntity extends object>(opts: {
        document: string;
        variables?: Record<string, unknown>;
        descriptors: EntityDescriptor<unknown, TEntity>[];
        cacheKey?: string;
    }): Promise<GQLResponse<TData>>;
    mutate<TData, TEntity extends object>(opts: {
        document: string;
        variables?: Record<string, unknown>;
        descriptors?: EntityDescriptor<unknown, TEntity>[];
        optimistic?: () => void;
    }): Promise<GQLResponse<TData>>;
    subscribe<TData>(opts: {
        document: string;
        variables?: Record<string, unknown>;
        descriptors: EntityDescriptor<unknown, Record<string, unknown>>[];
        wsClient: {
            subscribe: (p: unknown, s: unknown) => () => void;
        };
        onData?: (data: TData) => void;
        onError?: (e: unknown) => void;
    }): () => void;
}
declare function createGQLClient(cfg: GQLClientConfig): GQLClient;

interface GQLEntityOptions<TData, TEntity extends object> {
    client: GQLClient;
    document: string;
    variables?: Record<string, unknown>;
    type: EntityType;
    id: EntityId | null | undefined;
    descriptor: EntityDescriptor<unknown, TEntity>;
    sideDescriptors?: EntityDescriptor<unknown, Record<string, unknown>>[];
    staleTime?: number;
    enabled?: boolean;
    onSuccess?: (data: TData) => void;
    onError?: (err: Error) => void;
}
declare function useGQLEntity<TData, TEntity extends object>(opts: GQLEntityOptions<TData, TEntity>): {
    data: TEntity | null;
    isLoading: boolean;
    isFetching: boolean;
    error: string | null;
    isStale: boolean;
    refetch: () => void;
};
interface GQLListOptions<TData, TEntity extends object> {
    client: GQLClient;
    document: string;
    variables?: Record<string, unknown>;
    type: EntityType;
    queryKey: unknown[];
    descriptor: EntityDescriptor<unknown, TEntity>;
    getItems: (data: TData) => unknown[];
    getPagination?: (data: TData) => {
        total?: number;
        nextCursor?: string;
        hasNextPage?: boolean;
        page?: number;
        pageSize?: number;
    };
    sideDescriptors?: EntityDescriptor<unknown, Record<string, unknown>>[];
    mode?: "replace" | "append";
    staleTime?: number;
    enabled?: boolean;
}
declare function useGQLList<TData, TEntity extends object>(opts: GQLListOptions<TData, TEntity>): {
    items: TEntity[];
    ids: string[];
    isLoading: boolean;
    isFetching: boolean;
    isFetchingMore: boolean;
    error: string | null;
    hasNextPage: boolean;
    total: number | null;
    currentPage: number | null;
    fetchNextPage: () => void;
    refetch: () => void;
};
declare function useGQLMutation<TData, TEntity extends object>(opts: {
    client: GQLClient;
    document: string;
    type: string;
    descriptors?: EntityDescriptor<unknown, TEntity>[];
    optimistic?: (variables: Record<string, unknown>) => void;
    invalidateLists?: string[];
    onSuccess?: (data: TData) => void;
    onError?: (err: Error) => void;
}): {
    mutate: (variables: Record<string, unknown>) => Promise<GQLResponse<TData> | null>;
    trigger: (v: Record<string, unknown>) => void;
    state: {
        isPending: boolean;
        isSuccess: boolean;
        isError: boolean;
        error: string | null;
    };
};
declare function useGQLSubscription<TData>(opts: {
    client: GQLClient;
    wsClient: {
        subscribe: (payload: unknown, sink: unknown) => () => void;
    };
    document: string;
    variables?: Record<string, unknown>;
    descriptors: EntityDescriptor<unknown, Record<string, unknown>>[];
    onData?: (data: TData) => void;
    onError?: (err: unknown) => void;
    enabled?: boolean;
}): {
    connected: boolean;
    error: string | null;
};

declare function InlineCellEditor$1({ initialValue, onCommit, onCancel, className }: {
    initialValue: string;
    onCommit: (v: string) => void;
    onCancel: () => void;
    className?: string;
}): react_jsx_runtime.JSX.Element;
interface EntityTableProps<T extends object> {
    viewResult: UseEntityViewResult<T>;
    columns: ColumnDef$1<T>[];
    getRowId?: (row: T) => string;
    selectedId?: string | null;
    onRowClick?: (row: T) => void;
    onCellEdit?: (row: T, field: string, value: unknown) => void;
    onBulkAction?: (rows: T[]) => React$1.ReactNode;
    paginationMode?: "none" | "loadMore" | "pages";
    pageSize?: number;
    searchPlaceholder?: string;
    searchFields?: string[];
    toolbarChildren?: React$1.ReactNode;
    showToolbar?: boolean;
    emptyState?: React$1.ReactNode;
    className?: string;
}
declare function EntityTable<T extends object>({ viewResult, columns, getRowId, selectedId, onRowClick, onCellEdit, onBulkAction, paginationMode, pageSize, searchPlaceholder, searchFields, toolbarChildren, showToolbar, emptyState, className }: EntityTableProps<T>): react_jsx_runtime.JSX.Element;

type ColumnFilterType = "text" | "number" | "date" | "dateRange" | "boolean" | "enum" | "relation" | "none";
interface EntityColumnMeta<TEntity> {
    field: keyof TEntity;
    filterType: ColumnFilterType;
    enumOptions?: Array<{
        label: string;
        value: string;
        color?: string;
    }>;
    relationEntityType?: string;
    editable?: boolean;
    hideable?: boolean;
}
declare module "@tanstack/react-table" {
    interface ColumnMeta<TData, TValue> {
        entityMeta?: EntityColumnMeta<TData>;
    }
}
declare function SortHeader({ column, label }: {
    column: {
        getIsSorted: () => false | "asc" | "desc";
        toggleSorting: (desc?: boolean) => void;
    };
    label: string;
}): react_jsx_runtime.JSX.Element;
declare function selectionColumn$1<T>(): ColumnDef$1<T>;
declare function textColumn$1<T>(opts: {
    field: keyof T & string;
    header: string;
    size?: number;
    editable?: boolean;
    filterType?: ColumnFilterType;
    cell?: (v: string, row: T) => ReactNode;
}): ColumnDef$1<T>;
declare function numberColumn$1<T>(opts: {
    field: keyof T & string;
    header: string;
    size?: number;
    format?: (v: number) => string;
    editable?: boolean;
}): ColumnDef$1<T>;
declare function dateColumn$1<T>(opts: {
    field: keyof T & string;
    header: string;
    size?: number;
    format?: Intl.DateTimeFormatOptions;
}): ColumnDef$1<T>;
declare function booleanColumn$1<T>(opts: {
    field: keyof T & string;
    header: string;
    size?: number;
    trueLabel?: string;
    falseLabel?: string;
}): ColumnDef$1<T>;
declare function enumColumn$1<T>(opts: {
    field: keyof T & string;
    header: string;
    options: Array<{
        value: string;
        label: string;
        className?: string;
    }>;
    size?: number;
    editable?: boolean;
}): ColumnDef$1<T>;
interface ActionItem<T> {
    label: string;
    icon?: React.ComponentType<{
        className?: string;
    }>;
    onClick: (row: T) => void;
    destructive?: boolean;
    separator?: boolean;
    hidden?: (row: T) => boolean;
    disabled?: (row: T) => boolean;
}
declare function actionsColumn$1<T>(actions: ActionItem<T>[]): ColumnDef$1<T>;

/**
 * table/types.ts
 *
 * Pure table engine type definitions — zero external dependencies.
 * Structurally compatible with TanStack Table v8 for easy migration,
 * but fully self-contained within the prometheus-entity-management library.
 */

type ViewMode = "table" | "gallery" | "list";
type Updater<T> = T | ((prev: T) => T);
type AccessorFn<TData, TValue = unknown> = (row: TData, index: number) => TValue;
type HeaderContext<TData> = {
    table: TableInstance<TData>;
    header: Header<TData>;
    column: Column<TData>;
};
type CellContext<TData> = {
    table: TableInstance<TData>;
    row: Row<TData>;
    cell: Cell<TData>;
    column: Column<TData>;
    getValue: <T = unknown>() => T;
    renderValue: <T = unknown>() => T | null;
};
type HeaderRenderer<TData> = string | ((context: HeaderContext<TData>) => React$1.ReactNode);
type CellRenderer<TData> = string | ((context: CellContext<TData>) => React$1.ReactNode);
type FilterFn<TData> = (row: Row<TData>, columnId: string, filterValue: unknown) => boolean;
type SortingFn<TData> = (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => number;
type AggregationFn<TData> = (columnId: string, leafRows: Row<TData>[], childRows: Row<TData>[]) => unknown;
interface ColumnMeta<TData = unknown> {
    entityMeta?: {
        field: keyof TData;
        filterType: "text" | "number" | "date" | "dateRange" | "boolean" | "enum" | "relation" | "none";
        enumOptions?: Array<{
            label: string;
            value: string;
            color?: string;
        }>;
        relationEntityType?: string;
        editable?: boolean;
        hideable?: boolean;
    };
    [key: string]: unknown;
}
interface ColumnDef<TData, TValue = unknown> {
    id?: string;
    accessorKey?: keyof TData & string;
    accessorFn?: AccessorFn<TData, TValue>;
    header?: HeaderRenderer<TData>;
    cell?: CellRenderer<TData>;
    footer?: HeaderRenderer<TData>;
    size?: number;
    minSize?: number;
    maxSize?: number;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    enableHiding?: boolean;
    enablePinning?: boolean;
    enableGrouping?: boolean;
    enableResizing?: boolean;
    filterFn?: FilterFn<TData> | "auto";
    sortingFn?: SortingFn<TData> | "auto";
    aggregationFn?: AggregationFn<TData> | "auto" | "sum" | "min" | "max" | "count" | "mean" | "median" | "unique";
    sortDescFirst?: boolean;
    sortUndefined?: "first" | "last" | false;
    invertSorting?: boolean;
    meta?: ColumnMeta<TData>;
    columns?: ColumnDef<TData, unknown>[];
}
interface SortingColumn {
    id: string;
    desc: boolean;
}
type SortingState = SortingColumn[];
interface ColumnFilter {
    id: string;
    value: unknown;
}
type ColumnFiltersState = ColumnFilter[];
type RowSelectionState = Record<string, boolean>;
type ColumnVisibilityState = Record<string, boolean>;
type ColumnOrderState = string[];
interface ColumnPinningState {
    left?: string[];
    right?: string[];
}
type ColumnSizingState = Record<string, number>;
type ColumnSizingInfoState = {
    startOffset: number | null;
    startSize: number | null;
    deltaOffset: number | null;
    deltaPercentage: number | null;
    isResizingColumn: string | false;
    columnSizingStart: [string, number][];
};
type ExpandedState = Record<string, boolean> | true;
type GroupingState = string[];
interface PaginationState {
    pageIndex: number;
    pageSize: number;
}
interface TableState {
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    globalFilter: unknown;
    rowSelection: RowSelectionState;
    columnVisibility: ColumnVisibilityState;
    columnOrder: ColumnOrderState;
    columnPinning: ColumnPinningState;
    columnSizing: ColumnSizingState;
    columnSizingInfo: ColumnSizingInfoState;
    expanded: ExpandedState;
    grouping: GroupingState;
    pagination: PaginationState;
}
interface Row<TData> {
    id: string;
    index: number;
    original: TData;
    depth: number;
    parentId?: string;
    subRows: Row<TData>[];
    getValue: <T = unknown>(columnId: string) => T;
    renderValue: <T = unknown>(columnId: string) => T | null;
    getIsSelected: () => boolean;
    getCanSelect: () => boolean;
    getIsAllSubRowsSelected: () => boolean;
    getIsSomeSelected: () => boolean;
    toggleSelected: (value?: boolean) => void;
    getToggleSelectedHandler: () => (e: unknown) => void;
    getIsExpanded: () => boolean;
    getCanExpand: () => boolean;
    toggleExpanded: (value?: boolean) => void;
    getToggleExpandedHandler: () => () => void;
    getIsGrouped: () => boolean;
    groupingColumnId?: string;
    groupingValue?: unknown;
    getVisibleCells: () => Cell<TData>[];
    getAllCells: () => Cell<TData>[];
    getIsPinned: () => "top" | "bottom" | false;
    pin: (position: "top" | "bottom" | false) => void;
}
interface Cell<TData> {
    id: string;
    row: Row<TData>;
    column: Column<TData>;
    getValue: <T = unknown>() => T;
    renderValue: <T = unknown>() => T | null;
    getIsGrouped: () => boolean;
    getIsPlaceholder: () => boolean;
    getIsAggregated: () => boolean;
    getContext: () => CellContext<TData>;
}
interface Header<TData> {
    id: string;
    index: number;
    depth: number;
    column: Column<TData>;
    isPlaceholder: boolean;
    placeholderId?: string;
    subHeaders: Header<TData>[];
    colSpan: number;
    rowSpan: number;
    getSize: () => number;
    getStart: () => number;
    getContext: () => HeaderContext<TData>;
    getResizeHandler: () => (event: unknown) => void;
    getLeafHeaders: () => Header<TData>[];
}
interface HeaderGroup<TData> {
    id: string;
    depth: number;
    headers: Header<TData>[];
}
interface Column<TData> {
    id: string;
    depth: number;
    columnDef: ColumnDef<TData>;
    columns: Column<TData>[];
    parent?: Column<TData>;
    getFlatColumns: () => Column<TData>[];
    getLeafColumns: () => Column<TData>[];
    getIsSorted: () => false | "asc" | "desc";
    getNextSortingOrder: () => "asc" | "desc" | false;
    getCanSort: () => boolean;
    toggleSorting: (desc?: boolean, isMulti?: boolean) => void;
    clearSorting: () => void;
    getSortIndex: () => number;
    getAutoSortingFn: () => SortingFn<TData>;
    getAutoSortDir: () => "asc" | "desc";
    getIsFiltered: () => boolean;
    getFilterValue: () => unknown;
    setFilterValue: (value: unknown) => void;
    getCanFilter: () => boolean;
    getAutoFilterFn: () => FilterFn<TData> | undefined;
    getIsVisible: () => boolean;
    toggleVisibility: (value?: boolean) => void;
    getCanHide: () => boolean;
    getIsPinned: () => "left" | "right" | false;
    pin: (position: "left" | "right" | false) => void;
    getCanPin: () => boolean;
    getIsGrouped: () => boolean;
    toggleGrouping: () => void;
    getCanGroup: () => boolean;
    getGroupedIndex: () => number;
    getSize: () => number;
    getStart: (position?: "left" | "center" | "right") => number;
    getCanResize: () => boolean;
    resetSize: () => void;
    getIndex: (position?: "left" | "center" | "right") => number;
}
interface RowModel<TData> {
    rows: Row<TData>[];
    flatRows: Row<TData>[];
    rowsById: Record<string, Row<TData>>;
}
interface TableOptions<TData> {
    data: TData[];
    columns: ColumnDef<TData>[];
    getRowId?: (row: TData, index: number, parent?: Row<TData>) => string;
    defaultColumn?: Partial<ColumnDef<TData>>;
    /** Seed the initial value for any internal state slice without making it controlled. */
    initialState?: Partial<TableState>;
    /** Fully controlled state — every key provided here locks that slice and must be updated externally. */
    state?: Partial<TableState>;
    onStateChange?: (updater: Updater<TableState>) => void;
    manualSorting?: boolean;
    enableSorting?: boolean;
    enableMultiSort?: boolean;
    enableSortingRemoval?: boolean;
    enableMultiRemove?: boolean;
    maxMultiSortColCount?: number;
    sortDescFirst?: boolean;
    onSortingChange?: (updater: Updater<SortingState>) => void;
    manualFiltering?: boolean;
    enableFiltering?: boolean;
    enableColumnFilters?: boolean;
    enableGlobalFilter?: boolean;
    globalFilterFn?: FilterFn<TData>;
    onColumnFiltersChange?: (updater: Updater<ColumnFiltersState>) => void;
    onGlobalFilterChange?: (updater: Updater<unknown>) => void;
    manualPagination?: boolean;
    pageCount?: number;
    autoResetPageIndex?: boolean;
    onPaginationChange?: (updater: Updater<PaginationState>) => void;
    enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
    enableMultiRowSelection?: boolean | ((row: Row<TData>) => boolean);
    enableSubRowSelection?: boolean | ((row: Row<TData>) => boolean);
    onRowSelectionChange?: (updater: Updater<RowSelectionState>) => void;
    enableHiding?: boolean;
    onColumnVisibilityChange?: (updater: Updater<ColumnVisibilityState>) => void;
    onColumnOrderChange?: (updater: Updater<ColumnOrderState>) => void;
    enablePinning?: boolean;
    onColumnPinningChange?: (updater: Updater<ColumnPinningState>) => void;
    enableColumnResizing?: boolean;
    columnResizeMode?: "onChange" | "onEnd";
    columnResizeDirection?: "ltr" | "rtl";
    onColumnSizingChange?: (updater: Updater<ColumnSizingState>) => void;
    onColumnSizingInfoChange?: (updater: Updater<ColumnSizingInfoState>) => void;
    manualGrouping?: boolean;
    enableGrouping?: boolean;
    onGroupingChange?: (updater: Updater<GroupingState>) => void;
    manualExpanding?: boolean;
    enableExpanding?: boolean;
    getSubRows?: (row: TData, index: number) => TData[] | undefined;
    getIsRowExpanded?: (row: Row<TData>) => boolean;
    onExpandedChange?: (updater: Updater<ExpandedState>) => void;
    paginateExpandedRows?: boolean;
    enableRowPinning?: boolean | ((row: Row<TData>) => boolean);
    keepPinnedRows?: boolean;
    onRowPinningChange?: (updater: Updater<Record<string, "top" | "bottom">>) => void;
}
interface TableInstance<TData> {
    options: TableOptions<TData>;
    getState: () => TableState;
    setState: (updater: Updater<TableState>) => void;
    reset: () => void;
    getAllColumns: () => Column<TData>[];
    getAllFlatColumns: () => Column<TData>[];
    getAllLeafColumns: () => Column<TData>[];
    getColumn: (id: string) => Column<TData> | undefined;
    getHeaderGroups: () => HeaderGroup<TData>[];
    getLeftHeaderGroups: () => HeaderGroup<TData>[];
    getCenterHeaderGroups: () => HeaderGroup<TData>[];
    getRightHeaderGroups: () => HeaderGroup<TData>[];
    getFooterGroups: () => HeaderGroup<TData>[];
    getCoreRowModel: () => RowModel<TData>;
    getRowModel: () => RowModel<TData>;
    getPreFilteredRowModel: () => RowModel<TData>;
    getFilteredRowModel: () => RowModel<TData>;
    getPreSortedRowModel: () => RowModel<TData>;
    getSortedRowModel: () => RowModel<TData>;
    getGroupedRowModel: () => RowModel<TData>;
    getExpandedRowModel: () => RowModel<TData>;
    getPrePaginationRowModel: () => RowModel<TData>;
    getPaginationRowModel: () => RowModel<TData>;
    getSelectedRowModel: () => RowModel<TData>;
    getRow: (id: string) => Row<TData>;
    setSorting: (updater: Updater<SortingState>) => void;
    resetSorting: (defaultState?: boolean) => void;
    setColumnFilters: (updater: Updater<ColumnFiltersState>) => void;
    resetColumnFilters: (defaultState?: boolean) => void;
    setGlobalFilter: (value: unknown) => void;
    resetGlobalFilter: (defaultState?: boolean) => void;
    setPageIndex: (updater: Updater<number>) => void;
    resetPageIndex: (defaultState?: boolean) => void;
    setPageSize: (updater: Updater<number>) => void;
    resetPageSize: (defaultState?: boolean) => void;
    getPageCount: () => number;
    getCanPreviousPage: () => boolean;
    getCanNextPage: () => boolean;
    previousPage: () => void;
    nextPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
    setRowSelection: (updater: Updater<RowSelectionState>) => void;
    resetRowSelection: (defaultState?: boolean) => void;
    toggleAllRowsSelected: (value?: boolean) => void;
    toggleAllPageRowsSelected: (value?: boolean) => void;
    getIsAllRowsSelected: () => boolean;
    getIsAllPageRowsSelected: () => boolean;
    getIsSomeRowsSelected: () => boolean;
    getIsSomePageRowsSelected: () => boolean;
    getToggleAllRowsSelectedHandler: () => (e: unknown) => void;
    getToggleAllPageRowsSelectedHandler: () => (e: unknown) => void;
    setColumnVisibility: (updater: Updater<ColumnVisibilityState>) => void;
    resetColumnVisibility: (defaultState?: boolean) => void;
    toggleAllColumnsVisible: (value?: boolean) => void;
    getIsAllColumnsVisible: () => boolean;
    getIsSomeColumnsVisible: () => boolean;
    getToggleAllColumnsVisibilityHandler: () => (e: unknown) => void;
    getVisibleFlatColumns: () => Column<TData>[];
    getVisibleLeafColumns: () => Column<TData>[];
    setColumnOrder: (updater: Updater<ColumnOrderState>) => void;
    resetColumnOrder: (defaultState?: boolean) => void;
    setColumnPinning: (updater: Updater<ColumnPinningState>) => void;
    resetColumnPinning: (defaultState?: boolean) => void;
    getLeftFlatColumns: () => Column<TData>[];
    getRightFlatColumns: () => Column<TData>[];
    getCenterFlatColumns: () => Column<TData>[];
    getLeftLeafColumns: () => Column<TData>[];
    getRightLeafColumns: () => Column<TData>[];
    getCenterLeafColumns: () => Column<TData>[];
    setColumnSizing: (updater: Updater<ColumnSizingState>) => void;
    setColumnSizingInfo: (updater: Updater<ColumnSizingInfoState>) => void;
    resetColumnSizing: (defaultState?: boolean) => void;
    setGrouping: (updater: Updater<GroupingState>) => void;
    resetGrouping: (defaultState?: boolean) => void;
    setExpanded: (updater: Updater<ExpandedState>) => void;
    resetExpanded: (defaultState?: boolean) => void;
    toggleAllRowsExpanded: (expanded?: boolean) => void;
    getIsAllRowsExpanded: () => boolean;
    getIsSomeRowsExpanded: () => boolean;
    getCanSomeRowsExpand: () => boolean;
    getExpandedDepth: () => number;
}
interface ActionDef<TData> {
    id: string;
    label: string;
    icon?: React$1.ComponentType<{
        className?: string;
    }>;
    onClick: (item: TData) => void;
    destructive?: boolean;
    hidden?: (item: TData) => boolean;
    disabled?: (item: TData) => boolean;
    confirm?: string | ((item: TData) => string);
    variant?: "primary" | "default" | "ghost" | "destructive";
}
interface ItemDescriptorBadge<TData> {
    field: keyof TData & string;
    options?: Array<{
        value: string;
        label: string;
        className?: string;
    }>;
}
interface ItemDescriptorMeta<TData> {
    field: keyof TData & string;
    label: string;
    format?: (value: unknown) => string;
}
interface ItemDescriptor<TData> {
    title: keyof TData & string;
    subtitle?: keyof TData & string;
    image?: keyof TData & string;
    icon?: (keyof TData & string) | React$1.ComponentType<{
        className?: string;
    }>;
    avatar?: keyof TData & string;
    badges?: ItemDescriptorBadge<TData>[];
    metadata?: ItemDescriptorMeta<TData>[];
    description?: keyof TData & string;
}
interface ItemRenderContext<TData> {
    isSelected: boolean;
    isEditing: boolean;
    isMultiSelectMode: boolean;
    onToggleSelect: () => void;
    onEdit: () => void;
    onSave: (changes: Partial<TData>) => void;
    onCancel: () => void;
    actions: ActionDef<TData>[];
    row: Row<TData>;
}
interface EmptyStateConfig {
    icon?: React$1.ComponentType<{
        className?: string;
    }>;
    title?: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    filteredTitle?: string;
    filteredDescription?: string;
    filteredAction?: {
        label: string;
        onClick: () => void;
    };
}
interface BatchActionDef {
    id: string;
    label: string;
    icon?: React$1.ComponentType<{
        className?: string;
    }>;
    destructive?: boolean;
}
interface GalleryColumns {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
}

declare function useTable<TData extends object>(options: TableOptions<TData>): TableInstance<TData>;

/**
 * table/row-models.ts
 *
 * Pure row model pipeline functions. Each stage transforms data
 * into a RowModel — no side effects, no external dependencies.
 */

declare function createRow<TData>(original: TData, index: number, columns: Column<TData>[], table: TableInstance<TData>, depth?: number, parentId?: string, subRows?: Row<TData>[]): Row<TData>;
declare function getCoreRowModel<TData>(data: TData[], columns: Column<TData>[], table: TableInstance<TData>): RowModel<TData>;
declare function getFilteredRowModel<TData>(rowModel: RowModel<TData>, columnFilters: ColumnFiltersState, globalFilter: unknown, columns: Column<TData>[], globalFilterFn?: FilterFn<TData>): RowModel<TData>;
declare function getSortedRowModel<TData>(rowModel: RowModel<TData>, sorting: SortingState, columns: Column<TData>[]): RowModel<TData>;
declare function getGroupedRowModel<TData>(rowModel: RowModel<TData>, grouping: GroupingState, columns: Column<TData>[], table: TableInstance<TData>): RowModel<TData>;
declare function getExpandedRowModel<TData>(rowModel: RowModel<TData>, expanded: ExpandedState): RowModel<TData>;
declare function getPaginatedRowModel<TData>(rowModel: RowModel<TData>, pagination: PaginationState): RowModel<TData>;
declare function getSelectedRowModel<TData>(rowModel: RowModel<TData>, selection: Record<string, boolean>): RowModel<TData>;

/**
 * table/faceting.ts
 *
 * Column faceting utilities — compute unique values, counts,
 * and min/max for filter UI controls.
 */

/**
 * Compute unique values and their counts for a given column.
 * Useful for rendering filter dropdown options with hit counts.
 */
declare function getFacetedUniqueValues<TData>(rowModel: RowModel<TData>, columnId: string): Map<unknown, number>;
/**
 * Compute min and max numeric values for a given column.
 * Returns [min, max] or undefined if no numeric values exist.
 */
declare function getFacetedMinMaxValues<TData>(rowModel: RowModel<TData>, columnId: string): [number, number] | undefined;
/**
 * Get a filtered row model scoped to a single column's facet.
 * Returns a row model that excludes the given column's own filter,
 * so the facet counts reflect what would be available if that
 * specific filter were removed.
 */
declare function getFacetedRowModel<TData>(preFilteredRowModel: RowModel<TData>, columnId: string, allFilteredRowModel: RowModel<TData>): RowModel<TData>;

/**
 * table/selection-store.ts
 *
 * Zustand store for multi-select state, shared across all view modes.
 * Each EntityListView instance creates its own store via createSelectionStore()
 * so multiple lists on the same page don't interfere.
 */

interface SelectionStoreState {
    selectedIds: Set<string>;
    isMultiSelectMode: boolean;
    toggle: (id: string) => void;
    select: (id: string) => void;
    deselect: (id: string) => void;
    selectAll: (ids: string[]) => void;
    deselectAll: () => void;
    setMultiSelectMode: (enabled: boolean) => void;
    toggleMultiSelectMode: () => void;
    isSelected: (id: string) => boolean;
    selectedCount: () => number;
    getSelectedIds: () => string[];
}
declare function createSelectionStore(): StoreApi<SelectionStoreState>;
declare function useSelectionStore<T>(store: StoreApi<SelectionStoreState>, selector: (state: SelectionStoreState) => T): T;
declare const SelectionContext: React$1.Context<StoreApi<SelectionStoreState> | null>;
declare function useSelectionContext(): StoreApi<SelectionStoreState>;

interface FilterPreset {
    id: string;
    name: string;
    description?: string;
    filter: FilterSpec;
    sort?: SortSpec;
    search?: {
        query: string;
        fields: string[];
    };
    isDefault?: boolean;
    createdAt: string;
    updatedAt: string;
}
interface ColumnPresetEntry {
    id: string;
    visible: boolean;
    width?: number;
    minWidth?: number;
    order: number;
    pinned?: "left" | "right" | false;
    formatOptions?: Record<string, unknown>;
}
interface ColumnPreset {
    id: string;
    name: string;
    description?: string;
    columns: ColumnPresetEntry[];
    isDefault?: boolean;
    createdAt: string;
    updatedAt: string;
}
type PresetChangeOperation = "created" | "updated" | "deleted";
interface PresetChangeEvent {
    tableId: string;
    presetType: "filter" | "column";
    presetId: string;
    operation: PresetChangeOperation;
    preset?: FilterPreset | ColumnPreset;
    source: "local" | "remote";
    timestamp: number;
}
interface ActivePresets {
    filterId?: string;
    columnId?: string;
    viewMode?: ViewMode;
}
type UnsubscribeFn = () => void;

/**
 * table/presets/storage.ts
 *
 * Pluggable storage adapter interface for preset persistence.
 * Adapters implement CRUD + optional realtime subscription.
 */

interface TableStorageAdapter {
    loadFilterPresets(tableId: string): Promise<FilterPreset[]>;
    saveFilterPreset(tableId: string, preset: FilterPreset): Promise<void>;
    deleteFilterPreset(tableId: string, presetId: string): Promise<void>;
    loadColumnPresets(tableId: string): Promise<ColumnPreset[]>;
    saveColumnPreset(tableId: string, preset: ColumnPreset): Promise<void>;
    deleteColumnPreset(tableId: string, presetId: string): Promise<void>;
    loadActivePresets(tableId: string): Promise<ActivePresets>;
    saveActivePresets(tableId: string, active: ActivePresets): Promise<void>;
    subscribe?(tableId: string, callback: (event: PresetChangeEvent) => void): UnsubscribeFn;
}

/**
 * table/presets/preset-store.ts
 *
 * Zustand store for reactive preset state across all tables.
 * Holds loaded presets, active selections, pending remote changes,
 * and the configurable auto-apply vs notify behavior.
 */

interface TablePresetSlice {
    filters: FilterPreset[];
    columns: ColumnPreset[];
    activeFilterId: string | null;
    activeColumnId: string | null;
    activeViewMode: ViewMode;
}
interface PresetStoreState {
    presets: Record<string, TablePresetSlice>;
    pendingChanges: PresetChangeEvent[];
    realtimeMode: "auto-apply" | "notify";
    getTablePresets: (tableId: string) => TablePresetSlice;
    loadPresets: (tableId: string, adapter: TableStorageAdapter) => Promise<void>;
    applyFilterPreset: (tableId: string, presetId: string | null) => void;
    applyColumnPreset: (tableId: string, presetId: string | null) => void;
    setViewMode: (tableId: string, mode: ViewMode) => void;
    saveFilterPreset: (tableId: string, preset: FilterPreset, adapter: TableStorageAdapter) => Promise<void>;
    saveColumnPreset: (tableId: string, preset: ColumnPreset, adapter: TableStorageAdapter) => Promise<void>;
    deleteFilterPreset: (tableId: string, presetId: string, adapter: TableStorageAdapter) => Promise<void>;
    deleteColumnPreset: (tableId: string, presetId: string, adapter: TableStorageAdapter) => Promise<void>;
    handleRemoteChange: (event: PresetChangeEvent, adapter: TableStorageAdapter) => void;
    acknowledgePendingChange: (index: number) => void;
    dismissPendingChanges: (tableId: string) => void;
}
declare function createPresetStore(realtimeMode?: "auto-apply" | "notify"): StoreApi<PresetStoreState>;

/**
 * table/presets/memory-adapter.ts
 *
 * In-memory storage adapter — zero-config default.
 * Data lives only for the session lifetime.
 */

declare class MemoryAdapter implements TableStorageAdapter {
    private filters;
    private columns;
    private active;
    loadFilterPresets(tableId: string): Promise<FilterPreset[]>;
    saveFilterPreset(tableId: string, preset: FilterPreset): Promise<void>;
    deleteFilterPreset(tableId: string, presetId: string): Promise<void>;
    loadColumnPresets(tableId: string): Promise<ColumnPreset[]>;
    saveColumnPreset(tableId: string, preset: ColumnPreset): Promise<void>;
    deleteColumnPreset(tableId: string, presetId: string): Promise<void>;
    loadActivePresets(tableId: string): Promise<ActivePresets>;
    saveActivePresets(tableId: string, active: ActivePresets): Promise<void>;
}

interface ZustandPresetState {
    tables: Record<string, {
        filters: FilterPreset[];
        columns: ColumnPreset[];
        active: ActivePresets;
    }>;
}
interface ZustandAdapterOptions {
    storageKey?: string;
    storage?: PersistStorage<ZustandPresetState>;
}
declare class ZustandPersistAdapter implements TableStorageAdapter {
    private store;
    private listeners;
    constructor(options?: ZustandAdapterOptions);
    private getTable;
    private setTable;
    private emit;
    loadFilterPresets(tableId: string): Promise<FilterPreset[]>;
    saveFilterPreset(tableId: string, preset: FilterPreset): Promise<void>;
    deleteFilterPreset(tableId: string, presetId: string): Promise<void>;
    loadColumnPresets(tableId: string): Promise<ColumnPreset[]>;
    saveColumnPreset(tableId: string, preset: ColumnPreset): Promise<void>;
    deleteColumnPreset(tableId: string, presetId: string): Promise<void>;
    loadActivePresets(tableId: string): Promise<ActivePresets>;
    saveActivePresets(tableId: string, active: ActivePresets): Promise<void>;
    subscribe(tableId: string, callback: (event: PresetChangeEvent) => void): UnsubscribeFn;
}

/**
 * table/presets/rest-adapter.ts
 *
 * REST API storage adapter with optional polling or SSE for realtime updates.
 * Requires a REST endpoint that stores presets per table ID.
 */

interface RestAdapterOptions {
    baseUrl: string;
    headers?: Record<string, string> | (() => Record<string, string>);
    pollInterval?: number;
    sseEndpoint?: string;
}
declare class RestApiAdapter implements TableStorageAdapter {
    private baseUrl;
    private headers;
    private pollInterval?;
    private sseEndpoint?;
    constructor(options: RestAdapterOptions);
    private getHeaders;
    loadFilterPresets(tableId: string): Promise<FilterPreset[]>;
    saveFilterPreset(tableId: string, preset: FilterPreset): Promise<void>;
    deleteFilterPreset(tableId: string, presetId: string): Promise<void>;
    loadColumnPresets(tableId: string): Promise<ColumnPreset[]>;
    saveColumnPreset(tableId: string, preset: ColumnPreset): Promise<void>;
    deleteColumnPreset(tableId: string, presetId: string): Promise<void>;
    loadActivePresets(tableId: string): Promise<ActivePresets>;
    saveActivePresets(tableId: string, active: ActivePresets): Promise<void>;
    subscribe(tableId: string, callback: (event: PresetChangeEvent) => void): UnsubscribeFn;
    private subscribeSSE;
    private subscribePoll;
}

/**
 * table/presets/supabase-adapter.ts
 *
 * Supabase Realtime adapter for preset persistence.
 * Subscribes to a `table_presets` table for live changes.
 *
 * Uses type-only imports; the Supabase client is a peer dependency.
 */

interface SupabaseClient {
    from: (table: string) => {
        select: (columns?: string) => {
            eq: (col: string, val: string) => {
                eq: (col: string, val: string) => Promise<{
                    data: unknown[] | null;
                    error: unknown;
                }>;
                single: () => Promise<{
                    data: unknown | null;
                    error: unknown;
                }>;
            } & Promise<{
                data: unknown[] | null;
                error: unknown;
            }>;
        };
        upsert: (data: unknown) => Promise<{
            error: unknown;
        }>;
        delete: () => {
            eq: (col: string, val: string) => {
                eq: (col: string, val: string) => Promise<{
                    error: unknown;
                }>;
            };
        };
    };
    channel: (name: string) => {
        on: (event: string, config: Record<string, unknown>, callback: (payload: Record<string, unknown>) => void) => {
            subscribe: () => {
                unsubscribe: () => void;
            };
        };
    };
}
interface SupabaseAdapterOptions {
    supabaseClient: SupabaseClient;
    tableName?: string;
    userId?: string;
}
declare class SupabaseRealtimeAdapter implements TableStorageAdapter {
    private client;
    private tableName;
    private userId;
    constructor(options: SupabaseAdapterOptions);
    loadFilterPresets(tableId: string): Promise<FilterPreset[]>;
    saveFilterPreset(tableId: string, preset: FilterPreset): Promise<void>;
    deleteFilterPreset(tableId: string, presetId: string): Promise<void>;
    loadColumnPresets(tableId: string): Promise<ColumnPreset[]>;
    saveColumnPreset(tableId: string, preset: ColumnPreset): Promise<void>;
    deleteColumnPreset(tableId: string, presetId: string): Promise<void>;
    loadActivePresets(tableId: string): Promise<ActivePresets>;
    saveActivePresets(tableId: string, active: ActivePresets): Promise<void>;
    subscribe(tableId: string, callback: (event: PresetChangeEvent) => void): UnsubscribeFn;
}

/**
 * table/presets/electricsql-adapter.ts
 *
 * ElectricSQL / PGlite adapter for local-first preset persistence.
 * Uses type-only imports; PGlite is a peer/optional dependency.
 */

interface PGliteInstance {
    query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<{
        rows: T[];
    }>;
    exec: (sql: string) => Promise<void>;
    listen?: (channel: string, callback: (payload: string) => void) => Promise<() => void>;
}
interface ElectricSQLAdapterOptions {
    db: PGliteInstance;
    tableName?: string;
}
declare class ElectricSQLAdapter implements TableStorageAdapter {
    private db;
    private tableName;
    private initialized;
    constructor(options: ElectricSQLAdapterOptions);
    private ensureTable;
    private makeId;
    loadFilterPresets(tableId: string): Promise<FilterPreset[]>;
    saveFilterPreset(tableId: string, preset: FilterPreset): Promise<void>;
    deleteFilterPreset(tableId: string, presetId: string): Promise<void>;
    loadColumnPresets(tableId: string): Promise<ColumnPreset[]>;
    saveColumnPreset(tableId: string, preset: ColumnPreset): Promise<void>;
    deleteColumnPreset(tableId: string, presetId: string): Promise<void>;
    loadActivePresets(tableId: string): Promise<ActivePresets>;
    saveActivePresets(tableId: string, active: ActivePresets): Promise<void>;
    subscribe(tableId: string, callback: (event: PresetChangeEvent) => void): UnsubscribeFn;
}

interface UseTablePresetsOptions {
    adapter?: TableStorageAdapter;
    realtimeMode?: "auto-apply" | "notify";
    enabled?: boolean;
}
interface UseTablePresetsResult {
    filterPresets: FilterPreset[];
    columnPresets: ColumnPreset[];
    activeFilterPreset: FilterPreset | null;
    activeColumnPreset: ColumnPreset | null;
    activeViewMode: ViewMode;
    pendingChanges: PresetChangeEvent[];
    applyFilterPreset: (id: string | null) => void;
    applyColumnPreset: (id: string | null) => void;
    setViewMode: (mode: ViewMode) => void;
    saveFilterPreset: (preset: Omit<FilterPreset, "id" | "createdAt" | "updatedAt">) => Promise<void>;
    updateFilterPreset: (id: string, patch: Partial<FilterPreset>) => Promise<void>;
    saveColumnPreset: (preset: Omit<ColumnPreset, "id" | "createdAt" | "updatedAt">) => Promise<void>;
    updateColumnPreset: (id: string, patch: Partial<ColumnPreset>) => Promise<void>;
    deleteFilterPreset: (id: string) => Promise<void>;
    deleteColumnPreset: (id: string) => Promise<void>;
    acknowledgePendingChange: (index: number) => void;
    dismissPendingChanges: () => void;
    isLoading: boolean;
    isSubscribed: boolean;
}
declare function useTablePresets(tableId: string, options?: UseTablePresetsOptions): UseTablePresetsResult;

interface TableStorageProviderProps {
    adapter: TableStorageAdapter;
    realtimeMode?: "auto-apply" | "notify";
    children: React$1.ReactNode;
}
declare function TableStorageProvider({ adapter, realtimeMode, children, }: TableStorageProviderProps): react_jsx_runtime.JSX.Element;
declare function useTableStorageAdapter(): TableStorageAdapter;
declare function useTableRealtimeMode(): "auto-apply" | "notify";

interface EntityListViewProps<TData extends object> {
    data?: TData[];
    viewResult?: {
        items: TData[];
        isFetching?: boolean;
        total?: number;
    };
    columns: ColumnDef<TData>[];
    itemDescriptor?: ItemDescriptor<TData>;
    renderCard?: (item: TData, context: ItemRenderContext<TData>) => React$1.ReactNode;
    renderItem?: (item: TData, context: ItemRenderContext<TData>) => React$1.ReactNode;
    defaultViewMode?: ViewMode;
    enabledViewModes?: ViewMode[];
    actions?: ActionDef<TData>[];
    onAction?: (action: string, item: TData) => void;
    enableMultiSelect?: boolean;
    onBatchAction?: (action: string, selectedItems: TData[]) => void;
    batchActions?: BatchActionDef[];
    enableInlineEdit?: boolean;
    onInlineEdit?: (item: TData, field: string, value: unknown) => void | Promise<void>;
    onInlineSave?: (item: TData, changes: Partial<TData>) => void | Promise<void>;
    emptyState?: React$1.ReactNode | EmptyStateConfig;
    tableId?: string;
    enablePresets?: boolean;
    getRowId?: (row: TData) => string;
    paginationMode?: "none" | "loadMore" | "pages";
    pageSize?: number;
    galleryColumns?: GalleryColumns;
    enableColumnResizing?: boolean;
    enableColumnPinning?: boolean;
    enableGrouping?: boolean;
    enableSearch?: boolean;
    onRefresh?: () => void;
    className?: string;
}
declare function EntityListView<TData extends object>(props: EntityListViewProps<TData>): react_jsx_runtime.JSX.Element;

interface DataTableProps<TData extends object> {
    table: TableInstance<TData>;
    actions?: ActionDef<TData>[];
    enableInlineEdit?: boolean;
    onInlineSave?: (item: TData, field: string, value: unknown) => void | Promise<void>;
    selectionStore?: StoreApi<SelectionStoreState>;
    enableMultiSelect?: boolean;
    getRowId?: (row: TData) => string;
    className?: string;
}
declare function DataTable<TData extends object>({ table, actions, enableInlineEdit, onInlineSave, selectionStore, enableMultiSelect, getRowId, className, }: DataTableProps<TData>): react_jsx_runtime.JSX.Element;

interface GalleryViewProps<TData extends object> {
    rows: Row<TData>[];
    columns: ColumnDef<TData>[];
    itemDescriptor?: ItemDescriptor<TData>;
    renderCard?: (item: TData, context: ItemRenderContext<TData>) => ReactNode;
    actions?: ActionDef<TData>[];
    enableInlineEdit?: boolean;
    onInlineSave?: (item: TData, changes: Partial<TData>) => void | Promise<void>;
    selectionStore?: StoreApi<SelectionStoreState>;
    enableMultiSelect?: boolean;
    getRowId?: (row: TData) => string;
    galleryColumns?: GalleryColumns;
    className?: string;
}
declare function GalleryView<TData extends object>({ rows, columns, itemDescriptor, renderCard, actions, enableInlineEdit, onInlineSave, selectionStore, enableMultiSelect, getRowId, galleryColumns, className, }: GalleryViewProps<TData>): react_jsx_runtime.JSX.Element;

interface ListViewProps<TData extends object> {
    rows: Row<TData>[];
    columns: ColumnDef<TData>[];
    itemDescriptor?: ItemDescriptor<TData>;
    renderItem?: (item: TData, context: ItemRenderContext<TData>) => ReactNode;
    actions?: ActionDef<TData>[];
    enableInlineEdit?: boolean;
    onInlineSave?: (item: TData, changes: Partial<TData>) => void | Promise<void>;
    selectionStore?: StoreApi<SelectionStoreState>;
    enableMultiSelect?: boolean;
    getRowId?: (row: TData) => string;
    className?: string;
}
declare function ListView<TData extends object>({ rows, columns, itemDescriptor, renderItem, actions, enableInlineEdit, onInlineSave, selectionStore, enableMultiSelect, getRowId, className, }: ListViewProps<TData>): react_jsx_runtime.JSX.Element;

interface ViewModeSwitcherProps {
    mode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
    enabledModes?: ViewMode[];
    className?: string;
}
declare function ViewModeSwitcher({ mode, onModeChange, enabledModes, className, }: ViewModeSwitcherProps): react_jsx_runtime.JSX.Element | null;

interface DataTableToolbarProps<TData> {
    table: TableInstance<TData>;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    enabledViewModes?: ViewMode[];
    enableSearch?: boolean;
    onRefresh?: () => void;
    showColumnVisibility?: boolean;
    className?: string;
    children?: ReactNode;
}
declare function DataTableToolbar<TData>({ table, viewMode, onViewModeChange, enabledViewModes, enableSearch, onRefresh, showColumnVisibility, className, children, }: DataTableToolbarProps<TData>): react_jsx_runtime.JSX.Element;

interface DataTablePaginationProps<TData> {
    table: TableInstance<TData>;
    mode?: "pages" | "loadMore" | "none";
    pageSizeOptions?: number[];
    onLoadMore?: () => void;
    totalCount?: number;
    className?: string;
}
declare function DataTablePagination<TData>({ table, mode, pageSizeOptions, onLoadMore, totalCount, className, }: DataTablePaginationProps<TData>): react_jsx_runtime.JSX.Element | null;

interface DataTableColumnHeaderProps<TData> {
    column: Column<TData>;
    title: string;
    className?: string;
}
declare function DataTableColumnHeader<TData>({ column, title, className, }: DataTableColumnHeaderProps<TData>): react_jsx_runtime.JSX.Element;

interface DataTableFilterProps<TData> {
    column: Column<TData>;
    className?: string;
}
declare function DataTableFilter<TData>({ column, className, }: DataTableFilterProps<TData>): react_jsx_runtime.JSX.Element;

declare function viewAction<T>(opts: {
    onClick: (item: T) => void;
    label?: string;
}): ActionDef<T>;
declare function editAction<T>(opts: {
    onClick: (item: T) => void;
    label?: string;
}): ActionDef<T>;
declare function deleteAction<T>(opts: {
    onClick: (item: T) => void;
    label?: string;
    confirm?: string;
}): ActionDef<T>;
interface ActionDropdownProps<T> {
    item: T;
    actions: ActionDef<T>[];
    className?: string;
}
declare function ActionDropdown<T>({ item, actions, className, }: ActionDropdownProps<T>): react_jsx_runtime.JSX.Element | null;
interface ActionButtonRowProps<T> {
    item: T;
    actions: ActionDef<T>[];
    maxVisible?: number;
    className?: string;
}
declare function ActionButtonRow<T>({ item, actions, maxVisible, className, }: ActionButtonRowProps<T>): react_jsx_runtime.JSX.Element;

interface InlineCellEditorProps<TData> {
    value: unknown;
    columnDef: ColumnDef<TData>;
    onSave: (value: unknown) => void;
    onCancel: () => void;
    className?: string;
    /** Associates the control with a `<label htmlFor>` in parent forms. */
    inputId?: string;
    /** Accessible name for the control (required when used without a visible label). */
    ariaLabel?: string;
}
declare function InlineCellEditor<TData>({ value: initialValue, columnDef, onSave, onCancel, className, inputId, ariaLabel, }: InlineCellEditorProps<TData>): react_jsx_runtime.JSX.Element;
interface InlineItemEditorProps<TData extends object> {
    item: TData;
    columns: ColumnDef<TData>[];
    itemDescriptor?: ItemDescriptor<TData>;
    onSave: (changes: Partial<TData>) => void;
    onCancel: () => void;
    className?: string;
}
declare function InlineItemEditor<TData extends object>({ item, columns, itemDescriptor: _itemDescriptor, onSave, onCancel, className, }: InlineItemEditorProps<TData>): react_jsx_runtime.JSX.Element;

interface MultiSelectBarProps {
    store: StoreApi<SelectionStoreState>;
    batchActions?: BatchActionDef[];
    onBatchAction?: (actionId: string, selectedIds: string[]) => void;
    totalCount?: number;
    className?: string;
}
declare function MultiSelectBar({ store, batchActions, onBatchAction, totalCount, className, }: MultiSelectBarProps): react_jsx_runtime.JSX.Element | null;

interface EmptyStateProps {
    config?: EmptyStateConfig | React$1.ReactNode;
    isFiltered?: boolean;
    className?: string;
}
declare function EmptyState({ config, isFiltered, className }: EmptyStateProps): react_jsx_runtime.JSX.Element;

interface FilterPresetDialogProps<TData> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    columns: ColumnDef<TData>[];
    preset?: FilterPreset | null;
    onSave: (preset: Omit<FilterPreset, "id" | "createdAt" | "updatedAt">) => void;
}
declare function FilterPresetDialog<TData>({ open, onOpenChange, columns, preset, onSave, }: FilterPresetDialogProps<TData>): react_jsx_runtime.JSX.Element | null;

interface ColumnPresetDialogProps<TData> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    columns: ColumnDef<TData>[];
    preset?: ColumnPreset | null;
    onSave: (preset: Omit<ColumnPreset, "id" | "createdAt" | "updatedAt">) => void;
}
declare function ColumnPresetDialog<TData>({ open, onOpenChange, columns, preset, onSave, }: ColumnPresetDialogProps<TData>): react_jsx_runtime.JSX.Element | null;

interface PresetPickerProps {
    filterPresets: FilterPreset[];
    columnPresets: ColumnPreset[];
    activeFilterId: string | null;
    activeColumnId: string | null;
    onApplyFilter: (id: string | null) => void;
    onApplyColumn: (id: string | null) => void;
    onEditFilter: (preset: FilterPreset) => void;
    onEditColumn: (preset: ColumnPreset) => void;
    onDeleteFilter: (id: string) => void;
    onDeleteColumn: (id: string) => void;
    onNewFilter: () => void;
    onNewColumn: () => void;
    pendingChangesCount?: number;
    className?: string;
}
declare function PresetPicker({ filterPresets, columnPresets, activeFilterId, activeColumnId, onApplyFilter, onApplyColumn, onEditFilter, onEditColumn, onDeleteFilter, onDeleteColumn, onNewFilter, onNewColumn, pendingChangesCount, className, }: PresetPickerProps): react_jsx_runtime.JSX.Element;

/**
 * ui/pure-columns.tsx
 *
 * Column builder functions that return the pure ColumnDef type
 * from src/table/types.ts — parallel to existing TanStack-based columns.tsx.
 */

interface BaseColumnOptions<TData> {
    field: keyof TData & string;
    header: string;
    size?: number;
    minSize?: number;
    maxSize?: number;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    enableHiding?: boolean;
    enableResizing?: boolean;
    enablePinning?: boolean;
    editable?: boolean;
    cell?: (context: CellContext<TData>) => React$1.ReactNode;
}
interface EnumOption {
    label: string;
    value: string;
    /** Hex color — legacy bordered-badge approach (outline only). */
    color?: string;
    /** Full Tailwind class string — renders a solid flat badge with no border. */
    badgeClassName?: string;
}
declare function selectionColumn<TData>(): ColumnDef<TData>;
declare function textColumn<TData>(options: BaseColumnOptions<TData>): ColumnDef<TData>;
declare function numberColumn<TData>(options: BaseColumnOptions<TData>): ColumnDef<TData>;
declare function dateColumn<TData>(options: BaseColumnOptions<TData> & {
    format?: (date: Date) => string;
}): ColumnDef<TData>;
declare function booleanColumn<TData>(options: BaseColumnOptions<TData> & {
    trueLabel?: string;
    falseLabel?: string;
}): ColumnDef<TData>;
declare function enumColumn<TData>(options: BaseColumnOptions<TData> & {
    options: EnumOption[];
}): ColumnDef<TData>;
declare function actionsColumn<TData>(): ColumnDef<TData>;

/**
 * ui/table-primitives.tsx
 *
 * shadcn/ui-style table primitives — thin wrappers around HTML table
 * elements with Tailwind semantic classes.
 */

declare const Table: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableElement> & React$1.RefAttributes<HTMLTableElement>>;
declare const TableHeader: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableSectionElement> & React$1.RefAttributes<HTMLTableSectionElement>>;
declare const TableBody: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableSectionElement> & React$1.RefAttributes<HTMLTableSectionElement>>;
declare const TableFooter: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableSectionElement> & React$1.RefAttributes<HTMLTableSectionElement>>;
declare const TableRow: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableRowElement> & React$1.RefAttributes<HTMLTableRowElement>>;
declare const TableHead: React$1.ForwardRefExoticComponent<React$1.ThHTMLAttributes<HTMLTableCellElement> & React$1.RefAttributes<HTMLTableCellElement>>;
declare const TableCell: React$1.ForwardRefExoticComponent<React$1.TdHTMLAttributes<HTMLTableCellElement> & React$1.RefAttributes<HTMLTableCellElement>>;
declare const TableCaption: React$1.ForwardRefExoticComponent<React$1.HTMLAttributes<HTMLTableCaptionElement> & React$1.RefAttributes<HTMLTableCaptionElement>>;

export { type AccessorFn, ActionButtonRow, type ActionDef, ActionDropdown, type ActionItem, type ActivePresets, type AdapterStatus, type AggregationFn, type BatchActionDef, type BelongsToRelation, type BuildEntityFieldsFromSchemaOptions, type CRUDMode, type CRUDOptions, type CRUDState, type CascadeContext, type Cell, type CellContext, type CellRenderer, type ChangeOperation, type ChangeSet, type ChannelConfig, type Column, type ColumnFilterType, type ColumnFiltersState, type ColumnOrderState, type ColumnPinningState, type ColumnPreset, ColumnPresetDialog, type ColumnPresetEntry, type ColumnSizingState, type ColumnVisibilityState, type CompletenessMode, type CreatePGlitePersistenceAdapterOptions, DataTable, DataTableColumnHeader, DataTableFilter, DataTablePagination, DataTableToolbar, type DirtyFields, type ElectricAdapterOptions, ElectricSQLAdapter as ElectricSQLPresetAdapter, type ElectricSQLAdapterOptions as ElectricSQLPresetAdapterOptions, type ElectricTableConfig, EmptyState, type EmptyStateConfig, type EngineOptions, type EntityChange, type EntityColumnMeta, type EntityDescriptor, EntityDetailSheet, EntityFormSheet, type EntityId, type EntityJsonSchemaConfig, EntityListView, type EntityListViewProps, type EntityQueryOptions, type EntitySchema, type EntitySnapshot, type EntityState, type EntitySyncMetadata, EntityTable, type EntityType, type ExpandedState, type FieldDescriptor, type FieldType, type FilterClause, type FilterFn, type FilterGroup, type FilterOperator, type FilterPreset, FilterPresetDialog, type FilterSpec, GQLClient, type GQLClientConfig, type GQLEntityOptions, type GQLError, type GQLListOptions, type GQLResponse, type GalleryColumns, GalleryView, type GraphActionEvent, type GraphActionOptions, type GraphActionRecord$1 as GraphActionRecord, type GraphEffectEvent, type GraphEffectHandle, type GraphEffectOptions, type GraphIncludeMap, type GraphIncludeRelation, type GraphPersistenceAdapter, type GraphQueryOptions, type GraphSnapshotExportOptions, type GraphSnapshotPayload, type GraphSnapshotWithSchemasOptions, type GraphState, type GraphSyncStatus, type GraphToolContext, type GraphTransaction, type GroupingState, type HasManyRelation, type Header, type HeaderContext, type HeaderGroup, type HeaderRenderer, InlineCellEditor$1 as InlineCellEditor, InlineItemEditor, type ItemDescriptor, type ItemDescriptorBadge, type ItemDescriptorMeta, type ItemRenderContext, type JsonSchemaObject, type ListFetchParams, type ListQueryOptions, type ListResponse, type ListState, ListView, type LocalFirstGraphRuntime, type ManagerOptions, type ManyToManyRelation, MarkdownFieldEditor, MarkdownFieldRenderer, MemoryAdapter, MultiSelectBar, type PGlitePersistenceClient, type PaginationState, type GraphActionRecord as PersistedGraphActionRecord, type PresetChangeEvent, type PresetChangeOperation, PresetPicker, type PresetStoreState, type UnsubscribeFn as PresetUnsubscribeFn, type PrismaEntityConfigOptions, type ColumnDef as PureColumnDef, type ColumnMeta as PureColumnMeta, InlineCellEditor as PureInlineCellEditor, type QueryKey, type RealtimeAdapter, RealtimeManager, type RegisterEntityFromSqlOptions, type RelationDescriptor, type ReplayRetryPolicy, type RestAdapterOptions, RestApiAdapter, type Row, type RowModel, type RowSelectionState, type SchemaFieldDescriptor, type SchemaGraphToolContext, SelectionContext, type SelectionStoreState, Sheet, type SortClause, type SortDirection, SortHeader, type SortSpec, type SortingFn, type SortingState, type StartLocalFirstGraphOptions, type SubscriptionConfig, type SupabaseAdapterOptions$1 as SupabaseAdapterOptions, SupabaseRealtimeAdapter as SupabasePresetAdapter, type SupabaseAdapterOptions as SupabasePresetAdapterOptions, type SyncAdapter, type SyncOrigin, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, type TableInstance, type TableOptions, type TablePresetSlice, TableRow, type TableState, type TableStorageAdapter, TableStorageProvider, type TableStorageProviderProps, type TenantClaim, type TenantScopedAdapterOptions, type TenantScopedTableConfig, type UnsubscribeFn$1 as UnsubscribeFn, type Updater, type UseEntityListAsTableOptions, type UseEntityListAsTableResult, type UseEntityViewOptions, type UseEntityViewResult, type UseLocalFirstResult, type UseTablePresetsOptions, type UseTablePresetsResult, type ViewDescriptor, type ViewFetchParams, type ViewMode, ViewModeSwitcher, type WebSocketAdapterOptions, type ZustandAdapterOptions, ZustandPersistAdapter, actionsColumn$1 as actionsColumn, applyView, booleanColumn$1 as booleanColumn, buildEntityFieldsFromSchema, buildTenantWhere, cascadeInvalidation, checkCompleteness, compareEntities, configureEngine, createConvexAdapter, createElectricAdapter, createGQLClient, createGraphAction, createGraphEffect, createGraphQLSubscriptionAdapter, createGraphTool, createGraphTransaction, createPGlitePersistenceAdapter, createPresetStore, createPrismaEntityConfig, createRow, createSchemaGraphTool, createSelectionStore, createSupabaseRealtimeAdapter, createTenantScopedElectricAdapter, createWebSocketAdapter, dateColumn$1 as dateColumn, dedupe, deleteAction, editAction, enumColumn$1 as enumColumn, executeGQL, exportGraphSnapshot, exportGraphSnapshotWithSchemas, fetchEntity, fetchList, flattenClauses, getCoreRowModel, getEntityJsonSchema, getExpandedRowModel, getFacetedMinMaxValues, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getGroupedRowModel, getPaginatedRowModel, getRealtimeManager, getSchema, getSelectedRowModel, getSortedRowModel, hasCustomPredicates, hydrateGraphFromStorage, matchesFilter, matchesSearch, normalizeGQLResponse, numberColumn$1 as numberColumn, parseCreateTable, persistGraphToStorage, prismaRelationsToSchema, actionsColumn as pureActionsColumn, booleanColumn as pureBooleanColumn, dateColumn as pureDateColumn, enumColumn as pureEnumColumn, numberColumn as pureNumberColumn, selectionColumn as pureSelectionColumn, textColumn as pureTextColumn, queryOnce, readRelations, registerEntityFromSql, registerEntityJsonSchema, registerRuntimeSchema, registerSchema, renderMarkdownToHtml, replayActionWithRetry, resetRealtimeManager, selectGraph, selectionColumn$1 as selectionColumn, serializeKey, sqlTypeToJsonSchema, startGarbageCollector, startLocalFirstGraph, stopGarbageCollector, textColumn$1 as textColumn, toGraphQLVariables, toPrismaInclude, toPrismaOrderBy, toPrismaWhere, toRestParams, toSQLClauses, useEntity, useEntityAugment, useEntityCRUD, useEntityList, useEntityListAsTable, useEntityMutation, useEntityView, useGQLEntity, useGQLList, useGQLMutation, useGQLSubscription, useGraphDevTools, useGraphStore, useGraphSyncStatus, useLocalFirst, usePGliteQuery, useSchemaEntityFields, useSelectionContext, useSelectionStore, useSuspenseEntity, useSuspenseEntityList, useTable, useTablePresets, useTableRealtimeMode, useTableStorageAdapter, viewAction };
