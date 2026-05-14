# About this project

> **Cardano Unified MCP Server** — an independent, community-maintained
> knowledge server for people **building** on Cardano. Run by
> [Easy1Staking](https://easy1staking.com).

This document answers the questions people reasonably ask before
wiring an external knowledge source into an AI assistant: where does
the knowledge come from, who decides what's in it, what happens if
someone tries to poison it, and who do I talk to if something is
wrong.

If you only read one section, read [Where the knowledge comes
from](#where-the-knowledge-comes-from) — it is the defining property
of this project.

---

## What is an MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is
an open standard that lets an AI assistant talk to an external
"server" that provides **tools** (things the assistant can call),
**resources** (things the assistant can read), and **prompts** (ready-
made templates). Think of it as a USB port for AI assistants: plug in
an MCP server and the assistant gains whatever capabilities that
server exposes.

This particular MCP server exposes **Cardano developer knowledge** —
documentation, smart-contract references, SDK guides, standards,
governance tooling, and 15 structured workflow skills. Once
connected, your assistant can answer Cardano-specific questions with
citations instead of making things up from whatever it happened to
remember from its training data.

---

## What this project is — and what it is not

**It is:** a searchable knowledge base of developer documentation for
the Cardano ecosystem, plus a library of workflow skills (write a
validator, debug a transaction, explain a CIP, …). Smart-contract
languages, off-chain SDKs, chain indexers, governance tools, scaling
research, CIPs.

**It is not:**

- A token, a tokenised product, or connected to any token launch.
- A dApp, DEX, lending protocol, or any DeFi protocol.
- A wallet, a wallet connector endorsement, or a KYC service.
- A financial advisor, tax advisor, or investment tool.
- A ranking board deciding which project "wins" a category.
- Affiliated with any foundation, IOG, Intersect, or ecosystem body.
  It is an independent project run by Easy1Staking.

If what you are building fits under "software that helps people build
on Cardano" — a language, a library, a debugger, a testnet, a
standard, a framework — it is in scope. Everything else is out of
scope, by design.

---

## Where the knowledge comes from

**All knowledge in this server is pre-indexed from a fixed, public
allowlist** maintained by the
[`cardano-dev-skills`](https://github.com/easy1staking-com/cardano-dev-skills)
project. The server never performs a live web search at query time.
It does not fetch arbitrary URLs. It cannot be tricked into reading
from a site the maintainer has not explicitly accepted.

The allowlist lives in
[`cardano-dev-skills/registry/sources.yaml`](https://github.com/easy1staking-com/cardano-dev-skills/blob/main/registry/sources.yaml).
Every entry is a public GitHub repository. Nothing else. No hidden
data sources, no private datasets, no undocumented scraping, no
in-server search engine.

The ingestion pipeline is described in detail in
[`docs/architecture.md`](./docs/architecture.md), but the short
version:

1. `cardano-dev-skills` clones each listed repository weekly via its
   own GitHub Action, applies per-source glob patterns, and commits
   the resulting markdown/MDX/Aiken/Python/RST files under
   `docs/sources/<slug>/`.
2. This server's Sunday Kubernetes CronJob pulls a fresh
   `cardano-dev-skills` checkout, runs `npm run ingest`, which reads
   the vendored content, applies format-aware chunking, generates
   embeddings, and atomically swaps the result into the SQLite vector
   database.
3. At query time, the MCP server searches that local DB. Never reaches
   the open web.

When an assistant returns an answer from this server, it also returns
the **exact source** via the `cardano://doc/{source}/{path}` MCP
resource. You can always click through to the originating file in its
upstream repository. There is nothing opaque about the supply chain.

---

## Workflow skills

In addition to searchable documentation, this server exposes 15
structured workflow skills as MCP prompts. Each one is a step-by-step
guide for a common Cardano development task — writing a validator,
debugging a failing transaction, choosing the right SDK, explaining a
CIP, setting up a local devnet. The skills live in
[`cardano-dev-skills/skills/`](https://github.com/easy1staking-com/cardano-dev-skills/tree/main/skills)
and are loaded directly from the same checkout that supplies the
documentation.

Each skill is invocable both via `prompts/list` (any MCP client) and
via the `get_skill` tool. The skill workflow itself uses the server's
`search_docs` tool to pull cited content from the indexed
documentation — so the agent isn't relying on training data even
within the workflow.

---

## How it is maintained

The hosted instance at `mcp.easy1staking.com` is operated by
Easy1Staking. The refresh cycle:

1. **Monday (in `cardano-dev-skills`):** a scheduled GitHub Action
   re-clones every upstream repo, re-vendors content, and opens a PR
   with the diff. A maintainer reviews + merges.
2. **Sunday (in this repo's K8s CronJob):** clones `cardano-dev-skills`
   HEAD, re-chunks, re-embeds, swaps the SQLite database.

Changes to the allowlist happen through pull requests against
[`cardano-dev-skills`](https://github.com/easy1staking-com/cardano-dev-skills),
not against this repository. Every PR there is:

- Schema-validated by skills' own CI.
- Manually reviewed by a maintainer against the acceptance criteria
  (active maintenance, build-on-Cardano scope, permissive license).
- Tested for vendoring success — globs must actually match files.

This server's own CI runs a nightly
[Skills Drift](./.github/workflows/skills-drift.yml) check that pulls
`cardano-dev-skills` HEAD and asserts the registry shape is still
compatible with this server's loader. A red badge means upstream has
drifted in a way that would break Sunday's indexer — a heads-up
before the breakage hits production.

There is no CMS, no external content editor, no authenticated admin
panel. The only way to add or change what this server knows is a PR
with a visible diff and a public review.

---

## Acceptance criteria for a documentation source

(These criteria are enforced by `cardano-dev-skills`, since that is
where new sources are added.)

A source is accepted if **all** of the following are true:

1. **It is actively developed or maintained.** Abandoned repositories
   do not get indexed — their docs rot and mislead.
2. **It is a framework, SDK, library, tool, reference, or standard**
   that helps people *build* on Cardano. On-chain languages,
   off-chain SDKs, indexers, devnets, CIPs, design-pattern catalogues,
   security references — yes. Dashboards, products, protocols — no.
3. **It is a public GitHub repository** with documentation in a
   machine-readable format (markdown, MDX, reStructuredText, OpenAPI
   YAML, or Aiken/Python source with doc comments).
4. **It does not conflict with the exclusions above** — no tokens, no
   dApps, no DEXes, no wallets-as-product, no financial advice, no
   project endorsements.

If a source clearly meets these criteria, open a PR against
`cardano-dev-skills`. If there is any doubt, open an issue first and
describe the project.

---

## Neutrality

This project does not favour one Cardano vendor, SDK, or language
over another. The test of that claim is visible in the index itself:

- **Eight smart-contract languages** side by side: Aiken, Plutus,
  OpShin, Plutarch, Plu-ts, Scalus, Pebble, Helios.
- **Eight off-chain SDKs** side by side: Mesh, Evolution SDK,
  cardano-js-sdk, PyCardano, cardano-client-lib, Cardano Serialization
  Lib, Buildooor, Cardano Connect with Wallet.
- **Five chain-data tools** side by side: Ogmios, Kupo, Blockfrost,
  Koios, Cardano GraphQL, plus supporting libraries like Pallas, Oura,
  Dolos.

If an actively-maintained project is missing from a category, that is
a gap to fix, not a policy. Open an issue or a PR against
`cardano-dev-skills`.

The built-in workflow skills (e.g. `build-transaction`,
`suggest-tooling`) accept an SDK or language as part of the user's
request — the user chooses, the workflow adapts. The server does not
push a preferred stack.

---

## Trust and safety

The honest failure mode to worry about: a malicious contributor
submits a PR that adds a repository containing deliberately misleading
or malicious documentation, aimed at tricking AI agents into
generating unsafe code. The mitigations already in place:

- **No live web fetch.** Even if an attacker controls a random
  website, the server will never see it. The only way in is via a PR
  to `cardano-dev-skills`.
- **Schema-validated PRs.** A broken registry entry is rejected by
  skills' CI before any human reviewer sees it. Attackers cannot
  smuggle misformed entries through.
- **Human review of every allowlist change.** Every new source is
  read by a maintainer against the acceptance criteria.
- **Public audit trail.** The full history of skills' registry is in
  git. Every change has an author, a timestamp, and a diff that
  anyone can inspect.
- **Source attribution in every answer.** The MCP resources
  (`cardano://sources`, `cardano://source/{name}`,
  `cardano://doc/{source}/{path}`) let the end user see exactly which
  upstream document an answer is derived from. Trust is verifiable,
  not assumed.
- **No code execution.** This server stores and retrieves text. It
  does not compile, run, or evaluate anything from the indexed
  sources.

These mitigations are not theatre. They compose: an attacker would
need to ship a convincing-enough PR past a human reviewer in
`cardano-dev-skills` *and* hope nobody notices the source citation
in the eventual answer.

---

## Reporting a problem

- **Found a bug, a broken link, or an out-of-date source?** Open an
  issue: <https://github.com/easy1staking-com/cardano-unified-mcp-server/issues>
- **Want a new source added?** Open an issue or a PR against
  `cardano-dev-skills`. See its
  [CONTRIBUTING](https://github.com/easy1staking-com/cardano-dev-skills/blob/main/docs/CONTRIBUTING.md)
  for the acceptance criteria and the flow.
- **Found something misleading or harmful in an indexed source?**
  Open an issue on either repo with the source name and the path of
  the document. The maintainer can remove or narrow the source's glob
  patterns in `cardano-dev-skills`; the next ingest run will reflect
  the change.

There is no email address, no Discord, no hidden back-channel. GitHub
issues are the one and only intake.

---

## Maintainer

This project is run by [Easy1Staking](https://easy1staking.com), a
Cardano stake pool operator. It is an independent community effort;
it is not affiliated with, endorsed by, or operated on behalf of any
Cardano foundation, IOG, Intersect, or other ecosystem body.

If you want to help, the lowest-friction contribution is adding a
source you use and trust to
[`cardano-dev-skills`](https://github.com/easy1staking-com/cardano-dev-skills).
