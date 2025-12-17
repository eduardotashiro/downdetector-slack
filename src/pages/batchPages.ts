import { chromium } from 'playwright-extra';
import { config } from '../config/env.js';
import stealth from 'puppeteer-extra-plugin-stealth';
chromium.use(stealth());

//Bradesco
const SERVICES = [
    { name: 'Pix', url: 'https://downdetector.com.br/fora-do-ar/pix/' },
    { name: 'Itaú', url: 'https://downdetector.com.br/fora-do-ar/banco-itau/' },
    { name: 'Bradesco', url: 'https://downdetector.com.br/fora-do-ar/bradesco/' },
    { name: 'Santander', url: 'https://downdetector.com.br/fora-do-ar/santander/' },
    { name: 'Nubank', url: 'https://downdetector.com.br/fora-do-ar/nubank/' }
    // { name: 'AWS', url: 'https://downdetector.com.br/fora-do-ar/aws-amazon-web-services/' },
    // { name: 'Azure', url: 'https://downdetector.com.br/fora-do-ar/windows-azure/' }
    //{ name: 'Clearsale', url: 'https://statusgator.com/services/clearsale' }
    //{ name: 'Rede', url: 'https://downdetector.com.br/fora-do-ar/rede/' }
    //{ name: 'Getnet', url: 'https://downdetector.com.br/fora-do-ar/getnet/' }
    //{ name: 'Cielo', url: 'https://downdetector.com.br/fora-do-ar/cielo/' }
    //{ name: 'Pagbank', url: 'https://downdetector.com.br/fora-do-ar/pagbank/' }
    //{ name: 'Mercadopago', url: 'https://downdetector.com.br/fora-do-ar/mercadopago/' }
    //{ name: 'Safrapay', url: 'https://downdetector.com.br/fora-do-ar/safrapay/' }
    //{ name: 'Bancodobrasil', url: 'https://downdetector.com.br/fora-do-ar/banco-do-brasil/' }
];
//  '--no-sandbox',
//     '--disable-setuid-sandbox',
//     '--ignore-certificate-errors',
//     '--disable-gpu','--disable-dev-shm-usag

async function tentarAcessarServico(page:any, service:any) {
    await page.goto(service.url, {
        waitUntil: 'domcontentloaded',
        timeout : 60000
    });

    await page.waitForTimeout(1000);

    const titulo = await page.title();
    if (titulo.includes('momento') || titulo.includes('Um momento')) {
        console.log(`Cloudflare detectado...`);
        await page.waitForTimeout(6000);
    }

    await page.waitForFunction(() => {
        return window.DD?.currentServiceProperties !== undefined;
    }, { timeout: 15000, polling: 500 });

    await page.waitForTimeout(1500);

    return await page.evaluate(() => {
        return window.DD?.currentServiceProperties;
    });
}









export async function checkAllServices() {
    const browser = await chromium.launch({
        args: [
            '--no-sandbox',
            '--disable-blink-features=AutomationControlled'
        ],
        headless: false,
        proxy: {
            server: config.proxy.server,
            username: config.proxy.username,
            password: config.proxy.password
        }
    });

    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
    });

    const resultados = [];

    try {
        for (const service of SERVICES) {
            console.log(`analisando o serviço: ${service.name}...`);

            let page;

            try {
                page = await context.newPage();

                await page.route('**/*', route => {
                    const url = route.request().url();
                    if (
                        url.includes('google-analytics') ||
                        url.includes('gtag') ||
                        url.includes('facebook.com/tr') ||
                        url.includes('facebook.net')
                    ) {
                        return route.abort();
                    }
                    route.continue();
                });

                let dados;

                try {
                    dados = await tentarAcessarServico(page, service);
                } catch (err) {
                    console.log(`Timeout / erro, tentando novamente...`);
                    await page.close();

                    page = await context.newPage();
                    dados = await tentarAcessarServico(page, service);
                }

                if (dados) {
                    resultados.push({
                        nome: service.name,
                        url: service.url,
                        dados
                    });

                    console.log(`✅ ${service.name}`);
                    console.log(`   Status: ${dados.status}`);
                    console.log(`   Max: ${dados.max}`);
                }

            } catch (error) {
                console.log(`${service.name}: ${(error as Error).message}`);
            } finally {
                if (page) {
                    await page.close();
                }
            }
        }

        console.log(`\nFinalization: ${resultados.length}/${SERVICES.length} serviços`);
        return resultados;

    } finally {
        await browser.close();
    }
}
