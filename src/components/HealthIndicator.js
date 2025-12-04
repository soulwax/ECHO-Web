import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// File: src/components/HealthIndicator.tsx
import { useEffect, useState } from 'react';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';
import './HealthIndicator.css';
export default function HealthIndicator() {
    const [health, setHealth] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const checkHealth = async () => {
        try {
            const healthPort = import.meta.env.VITE_HEALTH_PORT || '3002';
            const healthUrl = import.meta.env.VITE_HEALTH_URL || `http://localhost:${healthPort}`;
            const response = await fetch(`${healthUrl}/health`);
            const data = await response.json();
            setHealth(data);
            setIsLoading(false);
        }
        catch (error) {
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
        return (_jsxs("div", { className: "health-indicator loading", children: [_jsx("div", { className: "health-dot pulsing" }), _jsx("span", { className: "health-text", children: "Checking status..." })] }));
    }
    if (!health || health.status === 'error') {
        return (_jsxs("div", { className: "health-indicator offline", children: [_jsx(HiXCircle, { className: "health-icon" }), _jsxs("div", { className: "health-info", children: [_jsx("span", { className: "health-text", children: "Offline" }), _jsx("span", { className: "health-subtext", children: "Bot is not responding" })] })] }));
    }
    if (health.status === 'ok' && health.ready) {
        return (_jsxs("div", { className: "health-indicator online", children: [_jsx(HiCheckCircle, { className: "health-icon" }), _jsxs("div", { className: "health-info", children: [_jsx("span", { className: "health-text", children: "Online" }), _jsxs("span", { className: "health-subtext", children: [health.guilds !== undefined && `${health.guilds} server${health.guilds !== 1 ? 's' : ''}`, health.uptimeFormatted && ` • Uptime: ${health.uptimeFormatted}`] })] })] }));
    }
    return (_jsxs("div", { className: "health-indicator starting", children: [_jsx("div", { className: "health-dot pulsing" }), _jsxs("div", { className: "health-info", children: [_jsx("span", { className: "health-text", children: "Starting" }), _jsx("span", { className: "health-subtext", children: "Bot is initializing" })] })] }));
}
