import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	INodePropertyOptions,
} from 'n8n-workflow';
import { publishedRuns } from '../runLog';
import { BASE_URL } from '../shared';

interface FiremarkGroup {
	id: string;
	name: string;
	prompts: number;
}

interface FiremarkBrand {
	id: string;
	name: string;
	website: string;
	groups: FiremarkGroup[];
}

async function getBrands(context: ILoadOptionsFunctions): Promise<FiremarkBrand[]> {
	const body = (await context.helpers.httpRequestWithAuthentication.call(context, 'firemarkApi', {
		method: 'GET',
		url: `${BASE_URL}/brands`,
		json: true,
	})) as IDataObject;
	return (body.brands as FiremarkBrand[] | undefined) ?? [];
}

export async function searchBrands(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const needle = (filter ?? '').toLowerCase();
	const brands = await getBrands(this);
	return {
		results: brands
			.filter(
				(b) =>
					!needle ||
					b.name.toLowerCase().includes(needle) ||
					b.website.toLowerCase().includes(needle),
			)
			.map((b) => ({ name: b.name, value: b.id, url: b.website })),
	};
}

export async function getGroups(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const brandId = this.getCurrentNodeParameter('brand', { extractValue: true }) as string;
	if (!brandId) return [];
	const brand = (await getBrands(this)).find((b) => b.id === brandId);
	return (brand?.groups ?? []).map((g) => ({
		name: g.name,
		value: g.id,
		description: `${g.prompts} prompts`,
	}));
}

export async function searchRuns(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const brandId = this.getCurrentNodeParameter('brand', { extractValue: true }) as string;
	if (!brandId) return { results: [] };
	const needle = (filter ?? '').toLowerCase();
	const runs = await publishedRuns(this, brandId);
	return {
		results: runs
			.map((r) => ({
				name: `Run ${r.index ?? '?'} · ${r.date}${r.is_latest ? ' (latest)' : ''}`,
				value: r.run_id,
			}))
			.filter((r) => !needle || r.name.toLowerCase().includes(needle) || r.value.includes(needle)),
	};
}
