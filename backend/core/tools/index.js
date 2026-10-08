/**
 * Centralizador de ferramentas (Tools) do Blop.
 *
 * Exporta as implementações das funções e suas definições OpenAI-compatible.
 */

import { calculator } from "./calculator.js";
import { getCurrentDate } from "./date.js";
import { readFile } from "./read-file.js";

export const tools = {
  calculator,
  getCurrentDate,
  readFile,
};

export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Calcula expressões matemáticas.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "A expressão matemática a ser calculada.",
          },
        },
        required: ["expression"],
      },
    },
  },
    {
    type: "function",
    function: {
      name: "getCurrentDate",
      description: "Retorna a data atual no formato YYYY-MM-DD.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "readFile",
      description: "Lê o conteúdo de um arquivo dentro do workspace do Blop.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Caminho relativo do arquivo dentro do workspace.",
          },
        },
        required: ["path"],
      },
    },
  },
];



