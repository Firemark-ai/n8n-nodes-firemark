import type { INodeProperties } from 'n8n-workflow';
import { sinceQuery } from '../runLog';
import { brandedOption, brandLocator, engineOption, groupOption } from '../shared';

const show = { resource: ['change'] };

export const changeDescription: INodeProperties[] = [
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
				action: 'Get changes since a run',
				description:
					"What changed that passed Firemark's rules since a run: the claims the change email sends, gap changes, own-page labels and sentiment, each with its sentence",
				routing: {
					send: { preSend: [sinceQuery] },
					request: {
						method: 'GET',
						url: '={{ "/brands/" + encodeURIComponent($parameter.brand) + "/changes" }}',
					},
				},
			},
		],
		default: 'get',
	},
	brandLocator(['change']),
	{
		displayName: 'Since Run',
		name: 'since',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		description:
			'The run to compare the latest with, usually the last run you saw. Leave empty for the published run before the latest.',
		displayOptions: { show },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Previous run (default)',
				typeOptions: {
					searchListMethod: 'searchRuns',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. run ID from Run → Get Many',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show },
		options: [brandedOption, engineOption, groupOption],
	},
];
