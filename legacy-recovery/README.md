# Legacy Recovery: career-sim.pages.dev

Captured on 2026-08-08 from the public deployment at `https://career-sim.pages.dev/`.

## Raw public artifacts

- `style.css`
- `data.js`
- `events.js`
- `crests.js`
- `qr.js`
- `sim.js`
- `game.js`

The deployment returned the application HTML for `manifest.webmanifest`, `sw.js`, and all probed source-map paths, so no valid public manifest, worker, or source map was recovered.

These files are recovery evidence only. Do not import them from the production application; first extract behavior into the current single career engine.

## Confirmed replay observations

Ten browser-driven careers completed without a gameplay blocker:

| Route | Mode | Result | Player actions |
| --- | --- | --- | --- |
| ST, Liaoning | Normal | age 40, 24 seasons, 5 clubs, 664 appearances | 19 choices, 28 result confirms |
| CB, Shandong | Normal | age 41, 25 seasons, 5 clubs | 19 choices, 28 result confirms |
| GK | Express | age 41, 25 seasons, 3 clubs | 13 choices, 18 result confirms |
| CB | Express | age 41, 25 seasons, 3 clubs | 13 choices, 18 result confirms |
| CM | Express | age 41, 25 seasons, 4 clubs | 16 choices, 22 result confirms |
| LW | Express | age 41, 25 seasons, 4 clubs | 16 choices, 21 result confirms |
| GK, resumed after a browser timeout | Express | age 40, 24 seasons, 3 clubs | final segment: 3 choices, 4 result confirms |
| RW | Express | age 41, 25 seasons, 4 clubs | 14 choices, 20 result confirms |
| ST | Express | age 41, 25 seasons, 4 clubs | 14 choices, 19 result confirms |
| CDM | Express | age 41, 25 seasons, 2 clubs | 16 choices, 22 result confirms |

The goalkeeper route survived a browser-session timeout at age 34 and was resumed to its normal retirement screen. Its full route completed, but the pre-timeout action counters could not be recovered without reading browser storage, so only its verified final segment is listed.

## Reusable behavior findings

- The player starts at 16, makes a club decision, then advances in batches of 1, 2, or 3 seasons by mode.
- Automated seasons still create full appearance, goal, assist, club, trophy, and national-team records.
- Express mode skips ordinary calendar work but still stops for each event outcome and requires a result confirmation.
- Development rises quickly before a late-20s peak, then declines toward retirement around age 40/41.
- Transfers are narrative decisions rather than a club-management screen, and long careers can move through domestic, Asian, and European clubs.
- Probability events briefly render an empty transition state before their result action becomes available; this is an animation delay, not a gameplay blocker.
