export interface ServiceProperties {
    id: number;
    status: string;
    company: string;
    max: number;
    series: {
        reports: {
            data: Array<{ x: string; y: number }>;
        };
    };
}

declare global {
    interface Window {
        DD?: {
            currentServiceProperties: ServiceProperties;
        };
    }
}