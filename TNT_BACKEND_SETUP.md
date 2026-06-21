# TNT Backend Setup

The TNT frontend reads the existing portal Firebase session and requires the `tnt` project role. Project members can read and download files. Only `projects.tnt = "admin"` can create or change operational data.

## Firebase services

Enable Firestore, Cloud Storage, and Cloud Functions in project `artic-ptr-paytable`, then deploy in this order:

```sh
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase functions:secrets:set NOTION_TOKEN
firebase deploy --only functions
```

The Functions runtime is Node.js 20 in `asia-northeast3`.

## Notion integration

Create an internal Notion integration, share the `게스트 관리` data source with it, and store the token in Firebase Secret Manager as `NOTION_TOKEN`.

The dashboard never syncs in the background. `tntPreviewNotionSync` returns field-level differences and `tntApplyNotionSync` applies only the operations explicitly approved by a TNT administrator. The formula-based episode number remains TNT-only.

## Google Form integration

Enable Google Forms API for the Firebase/Google Cloud project. Share the TASTING NOTE form with the Functions runtime service account so it can use these read-only scopes:

- `forms.body.readonly`
- `forms.responses.readonly`

The administrator runs `tntSyncGoogleFormResponses` manually. Responses are idempotent by Google response ID. Unmatched artist names remain in `projects/tnt/questionnaireInbox` for review.

## Initial data

Open TNT through the authenticated portal as a TNT administrator and choose `초기 데이터 구성`. The initializer is idempotent and creates:

- 27 guest master records: 25 audited Notion rows plus Crush and 강지원
- 7 published episodes, 2 provisional future episodes, and the cancelled 조권 production
- One shared 홍이삭/공원 shoot batch with date and call times unset
- Versioned workflow tasks, the 조권 Shorts deliverable, and its unscheduled planning meeting

Existing browser `localStorage` prototype data is not imported automatically.
