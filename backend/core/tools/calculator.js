/**
 * Calculator Tool — Avalia expressões matemáticas simples com segurança.
 *
 * Suporta operações aritméticas básicas (+, -, *, /, %, parênteses e números decimais).
 */

export function calculator(expression) {
  if (typeof expression !== "string") {
    throw new Error("A expressão deve ser uma string.");
  }

  const sanitized = expression.trim();

  // Permite apenas dígitos, espaços e operadores aritméticos básicos válidos
  if (!/^[0-9+\-*/().% \t]+$/.test(sanitized)) {
    throw new Error("Expressão contém caracteres inválidos.");
  }

  // Avaliação segura da expressão aritmética isolada
  const result = Function(`"use strict"; return (${sanitized});`)();

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Resultado não é um número válido.");
  }

  return result;
}

