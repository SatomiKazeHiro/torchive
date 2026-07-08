// Re-export shim — actual types live in @torchive/shared.
// Consumers should ideally import from "@torchive/shared" directly,
// but this re-export preserves existing `@/types/db-instance` imports.
export * from "@torchive/shared";
