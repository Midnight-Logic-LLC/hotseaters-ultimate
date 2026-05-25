// Cucumber config for hotseaters-ultimate BDD journeys.
// Modeled on /Users/gqadonis/Projects/midnight/hotseaters/cucumber.cjs.
//
// Profiles: default, smoke (@smoke), ci (not @slow), ui (browser only).
// World parameters carry the SPA baseURL; self-hosted Supabase only.

const baseUrl =
  process.env.HU_BASE_URL ||
  process.env.E2E_BASE_URL ||
  process.env.VITE_BASE_URL ||
  'http://localhost:6173';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || 'http://localhost:8000';

const worldParameters = JSON.stringify({ baseUrl, supabaseUrl });

const common = [
  'tests/cucumber/features/**/*.feature',
  '--require-module tsx/cjs',
  '--require tests/cucumber/support/**/*.ts',
  '--require tests/cucumber/step-definitions/**/*.ts',
  '--format progress-bar',
  '--format json:tests/cucumber/reports/cucumber-report.json',
  `--world-parameters ${worldParameters}`,
].join(' ');

module.exports = {
  default: common,
  smoke: `${common} --tags "@smoke"`,
  ci: `${common} --tags "not @slow"`,
  ui: `${common} --tags "@ui"`,
};
