import fs from "fs/promises";
import path from "path";

const WORKSPACE = path.resolve("C:/Projetos/meu-ai-chat");

export async function readFile({ path: filePath }) {
  const fullPath = path.resolve(WORKSPACE, filePath);

  // Impede sair do workspace
  if (
    fullPath !== WORKSPACE &&
    !fullPath.startsWith(WORKSPACE + path.sep)
  ) {
    throw new Error("Acesso ao arquivo bloqueado.");
  }

  return await fs.readFile(fullPath, "utf-8");
}