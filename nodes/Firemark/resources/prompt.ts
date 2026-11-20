import type { INodeProperties } from 'n8n-workflow';
import { brandLocator, compareOption, groupOption, periodOptions } from '../shared';

const show = { resource: ['prompt'] };

export const promptDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get the prompts document',
				description:
					"The brand's prompts document as published: the latest, a prompt group's, a period's, or one publication version's",
				routing: {
					request: {
						method: 'GET',
						url: '={{ "/brands/" + encodeURIComponent($parameter.brand) + ($parameter.source === "version" ? "/publications/" + encodeURIComponent(String($parameter.version)) : "") + "/prompts" }}',
					},
				},
			},
		],
		default: 'get',
	},
	brandLocator(['prompt']),
	{
		displayName: 'Source',
		name: 'source',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Latest',
				value: 'latest',
				description: "The latest published document, or a prompt group's or a period's",
			},
			{
				name: 'Publication Version',
				value: 'version',
				description: "One publication version's document. It never changes.",
			},
		],
		default: 'latest',
	},
	{
		displayName: 'Version',
		name: 'version',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 1,
		required: true,
		description: 'A publication version of the brand, from its run log or latest publication',
		displayOptions: { show: { ...show, source: ['version'] } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...show, source: ['latest'] } },
		options: [compareOption, groupOption, ...periodOptions],
	},
];
