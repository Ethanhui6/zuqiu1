# PH9 Acceptance

Version: `20.39.0`

Scope: unified club and transfer center, active market interest, player requests, formal offers, renewals, loans, and contract expiry recovery.

- The transfer center exposes seven stable secondary tabs: current club, squad role, complete squad, contract, club interest, formal offers, and agent.
- External transfer activity excludes the player's current club. Current-club renewal offers are stored separately as `transfer.contractOffer`.
- Contract months `<= 6` produces one actionable renewal offer. Contract months `0` produces an expired-renewal path; accepting it restores an active contract.
- External club transfer and loan intent is recorded in the market pipeline and cannot target the current club.
- The 390px browser gate checks all seven tabs, renewal handling, and horizontal overflow.

PH9 STATUS: PASS
