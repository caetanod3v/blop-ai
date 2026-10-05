import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState({});
  useEffect(() => {
  console.log("🧠 MESSAGES ATUALIZADAS:", messages);
}, [messages]);

  // =========================
  // CARREGAR DADOS INICIAIS
  // =========================

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(
          "http://localhost:3000/api/history"
        );

        if (!response.ok) {
          throw new Error(
            "Não foi possível carregar o histórico."
          );
        }

        const history = await response.json();
        setMessages(history);
      } catch (error) {
        console.error(
          "Erro ao carregar histórico:",
          error
        );
      }
    }

    async function loadConversations() {
      try {
        const response = await fetch(
          "http://localhost:3000/api/conversations"
        );

        if (!response.ok) {
          throw new Error(
            "Não foi possível carregar as conversas."
          );
        }

        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error(
          "Erro ao carregar conversas:",
          error
        );
      }
    }

    loadHistory();
    loadConversations();
  }, []);

  // =========================
  // NOVA CONVERSA
  // =========================

  async function newChat() {
    if (loading) return;

    try {
      const response = await fetch(
        "http://localhost:3000/api/new-chat",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Não foi possível criar uma nova conversa."
        );
      }

      setMessages([]);
      setMessage("");

      const conversationsResponse = await fetch(
        "http://localhost:3000/api/conversations"
      );

      if (conversationsResponse.ok) {
        const data = await conversationsResponse.json();
        setConversations(data);
      }
    } catch (error) {
      console.error(
        "Erro ao criar nova conversa:",
        error
      );
    }
  }

  // =========================
  // ENVIAR MENSAGEM
  // =========================

  async function sendMessage(event) {
  event.preventDefault();

  console.log("🚀 ENVIO FOI ACIONADO");
  console.log("Mensagem:", message);
  console.log("Loading:", loading);

  if (!message.trim() || loading) {
    return;
  }

  const userMessage = message.trim();

  // Adiciona usuário + mensagem vazia do Blop juntos
  setMessages((current) => [
    ...current,
    {
      role: "user",
      content: userMessage,
    },
    {
      role: "assistant",
      content: "",
    },
  ]);

  setMessage("");
  setLoading(true);

  try {
    console.log("📡 ENVIANDO PARA O BACKEND...");

    const response = await fetch(
      "http://localhost:3000/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      }
    );

    console.log(
      "📡 RESPOSTA DO BACKEND:",
      response.status
    );

    if (!response.ok) {
      throw new Error(
        "Erro ao conversar com o Blop."
      );
    }

    if (!response.body) {
      throw new Error(
        "O navegador não suporta streaming."
      );
    }

    console.log("📥 STREAM INICIADO");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let assistantText = "";

    while (true) {
      const { value, done } = await reader.read();

      console.log(
        "📦 CHUNK RECEBIDO:",
        value,
        "DONE:",
        done
      );

      if (done) break;

      const chunk = decoder.decode(value, {
        stream: true,
      });

      assistantText += chunk;

      setMessages((current) => {
        const updated = [...current];

        // Última mensagem é a resposta do Blop
        updated[updated.length - 1] = {
          role: "assistant",
          content: assistantText,
        };

        return updated;
      });
    }

    // Atualiza conversas salvas
    const conversationsResponse = await fetch(
      "http://localhost:3000/api/conversations"
    );

    if (conversationsResponse.ok) {
      const data =
        await conversationsResponse.json();

      setConversations(data);
    }

  } catch (error) {
    console.error(
      "Erro ao enviar mensagem:",
      error
    );

    setMessages((current) => {
      const updated = [...current];

      updated[updated.length - 1] = {
        role: "assistant",
        content: `Erro: ${error.message}`,
      };

      return updated;
    });

  } finally {
    setLoading(false);
  }
}

  // =========================
  // CARREGAR UMA CONVERSA
  // =========================

 async function loadConversation(conversationId) {
  if (loading) return;

  try {
    // Primeiro informa ao backend qual conversa está ativa
    const selectResponse = await fetch(
      `http://localhost:3000/api/conversations/${conversationId}/select`,
      {
        method: "POST",
      }
    );

    if (!selectResponse.ok) {
      throw new Error(
        "Não foi possível selecionar a conversa."
      );
    }

    // Depois carrega as mensagens
    const response = await fetch(
      `http://localhost:3000/api/conversations/${conversationId}`
    );

    if (!response.ok) {
      throw new Error(
        "Não foi possível carregar a conversa."
      );
    }

    const data = await response.json();

    setMessages(data.messages);
    setMessage("");

  } catch (error) {
    console.error(
      "Erro ao carregar conversa:",
      error
    );
  }
}

  // =========================
  // INTERFACE
  // =========================

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-header">
          <h1>Blop</h1>

          <button
            className="new-chat-button"
            onClick={newChat}
            disabled={loading}
          >
            + Nova conversa
          </button>
        </div>

        <div className="conversation-list">

          <div className="conversation-title">
            Conversas
          </div>

          {Object.entries(conversations).map(
            ([conversationId, conversation]) => (
              <button
                key={conversationId}
                className="conversation-item"
                onClick={() =>
                  loadConversation(conversationId)
                }
                disabled={loading}
              >
                {conversation.title}
              </button>
            )
          )}

        </div>

      </aside>

      {/* CHAT */}

      <section className="chat-container">

        <header className="header">
  <h1>Blop</h1>
</header>

        <main className="chat">

          {messages.length === 0 && (
            <div className="welcome">
              <h2>Olá, Caetano 👋</h2>

              <p>
                Converse com o Blop, seu assistente de IA.
              </p>
            </div>
          )}

          {messages.map((item, index) => (
            <div
              key={index}
              className={`message ${item.role}`}
            >

              <div className="message-label">
                {item.role === "user"
                  ? "Você"
                  : "Blop"}
              </div>

              <div className="message-content">
                {item.content}
              </div>

            </div>
          ))}

          {loading &&
            messages[messages.length - 1]?.role !==
              "assistant" && (
              <div className="message assistant">

                <div className="message-label">
                  Blop
                </div>

                <div className="message-content">
                  Pensando...
                </div>

              </div>
            )}

        </main>

        {/* INPUT */}

        <form className="input-area" onSubmit={sendMessage}>
  <div className="input-box">
    <input
      value={message}
      onChange={(event) => setMessage(event.target.value)}
      placeholder="Digite sua mensagem..."
      disabled={loading}
    />

    <div className="input-bottom">
      <button
        type="button"
        className="model-selector"
      >
        GPT-OSS
        <span>⌄</span>
      </button>

      <button
        type="submit"
        className="send-button"
        disabled={loading || !message.trim()}
        aria-label="Enviar mensagem"
      >
        ↑
      </button>
    </div>
  </div>
</form>
      </section>

    </div>
  );
}

export default App;