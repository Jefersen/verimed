import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateClaimRules } from './rules';
import { Claim } from '../types';

test('evaluateClaimRules fast-tracks clean claim', () => {
  const cleanClaim: Claim = {
    id: 'C-CLEAN',
    claimNumber: 'CLM-2026-001',
    facilityId: 'FASKES-01',
    facilityName: 'RS Sejahtera Sehat',
    encounterId: 'ENC-001',
    patientPseudoId: 'PASIEN-1234',
    patientAge: 32,
    patientGender: 'L',
    admitDate: '2026-10-10',
    dischargeDate: '2026-10-13',
    losDays: 3,
    inacbgCode: 'D-4-10-I',
    inacbgDescription: 'Demam Berdarah Dengue Ringan',
    severity: 1,
    billedAmount: 4200000,
    primaryDiagnosis: { code: 'A91', name: 'Dengue Hemorrhagic Fever' },
    secondaryDiagnoses: [],
    procedures: [{ code: '89.52', name: 'EKG Monitor' }],
    specialItems: [],
    items: [],
    resumeText: 'Pasien DBD rawat inap 3 hari, cairan RL, perbaikan klinis baik.',
    currentVersion: 1,
    status: 'menunggu_verifikasi',
    riskScore: 0,
    riskBand: 'Rendah',
    fastTrack: true,
    findings: [],
    seal: {} as any,
    labRefs: [{ labResultId: 'L1', labSealHash: 'abc', testName: 'Trombosit', value: 85000, unit: '/µL' }],
    createdAt: '2026-10-14T08:00:00Z',
    updatedAt: '2026-10-14T08:00:00Z',
  };

  const result = evaluateClaimRules(cleanClaim);
  assert.equal(result.riskBand, 'Rendah');
  assert.equal(result.fastTrack, true);
  assert.equal(result.findings.length, 0);
});

test('evaluateClaimRules triggers U1 for severe anemia without lab evidence', () => {
  const anemiaClaim: Claim = {
    id: 'C-ANEMIA',
    claimNumber: 'CLM-2026-002',
    facilityId: 'FASKES-01',
    facilityName: 'RS Sejahtera Sehat',
    encounterId: 'ENC-002',
    patientPseudoId: 'PASIEN-5566',
    patientAge: 45,
    patientGender: 'P',
    admitDate: '2026-10-11',
    dischargeDate: '2026-10-15',
    losDays: 4,
    inacbgCode: 'D-4-10-II',
    inacbgDescription: 'Anemia Berat Rawat Inap',
    severity: 2,
    billedAmount: 8500000,
    primaryDiagnosis: { code: 'D64.9', name: 'Anemia Berat Gravis' },
    secondaryDiagnoses: [{ code: 'R50.9', name: 'Febris' }],
    procedures: [],
    specialItems: [],
    items: [],
    resumeText: 'Pasien merasa lemas. Diberikan multivitamin oral. Tidak ada indikasi transfusi.',
    currentVersion: 1,
    status: 'menunggu_verifikasi',
    riskScore: 0,
    riskBand: 'Rendah',
    fastTrack: false,
    findings: [],
    seal: {} as any,
    labRefs: [{ labResultId: 'L2', labSealHash: 'def', testName: 'Hemoglobin', value: 11.4, unit: 'g/dL' }],
    createdAt: '2026-10-16T08:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z',
  };

  const result = evaluateClaimRules(anemiaClaim);
  assert.ok(result.findings.some((f) => f.ruleId === 'U1'));
  assert.equal(result.riskBand, 'Sedang');
  assert.equal(result.fastTrack, false);
});

test('evaluateClaimRules triggers R-SEAL on tampered claim and forces High risk', () => {
  const tamperedClaim: Claim = {
    id: 'C-TAMPER',
    claimNumber: 'CLM-2026-003',
    facilityId: 'FASKES-01',
    facilityName: 'RS Sejahtera Sehat',
    encounterId: 'ENC-003',
    patientPseudoId: 'PASIEN-9999',
    patientAge: 50,
    patientGender: 'L',
    admitDate: '2026-10-12',
    dischargeDate: '2026-10-15',
    losDays: 3,
    inacbgCode: 'D-4-10-I',
    inacbgDescription: 'Klaim Tampered',
    severity: 1,
    billedAmount: 10000000,
    primaryDiagnosis: { code: 'A91', name: 'Dengue' },
    secondaryDiagnoses: [],
    procedures: [],
    specialItems: [],
    items: [],
    resumeText: 'Teks dimodifikasi secara sepihak.',
    currentVersion: 1,
    status: 'menunggu_verifikasi',
    riskScore: 0,
    riskBand: 'Rendah',
    fastTrack: false,
    findings: [],
    seal: {} as any,
    labRefs: [],
    isTampered: true,
    tamperReason: 'Leaf resume medis tidak cocok dengan hash vault',
    createdAt: '2026-10-16T08:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z',
  };

  const result = evaluateClaimRules(tamperedClaim);
  assert.ok(result.findings.some((f) => f.ruleId === 'R-SEAL'));
  assert.equal(result.riskBand, 'Tinggi');
  assert.equal(result.fastTrack, false);
});
