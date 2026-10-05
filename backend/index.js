import express from "express";
import cors from "cors";
import OpenAI from "openai";
import "dotenv/config";
import fs from "fs";

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MEMORY_FILE = "memory.json";
const USER_MEMORY_FILE = "user-memory.json";
const CONVERSATIONS_FILE = "conversations.json";
// Carrega a memória existente
let historico = JSON.parse(
  fs.readFileSync(MEMORY_FILE, "utf-8")
);

let conversas = JSON.parse(
  fs.readFileSync(CONVERSATIONS_FILE, "utf-8")
);

let conversaAtual = "conversation-1";

let memoriaUsuario = JSON.parse(
  fs.readFileSync(USER_MEMORY_FILE, "utf-8")
);

// Salva a memória no arquivo
function salvarMemoria() {
  fs.writeFileSync(
    MEMORY_FILE,
    JSON.stringify(historico, null, 2)
  );
}

function salvarMemoriaUsuario() {
  fs.writeFileSync(
    USER_MEMORY_FILE,
    JSON.stringify(memoriaUsuario, null, 2)
  );
}
function adicionarMemoria(key, value) {
  const memoriaExistente = memoriaUsuario.find(
    (item) => item.key === key
  );

  if (memoriaExistente) {
    memoriaExistente.value = value;
  } else {
    memoriaUsuario.push({
      key,
      value,
    });
  }

  salvarMemoriaUsuario();
}

function salvarConversas() {
  fs.writeFileSync(
    CONVERSATIONS_FILE,
    JSON.stringify(conversas, null, 2)
  );
}
function salvarConversaAtual(title) {
  const tituloExistente = conversas[conversaAtual]?.title;

  conversas[conversaAtual] = {
    title:
      title ||
      tituloExistente ||
      "Nova conversa",
    messages: historico,
  };

  salvarConversas();
}
async function analisarMemoria(message) {
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `
You are the memory manager of an AI assistant.

Your job is to decide whether the user's message contains information
that should be remembered permanently about the user.

SAVE information such as:
- name
- profession
- field of study
- career goals
- long-term interests
- important personal preferences
- ongoing personal projects
- technologies the user is learning
- explicit requests to remember something

DO NOT SAVE:
- temporary activities
- questions
- casual conversation
- greetings
- facts about other people
- information that is only relevant to the current conversation
- temporary moods or situations

If the user explicitly says "remember this", "remember that",
"don't forget", or similar, treat it as important.

Return ONLY valid JSON.

If there is nothing worth remembering:
{
  "action": "ignore"
}

If there is new information:
{
  "action": "save",
  "key": "short_key",
  "value": "information"
}

If an existing memory should be changed:
{
  "action": "update",
  "key": "existing_key",
  "value": "new_information"
}

Existing memories:
${JSON.stringify(memoriaUsuario)}
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0,
    });

    const result = response.choices[0].message.content;

    const memory = JSON.parse(result);

    if (
      (memory.action === "save" || memory.action === "update") &&
      memory.key &&
      memory.value
    ) {
      adicionarMemoria(memory.key, memory.value);

      console.log(
        `🧠 Memória ${memory.action}: ${memory.key} = ${memory.value}`
      );
    } else {
      console.log("🧠 Nenhuma memória nova.");
    }
  } catch (error) {
    console.error("Erro ao analisar memória:", error);
  }
}

// Teste do servidor
app.get("/", (req, res) => {
  res.json({
    message: "AI Chat Backend funcionando!",
  });
});

app.get("/api/conversations/:id", (req, res) => {
  const { id } = req.params;

  const conversa = conversas[id];

  if (!conversa) {
    return res.status(404).json({
      error: "Conversa não encontrada.",
    });
  }

  res.json(conversa);
});

app.get("/api/conversations", (req, res) => {
  res.json(conversas);
});

// Chat com a IA
// Retorna o histórico da conversa
app.get("/api/history", (req, res) => {
  res.json(historico);
});
async function gerarTituloConversa(message) {
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `
Você é responsável por criar títulos curtos para conversas de um chatbot.

Crie um título baseado na mensagem do usuário.

Regras:
- 3 a 6 palavras.
- Seja específico sobre o assunto.
- Não use aspas.
- Não use ponto final.
- Não escreva explicações.
- Retorne SOMENTE o título.

Exemplos:
"Como faço um agente usando MCP?"
=> Agentes de IA com MCP

"Preciso melhorar meu currículo para estágio"
=> Currículo para Estágio

"Como conectar React com Node?"
=> Integração React e Node
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Erro ao gerar título:", error);
    return "Nova conversa";
  }
}

app.post("/api/new-chat", (req, res) => {
  if (historico.length > 0) {
    salvarConversaAtual();
  }

  conversaAtual = `conversation-${Date.now()}`;

  historico = [];

  res.json({
    message: "Nova conversa criada.",
    conversationId: conversaAtual,
  });
});
app.post("/api/conversations/:id/select", (req, res) => {
  const { id } = req.params;

  const conversa = conversas[id];

  if (!conversa) {
    return res.status(404).json({
      error: "Conversa não encontrada.",
    });
  }

  conversaAtual = id;
  historico = [...conversa.messages];

  res.json({
    message: "Conversa selecionada.",
    conversationId: conversaAtual,
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const isFirstMessage =
  historico.filter((item) => item.role === "user").length === 0;

    if (!message) {
      return res.status(400).json({
        error: "Mensagem não fornecida.",
      });
    }

    historico.push({
      role: "user",
      content: message,
    });

   const systemPrompt = {
  role: "system",
  content: `
Você é um assistente de IA chamado Blop.

Você possui uma memória permanente sobre o usuário.

Informações conhecidas sobre o usuário:
${memoriaUsuario
  .map((item) => `- ${item.key}: ${item.value}`)
  .join("\n")}

Regras:
- Responda em ingl, a menos que o usuário peça outro idioma.
- Seja claro e direto.
- Explique conceitos técnicos de forma simples.
- Quando fornecer código, explique brevemente o que ele faz.
- Não invente informações quando não tiver certeza.
- Use as informações da memória quando forem relevantes.
- Quando o usuário perguntar quem ele é, use a memória disponível para responder.
`,
};

    const stream = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [systemPrompt, ...historico],
      stream: true,
    });

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullReply = "";

    for await (const chunk of stream) {
      const content =
        chunk.choices[0]?.delta?.content || "";

      if (content) {
        fullReply += content;
        res.write(content);
      }
    }

    historico.push({
      role: "assistant",
      content: fullReply,
    });

salvarMemoria();

await analisarMemoria(message);

if (isFirstMessage) {
  const titulo = await gerarTituloConversa(message);

  salvarConversaAtual(titulo);

  console.log(`🏷️ Título gerado: ${titulo}`);
} else {
  salvarConversaAtual(
    conversas[conversaAtual]?.title || "Nova conversa"
  );
}

res.end();

  } catch (error) {
    console.error("Erro na Groq:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Erro ao conversar com a IA.",
      });
    } else {
      res.end();
    }
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(
    `🚀 Backend rodando em http://localhost:${PORT}`
  );
});