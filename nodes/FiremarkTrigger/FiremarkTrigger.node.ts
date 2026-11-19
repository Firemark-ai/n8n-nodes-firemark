import {
	NodeConnectionTypes,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IPollFunctions,
} from 'n8n-workflow';
import { searchBrands } from '../Firemark/methods';
import { publishedRuns, type FiremarkRun } from '../Firemark/runLog';
import { BASE_URL, brandLocator } from '../Firemark/shared';

interface PollState {
	/** The newest published run seen for the brand. */
	lastRunId?: string;
	brandId?: string;
}

export class FiremarkTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Firemark Trigger',
		name: 'firemarkTrigger',
		icon: { light: 'file:../../icons/firemark.svg', dark: 'file:../../icons/firemark.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: 'On new run published',
		description: 'Starts the workflow when Firemark publishes a new run for a brand',
		defaults: {
			name: 'Firemark Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'firemarkApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'On New Run Published',
						value: 'newRun',
						description: 'One item per run published since the last check',
					},
				],
				default: 'newRun',
			},
			brandLocator(),
			{
				displayName: 'Include Changes',
				name: 'includeChanges',
				type: 'boolean',
				default: false,
				description:
					"Whether to add each new run's changes since the run before it (Change → Get), with Firemark's sentences, under `changes`",
			},
		],
	};

	methods = {
		listSearch: { searchBrands },
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const brandId = this.getNodeParameter('brand', '', { extractValue: true }) as string;
		const includeChanges = this.getNodeParameter('includeChanges', false) as boolean;
		const state = this.getWorkflowStaticData('node') as PollState;
		const runs = await publishedRuns(this, brandId);
		const latest = runs[0];
		const manual = this.getMode() === 'manual';

		let fresh: FiremarkRun[];
		if (manual) {
			// A test run shows the latest published run, and remembers nothing.
			fresh = latest ? [latest] : [];
		} else if (!state.lastRunId || state.brandId !== brandId) {
			// First activation (or a new brand): remember the latest, emit nothing.
			state.lastRunId = latest?.run_id;
			state.brandId = brandId;
			return null;
		} else {
			const seen = runs.findIndex((r) => r.run_id === state.lastRunId);
			// Runs newer than the last one seen, oldest first; the latest only when the one seen is no longer listed.
			fresh = (seen === -1 ? runs.slice(0, 1) : runs.slice(0, seen)).reverse();
			if (latest) state.lastRunId = latest.run_id;
		}
		if (!fresh.length) return null;

		const items: INodeExecutionData[] = [];
		for (const run of fresh) {
			const json: IDataObject = { brand_id: brandId, ...run };
			if (includeChanges) {
				const before = runs[runs.findIndex((r) => r.run_id === run.run_id) + 1];
				json.changes = (await this.helpers.httpRequestWithAuthentication.call(this, 'firemarkApi', {
					method: 'GET',
					url: `${BASE_URL}/brands/${encodeURIComponent(brandId)}/changes`,
					qs: before ? { since: before.run_id } : {},
					json: true,
				})) as IDataObject;
			}
			items.push({ json });
		}
		return [items];
	}
}
