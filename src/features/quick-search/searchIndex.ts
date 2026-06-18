import type { AppView } from "../../app/types";

type QuickSearchAction =
  | {
      kind: "navigate";
      navLabel: string;
      view: AppView;
    }
  | {
      kind: "unavailable";
      navLabel: string;
    };

export interface QuickSearchEntry {
  id: string;
  titleKey: string;
  descriptionKey: string;
  keywordsKey: string;
  action: QuickSearchAction;
}

export const quickSearchEntries: QuickSearchEntry[] = [
  {
    id: "library",
    titleKey: "quickSearch.entries.library.title",
    descriptionKey: "quickSearch.entries.library.description",
    keywordsKey: "quickSearch.entries.library.keywords",
    action: { kind: "navigate", navLabel: "Library", view: "drug-library" }
  },
  {
    id: "course-tracker",
    titleKey: "quickSearch.entries.courseTracker.title",
    descriptionKey: "quickSearch.entries.courseTracker.description",
    keywordsKey: "quickSearch.entries.courseTracker.keywords",
    action: { kind: "navigate", navLabel: "Course Tracker", view: "course-tracker" }
  },
  {
    id: "medication-reminders",
    titleKey: "quickSearch.entries.medicationReminders.title",
    descriptionKey: "quickSearch.entries.medicationReminders.description",
    keywordsKey: "quickSearch.entries.medicationReminders.keywords",
    action: { kind: "navigate", navLabel: "Medication Reminders", view: "medication-reminders" }
  },
  {
    id: "label-search",
    titleKey: "quickSearch.entries.labelSearch.title",
    descriptionKey: "quickSearch.entries.labelSearch.description",
    keywordsKey: "quickSearch.entries.labelSearch.keywords",
    action: { kind: "unavailable", navLabel: "Label Search" }
  },
  {
    id: "pk-extraction",
    titleKey: "quickSearch.entries.pkExtraction.title",
    descriptionKey: "quickSearch.entries.pkExtraction.description",
    keywordsKey: "quickSearch.entries.pkExtraction.keywords",
    action: { kind: "unavailable", navLabel: "PK Extraction" }
  },
  {
    id: "mapping-review",
    titleKey: "quickSearch.entries.mappingReview.title",
    descriptionKey: "quickSearch.entries.mappingReview.description",
    keywordsKey: "quickSearch.entries.mappingReview.keywords",
    action: { kind: "unavailable", navLabel: "Mapping Review" }
  },
  {
    id: "pk-preview",
    titleKey: "quickSearch.entries.pkPreview.title",
    descriptionKey: "quickSearch.entries.pkPreview.description",
    keywordsKey: "quickSearch.entries.pkPreview.keywords",
    action: { kind: "unavailable", navLabel: "PK Preview" }
  },
  {
    id: "interaction-risk",
    titleKey: "quickSearch.entries.interactionRisk.title",
    descriptionKey: "quickSearch.entries.interactionRisk.description",
    keywordsKey: "quickSearch.entries.interactionRisk.keywords",
    action: { kind: "unavailable", navLabel: "Interaction Risk" }
  }
];
