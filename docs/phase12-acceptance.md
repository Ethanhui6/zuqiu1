# PH12 Acceptance

Version: `20.42.0`

Scope: off-season activities, next-season activation, content package metadata, and version display.

- Off-season activity rotation includes recovery, family, agent, awards, renewal, transfer interest, national-team, shirt-number, new-signings, preseason-goals, and training-plan routes.
- Renewal at zero months restores an active contract and clears the blocking contract todo.
- The next season receives fresh objectives, a reset training state, a regenerated schedule, and a reset season track.
- Season records store the content version used to settle them; a newer package is queued and only activated after off-season completion.
- `data/version.json` keeps program version, content version, source, update date, and update log as separate metadata.
- The More page reads the runtime program version and hides a meaningless `.0` patch suffix.

PH12 STATUS: PASS
