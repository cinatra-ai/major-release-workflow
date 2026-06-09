# Codebase Structure

**Analysis Date:** 2026-06-09

## Directory Layout

```
major-release-workflow/
├── cinatra/
│   └── workflow.bpmn        # BPMN 2.0 + Cinatra Profile 1.0 workflow definition (primary content)
├── src/
│   └── index.ts             # Empty TypeScript stub (export {} only — no runtime logic)
├── .github/
│   └── workflows/
│       ├── ci.yml           # Build, typecheck, pack, kind-gate CI jobs
│       └── release.yml      # Marketplace publish via reusable org workflow
├── .planning/
│   └── codebase/            # GSD codebase map documents (generated)
├── extension-kind-gate.mjs  # Self-contained CI gate: validates package shape + BPMN sanity
├── package.json             # Extension manifest (cinatra.kind:"workflow", workflowVersion:1)
├── tsconfig.json            # Standalone TypeScript config (targets src/, ES2023, ESNext modules)
├── .npmrc                   # npm registry configuration
├── LICENSE                  # Apache-2.0
└── README.md                # Extension documentation
```

## Directory Purposes

**`cinatra/`:**
- Purpose: Holds all Cinatra-platform sidecar files for this extension type.
- Contains: `workflow.bpmn` — the authoritative BPMN 2.0 process definition with Cinatra Profile 1.0 extension elements.
- Key files: `cinatra/workflow.bpmn`

**`src/`:**
- Purpose: TypeScript entry-point required by the extension package contract (`"main"` and `"types"` fields in `package.json`).
- Contains: A single stub file with no executable logic.
- Key files: `src/index.ts`

**`.github/workflows/`:**
- Purpose: GitHub Actions CI and release automation.
- Contains: `ci.yml` (build + kind gate), `release.yml` (marketplace publish delegation).
- Key files: `.github/workflows/ci.yml`, `.github/workflows/release.yml`

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents consumed by planning and execution agents.
- Contains: Generated Markdown analysis files.
- Generated: Yes — by the GSD mapper agent.
- Committed: Yes (tracked in repo).

## Key File Locations

**Entry Points:**
- `cinatra/workflow.bpmn`: Primary content — defines the workflow process consumed by the Cinatra host.
- `extension-kind-gate.mjs`: CI gate CLI entry point (`main()` guarded by `invokedDirectly` check).

**Configuration:**
- `package.json`: Extension identity, kind declaration (`cinatra.kind:"workflow"`), `workflowVersion`, and dependency constraints.
- `tsconfig.json`: TypeScript compiler config — standalone, no monorepo extends, targets `src/`, outputs to `dist/`.
- `.npmrc`: npm registry settings.

**Core Logic:**
- `extension-kind-gate.mjs`: All validation logic — `validateWorkflowPackageShape`, `validateBpmnSanity`, `findWorkflowSidecars`, `validateAgent`, `runGate`.

**Workflow Definition:**
- `cinatra/workflow.bpmn`: Four tasks (kickoff → blog → legal → announce) with scheduling, approval, and agent-ref extension elements.

**CI/CD:**
- `.github/workflows/ci.yml`: Runs on push/PR to `main`; jobs: `build` (install, typecheck, pack dry-run) and `kind-gates` (runs `extension-kind-gate.mjs`).
- `.github/workflows/release.yml`: Triggered on GitHub Release; delegates entirely to `cinatra-ai/.github/.github/workflows/reusable-extension-release.yml`.

## Naming Conventions

**Files:**
- BPMN sidecar: always `workflow.bpmn` (lowercase, no prefix) inside a `cinatra/` directory — required by the host scanner (`findWorkflowSidecars`).
- Gate script: `extension-kind-gate.mjs` — `.mjs` extension for ESM, kebab-case, descriptive.
- TypeScript sources: `camelCase.ts` inside `src/`.
- GitHub Actions: `kebab-case.yml` inside `.github/workflows/`.

**Directories:**
- Cinatra sidecar directory: always named `cinatra/` (required by the platform convention).
- TypeScript sources: always `src/`.

**Package naming:**
- Must match `@<scope>/<slug>-workflow` (enforced by the CI gate regex `WORKFLOW_PACKAGE_NAME_RE`).
- Example: `@cinatra-ai/major-release-workflow`.

## Where to Add New Code

**Modifying the workflow process (tasks, scheduling, approvals, agents):**
- Edit `cinatra/workflow.bpmn` — this is the only place workflow logic lives.
- Do NOT add runtime TypeScript; do NOT add `cinatra.workflow` to `package.json`.

**Adding a new BPMN task:**
- Add the task element and sequence flows inside the `<bpmn:process>` in `cinatra/workflow.bpmn`.
- Use `cinatra:taskSchedule`, `cinatra:agentRef`, or `cinatra:approvalConfig` extension elements as needed.

**Adding or updating the CI gate (validator logic):**
- Edit `extension-kind-gate.mjs`. All functions are exported for testability.
- Keep the file self-contained: only Node.js built-in imports are permitted.

**Adding TypeScript utilities (if ever needed):**
- Place in `src/` and export from `src/index.ts`.
- Note: this extension is currently content-only; adding runtime code is architecturally unusual for a `kind:"workflow"` extension.

## Special Directories

**`cinatra/`:**
- Purpose: Platform-reserved sidecar directory. The host locates `workflow.bpmn` by searching for files named `workflow.bpmn` whose parent directory is named `cinatra`.
- Generated: No (hand-authored BPMN).
- Committed: Yes.

**`.planning/`:**
- Purpose: GSD planning and codebase map artifacts.
- Generated: Yes (by GSD agents).
- Committed: Yes.

---

*Structure analysis: 2026-06-09*
