# Blop

> A personal LLM-powered AI assistant built from scratch with persistent memory, conversation management, streaming responses, and an evolving AI Engineering architecture.

Blop is a personal AI assistant project focused on exploring how modern LLM applications are built from the ground up.

The project started as a simple LLM chat application and is evolving toward a more complete AI Engineering platform, with persistent memory, conversation management, model selection, MCP integration, tools, agents, and eventually a terminal-based interface.

---

## Current Features

- LLM chat interface
- GPT-OSS integration through Groq
- Streaming responses
- Persistent conversation history
- Multiple independent conversations
- Conversation switching
- AI-generated conversation titles
- Persistent user memory
- Automatic memory extraction
- React frontend
- Node.js + Express backend
- Environment-based API key configuration

---

## Architecture

```text
                         ┌──────────────────────┐
                         │      Blop UI         │
                         │   React + Vite       │
                         └──────────┬───────────┘
                                    │
                              HTTP / Streaming
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Backend         │
                         │   Node.js + Express  │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
              ┌──────────┐   ┌─────────────┐  ┌──────────────┐
              │  Groq    │   │ User Memory │  │ Conversations│
              │ GPT-OSS   │   │             │  │              │
              └──────────┘   └─────────────┘  └──────────────┘