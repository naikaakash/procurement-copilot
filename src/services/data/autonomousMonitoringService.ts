import fs from 'fs';
import path from 'path';
import {
  getOverdueWorklist,
  getAckFollowUpQueue,
  getCoordinationAlerts
} from './csvDataService';

export interface MonitoringAnomaly {
  id: string;
  timestamp: string;
  anomaly_type: 'SAFETY_STOCK_BREACH' | 'NEW_OVERDUE_LINE' | 'CONFIRMATION_DELAY' | 'RISK_SPIKE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  po_number?: string;
  item_number?: string;
  material_id: string;
  plant: string;
  description: string;
  status: 'ACTIVE' | 'RESOLVED' | 'MUTED';
  value_at_risk: number;
}

export interface MonitoringConfig {
  isActive: boolean;
  scanIntervalSeconds: number;
  alertThresholdValue: number;
}

export interface MonitoringActivityLog {
  timestamp: string;
  type: 'HEARTBEAT' | 'SCAN_START' | 'SCAN_COMPLETE' | 'ALERT_GEN' | 'STATE_CHANGE' | 'ANOMALY_RESOLVED';
  message: string;
}

const ANOMALIES_FILE = path.join(process.cwd(), 'project_memory', 'autonomous_monitoring_anomalies.json');
const CONFIG_FILE = path.join(process.cwd(), 'project_memory', 'autonomous_monitoring_config.json');
const LOGS_FILE = path.join(process.cwd(), 'project_memory', 'autonomous_monitoring_activity.json');

interface GlobalSupervisor {
  interval: NodeJS.Timeout | null;
  startTime: string | null;
  scansCount: number;
}

const g = global as unknown as { __supervisor?: GlobalSupervisor };
if (!g.__supervisor) {
  g.__supervisor = {
    interval: null,
    startTime: null,
    scansCount: 0
  };
}

export async function getAnomalies(): Promise<MonitoringAnomaly[]> {
  try {
    if (fs.existsSync(ANOMALIES_FILE)) {
      return JSON.parse(fs.readFileSync(ANOMALIES_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to read anomalies file:', e);
  }
  return [];
}

export async function writeAnomalies(anomalies: MonitoringAnomaly[]): Promise<void> {
  try {
    fs.mkdirSync(path.dirname(ANOMALIES_FILE), { recursive: true });
    fs.writeFileSync(ANOMALIES_FILE, JSON.stringify(anomalies, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to write anomalies file:', e);
  }
}

export async function getMonitoringConfig(): Promise<MonitoringConfig> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to read config file:', e);
  }
  return {
    isActive: false,
    scanIntervalSeconds: 30,
    alertThresholdValue: 5000
  };
}

export async function writeMonitoringConfig(config: MonitoringConfig): Promise<void> {
  try {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to write config file:', e);
  }
}

export async function getMonitoringLogs(): Promise<MonitoringActivityLog[]> {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to read monitoring logs file:', e);
  }
  return [];
}

export async function writeActivityLog(
  type: MonitoringActivityLog['type'],
  message: string
): Promise<void> {
  try {
    let logs: MonitoringActivityLog[] = await getMonitoringLogs();
    logs.unshift({
      timestamp: new Date().toISOString(),
      type,
      message
    });
    if (logs.length > 100) logs = logs.slice(0, 100);
    fs.mkdirSync(path.dirname(LOGS_FILE), { recursive: true });
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to write activity log:', e);
  }
}

function getUptimeString(): string {
  if (!g.__supervisor?.startTime) return '00:00:00';
  const start = new Date(g.__supervisor.startTime).getTime();
  const diffMs = new Date().getTime() - start;

  const diffSecs = Math.floor(diffMs / 1000);
  const hrs = Math.floor(diffSecs / 3600);
  const mins = Math.floor((diffSecs % 3600) / 60);
  const secs = diffSecs % 60;

  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

export async function runSupervisorScan(): Promise<MonitoringAnomaly[]> {
  await writeActivityLog('SCAN_START', 'Supervisor initiating active scanning of network nodes...');

  const [overdueRes, ackRes, coordRes, existingAnomalies] = await Promise.all([
    getOverdueWorklist({ limit: 100 }),
    getAckFollowUpQueue(),
    getCoordinationAlerts(),
    getAnomalies()
  ]);

  const newAnomalies: MonitoringAnomaly[] = [...existingAnomalies];
  let anomaliesDiscoveredThisScan = 0;

  // 1. Scan for Safety Stock Breaches
  for (const alert of coordRes.active) {
    if (alert.impact_level === 'PRODUCTION_STOPPAGE' || alert.impact_level === 'CRITICAL_SHORTAGE') {
      const anomalyId = `ANOM_SHORT_${alert.plant}_${alert.material_id}`;
      const exists = existingAnomalies.some(anom => anom.id === anomalyId);

      if (!exists) {
        const severity = alert.impact_level === 'PRODUCTION_STOPPAGE' ? 'CRITICAL' : 'HIGH';
        const desc = `Material ${alert.material_id} at Plant ${alert.plant} breached safety stock. Current Stock: ${alert.current_stock} pcs (Required: ${alert.safety_stock} pcs).`;

        const shortage = Math.max(0, alert.safety_stock - alert.current_stock);
        const price = alert.standard_price || 0;
        const valueAtRisk = shortage > 0 && price > 0 ? Math.round(shortage * price) : 15000;

        newAnomalies.push({
          id: anomalyId,
          timestamp: new Date().toISOString(),
          anomaly_type: 'SAFETY_STOCK_BREACH',
          severity,
          material_id: alert.material_id,
          plant: alert.plant,
          description: desc,
          status: 'ACTIVE',
          value_at_risk: valueAtRisk
        });
        anomaliesDiscoveredThisScan++;
        await writeActivityLog('ALERT_GEN', `[SAFETY STOCK BREACH] ${desc}`);
      }
    }
  }

  // 2. Scan for Overdue Lines with High Severity
  for (const item of overdueRes.data) {
    if (item.severity === 'CRITICAL' || item.severity === 'HIGH') {
      const anomalyId = `ANOM_PO_LATE_${item.po_number}_${item.item_number}`;
      const exists = existingAnomalies.some(anom => anom.id === anomalyId);

      if (!exists) {
        const desc = `Purchase order ${item.po_number} line ${item.item_number} is overdue by ${item.days_overdue} days. Supplier: ${item.supplier_name}.`;

        newAnomalies.push({
          id: anomalyId,
          timestamp: new Date().toISOString(),
          anomaly_type: 'NEW_OVERDUE_LINE',
          severity: item.severity,
          po_number: item.po_number,
          item_number: item.item_number,
          material_id: item.material_id,
          plant: item.plant,
          description: desc,
          status: 'ACTIVE',
          value_at_risk: Math.round(item.open_value)
        });
        anomaliesDiscoveredThisScan++;
        await writeActivityLog('ALERT_GEN', `[OVERDUE PO] ${desc}`);
      }
    }
  }

  // 3. Scan for Confirmation Delays
  for (const ack of ackRes.queue) {
    if (ack.days_overdue > 4) {
      const anomalyId = `ANOM_ACK_LATE_${ack.po_number}_${ack.item_number}`;
      const exists = existingAnomalies.some(anom => anom.id === anomalyId);

      if (!exists) {
        const desc = `Supplier ${ack.supplier_name} acknowledgement missing for PO ${ack.po_number} line ${ack.item_number} past SLA window.`;

        newAnomalies.push({
          id: anomalyId,
          timestamp: new Date().toISOString(),
          anomaly_type: 'CONFIRMATION_DELAY',
          severity: 'MEDIUM',
          po_number: ack.po_number,
          item_number: ack.item_number,
          material_id: ack.material_id,
          plant: ack.plant,
          description: desc,
          status: 'ACTIVE',
          value_at_risk: Math.round(ack.open_value)
        });
        anomaliesDiscoveredThisScan++;
        await writeActivityLog('ALERT_GEN', `[CONFIRMATION DELAY] ${desc}`);
      }
    }
  }

  await writeAnomalies(newAnomalies);

  if (g.__supervisor) {
    g.__supervisor.scansCount++;
  }

  await writeActivityLog('SCAN_COMPLETE', `Supervisor scan finished. Uptime: ${getUptimeString()}. Discovered ${anomaliesDiscoveredThisScan} new anomalies.`);
  return newAnomalies;
}

export async function startMonitoringSupervisor(intervalSeconds: number = 30): Promise<void> {
  const config = await getMonitoringConfig();
  config.isActive = true;
  config.scanIntervalSeconds = intervalSeconds;
  await writeMonitoringConfig(config);

  if (g.__supervisor?.interval) {
    clearInterval(g.__supervisor.interval);
  }

  g.__supervisor = {
    interval: setInterval(async () => {
      try {
        await runSupervisorScan();
      } catch (err) {
        console.error('Supervisor scan timer error:', err);
      }
    }, intervalSeconds * 1000),
    startTime: g.__supervisor?.startTime || new Date().toISOString(),
    scansCount: g.__supervisor?.scansCount || 0
  };

  await writeActivityLog('STATE_CHANGE', `Supervisor status: ACTIVE. Scanning cycle set to ${intervalSeconds} seconds.`);
}

export async function stopMonitoringSupervisor(): Promise<void> {
  const config = await getMonitoringConfig();
  config.isActive = false;
  await writeMonitoringConfig(config);

  if (g.__supervisor?.interval) {
    clearInterval(g.__supervisor.interval);
    g.__supervisor.interval = null;
  }

  g.__supervisor = {
    interval: null,
    startTime: null,
    scansCount: 0
  };

  await writeActivityLog('STATE_CHANGE', 'Supervisor status: STANDBY.');
}

export async function getSupervisorState(): Promise<{
  isActive: boolean;
  scanIntervalSeconds: number;
  alertThresholdValue: number;
  uptime: string;
  scansCount: number;
}> {
  const config = await getMonitoringConfig();
  return {
    isActive: !!g.__supervisor?.interval,
    scanIntervalSeconds: config.scanIntervalSeconds,
    alertThresholdValue: config.alertThresholdValue,
    uptime: getUptimeString(),
    scansCount: g.__supervisor?.scansCount || 0
  };
}

export async function resolveAnomaly(id: string): Promise<boolean> {
  const anomalies = await getAnomalies();
  const idx = anomalies.findIndex(anom => anom.id === id);
  if (idx !== -1) {
    anomalies[idx].status = 'RESOLVED';
    await writeAnomalies(anomalies);
    await writeActivityLog('ANOMALY_RESOLVED', `Anomaly ${id} resolved.`);
    return true;
  }
  return false;
}

// Auto-initialize supervisor if active in config on server start
getMonitoringConfig().then((config) => {
  if (config.isActive && !g.__supervisor?.interval) {
    startMonitoringSupervisor(config.scanIntervalSeconds);
  }
});
