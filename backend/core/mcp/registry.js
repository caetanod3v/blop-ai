/**
 * MCPRegistry — Registro central para tools baseadas no Model Context Protocol (MCP).
 */

export class MCPRegistry {
  constructor() {
    this.tools = {};
  }

  /**
   * Registra uma nova tool MCP.
   *
   * @param {string} name - Identificador único da tool.
   * @param {object|Function} tool - A definição/implementação da tool.
   */
  register(name, tool) {
    if (!name || typeof name !== "string") {
      throw new Error("O nome da tool deve ser uma string não vazia.");
    }
    this.tools[name] = tool;
  }

  /**
   * Obtém uma tool pelo nome.
   *
   * @param {string} name - Identificador da tool.
   * @returns {object|Function|undefined} A tool registrada ou undefined.
   */
  get(name) {
    return this.tools[name];
  }

  /**
   * Retorna todas as tools registradas.
   *
   * @returns {object} Objeto mapeando nomes para suas respectivas tools.
   */
  getAll() {
    return { ...this.tools };
  }
}

