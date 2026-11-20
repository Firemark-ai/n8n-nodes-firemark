// Checks every operation's request (method, path, query parameters and their
// values) against the Firemark OpenAPI spec. Run after `npm run build`.
// test/openapi.json is a copy of the published spec at
// https://app.tryfiremark.com/api/v1/openapi.json; set
// FIREMARK_OPENAPI to another path to check against a newer one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const spec = JSON.parse(
	readFileSync(process.env.FIREMARK_OPENAPI ?? `${root}test/openapi.json`, 'utf8'),
);
const { Firemark } = require(`${root}dist/nodes/Firemark/Firemark.node.js`);
const { FiremarkApi } = require(`${root}dist/credentials/FiremarkApi.credentials.js`);
const { FiremarkTrigger } = require(`${root}dist/nodes/FiremarkTrigger/FiremarkTrigger.node.js`);

const node = new Firemark().description;
const props = node.properties;

// Sample values, chosen so they can be mapped back to the spec's path templates.
const SAMPLE = { brand: 'BRAND-ID', prompt: 'P001', version: 7 };
const TEMPLATE = { 'BRAND-ID': '{brand}', P001: '{prompt}', 7: '{version}' };

function evalExpr(expr, parameter) {
	if (typeof expr !== 'string' || !expr.startsWith('=')) return expr;
	const body = expr.slice(1).trim();
	const m = body.match(/^\{\{([\s\S]*)\}\}$/);
	if (!m) return body;
	return new Function('$parameter', '$value', 'encodeURIComponent', `return (${m[1]});`)(
		parameter,
		parameter.$value,
		encodeURIComponent,
	);
}

function toTemplate(url) {
	return url
		.split('/')
		.map((seg) => TEMPLATE[decodeURIComponent(seg)] ?? seg)
		.join('/');
}

function shownFor(prop, resource, operation, source) {
	const show = prop.displayOptions?.show;
	if (!show) return true;
	if (show.resource && !show.resource.includes(resource)) return false;
	if (show.operation && !show.operation.includes(operation)) return false;
	if (show.source && !show.source.includes(source)) return false;
	return true;
}

// Every query parameter a resource's fields can send, with the values it can take.
function queryParams(resource, operation, source) {
	const out = [];
	const visit = (p) => {
		const send = p.routing?.send;
		if (send?.type === 'query') {
			let values;
			if (p.type === 'options' && !p.typeOptions?.loadOptionsMethod)
				values = p.options.map((o) => o.value);
			else if (p.type === 'boolean')
				values = [true, false].map((v) =>
					send.value === undefined ? v : evalExpr(send.value, { $value: v }),
				);
			out.push({ name: send.property, values, field: p.name });
		}
		(p.type === 'collection' ? p.options : []).forEach(visit);
	};
	props
		.filter((p) => p.name !== 'operation' && shownFor(p, resource, operation, source))
		.forEach(visit);
	return out;
}

const resources = props.find((p) => p.name === 'resource').options.map((o) => o.value);
const cases = [];
for (const resource of resources) {
	const opProp = props.find(
		(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes(resource),
	);
	assert.ok(opProp, `${resource} has operations`);
	const hasSource = props.some(
		(p) => p.name === 'source' && p.displayOptions?.show?.resource?.includes(resource),
	);
	for (const op of opProp.options) {
		for (const source of hasSource ? ['latest', 'version'] : [undefined]) {
			cases.push({ resource, op, source });
		}
	}
}

const covered = [];

for (const { resource, op, source } of cases) {
	test(`${resource}.${op.value}${source ? ` (${source})` : ''} matches the spec`, () => {
		const req = op.routing.request;
		const url = evalExpr(req.url, { ...SAMPLE, source });
		const path = toTemplate(url);
		const method = req.method.toLowerCase();
		const specOp = spec.paths[path]?.[method];
		assert.ok(specOp, `${method.toUpperCase()} ${path} is in the spec`);
		covered.push(specOp.operationId);
		const specParams = new Map(
			specOp.parameters.filter((p) => p.in === 'query').map((p) => [p.name, p]),
		);
		for (const name of [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1])) {
			assert.ok(
				specOp.parameters.some((p) => p.in === 'path' && p.name === name),
				`path parameter ${name}`,
			);
		}
		for (const q of queryParams(resource, op.value, source)) {
			const sp = specParams.get(q.name);
			assert.ok(sp, `query parameter ${q.name} (field ${q.field}) is in the spec for ${path}`);
			if (q.values && sp.schema.enum) {
				for (const v of q.values)
					assert.ok(sp.schema.enum.includes(v), `${q.name}=${v} is one of ${sp.schema.enum}`);
			}
		}
	});
}

test("the brief's operations are all covered", () => {
	for (const id of [
		'listBrands',
		'getResults',
		'getPublicationResults',
		'getPrompts',
		'getPublicationPrompts',
		'listRuns',
		'getPromptAnswers',
		'getDigitalPr',
		'getChanges',
		'listGaps',
		'listSourceGaps',
		'listCompetitors',
		'listEngines',
	]) {
		assert.ok(covered.includes(id), `${id} is reachable from the node`);
	}
});

test('the node has no write operations', () => {
	for (const { op } of cases) assert.equal(op.routing.request.method, 'GET');
});

test('the credential sends a Bearer key and is tested against GET /brands', () => {
	const cred = new FiremarkApi();
	assert.equal(
		cred.authenticate.properties.headers.Authorization,
		'=Bearer {{$credentials.apiKey}}',
	);
	assert.equal(spec.components.securitySchemes.bearerAuth.scheme, 'bearer');
	assert.equal(cred.test.request.method, 'GET');
	assert.equal(cred.test.request.url, '/brands');
	assert.equal(cred.test.request.baseURL, spec.servers[0].url);
	assert.equal(node.requestDefaults.baseURL, spec.servers[0].url);
	assert.ok(spec.paths['/brands'].get);
});

test("item splitting uses the spec's array properties", () => {
	const schemas = spec.components.schemas;
	assert.ok(schemas.BrandsResponse.properties.brands);
	assert.ok(schemas.RunsResponse.properties.runs);
	// Every rootProperty a postReceive splits on is an array in that operation's 200 body.
	for (const { resource, op } of cases) {
		const url = evalExpr(op.routing.request.url, { ...SAMPLE });
		const body = spec.paths[toTemplate(url)].get.responses['200'].content['application/json'].schema;
		const schema = body.$ref ? schemas[body.$ref.split('/').pop()] : body;
		for (const step of op.routing.output?.postReceive ?? []) {
			if (step.type !== 'rootProperty') continue;
			const prop = schema.properties?.[step.properties.property];
			assert.ok(prop, `${resource}.${op.value} splits on ${step.properties.property}`);
			assert.equal(prop.type, 'array', `${step.properties.property} is an array`);
		}
	}
});

test('Change → Get sends since (picked, or the run before the latest) as the spec names it', async () => {
	const change = props.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('change'));
	const op = change.options[0];
	assert.ok(spec.paths['/brands/{brand}/changes'].get.parameters.some((p) => p.in === 'query' && p.name === 'since'));
	const [preSend] = op.routing.send.preSend;
	const runs = [
		{ run_id: 'r1', date: '2026-10-11', index: 1, status: 'published', is_latest: false },
		{ run_id: 'r3', date: '2026-10-25', index: 3, status: 'published', is_latest: true },
		{ run_id: 'r4', date: '2026-11-01', index: null, status: 'failed', is_latest: false },
		{ run_id: 'r2', date: '2026-10-18', index: 2, status: 'published', is_latest: false },
	];
	const ctx = (since) => ({
		getNodeParameter: (name) => (name === 'brand' ? 'BRAND-ID' : since),
		helpers: { httpRequestWithAuthentication: async (_cred, req) => (assert.match(req.url, /\/brands\/BRAND-ID\/runs$/), { runs }) },
	});
	assert.deepEqual((await preSend.call(ctx(''), { qs: {} })).qs, { since: 'r2' });
	assert.deepEqual((await preSend.call(ctx('r1'), { qs: {} })).qs, { since: 'r1' });
});

test('the trigger polls the run log: nothing on first activation, then one item per newly published run, with changes', async () => {
	const trigger = new FiremarkTrigger();
	assert.equal(trigger.description.polling, true);
	assert.deepEqual(trigger.description.inputs, []);
	assert.ok(spec.paths['/brands/{brand}/runs'].get);
	const published = (ids) => ids.map((id, i) => ({ run_id: id, date: `2026-10-${10 + i}`, index: i + 1, status: 'published', is_latest: i === ids.length - 1 }));
	let log = published(['r1', 'r2']);
	const calls = [];
	const staticData = {};
	const ctx = (params, mode = 'trigger') => ({
		getNodeParameter: (name, fallback) => (name in params ? params[name] : fallback),
		getWorkflowStaticData: () => staticData,
		getMode: () => mode,
		helpers: {
			httpRequestWithAuthentication: async (cred, req) => {
				assert.equal(cred, 'firemarkApi');
				calls.push(req);
				if (req.url.endsWith('/runs')) return { runs: [...log].reverse() };
				return { statement: ['changes'], since: req.qs.since ?? null };
			},
		},
	});
	const params = { brand: 'BRAND-ID', includeChanges: true };
	assert.equal(await trigger.poll.call(ctx(params)), null);
	assert.equal(staticData.lastRunId, 'r2');
	assert.equal(await trigger.poll.call(ctx(params)), null);
	log = published(['r1', 'r2', 'r3', 'r4']);
	const [items] = await trigger.poll.call(ctx(params));
	assert.deepEqual(items.map((i) => i.json.run_id), ['r3', 'r4']);
	assert.deepEqual(items.map((i) => i.json.changes.since), ['r2', 'r3']);
	const changeCalls = calls.filter((c) => c.url.endsWith('/changes'));
	assert.ok(changeCalls.every((c) => spec.paths['/brands/{brand}/changes'].get.parameters.some((p) => p.name === Object.keys(c.qs)[0])));
	assert.equal(staticData.lastRunId, 'r4');
	assert.equal(await trigger.poll.call(ctx(params)), null);
	// A manual test shows the latest run and remembers nothing.
	const [manual] = await trigger.poll.call(ctx({ brand: 'BRAND-ID', includeChanges: false }, 'manual'));
	assert.deepEqual(manual.map((i) => i.json.run_id), ['r4']);
	assert.equal(manual[0].json.changes, undefined);
	assert.equal(staticData.lastRunId, 'r4');
});
