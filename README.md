# Major Release

A calendar-driven workflow for shepherding a product launch from kickoff to the day it ships. Pick a launch date and a product name and the workflow schedules every stage around it — opening a release window, drafting the launch blog, pausing for legal sign-off, and queuing the public announcement step once approved. Use it whenever you want a repeatable, dated process around a public release instead of ad-hoc coordination across docs, chat, and email.

Install by finding "Major Release" in the Cinatra marketplace and clicking Install. The only required input at launch time is `product` — a short name for the product being released (for example, "Acme Widget"). All stage dates are computed automatically relative to the launch date you set when you start the workflow. No environment variables or connector credentials are required.

When a draft is rejected at the legal gate the workflow holds it for revision and re-approval through the same gate; no manual restart is needed. To contribute or extend this workflow, edit `cinatra/workflow.bpmn` (the BPMN Profile 1.0 source) and run `node extension-kind-gate.mjs --package-root .` locally to validate before pushing. The CI gate enforces the same checks on every pull request.

## Works with

- Cinatra blog agent
- Workflow Gantt
- Workflow notifications

## Capabilities

- Anchor every stage to your chosen launch date so the calendar drives the work
- Open a visible release window two weeks before launch
- Draft the launch blog automatically a week before the target date
- Route the draft for organization-level legal sign-off three days before launch
- Queue the launch announcement step on the timeline one hour after the product goes live
- Hold the announcement step closed until legal has approved the draft
- Send a rejected draft back for revision and re-approval through the same gate
- Track every scheduled stage, dependency, and approval decision on the workflow Gantt
