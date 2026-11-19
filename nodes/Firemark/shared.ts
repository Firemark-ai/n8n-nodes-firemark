import type { INodeProperties } from 'n8n-workflow';

export const BASE_URL = 'https://app.tryfiremark.com/api/v1';

/** The brand picker; shown for `resource` only when one is given (the trigger has no resources). */
export function brandLocator(resource?: string[]): INodeProperties {
	return {
		displayName: 'Brand',
		name: 'brand',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The brand to read',
		...(resource ? { displayOptions: { show: { resource } } } : {}),
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a brand…',
				typeOptions: {
					searchListMethod: 'searchBrands',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 3f1c2a…',
			},
		],
	};
}

export const groupOption: INodeProperties = {
	displayName: 'Prompt Group Name or ID',
	name: 'group',
	type: 'options',
	default: '',
	description:
		'Read one prompt group\'s figures, built on read. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	typeOptions: {
		loadOptionsMethod: 'getGroups',
		loadOptionsDependsOn: ['brand.value'],
	},
	routing: { send: { type: 'query', property: 'group' } },
};

export const runOption: INodeProperties = {
	displayName: 'Run ID',
	name: 'run',
	type: 'string',
	default: '',
	description: "A published run's ID, from the run log. Not together with a period.",
	routing: { send: { type: 'query', property: 'run' } },
};

export const brandedOption: INodeProperties = {
	displayName: 'Unbranded Answers Only',
	name: 'branded',
	type: 'boolean',
	default: false,
	description: 'Whether to leave out the prompts that name the brand',
	routing: {
		send: { type: 'query', property: 'branded', value: '={{ $value ? "off" : "on" }}' },
	},
};

export const periodOptions: INodeProperties[] = [
	{
		displayName: 'Period',
		name: 'range',
		type: 'options',
		default: 'latest',
		description: 'A preset period. Wins over From and To.',
		options: [
			{ name: 'Last 12 Months', value: '12m' },
			{ name: 'Last 12 Runs', value: '12r' },
			{ name: 'Last 30 Days', value: '30d' },
			{ name: 'Last 4 Runs', value: '4r' },
			{ name: 'Last 90 Days', value: '90d' },
			{ name: 'Latest Run', value: 'latest' },
			{ name: 'This Quarter', value: 'qtd' },
		],
		routing: { send: { type: 'query', property: 'range' } },
	},
	{
		displayName: 'From',
		name: 'from',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'First day of a period, included',
		routing: { send: { type: 'query', property: 'from' } },
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'Last day of a period, included',
		routing: { send: { type: 'query', property: 'to' } },
	},
];

export const compareOption: INodeProperties = {
	displayName: 'Compare With Previous Period',
	name: 'compare',
	type: 'boolean',
	default: true,
	description: 'Whether to include the comparison with the previous period',
	routing: {
		send: { type: 'query', property: 'compare', value: '={{ $value ? "previous" : "none" }}' },
	},
};

export const engineOption: INodeProperties = {
	displayName: 'Engine',
	name: 'engine',
	type: 'options',
	default: 'chatgpt',
	description: "One engine's answers. Leave the option out for every engine of the run.",
	options: [
		{ name: 'AI Mode', value: 'ai_mode' },
		{ name: 'AI Overviews', value: 'ai_overviews' },
		{ name: 'ChatGPT', value: 'chatgpt' },
		{ name: 'Claude', value: 'claude' },
		{ name: 'Gemini', value: 'gemini' },
		{ name: 'Perplexity', value: 'perplexity' },
	],
	routing: { send: { type: 'query', property: 'engine' } },
};

export const stageOption: INodeProperties = {
	displayName: 'Funnel Stages',
	name: 'stage',
	type: 'multiOptions',
	default: [],
	description: 'Only these funnel stages. Leave the option out for every stage.',
	options: [
		{ name: 'Top of Funnel', value: 'tofu' },
		{ name: 'Middle of Funnel', value: 'mofu' },
		{ name: 'Bottom of Funnel', value: 'bofu' },
	],
	routing: { send: { type: 'query', property: 'stage', value: '={{ $value.join(",") }}' } },
};

export const competitorOption: INodeProperties = {
	displayName: 'Competitor',
	name: 'competitor',
	type: 'string',
	default: '',
	placeholder: 'e.g. Rivalco',
	description: "One tracked competitor's name, ignoring case",
	routing: { send: { type: 'query', property: 'competitor' } },
};

export const runsOption: INodeProperties = {
	displayName: 'Runs Looked Back Over',
	name: 'runs',
	type: 'number',
	typeOptions: { minValue: 1, maxValue: 12 },
	default: 3,
	description:
		'How many runs persistence covers, the selected one included. Default 3 (with a period, its runs, at most 12).',
	routing: { send: { type: 'query', property: 'runs' } },
};

export function limitOption(max: number): INodeProperties {
	return {
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: max },
		default: 50,
		description: 'Max number of results to return',
		routing: { send: { type: 'query', property: 'limit' } },
	};
}

export const cursorOption: INodeProperties = {
	displayName: 'Cursor',
	name: 'cursor',
	type: 'string',
	default: '',
	description: "The previous page's next_cursor, for the next page",
	routing: { send: { type: 'query', property: 'cursor' } },
};

/** "Split Into Items" for a list operation: one item per row of `property`, or the whole document as one item. */
export function splitIntoItems(resource: string, what: string): INodeProperties {
	return {
		displayName: 'Split Into Items',
		name: 'splitIntoItems',
		type: 'boolean',
		default: true,
		description: `Whether to output one item per ${what}. Turn off to get the whole document as one item, with its statement and context.`,
		displayOptions: { show: { resource: [resource] } },
	};
}
