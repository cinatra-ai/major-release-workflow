# Technology Stack

**Analysis Date:** 2026-06-09

## Languages

**Primary:**
- TypeScript — `src/index.ts`, `tsconfig.json` (ES2023 target, ESNext modules, strict mode)

**Secondary:**
- JavaScript (ESM) — `extension-kind-gate.mjs` (zero-dependency Node.js CI gate script, plain `.mjs`)
- XML — `cinatra/workflow.bpmn` (BPMN 2.0 workflow definition using Cinatra Profile 1.0 schema)

## Runtime

**Environment:**
- Node.js 24 (specified in `.github/workflows/ci.yml` via `actions/setup-node@v4`)

**Package Manager:**
- pnpm (via corepack — `corepack enable` + `corepack pnpm` invocations in CI)
- Lockfile: not committed (CI uses `--no-frozen-lockfile` for standalone repos)
- `.npmrc` present — note existence only, contents not read

## Frameworks

**Core:**
- Cinatra BPMN Profile 1.0 — workflow definition format; the DAG is authored in `cinatra/workflow.bpmn` and compiled to a `WorkflowSpec` at install time by `parseWorkflowBpmnSidecar` (monorepo-side tooling)

**Testing:**
- Not applicable — this is a content-only workflow extension with no runtime code surface; tests run in the host monorepo context

**Build/Dev:**
- TypeScript compiler (`tsc`) — configured in `tsconfig.json`, outputs to `dist/`, sources in `src/`
- `npm pack --dry-run` — used in CI to validate package shape without publishing

## Key Dependencies

**Critical:**
- No runtime dependencies declared in `package.json` (`dependencies: []` / `cinatra.dependencies: []`)
- All `@cinatra-ai/*` packages are host-internal and consumed only via the parent cinatra monorepo workspace; they must never appear in `dependencies`, `devDependencies`, or `optionalDependencies`

**Infrastructure:**
- `extension-kind-gate.mjs` — self-contained, zero-dependency CI gate (Node built-ins only: `node:fs`, `node:path`); validates `cinatra/workflow.bpmn` shape and `package.json` structure before marketplace submission

## Configuration

**Environment:**
- No `.env` files detected
- No environment variables required at build time; secrets are injected at CI/CD level via GitHub Actions org secrets (`CINATRA_MARKETPLACE_VENDOR_TOKEN`)

**Build:**
- `tsconfig.json` — standalone strict TypeScript config, targets ES2023, `moduleResolution: bundler`, outputs declarations + source maps to `dist/`
- `package.json` — declares `cinatra.apiVersion: cinatra.ai/v1`, `cinatra.kind: workflow`, `cinatra.workflowVersion: 1`

## Platform Requirements

**Development:**
- Node.js 24+, pnpm via corepack
- TypeScript type-checking and compilation run within the cinatra monorepo (host-internal peers not resolvable standalone)

**Production:**
- Deployed as a Cinatra Marketplace extension via the `cinatra-ai/.github` reusable release workflow
- Published to `registry.cinatra.ai` through the marketplace MCP proxy submission flow (not direct Verdaccio publish)
- Release triggered by a GitHub Release tag matching `v<package.json.version>`

---

*Stack analysis: 2026-06-09*
