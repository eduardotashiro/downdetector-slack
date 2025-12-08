export interface ServiceProperties {
    id: number;
    status: string;
    company: string;
    max_baseline: number;
    min_baseline: number;
    max: number;
    regionalCommunicate: boolean;
    communicate: {
        created_at: string;
        message: string;
    } | null;
    relatedCompanies: Array<{
        name: string;
        domain: string;
        url: string;
        countryIso2: string;
    }>;
    series: {
        reports: {
            label: string;
            data: Array<{ x: string; y: number }>;
        };
        baseline: {
            label: string;
            data: Array<{ x: string; y: number }>;
        };
    };
}

declare global {
    interface Window {
        DD?: {
            currentServiceProperties?: ServiceProperties;
        };
    }
}