import { chromium } from "playwright-extra";
import { config } from "../config/env.js";
import stealth from "puppeteer-extra-plugin-stealth";
chromium.use(stealth());

const SERVICES = [
    { name: "Pix", url: "https://downdetector.com.br/fora-do-ar/pix/" },
    { name: "Itaú", url: "https://downdetector.com.br/fora-do-ar/banco-itau/" },
    { name: "Bradesco", url: "https://downdetector.com.br/fora-do-ar/bradesco/" },
    { name: "Santander", url: "https://downdetector.com.br/fora-do-ar/santander/" },
    { name: "Nubank", url: "https://downdetector.com.br/fora-do-ar/nubank/" },
    { name: "Bancodobrasil", url: "https://downdetector.com.br/fora-do-ar/banco-do-brasil/" },
    //limpeza né, muito lixo
];

async function tentarAcessarServico(page: any, service: any) {
    await page.goto(service.url, {
        waitUntil: "domcontentloaded", 
        timeout: 40000,
    });

    await page.waitForTimeout(300); //era 500

    const titulo = await page.title();
    if (titulo.includes("momento") || titulo.includes("Um momento")) {
        console.log(`Cloudflare detectado...`);
        await page.waitForTimeout(4000);  // voltando p 4000...
    }

    await page.waitForFunction(
        () => {
            return window.DD?.currentServiceProperties !== undefined;
        },
        { timeout: 20000, polling: 800 } // sera que aumentando o timeout para 20 s volta a funcionar '-'
    );

    await page.waitForTimeout(500);  // era 1000

    return await page.evaluate(() => {
        return window.DD?.currentServiceProperties;
    });
}

export async function checkAllServices() {
    const browser = await chromium.launch({
        args: [
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled",
            //qualquer coisa tiro
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-images"

        ],
        headless: true,
        proxy: {
            server: config.proxy.server,
            username: config.proxy.username,
            password: config.proxy.password,
        },
    });

    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        locale: "pt-BR",
        timezoneId: "America/Sao_Paulo",
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",

        javaScriptEnabled: true,  // window.DD
        serviceWorkers: 'block',
        bypassCSP:true
    });

    const resultados = [];

    try {
        for (const service of SERVICES) {
            console.log(`analisando o serviço: ${service.name}...`);

            let page;

            try {
                page = await context.newPage();

                
                await page.route("**/*", (route) => {
                    const url = route.request().url();
                    const type = route.request().resourceType();

                   
                    if (
                        url.includes("google-analytics") ||
                        url.includes("googletagmanager") ||
                        url.includes("gtag") ||
                        url.includes("facebook.com") ||
                        url.includes("facebook.net") ||
                        url.includes("doubleclick") ||
                        url.includes("hotjar") ||
                        url.includes("/ads/") ||
                        url.includes("analytics") ||
                        url.includes("clarity.ms") ||
                        url.includes("newrelic.com") ||
                        url.includes("datadoghq.com") ||
                        url.includes("sentry.io") ||
                        url.includes("taboola") ||
                        url.includes("outbrain") ||
                        url.includes("amazon-adsystem")
                    ) {
                        return route.abort();
                    }

                   

                    
                    if (type === 'document') {
                        return route.continue();
                    }

                   
                    if (url.includes('downdetector.com') || url.includes('downdetector.br')) {
                        if (['script', 'xhr', 'fetch'].includes(type)) {
                            return route.continue();
                        }
                    }

                  
                    return route.abort();
                });

                let dados;

                try {
                    dados = await tentarAcessarServico(page, service);
                } catch (err) {
                    console.log(`Timeout / Cloud / destroyer... tentando novamente...`);
                    await page.close();

                    page = await context.newPage();

                    
                    await page.route("**/*", (route) => {
                        const url = route.request().url();
                        const type = route.request().resourceType();

                        if (
                            url.includes("google-analytics") ||
                            url.includes("googletagmanager") ||
                            url.includes("gtag") ||
                            url.includes("facebook.com") ||
                            url.includes("facebook.net") ||
                            url.includes("doubleclick") ||
                            url.includes("hotjar") ||
                            url.includes("/ads/") ||
                            url.includes("analytics") ||
                            url.includes("clarity.ms") ||
                            url.includes("newrelic.com") ||
                            url.includes("datadoghq.com") ||
                            url.includes("sentry.io") ||
                            url.includes("taboola") ||
                            url.includes("outbrain") ||
                            url.includes("amazon-adsystem")
                        ) {
                            return route.abort();
                        }

                        if (type === 'document') {
                            return route.continue();
                        }
                           //if (url.includes('downdetector.com') || url.includes('downdetector.com.br')) {
                        if (url.includes('downdetector.com') || url.includes('downdetector.br')) {
                            if (['script', 'xhr', 'fetch'].includes(type)) {
                                return route.continue();
                            }
                        }

                        return route.abort();
                    });

                    dados = await tentarAcessarServico(page, service);
                }

                if (dados) {
                    resultados.push({
                        nome: service.name,
                        url: service.url,
                        dados,
                    });

                    console.log(`----> ${service.name}`);
                    console.log(`----> Status: ${dados.status}`);
                    console.log(`----> Max: ${dados.max}`);
                }
            } catch (error) {
                console.log(`${service.name}: ${(error as Error).message}`);
            } finally {
                if (page) {
                    await page.close();
                }
            }
        }

        console.log(
            `\nFinalization: ${resultados.length}/${SERVICES.length} serviços`
        );
        return resultados;
    } finally {
        await browser.close();
    }
}

