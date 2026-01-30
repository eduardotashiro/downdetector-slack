import { checkAllServices } from "../pages/batchPages.js";
import { tratarMercadoPago } from "./mercadoPago.js";
import { tratarSantander } from "./santander.js";
import { tratarBradesco } from "./bradesco.js";
import { tratarPicPay } from "./picPay.js";
import { tratarNubank } from "./nubank.js";
import { tratarItau } from "./itau.js";
import { tratarPix } from "./pix.js";
import { tratarBB } from "./bancoDoBrasil.js";
import { ServiceName } from "./types.js";

export async function CheckAll() {
    const allData = await checkAllServices();
    if (!allData) return;

    for (const bank of allData) {
        if (bank.name === ServiceName.PIX) {
            await tratarPix(bank);
        }
        else if (bank.name === ServiceName.ITAU) {
            await tratarItau(bank);
        }
        else if (bank.name === ServiceName.BRADESCO) {
            await tratarBradesco(bank);
        }
        else if (bank.name === ServiceName.SANTANDER) {
            await tratarSantander(bank);
        }
        else if (bank.name === ServiceName.BANCO_DO_BRASIL) {
            await tratarBB(bank);
        }
        else if (bank.name === ServiceName.NUBANK) {
            await tratarNubank(bank);
        }
        else if (bank.name === ServiceName.MERCADO_PAGO) {
            await tratarMercadoPago(bank);
        }
        else if (bank.name === ServiceName.PICPAY) {
            await tratarPicPay(bank);
        }
    }
}