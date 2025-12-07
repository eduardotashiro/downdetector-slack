import { chromium } from 'playwright';

const url = "https://downdetector.com.br/fora-do-ar/pix/";

export async function checkPixStatus() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(url);
    
   
    const dados = await page.evaluate(() => {
        return window.DD?.currentServiceProperties; //DD NO TYPES
    });

    //console.log("Dados encontrados:", JSON.stringify(dados, null, 2));
    // const data = dados.series.baseline.data;
    // console.log("Série de dados da linha de base:");
    // console.log(JSON.stringify(data, null, 2));

    await browser.close();
    
    return JSON.stringify(dados, null, 2);
}