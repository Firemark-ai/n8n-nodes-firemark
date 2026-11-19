import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['brand'] };

export const brandDescription: INodeProperties[] = [
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
				action: 'Get many brands',
				description: "List the workspace's brands, with their prompt groups and latest publication",
				routing: {
					request: { method: 'GET', url: '/brands' },
					output: {
						postReceive: [{ type: 'rootProperty', properties: { property: 'brands' } }],
					},
				},
			},
		],
		default: 'getAll',
	},
];
