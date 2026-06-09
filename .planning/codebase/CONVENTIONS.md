# Coding Conventions

**Analysis Date:** 2026-06-09

## Repo Type

This is a Cinatra Marketplace **workflow extension** — a content-only package whose
primary artifact is `cinatra/workflow.bpmn`. The only TypeScript file (`src/index.ts`)
is a stub export with no runtime logic. Conventions below apply to both the gate
script (`extension-kind-gate.mjs`) and the BPMN sidecar, as those are the only
substantive files.

## Naming Patterns

**Files:**
- TypeScript entry point: `src/index.ts` (single file, re-exported as package `main`)
- Gate script: `extension-kind-gate.mjs` (kebab-case, `.mjs` ESM extension, repo-root level)
- BPMN sidecar: `cinatra/workflow.bpmn` (fixed name required by platform contract)
- Workflow metadata: `package.json` carries `cinatra.*` keys for kind/version metadata

**Functions (in `extension-kind-gate.mjs`):**
- camelCase: `parseArgs`, `validateAgent`, `validateWorkflow`, `validateBpmnSanity`,
  `validateWorkflowPackageShape`, `findWorkflowSidecars`, `runGate`, `walkLlmStrings`,
  `scanOasString`, `wordBoundary`
- Helper predicates are inline closures (`prefixOf`, `localOf`)

**Variables:**
- `SCREAMING_SNAKE_CASE` for module-level constants: `LLM_VISIBLE_FIELDS`,
  `BANNED_PRIMITIVES`, `BANNED_TYPEHINTS`, `PRIMITIVE_PATTERNS`, `BPMN_MODEL_NS`,
  `WORKFLOW_PACKAGE_NAME_RE`, `OBJECTS_LIST_CRM_RE`
- `camelCase` for local variables and parameters

**BPMN IDs:**
- kebab-case element IDs: `major-release`, `flow_start_kickoff`, `flow_kickoff_blog`
- Sequence flow IDs use underscore separators: `flow_<source>_<target>`

## Code Style

**Formatting:**
- No formatter config detected (no `.prettierrc`, `biome.json`, etc.)
- `extension-kind-gate.mjs` uses 2-space indentation consistently
- Double-quoted strings throughout JS/TS

**Linting:**
- No ESLint or Biome config detected in repo root

**TypeScript:**
- `tsconfig.json` enforces `strict: true` but sets `noImplicitAny: false`
- `verbatimModuleSyntax: true` — type-only imports must use `import type`
- `isolatedModules: true` — each file must be independently compilable
- `moduleResolution: "bundler"`, `module: "ESNext"`, `target: "ES2023"`

## Import Organization

**In `extension-kind-gate.mjs`:**
- Node builtins only, grouped in a single block at the top:
  ```js
  import { readFileSync, existsSync, readdirSync } from "node:fs";
  import { resolve, join, basename, dirname, relative } from "node:path";
  ```
- The `node:` protocol prefix is required for all built-in imports
- Zero external dependencies — enforced by design (CI runs unauthenticated)

**In `src/index.ts`:**
- No imports — stub file with `export {}`

## Error Handling

**Pattern:** Pure functions return `string[]` error arrays; callers accumulate and
report. No exceptions thrown for validation failures.

```js
// Each validator returns string[] — callers spread-push into a parent errors array
export function validateBpmnSanity(xml) {
  const errors = [];
  // ...
  errors.push("cinatra/workflow.bpmn is empty");
  return errors;
}
// Caller:
errors.push(...validateBpmnSanity(xml));
```

**For I/O errors:** `try/catch` wraps file reads; caught errors are stringified
via `err instanceof Error ? err.message : String(err)` and pushed into the errors
array — never thrown past the function boundary.

**Exit codes:**
- `0` — clean / pass
- `1` — one or more violations
- Script uses `process.exit(0)` / `process.exit(1)` exclusively in `main()`

## Logging

**No logging framework** — plain `console.log` for success, `console.error` for
violations and fatal errors. Format:
- Success: `✓ extension-kind-gate: <kind> extension passed.`
- Failure: `✗ extension-kind-gate: <N> <kind> violation(s):\n  • <message>`

## Comments

**When to Comment:**
- Section separators use dashed banners: `// ----...---- // heading`
- JSDoc `/** ... */` on every exported function explaining its contract and purity
- Inline comments explain non-obvious rules, platform contracts, and intentional
  design choices (e.g. why the gate is "light", why no external deps)
- File-level block comment explains the full scope, usage, and exit codes

**Example (from `extension-kind-gate.mjs`):**
```js
/**
 * Light XML well-formedness + BPMN-shape check. Pure (string in → string[] out).
 * Not a full XML parser — a tag-balance walk that catches truncation/malformed
 * markup…
 */
export function validateBpmnSanity(xml) { … }
```

## Module Design

**Exports:** Every gate function is a named export from `extension-kind-gate.mjs`
(`parseArgs`, `validateAgent`, `validateWorkflow`, `validateWorkflowPackageShape`,
`validateBpmnSanity`, `findWorkflowSidecars`, `runGate`). This enables unit testing
of individual validators without invoking `main()`.

**Direct invocation guard:**
```js
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (invokedDirectly) { main(); }
```
Guards `main()` so the file can be imported as a module in tests without side effects.

## BPMN Authoring Conventions

**Namespace declarations** on `<bpmn:definitions>`:
- `xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"` (required)
- `xmlns:cinatra="http://cinatra.ai/schema/bpmn/profile-1.0"` (Cinatra extensions)

**Task kinds:**
- `<bpmn:userTask>` for human checkpoints and approvals (with `cinatra:taskKind` or `cinatra:approvalConfig`)
- `<bpmn:serviceTask>` for AI agent tasks (with `cinatra:agentRef`)
- `<bpmn:sendTask>` for notification/announce tasks

**Schedules:** Every non-start/end task declares `<cinatra:taskSchedule>` with
`mode`, `anchor`, `offsetIso8601`, and `direction`.

**Placeholders:** `{{product}}` syntax used in task names and message bodies;
declared in `<cinatra:placeholders>`.

---

*Convention analysis: 2026-06-09*
