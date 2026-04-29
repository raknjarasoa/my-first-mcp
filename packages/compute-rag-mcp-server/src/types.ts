export interface Session {
  sessionId: string;
  computeToken: string;
  llmKey: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  metadataCache: Map<string, WorkspaceMetadata>;
  viewCache: Map<string, SavedView>;
}

export interface WorkspaceMetadata {
  workspaceId: string;
  name: string;
  columns: ColumnDefinition[];
  validValues: Record<string, string[]>;
  fetchedAt: number;
}

export interface ColumnDefinition {
  name: string;
  label: string;
  type: "metric" | "dimension";
  dataType: "float" | "integer" | "string" | "date";
  groupable: boolean;
  aggregatable: boolean;
  description: string;
}

export interface SavedView {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  compute: Partial<ComputeQuery>;
  updatedAt: string;
}

export interface ComputeQuery {
  workspaceId: string;
  metrics: string[];
  dimensions: string[];
  period: string;
  filters?: Record<string, string | string[]>;
  topN?: number;
  groupBy?: string[];
}

export type ComputeRow = Record<string, string | number>;

export interface ComputeResult {
  rows: ComputeRow[];
  totalRows: number;
  executionTimeMs: number;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}
