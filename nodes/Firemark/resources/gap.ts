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

const show = { resource: ['gap'] };

export const gapDescription: INodeProperties[] = [
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
				action: 'Get many gaps',
				description:
					'Where the brand loses, ordered for action: prompts where a competitor is named and the brand is not, counted in engines and runs, each with its line',
				routing: {
					request: {
						method: 'GET',
						url: '={{ "/brands/" + encodeURIComponent($parameter.brand) + "/gaps" }}',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								enabled: '={{ $parameter.splitIntoItems && $parameter.kind !== "changes" }}',
								properties: { property: 'prompts' },
							},
							{
								type: 'rootProperty',
								enabled: '={{ $parameter.splitIntoItems && $parameter.kind === "changes" }}',
								properties: { property: 'changes' },
							},
						],
					},
				},
			},
		],
		default: 'getAll',
	},
	brandLocator(['gap']),
	{
		displayName: 'Kind',
		name: 'kind',
		type: 'options',
		default: 'missing',
		displayOptions: { show },
		options: [
			{
				name: 'Changes',
				value: 'changes',
				description: 'Gaps that opened or closed over the latest three runs',
			},
			{
				name: 'Engine Split',
				value: 'engine_split',
				description: 'Some engines name the brand, others do not',
			},
			{
				name: 'Missing',
				value: 'missing',
				description: 'A competitor is named and the brand is not',
			},
			{
				name: 'Unlinked',
				value: 'unlinked',
				description: 'The brand is named without a link where a named competitor is linked',
			},
		],
		routing: { send: { type: 'query', property: 'kind' } },
	},
	splitIntoItems('gap', 'gap prompt (or, for Changes, per change)'),
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
			limitOption(50),
			runOption,
			runsOption,
			...periodOptions,
		],
	},
];
