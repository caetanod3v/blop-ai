/**
 * Agent — Classe base para agentes especializados do Blop.
 *
 * Cada agente possui um domínio específico e acesso a tools relevantes.
 * Agentes especializados devem estender esta classe e sobrescrever run().
 *
 * Status: Estrutura inicial (scaffold).
 * Ainda não integrado ao Orchestrator.
 */

export class Agent {
  /**
   * Executa uma tarefa.
   *
   * @param {object} task - A tarefa a ser executada.
   * @param {string} task.message - A mensagem do usuário.
   * @param {string} [task.model] - O modelo selecionado.
   * @returns {object} O resultado da execução.
   */
  async run(task) {
    return task;
  }
}

