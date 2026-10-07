# Blop — Documentação Técnica

> Assistente de IA pessoal construído do zero com memória persistente, gerenciamento de conversas, streaming e arquitetura evolutiva em direção a uma plataforma de AI Engineering.

---

## Sumário

- [O que é o Blop](#o-que-é-o-blop)
- [Objetivo](#objetivo)
- [Arquitetura Atual](#arquitetura-atual)
  - [Visão Geral](#visão-geral)
  - [Stack Tecnológico](#stack-tecnológico)
  - [Estrutura do Projeto](#estrutura-do-projeto)
  - [Rotas da API](#rotas-da-api)
  - [Fluxo de uma Mensagem](#fluxo-de-uma-mensagem)
  - [Streaming](#streaming)
  - [Memória Persistente](#memória-persistente)
  - [Conversações](#conversações)
  - [Seleção de Modelos](#seleção-de-modelos)
  - [Estado do Frontend](#estado-do-frontend)
- [Arquitetura Planejada](#arquitetura-planejada)
  - [Visão Futura](#visão-futura)
  - [Orchestrator](#orchestrator)
  - [Agents (Agentes Especializados)](#agents-agentes-especializados)
  - [Tools](#tools)
  - [MCP (Model Context Protocol)](#mcp-model-context-protocol)
  - [Workspace](#workspace)
  - [Blop CLI](#blop-cli)
  - [Fluxo Futuro de Execução](#fluxo-futuro-de-execução)
- [Roadmap](#roadmap)
- [Decisões Arquiteturais](#decisões-arquiteturais)

---

## O que é o Blop

Blop é um assistente de IA pessoal focado em explorar como aplicações modernas baseadas em LLMs são construídas do zero. O projeto serve como laboratório de AI Engineering, implementando conceitos como memória persistente, streaming de respostas, gerenciamento de conversas e seleção dinâmica de modelos.

## Objetivo

- Construir um assistente de IA completo e funcional sem depender de frameworks prontos
- Explorar padrões de AI Engineering na prática: streaming, memória, agentes, tools e MCP
- Evoluir de um chat simples para uma plataforma com orquestração de agentes e interface CLI

---

## Arquitetura Atual

> ✅ Tudo nesta seção já está implementado e funcionando.

### Visão Geral

```
┌──────────────────────┐
│      Blop UI         │
│   React 19 + Vite    │
└──────────┬───────────┘
           │
      HTTP / Streaming
           │
           ▼
┌──────────────────────┐
│      Backend         │
│  Node.js + Express 5 │
└──────────┬───────────┘
           │
    ┌──────┼──────────────┐
    │      │              │
    ▼      ▼              ▼
┌────────┐ ┌────────────┐ ┌──────────────┐
│  Groq  │ │User Memory │ │Conversations │
│GPT-OSS │ │  (JSON)    │ │   (JSON)     │
└────────┘ └────────────┘ └──────────────┘
```

O frontend é uma SPA React que se comunica com um backend Express via HTTP. O backend atua como gateway entre a UI e a API da Groq, gerenciando memória e conversas em arquivos JSON locais.

### Stack Tecnológico

| Camada | Tecnologias |
|--------|------------|
| **Frontend** | React 19, Vite 8, CSS puro |
| **Backend** | Node.js, Express 5, ES Modules |
| **LLM Provider** | Groq (endpoint compatível com OpenAI) |
| **SDK** | OpenAI SDK v7 (adaptado para Groq) |
| **Modelos** | `openai/gpt-oss-20b`, `openai/gpt-oss-120b` |
| **Persistência** | Arquivos JSON locais (memory.json, user-memory.json, conversations.json) |
| **Linter** | oxlint |

### Estrutura do Projeto

```
meu-ai-chat/
├── backend/
│   ├── index.js              # Servidor Express — rotas, streaming, memória
│   ├── package.json
│   ├── .env                  # GROQ_API_KEY
│   ├── memory.json           # Histórico da conversa ativa
│   ├── user-memory.json      # Memória permanente do usuário (key/value)
│   └── conversations.json    # Banco de conversas salvas
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Componente principal — UI, estado, streaming
│   │   ├── App.css           # Estilos da aplicação
│   │   ├── main.jsx          # Entry point React
│   │   └── index.css         # Estilos globais
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── README.md
├── DOCUMENTATION.md
└── .gitignore
```

### Rotas da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Health check |
| `GET` | `/api/history` | Retorna o histórico da conversa ativa |
| `GET` | `/api/conversations` | Lista todas as conversas salvas |
| `GET` | `/api/conversations/:id` | Retorna uma conversa específica |
| `POST` | `/api/new-chat` | Salva conversa atual e cria nova |
| `POST` | `/api/conversations/:id/select` | Ativa uma conversa existente |
| `POST` | `/api/chat` | Envia mensagem — streaming + memória + título automático |

### Fluxo de uma Mensagem

```
Usuário digita mensagem
        │
        ▼
Frontend adiciona mensagem do user + placeholder vazio do assistant
        │
        ▼
POST /api/chat { message, model }
        │
        ▼
Backend adiciona mensagem ao histórico (in-memory)
        │
        ▼
Monta system prompt com memória do usuário injetada
        │
        ▼
Chama Groq API com stream: true
        │
        ▼
Para cada chunk recebido:
  ├── res.write(chunk) → envia ao frontend
  └── Acumula em fullReply
        │
        ▼
Ao finalizar o stream:
  ├── Salva resposta no histórico
  ├── Persiste histórico em memory.json
  ├── Executa analisarMemoria() → extrai dados do usuário
  ├── Se primeira mensagem → gera título via LLM
  └── Salva conversa em conversations.json
        │
        ▼
Frontend atualiza mensagens em tempo real via ReadableStream
```

### Streaming

O streaming usa **HTTP chunked transfer encoding** (não SSE nem WebSocket):

**Backend:**
- Define headers: `Content-Type: text/plain; charset=utf-8`, `Cache-Control: no-cache`, `Connection: keep-alive`
- Itera sobre chunks do stream da Groq com `for await...of`
- Escreve cada chunk diretamente com `res.write(content)`
- Finaliza com `res.end()`

**Frontend:**
- Usa `fetch()` com `response.body.getReader()` + `TextDecoder`
- Loop `while (true)` lendo chunks via `reader.read()`
- Cada chunk atualiza o estado React imutavelmente, modificando o conteúdo da última mensagem (assistant placeholder)
- Resultado: texto aparece progressivamente na tela

### Memória Persistente

O Blop possui um sistema de memória de duas camadas:

**1. Memória de Conversa (`memory.json`)**
- Array de mensagens `{ role, content }` da conversa ativa
- Salvo com `fs.writeFileSync` após cada resposta

**2. Memória do Usuário (`user-memory.json`)**
- Array de objetos `{ key, value }` com dados permanentes do usuário
- Exemplos: `name: Caetano`, `area_de_estudo: AI Engineering`
- Populada automaticamente pela função `analisarMemoria()`

**Extração Automática de Memória:**
- Após cada mensagem, `analisarMemoria()` chama o GPT-OSS 20B com `temperature: 0`
- Prompt especializado decide entre `save`, `update` ou `ignore`
- Salva informações como: nome, profissão, área de estudo, projetos, preferências
- Ignora: saudações, perguntas casuais, humor temporário
- A memória é injetada no system prompt de todas as conversas futuras

### Conversações

- Cada conversa recebe um ID único: `conversation-${Date.now()}`
- Todas são armazenadas em `conversations.json` como um dicionário `{ id: { title, messages } }`
- **Título automático:** na primeira mensagem de cada conversa, `gerarTituloConversa()` usa LLM (`temperature: 0.3`) para criar um título de 3-6 palavras
- **Troca de conversa:** `POST /api/conversations/:id/select` carrega as mensagens da conversa selecionada no `historico` ativo
- **Nova conversa:** `POST /api/new-chat` salva a conversa atual (se houver) e reseta o histórico
- O sidebar do frontend lista todas as conversas e permite alternar entre elas

### Seleção de Modelos

Dois modelos disponíveis via Groq:

| Identificador | Nome na UI |
|---------------|------------|
| `openai/gpt-oss-20b` | GPT-OSS 20B |
| `openai/gpt-oss-120b` | GPT-OSS 120B |

- O frontend mantém o estado `selectedModel` (padrão: `openai/gpt-oss-20b`)
- O dropdown no input permite trocar entre os modelos
- O botão do seletor exibe dinamicamente o nome do modelo ativo
- O modelo é enviado no body do `POST /api/chat` como `{ message, model }`
- O backend usa `model || "openai/gpt-oss-20b"` como fallback
- **Nota:** chamadas auxiliares (título e memória) sempre usam `openai/gpt-oss-20b` independentemente da seleção do usuário

### Estado do Frontend

O frontend usa hooks nativos do React (`useState`, `useEffect`):

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `message` | `string` | Texto do input controlado |
| `messages` | `array` | Mensagens da conversa ativa |
| `loading` | `boolean` | Trava inputs durante streaming |
| `conversations` | `object` | Dicionário de conversas para o sidebar |
| `selectedModel` | `string` | Modelo selecionado pelo usuário |
| `modelMenuOpen` | `boolean` | Estado do dropdown de modelos |

---

## Arquitetura Planejada

> 🔮 Tudo nesta seção é planejado e ainda **não está implementado**.

### Visão Futura

O Blop evoluirá de um chat direto com LLM para uma plataforma com orquestração de agentes especializados, ferramentas externas e protocolo MCP:

```
┌─────────────────────────────────────────────────────────┐
│                    Blop UI / Blop CLI                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    Orchestrator     │
              │  (Roteador Central) │
              └──────────┬──────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │   Agent    │ │   Agent    │ │   Agent    │
   │   Code     │ │  Research  │ │  Memory    │
   └──────┬─────┘ └──────┬─────┘ └──────┬─────┘
          │              │              │
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │   Tools    │ │   Tools    │ │   Tools    │
   │ fs, shell  │ │ web, RAG   │ │ vector DB  │
   └──────┬─────┘ └──────┬─────┘ └──────┬─────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    MCP Servers      │
              │ (Protocolo Padrão)  │
              └─────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     Workspace       │
              │  (Projeto do User)  │
              └─────────────────────┘
```

### Orchestrator

O Orchestrator será o componente central que:

- Recebe a intenção do usuário
- Analisa o contexto e decide qual agente (ou combinação de agentes) deve responder
- Gerencia o ciclo de vida da tarefa: planejamento → execução → validação
- Consolida respostas de múltiplos agentes em uma resposta coerente
- Mantém o histórico de contexto entre turnos

### Agents (Agentes Especializados)

Cada agente terá um domínio específico e acesso a tools relevantes:

| Agente | Responsabilidade | Tools Planejadas |
|--------|-----------------|-----------------|
| **Code Agent** | Gerar, editar e refatorar código | Leitura/escrita de arquivos, execução de shell |
| **Research Agent** | Buscar informações e documentação | Web search, leitura de URLs, RAG |
| **Memory Agent** | Gerenciar contexto de longo prazo | Vector DB, busca semântica |
| **Planning Agent** | Decompor tarefas complexas em subtarefas | Acesso ao grafo de tarefas |
| **Review Agent** | Validar e revisar outputs de outros agentes | Linting, testes, análise estática |

### Tools

Tools são funções que os agentes podem invocar para interagir com o mundo externo:

- **Filesystem:** ler, escrever, listar e buscar arquivos
- **Shell:** executar comandos no terminal
- **Web:** buscar informações na internet
- **RAG:** busca semântica em documentos indexados
- **Vector DB:** armazenar e recuperar embeddings

### MCP (Model Context Protocol)

O MCP será usado como protocolo padrão de comunicação entre agentes e ferramentas externas:

- Servidor MCP expondo tools do workspace (filesystem, shell, git)
- Possibilidade de conectar MCP servers de terceiros
- Interface padronizada para adicionar novas capacidades ao Blop

### Workspace

O conceito de Workspace representará o projeto do usuário:

- Diretório de trabalho com contexto completo do projeto
- Indexação de arquivos para busca semântica
- Entendimento da estrutura do projeto (package.json, imports, dependências)
- Sandbox para execução segura de código gerado

### Blop CLI

Interface de terminal para interagir com o Blop diretamente do terminal:

- Comandos como `blop chat`, `blop ask "..."`, `blop code "..."`
- Acesso direto ao workspace atual (diretório do terminal)
- Streaming de respostas no terminal
- Integração com o pipeline de agentes
- Alternativa leve à UI web para fluxos de desenvolvimento

### Fluxo Futuro de Execução

```
Usuário envia tarefa (UI ou CLI)
        │
        ▼
Orchestrator analisa a intenção
        │
        ▼
Decompõe em subtarefas (se necessário)
        │
        ├── Subtarefa 1 → Code Agent → fs.write, shell.exec
        ├── Subtarefa 2 → Research Agent → web.search
        └── Subtarefa 3 → Memory Agent → vector.search
        │
        ▼
Review Agent valida os resultados
        │
        ▼
Orchestrator consolida e responde ao usuário
        │
        ▼
Memory Agent persiste contexto relevante
```

---

## Roadmap

### Fase 1 — Fundação ✅ (Concluída)

- [x] Chat básico com LLM
- [x] Integração com Groq (GPT-OSS)
- [x] Streaming de respostas
- [x] Histórico de conversa persistente
- [x] Múltiplas conversas independentes
- [x] Troca entre conversas
- [x] Títulos automáticos via LLM
- [x] Memória permanente do usuário
- [x] Extração automática de memória
- [x] Seleção de modelos (20B / 120B)
- [x] Frontend React com sidebar e input estilizado

### Fase 2 — Infraestrutura de Agentes 🔜

- [ ] Refatorar backend em módulos separados (routes, services, agents)
- [ ] Implementar estrutura base de Agent (prompt, tools, contexto)
- [ ] Criar Orchestrator para roteamento de intenções
- [ ] Sistema de Tools com interface padronizada
- [ ] Tool: leitura/escrita de arquivos
- [ ] Tool: execução de comandos shell

### Fase 3 — MCP e Workspace

- [ ] Implementar MCP server para o workspace local
- [ ] Indexação de arquivos do projeto
- [ ] Contexto de projeto (detecção de stack, dependências)
- [ ] Code Agent com capacidade de editar código
- [ ] Research Agent com busca web

### Fase 4 — Memória Avançada

- [ ] Migrar memória para vector database (embeddings)
- [ ] Busca semântica no histórico de conversas
- [ ] RAG sobre documentos do workspace
- [ ] Memory Agent dedicado

### Fase 5 — Blop CLI

- [ ] CLI básico: `blop chat`
- [ ] Streaming no terminal
- [ ] Acesso ao workspace do diretório atual
- [ ] Integração com pipeline de agentes
- [ ] Comandos: `blop ask`, `blop code`, `blop review`

### Fase 6 — Review e Qualidade

- [ ] Review Agent para validação de outputs
- [ ] Execução de testes automatizados
- [ ] Análise estática de código gerado
- [ ] Loop de auto-correção (gerar → testar → corrigir)

---

## Decisões Arquiteturais

| Decisão | Justificativa |
|---------|--------------|
| **Groq como provider** | Latência baixa e endpoint compatível com OpenAI SDK, permitindo troca futura de provider sem refatoração |
| **OpenAI SDK para Groq** | SDK oficial robusto; Groq expõe API compatível, evitando dependência de SDK proprietário |
| **Arquivos JSON para persistência** | Simplicidade para fase inicial; sem necessidade de banco de dados enquanto o projeto é single-user |
| **Streaming via chunked transfer** | Mais simples que SSE ou WebSocket para o caso de uso atual; suportado nativamente por fetch + ReadableStream |
| **React 19 sem state manager** | useState/useEffect suficientes para a complexidade atual; Context ou Zustand serão considerados quando houver mais estado compartilhado |
| **Express 5** | Suporte nativo a async handlers e melhorias de roteamento |
| **Memória auxiliar sempre em GPT-OSS 20B** | Tarefas de extração de memória e geração de título não precisam do modelo maior; economiza tokens e reduz latência |
| **Vite 8** | Build rápido, HMR instantâneo, ecossistema moderno |
| **CSS puro** | Controle total sobre estilos sem overhead de framework CSS na fase inicial |
| **Monorepo simples (pasta raiz)** | Frontend e backend colocados lado a lado sem tooling de monorepo; adequado para projeto pessoal de escopo limitado |

