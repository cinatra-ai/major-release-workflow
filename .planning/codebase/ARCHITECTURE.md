<!-- refreshed: 2026-06-09 -->
# Architecture

**Analysis Date:** 2026-06-09

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│               Cinatra Marketplace (external host)                │
│   parseWorkflowBpmnSidecar → compiles WorkflowSpec at install    │
└────────────────────────┬─────────────────────────────────────────┘
                         │ publish/install
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│              @cinatra-ai/major-release-workflow                  │
│         (kind:"workflow" marketplace extension package)          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  cinatra/workflow.bpmn  — BPMN 2.0 process definition    │   │
│  │  (Cinatra Profile 1.0 sidecar, the authoritative source) │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────┐   ┌────────────────────────────────────┐   │
│  │  package.json   │   │  src/index.ts  (empty export stub) │   │
│  │  cinatra.kind:  │   │  No runtime code surface           │   │
│  │  "workflow"     │   └────────────────────────────────────┘   │
│  └─────────────────┘                                            │
└──────────────────────────────────────────────────────────────────┘
                         │
                         ▼ CI gate (pre-publish)
┌──────────────────────────────────────────────────────────────────┐
│           extension-kind-gate.mjs  (self-contained Node.js)      │
│   • validateWorkflowPackageShape  (package.json shape)           │
│   • validateBpmnSanity            (well-formed XML + BPMN shape) │
│   • findWorkflowSidecars          (no duplicate BPMN check)      │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| BPMN sidecar | Authoritative workflow DAG definition (Cinatra Profile 1.0) | `cinatra/workflow.bpmn` |
| Package manifest | Declares `cinatra.kind:"workflow"`, `workflowVersion`, and zero deps | `package.json` |
| TypeScript stub | Satisfies the TS entry-point contract; contains no logic | `src/index.ts` |
| Kind gate | Zero-dependency CI pre-publish validator (package shape + BPMN sanity) | `extension-kind-gate.mjs` |
| CI workflow | Build, typecheck, pack dry-run, and kind gate jobs | `.github/workflows/ci.yml` |
| Release workflow | Delegates to `cinatra-ai/.github` reusable workflow for marketplace publish | `.github/workflows/release.yml` |

## Pattern Overview

**Overall:** Content-only marketplace extension — declaration over code.

**Key Characteristics:**
- No runtime code: `src/index.ts` is a single `export {}` stub with no executable logic.
- The workflow is defined entirely as a BPMN 2.0 XML sidecar (`cinatra/workflow.bpmn`) which is parsed and compiled to a `WorkflowSpec` by the host (Cinatra platform) at install time — not in this repo.
- Inline JSON workflow definitions are explicitly forbidden; the BPMN sidecar is the only permitted form.
- The gate (`extension-kind-gate.mjs`) is deliberately self-contained (Node.js builtins only) so CI passes before any `@cinatra-ai/*` registry is reachable.

## Layers

**Workflow Definition Layer:**
- Purpose: Describes the multi-step major release process as a directed BPMN process graph with Cinatra-profile extensions.
- Location: `cinatra/workflow.bpmn`
- Contains: `bpmn:startEvent`, `bpmn:userTask`, `bpmn:serviceTask`, `bpmn:sendTask`, `bpmn:endEvent`, and `bpmn:sequenceFlow` elements; `cinatra:` extension elements for scheduling, approvals, and agent references.
- Depends on: Cinatra Profile 1.0 BPMN extensions (resolved by the host compiler at publish/install).
- Used by: The Cinatra Marketplace host which compiles this into a `WorkflowSpec`.

**Package Manifest Layer:**
- Purpose: Declares extension identity, kind, version, and dependency contracts.
- Location: `package.json`
- Contains: `cinatra.kind:"workflow"`, `cinatra.workflowVersion:1`, `cinatra.apiVersion:"cinatra.ai/v1"`, zero `dependencies`.
- Depends on: Nothing at runtime.
- Used by: The CI gate, the extraction script, and the marketplace publish pipeline.

**CI Gate Layer:**
- Purpose: Lightweight pre-publish sanity validation (not a full Profile-1.0 compile).
- Location: `extension-kind-gate.mjs`
- Contains: `validateWorkflowPackageShape`, `validateBpmnSanity`, `findWorkflowSidecars`, `validateAgent`, `runGate` (exported functions + a `main()` CLI entry).
- Depends on: Node.js built-in modules only (`fs`, `path`).
- Used by: `.github/workflows/ci.yml` (`kind-gates` job).

## Data Flow

### Workflow Compilation Path

1. Author edits `cinatra/workflow.bpmn` — the BPMN source of truth.
2. CI runs `node extension-kind-gate.mjs --package-root .` (`extension-kind-gate.mjs:365`).
3. Gate validates `package.json` shape via `validateWorkflowPackageShape` (`extension-kind-gate.mjs:165`).
4. Gate validates BPMN XML via `validateBpmnSanity` (`extension-kind-gate.mjs:200`) and asserts exactly one sidecar via `findWorkflowSidecars` (`extension-kind-gate.mjs:287`).
5. On GitHub Release, `release.yml` delegates to `cinatra-ai/.github/.github/workflows/reusable-extension-release.yml`.
6. The Cinatra Marketplace host runs `parseWorkflowBpmnSidecar` to compile the BPMN into a `WorkflowSpec` — this step is NOT in this repo.

### Workflow Runtime Path (Marketplace-side, external)

1. A user installs the extension; the host compiles `cinatra/workflow.bpmn` to a `WorkflowSpec`.
2. The host instantiates the process, binding the `{{product}}` placeholder.
3. Tasks execute in sequence: `kickoff` (checkpoint, T-14d) → `blog` (agent: `@cinatra-ai/blog-pipeline-agent`, T-7d) → `legal` (org-level approval, T-3d) → `announce` (send message, T+1h).
4. Sequence flows with `cinatra:transitionOutcome outcome="success"` guard `blog→legal` and `legal→announce`.

**State Management:**
- No in-repo state. All workflow instance state is managed externally by the Cinatra platform after install.

## Key Abstractions

**`cinatra:taskSchedule`:**
- Purpose: Relative scheduling metadata attached to each task — `anchor="target"` + ISO 8601 offset + direction (`before`/`after`).
- Examples: `cinatra/workflow.bpmn` (all four tasks)
- Pattern: Declarative XML extension element; interpreted by the host scheduler.

**`cinatra:agentRef`:**
- Purpose: Links a `bpmn:serviceTask` to a named Cinatra agent package for automated execution.
- Examples: `cinatra/workflow.bpmn` (`blog` task → `@cinatra-ai/blog-pipeline-agent`)
- Pattern: Extension element on `bpmn:serviceTask`; agent is resolved by the marketplace at runtime.

**`cinatra:approvalConfig`:**
- Purpose: Configures human approval semantics on a `bpmn:userTask` (level, rejection policy).
- Examples: `cinatra/workflow.bpmn` (`legal` task — `level="organization"`, `rejectionPolicy="needs_revision"`)
- Pattern: Extension element on `bpmn:userTask`.

**`runGate` / `validateWorkflow`:**
- Purpose: Public API of the CI gate — dispatches to kind-specific validators, returns `{ kind, errors }`.
- Examples: `extension-kind-gate.mjs:352` (`runGate`), `extension-kind-gate.mjs:312` (`validateWorkflow`)
- Pattern: Pure functions returning `string[]` errors; no side effects; all exported for unit testing.

## Entry Points

**BPMN sidecar (primary content entry point):**
- Location: `cinatra/workflow.bpmn`
- Triggers: Parsed by the Cinatra host at `npm install` / marketplace publish.
- Responsibilities: Defines the complete workflow process graph, scheduling, approvals, and agent wiring.

**CI gate CLI:**
- Location: `extension-kind-gate.mjs` (`main()` at line 365, only invoked when `process.argv[1]` matches the file)
- Triggers: `node extension-kind-gate.mjs --package-root .` in `.github/workflows/ci.yml`.
- Responsibilities: Validates package shape + BPMN sanity; exits 0 (pass) or 1 (violations).

**TypeScript stub:**
- Location: `src/index.ts`
- Triggers: Not executed at runtime; satisfies the `"main"` and `"types"` fields in `package.json`.
- Responsibilities: None (empty `export {}`).

## Architectural Constraints

- **No runtime code:** This extension has zero executable application logic. `src/index.ts` must remain a stub.
- **Inline workflow forbidden:** `package.json` must NOT contain a `cinatra.workflow` field; the BPMN sidecar is the only permitted workflow definition form.
- **Single BPMN sidecar:** Exactly one `cinatra/workflow.bpmn` must exist; duplicates (nested `**/cinatra/workflow.bpmn`) are a CI error.
- **Zero first-party dependencies:** `@cinatra-ai/*` packages must not appear in `dependencies`, `devDependencies`, or `optionalDependencies` — only as optional `peerDependencies` if at all.
- **Self-contained gate:** `extension-kind-gate.mjs` must use only Node.js built-in modules; no `@cinatra-ai/*` imports, no `pnpm dlx`.
- **Package naming:** Package name must match `@<scope>/<slug>-workflow` (enforced by `WORKFLOW_PACKAGE_NAME_RE` in the gate).
- **Global state:** None. All gate functions are pure.
- **Circular imports:** Not applicable (single stub + gate file, no import graph).

## Anti-Patterns

### Inline workflow definition

**What happens:** Adding a `cinatra.workflow` key directly in `package.json`.
**Why it's wrong:** The gate explicitly rejects it (`validateWorkflowPackageShape` line 174); the marketplace compile step requires the BPMN sidecar form.
**Do this instead:** Edit `cinatra/workflow.bpmn`; never define the workflow inline in `package.json`.

### Adding runtime code to `src/index.ts`

**What happens:** Exporting functions or classes from `src/index.ts`.
**Why it's wrong:** This is a content-only extension; the `src/index.ts` comment states "No runtime code surface." The marketplace does not execute TypeScript from workflow extensions.
**Do this instead:** Keep `src/index.ts` as `export {};`. All logic belongs in the BPMN sidecar or in a referenced agent package.

### Adding `@cinatra-ai/*` to `dependencies`

**What happens:** Listing a first-party package under `dependencies` or `devDependencies`.
**Why it's wrong:** CI classifies the repo as a "source mirror," skips install/typecheck/test, and would fail the shape check (`extension-kind-gate.mjs:165`). These packages are not on any public registry.
**Do this instead:** Declare them as optional `peerDependencies` with `peerDependenciesMeta[pkg].optional = true`, or omit them entirely.

## Error Handling

**Strategy:** Gate returns `string[]` errors; CLI prints them and exits 1. No exceptions thrown to callers from pure validators.

**Patterns:**
- All exported validator functions (`validateWorkflowPackageShape`, `validateBpmnSanity`, `validateWorkflow`, `validateAgent`) return `string[]` — empty array means pass.
- `runGate` wraps `JSON.parse` in try/catch and returns an error string rather than throwing.
- `validateBpmnSanity` returns early with an error on the first structural failure (malformed XML, missing root).

## Cross-Cutting Concerns

**Logging:** `console.log` for pass, `console.error` for failures — CLI only, in `main()`.
**Validation:** Centralized in `extension-kind-gate.mjs`; pure functions, no I/O side effects except file reads.
**Authentication:** Not applicable (no runtime; publish auth is handled by the org-level `CINATRA_MARKETPLACE_VENDOR_TOKEN` secret injected by the reusable release workflow).

---

*Architecture analysis: 2026-06-09*
