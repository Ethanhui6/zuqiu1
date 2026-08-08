# NEW_UI_ARCHITECTURE

Date: 2026-08-08

Status: accepted input for strict rebuild Phase 2.

## Evidence used

- `legendevo.com` was replayed at 390 x 844 and 1440 x 900 through landing,
  creation, three academy offers, signing, season preparation, a two-season
  advance, a probabilistic decision, the roll delay, and the result state.
- `career-sim.pages.dev` was replayed at 390 x 844 and 1440 x 900 through origin,
  position, identity, three club choices, and the first career decision.
- The locally recovered `career-sim` build completed ten current browser-driven
  careers at 390 x 844 with 465 visible operations.

## Adopted structure

The new interface combines `legendevo` information hierarchy with the short
decision stage from `career-sim`. It does not copy either site one-to-one.

### 1. Application shell

- One top identity strip: crest/avatar, player name, club, position, age, OVR.
- One route body and one vertical scroll owner.
- One BottomNavigation on mobile.
- One action dock. A page may contribute its primary command to the dock but may
  not create a second fixed CTA above BottomNavigation.
- One overlay manager for Sheet, Modal, result reveal, Toast, and scroll lock.
- Safe-area and viewport geometry come from shared tokens only.

### 2. Career screen hierarchy

The first mobile viewport contains, in order:

1. compact player identity and current status;
2. current season, age, date, and progress track;
3. one active football situation or next-node summary;
4. one primary command;
5. at most three secondary status summaries.

Timeline, detailed statistics, facilities, full roster, news archive, and honor
history live behind tabs, Sheets, or disclosure rows. They are not peer cards in
the first viewport.

Desktop uses a bounded two-column composition derived from `legendevo`:

- main column: current stage, season data, and decision/result;
- side rail: career timeline, next fixture, and compact honors;
- the top player strip spans both columns.

The narrow fixed-width desktop column from `career-sim` is not adopted.

### 3. Stage surfaces

Every playable node uses one of four mutually exclusive stage surfaces:

- `PREPARE`: context, requirements, stakes, and primary command;
- `DECIDE`: two to four materially different choices with known risks/rewards;
- `REVEAL`: bounded roll animation or deterministic settlement feedback;
- `RESULT`: consequences, persisted changes, and one acknowledgement command.

The stage owns the visual emphasis. Supporting data may not compete with it as
equally weighted cards.

### 4. Creation flow

- Full-screen wizard, not the application BottomNavigation shell.
- Compact step indicator and persistent Back/Continue action row.
- Each step fits one decision theme; dense secondary explanation is disclosed.
- Career speed uses three independent selectable cards with stable dimensions.
- Position selection keeps the pitch, but style detail replaces the long list
  after selection rather than rendering every explanation at once.
- Starting offers present exactly three primary invitations at a time and make
  route, expected minutes, development, competition, risk, and salary visibly
  different before signing.

### 5. Visual system

- Premium light presentation is the default baseline; dark mode remains an optional preference.
- Royal blue identifies the product; football green identifies matches; purple
  identifies growth; gold identifies honors; amber identifies transfers; red
  and orange are reserved for injury, failure, and warning.
- Color establishes hierarchy, not decoration. A screen gets one dominant
  semantic accent and neutral supporting surfaces.
- Cards are reserved for concrete entities, choices, and contained tools. Page
  sections remain unframed or use dividers.
- Radius, shadow, spacing, type, motion, elevation, and safe-area values are
  tokens. Route-specific numerical offsets and arbitrary z-index escalation are
  rejected.

### 6. Responsive contract

- Supported phone widths: 320, 375, 390, 393, 414, 428, and 430 px.
- No horizontal document overflow.
- No primary label ellipsis or clipped season-review text.
- Fixed controls cannot cover content or one another.
- One tap activates a control; `touch-action: manipulation` applies to controls.
- The mobile first viewport must expose the current node and its primary action.
- Desktop width is used for hierarchy, not for enlarging every card.

## Route ownership

| Route | First surface | Secondary surface |
| --- | --- | --- |
| Creation | current wizard decision | player preview/detail |
| Career | current season stage | timeline and season records |
| Match | matchup and player status | formations and full lineups |
| Club/Transfer | current club or live negotiation | roster, contract, market archive |
| Training | annual plan or active drill | growth history |
| Honors | trophy cabinet | award seasons and qualification detail |
| News | three to five important stories | complete sports feed |

## Rejected legacy patterns

- stacked peer cards from top to bottom;
- nested cards;
- duplicate fixed CTA plus BottomNavigation;
- two tab systems on one page;
- technical English labels in primary Chinese UI;
- a desktop layout that remains a narrow mobile column;
- immediate event result without a reveal state;
- hidden primary action below long explanatory content.

This contract is the Phase 2 implementation boundary. Later phases may replace
domain content inside these surfaces but may not create a competing shell.
