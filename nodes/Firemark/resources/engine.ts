import type { INodeProperties } from 'n8n-workflow';
import { brandedOption, brandLocator, groupOption, periodOptions, splitIntoItems } from '../shared';

const show = { resource: ['engine'] };

export const engineDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many engines',
				description:
					"How often each AI engine names the brand in the latest run: answers naming it with the engine's base, the share and its range, by funnel stage, history by run and sentiment",
				routing: {
					request: {
						method: 'GET',
						url: '={{ "/brands/" + encodeURIComponent($parameter.brand) + "/engines" }}',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								enabled: '={{ $parameter.splitIntoItems }}',
								properties: { property: 'engines' },
							},
						],
					},
				},
			},
		],
		default: 'getAll',
	},
	brandLocator(['engine']),
	splitIntoItems('engine', 'engine'),
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show },
		options: [brandedOption, groupOption, ...periodOptions],
	},
];
