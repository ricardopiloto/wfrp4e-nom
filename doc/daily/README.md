# Daily development log

Per-day notes for work tied to **`/openspec-apply`**, OpenSpec preparation, or the same maintainer workflow. Reference layout: [fvtt-wfrp4e-gmtoolkit `docs/daily`](https://github.com/ricardopiloto/fvtt-wfrp4e-gmtoolkit/tree/dev/docs/daily) (this module uses **`doc/daily/`** at the repo root).

## Language

All content in `doc/daily/*.md` — headings, bullets, explanations — **must be written in English only**.

## File naming

One file per calendar day: `yyyy-mm-dd.md`.

## Entry structure (required)

Match this shape so logs stay consistent with the gmtoolkit daily model:

```markdown
# Daily log — yyyy-mm-dd

Changes linked to sessions that follow the **OpenSpec apply** flow (or its preparation).

## OpenSpec apply

### `change-id-in-kebab-case`

- **Area label**: what changed; mention paths (`scripts/foo.js`) where helpful.
- **Another area**: …
- **Validation**: `openspec validate <change-id> --strict` (OK) / linter / manual note.

### `another-change-id`

- …
```

Rules:

- Top title: `# Daily log — yyyy-mm-dd` (ISO date).
- One short paragraph under the title (same wording as above is fine).
- `## OpenSpec apply` groups the day’s apply-related work.
- Each logical change is a **`### \`change-id\``** heading (backticks around the id). Use the OpenSpec **change-id** when the work maps to a change; for small meta work without a change folder, use a short kebab **`chore-…`** id and keep it unique within the file.
- Bullets use a **bold lead label** (`**Label**:`) then the detail; end with **Validation** when checks were run.
- Append new `###` blocks (or new bullets under an existing change) as you add more work the same day — same dated file.
