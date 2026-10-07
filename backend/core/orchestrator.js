/**
 * Orchestrator — Componente central do Blop.
 *
 * Responsável por receber tarefas do usuário, analisar a intenção,
 * rotear para os agentes apropriados e consolidar as respostas.
 *
 * Status: Conectado ao Agent base e CodeAgent.
 * Ainda não integrado ao /api/chat.
 */

import { Agent } from "./agent.js";
import { CodeAgent } from "./agents/code-agent.js";

export class Orchestrator {
  constructor() {
    this.agents = {
      default: new Agent(),
      code: new CodeAgent(),
    };
  }

  /**
   * Executa uma tarefa delegando ao Agent apropriado.
   *
   * @param {object} task - A tarefa a ser executada.
   * @param {string} task.message - A mensagem do usuário.
   * @param {string} [task.model] - O modelo selecionado.
   * @param {string} [task.agent="default"] - Identificador do agente.
   * @returns {Promise<any>} O resultado da execução.
   */
  async run(task) {
    const agentName = task?.agent || "default";
    const selectedAgent = this.agents[agentName];

    if (!selectedAgent) {
      throw new Error(`Agente desconhecido: "${agentName}". Agentes disponíveis: ${Object.keys(this.agents).join(", ")}`);
    }

    const result = await selectedAgent.run(task);
    return result;
  }
}
