import {
  Activity,
  AlertTriangle,
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

interface ConsoleNavigationProps {
  activeNav: string;
  openGroups: Record<string, boolean>;
  onToggleGroup: (label: string) => void;
  onNavigate: (label: string, nextView: AppView) => void;
  onUnavailable: (label: string) => void;
}

export function ConsoleNavigation({
  activeNav,
  openGroups,
  onToggleGroup,
  onNavigate,
  onUnavailable
}: ConsoleNavigationProps) {
  const drugLibraryActive = ["药物库", "药物列表", "FDA 数据", "Label 搜索", "PK 参数抽取", "映射审核"].includes(activeNav);
  const medicationActive = ["用药", "疗程追踪器", "用药提醒"].includes(activeNav);

  return (
    <>
      <button className="quick-search" type="button" onClick={() => onUnavailable("快速搜索")}>
        <Search size={16} />
        <span>快速搜索...</span>
        <kbd>Ctrl K</kbd>
      </button>

      <nav className="nav-stack">
        <NavItem icon={<Home size={16} />} label="账户首页" active={activeNav === "账户首页"} onClick={() => onUnavailable("账户首页")} />
        <NavGroup
          label="药物库"
          icon={<Database size={16} />}
          open={Boolean(openGroups["药物库"])}
          active={drugLibraryActive}
          onToggle={() => onToggleGroup("药物库")}
          complete
        >
          <button className={activeNav === "药物列表" ? "subnav active" : "subnav"} onClick={() => onNavigate("药物列表", "drug-library")}>
            药物列表
          </button>
          <NestedNavGroup
            label="FDA 数据"
            open={Boolean(openGroups["FDA 数据"])}
            active={["FDA 数据", "Label 搜索", "PK 参数抽取"].includes(activeNav)}
            onToggle={() => onToggleGroup("FDA 数据")}
          >
            <button className={activeNav === "Label 搜索" ? "subnav nested active" : "subnav nested"} onClick={() => onUnavailable("Label 搜索")}>
              Label 搜索 <span>N/A</span>
            </button>
            <button className={activeNav === "PK 参数抽取" ? "subnav nested active" : "subnav nested"} onClick={() => onUnavailable("PK 参数抽取")}>
              PK 参数抽取 <span>N/A</span>
            </button>
          </NestedNavGroup>
          <button className={activeNav === "映射审核" ? "subnav active" : "subnav"} onClick={() => onUnavailable("映射审核")}>
            映射审核 <span>N/A</span>
          </button>
        </NavGroup>
        <NavGroup
          label="用药"
          icon={<ListChecks size={16} />}
          open={Boolean(openGroups["用药"])}
          active={medicationActive}
          onToggle={() => onToggleGroup("用药")}
          complete
        >
          <button className={activeNav === "疗程追踪器" ? "subnav active" : "subnav"} onClick={() => onNavigate("疗程追踪器", "course-tracker")}>
            疗程追踪器
          </button>
          <button className={activeNav === "用药提醒" ? "subnav active" : "subnav"} onClick={() => onNavigate("用药提醒", "medication-reminders")}>
            用药提醒
          </button>
        </NavGroup>
        <SectionLabel label="Observe" />
        <NavItem icon={<Activity size={16} />} label="PK 预览" active={activeNav === "PK 预览"} onClick={() => onUnavailable("PK 预览")} />
        <NavItem icon={<AlertTriangle size={16} />} label="交互风险" active={activeNav === "交互风险"} onClick={() => onUnavailable("交互风险")} />
        <SectionLabel label="构建" />
        <NavItem icon={<Sparkles size={16} />} label="FDA 抽取" active={activeNav === "FDA 抽取"} onClick={() => onUnavailable("FDA 抽取")} />
        <NavItem icon={<FileText size={16} />} label="报告模板" active={activeNav === "报告模板"} onClick={() => onUnavailable("报告模板")} />
        <NavItem icon={<KeyRound size={16} />} label="隐私金钥" active={activeNav === "隐私金钥"} onClick={() => onUnavailable("隐私金钥")} />
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
