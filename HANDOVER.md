# artic-tools handover

Last updated: 2026-06-20 (Asia/Seoul)

## Workspace

- Local path: `/Users/minje/Documents/Antigravity/artic-tools`
- GitHub: `https://github.com/dev-artic/artic-tools`
- Branch: `main`
- Current HEAD: `40f9920`
- `origin/main` was at the same commit when this document was created.
- The repository was renamed from `artic-ptr-paytable` to `artic-tools`. The local `origin` URL has already been updated.

Start a new Codex chat from the new local path. The previous chat is still bound to the deleted `artic-ptr-paytable` directory and should not be used for further edits.

## Recent pushed work

- `9fc33cc`: responsive PTR navigation and floating/collapsed sidebar behavior.
- `fcdf6d1`: global Firebase authentication, Control Center, project access control, and PTR sidebar redesign.
- `2b851bd`: sidebar transition/alignment fixes, indicator stabilization, and document user-role updates.
- `40f9920`: native Google account linking, clearer unregistered-Google errors, and expandable macOS-style Control Center tiles.

## Current uncommitted work

Do not discard or overwrite the current working tree. It contains ongoing UI and authentication work.

Modified paths:

- `index.html`
- `n-bbang-calculator-src/src/App.jsx`
- `n-bbang-calculator/index.html`
- `paytable/style.css`
- `shared/auth.css`
- `shared/auth.js`
- `shared/header.css`
- `shared/header.js`
- `shared/portal-auth.js`

Rebuilt TNT assets:

- Deleted: `n-bbang-calculator/assets/index-BWsnF2hW.js`
- Deleted: `n-bbang-calculator/assets/index-CTiBXAmH.css`
- Added: `n-bbang-calculator/assets/index-s3S2QqTb.js`
- Added: `n-bbang-calculator/assets/index-CZKKv8aE.css`

At handover time, the tracked diff was approximately 978 insertions and 243 deletions across 11 files, excluding the two new generated assets.

## Implemented behavior

### Global authentication

- The tool portal requires Firebase authentication before the home screen is usable.
- Passwords live only in Firebase Authentication. Do not add passwords to source, Firestore documents, or this handover file.
- User profiles and project roles live in `users/{uid}` in Firestore.
- Project roles are `member` or `admin`, scoped independently to `ptr` and `tnt`.
- App cards are disabled when the signed-in profile lacks the corresponding project.

### Accounts and PTR mapping

Configured `@artic.live` addresses:

- 김민제: `admin@artic.live`
- 박광규: `boise@artic.live`
- 조경엽: `arkyteccc@artic.live`
- 김정호: `nekim@artic.live`
- 현명은: `recw_j@artic.live`

PTR member keys are mapped to 민제, 광규, 경엽, and 정호 so each user sees the correct paytable participation and settlement data.

Known project state during testing:

- 김민제: PTR admin, TNT admin.
- 박광규: PTR member, TNT member.
- 조경엽: PTR member.
- 김정호: PTR member.
- 현명은: no project assignment.

There was no TNT-only test account. Logging in as 현명은 correctly disabled both PTR and TNT. An exact TNT-only runtime test still requires assigning a user only `projects.tnt = "member"`.

### PTR authorization

- Non-admin PTR members can open the administrator pages in read-only mode.
- Edit attempts show the existing bottom-right `관리자가 아닙니다.` toast.
- The duplicate PTR sidebar logout button was removed; logout remains in the global Control Center.

### Portal login and registration

- The public Register entry was removed from the initial login card.
- `Forgot password?` is centered.
- New-member registration is exposed only in the portal administrator's Control Center.
- New member emails must use the `@artic.live` domain.
- Google login requires an `@artic.live` Google account and an administrator-created Firestore profile.
- Unauthorized/unregistered Google users are rejected; newly created unauthorized Google Auth records are removed where possible.
- Firestore profile creation is restricted to `admin@artic.live` by deployed rules.

Important limitation: Firebase client Authentication does not separately disable the public email sign-up endpoint while keeping password login enabled. Firestore profile whitelisting prevents such arbitrary Auth accounts from accessing portal data. A stricter Auth-record-level block would require Identity Platform blocking functions or an Admin SDK backend.

### Control Center

- Header account control briefly shows `<name> 님 환영합니다`, then contracts to the avatar after about four seconds.
- The Control Center and tiles use translucent glassmorphism with blur, saturation, highlights, and consistent shadows.
- The top header itself remains outside the Control Center blur layer.
- Tiles include Daum Mail, My Page, Project Participation, and administrator-only New Member Registration.
- Project Participation writes pending requests to `projectJoinRequests/{uid}_{projectId}`.
- Request approval/project-role management UI is not implemented yet.

### Responsive UI

- Desktop sidebar icon alignment and collapse movement were stabilized.
- Tablet uses the collapsed floating sidebar and expands it as an overlay.
- Mobile retains the header hamburger behavior local to the embedded app.
- Footer copy was shortened to remain on one line.

## Firebase

- Firebase project: `artic-ptr-paytable` (the Firebase project ID was not renamed).
- `firestore.rules` compiled and was deployed successfully during the latest auth work.
- Rules protect PTR reads/writes, administrator-only profile creation, and project participation requests.
- Google and Email/Password providers were enabled in Firebase Authentication during prior work.

## Verification performed

- `shared/auth.js`, `shared/portal-auth.js`, and `paytable/app.js` passed `node --check` during their respective changes.
- Firestore rules compiled successfully during deployment.
- 박광규 login was used to verify non-admin PTR read-only behavior.
- Control Center glass styles and the remaining global logout button were inspected in the in-app browser.
- PTR sidebar logout removal was verified in the browser.
- App cards were confirmed disabled for a user with no project assignments.

The final browser regression pass for the latest uncommitted UI was not completed after the directory rename. The previous chat lost its workspace binding, and one localhost reload was blocked by the browser-control policy.

## Known cleanup

- `git diff --check` currently reports trailing whitespace in `n-bbang-calculator-src/src/App.jsx` and `shared/portal-auth.js`.
- Review generated TNT asset replacements before staging.
- Do not revert unrelated working-tree changes; some were made outside the last Codex turn.

## Recommended resume sequence

```sh
cd /Users/minje/Documents/Antigravity/artic-tools
git status --short --branch
git diff --check
node --check shared/auth.js
node --check shared/portal-auth.js
npm run dev
```

Then verify in the browser:

1. Logged-out screen has no Register control and centers `Forgot password?`.
2. A normal member sees Project Participation but not New Member Registration.
3. `admin@artic.live` sees and can open New Member Registration.
4. New-member form rejects non-`@artic.live` email addresses.
5. Non-`@artic.live` and unregistered Google accounts are rejected.
6. A project participation request is created once and duplicate submission is handled cleanly.
7. PTR/TNT app cards reflect the signed-in user's project map.
8. Desktop, tablet, and mobile layouts remain aligned.

After verification, intentionally stage the source changes and the matching generated TNT asset pair, then commit and push to `main` only when requested.
