import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import BrowsercashSDK from "@browsercash/sdk";
import { config } from "../config/env.js";
chromium.use(stealth());

const client = new BrowsercashSDK({
    apiKey: config.api.apiKey,
});

const SERVICES = [
    { name: "Pix", url: "https://downdetector.com.br/fora-do-ar/pix/" },
    { name: "Itaú", url: "https://downdetector.com.br/fora-do-ar/banco-itau/" },
    { name: "Bradesco", url: "https://downdetector.com.br/fora-do-ar/bradesco/" },
    { name: "Santander", url: "https://downdetector.com.br/fora-do-ar/santander/" },
    { name: "Nubank", url: "https://downdetector.com.br/fora-do-ar/nubank/" },
    { name: "Banco do Brasil", url: "https://downdetector.com.br/fora-do-ar/banco-do-brasil/" },
    { name: "Mercado Pago", url: "https://downdetector.com.br/fora-do-ar/mercadopago/" },
    { name: "Pic Pay", url: "https://downdetector.com.br/fora-do-ar/picpay/" }
];


const delay = (min = 4000, max = 9000) =>
    new Promise(res =>
        setTimeout(res, Math.floor(Math.random() * (max - min + 1)) + min)
    );


async function tentarAcessarServico(page: any, service: any) {
    await page.goto(service.url, {
        waitUntil: "domcontentloaded",
        timeout: 80000,
    });

    await page.waitForFunction(() => window.DD?.currentServiceProperties !== undefined, { timeout: 80000, polling: 800 });

    return await page.evaluate(() => window.DD?.currentServiceProperties);
}
export async function checkAllServices() {
    const resultados = [];

    for (const service of SERVICES) {
        let session;
        let browser;
        let sucesso = false;

        try {
            session = await client.browser.session.create();
            console.log(`Session:${session.sessionId} para ${service.name}`);
            browser = await chromium.connectOverCDP(session.cdpUrl as string);
            let context = browser.contexts()[0];

            const tentativasMaximas = 3; 
            let tentativas = 0;

            while (tentativas < tentativasMaximas && !sucesso) {
                let page = await context.newPage();
                
                try {
                    const dados = await tentarAcessarServico(page, service);

                    if (dados) {
                        resultados.push({
                            nome: service.name,
                            url: service.url,
                            dados
                        });
                        console.log(`💀 ${service.name}: ${dados.status}`);
                        sucesso = true;
                    }
                } catch (e) {
                    tentativas++;
                    console.log(`${service.name} | TENTATIVA ${tentativas} DE ${tentativasMaximas}`);
                } finally {
                    if (page && !page.isClosed()) {
                        await page.close();
                    }
                }

                if (!sucesso && tentativas < tentativasMaximas) {
                    await delay(4000, 12000);
                }
            }

           
            if (!sucesso) {
                console.log(`${service.name} FALHOU EM TODAS AS TENTATIVAS, DESISTINDO...`);
            }

        } catch (error) {
            console.error(`Erro no ${service.name}:`, error);
        } finally {
            try {
                if (browser) {
                    await browser.close();
                }
                if (session) {
                    await client.browser.session.stop({ sessionId: session.sessionId });
                    console.log(`SESSÃO :${session.sessionId} FECHADA`);
                }
            } catch (e) {
                console.error(`Erro ao limpar :`, e);
            }
        }
    }

    return resultados;
}
