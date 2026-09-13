export type QaCategory = "TICKET" | "SHIFT" | "SHIFT_BRIEFING" | "GENERAL";

export interface QaScenario {
  id: string; // e.g. "QA-01"
  category: QaCategory;
  title: string;
  targetEntityId: string | null;
  snapshotState: string;
  currentState: string;
  expectedDestination: string;
  notificationGroup: "TICKET" | "SHIFT" | "SHIFT_BRIEFING" | null;
  qaNote?: string;
  actionableCTA?: string;
}

export interface QaDiagnosticResult {
  scenarioId: string;
  timestamp: Date;
  status: "PASS" | "FAIL" | "PENDING";
  details: string;
  locatedEntityId?: string;
  currentTab?: string;
}
