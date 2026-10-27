import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalizeJson,
  sha256Sync,
  hashLeaf,
  computeMerkleRoot,
  buildClaimLeaves,
  createSeal,
  verifySealLeaves,
  verifyChainIntegrity,
} from './crypto';

test('canonicalizeJson produces deterministic sorted keys without whitespace', () => {
  const obj1 = { b: 2, a: 1, c: { z: 9, y: 8 } };
  const obj2 = { a: 1, c: { y: 8, z: 9 }, b: 2 };
  assert.equal(canonicalizeJson(obj1), '{"a":1,"b":2,"c":{"y":8,"z":9}}');
  assert.equal(canonicalizeJson(obj1), canonicalizeJson(obj2));
});

test('sha256Sync hashes correctly', () => {
  const hashEmpty = sha256Sync('');
  assert.equal(hashEmpty, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

  const hashTest = sha256Sync('verimed-2026');
  assert.equal(typeof hashTest, 'string');
  assert.equal(hashTest.length, 64);
});

test('computeMerkleRoot is consistent and alters if a leaf changes', () => {
  const leaf1 = hashLeaf('data1');
  const leaf2 = hashLeaf('data2');
  const leaf3 = hashLeaf('data3');

  const root1 = computeMerkleRoot([leaf1, leaf2, leaf3]);
  const root2 = computeMerkleRoot([leaf1, leaf2, leaf3]);
  assert.equal(root1, root2);

  // Altered leaf
  const leaf2Tampered = hashLeaf('data2-tampered');
  const rootTampered = computeMerkleRoot([leaf1, leaf2Tampered, leaf3]);
  assert.notEqual(root1, rootTampered);
});

test('createSeal and verifySealLeaves detect working copy tampering', () => {
  const mockClaimData = {
    encounterId: 'ENC-001',
    patientPseudoId: 'PASIEN-7788',
    admitDate: '2026-10-10',
    dischargeDate: '2026-10-13',
    inacbgCode: 'D-4-10-I',
    severity: 1,
    billedAmount: 4500000,
    items: [{ code: 'INFUS-SET-STD', description: 'Infus set', amount: 120000 }],
    resumeText: 'Pasien rawat inap dengan DBD grade 1.',
    labRefs: [{ labResultId: 'LAB-001', labSealHash: 'a1b2c3d4' }],
    version: 1,
  };

  const leaves = buildClaimLeaves(mockClaimData);
  assert.equal(leaves.length, 5);

  const seal = createSeal({
    kind: 'claim',
    refId: 'CLAIM-001',
    version: 1,
    leaves,
  });

  // Verify intact
  const resultIntact = verifySealLeaves(seal, leaves);
  assert.equal(resultIntact.isValid, true);
  assert.equal(resultIntact.tamperedLeaves.length, 0);

  // Simulate tamper on item billing
  const tamperedLeaves = buildClaimLeaves({
    ...mockClaimData,
    billedAmount: 9800000, // Modified amount
  });
  const resultTampered = verifySealLeaves(seal, tamperedLeaves);
  assert.equal(resultTampered.isValid, false);
  assert.ok(resultTampered.tamperedLeaves.length > 0);
});

test('verifyChainIntegrity detects unbroken and broken chain', () => {
  const leafA = [{ id: '1', label: 'L1', hash: hashLeaf('A') }];
  const leafB = [{ id: '2', label: 'L2', hash: hashLeaf('B') }];

  const seal1 = createSeal({
    kind: 'claim',
    refId: 'C1',
    version: 1,
    leaves: leafA,
    prevSealHash: '0'.repeat(64),
    createdAt: '2026-10-26T01:00:00Z',
  });

  const seal2 = createSeal({
    kind: 'claim',
    refId: 'C2',
    version: 1,
    leaves: leafB,
    prevSealHash: seal1.sealHash,
    createdAt: '2026-10-26T01:05:00Z',
  });

  const checkValid = verifyChainIntegrity([seal1, seal2]);
  assert.equal(checkValid.isChainIntact, true);

  // Broken chain: wrong prev hash
  const badSeal2 = { ...seal2, prevSealHash: 'deadbeef'.repeat(8) };
  const checkBroken = verifyChainIntegrity([seal1, badSeal2]);
  assert.equal(checkBroken.isChainIntact, false);
});
