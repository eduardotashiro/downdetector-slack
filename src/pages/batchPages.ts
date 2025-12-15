import { chromium } from 'playwright-extra';
import { config } from '../config/env';
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
export async function checkAllServices() {
    const browser = await chromium.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--ignore-certificate-errors',
            '--disable-gpu',
            '--disable-dev-shm-usage'
        ],
        headless: true,
        proxy: {
            server: config.proxy.server,
            username: config.proxy.username,
            password: config.proxy.password
        }
    });

    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo'
    });

    const page = await context.newPage();

    const resultados = [];

    await page.route('**/*', route => {
        const url = route.request().url();
        const type = route.request().resourceType();

    
        if (url.includes('google-analytics') ||
            url.includes('googletagmanager') ||
            url.includes('gtag') ||
            url.includes('facebook.com/tr') ||
            url.includes('facebook.net') ||
            url.includes('doubleclick') ||
            url.includes('hotjar') ||
            url.includes('/ads/') ||
            url.includes('analytics')) {
            return route.abort();
        }

     
        if (['document', 'script', 'xhr', 'fetch'].includes(type)) {
            route.continue();
        } else {
            route.abort();
        }
    });

    try {
        for (const service of SERVICES) {
            console.log(`analisando o serviço: ${service.name}...`);

            try {
                await context.clearCookies();

                await page.goto(service.url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 40000
                });

              
                // await page.waitForTimeout(1000);

                // const titulo = await page.title();
                // if (titulo.includes('momento') || titulo.includes('Um momento')) {
                //     console.log(`Cloudflare detectado...`);
                //     await page.waitForTimeout(6000);
                // }

                await page.waitForFunction(() => {
                    return window.DD?.currentServiceProperties !== undefined;
                }, { timeout: 12000 });

                const dados = await page.evaluate(() => {
                    return window.DD?.currentServiceProperties;
                });

                if (dados) {
                    resultados.push({
                        nome: service.name,
                        url: service.url,
                        dados: dados
                    });

    
                }

            } catch (error) {
                const err = error as Error;
                console.log(`${service.name}: ${err.message}`);

                //Execution context was destroyed, most likely because of a navigation
                if (err.message && (err.message.includes('Timeout') || err.message.includes('destroyed'))) {  
                    console.log(`executando retentativa ...`);

                    try {
                       
                        await page.goto(service.url, {
                            waitUntil: 'domcontentloaded',
                            timeout: 40000
                        });

                        await page.waitForTimeout(3000);

                        const titulo = await page.title();
                        if (titulo.includes('momento')) {
                            await page.waitForTimeout(5000);
                        }

                        await page.waitForFunction(() => {
                            return window.DD?.currentServiceProperties !== undefined;
                        }, { timeout: 12000 });

                        const dados = await page.evaluate(() => {
                            return window.DD?.currentServiceProperties;
                        });

                        if (dados) {
                            resultados.push({
                                nome: service.name,
                                url: service.url,
                                dados: dados
                            });


                        }

                    } catch (retryError) {
                        const retryErr = retryError as Error;
                        console.log(`Retry falhou, f****: ${retryErr.message}`);
                    }
                }
            }

            
            await page.waitForTimeout(600);
        } //fim loop

        await browser.close();
        console.log(`\nFinalization: ${resultados.length}/${SERVICES.length} serviços coletation`);
        return resultados;

    } catch (error) {
        console.error('Erro geral: F********', error);
        await browser.close();
        return null;
    }
}