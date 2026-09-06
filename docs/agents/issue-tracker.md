# Issue tracker: Local Markdown (docs/issues/)

Issues and PRDs for this repo live as markdown files under `docs/`.

## Conventions

- PRDs live at the top of `docs/`: the first is `docs/PRD.md`, subsequent ones
  are `docs/PRD-<NNN>-<slug>.md` (e.g. `docs/PRD-002-popup-lookup.md`)
- Implementation issues are `docs/issues/<NNN>-<slug>.md`, numbered from `001`,
  in one shared sequence across features
- Each issue starts with YAML frontmatter:

  ```yaml
  ---
  title: <issue title>
  labels: [ready-for-agent]        # triage state — see triage-labels.md
  date: 2026-07-07                 # created
  status: done                     # optional; set when finished
  completed: 2026-07-07            # optional
  verified: 2026-07-07（真机验证通过）  # optional
  ---
  ```

- The body links back to its parent PRD under a `## Parent` heading
- Comments and conversation history append to the bottom of the file under a
  `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file `docs/issues/<NNN>-<slug>.md`, taking the next number in the
sequence, with the frontmatter above.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or
the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `docs/issues/<effort>/map.md` — the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `docs/issues/<effort>/<NN>-<slug>.md`, numbered from `01`,
  with the question in the body. A `type:` frontmatter key records the ticket
  type (`research`/`prototype`/`grilling`/`task`); a `status:` key records
  `claimed`/`resolved`.
- **Blocking**: a `blocked-by: [NN, NN]` frontmatter key. A ticket is unblocked
  when every file it lists is `resolved`.
- **Frontier**: scan the effort directory for tickets that are open, unblocked,
  and unclaimed; first by number wins.
- **Claim**: set `status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set
  `status: resolved`, then append a context pointer (gist + link) to the map's
  Decisions-so-far in `map.md`.
