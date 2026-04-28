import { WorkspaceMetadata, SavedView } from "../types.js";
import { COMPUTE_BASE_URL, METADATA_CACHE_TTL_MS } from "../constants.js";

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${COMPUTE_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(
      `Workspace API ${path} → ${res.status}: ${await res.text()}`
    );
  }
  return res.json() as Promise<T>;
}

export async function fetchWorkspaceMetadata(
  workspaceId: string,
  computeToken: string,
  cache: Map<string, WorkspaceMetadata>
): Promise<WorkspaceMetadata> {
  const cached = cache.get(workspaceId);
  if (cached && Date.now() - cached.fetchedAt < METADATA_CACHE_TTL_MS) {
    return cached;
  }

  const base = `/workspaces/${workspaceId}`;

  const [config, columns, validValues] = await Promise.all([
    get<{ name: string }>(`${base}/config`, computeToken),
    get<WorkspaceMetadata["columns"]>(`${base}/columns`, computeToken),
    get<WorkspaceMetadata["validValues"]>(`${base}/valid-values`, computeToken),
  ]);

  const metadata: WorkspaceMetadata = {
    workspaceId,
    name: config.name,
    columns,
    validValues,
    fetchedAt: Date.now(),
  };

  cache.set(workspaceId, metadata);
  return metadata;
}

export async function fetchView(
  viewId: string,
  computeToken: string,
  cache: Map<string, SavedView>
): Promise<SavedView> {
  const cached = cache.get(viewId);
  if (cached) return cached;

  const view = await get<SavedView>(`/views/${viewId}`, computeToken);
  cache.set(viewId, view);
  return view;
}

export async function fetchViewList(
  workspaceId: string,
  computeToken: string
): Promise<Pick<SavedView, "id" | "name" | "description" | "updatedAt">[]> {
  return get(`/workspaces/${workspaceId}/views`, computeToken);
}
