# External Integrations

**Analysis Date:** 2026-06-09

## APIs & External Services

**Cinatra Marketplace:**
- Service: Cinatra Marketplace registry (`registry.cinatra.ai`)
- Purpose: Extension publication target; this workflow is submitted here via the MCP proxy submission saga at release time
- Auth: `CINATRA_MARKETPLACE_VENDOR_TOKEN` GitHub Actions org secret (injected by the reusable release workflow `cinatra-ai/.github/.github/workflows/reusable-extension-release.yml@main`)

**Cinatra Blog Pipeline Agent:**
- Service: `@cinatra-ai/blog-pipeline-agent`
- Purpose: Called as a `bpmn:serviceTask` within the workflow DAG to draft the launch blog one week before the target launch date
- Reference: `cinatra/workflow.bpmn` line 26 (`cinatra:agentRef package="@cinatra-ai/blog-pipeline-agent"`)
- Input: `{"brief":"{{product}} launch"}` (template placeholder resolved at workflow instantiation)

**Cinatra Workflow Platform (host):**
- Service: Cinatra platform runtime
- Purpose: Executes the compiled `WorkflowSpec`; provides Gantt tracking, notification delivery, approval gates, and scheduled task orchestration
- Integration: `cinatra/workflow.bpmn` is parsed + compiled by `parseWorkflowBpmnSidecar` at install time in the monorepo
- Capabilities used: calendar-anchored scheduling (`cinatra:taskSchedule`), org-level approval routing (`cinatra:approvalConfig level="organization"`), rejection/revision policy, announcement send tasks

## Data Storage

**Databases:**
- Not applicable — this is a stateless workflow definition extension; all state is managed by the Cinatra platform runtime, not this package

**File Storage:**
- Not applicable

**Caching:**
- Not applicable

## Authentication & Identity

**Auth Provider:**
- Organization-level approval routing is handled by the Cinatra platform runtime based on `cinatra:approvalConfig level="organization"` declared in `cinatra/workflow.bpmn` (legal sign-off task, line 35)
- No auth logic exists in this package itself

## Monitoring & Observability

**Error Tracking:**
- Not applicable — no runtime code surface in this extension

**Logs:**
- CI logs via GitHub Actions standard output

## CI/CD & Deployment

**Hosting:**
- Cinatra Marketplace at `registry.cinatra.ai`

**CI Pipeline:**
- GitHub Actions — two workflows:
  - `.github/workflows/ci.yml`: runs on push/PR to `main`; validates package shape, runs typecheck (skipped for source-mirror repos with host-internal peers), dry-run pack, and the BPMN profile gate via `node extension-kind-gate.mjs --package-root .`
  - `.github/workflows/release.yml`: triggered on GitHub Release published or manual `workflow_dispatch` against a tag; delegates entirely to `cinatra-ai/.github/.github/workflows/reusable-extension-release.yml@main` with `secrets: inherit`

**Reusable Workflow:**
- `cinatra-ai/.github/.github/workflows/reusable-extension-release.yml@main` — central build/pack/gate/submit logic owned by the Cinatra org; this repo is a thin caller

## Environment Configuration

**Required env vars:**
- `CINATRA_MARKETPLACE_VENDOR_TOKEN` — GitHub Actions org secret; required only at release time, injected by the reusable release workflow

**Secrets location:**
- GitHub Actions org secrets (`cinatra-ai` org); no secrets in-repo

## Webhooks & Callbacks

**Incoming:**
- Not applicable — no server or webhook endpoint in this package

**Outgoing:**
- The `bpmn:sendTask` `announce` task (`cinatra/workflow.bpmn` line 41) sends an announcement message ("{{product}} has shipped.") via the Cinatra platform's notification system one hour after launch; the platform owns the delivery mechanism

---

*Integration audit: 2026-06-09*
