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

			const runQuery = async ({ query }) => {
				try {
					const result = await env.RestMenuDB.prepare(query).all();
					console.log('result de la query: ', result);
					return JSON.stringify(result);
				} catch (err) {
					console.log('error en la query: ', err);
					return `Error ejecutando query: ${err.message}`;
				}
			};

			const response = await runWithTools(env.AI, '@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
				messages: [
					{
						role: 'system',
						content:
							'Eres Jarvis. Eres amable, respondes en español y de forma corta y concisa. Tienes acceso a herramientas como una que te permite hacer consultas a una db predefinida.',
					},
					...messages,
				],
				tools: [
					{
						name: 'runQuery',
						description: 'Ejecuta una consulta SQL en la base de datos D1, la query la ingresa el agente de ia.',
						parameters: {
							type: 'object',
							properties: {
								query: {
									type: 'string',
									description: 'La consulta SQL a ejecutar (ej: SELECT * FROM users LIMIT 5)',
								},
							},
							required: ['query'],
						},
						function: runQuery,
					},
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
