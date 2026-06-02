// kind:"workflow" marketplace extension. The template DAG is authored as a
// Cinatra BPMN Profile 1.0 sidecar at `cinatra/workflow.bpmn` —
// parsed + compiled to a WorkflowSpec at install time by parseWorkflowBpmnSidecar.
// package.json carries only `cinatra.kind:"workflow"` + integer `workflowVersion`;
// inline JSON definitions are forbidden. No runtime code surface.
export {};
