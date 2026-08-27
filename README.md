<div align="center">

![DownDetector Banner](.github/assets/banner.png)

</div>

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Slack Bot](https://img.shields.io/badge/Slack-Bot-4A154B?logo=slack&logoColor=white)](https://docs.slack.dev/)
[![Camoufox](https://img.shields.io/badge/Camoufox-AntiDetection-FF6B35?logo=firefox)](https://github.com/apify/camoufox-js)
[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-Dashboard-F46800?logo=grafana&logoColor=white)](https://grafana.com/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway)](https://railway.app/)

**[🇧🇷 Português](#-português)**

[Configuração](#configuração) • [Uso](#uso) • [Observabilidade](#observabilidade) • [Testes](#testes) • [Contribuição](#contribuição)

**Monitoramento automatizado em tempo real de serviços financeiros brasileiros usando Downdetector**

**[🇨🇱 Español](#-español)**

[Configuración](#configuración) • [Modo de Uso](#modo-de-uso) • [Observabilidad](#observabilidad) • [Pruebas](#pruebas) • [Contribución](#contribución)

**Monitoreo automatizado en tiempo real de los servicios financieros brasileños mediante Downdetector**

</div>

---

# 🇧🇷 Português

## Por que este projeto existe?

Este bot foi criado para **detectar instabilidades** reportadas no **[Downdetector Brasil](https://downdetector.com.br/)** e notificar automaticamente canais do **[Slack](https://slack.com/intl/pt-br/)** sobre potenciais problemas que afetem serviços financeiros brasileiros.

A ideia é permitir que equipes técnicas **correlacionem incidentes externos com problemas internos**, como a abertura de chamados relacionados a um determinado serviço ou sistemas que dependam da disponibilidade desses serviços.

Com essas informações em tempo real, é possível **identificar possíveis causas externas, antecipar impactos e agir antes que uma instabilidade se transforme em um problema maior**.

### Desafio

O Downdetector é protegido pelo **Cloudflare Turnstile**, que bloqueia scraping automatizado de IPs de datacenter (Railway, AWS, GCP). Ferramentas padrão (Playwright, Puppeteer) são detectadas no nível JavaScript e bloqueadas.

### Solução

O projeto utiliza o **[Camoufox-js](https://github.com/apify/camoufox-js)**, um port em JS/TS do Camoufox original, que é um fork do Firefox voltado à redução de sinais de automação do navegador. O navegador é executado em modo **headed** (com interface gráfica) dentro de um display virtual (**Xvfb**), permitindo que o Firefox rode de forma invisível em um ambiente de servidor.

### Agradecimentos e Créditos

Este projeto foi construído utilizando a versão em JS/TS mantida pela **[Apify](https://github.com/apify)**. O **[Camoufox-js](https://github.com/apify/camoufox-js)** é um port baseado no projeto original **[Camoufox](https://github.com/daijro/camoufox)**, criado por **[daijro](https://github.com/daijro)**. 

Fica aqui o agradecimento aos desenvolvedores por disponibilizarem essas excelentes ferramentas para a comunidade.

---

## Funcionalidades

- **Headed + Xvfb**: o navegador roda com interface gráfica em um display virtual, mesmo dentro de um servidor, inicializado via [`xvfb.sh`](xvfb.sh)
- **Páginas isoladas**: cada serviço é verificado em seu próprio contexto (`newContext()` + `newPage()`), sem reaproveitamento de cookies/cache entre eles
- **Parsing PT-BR**: o status é identificado a partir dos textos exibidos pelo Downdetector em português
- **Adaptação de idioma**: o navegador envia `Accept-Language` priorizando português do Brasil
- **Retry automático**: uma consulta que falha recebe uma segunda tentativa utilizando a função checkSingleService em [`downdetectorService.ts`](src/services/downdetectorService.ts) antes de ser descartada
- **Ciclo contínuo com atraso aleatório**: o monitoramento roda uma vez ao iniciar e depois se reagenda continuamente, com um intervalo aleatório entre execuções
- **Alertas de erro internos em dois canais**: se nenhum serviço puder ser verificado em um ciclo, o bot dispara simultaneamente uma mensagem efêmera no canal (visível só pra você no desktop) **e** uma DM direta (visível em qualquer client, incluindo mobile), via [`src/slack/errorMonitor/`](src/slack/errorMonitor)
- **Validação fail-fast de variáveis de ambiente**: o container falha imediatamente na inicialização caso alguma variável obrigatória esteja faltando, evitando deploys silenciosamente quebrados
- **Fechamento robusto do browser**: `forceCloseBrowser()` tenta o fechamento normal com timeout de 3s; se o browser travar, [`tree-kill`](https://github.com/pkrumins/node-tree-kill) é usado como rede de segurança pra encerrar toda a árvore de processos do Firefox, prevenindo órfãos
- **Init próprio (tini)**: tini é usado como PID 1 no container pra fazer reap de processos zumbis e encaminhamento correto de sinais (SIGTERM/SIGINT)
- **Métricas Prometheus**: expõe `/metrics` com o status de cada serviço (`downdetector_service_status`), via `prom-client`
- **Dashboard Grafana**: painel provisionado automaticamente com o status em tempo real de todos os serviços monitorados
- **Docker multi-stage + Railway**: build separado do runtime com apenas o mínimo necessário pra executar, com Dockerfiles independentes pro bot, Prometheus e Grafana
- **Testes**: testes unitários com Vitest e script manual pra testar alertas no Slack

---

## Serviços monitorados

<details>
<summary>Clique para expandir</summary>

| Serviço | URL |
|---------|-----|
| **PIX** | [downdetector.com.br/fora-do-ar/pix/](https://downdetector.com.br/fora-do-ar/pix/) |
| **Itaú** | [downdetector.com.br/fora-do-ar/banco-itau/](https://downdetector.com.br/fora-do-ar/banco-itau/) |
| **Bradesco** | [downdetector.com.br/fora-do-ar/bradesco/](https://downdetector.com.br/fora-do-ar/bradesco/) |
| **Santander** | [downdetector.com.br/fora-do-ar/santander/](https://downdetector.com.br/fora-do-ar/santander/) |
| **Nubank** | [downdetector.com.br/fora-do-ar/nubank/](https://downdetector.com.br/fora-do-ar/nubank/) |
| **Banco do Brasil** | [downdetector.com.br/fora-do-ar/banco-do-brasil/](https://downdetector.com.br/fora-do-ar/banco-do-brasil/) |
| **Mercado Pago** | [downdetector.com.br/fora-do-ar/mercadopago/](https://downdetector.com.br/fora-do-ar/mercadopago/) |
| **PicPay** | [downdetector.com.br/fora-do-ar/picpay/](https://downdetector.com.br/fora-do-ar/picpay/) |

</details>

---

## Adicionando novos serviços

<details>
<summary>Clique para expandir</summary>

O bot foi estruturado para que novos serviços do Downdetector possam ser adicionados **sem alterar a lógica principal do scraper**. São necessárias mudanças em apenas **2 arquivos**, os monitores de incidente são criados dinamicamente a partir do enum:

#### 1. [types.ts](src/slack/types.ts) → registra o nome e a URL do serviço

Adicione o serviço aos enums `ServiceName` e `ServiceURL`:

```typescript
export enum ServiceName {
    // ... serviços existentes ...
    CAIXA = "Caixa Econômica"
}

export enum ServiceURL {
    // ... URLs existentes ...
    CAIXA = "https://downdetector.com.br/fora-do-ar/caixa/"
}
```

#### 2. [downdetectorService.ts](src/services/downdetectorService.ts) → inclui o serviço na lista de scraping

Adicione a entrada no array `SERVICES`:

```typescript
const SERVICES: ServicesList[] = [
    // ... serviços existentes ...
    {
        name: ServiceName.CAIXA,
        url: ServiceURL.CAIXA
    }
];
```

#### Como os monitores são criados automaticamente ??

Em [notificationOrchestrator.ts](src/slack/notificationOrchestrator.ts), os monitores são instanciados dinamicamente a partir do enum [ServiceName](src/slack/types.ts).

```typescript
const monitors = {} as Record<ServiceName, IncidentMonitor>;

for (const name of Object.values(ServiceName)) {
    monitors[name] = new IncidentMonitor(client, channel);
};
```

#### Finalizando

Após o push (ou reinício do container), o novo serviço passa a ser monitorado automaticamente no próximo ciclo.

> 💡 **Dica:** não esqueça de atualizar também a tabela [Serviços monitorados](#serviços-monitorados) e, se quiser vê-lo no Grafana, adicione um novo painel `stat` em [downdetector.json](grafana/provisioning/dashboards/downdetector.json) apontando pra label normalizada do serviço (veja [Observabilidade](#observabilidade)).

</details>

---

## Adaptando o projeto para outro idioma

<details>
<summary>Clique para expandir</summary>

O parser de status depende dos **textos exibidos** na página do Downdetector. Atualmente o projeto prioriza `pt-BR` através do header `Accept-Language`:

```typescript
// src/services/downdetectorService.ts
await page.setExtraHTTPHeaders({
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
});
```

Para adaptar o projeto a outro idioma, você precisa ajustar **dois pontos**:

#### 1. Alterar o idioma enviado ao site

No arquivo `src/services/downdetectorService.ts`, troque o `Accept-Language` pro idioma desejado:

```typescript
// Exemplo: Chile
await page.setExtraHTTPHeaders({
    'Accept-Language': 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7'
});

// Exemplo: EUA
await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9'
});
```

#### 2. Adaptar as expressões do parser

A função `detectStatus()` identifica o estado do serviço procurando frases específicas no HTML da página:

```typescript
// src/services/downdetectorService.ts
async function detectStatus(page: Page): Promise<ServiceStatus | null> {
    try {
        ...
        ...
        if (body.includes("não mostram problemas")) return "success";
         if (body.includes("possíveis problemas")) return "warning";
          if (body.includes("mostram problemas")) return "danger";
           return false
        ...
        ...
        ...
        }
}
```

Para outros idiomas, substitua as strings pelas equivalentes. Alguns exemplos:

| Status | PT-BR | EN-US | ES-CL |
|--------|-------|-------|-------|
| `SUCCESS` | `não mostram problemas` | `no current problems` | `no muestran problemas` |
| `WARNING` | `possíveis problemas` | `possible problems` | `posibles problemas` |
| `DANGER` | `mostram problemas` | `show problems with` | `muestran problemas` |

> ⚠️ **Atenção:** a ordem das verificações importa! No PT-BR e no ES-CL, a frase de `SUCCESS` contém a frase de `DANGER` como substring (ex: `"não mostram problemas"` contém `"mostram problemas"`). Por isso `SUCCESS` é verificado **antes** de `DANGER` no código — se você adaptar para outro idioma, verifique se as frases do seu idioma têm esse mesmo tipo de sobreposição antes de definir a ordem dos `if`.

> 💡 **Dica de debug:** se o parser deixar de reconhecer um status (o Downdetector pode mudar os textos com o tempo), abra a página no seu navegador, inspecione o texto exibido e atualize as expressões da função `detectStatus()` conforme necessário.

</details>

---

## Estrutura do projeto

<details>
<summary>Clique para expandir a árvore de arquivos</summary>


```
├── .github/
│   ├── assets/
│   │   ├── es-CL/
│   │   │   ├── dd-danger.png
│   │   │   ├── dd-success.png
│   │   │   └── dd-warning.png
│   │   ├── grafana/
│   │   │   └── dashboard.png
│   │   ├── pt-BR/
│   │   │   ├── alert-critical.png
│   │   │   ├── alert-resolved.png
│   │   │   ├── dd-danger.png
│   │   │   ├── dd-success.png
│   │   │   └── dd-warning.png
│   │   └── banner.png
│   └── workflows/
│       └── ci.yaml
├── grafana/
│   ├── logos/
│   │   ├── bancodobrasil.png
│   │   ├── bradesco.png
│   │   ├── itau.png
│   │   ├── mercadopago.png
│   │   ├── nubank.png
│   │   ├── picpay.png
│   │   ├── pix.png
│   │   └── santander.png
│   ├── prometheus/
│   │   ├── prometheus.railway.yml
│   │   └── prometheus.yml
│   ├── provisioning/
│   │   ├── dashboards/
│   │   │   ├── dashboards.yml
│   │   │   └── downdetector.json
│   │   └── datasources/
│   │       └── prometheus.yml
│   └── railway/
│       └── prometheus-datasource.yml
├── src/
│   ├── config/
│   │   └── env.ts                          # Validação fail-fast de env vars
│   ├── jobs/
│   │   └── monitoring.ts                   # Loop de agendamento
│   ├── metrics/
│   │   └── prometheusClient.ts             # Gauge por serviço
│   ├── scripts/
│   │   └── testAlert.ts                    # Disparar alerta manual
│   ├── services/
│   │   └── downdetectorService.ts          # Scraper + forceCloseBrowser
│   ├── slack/
│   │   ├── __tests__/
│   │   │   ├── fixtures.ts
│   │   │   └── incidentMonitor.spec.ts
│   │   ├── errorMonitor/                   # Alertas de erro do próprio bot
│   │   │   ├── directMessageService.ts     # Envia DM
│   │   │   ├── dmAlert.ts                  # Instância exportada do DM
│   │   │   ├── ephemeralAlert.ts           # Instância exportada do ephemeral
│   │   │   └── ephemeralMessageService.ts  # Envia ephemeral
│   │   ├── incidentMonitor.ts              # Gerencia estado de incidentes
│   │   ├── manifest.json                   # Slack App Manifest
│   │   ├── notificationOrchestrator.ts     # Cria monitores dinamicamente
│   │   └── types.ts                        # Enums de serviço/URL/status
│   ├── app.ts                              # Config Slack 
│   └── server.ts                           # Entry point
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile                              # Build multi-stage com tini
├── Dockerfile.grafana
├── Dockerfile.prometheus
├── LICENSE
├── README.md
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── xvfb.sh                                 # Script de inicialização do Xvfb
```
</details>

## Arquitetura

<details>
<summary>Clique para expandir/recolher diagrama</summary>

### Fluxo do sistema

```mermaid
graph TB
    Start([Ciclo contínuo<br/>~2-3min]) --> Server[server.ts<br/>Ponto de entrada]
    Server --> Job[Monitoring Job]
    Job --> Orchestrator[notificationOrchestrator.ts<br/>Função CheckAll]

    Orchestrator --> Scraper[downdetectorService.ts<br/>Scraper]

    Scraper --> Browser{Camoufox Browser<br/>Firefox headed}
    Browser --> Xvfb[Xvfb<br/>Display Virtual]
    Browser --> DD[https://downdetector.com.br]

    DD --> Data{Extração de Estado<br/>Parsing PT-BR}
    Data --> Results["Resultados<br/>ServicesResult[]"]
    Results --> Orchestrator

    Orchestrator --> Incident[Monitores de Incidente<br/>]
    Orchestrator --> ErrorMon{Há resultados?}
    Orchestrator --> Metrics[prom-client]

    Incident --> Slack1[Slack<br/>Alerta Crítico]
    Incident --> Slack2[Slack<br/>Resolução]

    ErrorMon -- "Nenhum serviço" --> DM[DM]
    ErrorMon -- "Nenhum serviço" --> Ephemeral[Ephemeral]

    Metrics --> Endpoint["/metrics<br/>Endpoint Express"]
    Endpoint --> Prom[(Prometheus<br/>scrape 15s)]
    Prom --> Grafana[(Grafana<br/>Dashboard público)]

    Slack1 --> End([Equipe Notificada])
    Slack2 --> End
    DM --> Dev([Dev Notificado])
    Ephemeral --> Dev

    %% Estilos - Início e Fim (Verde)
    style Start fill:#059669,color:#fff
    style End fill:#059669,color:#fff
    style Dev fill:#059669,color:#fff

    %% Estilos - Core/Backend (Azul Escuro/Slate)
    style Server fill:#1e293b,color:#fff
    style Job fill:#1e293b,color:#fff
    style Orchestrator fill:#1e293b,color:#fff
    style Scraper fill:#1e293b,color:#fff
    style Incident fill:#1e293b,color:#fff
    style Endpoint fill:#1e293b,color:#fff

    %% Estilos - Scraping e Browser (Roxo)
    style Browser fill:#8b5cf6,color:#fff
    style Xvfb fill:#8b5cf6,color:#fff
    style DD fill:#8b5cf6,color:#fff
    style Data fill:#8b5cf6,color:#fff
    style Results fill:#8b5cf6,color:#fff

    %% Estilos - Condição de Erro (Vermelho)
    style ErrorMon fill:#e11d48,color:#fff

    %% Estilos - Observabilidade (Laranja)
    style Metrics fill:#ea580c,color:#fff
    style Prom fill:#ea580c,color:#fff
    style Grafana fill:#ea580c,color:#fff

    %% Estilos - Slack (Beringela - Mantido)
    style Slack1 fill:#4A154B,color:#fff
    style Slack2 fill:#4A154B,color:#fff
    style DM fill:#4A154B,color:#fff
    style Ephemeral fill:#4A154B,color:#fff
```

### Diagrama de componentes

```mermaid
graph LR
    subgraph "Camada de Aplicação"
        Server[server.ts<br/>Ponto de entrada]
        App[app.ts<br/>Config Slack + Express]
        Job[jobs/monitoring.ts<br/>]
        EnvCfg[config/env.ts<br/>Validação fail-fast]
    end

    subgraph "Camada de Orquestração"
        Orchestrator[notificationOrchestrator.ts<br/>Cria monitores via enum]
        Incident[incidentMonitor.ts<br/>Gerencia estado dos incidentes]
        ErrorMon["errorMonitor/<br/>DM + Mensagem Efêmera"]
    end

    subgraph "Camada de Coleta (Scraping)"
        Scraper[downdetectorService.ts<br/>Camoufox<br/> + Playwright + tree-kill]
    end

    subgraph "Observabilidade"
        Metrics[prometheusClient.ts<br/>Gauge por serviço]
        PromSvc[(Prometheus<br/>Container isolado)]
        GrafanaSvc[(Grafana<br/>Container isolado)]
    end

    subgraph "Infraestrutura"
        Tini[tini<br/>PID 1 + reap de zumbis]
        Xvfb[Xvfb<br/>Display virtual]
    end

    subgraph "Serviços Externos"
        Downdetector[(Downdetector.com.br)]
        SlackAPI[(Slack API)]
        Camoufox[(Camoufox Browser)]
    end

    %% Fluxos da Aplicação
    EnvCfg --> Server
    Server --> Job
    Server --> App
    Job --> Orchestrator

    %% Fluxos de Orquestração
    Orchestrator --> Scraper
    Orchestrator --> Incident
    Orchestrator --> ErrorMon
    Orchestrator --> Metrics

    %% Fluxos de Scraping
    Scraper --> Camoufox
    Camoufox --> Downdetector

    %% Notificações
    Incident --> SlackAPI
    ErrorMon --> SlackAPI

    %% Fluxos de Observabilidade
    App -- "/metrics" --> Metrics
    PromSvc -- "scrape :3000/metrics" --> App
    GrafanaSvc -- "PromQL" --> PromSvc

    %% Fluxos de Infraestrutura
    Tini --> Server
    Tini --> Xvfb
    Xvfb --> Camoufox

    %% Estilos - Backend (Azul Escuro/Slate)
    style Server fill:#1e293b,color:#fff
    style App fill:#1e293b,color:#fff
    style Job fill:#1e293b,color:#fff
    style EnvCfg fill:#1e293b,color:#fff
    style Orchestrator fill:#1e293b,color:#fff
    style Incident fill:#1e293b,color:#fff
    style ErrorMon fill:#1e293b,color:#fff

    %% Estilos - Coleta e Browser (Roxo)
    style Scraper fill:#8b5cf6,color:#fff
    style Camoufox fill:#8b5cf6,color:#fff

    %% Estilos - Observabilidade (Laranja)
    style Metrics fill:#ea580c,color:#fff
    style PromSvc fill:#ea580c,color:#fff
    style GrafanaSvc fill:#ea580c,color:#fff

    %% Estilos - Infraestrutura (Teal/Verde-azulado)
    style Tini fill:#0f766e,color:#fff
    style Xvfb fill:#0f766e,color:#fff

    %% Estilos - Serviços Externos (Cores de Marca)
    style SlackAPI fill:#4A154B,color:#fff
    style Downdetector fill:#dc2626,color:#fff
```

</details>

---

## Robustez em produção

<details>
<summary>Clique para entender as escolhas de resiliência</summary>

O bot foi projetado pra rodar 24/7, e várias decisões de design refletem isso:

## Fechamento do browser com rede de segurança

```ts
// src/services/downdetectorService.ts
export async function forceCloseBrowser(
    browser?: Browser,
    timeoutMs: number = 3000
) {
    // 1. Tenta close() normal com timeout de 3s via Promise.race
    // 2. Se fechou limpo → retorna sem logar nada
    // 3. Se travou → tree-kill encerra a árvore inteira de processos (pai + filhos)
}
```

**Por que [`tree-kill`](https://github.com/pkrumins/node-tree-kill) ?**

O Firefox spawna múltiplos processos filhos (GPU, Socket, Utility, content). Um `proc.kill("SIGKILL")` só mata o pai, deixando os filhos órfãos consumindo memória. O `tree-kill` garante que toda a família morra junta.

**Por que não forçar sempre?**
O `close()` normal é mais barato e deixa o Firefox limpar seus próprios arquivos temporários. O `tree-kill` é reservado pros casos em que o browser trava.

## Init próprio [`tini`](https://github.com/krallin/tini) como PID 1

Sem um init real, o Node se torna PID 1 dentro do container, e o Node não faz reap de processos zumbis nem encaminha sinais corretamente. Com [`tini`](https://github.com/krallin/tini) :

* Processos filhos que morrem são reapados imediatamente (sem virar zumbi)
* `SIGTERM`/`SIGINT` chegam direto no Node
* Shutdown limpo no deploy

## Validação fail-fast de env vars

```ts
// src/config/env.ts
const requiredEnv = [
    "SLACK_SIGNING_SECRET",
    "SLACK_BOT_TOKEN",
    "CHANNEL_ID",
    "USER_ID",
    "PORT"
];

const missingEnv = requiredEnv.filter(name => !process.env[name]);

if (missingEnv.length > 0) {
    throw new Error(
        `variáveis não encontradas no .env: ${missingEnv.join(", ")}`
    );
}
```

Se qualquer variável obrigatória estiver faltando, o container morre em ~500ms com uma mensagem clara, muito melhor que descobrir 3 horas depois que o bot está rodando mas não consegue mandar alertas.

## Alertas de erro em dois canais

O [`errorMonitor`](src/slack/errorMonitor):

- [**Ephemeral:**](https://docs.slack.dev/reference/methods/chat.postEphemeral/) aparece só pra você, no desktop 
- [**DM direta:**](https://docs.slack.dev/reference/methods/chat.postMessage/#app_home) aparece em qualquer cliente (incluindo mobile)

Assim você nunca perde um alerta de erro interno, independente do dispositivo que estiver usando.

</details>


## Como os alertas funcionam

<details>
<summary>Clique para entender</summary>

Cada serviço tem seu próprio monitor de incidente que acompanha as mudanças de status:

| Status no Downdetector | O que significa | Ação no Slack | Valor no Grafana |
|------------------------|-----------------|---------------|-------------------|
| 🟢 **Success** | Relatos dos usuários **não indicam problemas** com o serviço | Nenhuma ação (estado normal) | `0` |
| 🟡 **Warning** | Relatos mostram **possíveis problemas** com o serviço | ⚠️ Apenas logado (sem alerta) | `1` |
| 🔴 **Danger** | Relatos mostram **problemas confirmados** com o serviço | ☠️ **Alerta Crítico** enviado imediatamente | `2` |

</details>

## Exemplos visuais dos status no Downdetector

<details>
<summary>Clique para ver como cada status aparece no Downdetector</summary>

#### 🟢 Success → Serviço operando normalmente
![Status Success](.github/assets/pt-BR/dd-success.png)

*"Os relatos dos usuários não indicam problemas atuais com o WhatsApp."*

#### 🟡 Warning → Possíveis problemas detectados
![Status Warning](.github/assets/pt-BR/dd-warning.png)

*"Relatos de usuários mostram possíveis problemas com WhatsApp."*

#### 🔴 Danger → Problemas confirmados
![Status Danger](.github/assets/pt-BR/dd-danger.png)

*"Relatos de usuários mostram problemas com WhatsApp."*

</details>

## Exemplos de notificações no Slack

<details>
<summary>Clique para ver como os alertas aparecem no Slack</summary>

#### ☠️ Alerta Crítico (quando o serviço entra em `danger`)
![Exemplo de Alerta Crítico](.github/assets/pt-BR/alert-critical.png)

#### 🎉 Alerta de Resolução (quando o serviço volta pra `success`)
![Exemplo de Resolução](.github/assets/pt-BR/alert-resolved.png)

</details>

---

## Configuração

## Pré-requisitos
- Node.js 20+
- App do Slack com Bot Token ([crie um aqui](https://api.slack.com/apps))
- Docker (roda o mesmo ambiente com Xvfb, além de Prometheus e Grafana)

## Instalação

<details>
<summary>Clique para expandir as instruções de setup</summary>

1. **Clone o repositório**
```bash
git clone https://github.com/eduardotashiro/downdetector-slack.git
cd downdetector-slack
```

2. **Instale as dependências** (isso também baixa o binário do Camoufox, via `postinstall`)
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
cp .env.example .env
```
Depois, edite o arquivo `.env`:

```env
# Configuração do Slack
SLACK_BOT_TOKEN=xoxb-seu-bot-token-aqui
SLACK_SIGNING_SECRET=seu-signing-secret-aqui
CHANNEL_ID=id-do-seu-canal-do-slack
USER_ID=id-do-seu-usuario-para-alertas-de-erro

# Servidor
PORT=3000
```

4. **Compile o projeto**
```bash
npm run build
```

5. **Inicie o bot**
```bash
npm start
```

</details>

## Slack App Manifest (Recomendado)
<details>
<summary>Clique para expandir as instruções</summary>

1. Acesse https://api.slack.com/apps
2. Clique em **Create New App**
3. Escolha **From an app manifest**
4. Selecione seu workspace
5. Cole o conteúdo do arquivo [`manifest.json`](src/slack/manifest.json)
6. Instale o app no seu workspace
7. Copie o Bot Token e o Signing Secret pro seu `.env`

</details>

## Deploy com Docker

<details>
<summary>Clique para expandir as instruções de Docker</summary>

O Camoufox roda em modo **headed** (não headless) aqui, pois passa pelo Cloudflare de forma bem mais confiável. Como não tem monitor físico, a imagem Docker roda ele dentro de um display virtual (Xvfb).

**Só o bot (build e execução local):**
```bash
docker build -t downdetector-slack .
docker run --rm -it --env-file .env downdetector-slack
```

**Stack completa local (bot + Prometheus + Grafana) via Docker Compose:**
```bash
docker compose up --build
```
Isso sobe três containers na mesma rede (`monitoring`):
- `bot` → expõe `:3000` (inclui `/metrics`)
- `prometheus` → `:9090`, faz scrape do bot a cada 15s
- `grafana` → `:3001`, já vem com o datasource e o dashboard provisionados automaticamente login padrão `admin` / `admin`, definido em [docker-compose.yml](docker-compose.yml)

Não precisa mapear porta do bot em produção, pois ele nunca recebe tráfego HTTP externo além do scrape do Prometheus (`/metrics`) e das requisições de saída pro Downdetector e pro Slack.

**Deploy no Railway (3 serviços a partir do mesmo repositório):**

O projeto usa três Dockerfiles separados para permitir o deploy independente de cada peça no Railway:

| Serviço | Dockerfile | Observações |
|---------|-----------|--------------|
| **bot** | `Dockerfile` | Roda o scraper, o Slack e expõe `/metrics` |
| **prometheus** | `Dockerfile.prometheus` | Usa `grafana/prometheus/prometheus.railway.yml`, aponta pro hostname interno `bot.railway.internal:3000` |
| **grafana** | `Dockerfile.grafana` | Usa `grafana/railway/prometheus-datasource.yml`, aponta pro hostname interno `prometheus.railway.internal:9090` |

Passos:
1. Suba seu código pro GitHub
2. No Railway, crie **três serviços** a partir do mesmo repositório, cada um apontando pro respectivo Dockerfile (em *Settings → Build → Dockerfile Path*)
3. No serviço **bot**, adicione as variáveis de ambiente:
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `CHANNEL_ID`
   - `USER_ID`
   - `PORT`
4. Mantenha o serviço **bot** em **1 réplica**, rodar mais de uma significa alertas duplicados pro mesmo incidente
5. Como os três serviços estão no mesmo projeto Railway, eles se enxergam pela rede interna (`*.railway.internal`) sem precisar expor portas publicamente — exceto o Grafana, que você pode tornar público em *Settings → Networking* pra acessar o dashboard
6. O Railway faz deploy automático a cada push na `main`, em todos os serviços configurados

</details>

---

## Uso

<details>
<summary>Clique para expandir exemplos de uso</summary>

**Modo Desenvolvimento:**
```bash
npm run dev
```
Roda com hot-reload usando `tsx watch`. No Linux sem display, envolva com `xvfb-run -a npm run dev`.

**Modo Produção:**
```bash
npm run build
npm start
```

**Agendamento do ciclo de monitoramento:**
```typescript
// src/jobs/monitoring.ts
// roda uma vez ao iniciar e se reagenda com um delay aleatório entre 2 e 4 minutos
```

O job também roda uma vez imediatamente ao subir, sem precisar esperar o primeiro ciclo.

⚠️ Um ciclo completo (8 serviços, incluindo retries) pode levar alguns minutos para terminar. O delay aleatório entre execuções ajuda a evitar padrões de tráfego previsíveis e dá tempo suficiente pro ciclo anterior terminar antes do próximo começar.

</details>

---

## Observabilidade

<details>
<summary>Clique para expandir/recolher</summary>

O bot expõe métricas no formato Prometheus e vem com um dashboard Grafana pronto, provisionado automaticamente — sem precisar configurar nada manualmente.

### Métrica exposta

O endpoint `GET /metrics` expõe a métrica `downdetector_service_status`, um `Gauge` por serviço, definido em [`src/metrics/prometheusClient.ts`](src/metrics/prometheusClient.ts):

```
# HELP downdetector_service_status Status do serviço monitorado pelo Downdetector: 0 = success, 1 = warning, 2 = danger
# TYPE downdetector_service_status gauge
downdetector_service_status{service="pix"} 0
downdetector_service_status{service="nubank"} 0
downdetector_service_status{service="banco_itau"} 2
```

O label `service` é gerado a partir do nome do serviço, normalizado (minúsculo, sem acento, espaços viram `_`) pela função `normalizeServiceName()`.

### Dashboard Grafana


![dashboard](.github/assets/grafana/dashboard.png)


O dashboard [`downdetector.json`](grafana/provisioning/dashboards/downdetector.json) é carregado automaticamente pelo provider configurado em [`dashboards.yml`](grafana/provisioning/dashboards/dashboards.yml), e mostra:
- Um painel `stat` por serviço, com cor verde/amarelo/vermelho de acordo com o status atual (`SUCCESS` / `WARNING` / `DANGER`)
- Um painel `timeseries` com o histórico de status de todos os serviços nas últimas horas

O datasource do Prometheus também é provisionado automaticamente:
- Localmente, via [`grafana/provisioning/datasources/prometheus.yml`](grafana/provisioning/datasources/prometheus.yml) (`http://prometheus:9090`)
- No Railway, via [`grafana/railway/prometheus-datasource.yml`](grafana/railway/prometheus-datasource.yml) (`http://prometheus.railway.internal:9090`)

### Rodando localmente

```bash
docker compose up --build
```
- Grafana: [http://localhost:3001](http://localhost:3001) (login `admin` / `admin`)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Métricas cruas do bot: [http://localhost:3000/metrics](http://localhost:3000/metrics)

</details>

---

## Testes

<details>
<summary>Clique para expandir o guia de testes</summary>

**Rodar os testes:**
```bash
npm test            # Roda os testes uma vez
npm run test:watch  # Modo watch
```

**Testar alertas no seu canal do Slack:**
Manda um alerta DANGER real seguido de uma resolução SUCCESS pro canal configurado no seu `.env`, sem mexer nos monitores de produção:
```bash
npm run test:alert
```

**Estrutura dos testes:**
```
src/slack/__tests__/
├── fixtures.ts                  # Dados mockados pros testes
└── incidentMonitor.spec.ts      # Testes do monitor de incidentes
```

</details>

---

## Contribuição

<details>
<summary>Clique para expandir o guia de contribuição</summary>

1. Faça um fork do repositório
2. Crie uma branch de feature
```bash
git checkout -b feature/minha-feature-incrivel
```
3. Faça commit das suas mudanças (use [Conventional Commits](https://www.conventionalcommits.org/))
```bash
git commit -m 'feat: adiciona feature incrível'
```
4. Suba pra branch
```bash
git push origin feature/minha-feature-incrivel
```
5. Abra um Pull Request

**Convenção de commits:** `feat`, `fix`, `docs`, `test`, `perf`, `refactor`, `chore`

**Antes de submeter o PR:**
```bash
npm test              # Roda os testes
npm run build         # Verifica se o build funciona
```

</details>

---

## Licença

Esse projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) pra detalhes.

---
---

# 🇨🇱 Español

## ¿Por qué existe este proyecto?

Este bot fue creado para **detectar inestabilidades** reportadas en **[Downdetector Brasil](https://downdetector.com.br/)** y notificar automáticamente a canales de **[Slack](https://slack.com/intl/es-la/)** sobre posibles problemas que afecten a servicios financieros brasileños.

La idea es permitir que los equipos técnicos **correlacionen incidentes externos con problemas internos**, como la apertura de tickets relacionados con un servicio determinado o sistemas que dependan de la disponibilidad de esos servicios.

Con esta información en tiempo real, es posible **identificar posibles causas externas, anticipar impactos y actuar antes de que una inestabilidad se convierta en un problema mayor**.

### El desafío

Downdetector está protegido por **Cloudflare Turnstile**, que bloquea el scraping automatizado desde IPs de datacenter (Railway, AWS, GCP). Las herramientas estándar (Playwright, Puppeteer) son detectadas a nivel JavaScript y bloqueadas.

### La solución

El proyecto utiliza **[Camoufox-js](https://github.com/apify/camoufox-js)**, un port en JS/TS del Camoufox original, que es un fork de Firefox orientado a reducir las señales de automatización del navegador. El navegador se ejecuta en modo **headed** (con interfaz gráfica) dentro de un display virtual (**Xvfb**), permitiendo que Firefox corra de forma invisible en un entorno de servidor.

### Agradecimientos y Créditos

Este proyecto fue construido utilizando la versión en JS/TS mantenida por **[Apify](https://github.com/apify)**. **[Camoufox-js](https://github.com/apify/camoufox-js)** es un port basado en el proyecto original **[Camoufox](https://github.com/daijro/camoufox)**, creado por **[daijro](https://github.com/daijro)**. 

Queremos agradecer a los desarrolladores por poner estas excelentes herramientas a disposición de la comunidad.

---

## Funcionalidades

- **Headed + Xvfb**: el navegador se ejecuta con interfaz gráfica en un display virtual, incluso dentro de un servidor, inicializado mediante [`xvfb.sh`](xvfb.sh)
- **Páginas aisladas**: cada servicio se verifica en su propio contexto (`newContext()` + `newPage()`), sin reutilización de cookies/caché entre ellos
- **Parsing PT-BR**: el estado se identifica a partir de los textos que muestra Downdetector en portugués
- **Adaptación de idioma**: el navegador envía `Accept-Language` priorizando el portugués de Brasil
- **Reintento automático**: una consulta que falla recibe un segundo intento utilizando la función `checkSingleService` en [`downdetectorService.ts`](src/services/downdetectorService.ts) antes de ser descartada
- **Ciclo continuo con retraso aleatorio**: el monitoreo se ejecuta una vez al iniciar y luego se reprograma continuamente, con un intervalo aleatorio entre ejecuciones
- **Alertas de error internos en dos canales**: si ningún servicio puede ser verificado en un ciclo, el bot dispara simultáneamente un mensaje efímero en el canal (visible solo para usted) **y** un DM directo (visible en cualquier cliente, incluido móvil), a través de [`src/slack/errorMonitor/`](src/slack/errorMonitor)
- **Validación fail-fast de variables de entorno**: el contenedor falla inmediatamente al iniciar si falta alguna variable obligatoria, evitando despliegues silenciosamente rotos
- **Cierre robusto del navegador**: `forceCloseBrowser()` intenta el cierre normal con timeout de 3s; si el navegador se bloquea, se usa [`tree-kill`](https://github.com/pkrumins/node-tree-kill) como red de seguridad para finalizar todo el árbol de procesos de Firefox, previniendo huérfanos
- **Init propio (tini)**: tini se usa como PID 1 en el contenedor para recolectar procesos zombies y el reenvío correcto de señales (SIGTERM/SIGINT)
- **Métricas Prometheus**: expone `/metrics` con el estado de cada servicio (`downdetector_service_status`), mediante `prom-client`
- **Dashboard Grafana**: panel provisionado automáticamente con el estado en tiempo real de todos los servicios monitoreados
- **Docker multi-stage + Railway**: compilación separada del runtime con solo lo mínimo necesario para ejecutar, con Dockerfiles independientes para el bot, Prometheus y Grafana
- **Pruebas**: pruebas unitarias con Vitest y script manual para probar alertas en Slack

---

## Servicios monitoreados

<details>
<summary>Haz clic para expandir</summary>

| Servicio | URL |
|---------|-----|
| **PIX** | [downdetector.com.br/fora-do-ar/pix/](https://downdetector.com.br/fora-do-ar/pix/) |
| **Itaú** | [downdetector.com.br/fora-do-ar/banco-itau/](https://downdetector.com.br/fora-do-ar/banco-itau/) |
| **Bradesco** | [downdetector.com.br/fora-do-ar/bradesco/](https://downdetector.com.br/fora-do-ar/bradesco/) |
| **Santander** | [downdetector.com.br/fora-do-ar/santander/](https://downdetector.com.br/fora-do-ar/santander/) |
| **Nubank** | [downdetector.com.br/fora-do-ar/nubank/](https://downdetector.com.br/fora-do-ar/nubank/) |
| **Banco do Brasil** | [downdetector.com.br/fora-do-ar/banco-do-brasil/](https://downdetector.com.br/fora-do-ar/banco-do-brasil/) |
| **Mercado Pago** | [downdetector.com.br/fora-do-ar/mercadopago/](https://downdetector.com.br/fora-do-ar/mercadopago/) |
| **PicPay** | [downdetector.com.br/fora-do-ar/picpay/](https://downdetector.com.br/fora-do-ar/picpay/) |

</details>

---

## Añadiendo nuevos servicios

<details>
<summary>Haz clic para expandir</summary>

El bot fue estructurado para que se puedan agregar nuevos servicios de Downdetector **sin modificar la lógica principal del scraper**. Solo se necesitan cambios en **2 archivos**, ya que los monitores de incidentes se crean dinámicamente a partir del enum:

#### 1. [types.ts](src/slack/types.ts) → registra el nombre y la URL del servicio

Agrega el servicio a los enums `ServiceName` y `ServiceURL`:

```typescript
export enum ServiceName {
    // ... servicios existentes ...
    CAIXA = "Caixa Econômica"
}

export enum ServiceURL {
    // ... URLs existentes ...
    CAIXA = "https://downdetector.com.br/fora-do-ar/caixa/"
}
```

#### 2. [downdetectorService.ts](src/services/downdetectorService.ts) → incluye el servicio en la lista de scraping

Agrega la entrada al array `SERVICES`:

```typescript
const SERVICES: ServicesList[] = [
    // ... servicios existentes ...
    {
        name: ServiceName.CAIXA,
        url: ServiceURL.CAIXA
    }
];
```

#### ¿Cómo se crean los monitores automáticamente?

En [notificationOrchestrator.ts](src/slack/notificationOrchestrator.ts), los monitores se instancian dinámicamente a partir del enum [ServiceName](src/slack/types.ts).

```typescript
const monitors = {} as Record<ServiceName, IncidentMonitor>;

for (const name of Object.values(ServiceName)) {
    monitors[name] = new IncidentMonitor(client, channel);
};
```

#### Para finalizar

Después del push (o reinicio del contenedor), el nuevo servicio pasa a monitorearse automáticamente en el próximo ciclo.

> 💡 **Tip:** no olvides actualizar también la tabla [Servicios monitoreados](#servicios-monitoreados) y, si quieres verlo en Grafana, agrega un nuevo panel `stat` en [downdetector.json](grafana/provisioning/dashboards/downdetector.json) apuntando a la etiqueta normalizada del servicio (ver [Observabilidad](#observabilidad)).

</details>

---

## Adaptando el proyecto a otro idioma

<details>
<summary>Haz clic para expandir</summary>

El parser de estado depende de los **textos que muestra** la página de Downdetector. Actualmente el proyecto prioriza `pt-BR` a través del header `Accept-Language`:

```typescript
// src/services/downdetectorService.ts
await page.setExtraHTTPHeaders({
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
});
```

Para adaptar el proyecto a otro idioma, hay que ajustar **dos puntos**:

#### 1. Cambiar el idioma enviado al sitio

En el archivo `src/services/downdetectorService.ts`, cambia el `Accept-Language` al idioma deseado:

```typescript
// Ejemplo: Chile
await page.setExtraHTTPHeaders({
    'Accept-Language': 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7'
});

// Ejemplo: EE. UU.
await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9'
});
```

#### 2. Adaptar las expresiones del parser

La función `detectStatus()` identifica el estado del servicio buscando frases específicas en el HTML de la página:

```typescript
// src/services/downdetectorService.ts
async function detectStatus(page: Page): Promise<ServiceStatus | null> {
    try {
        ...
        ...
        if (body.includes("não mostram problemas")) return "success";
         if (body.includes("possíveis problemas")) return "warning";
          if (body.includes("mostram problemas")) return "danger";
           return false
        ...
        ...
        ...
        }
}
```

Para otros idiomas, reemplaza las strings por sus equivalentes. Algunos ejemplos:

| Estado | PT-BR | EN-US | ES-CL |
|--------|-------|-------|-------|
| `SUCCESS` | `não mostram problemas` | `no current problems` | `no muestran problemas` |
| `WARNING` | `possíveis problemas` | `possible problems` | `posibles problemas` |
| `DANGER` | `mostram problemas` | `show problems with` | `muestran problemas` |

⚠️ **Atención:** ¡El orden de las comprobaciones importa! En PT-BR y ES-CL, la frase `SUCCESS` contiene la frase `DANGER` como subcadena (por ejemplo, `"show no problems"` contiene `"show problems"`). Por lo tanto, `SUCCESS` se comprueba **antes** de `DANGER` en el código. Si lo adaptas a otro idioma, comprueba si las frases en tu idioma tienen este mismo tipo de superposición antes de definir el orden de las sentencias `if`.

> 💡 **Tip de debug:** si el parser deja de reconocer un estado (Downdetector puede cambiar los textos con el tiempo), abre la página en tu navegador, inspecciona el texto mostrado y actualiza las expresiones de la función `detectStatus()` según sea necesario.

</details>

---

## Estructura del proyecto

<details>
<summary>Haz clic para expandir el árbol de archivos</summary>


```
├── .github/
│   ├── assets/
│   │   ├── es-CL/
│   │   │   ├── dd-danger.png
│   │   │   ├── dd-success.png
│   │   │   └── dd-warning.png
│   │   ├── grafana/
│   │   │   └── dashboard.png
│   │   ├── pt-BR/
│   │   │   ├── alert-critical.png
│   │   │   ├── alert-resolved.png
│   │   │   ├── dd-danger.png
│   │   │   ├── dd-success.png
│   │   │   └── dd-warning.png
│   │   └── banner.png
│   └── workflows/
│       └── ci.yaml
├── grafana/
│   ├── logos/
│   │   ├── bancodobrasil.png
│   │   ├── bradesco.png
│   │   ├── itau.png
│   │   ├── mercadopago.png
│   │   ├── nubank.png
│   │   ├── picpay.png
│   │   ├── pix.png
│   │   └── santander.png
│   ├── prometheus/
│   │   ├── prometheus.railway.yml
│   │   └── prometheus.yml
│   ├── provisioning/
│   │   ├── dashboards/
│   │   │   ├── dashboards.yml
│   │   │   └── downdetector.json
│   │   └── datasources/
│   │       └── prometheus.yml
│   └── railway/
│       └── prometheus-datasource.yml
├── src/
│   ├── config/
│   │   └── env.ts                          # Validación fail-fast de env vars
│   ├── jobs/
│   │   └── monitoring.ts                   # Loop de programación
│   ├── metrics/
│   │   └── prometheusClient.ts             # Gauge por servicio
│   ├── scripts/
│   │   └── testAlert.ts                    # Disparar alerta manual
│   ├── services/
│   │   └── downdetectorService.ts          # Scraper + forceCloseBrowser
│   ├── slack/
│   │   ├── __tests__/
│   │   │   ├── fixtures.ts
│   │   │   └── incidentMonitor.spec.ts
│   │   ├── errorMonitor/                   # Alertas de error del propio bot
│   │   │   ├── directMessageService.ts     # Envía DM
│   │   │   ├── dmAlert.ts                  # Instancia exportada del DM
│   │   │   ├── ephemeralAlert.ts           # Instancia exportada del ephemeral
│   │   │   └── ephemeralMessageService.ts  # Envía ephemeral
│   │   ├── incidentMonitor.ts              # Gestiona el estado de incidentes
│   │   ├── manifest.json                   # Slack App Manifest
│   │   ├── notificationOrchestrator.ts     # Crea monitores dinámicamente
│   │   └── types.ts                        # Enums de servicio/URL/estado
│   ├── app.ts                              # Config Slack 
│   └── server.ts                           # Entry point
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile                              # Build multi-stage con tini
├── Dockerfile.grafana
├── Dockerfile.prometheus
├── LICENSE
├── README.md
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── xvfb.sh                                 # Script de inicialización de Xvfb
```
</details>

## Arquitectura

<details>
<summary>Haz clic para expandir/colapsar el diagrama</summary>

### Flujo del sistema

```mermaid
graph TB
    Start([Ciclo continuo<br/>~2-3min]) --> Server[server.ts<br/>Punto de entrada]
    Server --> Job[Monitoring Job]
    Job --> Orchestrator[notificationOrchestrator.ts<br/>Función CheckAll]

    Orchestrator --> Scraper[downdetectorService.ts<br/>Scraper]

    Scraper --> Browser{Camoufox Browser<br/>Firefox headed}
    Browser --> Xvfb[Xvfb<br/>Display Virtual]
    Browser --> DD[https://downdetector.com.br]

    DD --> Data{Extracción de Estado<br/>Parsing PT-BR}
    Data --> Results["Resultados<br/>ServicesResult[]"]
    Results --> Orchestrator

    Orchestrator --> Incident[Monitores de Incidentes<br/>]
    Orchestrator --> ErrorMon{¿Hay resultados?}
    Orchestrator --> Metrics[prom-client]

    Incident --> Slack1[Slack<br/>Alerta Crítica]
    Incident --> Slack2[Slack<br/>Resolución]

    ErrorMon -- "Ningún servicio" --> DM[DM]
    ErrorMon -- "Ningún servicio" --> Ephemeral[Ephemeral]

    Metrics --> Endpoint["/metrics<br/>Endpoint Express"]
    Endpoint --> Prom[(Prometheus<br/>scrape 15s)]
    Prom --> Grafana[(Grafana<br/>Dashboard público)]

    Slack1 --> End([Equipo Notificado])
    Slack2 --> End
    DM --> Dev([Dev Notificado])
    Ephemeral --> Dev

    %% Estilos - Inicio y Fin (Verde)
    style Start fill:#059669,color:#fff
    style End fill:#059669,color:#fff
    style Dev fill:#059669,color:#fff

    %% Estilos - Core/Backend (Azul Oscuro/Slate)
    style Server fill:#1e293b,color:#fff
    style Job fill:#1e293b,color:#fff
    style Orchestrator fill:#1e293b,color:#fff
    style Scraper fill:#1e293b,color:#fff
    style Incident fill:#1e293b,color:#fff
    style Endpoint fill:#1e293b,color:#fff

    %% Estilos - Scraping y Browser (Morado)
    style Browser fill:#8b5cf6,color:#fff
    style Xvfb fill:#8b5cf6,color:#fff
    style DD fill:#8b5cf6,color:#fff
    style Data fill:#8b5cf6,color:#fff
    style Results fill:#8b5cf6,color:#fff

    %% Estilos - Condición de Error (Rojo)
    style ErrorMon fill:#e11d48,color:#fff

    %% Estilos - Observabilidad (Naranja)
    style Metrics fill:#ea580c,color:#fff
    style Prom fill:#ea580c,color:#fff
    style Grafana fill:#ea580c,color:#fff

    %% Estilos - Slack (Berenjena - Mantenido)
    style Slack1 fill:#4A154B,color:#fff
    style Slack2 fill:#4A154B,color:#fff
    style DM fill:#4A154B,color:#fff
    style Ephemeral fill:#4A154B,color:#fff
```

### Diagrama de componentes

```mermaid
graph LR
    subgraph "Capa de Aplicación"
        Server[server.ts<br/>Punto de entrada]
        App[app.ts<br/>Config Slack + Express]
        Job[jobs/monitoring.ts<br/>]
        EnvCfg[config/env.ts<br/>Validación fail-fast]
    end

    subgraph "Capa de Orquestación"
        Orchestrator[notificationOrchestrator.ts<br/>Crea monitores vía enum]
        Incident[incidentMonitor.ts<br/>Gestiona estado de los incidentes]
        ErrorMon["errorMonitor/<br/>DM + Mensaje Efímero"]
    end

    subgraph "Capa de Recolección (Scraping)"
        Scraper[downdetectorService.ts<br/>Camoufox<br/> + Playwright + tree-kill]
    end

    subgraph "Observabilidad"
        Metrics[prometheusClient.ts<br/>Gauge por servicio]
        PromSvc[(Prometheus<br/>Contenedor aislado)]
        GrafanaSvc[(Grafana<br/>Contenedor aislado)]
    end

    subgraph "Infraestructura"
        Tini[tini<br/>PID 1 + reap de zombis]
        Xvfb[Xvfb<br/>Display virtual]
    end

    subgraph "Servicios Externos"
        Downdetector[(Downdetector.com.br)]
        SlackAPI[(Slack API)]
        Camoufox[(Camoufox Browser)]
    end

    %% Flujos de la Aplicación
    EnvCfg --> Server
    Server --> Job
    Server --> App
    Job --> Orchestrator

    %% Flujos de Orquestación
    Orchestrator --> Scraper
    Orchestrator --> Incident
    Orchestrator --> ErrorMon
    Orchestrator --> Metrics

    %% Flujos de Scraping
    Scraper --> Camoufox
    Camoufox --> Downdetector

    %% Notificaciones
    Incident --> SlackAPI
    ErrorMon --> SlackAPI

    %% Flujos de Observabilidad
    App -- "/metrics" --> Metrics
    PromSvc -- "scrape :3000/metrics" --> App
    GrafanaSvc -- "PromQL" --> PromSvc

    %% Flujos de Infraestructura
    Tini --> Server
    Tini --> Xvfb
    Xvfb --> Camoufox

    %% Estilos - Backend (Azul Oscuro/Slate)
    style Server fill:#1e293b,color:#fff
    style App fill:#1e293b,color:#fff
    style Job fill:#1e293b,color:#fff
    style EnvCfg fill:#1e293b,color:#fff
    style Orchestrator fill:#1e293b,color:#fff
    style Incident fill:#1e293b,color:#fff
    style ErrorMon fill:#1e293b,color:#fff

    %% Estilos - Recolección y Browser (Morado)
    style Scraper fill:#8b5cf6,color:#fff
    style Camoufox fill:#8b5cf6,color:#fff

    %% Estilos - Observabilidad (Naranja)
    style Metrics fill:#ea580c,color:#fff
    style PromSvc fill:#ea580c,color:#fff
    style GrafanaSvc fill:#ea580c,color:#fff

    %% Estilos - Infraestructura (Teal/Verde azulado)
    style Tini fill:#0f766e,color:#fff
    style Xvfb fill:#0f766e,color:#fff

    %% Estilos - Servicios Externos (Colores de Marca)
    style SlackAPI fill:#4A154B,color:#fff
    style Downdetector fill:#dc2626,color:#fff
```

</details>

---

# Robustez en producción

<details>

<summary>Haz clic para entender las decisiones de resiliencia</summary>

El bot fue diseñado para ejecutarse 24/7, y varias decisiones de diseño reflejan esto:

## Cierre del browser con red de seguridad

```ts
// src/services/downdetectorService.ts

export async function forceCloseBrowser(
    browser?: Browser,
    timeoutMs: number = 3000
) {
    // 1. Intenta close() normal con timeout de 3s mediante Promise.race
    // 2. Si se cerró correctamente → retorna sin registrar nada
    // 3. Si se bloqueó → tree-kill termina todo el árbol de procesos (padre + hijos)
}
```

**¿Por qué [`tree-kill`](https://github.com/pkrumins/node-tree-kill)?**

Firefox genera múltiples procesos hijos (GPU, Socket, Utility, content). Un `proc.kill("SIGKILL")` solo mata al proceso padre, dejando los procesos hijos huérfanos y consumiendo memoria. `tree-kill` garantiza que toda la familia de procesos termine junta.

**¿Por qué no forzarlo siempre?**

El `close()` normal es más económico y permite que Firefox limpie sus propios archivos temporales. `tree-kill` se reserva para los casos en los que el browser se bloquea.

## Init propio [`tini`](https://github.com/krallin/tini) como PID 1

Sin un init real, Node se convierte en PID 1 dentro del contenedor, y Node no realiza el reap de procesos zombie ni reenvía las señales correctamente. Con [`tini`](https://github.com/krallin/tini):

- Los procesos hijos que terminan son reapados inmediatamente (sin convertirse en zombies)
- `SIGTERM`/`SIGINT` llegan directamente a Node
- Shutdown limpio durante el deploy

## Validación fail-fast de env vars

```ts
// src/config/env.ts

const requiredEnv = [
    "SLACK_SIGNING_SECRET",
    "SLACK_BOT_TOKEN",
    "CHANNEL_ID",
    "USER_ID",
    "PORT"
];

const missingEnv = requiredEnv.filter(name => !process.env[name]);

if (missingEnv.length > 0) {
    throw new Error(
        `variables no encontradas en .env: ${missingEnv.join(", ")}`
    );
}
```

Si falta alguna variable obligatoria, el contenedor se detiene en ~500 ms con un mensaje claro, mucho mejor que descubrir 3 horas después que el bot está ejecutándose pero no puede enviar alertas.

## Alertas de error en dos canales

El [`errorMonitor`](src/slack/errorMonitor):

- [**Ephemeral:**](https://docs.slack.dev/reference/methods/chat.postEphemeral/) aparece solo para ti, en el desktop 
- [**DM direta:**](https://docs.slack.dev/reference/methods/chat.postMessage/#app_home) aparece en cualquier cliente (incluido el mobile)

De esta forma, nunca pierdes una alerta de error interno, independientemente del dispositivo que estés utilizando.

</details>

## Cómo funcionan las alertas

<details>
<summary>Haz clic para entender</summary>

Cada servicio tiene su propio monitor de incidentes que rastrea los cambios de estado:

| Estado en Downdetector | Qué significa | Acción en Slack | Valor en Grafana |
|------------------------|-----------------|---------------|--------------------|
| 🟢 **Success** | Los reportes de usuarios **no indican problemas** con el servicio | Ninguna acción (estado normal) | `0` |
| 🟡 **Warning** | Los reportes muestran **posibles problemas** con el servicio | ⚠️ Solo se registra en el log (sin alerta) | `1` |
| 🔴 **Danger** | Los reportes muestran **problemas confirmados** con el servicio | ☠️ **Alerta Crítica** enviada de inmediato | `2` |

</details>

## Ejemplos visuales de los estados en Downdetector

<details>
<summary>Haz clic para ver cómo aparece cada estado en Downdetector</summary>

#### 🟢 Success → Servicio funcionando con normalidad
![Estado Success](.github/assets/es-CL/dd-success.png)

#### 🟡 Warning → Posibles problemas detectados
![Estado Warning](.github/assets/es-CL/dd-warning.png)

#### 🔴 Danger → Problemas confirmados
![Estado Danger](.github/assets/es-CL/dd-danger.png)

</details>

## Ejemplos de notificaciones en Slack

<details>
<summary>Haz clic para ver cómo aparecen las alertas en Slack</summary>

> ℹ️ Las alertas del bot siempre se envían **en portugués**, sin importar el idioma de este README, el texto está fijo en [incidentMonitor.ts](src/slack/incidentMonitor.ts).

#### ☠️ Alerta Crítica (cuando el servicio entra en `danger`)
![Ejemplo de Alerta Crítica](.github/assets/pt-BR/alert-critical.png)

#### 🎉 Alerta de Resolución (cuando el servicio vuelve a `success`)
![Ejemplo de Resolución](.github/assets/pt-BR/alert-resolved.png)

</details>

---

## Configuración

### Requisitos previos
- Node.js 20+
- App de Slack con Bot Token ([créala aquí](https://api.slack.com/apps))
- Docker (ejecuta el mismo entorno con Xvfb, además de Prometheus y Grafana)

## Instalación

<details>
<summary>Haz clic para expandir las instrucciones de instalación</summary>

1. **Clona el repositorio**
```bash
git clone https://github.com/eduardotashiro/downdetector-slack.git
cd downdetector-slack
```

2. **Instala las dependencias** (esto también descarga el binario de Camoufox, vía `postinstall`)
```bash
npm install
```

3. **Configura las variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
cp .env.example .env
```
Luego, edita el archivo `.env`:

```env
# Configuración de Slack
SLACK_BOT_TOKEN=xoxb-tu-bot-token-aqui
SLACK_SIGNING_SECRET=tu-signing-secret-aqui
CHANNEL_ID=id-de-tu-canal-de-slack
USER_ID=id-de-tu-usuario-para-alertas-de-error

# Servidor
PORT=3000
```

4. **Compila el proyecto**
```bash
npm run build
```

5. **Inicia el bot**
```bash
npm start
```

</details>

## Slack App Manifest (Recomendado)
<details>
<summary>Haz clic para expandir las instrucciones</summary>

1. Ve a https://api.slack.com/apps
2. Haz clic en **Create New App**
3. Elige **From an app manifest**
4. Selecciona tu workspace
5. Pega el contenido del archivo [`manifest.json`](src/slack/manifest.json)
6. Instala la app en tu workspace
7. Copia el Bot Token y el Signing Secret a tu `.env`

</details>

## Despliegue con Docker

<details>
<summary>Haz clic para expandir las instrucciones de Docker</summary>

Camoufox se ejecuta en modo **headed** (no headless) aquí, porque pasa Cloudflare de forma mucho más confiable. Como no hay pantalla física, la imagen de Docker lo ejecuta dentro de un display virtual (Xvfb).

**Solo el bot (build y ejecución local):**
```bash
docker build -t downdetector-slack .
docker run --rm -it --env-file .env downdetector-slack
```

**Stack completo local (bot + Prometheus + Grafana) vía Docker Compose:**
```bash
docker compose up --build
```
Esto levanta tres contenedores en la misma red (`monitoring`):
- `bot` → expone `:3000` (incluye `/metrics`)
- `prometheus` → `:9090`, hace scrape del bot cada 15s
- `grafana` → `:3001`, ya viene con el datasource y el dashboard provisionados automáticamente login por defecto `admin` / `admin`, definido en `[docker-compose.yml](docker-compose.yml)

No hace falta mapear el puerto del bot en producción, pues nunca recibe tráfico HTTP externo salvo el scrape de Prometheus (`/metrics`) y las peticiones salientes a Downdetector y a Slack.

**Despliegue en Railway (3 servicios desde el mismo repositorio):**

El proyecto usa tres Dockerfiles separados para permitir el despliegue independiente de cada pieza en Railway:

| Servicio | Dockerfile | Notas |
|---------|-----------|--------------|
| **bot** | `Dockerfile` | Corre el scraper, Slack y expone `/metrics` |
| **prometheus** | `Dockerfile.prometheus` | Usa `grafana/prometheus/prometheus.railway.yml`, apunta al hostname interno `bot.railway.internal:3000` |
| **grafana** | `Dockerfile.grafana` | Usa `grafana/railway/prometheus-datasource.yml`, apunta al hostname interno `prometheus.railway.internal:9090` |

Pasos:
1. Sube tu código a GitHub
2. En Railway, crea **tres servicios** desde el mismo repositorio, cada uno apuntando a su respectivo Dockerfile (en *Settings → Build → Dockerfile Path*)
3. En el servicio **bot**, agrega las variables de entorno:
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `CHANNEL_ID`
   - `USER_ID`
   - `PORT`
4. Mantén el servicio **bot** en **1 réplica**, pues ejecutar más de una significa alertas duplicadas para el mismo incidente
5. Como los tres servicios están en el mismo proyecto de Railway, se comunican por la red interna (`*.railway.internal`) sin necesidad de exponer puertos públicamente — excepto Grafana, que puedes hacer público en *Settings → Networking* para acceder al dashboard
6. Railway despliega automáticamente en cada push a `main`, en todos los servicios configurados

</details>

---

## Modo de Uso

<details>
<summary>Haz clic para expandir ejemplos de uso</summary>

**Modo Desarrollo:**
```bash
npm run dev
```
Se ejecuta con hot-reload usando `tsx watch`. En Linux sin pantalla, envuélvelo con `xvfb-run -a npm run dev`.

**Modo Producción:**
```bash
npm run build
npm start
```

**Programación del ciclo de monitoreo:**
```typescript
// src/jobs/monitoring.ts
// corre una vez al iniciar y se reprograma con un retraso aleatorio de entre 2 y 4 minutos
```

El job también corre una vez inmediatamente al iniciar, sin necesidad de esperar el primer ciclo.

⚠️ Un ciclo completo (8 servicios, incluyendo los reintentos) puede tardar varios minutos en finalizar. El retraso aleatorio entre ejecuciones ayuda a evitar patrones de tráfico predecibles y da tiempo suficiente para que el ciclo anterior termine antes de que comience el siguiente.

</details>

---

## Observabilidad

<details>
<summary>Haz clic para expandir/colapsar</summary>

El bot expone métricas en formato Prometheus y viene con un dashboard de Grafana listo, provisionado automáticamente — sin necesidad de configurar nada manualmente.

### Métrica expuesta

El endpoint `GET /metrics` expone la métrica `downdetector_service_status`, un `Gauge` por servicio, definido en [`src/metrics/prometheusClient.ts`](src/metrics/prometheusClient.ts):

```
# HELP downdetector_service_status Status do serviço monitorado pelo Downdetector: 0 = success, 1 = warning, 2 = danger
# TYPE downdetector_service_status gauge
downdetector_service_status{service="pix"} 0
downdetector_service_status{service="nubank"} 0
downdetector_service_status{service="banco_itau"} 2
```

La etiqueta `service` se genera a partir del nombre del servicio, normalizado (minúsculas, sin acentos, espacios convertidos en `_`) mediante la función `normalizeServiceName()`.

### Dashboard de Grafana

![dashboard](.github/assets/grafana/dashboard.png)

El dashboard [`downdetector.json`](grafana/provisioning/dashboards/downdetector.json) se carga automáticamente mediante el provider configurado en [`dashboards.yml`](grafana/provisioning/dashboards/dashboards.yml), y muestra:
- Un panel `stat` por servicio, con color verde/amarillo/rojo según el estado actual (`SUCCESS` / `WARNING` / `DANGER`)
- Un panel `timeseries` con el historial de estados de todos los servicios en las últimas horas

El datasource de Prometheus también se provisiona automáticamente:
- Localmente, vía [`grafana/provisioning/datasources/prometheus.yml`](grafana/provisioning/datasources/prometheus.yml) (`http://prometheus:9090`)
- En Railway, vía [`grafana/railway/prometheus-datasource.yml`](grafana/railway/prometheus-datasource.yml) (`http://prometheus.railway.internal:9090`)

### Corriendo localmente

```bash
docker compose up --build
```
- Grafana: [http://localhost:3001](http://localhost:3001) (login `admin` / `admin`)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Métricas crudas del bot: [http://localhost:3000/metrics](http://localhost:3000/metrics)


</details>

---

## Pruebas

<details>
<summary>Haz clic para expandir la guía de pruebas</summary>

**Ejecutar las pruebas:**
```bash
npm test            # Ejecuta las pruebas una vez
npm run test:watch  # Modo watch
```

**Probar alertas en tu canal de Slack:**
Envía una alerta DANGER real seguida de una resolución SUCCESS al canal configurado en tu `.env`, sin tocar los monitores de producción:
```bash
npm run test:alert
```

**Estructura de las pruebas:**
```
src/slack/__tests__/
├── fixtures.ts                  # Datos simulados para las pruebas
└── incidentMonitor.spec.ts      # Pruebas del monitor de incidentes
```

</details>

---

## Contribución

<details>
<summary>Haz clic para expandir la guía de contribución</summary>

1. Haz un fork del repositorio
2. Crea una rama de feature
```bash
git checkout -b feature/mi-feature-increible
```
3. Haz commit de tus cambios (usa [Conventional Commits](https://www.conventionalcommits.org/))
```bash
git commit -m 'feat: agrega feature increíble'
```
4. Sube la rama
```bash
git push origin feature/mi-feature-increible
```
5. Abre un Pull Request

**Convención de commits:** `feat`, `fix`, `docs`, `test`, `perf`, `refactor`, `chore`

**Antes de enviar el PR:**
```bash
npm test              # Ejecuta las pruebas
npm run build         # Verifica que el build funcione
```

</details>

---

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">

**Made with 💀 by [Eduardo Tashiro](https://www.linkedin.com/in/eduardo-tashiro-192096362/)**

⭐ **Star this repo if you find it useful!**

[![GitHub stars](https://img.shields.io/github/stars/eduardotashiro/downdetector-slack?style=social)](https://github.com/eduardotashiro/downdetector-slack/stargazers)

</div>