export interface ServiceStatus {

    template: string,
    service: string,
    category: string,
    outage: boolean

}
        // window.PogoConfig = {"template":"status","service":"pix","category":"Payments, Cards and Transaction Networks","outage":false}; F** DD  nem para me falar que mudou como expoem os daddos 

declare global {
    interface Window {
       PogoConfig?: {
            outage: ServiceStatus;
        };
    }
}