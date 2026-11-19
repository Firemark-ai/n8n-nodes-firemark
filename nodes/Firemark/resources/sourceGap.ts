import type { INodeProperties } from 'n8n-workflow';
import {
	brandedOption,
	brandLocator,
	competitorOption,
	cursorOption,
	engineOption,
	groupOption,
	limitOption,
	periodOptions,
	runOption,
	runsOption,
	splitIntoItems,
	stageOption,
} from '../shared';

const show = { resource: ['sourceGap'] };

export const sourceGapDescription: INodeProperties[] = [
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
				action: 'Get many source gaps',
				description:
					'The sites AI answers cite when a competitor is named and the brand is not, most gap answers first, each with its pages and line',
				routing: {
					request: {
						method: 'GET',
						url: '={{ "/brands/" + encodeURIComponent($parameter.brand) + "/source-gaps" }}',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								enabled: '={{ $parameter.splitIntoItems }}',
								properties: { property: 'sites' },
							},
						],
					},
				},
			},
		],
		default: 'getAll',
	},
	brandLocator(['sourceGap']),
	splitIntoItems('sourceGap', 'site'),
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show },
		options: [
			brandedOption,
			competitorOption,
			cursorOption,
			engineOption,
			stageOption,
			groupOption,
			limitOption(100),
			runOption,
			runsOption,
			...periodOptions,
		],
	},
];
