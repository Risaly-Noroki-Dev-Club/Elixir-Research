import courseTracker from "../../../docs/help/course-tracker.md?raw";
import dataAndSettings from "../../../docs/help/data-and-settings.md?raw";
import drugLibrary from "../../../docs/help/drug-library.md?raw";
import overview from "../../../docs/help/overview.md?raw";
import pkPreview from "../../../docs/help/pk-preview.md?raw";

export type HelpDocId = "overview" | "drug-library" | "course-tracker" | "pk-preview" | "data-and-settings";

export interface HelpDocDefinition {
  id: HelpDocId;
  navLabel: string;
  title: string;
  content: string;
}

export const helpGroupLabel = "Help";

export const helpDocs: HelpDocDefinition[] = [
  {
    id: "overview",
    navLabel: "Help Overview",
    title: "Help Overview",
    content: overview
  },
  {
    id: "drug-library",
    navLabel: "Help Drug Library",
    title: "Drug Library",
    content: drugLibrary
  },
  {
    id: "course-tracker",
    navLabel: "Help Course Tracker",
    title: "Course Tracker",
    content: courseTracker
  },
  {
    id: "pk-preview",
    navLabel: "Help PK Preview",
    title: "PK Preview",
    content: pkPreview
  },
  {
    id: "data-and-settings",
    navLabel: "Help Data & Settings",
    title: "Data And Settings",
    content: dataAndSettings
  }
];

export function getHelpDocByNavLabel(navLabel: string) {
  return helpDocs.find((doc) => doc.navLabel === navLabel) ?? helpDocs[0];
}
