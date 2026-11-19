import type { INodeProperties } from 'n8n-workflow';
import { brandedOption, brandLocator, groupOption, periodOptions, runOption } from '../shared';

const show = { resource: ['digitalPr'] };

export const digitalPrDescription: INodeProperties[] = [
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
				action: 'Get digital PR',
				description:
					"The brand's Digital PR placements and how often the answers cite them: the statement, claims, totals, engines, every placement and the run-by-run series",
				routing: {
					request: {
						method: 'GET',
						url: '={{ "/brands/" + encodeURIComponent($parameter.brand) + "/digital-pr" }}',
					},
				},
			},
		],
		default: 'get',
	},
	brandLocator(['digitalPr']),
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show },
		options: [brandedOption, groupOption, runOption, ...periodOptions],
	},
];
