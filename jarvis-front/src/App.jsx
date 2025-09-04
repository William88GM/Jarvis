import { useState } from "react";

function App() {
	const [messages, setMessages] = useState([{ role: "system", content: "Eres un asistente amable y conciso." }]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSend() {
		if (!input.trim()) return;

		// Agregamos mensaje del usuario al historial
		const newMessages = [...messages, { role: "user", content: input }];
		setMessages(newMessages);
		setInput("");
		setLoading(true);

		try {
			const res = await fetch("https://jarvis.guillermogabrielmartinezbarros.workers.dev", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: newMessages }),
			});

			const data = await res.json();

			// El Worker devuelve algo como { response: "...", tool_calls: [...] }
			const reply = data.response ?? data?.choices?.[0]?.message?.content ?? "(sin respuesta del modelo)";

			// Guardamos la respuesta del asistente
			setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
		} catch (err) {
			console.error(err);
			setMessages((prev) => [...prev, { role: "assistant", content: "Error al obtener respuesta" }]);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex flex-col items-center p-6 w-[100dvw] text-center">
			<h1 className="text-2xl font-bold mb-4">Chat con Cloudflare AI</h1>

			{/* Chat */}
			<div className="w-full max-w-xl flex-1 overflow-y-auto shadow rounded p-4 mb-4">
				{messages
					.filter((m) => m.role !== "system")
					.map((msg, i) => (
						<div key={i} className={`mb-2 p-2 rounded ${msg.role === "user" ? "bg-blue-100 text-right" : "bg-gray-200 text-left"}`}>
							<strong>{msg.role === "user" ? "Tú" : "Asistente"}:</strong> {msg.content}
						</div>
					))}
				{loading && <div className="italic text-gray-500">Escribiendo...</div>}
			</div>

			{/* Input */}
			<div className="w-full max-w-xl flex">
				<input
					type="text"
					className="flex-1 border rounded-l px-3 py-2"
					placeholder="Escribe tu mensaje..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleSend()}
				/>
				<button onClick={handleSend} disabled={loading} className="bg-blue-600 text-white px-4 rounded-r">
					Enviar
				</button>
			</div>
		</div>
	);
}

export default App;
