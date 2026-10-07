/**
 * Orchestrator — Componente central do Blop.
 *
 * Responsável por receber tarefas do usuário, analisar a intenção,
 * rotear para os agentes apropriados e consolidar as respostas.
 *
 * Status: Conectado ao Agent base.
 * Ainda não integrado ao /api/chat.
 */

import { Agent } from "./agent.js";

export class Orchestrator {
  constructor() {
    this.agent = new Agent();
  }

  /**
   * Executa uma tarefa delegando ao Agent.
   *
   * @param {object} task - A tarefa a ser executada.
   * @param {string} task.message - A mensagem do usuário.
   * @param {string} [task.model] - O modelo selecionado.
   * @returns {object} O resultado da execução.
   */
  async run(task) {
    const result = await this.agent.run(task);
    return result;
  }
}
