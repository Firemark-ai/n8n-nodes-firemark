import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { getGroups, searchBrands } from './methods';
import { BASE_URL } from './shared';
import { answerDescription } from './resources/answer';
import { brandDescription } from './resources/brand';
import { digitalPrDescription } from './resources/digitalPr';
import { promptDescription } from './resources/prompt';
import { resultDescription } from './resources/result';
import { runDescription } from './resources/run';

export class Firemark implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Firemark',
		name: 'firemark',
		icon: { light: 'file:../../icons/firemark.svg', dark: 'file:../../icons/firemark.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Read AI visibility results from Firemark',
		defaults: {
			name: 'Firemark',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'firemarkApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: BASE_URL,
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Answer', value: 'answer' },
					{ name: 'Brand', value: 'brand' },
					{ name: 'Digital PR', value: 'digitalPr' },
					{ name: 'Prompt', value: 'prompt' },
					{ name: 'Result', value: 'result' },
					{ name: 'Run', value: 'run' },
				],
				default: 'brand',
			},
			...answerDescription,
			...brandDescription,
			...digitalPrDescription,
			...promptDescription,
			...resultDescription,
			...runDescription,
		],
	};

	methods = {
		listSearch: { searchBrands },
		loadOptions: { getGroups },
	};
}
