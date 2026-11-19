import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FiremarkApi implements ICredentialType {
	name = 'firemarkApi';

	displayName = 'Firemark API';

	icon: Icon = { light: 'file:../icons/firemark.svg', dark: 'file:../icons/firemark.dark.svg' };

	documentationUrl =
		'https://github.com/Firemark-ai/n8n-nodes-firemark?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: 'fmk_…',
			description:
				'An API key from the API keys page of your Firemark account menu (app.tryfiremark.com/account/api-keys)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.tryfiremark.com/api/v1',
			url: '/brands',
			method: 'GET',
		},
	};
}
