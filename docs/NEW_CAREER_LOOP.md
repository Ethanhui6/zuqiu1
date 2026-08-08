# NEW_CAREER_LOOP

Date: 2026-08-08

Status: accepted input for strict rebuild Phase 2 and the later gameplay phases.

## Evidence used

`legendevo` proves that 1/2/3-season modes can retain complete seasonal records
while changing only player interaction density. `career-sim` proves that a full
career remains legible when each stop is one decision followed by one explicit
result acknowledgement.

The current ten-route `career-sim` replay completed 217 seasons with 201 choices
and 264 result confirmations, 465 visible operations total. Observed operation
density was approximately:

- long/immersive: 3.76 to 4.38 operations per season;
- normal/standard: 1.85 to 2.06 operations per season;
- express/fast: 1.24 to 1.60 operations per season.

## Canonical state machine

```text
CREATE
  -> INVITATIONS
  -> PRESEASON
  -> SIMULATE_SEASON
      -> PAUSE_NODE? -> DECIDE -> REVEAL -> RESULT_ACK -> SIMULATE_SEASON
      -> SEASON_END -> SEASON_REVIEW_ACK
  -> OFF_SEASON
      -> TRANSFER_OR_CONTRACT? -> DECIDE -> REVEAL -> RESULT_ACK
      -> NEXT_SEASON
  -> PRESEASON
  -> ...
  -> RETIREMENT_REVIEW -> CAREER_ARCHIVE
```

Only one state may be player-blocking. Every blocking state has exactly one
named next command. A result cannot disappear on a timer or be skipped by route
navigation.

## Mode contract

| Mode | Seasons requested per advance | Interaction budget | Mandatory early stops |
| --- | ---: | ---: | --- |
| Immersive | 1 | at most 4.5 operations/season | key match, event, training, injury, contract, transfer, national team, honor |
| Standard | 2 | at most 2.2 operations/season | major event, key match, contract, transfer, severe injury, national team, major honor |
| Fast | 3 | at most 1.7 operations/season | major transfer, contract expiry, severe injury, final, national team tournament, major honor, retirement |

An advance request is a batch size, not a data-loss mode. Every contained season
is simulated, settled, and stored independently before the next begins.

## Season loop

1. Create schedule, competition eligibility, contract state, squad role, annual
   training plan, and season trophy/honor/achievement targets.
2. Auto-simulate ordinary fixtures and routine weeks.
3. Pause only when the mode policy and node importance require a decision.
4. Resolve the choice from player attributes, context, relationships, pressure,
   fatigue, and a deterministic seeded roll.
5. Show the reveal, persist effects once, then require result acknowledgement.
6. Continue until every scheduled competition is settled.
7. Freeze one season record before producing review UI.
8. Require review acknowledgement, then run one off-season.
9. Apply transfers, contracts, age, roster and competition changes exactly once.
10. Reset progress and targets for the next season without altering history.

## Pause priority

When several nodes share a date, the player sees one queue in this order:

1. career-ending or contract-expiry decision;
2. severe injury or suspension consequence;
3. final, decisive rivalry, debut, comeback, or national-team match;
4. formal transfer/renewal negotiation;
5. major event or annual training decision;
6. award reveal and season review;
7. routine information, which never blocks.

The queue prevents duplicate overlays and guarantees that resolving one node
reveals the next rather than silently discarding it.

## Interaction rules

- Choices expose likely benefit, downside, and relevant requirement.
- Dynamic probability is calculated at resolution time; choices are not fixed
  to a shared percentage.
- Probabilistic choices use `DECIDE -> REVEAL -> RESULT`; deterministic choices
  may skip the roll animation but still use `RESULT`.
- A result records cause, roll/chance where applicable, effects, date, season,
  characters, and the next state.
- Ordinary matches are never opened as interactive screens when the player is
  not selected.
- Interactive matches are scarce career highlights, not the season clock.

## Persistence invariants

- One fixture result, season settlement, honor, achievement, transfer, and
  contract transition can be recorded only once.
- Multi-season batches contain ordered season IDs and independent reviews.
- Refresh restores the exact blocking state and remaining batch seasons.
- A contract at zero months cannot advance until renewal, transfer, or free
  agency resolves.
- Season progress reaches 100% before review; the next season starts at 0%.
- Existing saves receive defaults for new fields without regenerating historical
  squads, results, or honors.
- Retirement is terminal and exposes only archive/share/new-career actions.

## Feedback budget

- Choice acknowledgement begins immediately.
- Roll/reveal duration is 0.6 to 1.2 seconds and respects reduced motion.
- Result confirmation is a deliberate tap.
- Routine simulation uses one compact transition rather than a stream of Toasts.
- Home always states current season/date, current node, next node, and the one
  action required to continue.

This loop is the single career orchestration contract. Match, transfer, event,
growth, award, and off-season phases must integrate with it rather than creating
parallel advancement systems.
