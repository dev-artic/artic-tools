import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

let environment;
let adminContext;
let memberContext;
let outsiderContext;

before(async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    readFile(new URL('../storage.rules', import.meta.url), 'utf8'),
  ]);
  environment = await initializeTestEnvironment({
    projectId: 'artic-ptr-paytable',
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await firestore.doc('users/admin-user').set({ projects: { tnt: 'admin' } });
    await firestore.doc('users/member-user').set({ projects: { tnt: 'member' } });
    await firestore.doc('users/outsider-user').set({ projects: {} });
    await firestore.doc('projects/tnt').set({ schemaVersion: 1 });
    await firestore.doc('projects/tnt/episodes/example').set({ title: 'Example', archivedAt: null, version: 1 });
  });
  adminContext = environment.authenticatedContext('admin-user', { email: 'admin@artic.live' });
  memberContext = environment.authenticatedContext('member-user', { email: 'member@artic.live' });
  outsiderContext = environment.authenticatedContext('outsider-user', { email: 'outsider@artic.live' });
});

after(async () => environment?.cleanup());

test('TNT members read while outsiders are denied', async () => {
  await assertSucceeds(memberContext.firestore().doc('projects/tnt/episodes/example').get());
  await assertFails(outsiderContext.firestore().doc('projects/tnt/episodes/example').get());
});

test('only TNT administrators write operational documents', async () => {
  await assertSucceeds(adminContext.firestore().doc('projects/tnt/episodes/example').update({ title: 'Updated', version: 2 }));
  await assertFails(memberContext.firestore().doc('projects/tnt/episodes/example').update({ title: 'Member edit' }));
  await assertFails(outsiderContext.firestore().doc('projects/tnt/episodes/new').set({ title: 'No access' }));
});

test('activity records are append-only', async () => {
  const activity = adminContext.firestore().doc('projects/tnt/activity/event-1');
  await assertSucceeds(activity.set({ action: 'update' }));
  await assertFails(activity.update({ action: 'tampered' }));
  await assertFails(activity.delete());
});

test('hard deletes are denied for operational records', async () => {
  await assertFails(adminContext.firestore().doc('projects/tnt/episodes/example').delete());
});

test('only administrators record conflict resolutions and records cannot be deleted', async () => {
  const adminResolution = adminContext.firestore().doc('projects/tnt/syncConflicts/example-uploadDate');
  await assertSucceeds(adminResolution.set({ episodeId: 'example', field: 'uploadDate', status: 'resolved', chosenSource: 'tnt', archivedAt: null, version: 1 }));
  await assertFails(memberContext.firestore().doc('projects/tnt/syncConflicts/member-attempt').set({ status: 'resolved' }));
  await assertFails(adminResolution.delete());
});

test('Storage permits admin JSON upload and member download only', async () => {
  const adminRef = adminContext.storage().ref('tnt/episodes/example/typing-json/example.json');
  await assertSucceeds(adminRef.putString('{"ok":true}', 'raw', { contentType: 'application/json' }));
  const memberRef = memberContext.storage().ref('tnt/episodes/example/typing-json/example.json');
  const url = await assertSucceeds(memberRef.getDownloadURL());
  assert.match(url, /^http/);
  await assertFails(memberContext.storage().ref('tnt/episodes/example/typing-json/member.json').putString('{}', 'raw', { contentType: 'application/json' }));
});
