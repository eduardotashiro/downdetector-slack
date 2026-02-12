<div align="center">

![DownDetector Banner](https://github.com/eduardotashiro/downdetector-slack/blob/main/.github/assets/banner.png?raw=true)

</div>

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Slack Bot](https://img.shields.io/badge/Slack-Bot-4A154B?logo=slack)](https://docs.slack.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.58-45ba4b?logo=playwright)](https://playwright.dev/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway)](https://railway.app/)

**Automated real-time monitoring of Brazilian financial services using Downdetector data**

[Setup](#-setup) • [Usage](#-usage) • [Contributing](#-contributing)

</div>

---

## Why This Project Exists

This bot was created to **proactively monitor service instability** reported on [Downdetector Brasil](https://downdetector.com.br/) and **automatically notify Slack channels** about potential issues affecting Brazilian financial services.

### Problem It Solves
- ✅ Real-time alerts when services experience problems
- ✅ Automated monitoring 
- ✅ Centralized notifications in Slack
- ✅ Early warning system for technical teams

---

##  Features

-  **Automated Monitoring**: Checks 8 major Brazilian financial services every 5 minutes
-  **Slack Notifications**: Sends formatted alerts to designated channels
-  **Status Tracking**: Monitors `success`, `warning`, and `danger` states
-  **Smart Detection**: Tracks incidents from start to resolution
-  **Batch Alerts**: Sends collective warnings when 3+ services are affected **within a 5-minute window**
-  **Time-Window Filtering**: Prevents false positives from isolated warnings at different times
-  **Docker Ready**: Containerized deployment with Railway support

### Monitored Services

<details>
<summary>Click to expand monitored services</summary>

| Service | 
|--------|
| **PIX** | 
| **Itaú** 
| **Bradesco**
| **Santander** 
| **Nubank** 
| **Banco do Brasil** 
| **Mercado Pago** 
| **PicPay** 

</details>

---

##  Architecture

<details open>
<summary>Click to expand/collapse architecture diagram</summary>

### System Flow
```mermaid
graph TB
    Start([Cron Job<br/>Every 5min]) --> Server[Server.ts<br/>Entry Point]
    Server --> Job[Monitoring Job]
    Job --> Scraper[Batch Pages<br/>Playwright Scraper]
    
    Scraper --> Browser{Cloud Browser}
    Browser --> DD1[downdetector.com.br/pix]
    Browser --> DD2[downdetector.com.br/itau]
    Browser --> DD3[downdetector.com.br/...]
    
    DD1 --> Data{Extract Status}
    DD2 --> Data
    DD3 --> Data
    
    Data --> Notifier[Batch Notifier]
    Notifier --> Warning[Warning Collector<br/>3+ services in 5min<br/>Time-windowed detection]
    Notifier --> Incident[Incident Monitors<br/>Per service]
    
    Warning --> Slack1[Slack Channel<br/>Batch Alert]
    Incident --> Slack2[Slack Channel<br/>Critical Alert]
    Incident --> Slack3[Slack Channel<br/>Resolution]
    
    Slack1 --> End([Team Notified])
    Slack2 --> End
    Slack3 --> End
    
    style Start fill:#e1f5fe
    style Browser fill:#fff3e0
    style Slack1 fill:#4A154B,color:#fff
    style Slack2 fill:#4A154B,color:#fff
    style Slack3 fill:#4A154B,color:#fff
    style End fill:#e8f5e9
```

### Component Diagram
```mermaid
graph LR
    subgraph "Application Layer"
        Server[server.ts]
        App[app.ts<br/>Slack App Config]
        Job[jobs/monitoring.ts<br/>Cron Schedule]
    end
    
    subgraph "Business Logic"
        Notifier[slack/batchNotifier.ts<br/>Orchestrator]
        Incident[slack/incidentMonitor.ts<br/>Per-Service Handler]
        Warning[slack/warningMonitor.ts<br/>Batch Handler]
    end
    
    subgraph "Data Layer"
        Scraper[pages/batchPages.ts<br/>Playwright Automation]
        Types[types/downdetector.ts<br/>Type Definitions]
    end
    
    subgraph "External Services"
        Downdetector[(Downdetector.br)]
        Slack[(Slack API)]
        BrowserCash[(BrowserCash SDK)]
    end
    
    Server --> Job
    Server --> App
    Job --> Notifier
    Notifier --> Incident
    Notifier --> Warning
    Notifier --> Scraper
    Scraper --> BrowserCash
    BrowserCash --> Downdetector
    Incident --> Slack
    Warning --> Slack
    
    style Server fill:#4CAF50,color:#fff
    style Scraper fill:#2196F3,color:#fff
    style Downdetector fill:#FF9800,color:#fff
    style Slack fill:#4A154B,color:#fff
    style BrowserCash fill:#9C27B0,color:#fff
```

</details>

---

---

##  How Alerts Work

### Individual Service Alerts
Each service has its own incident monitor that tracks status changes:
- ☠️ **Critical Alert**: Sent when service enters `danger` state
- 🎉 **Resolution Alert**: Sent when service returns to `success`

### Batch Warnings
The system uses a **5-minute sliding time window** to detect widespread issues:

**Trigger Conditions:**
-  3 or more services in `warning` state
-  All warnings occurred within the last 5 minutes
-  Prevents false positives from isolated incidents

**Example:**
```
23:30 - PIX enters warning
23:32 - Santander enters warning  
23:34 - Nubank enters warning
✔️ ALERT SENT (3 services affected simultaneously)

23:30 - PIX enters warning
23:40 - Santander enters warning (PIX warning expired)
23:45 - Nubank enters warning
✖️ NO ALERT (warnings not simultaneous)
```

**Why This Matters:**
- Reduces noise from sporadic issues
- Highlights actual system-wide instability
- Teams only get alerted for meaningful incidents

---

## 📦 Setup

### Prerequisites
- Node.js 20+
- Slack App with Bot Token ([Create one here](https://api.slack.com/apps))


### Installation

<details>
<summary>Click to expand setup instructions</summary>

1. **Clone the repository**
```bash
git clone https://github.com/eduardotashiro/downdetector-slack.git
cd downdetector-slack
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file:
```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
CHANNEL_ID=your-slack-channel-id

# BrowserCash
APIKEY=your-browsercash-api-key

# Server
PORT=3000
```

4. **Build the project**
```bash
npm run build
```

5. **Start the bot**
```bash
npm start
```

</details>

---

## 🐳 Docker Deployment

<details>
<summary>Click to expand Docker instructions</summary>

### Build and run locally
```bash
docker build -t downdetector-slack .
docker run -p 3000:3000 --env-file .env downdetector-slack
```

### Deploy to Railway
1. Push your code to GitHub
2. Connect repository to Railway
3. Add environment variables in Railway dashboard:
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `CHANNEL_ID`
   - `APIKEY`
4. Railway auto-deploys on push to `main`

</details>

---

## 🔧 Usage

<details>
<summary>Click to expand usage examples</summary>

### Development Mode
```bash
npm run dev
```
Runs with hot-reload using `tsx watch`

### Production Mode
```bash
npm run build
npm start
```

### Manual Testing
```typescript
// src/testes/mock.ts
import { Mock } from './mock.js';

// Simulate a service response
console.log(Mock.status); // 'success' | 'warning' | 'danger'
```

### Cron Schedule

Default: 5 minutes.
```typescript
// src/jobs/monitoring.ts

// 6AM-11PM: Business hours monitoring
cron.schedule("*/5 6-23 * * *", run,
  {
    timezone: "America/Sao_Paulo"
  }
);
// 12AM-1AM: Late-night critical period
cron.schedule("*/5 0-1 * * *", run,
  {
    timezone: "America/Sao_Paulo"
  }
);
```

</details>

</details>

---

## 🤝 Contributing

<details>
<summary>Click to expand contribution guide</summary>

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
```bash
   git checkout -b feature/amazing-feature
```
3. Commit your changes (use [Conventional Commits](https://www.conventionalcommits.org/))
```bash
   git commit -m 'feat: add amazing feature'
```
4. Push to the branch
```bash
   git push origin feature/amazing-feature
```
5. Open a Pull Request

### Commit Convention
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `perf`: Performance improvements
- `refactor`: Code refactoring

</details>

---


<div align="center">

**Made with 💀 by [Eduardo Tashiro](https://www.linkedin.com/in/eduardo-tashiro-192096362/)**

⭐ **Star this repo if you find it useful!**

[![GitHub stars](https://img.shields.io/github/stars/eduardotashiro/downdetector-slack?style=social)](https://github.com/eduardotashiro/downdetector-slack/stargazers)

</div>