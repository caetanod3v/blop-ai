/**
 * Agent — Classe base para agentes especializados do Blop.
 *
 * Utiliza o cliente OpenAI/Groq configurado na aplicação.
 */

import { client } from "../index.js";

export class Agent {
  /**
   * Executa uma tarefa usando o cliente OpenAI/Groq.
   *
   * @param {object} task - A tarefa a ser executada.
   * @param {string} task.message - A mensagem do usuário.
   * @param {string} [task.model] - O modelo selecionado.
   * @returns {Promise<string>} O conteúdo da resposta da IA.
   */
  async run(task) {
    const response = await client.chat.completions.create({
      model: task?.model || "openai/gpt-oss-20b",
      messages: [
        {
          role: "user",
          content: task.message,
        },
      ],
    });

    return response.choices[0]?.message?.content || "";
  }
}
