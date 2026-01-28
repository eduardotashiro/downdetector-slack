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

    for (const banco of allData) {
        if (banco.nome === ServiceName.PIX) {
            await tratarPix(banco);
        }
        else if (banco.nome === ServiceName.ITAU) {
            await tratarItau(banco);
        }
        else if (banco.nome === ServiceName.BRADESCO) {
            await tratarBradesco(banco);
        }
        else if (banco.nome === ServiceName.SANTANDER) {
            await tratarSantander(banco);
        }
        else if (banco.nome === ServiceName.BANCO_DO_BRASIL) {
            await tratarBB(banco);
        }
        else if (banco.nome === ServiceName.NUBANK) {
            await tratarNubank(banco);
        }
        else if (banco.nome === ServiceName.MERCADO_PAGO) {
            await tratarMercadoPago(banco);
        }
        else if (banco.nome === ServiceName.PICPAY) {
            await tratarPicPay(banco);
        }
    }
}