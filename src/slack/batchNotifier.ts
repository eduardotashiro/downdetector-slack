import { checkAllServices } from "../pages/batchPages.js";
import { ServiceName } from "./types.js";
import { checkWarningGlobal,registerWarningGlobal } from "./warningGlobal.js";
import { handleBancoDoBrasil }from"./services/bancoDoBrasil.js";
import { handleMercadoPago } from"./services/mercadoPago.js";
import { handleSantander } from "./services/santander.js";
import { handleBradesco } from "./services/bradesco.js";
import { handlePicPay } from  "./services/picPay.js";
import { handleNubank } from "./services/nubank.js";
import { handleItau } from  "./services/itau.js";
import { handlePix } from  "./services/pix.js";


export async function CheckAll() {

    const allData = await checkAllServices();

    for (const bank of allData) {
        registerWarningGlobal(bank);
    }

    for (const bank of allData) {
        if (bank.name === ServiceName.PIX) {
            await handlePix(bank);
        }
        else if (bank.name === ServiceName.ITAU) {
            await handleItau(bank);
        }
        else if (bank.name === ServiceName.BRADESCO) {
            await handleBradesco(bank);
        }
        else if (bank.name === ServiceName.SANTANDER) {
            await handleSantander(bank);
        }
        else if (bank.name === ServiceName.BANCO_DO_BRASIL) {
            await handleBancoDoBrasil(bank);
        }
        else if (bank.name === ServiceName.NUBANK) {
            await handleNubank(bank);
        }
        else if (bank.name === ServiceName.MERCADO_PAGO) {
            await handleMercadoPago(bank);
        }
        else if (bank.name === ServiceName.PICPAY) {
            await handlePicPay(bank);
        }
    }

    await checkWarningGlobal();

}