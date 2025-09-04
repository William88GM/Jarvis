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

const ALLOWED_ORIGIN = 'https://jarvis-front.guillermogabrielmartinezbarros.workers.dev';

export default {
	async fetch(request, env) {
		// 👉 Manejo de preflight (CORS OPTIONS)
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
					'Access-Control-Max-Age': '86400', // cache preflight por 1 día
				},
			});
		}

		// 👉 Solo aceptamos POST para chat
		if (request.method !== 'POST') {
			return new Response('Solo métodos POST permitidos', {
				status: 405,
				headers: {
					'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
				},
			});
		}

		try {
			const { messages } = await request.json();

			// Ejemplo de tool: suma
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
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
				},
			});
		} catch (err) {
			return new Response(JSON.stringify({ error: err.message }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
				},
			});
		}
	},
};
