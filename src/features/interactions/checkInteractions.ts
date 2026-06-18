export interface InteractionRisk {
  severity: "warning" | "danger";
  title: string;
  message: string;
}

const riskRules = [
  {
    tag: "opioid",
    substance: "Alcohol",
    severity: "danger" as const,
    title: "酒精 + 阿片类药物高危",
    message: "可能叠加中枢抑制、过度镇静和呼吸抑制风险。此类组合必须提示立即咨询医生或药师。"
  },
  {
    tag: "cyp3a4-substrate",
    substance: "Fluconazole",
    severity: "danger" as const,
    title: "CYP3A4 抑制剂风险",
    message: "CYP3A4 抑制可能升高羟考酮暴露量。本原型只做风险提示，不给出剂量调整建议。"
  },
  {
    tag: "cns-depressant-risk",
    substance: "Diazepam",
    severity: "danger" as const,
    title: "苯二氮卓类叠加风险",
    message: "与阿片类药物合用可能导致深度镇静、呼吸抑制、昏迷或死亡，需要临床审查。"
  }
];

export function checkInteractions(drugTags: string[], substances: string[]): InteractionRisk[] {
  return riskRules
    .filter((rule) => drugTags.includes(rule.tag) && substances.includes(rule.substance))
    .map(({ severity, title, message }) => ({ severity, title, message }));
}

