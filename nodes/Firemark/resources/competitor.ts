import type { INodeProperties } from 'n8n-workflow';
import { brandedOption, brandLocator, groupOption, periodOptions, splitIntoItems } from '../shared';

const show = { resource: ['competitor'] };

export const competitorDescription: INodeProperties[] = [
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
				action: 'Get many competitors',
				description:
					'Each tracked competitor against the brand in the latest run: answers naming it with their base, by engine, head to head, rank and sentiment',
				routing: {
					request: {
						method: 'GET',
						url: '={{ "/brands/" + encodeURIComponent($parameter.brand) + "/competitors" }}',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								enabled: '={{ $parameter.splitIntoItems }}',
								properties: { property: 'competitors' },
							},
						],
					},
				},
			},
		],
		default: 'getAll',
	},
	brandLocator(['competitor']),
	splitIntoItems('competitor', 'competitor'),
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
