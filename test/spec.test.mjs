// Checks every operation's request (method, path, query parameters and their
// values) against the Firemark OpenAPI spec. Run after `npm run build`.
// test/openapi.json is a copy of docs/openapi.json from the Firemark app; set
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
	assert.ok(spec.components.schemas.BrandsResponse.properties.brands);
	assert.ok(spec.components.schemas.RunsResponse.properties.runs);
});
