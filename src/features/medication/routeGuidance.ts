import type { MedicationRoute } from "./types";

export interface GuidanceSection {
  title: string;
  emphasis?: "warning" | "danger";
  items: string[];
}

export interface RouteGuidance {
  route: MedicationRoute;
  label: string;
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  sections: GuidanceSection[];
}

export const routeGuidance: Record<MedicationRoute, RouteGuidance> = {
  oral: {
    route: "oral",
    label: "口服",
    summary: "按处方、药品标签或药师说明服用；不要把提醒当成加量建议。",
    sourceLabel: "MedlinePlus Taking medicines",
    sourceUrl: "https://medlineplus.gov/ency/patientinstructions/000535.htm",
    sections: [
      {
        title: "服用前核对",
        items: [
          "核对药品名称、规格、剂型、剂量、给药时间和禁忌提示。",
          "缓释、控释、肠溶或舌下剂型不要自行掰开、碾碎、咀嚼或改变给药方式。",
          "如处方与药品标签、医生说明或当前记录不一致，先暂停记录并联系医生或药师确认。"
        ]
      },
      {
        title: "记录边界",
        items: [
          "记录已实际服用的剂量和时间，不把血药浓度估算结果作为自行补服或加量依据。",
          "漏服、呕吐、严重嗜睡、呼吸异常、意识改变、胸痛或过敏表现需要按医疗建议处理。"
        ]
      }
    ]
  },
  injection: {
    route: "injection",
    label: "注射",
    summary: "仅记录已经由本人处方计划或合格人员执行的注射；系统不提供注射教学。",
    sourceLabel: "CDC Preventing Unsafe Injection Practices",
    sourceUrl: "https://www.cdc.gov/injection-safety/hcp/clinical-safety/index.html",
    sections: [
      {
        title: "安全核对",
        emphasis: "warning",
        items: [
          "确认药品、浓度、剂量、给药途径、批号/有效期和处方计划一致。",
          "按医疗人员给出的无菌流程处理；针具和注射器应为一次性、无菌、单人单次使用。",
          "不要复用针头、注射器或混用不同人员的注射用品。"
        ]
      },
      {
        title: "停止并求助",
        emphasis: "danger",
        items: [
          "药液浑浊、变色、包装破损、剂量无法确认或部位异常时不要记录为已给药。",
          "出现剧痛、明显肿胀、麻木、发热、呼吸困难、皮疹或大量出血时应立即寻求医疗帮助。",
          "锐器应按当地医疗废弃物或锐器盒要求处理，不放入普通可接触垃圾。"
        ]
      }
    ]
  }
};

export function getRouteGuidance(route: MedicationRoute) {
  return routeGuidance[route];
}
