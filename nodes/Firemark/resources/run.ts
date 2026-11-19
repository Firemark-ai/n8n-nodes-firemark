import type { INodeProperties } from 'n8n-workflow';
import { brandLocator } from '../shared';

const show = { resource: ['run'] };

export const runDescription: INodeProperties[] = [
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
				action: 'Get many runs',
				description: "The brand's run log, as the Runs screen shows it",
				routing: {
					request: {
						method: 'GET',
						url: '={{ "/brands/" + encodeURIComponent($parameter.brand) + "/runs" }}',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								enabled: '={{ $parameter.splitIntoItems }}',
								properties: { property: 'runs' },
							},
						],
					},
				},
			},
		],
		default: 'getAll',
	},
	brandLocator(['run']),
	{
		displayName: 'Split Into Items',
		name: 'splitIntoItems',
		type: 'boolean',
		default: true,
		description:
			'Whether to output one item per run. Turn off to get the whole run log as one item, with its next run and cadence label.',
		displayOptions: { show },
	},
];
