/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { runWithTools } from '@cloudflare/ai-utils';

export default {
	async fetch(request, env) {
		if (request.method !== 'POST') {
			return new Response('Solo métodos POST permitidos', { status: 405 });
		}

		const { messages } = await request.json();

		const sum = async ({ a, b }) => (a + b).toString();

		const response = await runWithTools(env.AI, '@hf/nousresearch/hermes-2-pro-mistral-7b', {
			messages,
			tools: [
				{
					name: 'sum',
					description: 'Suma dos números',
					parameters: {
						type: 'object',
						properties: {
							a: { type: 'number' },
							b: { type: 'number' },
						},
						required: ['a', 'b'],
					},
					function: sum,
				},
			],
		});

		return new Response(JSON.stringify(response), {
			headers: { 'Content-Type': 'application/json' },
		});
	},
};
