// import { chromium } from "playwright-extra";
// import stealth from "puppeteer-extra-plugin-stealth";
// import BrowsercashSDK from "@browsercash/sdk";
import { chromium } from "playwright";
import BrowsercashSDK from "@browsercash/sdk";
import { config } from "../config/env.js";
// chromium.use(stealth());

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
    { name: "Pic Pay", url: "https://downdetector.com.br/fora-do-ar/picpay/" },
];

//disfarçando 
const delay = (min = 4000, max = 9000) =>
    new Promise(res =>
        setTimeout(res, Math.floor(Math.random() * (max - min + 1)) + min)
    );



//
async function tentarAcessarServico(page: any, service: any) {
    await page.goto(service.url, {
        waitUntil: "domcontentloaded",
        timeout: 40000,
    });

    await page.waitForFunction(
        () => window.DD?.currentServiceProperties !== undefined,
        { timeout: 40000, polling: 800 }
    );

    return await page.evaluate(() => window.DD?.currentServiceProperties);
}








export async function checkAllServices() {

    let session = await client.browser.session.create();
    console.log("Session:", session.sessionId);
    let browser = await chromium.connectOverCDP(session.cdpUrl as string);
    let context = browser.contexts()[0];

    const resultados = [];

    try {
        for (const service of SERVICES) {
            const page = await context.newPage();

            try {
                const dados = await tentarAcessarServico(page, service);

                if (dados) {
                    resultados.push({
                        nome: service.name,
                        url: service.url,
                        dados
                    });

                    console.log(`💀 ${service.name}: ${dados.status}`);
                }

            } catch (error) {


                try {
                    console.log("deu ruim:", error)
                    console.log("tentando novamente...")
                    const dados = await tentarAcessarServico(page, service);

                    if (dados) {
                        resultados.push({
                            nome: service.name,
                            url: service.url,
                            dados
                        });

                        console.log(`💀 ${service.name}: ${dados.status}`);
                    }
                } catch (e) {
                    console.log("falhou duas vezes bora tratar essa merda")
                    if ((e as Error).message.includes('net::ERR_QUIC_PROTOCOL_ERROR')) {
                        await delay(4000, 12000);
                        await page.close();
                        await browser.close();
                        await client.browser.session.stop({sessionId: session.sessionId});
                        await delay(4000, 12000);
                        session = await client.browser.session.create();
                        browser = await chromium.connectOverCDP(session.cdpUrl as string);
                        context = browser.contexts()[0];
                        console.log("nova sessão:", session.sessionId);
                        const page2 = await context.newPage();
                        const dados = await tentarAcessarServico(page2, service);
                        if (dados) {
                            resultados.push({
                                nome: service.name,
                                url: service.url,
                                dados
                            });

                            console.log(`💀 ${service.name}: ${dados.status}`);
                        }
                        await page2.close();
                    } else {
                        console.log(e)
                    }
                }
            } finally {
                try {
                    await page.close();
                } catch (error) {} 
                await delay(5000, 12000);
            }
        } //fim loop
        return resultados;
    } finally {
        await browser.close();
        await client.browser.session.stop({ sessionId: session.sessionId });
    }
}
