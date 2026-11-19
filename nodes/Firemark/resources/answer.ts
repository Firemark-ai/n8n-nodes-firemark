import type { INodeProperties } from 'n8n-workflow';
import { brandLocator, periodOptions, runOption } from '../shared';

const show = { resource: ['answer'] };

export const answerDescription: INodeProperties[] = [
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
				action: 'Get many answers',
				description:
					"One prompt's stored answers from every engine, with each answer's verdict, for the latest published run or another",
				routing: {
					request: {
						method: 'GET',
						url: '={{ "/brands/" + encodeURIComponent($parameter.brand) + "/prompts/" + encodeURIComponent($parameter.prompt) + "/answers" }}',
					},
				},
			},
		],
		default: 'getAll',
	},
	brandLocator(['answer']),
	{
		displayName: 'Prompt ID',
		name: 'prompt',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. P001',
		description: "The prompt's ID in the prompts document",
		displayOptions: { show },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show },
		options: [runOption, ...periodOptions],
	},
];
