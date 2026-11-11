import type { ContentSource } from "../../content/repository/JsonContentRepository";

const modules = import.meta.glob("../../content/packs/**/*.json", {
  eager: true,
  import: "default",
});

export const viteContentSource: ContentSource = {
  read: () =>
    Object.entries(modules)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, pack]) => pack),
};
