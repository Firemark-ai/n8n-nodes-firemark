import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IPollFunctions,
} from 'n8n-workflow';
import { BASE_URL } from './shared';

/** A run in `GET /brands/{brand}/runs`, the fields this package reads. */
export interface FiremarkRun extends IDataObject {
	run_id: string;
	date: string;
	index: number | null;
	status: 'published' | 'running' | 'failed';
	is_latest: boolean;
}

type Caller = IExecuteSingleFunctions | ILoadOptionsFunctions | IPollFunctions;

/** The brand's published runs, newest first. */
export async function publishedRuns(context: Caller, brandId: string): Promise<FiremarkRun[]> {
	const body = (await context.helpers.httpRequestWithAuthentication.call(context, 'firemarkApi', {
		method: 'GET',
		url: `${BASE_URL}/brands/${encodeURIComponent(brandId)}/runs`,
		json: true,
	})) as IDataObject;
	const runs = ((body.runs as FiremarkRun[] | undefined) ?? []).filter(
		(r) => r.status === 'published',
	);
	return runs.sort(
		(a, b) =>
			Number(b.is_latest) - Number(a.is_latest) ||
			b.date.localeCompare(a.date) ||
			(b.index ?? 0) - (a.index ?? 0),
	);
}

/**
 * Change → Get: sends `since` as the run picked, or by default the published run before the latest. With one
 * published run there is none before it, and the API answers for the brand's first run.
 */
export async function sinceQuery(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const brandId = this.getNodeParameter('brand', '', { extractValue: true }) as string;
	let since = this.getNodeParameter('since', '', { extractValue: true }) as string;
	if (!since) since = (await publishedRuns(this, brandId))[1]?.run_id ?? '';
	if (since) requestOptions.qs = { ...(requestOptions.qs ?? {}), since };
	return requestOptions;
}
