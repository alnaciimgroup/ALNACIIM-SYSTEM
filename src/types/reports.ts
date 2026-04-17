export interface ReportsSummary {
  totalDistributed: number;
  auditedDistributed: number;
  totalSold: number;
  auditedSold: number;
  remainingTanks: number;
  totalCollected: number;
  rawCollected: number;
  auditedCollected: number;
  totalSubmitted: number;
  rawSubmitted: number;
  totalDifference: number;
  totalCredit: number;
  rawCredit: number;
  auditedCredit: number;
  totalFreeTanks: number;
  auditedFreeTanks: number;
  outstandingBalance: number;
  expectedRevenue: number;
}
