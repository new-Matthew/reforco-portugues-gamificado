import type { ContentCatalog } from "../entities/content";

export interface ContentRepository {
  load(): Promise<ContentCatalog>;
}
