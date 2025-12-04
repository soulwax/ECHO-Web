// File: src/components/HealthIndicator.tsx

import { useEffect, useState } from 'react';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';
import './HealthIndicator.css';

interface HealthStatus {
  status: 'ok' | 'not_ready' | 'error';
  ready: boolean;
  guilds?: number;
  uptime?: number;
  uptimeFormatted?: string;
  timestamp?: string;
}

export default function HealthIndicator() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkHealth = async () => {
    try {
      const healthPort = import.meta.env.VITE_HEALTH_PORT || '3002';
      const healthUrl = import.meta.env.VITE_HEALTH_URL || `http://localhost:${healthPort}`;

      const response = await fetch(`${healthUrl}/health`);
      const data = await response.json();
      setHealth(data);
      setIsLoading(false);
    } catch (error) {
      setHealth({
        status: 'error',
        ready: false,
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="health-indicator loading">
        <div className="health-dot pulsing"></div>
        <span className="health-text">Checking status...</span>
      </div>
    );
  }

  if (!health || health.status === 'error') {
    return (
      <div className="health-indicator offline">
        <HiXCircle className="health-icon" />
        <div className="health-info">
          <span className="health-text">Offline</span>
          <span className="health-subtext">Bot is not responding</span>
        </div>
      </div>
    );
  }

  if (health.status === 'ok' && health.ready) {
    return (
      <div className="health-indicator online">
        <HiCheckCircle className="health-icon" />
        <div className="health-info">
          <span className="health-text">Online</span>
          <span className="health-subtext">
            {health.guilds !== undefined && `${health.guilds} server${health.guilds !== 1 ? 's' : ''}`}
            {health.uptimeFormatted && ` • Uptime: ${health.uptimeFormatted}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="health-indicator starting">
      <div className="health-dot pulsing"></div>
      <div className="health-info">
        <span className="health-text">Starting</span>
        <span className="health-subtext">Bot is initializing</span>
      </div>
    </div>
  );
}
