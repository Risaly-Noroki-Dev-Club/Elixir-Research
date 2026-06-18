import {
  Activity,
  AlertTriangle,
  BookOpenText,
  ChevronRight,
  Database,
  FileText,
  Home,
  KeyRound,
  ListChecks,
  Search,
  Sparkles
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../../app/types";
import { useI18n } from "../../i18n/I18nProvider";

interface ConsoleNavigationProps {
  activeNav: string;
  openGroups: Record<string, boolean>;
  onQuickSearch: () => void;
  onToggleGroup: (label: string) => void;
  onNavigate: (label: string, nextView: AppView) => void;
  onUnavailable: (label: string) => void;
}

export function ConsoleNavigation({
  activeNav,
  openGroups,
  onQuickSearch,
  onToggleGroup,
  onNavigate,
  onUnavailable
}: ConsoleNavigationProps) {
  const { t } = useI18n();
  const drugLibraryActive = ["Drug Library", "Library", "FDA Data", "Label Search", "PK Extraction", "Mapping Review"].includes(activeNav);
  const medicationActive = ["Medication", "Course Tracker", "Medication Reminders"].includes(activeNav);
  const helpActive = ["Help", "Help Overview", "Help Drug Library", "Help Course Tracker", "Help PK Preview", "Help Data & Settings"].includes(activeNav);

  return (
    <>
      <button className="quick-search" type="button" onClick={onQuickSearch}>
        <Search size={16} />
        <span>{t("nav.quickSearch")}</span>
        <kbd>Ctrl K</kbd>
      </button>

      <nav className="nav-stack">
        <NavItem icon={<Home size={16} />} label={t("nav.accountHome")} active={activeNav === "Account Home"} onClick={() => onUnavailable("Account Home")} />
        <NavGroup
          label={t("nav.drugLibrary")}
          icon={<Database size={16} />}
          open={Boolean(openGroups["Drug Library"])}
          active={drugLibraryActive}
          onToggle={() => onToggleGroup("Drug Library")}
          complete
        >
          <button className={activeNav === "Library" ? "subnav active" : "subnav"} onClick={() => onNavigate("Library", "drug-library")}>
            {t("nav.library")}
          </button>
          <NestedNavGroup
            label={t("nav.fdaData")}
            open={Boolean(openGroups["FDA Data"])}
            active={["FDA Data", "Label Search", "PK Extraction"].includes(activeNav)}
            onToggle={() => onToggleGroup("FDA Data")}
          >
            <button className={activeNav === "Label Search" ? "subnav nested active" : "subnav nested"} onClick={() => onUnavailable("Label Search")}>
              {t("nav.labelSearch")} <span>{t("common.notAvailable")}</span>
            </button>
            <button className={activeNav === "PK Extraction" ? "subnav nested active" : "subnav nested"} onClick={() => onUnavailable("PK Extraction")}>
              {t("nav.pkExtraction")} <span>{t("common.notAvailable")}</span>
            </button>
          </NestedNavGroup>
          <button className={activeNav === "Mapping Review" ? "subnav active" : "subnav"} onClick={() => onUnavailable("Mapping Review")}>
            {t("nav.mappingReview")} <span>{t("common.notAvailable")}</span>
          </button>
        </NavGroup>
        <NavGroup
          label={t("nav.medication")}
          icon={<ListChecks size={16} />}
          open={Boolean(openGroups["Medication"])}
          active={medicationActive}
          onToggle={() => onToggleGroup("Medication")}
          complete
        >
          <button className={activeNav === "Course Tracker" ? "subnav active" : "subnav"} onClick={() => onNavigate("Course Tracker", "course-tracker")}>
            {t("nav.courseTracker")}
          </button>
          <button className={activeNav === "Medication Reminders" ? "subnav active" : "subnav"} onClick={() => onNavigate("Medication Reminders", "medication-reminders")}>
            {t("nav.medicationReminders")}
          </button>
        </NavGroup>
        <NavGroup
          label={t("nav.help")}
          icon={<BookOpenText size={16} />}
          open={Boolean(openGroups["Help"])}
          active={helpActive}
          onToggle={() => onToggleGroup("Help")}
          complete
        >
          <button className={activeNav === "Help Overview" ? "subnav active" : "subnav"} onClick={() => onNavigate("Help Overview", "help")}>
            {t("nav.helpOverview")}
          </button>
          <button className={activeNav === "Help Drug Library" ? "subnav active" : "subnav"} onClick={() => onNavigate("Help Drug Library", "help")}>
            {t("nav.helpDrugLibrary")}
          </button>
          <button className={activeNav === "Help Course Tracker" ? "subnav active" : "subnav"} onClick={() => onNavigate("Help Course Tracker", "help")}>
            {t("nav.helpCourseTracker")}
          </button>
          <button className={activeNav === "Help PK Preview" ? "subnav active" : "subnav"} onClick={() => onNavigate("Help PK Preview", "help")}>
            {t("nav.helpPkPreview")}
          </button>
          <button className={activeNav === "Help Data & Settings" ? "subnav active" : "subnav"} onClick={() => onNavigate("Help Data & Settings", "help")}>
            {t("nav.helpDataOps")}
          </button>
        </NavGroup>
        <SectionLabel label={t("nav.observe")} />
        <NavItem icon={<Activity size={16} />} label={t("nav.pkPreview")} active={activeNav === "PK Preview"} onClick={() => onUnavailable("PK Preview")} />
        <NavItem icon={<AlertTriangle size={16} />} label={t("nav.interactionRisk")} active={activeNav === "Interaction Risk"} onClick={() => onUnavailable("Interaction Risk")} />
        <SectionLabel label={t("nav.build")} />
        <NavItem icon={<Sparkles size={16} />} label={t("nav.fdaExtraction")} active={activeNav === "FDA Extraction"} onClick={() => onUnavailable("FDA Extraction")} />
        <NavItem icon={<FileText size={16} />} label={t("nav.reportTemplates")} active={activeNav === "Report Templates"} onClick={() => onUnavailable("Report Templates")} />
        <NavItem icon={<KeyRound size={16} />} label={t("nav.privacyKeys")} active={activeNav === "Privacy Keys"} onClick={() => onUnavailable("Privacy Keys")} />
      </nav>
    </>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  onClick
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "nav-item active" : "nav-item"} onClick={onClick}>
      {icon}
      <span>{label}</span>
      <em>N/A</em>
      <ChevronRight size={14} />
    </button>
  );
}

function NavGroup({
  icon,
  label,
  children,
  open,
  active,
  onToggle,
  complete = false
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  complete?: boolean;
}) {
  return (
    <div className="nav-group">
      <button className={active ? "nav-item open active" : open ? "nav-item open" : "nav-item"} onClick={onToggle}>
        {icon}
        <span>{label}</span>
        {complete ? null : <em>N/A</em>}
        <ChevronRight size={14} />
      </button>
      {open ? <div className="subnav-stack">{children}</div> : null}
    </div>
  );
}

function NestedNavGroup({
  label,
  children,
  open,
  active,
  onToggle
}: {
  label: string;
  children: ReactNode;
  open: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="nested-nav-group">
      <button className={active ? "subnav parent active" : open ? "subnav parent open" : "subnav parent"} onClick={onToggle}>
        <i aria-hidden="true" />
        <b>{label}</b>
        <span>N/A</span>
      </button>
      {open ? <div className="nested-subnav-stack">{children}</div> : null}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <span className="section-label">{label}</span>;
}
