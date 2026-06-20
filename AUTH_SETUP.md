# artic. Tool Portal authentication setup

The portal uses Firebase Authentication for passwords and Firestore user documents for project roles. Never add passwords to this repository, Firestore documents, or frontend environment variables.

## 1. Enable authentication

In Firebase Console for `artic-ptr-paytable`, enable **Authentication > Sign-in method > Email/Password**. Enable a password policy and email-enumeration protection before production use.

## 2. Initial users

Create these initial accounts with new, unique passwords. After the administrator can sign in, create additional members from **Control Center > New member**. The form accepts only `@artic.live` addresses. The old PTR PIN values were committed to Git history and must be considered compromised.

| Team member | Firebase email |
| --- | --- |
| 김민제 (Administrator) | `admin@artic.live` |
| 박광규 | `boise@artic.live` |
| 조경엽 | `arkyteccc@artic.live` |
| 김정호 | `nekim@artic.live` |
| 현명은 | `recw_j@artic.live` |

## 3. Create Firestore profiles

For each Firebase Auth UID, create `users/{uid}` with the matching shape:

```json
{
  "loginId": "admin",
  "displayName": "김민제",
  "memberKey": "민제",
  "projects": {
    "ptr": "admin",
    "tnt": "admin"
  }
}
```

Initial role assignments:

| Team member | PTR | TNT |
| --- | --- | --- |
| 김민제 | admin | admin |
| 박광규 | member | member |
| 조경엽 | member | - |
| 김정호 | member | - |
| 현명은 | - | - |

## 4. Deploy security rules

Delete the legacy `credentials` field from `paytable/main` in Firestore. The old PIN values must not remain in the live document after migrating to Firebase Authentication.

Review the profiles and confirm that field is gone, then deploy:

```sh
npx firebase-tools deploy --only firestore:rules
```

The rules allow PTR project members to read PayTable data and PTR administrators to write it. Only `admin@artic.live` may create member profiles. Members can submit their own PTR/TNT participation requests, but cannot approve requests or change project roles.

Google sign-in is accepted only when the selected Google account uses an `@artic.live` address and already has an administrator-created Firestore profile. Other Google accounts are signed out, and newly created unauthorized Auth records are removed immediately.
