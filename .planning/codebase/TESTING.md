# Testing Patterns

**Analysis Date:** 2026-06-09

## Test Framework

**Runner:** Not detected — no test framework is installed or configured in this repo.

**Config:** No `jest.config.*`, `vitest.config.*`, or equivalent found.

**Test files:** None exist in the repository.

**Run Commands:**
```bash
# package.json has no "test" script; CI runs:
corepack pnpm test --if-present   # exits 0 silently when no script is present
```

## Why There Are No Tests

This repo is a **Cinatra Marketplace workflow extension** — a content-only package
whose only runtime artifact is `cinatra/workflow.bpmn`. There is no application
logic in `src/index.ts` (it is a one-line stub: `export {}`).

The primary validation logic lives in `extension-kind-gate.mjs`, which is a
self-contained CI gate script. Its correctness is validated indirectly:

1. **CI gate runs on every push/PR** via `.github/workflows/ci.yml` — the gate
   executes `node extension-kind-gate.mjs --package-root .` against the actual
   `cinatra/workflow.bpmn` in this repo, giving live coverage of all exported
   validators (`validateWorkflow`, `validateWorkflowPackageShape`, `validateBpmnSanity`,
   `findWorkflowSidecars`) on the real artifact.

2. **Authoritative validation re-runs marketplace-side** at publish/install
   (full Cinatra Profile-1.0 BPMN compile + OAS runtime-invariant checks).

## Gate Script Testability

Although no tests exist, `extension-kind-gate.mjs` is architected for unit testing:

- All validators are **pure functions** (`string in → string[] out`, no side effects)
  exported as named exports
- The direct-invocation guard (`if (invokedDirectly) main()`) means the file can
  be imported without triggering `process.exit`
- Exported surface: `parseArgs`, `validateAgent`, `validateWorkflow`,
  `validateWorkflowPackageShape`, `validateBpmnSanity`, `findWorkflowSidecars`, `runGate`

If tests were added, the pattern would be:
```js
import { validateBpmnSanity, validateWorkflowPackageShape } from "./extension-kind-gate.mjs";

// validateBpmnSanity returns string[] — assert on length and content
const errs = validateBpmnSanity("<invalid>");
assert(errs.length > 0);
```

## CI Validation (Substitute for Tests)

The `.github/workflows/ci.yml` `kind-gates` job provides the functional equivalent
of integration tests:

| Step | What it validates |
|------|-------------------|
| Classify repo + dep shape | `package.json` has no first-party packages in deps/devDeps; peerDependenciesMeta marks them optional |
| Install dependencies | Resolves successfully with `pnpm install --no-frozen-lockfile` |
| Typecheck | `tsc --noEmit` passes for `src/index.ts` |
| Pack (dry run) | `npm pack --dry-run` validates publish payload shape |
| Workflow BPMN profile gate | `node extension-kind-gate.mjs --package-root .` validates package.json shape + BPMN well-formedness |

## Coverage Gaps

**Gate script unit tests:** `extension-kind-gate.mjs` has no automated unit tests.
Edge cases (malformed XML, duplicate BPMN sidecars, banned OAS primitives, wrong
namespace URI) are only exercised if the live `cinatra/workflow.bpmn` happens to
trigger them — which it does not, since it is a valid file.

**Priority:** Medium — the gate logic is moderate complexity (regex-based XML
tag-balance walk, namespace resolution, banned-primitive scan) and would benefit
from a vitest or Node `--test` suite covering happy path and error branches.

## Recommended Test Addition

If tests are introduced, use Node's built-in test runner (no external deps, matches
the zero-dependency design of `extension-kind-gate.mjs`):

```bash
node --test test/gate.test.mjs
```

Add script to `package.json`:
```json
{ "scripts": { "test": "node --test" } }
```

---

*Testing analysis: 2026-06-09*
