// =============================================================================
// eslint-rules/no-server-state-in-usestate.js
//
// Heuristic, *warning-only* rule. Discourages local component state
// (`useState<Client>(...)`) for shapes that are entity rows owned by the
// entity graph. Anything in SYNC_CONFIG should come from `useEntity*` /
// `useEntityCRUD` / `useEntityView` so the cache, optimistic writes, and
// realtime sync stay coherent.
//
// We pattern-match on `useState<TypeName>(...)` where `TypeName` (or its
// `[]` form) matches an entity name from SYNC_CONFIG, with PascalCase
// translation: `client` → `Client`, `client_address` → `ClientAddress`,
// etc. Soft warning, not an error — false positives are possible.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

function loadEntityTypeNames(repoRoot) {
  const candidates = [
    path.resolve(repoRoot, 'src/shared/db/sync-config.ts'),
    path.resolve(repoRoot, '../hotseaters-ultimate/src/shared/db/sync-config.ts'),
  ];
  let source = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      source = fs.readFileSync(c, 'utf8');
      break;
    }
  }
  if (!source) return new Set();
  const names = new Set();
  const re = /name:\s*'([a-z_][a-z0-9_]*)'/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const snake = m[1];
    const pascal = snake
      .split('_')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');
    names.add(pascal);
  }
  return names;
}

let cachedTypeNames = null;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Server-state types should come from useEntity*, not useState<T>.',
    },
    schema: [],
    messages: {
      serverStateInUseState:
        "'{{type}}' looks like a server entity (it's in SYNC_CONFIG). Prefer " +
        "useEntity*/useEntityCRUD/useEntityView over local useState<{{type}}>.",
    },
  },
  create(context) {
    if (!cachedTypeNames) {
      const filename = context.filename ?? context.getFilename();
      // Walk up to find a `package.json` to anchor repoRoot.
      let dir = path.dirname(filename);
      let repoRoot = dir;
      while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
          repoRoot = dir;
          break;
        }
        dir = path.dirname(dir);
      }
      cachedTypeNames = loadEntityTypeNames(repoRoot);
    }
    return {
      CallExpression(node) {
        if (
          node.callee.type !== 'Identifier' ||
          node.callee.name !== 'useState'
        ) {
          return;
        }
        const tp = node.typeArguments ?? node.typeParameters;
        if (!tp || !tp.params || tp.params.length === 0) return;
        const arg = tp.params[0];
        let typeName = null;
        if (arg.type === 'TSTypeReference' && arg.typeName?.type === 'Identifier') {
          typeName = arg.typeName.name;
        } else if (
          arg.type === 'TSArrayType' &&
          arg.elementType?.type === 'TSTypeReference' &&
          arg.elementType.typeName?.type === 'Identifier'
        ) {
          typeName = arg.elementType.typeName.name;
        }
        if (typeName && cachedTypeNames.has(typeName)) {
          context.report({
            node,
            messageId: 'serverStateInUseState',
            data: { type: typeName },
          });
        }
      },
    };
  },
};
