/**
 * Agent — Classe base para agentes especializados do Blop.
 *
 * Utiliza o cliente OpenAI/Groq configurado na aplicação,
 * com suporte a registro de tools e loop de tool calling.
 */

import { client } from "../index.js";
import { tools, toolDefinitions } from "./tools/index.js";

export class Agent {
  constructor() {
    this.tools = tools;
    this.toolDefinitions = toolDefinitions;
  }

  /**
   * Executa uma tarefa usando o cliente OpenAI/Groq ou uma tool registrada.
   *
   * @param {object} task - A tarefa a ser executada.
   * @param {string} [task.message] - A mensagem do usuário (quando não usa tool).
   * @param {string} [task.model] - O modelo selecionado.
   * @param {string} [task.tool] - Nome da tool a ser executada diretamente.
   * @param {any} [task.input] - Parâmetro de entrada para execução direta da tool.
   * @returns {Promise<any>} O conteúdo da resposta final da IA ou retorno da tool.
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

    const model = task?.model || "openai/gpt-oss-20b";
    const messages = [
      {
        role: "user",
        content: task.message,
      },
    ];

    const response = await client.chat.completions.create({
      model,
      messages,
      tools: this.toolDefinitions,
    });

    const assistantMessage = response.choices[0]?.message;

    if (!assistantMessage?.tool_calls || assistantMessage.tool_calls.length === 0) {
      return assistantMessage?.content || "";
    }

    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function?.name;
      const toolFn = this.tools[toolName];

      if (!toolFn) {
        throw new Error(
          `Tool desconhecida chamada pelo modelo: "${toolName}". Tools disponíveis: ${Object.keys(this.tools).join(", ")}`
        );
      }

      const args = toolCall.function?.arguments
        ? JSON.parse(toolCall.function.arguments)
        : {};

      let toolResult;
      const paramKeys = Object.keys(args);
      if (paramKeys.length === 1 && typeof toolFn === "function" && toolFn.length === 1) {
        toolResult = await toolFn(args[paramKeys[0]]);
      } else {
        toolResult = await toolFn(args);
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    const followUpResponse = await client.chat.completions.create({
      model,
      messages,
    });

    return followUpResponse.choices[0]?.message?.content || "";
  }
}
