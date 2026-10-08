import fs from "fs/promises";
import path from "path";

const WORKSPACE = path.resolve("C:/Projetos/meu-ai-chat");

export async function listFiles({ path: relativePath = "." } = {}) {
  const targetPath = path.resolve(WORKSPACE, relativePath);

  if (
    targetPath !== WORKSPACE &&
    !targetPath.startsWith(WORKSPACE + path.sep)
  ) {
    throw new Error("Acesso ao diretório bloqueado.");
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });

  return entries.map((entry) => ({
    name: entry.name,
    type: entry.isDirectory() ? "directory" : "file",
  }));
}