/**
 * CodeAgent — Agente especializado em programação do Blop.
 */

import { client } from "../../index.js";

export class CodeAgent {
  /**
   * Executa uma tarefa especializada em código.
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
          role: "system",
          content: "Você é um agente especializado em programação e desenvolvimento de software.",
        },
        {
          role: "user",
          content: task.message,
        },
      ],
    });

    return response.choices[0]?.message?.content || "";
  }
}

