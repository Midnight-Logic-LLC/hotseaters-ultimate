// =============================================================================
// eslint-rules/index.js — local ESLint plugin assembling the custom rules.
//
// Wired into `eslint.config.js` as a `plugins` entry under the key
// `hotseaters`. Rules are referenced as `hotseaters/<rule-name>`.
// =============================================================================

import syncConfigRlsCoherence from './sync-config-rls-coherence.js';
import noServerStateInUsestate from './no-server-state-in-usestate.js';

export default {
  rules: {
    'sync-config-rls-coherence': syncConfigRlsCoherence,
    'no-server-state-in-usestate': noServerStateInUsestate,
  },
};
