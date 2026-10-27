export type UserRole = 'admin' | 'faskes';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facilityId?: string;
  facilityName?: string;
}

export type SeverityLevel = 1 | 2 | 3 | 4;

export type ClaimStatus = 'menunggu_verifikasi' | 'ditelaah' | 'klarifikasi' | 'disetujui';

export type RiskBand = 'Rendah' | 'Sedang' | 'Tinggi';

export interface ClaimItem {
  code: string;
  description: string;
  amount: number;
}

export interface LabResultRef {
  labResultId: string;
  labSealHash: string;
  testName: string;
  value: number;
  unit: string;
}

export interface MerkleLeaf {
  id: string;
  label: string;
  hash: string;
  dataSnippet?: string;
}

export interface Seal {
  id: string;
  kind?: 'claim' | 'lab';
  refId?: string;
  claimId?: string;
  claimNumber?: string;
  version?: number;
  merkleRoot: string;
  prevSealHash: string;
  sealHash: string;
  signature: string;
  keyId: string;
  createdAt: string;
  leaves: MerkleLeaf[];
}

export interface RuleFinding {
  id: string;
  ruleId: 'U1' | 'U2' | 'U3' | 'F-SEV2' | 'B1' | 'B2' | 'B3' | 'R-SEAL' | 'R-AUDIT';
  type: 'upcoding' | 'unbundling' | 'integritas';
  title: string;
  description: string;
  evidence: {
    quote?: string;
    vaultValue?: string;
    claimedValue?: string;
    details: string;
    clinicalRef: string;
  };
  weight: number;
  confidence: number;
}

export interface ClarificationMessage {
  id: string;
  requestedAt?: string;
  requestedBy?: string;
  question?: string;
  answeredAt?: string;
  answeredBy?: string;
  answer?: string;
  senderRole?: 'admin' | 'faskes';
  senderName?: string;
  message?: string;
  timestamp?: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  facilityId: string;
  facilityName: string;
  encounterId: string;
  patientPseudoId: string;
  patientAge: number;
  patientGender: 'L' | 'P';
  admitDate: string;
  dischargeDate: string;
  losDays: number;
  inacbgCode: string;
  inacbgDescription: string;
  severity: SeverityLevel;
  billedAmount: number;
  verifiedAmount?: number;
  primaryDiagnosis: {
    code: string;
    name: string;
  };
  secondaryDiagnoses: {
    code: string;
    name: string;
  }[];
  procedures: {
    code: string;
    name: string;
  }[];
  specialItems: {
    code: 'SA' | 'SP' | 'RR' | 'SI' | 'SD';
    name: string;
    amount: number;
  }[];
  items: ClaimItem[];
  resumeText: string;
  currentVersion: number;
  status: ClaimStatus;
  riskScore: number;
  riskBand: RiskBand;
  fastTrack: boolean;
  findings: RuleFinding[];
  seal: Seal;
  labRefs: LabResultRef[];
  isTampered?: boolean;
  tamperReason?: string;
  clarifications?: ClarificationMessage[];
  clarificationHistory?: ClarificationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaimVersion {
  id: string;
  claimId: string;
  version: number;
  reason: string;
  createdBy: string;
  createdAt: string;
  snapshot: any;
  sealId: string;
}

export interface LabResult {
  id: string;
  facilityId?: string;
  facilityName?: string;
  sourceId: string;
  sourceName: string;
  specimenId: string;
  encounterId: string;
  patientPseudoId: string;
  test: string;
  value: number;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  sampledAt: string;
  receivedAt: string;
  payloadHash: string;
  sealId: string;
  assuranceLevel: 'Level 1' | 'Level 2';
  status: 'valid' | 'karantina';
  quarantineReason?: string;
}

export interface Decision {
  id: string;
  claimId: string;
  version: number;
  actor: string;
  actorRole: UserRole;
  decision: 'telaah' | 'klarifikasi' | 'setujui';
  note: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actor: string;
  role: UserRole;
  action: string;
  ref: string;
  details: string;
  timestamp: string;
}

export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'compat';

export interface AiConfigStatus {
  connected: boolean;
  provider: AiProvider;
  keyHint: string;
  activeModel: string;
  modelsCount: number;
  testedAt?: string;
  isFromEnv?: boolean;
  mode: 'ai' | 'fallback';
  availableModels: string[];
}
