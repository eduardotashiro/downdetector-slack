<div align="center">

![DownDetector Banner](.github/assets/banner.png)

</div>

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Slack Bot](https://img.shields.io/badge/Slack-Bot-4A154B?logo=slack&logoColor=white)](https://docs.slack.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.60-45ba4b?logo=playwright)](https://playwright.dev/)
[![Camoufox](https://img.shields.io/badge/Camoufox-AntiDetection-FF6B35?logo=firefox)](https://camoufox.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.0-6E9F18?logo=vitest)](https://vitest.dev/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway)](https://railway.app/)

**[🇧🇷 Português](#-português)**

[Configuração](#configuração) • [Uso](#uso) • [Testes](#testes) • [Contribuição](#contribuição)

**Monitoramento automatizado em tempo real de serviços financeiros brasileiros usando Downdetector**

**[🇨🇱 Español](#-español)**

[Configuración](#configuración) • [Modo de Uso](#modo-de-uso) • [Pruebas](#pruebas) • [Contribución](#contribución)

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

**[Camoufox](https://camoufox.com/)**, um fork do Firefox voltado à redução de sinais de automação do navegador. O navegador é executado em modo **headed** (com interface gráfica) dentro de um display virtual (**Xvfb**), permitindo que o Firefox rode em um ambiente de servidor sem monitor físico.

---

## Funcionalidades

- **Camoufox + Playwright**: navegador baseado em Firefox com ajustes de fingerprint para o ambiente de automação
- **Headed + Xvfb**: o navegador roda com interface gráfica em um display virtual, mesmo dentro de um servidor
- **Espera pelo Turnstile**: quando o desafio do Cloudflare aparece, o bot aguarda ele ser resolvido antes de continuar a extração (sem clique automático no checkbox)
- **Páginas isoladas**: cada serviço é verificado em sua própria página (`newPage()`), sem reaproveitamento de cookies de sessão entre eles
- **Parsing PT-BR**: o status é identificado a partir dos textos exibidos pelo Downdetector em português, com fallback para algumas expressões em inglês
- **Adaptação de idioma**: o navegador envia `Accept-Language` priorizando português do Brasil
- **Retry automático**: uma consulta que falha recebe uma segunda tentativa antes de ser descartada
- **Cron a cada 4 minutos**: o monitoramento executa uma vez ao iniciar e depois continuamente
- **Docker + Railway**: execução containerizada com Xvfb
- **Testes**: testes unitários com Vitest e script manual para testar alertas no Slack

> 🔭 **Roadmap**: observabilidade com **Prometheus + Grafana** (métricas de uptime por serviço, tempo de resposta do scraper, histórico de incidentes), ainda não implementado.

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

O bot foi estruturado para que novos serviços do Downdetector possam ser adicionados **sem alterar a lógica principal do scraper**. São necessárias mudanças em apenas **3 arquivos**:

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

#### 3. [notificationOrchestrator.ts](src/slack/notificationOrchestrator.ts) → cria o monitor do serviço

Cada serviço precisa de sua **própria instância** de `IncidentMonitor` para rastrear incidentes de forma independente:

```typescript
const caixaMonitor = new IncidentMonitor(client, channel);

const monitors: Record<ServiceName, IncidentMonitor> = {
    // ... monitores existentes ...
    [ServiceName.CAIXA]: caixaMonitor
};
```

#### Finalizando

Depois das alterações, rode os testes e faça o deploy normalmente:

```bash
npm test
npm run build
```

Após o push (ou reinício do container), o novo serviço passa a ser monitorado automaticamente no próximo ciclo do cron.

> 💡 **Dica:** não esqueça de atualizar também a tabela [Serviços monitorados](#serviços-monitorados) deste README para documentar o novo serviço pros próximos contribuidores.

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
async function detectStatus(page: Page): Promise<string | null> {
    const body = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");

    if (body.includes("não mostram problemas")) {
        return ServiceStatus.SUCCESS;
    }
    if (body.includes("possíveis problemas")) {
        return ServiceStatus.WARNING;
    }
    if (body.includes("mostram problemas")) {
        return ServiceStatus.DANGER;
    }
    return null;
}
```

Para outros idiomas, substitua as strings pelas equivalentes. Alguns exemplos:

| Status | PT-BR | EN-US | ES-CL |
|--------|-------|-------|-------|
| `SUCCESS` | `não mostram problemas` | `no current problems` | `no muestran problemas` |
| `WARNING` | `possíveis problemas` | `possible problems` | `posibles problemas` |
| `DANGER` | `mostram problemas` | `show problems with` | `muestran problemas` |

> ⚠️ **Atenção:** a ordem das verificações importa! A frase de `SUCCESS` contém a substring `"mostram problemas"`, que também aparece em `DANGER`. Por isso `SUCCESS` precisa ser verificado **antes** de `DANGER`, senão todo serviço OK seria classificado como em crise.

> 💡 **Dica de debug:** se o parser deixar de reconhecer um status (o Downdetector pode mudar os textos com o tempo), abra a página no seu navegador, inspecione o texto exibido e atualize as expressões da função `detectStatus()` conforme necessário.

</details>

---

## Arquitetura

<details open>
<summary>Clique para expandir/recolher diagrama</summary>

### Fluxo do sistema

```mermaid
graph TB
    Start([Cron Job<br/>4min]) --> Server[server.ts<br/>Entry Point]
    Server --> Job[Monitoring Job]
    Job --> Orchestrator[notificationOrchestrator.ts<br/>CheckAll Function]

    Orchestrator --> Scraper[downdetectorService.ts<br/>Scraper]

    Scraper --> Browser{Camoufox Browser<br/>Firefox headed}
    Browser --> Xvfb[Xvfb<br/>Display Virtual]
    Browser --> Turnstile[Cloudflare Turnstile<br/>Aguarda resolução]
    Browser --> DD[https://downdetector.com.br]

    DD --> Data{Extração de Status<br/>Parsing PT-BR}
    Data --> Results["Resultados<br/>ServicesResult[]"]
    Results --> Orchestrator

    Orchestrator --> Incident[Incident Monitors<br/>8 monitores individuais]

    Incident --> Slack1[Slack<br/>☠️ Alerta Crítico]
    Incident --> Slack2[Slack<br/>🎉 Resolução]

    Slack1 --> End([Time Notificado])
    Slack2 --> End

    style Start fill:#e1f5fe
    style Orchestrator fill:#fff9c4
    style Browser fill:#FF6B35,color:#fff
    style Xvfb fill:#9C27B0,color:#fff
    style Turnstile fill:#f59e0b,color:#fff
    style Incident fill:#e1bee7
    style Slack1 fill:#4A154B,color:#fff
    style Slack2 fill:#4A154B,color:#fff
    style End fill:#e8f5e9
```

### Diagrama de componentes

```mermaid
graph LR
    subgraph "Camada de Aplicação"
        Server[server.ts<br/>Entry Point]
        App[app.ts<br/>Config do Slack]
        Job[jobs/monitoring.ts<br/>Cron 4min]
    end

    subgraph "Camada de Orquestração"
        Orchestrator[notificationOrchestrator.ts<br/>Coordena scraping e notificações]
        Incident[incidentMonitor.ts<br/>Gerencia estado de incidentes]
    end

    subgraph "Camada de Dados"
        Scraper[downdetectorService.ts<br/>Camoufox + Playwright]
    end

    subgraph "Serviços Externos"
        Downdetector[(Downdetector.com.br)]
        SlackAPI[(Slack API)]
        Camoufox[(Camoufox Browser)]
    end

    Server --> Job
    Server --> App
    Job --> Orchestrator

    Orchestrator --> Scraper
    Orchestrator --> Incident

    Scraper --> Camoufox
    Camoufox --> Downdetector

    Incident --> SlackAPI

    style Server fill:#4CAF50,color:#fff
    style App fill:#4CAF50,color:#fff
    style Job fill:#4CAF50,color:#fff
    style Orchestrator fill:#FFD700,color:#000
    style Incident fill:#FFD700,color:#000
    style Scraper fill:#2196F3,color:#fff
    style Downdetector fill:#FF9800,color:#fff
    style SlackAPI fill:#4A154B,color:#fff
    style Camoufox fill:#9C27B0,color:#fff
```

</details>

---

## Como os alertas funcionam

<details>
<summary>Clique para entender</summary>

Cada serviço tem seu próprio monitor de incidente que acompanha as mudanças de status:

| Status no Downdetector | O que significa | Ação no Slack |
|------------------------|-----------------|---------------|
| 🟢 **Success** | Relatos dos usuários **não indicam problemas** com o serviço | Nenhuma ação (estado normal) |
| 🟡 **Warning** | Relatos mostram **possíveis problemas** com o serviço | ⚠️ Apenas logado (sem alerta) |
| 🔴 **Danger** | Relatos mostram **problemas confirmados** com o serviço | ☠️ **Alerta Crítico** enviado imediatamente |

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

### Pré-requisitos
- Node.js 20+
- App do Slack com Bot Token ([crie um aqui](https://api.slack.com/apps))
- Docker (roda o mesmo ambiente com Xvfb usado no Railway)

### Instalação

<details>
<summary>Clique para expandir as instruções de setup</summary>

1. **Clone o repositório**
```bash
git clone https://github.com/eduardotashiro/downdetector-slack.git
cd downdetector-slack
```

2. **Instale as dependências** (isso também baixa o binário do Camoufox)
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env`:
```env
# Configuração do Slack
SLACK_BOT_TOKEN=xoxb-seu-bot-token-aqui
SLACK_SIGNING_SECRET=seu-signing-secret-aqui
CHANNEL_ID=id-do-seu-canal-do-slack

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

### Slack App Manifest (Recomendado)
<details>
<summary>Clique para expandir as instruções</summary>

1. Acesse https://api.slack.com/apps
2. Clique em **Create New App**
3. Escolha **From an app manifest**
4. Selecione seu workspace
5. Cole o conteúdo do arquivo `/src/slack/manifest.json`
6. Instale o app no seu workspace
7. Copie o Bot Token e o Signing Secret pro seu `.env`

</details>

### Deploy com Docker

<details>
<summary>Clique para expandir as instruções de Docker</summary>

O Camoufox roda em modo **headed** (não headless) aqui, pois passa pelo Cloudflare de forma bem mais confiável. Como não tem monitor físico, a imagem Docker roda ele dentro de um display virtual (Xvfb).

**Build e execução local:**
```bash
docker build -t downdetector-slack .
docker run --rm -it --env-file .env downdetector-slack
```

Não precisa mapear porta pois o serviço nunca recebe tráfego HTTP de entrada, só faz requisições de saída pro Downdetector e pro Slack.

**Deploy no Railway:**
1. Suba seu código pro GitHub
2. Conecte o repositório ao Railway
3. Adicione as variáveis de ambiente no painel:
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `CHANNEL_ID`
   - `PORT`
4. Mantenha o serviço em **1 réplica**, rodar mais de uma significa alertas duplicados pro mesmo incidente
5. O Railway faz deploy automático a cada push na `main`

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

**Agendamento do Cron:**
```typescript
// src/jobs/monitoring.ts
cron.schedule("*/4 * * * *", run, {
  timezone: "America/Sao_Paulo"
});
```

O job também roda uma vez imediatamente ao subir, sem precisar esperar o primeiro ciclo agendado.

⚠️ Não diminua o intervalo para menos de alguns minutos. Um ciclo completo (8 serviços, incluindo retries) pode levar alguns minutos para terminar. Se o cron iniciar uma nova execução antes que o ciclo anterior seja finalizado, os processos poderão rodar simultaneamente e os logs ficarão misturados. Ajuste o intervalo de acordo com a quantidade de serviços monitorados.

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

**[Camoufox](https://camoufox.com/)**, un fork de Firefox orientado a reducir las señales de automatización del navegador. El navegador se ejecuta en modo **headed** (con interfaz gráfica) dentro de un display virtual (**Xvfb**), permitiendo que Firefox corra en un entorno de servidor sin pantalla física.

---

## Funcionalidades

- **Camoufox + Playwright**: navegador basado en Firefox con ajustes de fingerprint para el entorno de automatización
- **Headed + Xvfb**: el navegador corre con interfaz gráfica en un display virtual, incluso dentro de un servidor
- **Espera del Turnstile**: cuando aparece el desafío de Cloudflare, el bot espera a que se resuelva antes de continuar con la extracción (sin clic automático en el checkbox)
- **Páginas aisladas**: cada servicio se verifica en su propia página (`newPage()`), sin reutilización de cookies de sesión entre ellos
- **Parsing PT-BR**: el estado se identifica a partir de los textos que muestra Downdetector en portugués, con fallback a algunas expresiones en inglés
- **Adaptación de idioma**: el navegador envía `Accept-Language` priorizando portugués de Brasil
- **Reintento automático**: una consulta que falla recibe un segundo intento antes de descartarse
- **Cron cada 4 minutos**: el monitoreo se ejecuta una vez al iniciar y luego continuamente
- **Docker + Railway**: ejecución en contenedores con Xvfb
- **Pruebas**: pruebas unitarias con Vitest y script manual para probar alertas en Slack

> 🔭 **Roadmap**: observabilidad con **Prometheus + Grafana** (métricas de uptime por servicio, tiempo de respuesta del scraper, historial de incidentes), aún no implementado.

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

El bot fue estructurado para que se puedan agregar nuevos servicios de Downdetector **sin modificar la lógica principal del scraper**. Solo se necesitan cambios en **3 archivos**:

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

#### 3. [notificationOrchestrator.ts](src/slack/notificationOrchestrator.ts) → crea el monitor del servicio

Cada servicio necesita su **propia instancia** de `IncidentMonitor` para rastrear incidentes de forma independiente:

```typescript
const caixaMonitor = new IncidentMonitor(client, channel);

const monitors: Record<ServiceName, IncidentMonitor> = {
    // ... monitores existentes ...
    [ServiceName.CAIXA]: caixaMonitor
};
```

#### Para finalizar

Después de los cambios, corre las pruebas y haz el deploy normalmente:

```bash
npm test
npm run build
```

Después del push (o reinicio del contenedor), el nuevo servicio pasa a monitorearse automáticamente en el próximo ciclo del cron.

> 💡 **Tip:** no olvides actualizar también la tabla [Servicios monitoreados](#servicios-monitoreados) de este README para documentar el nuevo servicio para los próximos contribuidores.

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
async function detectStatus(page: Page): Promise<string | null> {
    const body = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "");

    if (body.includes("não mostram problemas")) {
        return ServiceStatus.SUCCESS;
    }
    if (body.includes("possíveis problemas")) {
        return ServiceStatus.WARNING;
    }
    if (body.includes("mostram problemas")) {
        return ServiceStatus.DANGER;
    }
    return null;
}
```

Para otros idiomas, reemplaza las strings por sus equivalentes. Algunos ejemplos:

| Estado | PT-BR | EN-US | ES-CL |
|--------|-------|-------|-------|
| `SUCCESS` | `não mostram problemas` | `no current problems` | `no muestran problemas` |
| `WARNING` | `possíveis problemas` | `possible problems` | `posibles problemas` |
| `DANGER` | `mostram problemas` | `show problems with` | `muestran problemas` |

> ⚠️ **Atención:** ¡el orden de las verificaciones importa! La frase de `SUCCESS` contiene la substring `"mostram problemas"`, que también aparece en `DANGER`. Por eso `SUCCESS` debe verificarse **antes** que `DANGER`, si no todo servicio OK sería clasificado como en crisis.

> 💡 **Tip de debug:** si el parser deja de reconocer un estado (Downdetector puede cambiar los textos con el tiempo), abre la página en tu navegador, inspecciona el texto mostrado y actualiza las expresiones de la función `detectStatus()` según sea necesario.

</details>

---

## Arquitectura

<details open>
<summary>Haz clic para expandir/colapsar el diagrama</summary>

### Flujo del sistema

```mermaid
graph TB
    Start([Cron Job<br/>4min]) --> Server[server.ts<br/>Punto de entrada]
    Server --> Job[Monitoring Job]
    Job --> Orchestrator[notificationOrchestrator.ts<br/>Función CheckAll]

    Orchestrator --> Scraper[downdetectorService.ts<br/>Scraper]

    Scraper --> Browser{Camoufox Browser<br/>Firefox headed}
    Browser --> Xvfb[Xvfb<br/>Display Virtual]
    Browser --> Turnstile[Cloudflare Turnstile<br/>Espera resolución]
    Browser --> DD[https://downdetector.com.br]

    DD --> Data{Extracción de Estado<br/>Parsing PT-BR}
    Data --> Results["Resultados<br/>ServicesResult[]"]
    Results --> Orchestrator

    Orchestrator --> Incident[Incident Monitors<br/>8 monitores individuales]

    Incident --> Slack1[Slack<br/>☠️ Alerta Crítica]
    Incident --> Slack2[Slack<br/>🎉 Resolución]

    Slack1 --> End([Equipo Notificado])
    Slack2 --> End

    style Start fill:#e1f5fe
    style Orchestrator fill:#fff9c4
    style Browser fill:#FF6B35,color:#fff
    style Xvfb fill:#9C27B0,color:#fff
    style Turnstile fill:#f59e0b,color:#fff
    style Incident fill:#e1bee7
    style Slack1 fill:#4A154B,color:#fff
    style Slack2 fill:#4A154B,color:#fff
    style End fill:#e8f5e9
```

### Diagrama de componentes

```mermaid
graph LR
    subgraph "Capa de Aplicación"
        Server[server.ts<br/>Punto de entrada]
        App[app.ts<br/>Config de Slack]
        Job[jobs/monitoring.ts<br/>Cron 4min]
    end

    subgraph "Capa de Orquestación"
        Orchestrator[notificationOrchestrator.ts<br/>Coordina scraping y notificaciones]
        Incident[incidentMonitor.ts<br/>Gestiona el estado de incidentes]
    end

    subgraph "Capa de Datos"
        Scraper[downdetectorService.ts<br/>Camoufox + Playwright]
    end

    subgraph "Servicios Externos"
        Downdetector[(Downdetector.com.br)]
        SlackAPI[(Slack API)]
        Camoufox[(Camoufox Browser)]
    end

    Server --> Job
    Server --> App
    Job --> Orchestrator

    Orchestrator --> Scraper
    Orchestrator --> Incident

    Scraper --> Camoufox
    Camoufox --> Downdetector

    Incident --> SlackAPI

    style Server fill:#4CAF50,color:#fff
    style App fill:#4CAF50,color:#fff
    style Job fill:#4CAF50,color:#fff
    style Orchestrator fill:#FFD700,color:#000
    style Incident fill:#FFD700,color:#000
    style Scraper fill:#2196F3,color:#fff
    style Downdetector fill:#FF9800,color:#fff
    style SlackAPI fill:#4A154B,color:#fff
    style Camoufox fill:#9C27B0,color:#fff
```

</details>

---

## Cómo funcionan las alertas

<details>
<summary>Haz clic para entender</summary>

Cada servicio tiene su propio monitor de incidentes que rastrea los cambios de estado:

| Estado en Downdetector | Qué significa | Acción en Slack |
|------------------------|-----------------|---------------|
| 🟢 **Success** | Los reportes de usuarios **no indican problemas** con el servicio | Ninguna acción (estado normal) |
| 🟡 **Warning** | Los reportes muestran **posibles problemas** con el servicio | ⚠️ Solo se registra en el log (sin alerta) |
| 🔴 **Danger** | Los reportes muestran **problemas confirmados** con el servicio | ☠️ **Alerta Crítica** enviada de inmediato |

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

> ℹLas alertas del bot siempre se envían **en portugués**, sin importar el idioma de este README, el texto está fijo en [incidentMonitor.ts](src/slack/incidentMonitor.ts).

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
- Docker (ejecuta el mismo entorno con Xvfb usado en Railway)

### Instalación

<details>
<summary>Haz clic para expandir las instrucciones de instalación</summary>

1. **Clona el repositorio**
```bash
git clone https://github.com/eduardotashiro/downdetector-slack.git
cd downdetector-slack
```

2. **Instala las dependencias** (esto también descarga el binario de Camoufox)
```bash
npm install
```

3. **Configura las variables de entorno**

Crea un archivo `.env`:
```env
# Configuración de Slack
SLACK_BOT_TOKEN=xoxb-tu-bot-token-aqui
SLACK_SIGNING_SECRET=tu-signing-secret-aqui
CHANNEL_ID=id-de-tu-canal-de-slack

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

### Slack App Manifest (Recomendado)
<details>
<summary>Haz clic para expandir las instrucciones</summary>

1. Ve a https://api.slack.com/apps
2. Haz clic en **Create New App**
3. Elige **From an app manifest**
4. Selecciona tu workspace
5. Pega el contenido del archivo `/src/slack/manifest.json`
6. Instala la app en tu workspace
7. Copia el Bot Token y el Signing Secret a tu `.env`

</details>

### Despliegue con Docker

<details>
<summary>Haz clic para expandir las instrucciones de Docker</summary>

Camoufox se ejecuta en modo **headed** (no headless) aquí, porque pasa Cloudflare de forma mucho más confiable. Como no hay pantalla física, la imagen de Docker lo ejecuta dentro de un display virtual (Xvfb).

**Build y ejecución local:**
```bash
docker build -t downdetector-slack .
docker run --rm -it --env-file .env downdetector-slack
```

No hace falta mapear ningún puerto pues el servicio nunca recibe tráfico HTTP entrante, solo hace peticiones salientes a Downdetector y a Slack.

**Despliegue en Railway:**
1. Sube tu código a GitHub
2. Conecta el repositorio a Railway
3. Agrega las variables de entorno en el panel:
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `CHANNEL_ID`
   - `PORT`
4. Mantén el servicio en **1 réplica** pues ejecutar más de una significa alertas duplicadas para el mismo incidente
5. Railway despliega automáticamente en cada push a `main`

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

**Programación del Cron:**
```typescript
// src/jobs/monitoring.ts
cron.schedule("*/4 * * * *", run, {
  timezone: "America/Sao_Paulo"
});
```

El job también corre una vez inmediatamente al iniciar, sin necesidad de esperar el primer ciclo programado.

⚠️ No reduzcas el intervalo a menos de unos minutos. Un ciclo completo (8 servicios, incluyendo los reintentos) puede tardar varios minutos en finalizar. Si el cron inicia una nueva ejecución antes de que termine el ciclo anterior, ambos procesos podrían ejecutarse al mismo tiempo y los logs se mezclarían. Ajusta el intervalo según la cantidad de servicios monitoreados.

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