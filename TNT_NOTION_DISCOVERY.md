# TNT Notion Discovery and Product Direction

Last reviewed: 2026-06-20 (Asia/Seoul)

## Decision

TNT will be expanded from a settlement calculator into a private project manager before the company-wide Notion migration begins. During this phase, Notion remains the source of truth and the web tool stores only newly entered prototype data in the browser. Firestore and migration synchronization are intentionally deferred.

## Workspace Findings

- The workspace has three active teamspaces: `lab.`, `team.`, and `working.`.
- `lab.` is oriented around incoming requests and approved project intake.
- `team.` is the operational center for meetings, project trackers, budgets, and team process documents.
- `working.` contains long-form documents for individual creative projects.
- TASTING NOTE is a `Project` page inside the shared `회의` data source rather than an independent project database.
- The TASTING NOTE page relates to 14 child meeting/process documents and embeds filtered views and project-specific databases.

## TNT Operating Model

The first product model follows the recurring episode lifecycle found in the TNT documents:

1. Planning
2. Guest outreach
3. Pre-production and questionnaire
4. Production
5. Editing and archive handoff
6. Publishing and settlement

The guest tracker currently uses 12 workflow statuses, ranging from `컨택 전` and `출연 문의` through `섭외 완료`, `촬영 완료`, refusal, and cancellation. The first web prototype preserves these labels to reduce migration friction.

## Current Prototype Structure

- Overview dashboard for active episodes, confirmed guests, workflow completion, and published episodes.
- Project wiki for the proposal, guest guideline, outreach templates, pre-production process, and artist note form.
- Guest pipeline using the existing 12-state Notion vocabulary.
- Episode board with stage, owner, shoot date, and publish date.
- Production page with the recurring checklist and the 17-question artist note structure.
- Location and equipment tracker derived from the venue and episode preparation documents.
- Existing member expense-splitting calculator retained under cost and settlement management.
- Meeting and feedback archive seeded with the source Notion document structure.
- PPL and partnership tracker derived from the sponsorship proposal.
- PTR-style floating navigation: collapsible desktop rail, expandable tablet rail, and mobile drawer below the portal header.
- Browser `localStorage` persistence under `artic-tnt-project-manager-v1`.

No existing Notion guest rows are embedded in the static application bundle. This avoids publishing private contact and outreach data before a protected backend exists.

## Backend Contract for the Next Phase

The UI should later read and write project-scoped Firestore collections:

- `projects/tnt/episodes/{episodeId}`
- `projects/tnt/guests/{guestId}`
- `projects/tnt/episodes/{episodeId}/tasks/{taskId}`
- `projects/tnt/episodes/{episodeId}/expenses/{expenseId}`

All reads require a TNT project role. Writes should require `tnt: admin` until per-record ownership rules are designed. Notion IDs and last-edited timestamps should be stored as migration metadata rather than used as primary document IDs.

## Sources

- [TASTING NOTE project](https://app.notion.com/p/26dffc3c3af58095bb20fd89297d34a0)
- [TASTING NOTE revised proposal](https://app.notion.com/p/31affc3c3af58078b79dca263dbf3e55)
- [Guest tracker](https://app.notion.com/p/2ceffc3c3af580ef8ad2f30504dc8aea)
- [Pre-outreach process](https://app.notion.com/p/304ffc3c3af5805db01cddfde25ce78f)
- [Post-outreach preparation](https://app.notion.com/p/2f6ffc3c3af5806daf2ee60e92b2383d)
- [Venue and operations detail](https://app.notion.com/p/2dcffc3c3af580489d3ade3bbc807c4f)
- [Settlement, venue, and direction feedback](https://app.notion.com/p/318ffc3c3af5809fb960e9713fa5c2e1)
