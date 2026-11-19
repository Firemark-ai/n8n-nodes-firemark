# n8n-nodes-firemark

This is an n8n community node. It lets you read your [Firemark](https://tryfiremark.com) results in n8n workflows.

Firemark measures how often AI engines' answers name your brand for a fixed basket of buyer prompts, and publishes the results after each run. This node reads those published results through the Firemark REST API. It is read-only: nothing in it starts a run or changes a brand.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. The package name is `n8n-nodes-firemark`.

## Operations

| Resource | Operation | API call |
| --- | --- | --- |
| Brand | Get Many | `GET /brands`: the workspace's brands, one item per brand, with their prompt groups and latest publication |
| Result | Get | `GET /brands/{brand}/results`: the latest `results` document; or a prompt group's, or a period's (preset, or from and to dates). With Source "Publication Version": `GET /brands/{brand}/publications/{version}/results` |
| Prompt | Get | `GET /brands/{brand}/prompts`: the `prompts` document, with the same options as Result; or a publication version's |
| Run | Get Many | `GET /brands/{brand}/runs`: the run log, one item per run (or the whole log as one item) |
| Answer | Get Many | `GET /brands/{brand}/prompts/{prompt}/answers`: one prompt's stored answers from every engine, for the latest published run, another run, or a period |
| Digital PR | Get | `GET /brands/{brand}/digital-pr`: Digital PR placements and how often the answers cite them; by run, prompt group, period, or unbranded answers only |

The brand is picked from a searchable list or entered by ID. Prompt groups are listed for the chosen brand.

The node can also be used as a tool by n8n's AI Agent.

## Credentials

You need a Firemark account on a paid plan. API access is included on every paid plan.

1. In Firemark, open the account menu and choose **API keys** (`https://app.tryfiremark.com/account/api-keys`).
2. Create a key. It starts with `fmk_`. Copy it: it is shown once.
3. In n8n, create a **Firemark API** credential and paste the key into **API Key**.

n8n tests the credential by calling `GET /brands`. The key is sent as `Authorization: Bearer fmk_…`. A key reads one workspace.

## Compatibility

Needs an n8n version with community node support and resource locators (n8n 1.0 or later). Built with `@n8n/node-cli` 0.57 against `n8n-workflow` 2.48 (`n8nNodesApiVersion` 1). Development needs Node.js 22 or later.

## Usage

**Report figures with their base.** Firemark's documents give counts with the number they are out of (for example "155 of 500 answers"). Keep the base when you pass a figure on, and keep a prompt group's figures apart from the whole basket's.

**Pass the product's sentences through unchanged.** Fields named `statement`, `claims` and each `line` hold Firemark's own wording, decided by its reporting rules. Send them on as they are (to Slack, email, a sheet) rather than rewriting them, and don't compute changes or rankings the documents don't state.

**Limits.** Each key may make 60 requests a minute (300 across a workspace's keys). Over the limit the API answers 429 with a `Retry-After` header. For loops over many brands or prompts, turn on **Retry On Fail** in the node's settings, or add a **Wait** node.

**When results change.** Each brand runs on its cadence (daily, weekly or monthly). A Schedule Trigger that checks **Run → Get Many** and compares the latest run with the last one you saw is a cheap way to act only when a new run is published. Publication versions never change, so a version's documents can be cached.

**Errors.** API errors come back with a `code` (for example `unauthorised`, `plan_required`, `no_brand`, `bad_run_id`, `bad_period`, `rate_limited`) and n8n shows the message. A period (`range`, or `from` and `to`) can't be combined with a run ID.

Example workflow: Schedule Trigger → Firemark (Brand → Get Many) → Firemark (Result → Get, brand `{{ $json.id }}`) → Slack, posting `{{ $json.claims }}` as it is.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Firemark](https://tryfiremark.com)
- [Firemark REST API reference](https://app.tryfiremark.com/api/v1/openapi.json) (OpenAPI 3.1)

## Version history

### 0.1.0

First release: Brand, Result, Prompt, Run, Answer and Digital PR, read-only.

## Development

```bash
npm install
npm run lint
npm run build
npm test      # checks every operation's request against test/openapi.json
npm run dev   # starts n8n at localhost:5678 with this node loaded
```

`test/openapi.json` is a copy of the Firemark app's `docs/openapi.json`. Set `FIREMARK_OPENAPI=/path/to/openapi.json` to check against a newer spec.

### Releasing

Releases are published to npm from GitHub Actions with a provenance statement (`.github/workflows/publish.yml`), using npm Trusted Publishing, so no npm token is stored in the repository. Run `npm run release` on `main`: it lints, builds, bumps the version, updates the changelog, tags and pushes, and the tag starts the publish workflow.

## License

[MIT](LICENSE.md)
