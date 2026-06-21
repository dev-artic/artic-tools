# TNT Episode Migration Plan

Last reviewed: 2026-06-21 (Asia/Seoul)

## Objective

Replace the current link-oriented TNT prototype with an episode-centered operational dashboard. Public release data, Notion guest records, NOTE pages, meetings, finance records, and future schedules must be normalized into one episode model without treating any single legacy field as perfectly reliable.

## Source Precedence

1. The public TASTING NOTE project page confirms that an episode was actually published and supplies the public title, release date, ordering, and YouTube ID.
2. The YouTube video ID is the stable public identifier for a published episode.
3. The Notion guest tracker supplies planned episode numbers, shoot dates, planned upload dates, outreach status, and the guest-page relationship.
4. The linked `ARTIST | NOTE` page proves that questionnaire/playlist material exists, but does not prove that track validation, purchases, or a typing JSON package were completed.
5. Conflicting or stale values are preserved as source observations and moved to a manual verification queue. They are not silently overwritten.

## Public Episode Baseline

| Sequence | Guest | Public title | Public date | YouTube ID | Migration status |
|---|---|---|---|---|---|
| Pilot | Crush | Pilot | 2025-12-31 | `ZfD84TkNXGw` | Published; no matching guest-tracker record found |
| EP.1 | 주혜린 | Kindness is Timeless | 2026-02-11 | `CyLnWaJIEhw` | Published; Notion guest and NOTE found |
| EP.2 | O3ohn | 불편함을 고집하는 낭만 | 2026-02-27 | `qBF9UpEug_c` | Published; Notion guest and NOTE found |
| EP.3 | SUMIN | 행복은 시차를 두고 다가온다 | 2026-03-31 | `7_0BYN3TUus` | Published; Notion guest and NOTE found |
| EP.4 | 박문치 | 내가 나로서 솔직해지기 | 2026-05-04 | `vhjjEAU6wRA` | Published; Notion guest and NOTE found |
| EP.5 | MEMI | Rock은 절대 죽지 않아 | 2026-05-11 | `OawNyCoAHpc` | Published; Notion guest, NOTE, and support-finance trail found |
| EP.6 | 강지원 | 영원히 남을 하나의 멜로디를 향해 | 2026-05-28* | `3OyKOqX1tgU` | Published; TNT guest-tracker record not found |

`*` The same public page shows `2026-05-27` in Latest Release and `2026-05-28` in the episode list. Store `2026-05-28` as a provisional canonical value and create a date-conflict issue before production seeding.

## Notion Reconciliation

| Episode | Notion shoot date | Notion planned upload | Public upload | Evidence and discrepancy |
|---|---|---|---|---|
| EP.1 주혜린 | 2026-02-06 | 2026-01-21 | 2026-02-11 | Guest note also mentions a delayed/re-shoot flow; dates require manual confirmation |
| EP.2 O3ohn | 2026-02-10 | 2026-02-28 | 2026-02-27 | NOTE contains 17 answered tracks; planned upload differs by one day |
| EP.3 SUMIN | 2026-03-10 | 2026-03-30 | 2026-03-31 | NOTE exists; planned upload differs by one day |
| EP.4 박문치 | 2026-04-04 | 2026-04-30 | 2026-05-04 | NOTE exists; release moved four days |
| EP.5 MEMI | 2026-04-18 | 2026-05-04 | 2026-05-11 | NOTE exists; support-funding/invoice trail exists, receipt remains unverified |
| EP.6 강지원 | Unknown | Unknown | 2026-05-27/28 | Published publicly but absent from the TNT guest tracker; reconstruct manually |

For already published episodes, all mandatory upstream workflow phases may be imported as `legacy_complete`, with an `evidenceLevel` that distinguishes public inference from actual source documents. Missing evidence must remain visible rather than fabricating timestamps.

## Future Episode Verification Queue

| Notion record | Legacy claim | Current interpretation |
|---|---|---|
| 조권 | EP.6, shoot 2026-05-30, upload 2026-06-06, `섭외 완료 + PPL` | Shoot took place, but the footage was lost and the full episode was cancelled. Retire the EP.6 claim, leave upload date empty, and track a Shorts conversion meeting as the only active work. |
| 홍이삭 | Legacy EP.8 claim, planned upload 2026-08-15, July coordination | Assign EP.7 by the 2026-06-21 operating decision and import as a provisional episode in `schedule_pending`; link to the shared 홍이삭·공원 shoot batch. Exact date, order, and call time remain empty. |
| 공원 | Legacy EP.9 claim, planned upload 2026-09-19, July coordination | Assign EP.8 by the 2026-06-21 operating decision and import as a provisional episode in `schedule_pending`; link to the same shoot batch. Exact date, order, and call time remain empty. |

The stale 조권 EP.6 claim is historical only and does not reserve a sequence. Hong Isaac and Gongwon occupy provisional EP.7 and EP.8 respectively; they remain provisional until production scheduling is confirmed.

## Guest Pipeline Baseline

The Notion guest tracker is not an episode database. It is a casting CRM containing published guests, confirmed future guests, active outreach, untouched candidates, and closed attempts. Migration must therefore create guest prospects independently and link an episode only when one actually exists.

| App bucket | Notion records | Dashboard treatment |
|---|---|---|
| Confirmed but unverified | 홍이삭, 공원 | Show above the funnel with sequence and schedule warnings. Do not activate provisional sequences automatically. |
| Repurposing | 조권 | Show outside the episode pipeline as `full episode cancelled / Shorts meeting pending`; sequence and upload date remain empty. |
| Scheduling | 이디오테잎 DR | Show as the closest unassigned candidate to episode creation. |
| Awaiting response | 지소쿠리클럽, 실리카겔 김한주 | Require a follow-up owner and next-contact date; both legacy follow-up notes are overdue. |
| Outreach sent | HONNE | Keep the sent channel and sent evidence, then require a follow-up date. |
| Contact planned | 로꼬, Colde | Keep the introduction path and intended timing without creating an episode. |
| Candidate pool | 백현진, 윤상, 브로콜리너마저 윤덕원, 윤석철, 원슈타인, 죠지, 칸예 | Rank and enrich as candidates. Episode sequence remains null. |
| Closed history | wave to earth, 우희준, Zion.T, 기리보이 | Exclude from the active funnel by default but retain contact history and reopenability. |

The audited import fixture is stored in [`TNT_GUEST_PIPELINE.json`](./TNT_GUEST_PIPELINE.json). It contains all 25 guest-tracker records found in the current database: five published tracker guests and twenty future, candidate, or closed records. Crush and 강지원 remain episode-only records because the tracker has no matching rows.

Guest and episode lifecycle fields must remain separate:

```text
projects/tnt/guestProspects/{guestId}
  pipelineStatus
  notionStatus
  ownerIds
  contactChannels
  nextContactAt
  commercialType
  episodeAssignment.sequence       // nullable
  episodeAssignment.state          // unassigned | provisional | verified | conflicting
  sourceUrl
  dataQuality[]
  contentDisposition                // optional: cancellation and derivative-content state

projects/tnt/episodes/{episodeId}
  guestId                           // relation to the prospect
  sequence                          // assigned only after editorial confirmation
  lifecycleState
  workflowSummary

projects/tnt/shootBatches/{shootBatchId}
  shootDate                         // nullable until the shared day is fixed
  studioStartTime
  studioEndTime
  articCallTime
  guestOrder[]                      // ordered guest IDs once the running order is fixed
  episodeIds[]
```

Creating an episode from a prospect is an explicit promotion action. Moving a guest between outreach states must never create or renumber an episode as a side effect. A cancelled full episode may retain a separate derivative-content work item without occupying an episode sequence.

홍이삭 and 공원 must share one shoot-batch record rather than duplicating a tentative date on two episodes. The batch controls studio and artic call times; each episode retains its own guest call time. Until the schedule is confirmed, every time field and the guest running order remain null.

## Canonical Workflow Template

| Phase | Required operational records | Completion gate |
|---|---|---|
| Casting | guest, contact channel, outreach owner, agreement type | Appearance confirmed |
| Scheduling | shoot start/end, artist call time, artic call time | All required times confirmed |
| Booking | studio reservation, equipment reservations, costs | Nove.a and every required equipment item reserved |
| Questionnaire | sent/due/received timestamps, source link/file | Response received |
| Playlist QA | playlist version, track rows, validation owner | Every track marked valid or exception-approved |
| Shoot package | audio purchases, receipts, typing artifact | Required tracks purchased and JSON package validated |
| Production | attendance, actual times, shoot notes, backups | Shoot completed and primary/secondary backups confirmed |
| Post | upload date, rough cut, approval, YouTube collaborator, Instagram Reel | Video published and social deliverables completed |

Appearance fees paid by artic. and production support received from the artist are parallel financial entries. They affect episode health but do not determine the chronological phase.

## Firestore Model

```text
projects/tnt/episodes/{episodeId}
  tasks/{taskId}
  schedule/{scheduleId}
  reservations/{reservationId}
  playlistTracks/{trackId}
  artifacts/{artifactId}
  financialEntries/{entryId}
  socialDeliverables/{deliverableId}
  activity/{activityId}
```

The episode document stores summary fields only: sequence, guest, lifecycle state, current phase, progress, health, public metadata, source references, and denormalized next-action data. Detailed operational records live in subcollections.

Every migrated value includes:

```json
{
  "value": "...",
  "sourceType": "public_site | notion_property | notion_page | manual",
  "sourceUrl": "...",
  "observedAt": "...",
  "verification": "verified | provisional | conflicting | missing"
}
```

In the actual Firestore documents this provenance may be grouped under a `migration` map rather than wrapping every runtime field, but the migration script must retain the same information.

## Dashboard Behavior

- The main view is an episode matrix, not separate guest/location/meeting silos.
- Each row shows the eight workflow phases, overall progress, health, next required task, owner, and due date.
- Published legacy episodes collapse by default but remain searchable and inspectable.
- `needs_review`, blocked, and overdue episodes appear above normal active work.
- Selecting an episode opens a detail workspace with phase tasks in the center, schedule/call times on the right, and finance/source conflicts in a persistent side panel.
- Mobile uses phase accordions; desktop and tablet use the full horizontal phase rail.

## Implementation Sequence

1. Accept typing-tool artifacts as schema-free JSON and retain every edit as a downloadable version.
2. Resolve the 강지원 release date; retain Hong Isaac as provisional EP.7 and Gongwon as provisional EP.8, and schedule the 조권 Shorts conversion meeting separately.
3. Add Firestore rules and a typed TNT data service.
4. Create the workflow template and episode progress/health derivation functions with unit tests.
5. Build the episode matrix and episode detail CRUD against Firestore.
6. Add specialized editors for schedules, reservations, questionnaire receipt, playlist QA, purchases, JSON artifacts, finance, and post deliverables.
7. Run a dry-run migration that outputs a reconciliation report without writing Firestore.
8. Import the 25-row guest pipeline fixture, then seed the seven published episodes and only the manually reviewed future episodes.
9. Compare the dashboard against Notion and the public page, then switch new operations to the dashboard.

## Source Pages

- [Public TASTING NOTE project page](https://artic.live/projects/tasting-note/)
- [TASTING NOTE Notion project](https://app.notion.com/p/26dffc3c3af58095bb20fd89297d34a0)
- [Guest tracker](https://app.notion.com/p/2ceffc3c3af580ef8ad2f30504dc8aea)
- [주혜린 guest record](https://app.notion.com/p/2e7ffc3c3af58013b9dbc00ff912d4d1)
- [O3ohn guest record](https://app.notion.com/p/2dcffc3c3af5807dbefff5e0ab14dd2e)
- [SUMIN guest record](https://app.notion.com/p/2dcffc3c3af580da9444fc0f4fb5eecb)
- [박문치 guest record](https://app.notion.com/p/324ffc3c3af5804ba70ad360953f07de)
- [MEMI guest record](https://app.notion.com/p/329ffc3c3af5805fa8a8c79071bc3e69)
- [조권 guest record](https://app.notion.com/p/336ffc3c3af580f4abc8edf05d9acfb3)
- [홍이삭 guest record](https://app.notion.com/p/336ffc3c3af580ee956bed9945c04e04)
- [공원 guest record](https://app.notion.com/p/33bffc3c3af580928d78ceab7dc7f06a)
