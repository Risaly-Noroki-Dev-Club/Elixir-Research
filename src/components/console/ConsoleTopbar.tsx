import { BookOpen, Moon, Palette, Sun, UserRound } from "lucide-react";
import type { NotFoundContext } from "../../app/types";

interface ConsoleTopbarProps {
  theme: "dark" | "light";
  accent: string;
  onThemeChange: (theme: "dark" | "light") => void;
  onAccentChange: (accent: string) => void;
  onNotFound: (context: NotFoundContext) => void;
}

export function ConsoleTopbar({ theme, accent, onThemeChange, onAccentChange, onNotFound }: ConsoleTopbarProps) {
  return (
    <header className="console-topbar">
      <div />
      <div className="top-actions">
        <button className="text-action" onClick={() => onNotFound({ module: "support", action: "open_support", source: "topbar" })}>
          <BookOpen size={16} />
          支援
        </button>
        <button className="icon-button" title="切换明暗模式" onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <label className="icon-button color-button" title="调色盘">
          <Palette size={18} />
          <input value={accent} type="color" onChange={(event) => onAccentChange(event.target.value)} />
        </label>
        <button className="avatar-button" title="账户" onClick={() => onNotFound({ module: "account", action: "open_profile", source: "topbar" })}>
          <UserRound size={18} />
        </button>
      </div>
    </header>
  );
}
