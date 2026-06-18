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
    label: "Oral",
    summary: "Follow the prescription, drug label, or pharmacist instructions. Never treat reminders as dosing advice.",
    sourceLabel: "MedlinePlus Taking medicines",
    sourceUrl: "https://medlineplus.gov/ency/patientinstructions/000535.htm",
    sections: [
      {
        title: "Check before recording",
        items: [
          "Confirm the drug name, strength, dosage form, intended dose, timing, and contraindication warnings.",
          "Do not crush, split, chew, or otherwise alter extended-release, controlled-release, enteric-coated, or sublingual formulations unless the official instructions allow it.",
          "If the prescription, label, clinician guidance, or current log disagree, stop and confirm before recording the dose."
        ]
      },
      {
        title: "Recording boundary",
        items: [
          "Only record what was actually taken and when it was taken. Do not use PK estimates as a reason to self-correct or increase a dose.",
          "Missed doses, vomiting, severe drowsiness, breathing changes, chest pain, altered consciousness, or allergic reactions should follow real medical guidance rather than local reminder logic."
        ]
      }
    ]
  },
  injection: {
    route: "injection",
    label: "Injection",
    summary: "Only record injections already planned by a prescription or administered by qualified personnel. The app does not teach injection technique.",
    sourceLabel: "CDC Preventing Unsafe Injection Practices",
    sourceUrl: "https://www.cdc.gov/injection-safety/hcp/clinical-safety/index.html",
    sections: [
      {
        title: "Safety check",
        emphasis: "warning",
        items: [
          "Confirm the medication, concentration, dose, route, lot number, expiration, and order plan match.",
          "Use the sterile process defined by qualified medical guidance. Needles and syringes must be sterile, single-use, and single-person.",
          "Never reuse sharps, syringes, or injection supplies across administrations or people."
        ]
      },
      {
        title: "Stop and get help",
        emphasis: "danger",
        items: [
          "Do not record the dose as administered if the solution is cloudy, discolored, damaged, leaking, or otherwise cannot be verified.",
          "Seek immediate medical help for severe pain, swelling, numbness, fever, breathing difficulty, rash, or significant bleeding.",
          "Dispose of sharps according to local medical-waste requirements rather than standard household trash."
        ]
      }
    ]
  }
};

export function getRouteGuidance(route: MedicationRoute) {
  return routeGuidance[route];
}
