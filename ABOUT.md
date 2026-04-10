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
governance tooling. Once connected, your assistant can answer
Cardano-specific questions with citations instead of making things up
from whatever it happened to remember from its training data.

---

## What this project is — and what it is not

**It is:** a searchable knowledge base of developer documentation for
the Cardano ecosystem. Smart-contract languages, off-chain SDKs,
chain indexers, governance tools, scaling research, CIPs.

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
allowlist.** The server never performs a live web search at query
time. It does not fetch arbitrary URLs. It cannot be tricked into
reading from a site the maintainer has not explicitly accepted.

The allowlist lives in [`config/sources.yaml`](./config/sources.yaml).
Every entry is a public GitHub repository. Nothing else. No hidden
data sources, no private datasets, no undocumented scraping, no
in-server search engine.

The ingestion pipeline is described in detail in
[`docs/architecture.md`](./docs/architecture.md), but the short
version:

1. Read `config/sources.yaml` (validated by Zod on load).
2. `git clone` each listed repository.
3. Parse only the file patterns the YAML tells us to.
4. Chunk, embed, and store in a local SQLite vector database.
5. At query time, search that local DB. Never reach the open web.

When an assistant returns an answer from this server, it also returns
the **exact source** via the `cardano://doc/{source}/{path}` MCP
resource. You can always click through to the originating file in its
upstream repository. There is nothing opaque about the supply chain.

---

## How it is maintained

The hosted instance at `mcp.easy1staking.com` is operated by
Easy1Staking. Documentation is re-ingested weekly via a Kubernetes
CronJob: the pipeline re-clones each repository from the allowlist,
re-chunks, re-embeds, and atomically swaps the result into the
database. That is the entire refresh cycle.

Changes to the allowlist happen through pull requests to this
repository. Every PR that touches `config/sources.yaml` is:

- Schema-validated automatically by the
  [Validate Sources](./.github/workflows/validate-sources.yml) CI
  check — any malformed entry blocks the merge.
- Manually reviewed by the maintainer against the acceptance criteria
  below.

There is no CMS, no external content editor, no authenticated admin
panel. The only way to add or change what this server knows is a PR
with a visible diff and a public review.

---

## Acceptance criteria for a documentation source

A source is accepted if **all** of the following are true:

1. **It is actively developed or maintained.** Abandoned repositories
   do not get indexed — their docs rot and mislead.
2. **It is a framework, SDK, library, tool, reference, or standard**
   that helps people *build* on Cardano. On-chain languages,
   off-chain SDKs, indexers, devnets, CIPs, design-pattern catalogues,
   security references — yes. Dashboards, products, protocols — no.
3. **It is a public GitHub repository** with documentation in a
   machine-readable format (markdown, MDX, reStructuredText, OpenAPI
   YAML, or Aiken source with doc comments).
4. **It does not conflict with the exclusions above** — no tokens, no
   dApps, no DEXes, no wallets-as-product, no financial advice, no
   project endorsements.

If a source clearly meets these criteria, open a PR. If there is any
doubt, open an issue first and describe the project — we would rather
talk it through than nack a PR you worked on.

---

## Neutrality

This project does not favour one Cardano vendor, SDK, or language
over another. The test of that claim is visible in the index itself:

- **Seven smart-contract languages** side by side: Aiken, Plutus,
  OpShin, Plutarch, Plu-ts, Scalus, Pebble.
- **Six off-chain SDKs** side by side: Mesh, Evolution SDK,
  cardano-js-sdk, PyCardano, cardano-client-lib, Cardano Serialization
  Lib.
- **Five chain-data tools** side by side: Ogmios, Kupo, Blockfrost,
  Koios, Cardano GraphQL, plus supporting libraries like Pallas, Oura,
  Dolos.

If an actively-maintained project is missing from a category, that is
a gap to fix, not a policy. Open an issue or a PR.

The built-in MCP prompts (e.g. `build-transaction`, `suggest-tooling`)
accept an SDK or language as a parameter — the user chooses, the
prompt adapts. The server does not push a preferred stack.

---

## Trust and safety

The honest failure mode to worry about: a malicious contributor
submits a PR that adds a repository containing deliberately misleading
or malicious documentation, aimed at tricking AI agents into
generating unsafe code. The mitigations already in place:

- **No live web fetch.** Even if an attacker controls a random
  website, the server will never see it. The only way in is the
  allowlist.
- **Schema-validated PRs.** A broken YAML file is rejected by CI
  before any human reviewer sees it. Attackers cannot smuggle
  misformed entries through.
- **Human review of every allowlist change.** Every new source is
  read by the maintainer against the acceptance criteria.
- **Public audit trail.** The full history of `config/sources.yaml`
  is in git. Every change has an author, a timestamp, and a diff that
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
need to ship a convincing-enough PR past a human reviewer *and* hope
nobody notices the source citation in the eventual answer.

---

## Reporting a problem

- **Found a bug, a broken link, or an out-of-date source?** Open an
  issue: <https://github.com/easy1staking-com/cardano-unified-mcp-server/issues>
- **Want a new source added?** Open an issue or a PR. See
  [CONTRIBUTING.md](./CONTRIBUTING.md).
- **Found something misleading or harmful in an indexed source?**
  Open an issue with the source name and the path of the document.
  The maintainer can remove or narrow the source's glob patterns
  quickly — the next ingest run will reflect the change.

There is no email address, no Discord, no hidden back-channel. GitHub
issues are the one and only intake.

---

## Maintainer

This project is run by [Easy1Staking](https://easy1staking.com), a
Cardano stake pool operator. It is an independent community effort;
it is not affiliated with, endorsed by, or operated on behalf of any
Cardano foundation, IOG, Intersect, or other ecosystem body.

If you want to help, the lowest-friction contribution is adding a
source you use and trust. See [CONTRIBUTING.md](./CONTRIBUTING.md).
