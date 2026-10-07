/**
 * Agent — Classe base para agentes especializados do Blop.
 *
 * Utiliza o cliente OpenAI/Groq configurado na aplicação
 * e possui suporte a registro e execução de tools.
 */

import { client } from "../index.js";
import { calculator } from "./tools/calculator.js";

export class Agent {
  constructor() {
    this.tools = {
      calculator,
    };
  }

  /**
   * Executa uma tarefa usando o cliente OpenAI/Groq ou uma tool registrada.
   *
   * @param {object} task - A tarefa a ser executada.
   * @param {string} [task.message] - A mensagem do usuário (quando não usa tool).
   * @param {string} [task.model] - O modelo selecionado.
   * @param {string} [task.tool] - Nome da tool a ser executada.
   * @param {any} [task.input] - Parâmetro de entrada para a tool.
   * @returns {Promise<any>} O conteúdo da resposta da IA ou retorno da tool.
   */
  async run(task) {
    if (task?.tool) {
      const selectedTool = this.tools[task.tool];

      if (!selectedTool) {
        throw new Error(
          `Tool desconhecida: "${task.tool}". Tools disponíveis: ${Object.keys(this.tools).join(", ")}`
        );
      }

      return selectedTool(task.input);
    }

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
