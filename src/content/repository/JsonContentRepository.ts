import type { ContentCatalog } from "../../core/entities/content";
import { ContentValidationError } from "../../core/errors";
import type { ContentRepository } from "../../core/ports/ContentRepository";
import { validateContentPacks } from "../schema/validateContent";

export interface ContentSource {
  read(): readonly unknown[];
}

export function createStaticContentSource(packs: readonly unknown[]): ContentSource {
  return { read: () => packs };
}

export class JsonContentRepository implements ContentRepository {
  constructor(private readonly source: ContentSource) {}

  async load(): Promise<ContentCatalog> {
    const result = validateContentPacks(this.source.read());
    if (!result.ok) {
      throw new ContentValidationError(result.issues);
    }
    return result.catalog;
  }
}
