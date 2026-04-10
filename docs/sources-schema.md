# `config/sources.yaml` — Schema Reference

`config/sources.yaml` is the single source of truth for the documentation
ingestion pipeline. Every repository the MCP server indexes is declared
here. The file is validated at load time — a malformed entry causes
`npm run ingest` to fail with a clear error **before any repo is cloned**.

## Scope & acceptance criteria

A source is accepted into this file if **all** of the following are true:

1. **Actively developed or maintained.** Abandoned repositories do not
   get indexed — their docs rot and mislead.
2. **A framework, SDK, library, tool, reference, or standard** that
   helps people *build* on Cardano. On-chain languages, off-chain
   SDKs, indexers, devnets, CIPs, design-pattern catalogues, security
   references — yes. Dashboards, products, protocols — no.
3. **A public GitHub repository** with documentation in a
   machine-readable format (markdown, MDX, reStructuredText, OpenAPI
   YAML, or Aiken source with doc comments).
4. **Not on the exclusion list** — no tokens, no dApps, no DEXes, no
   wallets-as-product, no financial advice, no project endorsements.

See [`../ABOUT.md`](../ABOUT.md) for the reasoning behind these rules
and for the project's neutrality policy. If you are unsure whether a
source qualifies, open an issue before opening a PR.

## File shape

```yaml
sources:
  - name: Ogmios
    repo: https://github.com/cardanosolutions/ogmios.git
    docsPath: docs
    format: markdown
    category: infrastructure
  - name: ...
```

The top-level key is `sources`, a list of source entries. Order inside
the list does not affect behaviour — entries are processed in the order
they appear, but ranking at query time is independent of order.

## Adding a new source — the short version

1. Find the repository that hosts the docs you want indexed.
2. Append a new entry to `sources:` with the five required fields
   (`name`, `repo`, `docsPath`, `format`, `category`).
3. Add a `description` if the source is non-obvious to a newcomer.
4. Validate the file loads and parses:
   `npm run validate:sources` — fast, no clone. This is the same check
   CI runs on your pull request.
5. (Optional) Dry-run the ingest pipeline against your new source
   without embedding anything: `npm run ingest -- "<name substring>" --validate-only`
6. Full ingest for just that source once you are happy:
   `npm run ingest -- "<name substring>"`

Pull requests that touch `config/sources.yaml` are gated by the
[Validate Sources](../.github/workflows/validate-sources.yml) GitHub
Action. A failing check blocks merge and shows a red badge on the PR,
with the exact Zod error (field path + reason) in the job log.

## Field reference

### `name` *(required, string, unique)*

Human-readable display name. Also used:

- As the CLI filter argument (`npm run ingest -- "Aiken"` matches any
  name containing "aiken", case-insensitive).
- As the key in the database (`db.listSources()` returns these names).
- In the `cardano://source/{name}` MCP resource URI.

**Rules:** must be unique across the whole file. The loader raises
`Duplicate source name` on startup if you collide with an existing name.

### `repo` *(required, URL)*

Full `https://` clone URL of the git repository. Must be a valid URL.
SSH URLs (`git@github.com:...`) are not supported — stick with HTTPS so
the ingest pipeline works in CI and Docker without key material.

### `docsPath` *(required, string)*

Path **inside the cloned repo** where docs live. Use `.` for the repo
root (typical when indexing only the top-level README plus a handful of
explicit globs).

Examples:

| Source | `docsPath` | Meaning |
|--------|------------|---------|
| Ogmios | `docs` | Crawl the `docs/` subdirectory |
| Kupo | `.` | Crawl from the repo root (narrowed by `globPatterns`) |
| PyCardano | `docs/source` | Crawl the Sphinx sources only |

### `format` *(required, enum)*

The **default** parser used for files found under `docsPath`. One of:

- `markdown` — `.md` files. Standard GitHub-flavoured markdown.
- `mdx` — `.mdx` files. MDX stripped of JSX, parsed as markdown.
- `rst` — reStructuredText (`.rst`). Used by Sphinx-based docs.
- `openapi` — YAML OpenAPI specs. Each endpoint becomes a doc chunk.
- `aiken` — `.ak` source files. Doc comments + module structure.
- `toml` — reserved; currently unused.

If files in the source use mixed formats, set `format` to the primary
one and use `formatOverrides` (below) to handle the rest.

### `formatOverrides` *(optional, map<glob, format>)*

Per-glob format overrides applied **on top of** `format`. The key is a
glob pattern, the value is one of the format enum values above.

```yaml
format: markdown
formatOverrides:
  "**/*.yaml": openapi
  "**/*.yml": openapi
```

**Precedence:** the first matching override wins; if no override
matches, the default `format` is used.

### `category` *(required, enum)*

Broad taxonomy used for grouping in the MCP `cardano://sources`
resource and (optionally) as a CLI filter for staged rebuilds in the
future. One of:

- `infrastructure` — chain indexers, query layers, wallets, node
  tooling (Ogmios, Kupo, Blockfrost, Mithril, …).
- `smart-contracts` — on-chain languages, stdlibs, design patterns
  (Aiken, Plutus, OpShin, Plutarch, …).
- `sdk` — off-chain transaction builders and framework libraries
  (Mesh, Evolution SDK, PyCardano, …).
- `standards` — CIPs, CPS, the Developer Portal, canonical docs.
- `governance` — Conway-era governance tooling (GovTool, SanchoNet).
- `scaling` — Layer-2 and scaling research (Hydra, Leios).
- `testing` — devnets, test harnesses, faucets (Yaci DevKit).

If your source does not fit any of these, open a discussion before
adding a new category — every new category ripples into UI, filters,
and category-based prompts.

### `branch` *(optional, string)*

Git branch, tag, or commit to check out after cloning. Defaults to the
repository's default branch. Use this when a source's main branch
contains the docs but a stable tag is preferred for reproducibility.

### `globPatterns` *(optional, list<string>)*

Restricts which files under `docsPath` are read. If omitted, the
ingestion pipeline uses its own sensible defaults based on `format`
(e.g. `**/*.md` for `markdown`).

Use explicit `globPatterns` when:

- The repo is huge and most of it is noise (typical when `docsPath: .`).
- The repo has multiple doc variants and you want only the canonical
  one (Kupo ships per-version OpenAPI specs — we ingest only `nightly.yaml`).
- You want to include files outside the default extensions for the
  format.

Patterns use [minimatch](https://github.com/isaacs/minimatch) globs.

### `description` *(optional, string)*

One-sentence human description of the source. Not currently surfaced
anywhere at runtime, but will feed the landing page and the
`cardano://sources` resource in the future. Add it when the source's
purpose would not be immediately obvious to someone new to the Cardano
ecosystem. Keep it short — one sentence, one line.

## Validation errors

The loader runs on import of `src/config/sources.ts` and will throw on
any of:

- Missing required field.
- `repo` is not a valid URL.
- `format` or `category` is not in the allowed enum.
- `formatOverrides` maps to an invalid format.
- Duplicate `name` across entries.
- YAML syntax error.

Errors are reported with the full path to the offending field, e.g.

```
Invalid config/sources.yaml:
  - sources.7.format: Invalid enum value. Expected 'markdown' | 'mdx' | 'rst' | 'openapi' | 'aiken' | 'toml', received 'markdow'
```

## Removing a source

1. Delete its entry from `config/sources.yaml`.
2. Re-run ingest — the old chunks stay in the DB until the next full
   rebuild. If you want them gone immediately, run
   `npm run ingest` without the name filter (the pipeline calls
   `db.deleteSource(name)` per source it reprocesses, but orphaned
   sources need a manual `db.deleteSource("Old Name")` call or a
   fresh DB file).

## Why YAML and not TypeScript?

The previous incarnation of this file was a `.ts` array. YAML was
chosen because:

- Contributors who want to add a doc source should not need to touch
  TypeScript or run a build.
- PRs that only edit `config/sources.yaml` are trivial to review.
- YAML comments (`#`) survive in-file, so "why is this glob narrow?"
  context stays next to the entry instead of in a separate README.
- Zod validation at load time catches typos immediately with a field
  path, which is more actionable than a TypeScript compile error on
  a string literal union.
