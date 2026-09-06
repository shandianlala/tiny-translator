# Tiny Translator

精简划词查词 Chrome 插件（Manifest V3，开发者模式加载）。PRD 见 `docs/PRD.md`。

## Agent skills

### Issue tracker

Issues are local markdown files under `docs/issues/` (PRDs under `docs/`); no external tracker, no PR triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — the five canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) map to themselves, applied via the `labels:` frontmatter array. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root (created lazily). See `docs/agents/domain.md`.
