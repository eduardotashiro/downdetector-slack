<div align="center">

![DownDetector Banner](https://github.com/eduardotashiro/downdetector-slack/blob/main/.github/assets/banner.png?raw=true)

</div>

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Slack Bot](https://img.shields.io/badge/Slack-Bot-4A154B?logo=slack)](https://docs.slack.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.58-45ba4b?logo=playwright)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-2.0-6E9F18?logo=vitest)](https://vitest.dev/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway)](https://railway.app/)

**Automated real-time monitoring of financial services using Downdetector data**

[Setup](#setup) • [Usage](#usage) • [Testing](#testing) • [Contributing](#contributing)

</div>

---

## Why This Project Exists

This bot was created to **proactively monitor service instability** reported on [Downdetector Brasil](https://downdetector.com.br/) and **automatically notify Slack channels** about potential issues affecting Brazilian financial services.

### Problem It Solves
✔️ Real-time alerts when services experience problems 

✔️ Automated monitoring

✔️ Centralized notifications in **Slack**

✔️ Early warning system for technical teams 

---

## Features

- **Automated Monitoring**: Checks 8 major financial services every 10 minutes
- **Slack Notifications**: Sends formatted alerts to designated channels
- **Status Tracking**: Monitors `success`, `warning`, and `danger` states
- **Smart Detection**: Tracks incidents from start to resolution
- **Batch Alerts**: Sends collective warnings when 3+ services are affected **within a 5-minute window**
- **Time-Window Filtering**: Prevents false positives from isolated warnings at different times
- **Docker Ready**: Containerized deployment with Railway support
- **Tested**: Unit tests with Vitest

### Monitored Services

<details>
<summary>Click to expand monitored services</summary>

| Service | 
|---------|
| **PIX** | 
| **Itaú** |
| **Bradesco** |
| **Santander** | 
| **Nubank** |
| **Banco do Brasil** | 
| **Mercado Pago** | 
| **PicPay** |

</details>

---

## Architecture

<details open>
<summary>Click to expand/collapse architecture diagram</summary>

## System Flow
```mermaid
graph TB
    Start([Cron Job<br/>Every 5min]) --> Server[Server.ts<br/>Entry Point]
    Server --> Job[Monitoring Job]
    Job --> Orchestrator[Notification Orchestrator<br/>CheckAll Function]
    
    Orchestrator --> Scraper[Downdetector Service<br/>Playwright Scraper]
    
    Scraper --> Browser{Cloud Browser}
    Browser --> DD1[downdetector.com.br/pix]
    Browser --> DD2[downdetector.com.br/itau]
    Browser --> DD3[downdetector.com.br/...]
    
    DD1 --> Data{Extract Status}
    DD2 --> Data
    DD3 --> Data
    
    Data --> Scraper
    Scraper --> Orchestrator
    
    Orchestrator --> Process{Process Results}
    
    Process --> Warning[Warning Collector<br/>3+ services in 5min<br/>Time-windowed detection]
    Process --> Incident[Incident Monitors<br/>8 individual monitors]
    
    Warning --> Slack1[Slack Channel<br/>⚠️ Batch Alert]
    Incident --> Slack2[Slack Channel<br/>☠️ Critical Alert]
    Incident --> Slack3[Slack Channel<br/>🎉 Resolution]
    
    Slack1 --> End([Team Notified])
    Slack2 --> End
    Slack3 --> End
    
    style Start fill:#e1f5fe
    style Orchestrator fill:#fff9c4
    style Browser fill:#fff3e0
    style Process fill:#e1bee7
    style Slack1 fill:#4A154B,color:#fff
    style Slack2 fill:#4A154B,color:#fff
    style Slack3 fill:#4A154B,color:#fff
    style End fill:#e8f5e9
```


## Component Diagram
```mermaid
graph LR
    subgraph "Application Layer"
        Server[server.ts<br/> Entry Point]
        App[app.ts<br/> Slack Config]
        Job[jobs/monitoring.ts<br/> */5 * * * *]
    end
    
    subgraph "Orchestration Layer"
        Orchestrator[slack/notificationOrchestrator.ts]
    end
    
    subgraph "Business Logic"
        Incident[slack/incidentMonitor.ts<br/>Per-Service Handler<br/>8 instances]
        Warning[slack/warningMonitor.ts<br/>Batch Warning Detector<br/>Time-window: 5min]
    end
    
    subgraph "Data Layer"
        Scraper[services/downdetectorService.ts<br/>Playwright Automation<br/>checkAllServices]
        Types[types/downdetector.ts]
    end
    
    subgraph "External Services"
        Downdetector[(downdetector.br)]
        Slack[( Slack API)]
        BrowserCash[(Cloud Browser)]
    end
    
    Server --> Job
    Server --> App
    Job --> Orchestrator
    
    Orchestrator --> Scraper
    Orchestrator --> Incident
    Orchestrator --> Warning
    
    Scraper --> BrowserCash
    BrowserCash --> Downdetector
    
    Incident --> Slack
    Warning --> Slack
    
    Scraper -.-> Types
   
    
    style Server fill:#4CAF50,color:#fff
    style Orchestrator fill:#FFD700,color:#000
    style Scraper fill:#2196F3,color:#fff
    style Downdetector fill:#FF9800,color:#fff
    style Slack fill:#4A154B,color:#fff
    style BrowserCash fill:#9C27B0,color:#fff
```
</details>

---

## How Alerts Work

### Individual Service Alerts
Each service has its own incident monitor that tracks status changes:
- ☠️ **Critical Alert**: Sent when service enters `danger` state
- 🎉 **Resolution Alert**: Sent when service returns to `success`

### Batch Warnings
The system uses a **5-minute sliding time window** to detect widespread issues:

**Trigger Conditions:**
- 3 or more services in `warning` state
- All warnings occurred within the last 5 minutes
- Prevents false positives from isolated incidents

## Screenshots
<details>
<summary>Click to see Slack notifications examples</summary>

### Batch Warning
![Batch Warning Example](.github/assets/alert-batch.png)

### Critical Alert
![Critical Alert Example](.github/assets/alert-critical.png)

### Resolution
![Resolution Example](.github/assets/alert-resolved.png)

</details>

---

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

## Setup

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



## Using Slack App Manifest (Recommended)
<details>
<summary>Click to expand instructions</summary>
This project includes a Slack App Manifest to simplify app creation.

### Create the Slack App from Manifest

1. Go to https://api.slack.com/apps
2. Click **Create New App**
3. Choose **From an app manifest**
4. Select your workspace
5. Paste the content of `/slack/manifest.json`
6. Install the app to your workspace
7. Copy the Bot Token and Signing Secret to your `.env`
</details>

## Docker Deployment

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

## Usage

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

### Cron Schedule

**Frequency:** Every 10 minutes, 24/7
```typescript
// src/jobs/monitoring.ts
cron.schedule("*/10 * * * *", run, {
  timezone: "America/Sao_Paulo"
});
```

</details>

---

## Testing

<details>
<summary>Click to expand testing guide</summary>

This project uses **Vitest** for fast and modern testing.

### Run tests
```bash
npm test            # Run tests once
npm run test:watch  # Watch mode 
```

### Test Structure
```
src/slack/__tests__/
├── fixtures.ts                  # Mock data for tests
├── incidentMonitor.spec.ts      # Incident monitor tests
└── warningMonitor.spec.ts       # Warning collector tests
```

</details>

---

## Contributing

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
- `test`: Add or update tests
- `perf`: Performance improvements
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

### Before Submitting PR
```bash
npm test              # Run tests
npm run build         # Verify build works
```

</details>

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with 💀 by [Eduardo Tashiro](https://www.linkedin.com/in/eduardo-tashiro-192096362/)**

⭐ **Star this repo if you find it useful!**

[![GitHub stars](https://img.shields.io/github/stars/eduardotashiro/downdetector-slack?style=social)](https://github.com/eduardotashiro/downdetector-slack/stargazers)

</div>