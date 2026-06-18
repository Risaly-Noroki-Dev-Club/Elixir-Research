export type AppView = "drug-library" | "course-tracker" | "medication-reminders" | "not-found";

export interface NotFoundContext {
  module: string;
  action: string;
  source: string;
}

export interface ActionNotice {
  id: number;
  title: string;
  detail?: string;
  tone?: "info" | "success" | "warning" | "danger";
}
