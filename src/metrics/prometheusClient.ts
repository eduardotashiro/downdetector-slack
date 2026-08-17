import client from 'prom-client';
const register = new client.Registry();


export const serviceStatusMetric = new client.Gauge({
  name: 'downdetector_service_status',
  help: 'Status do serviço monitorado pelo Downdetector: 0 = success, 1 = warning, 2 = danger',
  labelNames: ['service'],
  registers: [register]
});

export async function metricsEndpoint(_req: any, res: any) {
  res.set('Content-Type', register.contentType);
  res.end( await register.metrics());
}

export function normalizeServiceName(service: string): string {
  return service
    .toLowerCase()                        // "banco itaú"
    .normalize("NFD")                     // separa a letra do acento : "itaú" vira "i,t,a,u,´"
    .replace(/[\u0300-\u036f]/g, "")      // 'apaga' os acentos soltos : "banco itau"
    .replace(/\s+/g, "_")                 // espaço vira _ : "banco_itau"
    .replace(/[^a-z0-9_]/g, "");          // segurança: apaga qualquer resto não permitido
}

export function updateServiceStatus(service: string, status: number) {
  serviceStatusMetric.set({ service }, status);
}
