import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// File: src/components/DiscordGuildsSidebar.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './DiscordGuildsSidebar.css';
export default function DiscordGuildsSidebar({ onGuildSelect, selectedGuildId }) {
    const { isAuthenticated, session } = useAuth();
    const [guilds, setGuilds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        const fetchGuilds = async () => {
            try {
                setLoading(true);
                const authApiUrl = import.meta.env.PROD
                    ? (import.meta.env.VITE_AUTH_API_URL || '/api')
                    : '/api';
                const response = await fetch(`${authApiUrl}/guilds`, {
                    credentials: 'include',
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        setError(null);
                        setGuilds([]);
                        return;
                    }
                    throw new Error('Failed to fetch guilds');
                }
                const data = await response.json();
                setGuilds(data.guilds || []);
                setError(null);
            }
            catch (err) {
                console.error('Error fetching guilds:', err);
                setError('Failed to load servers');
                setGuilds([]);
            }
            finally {
                setLoading(false);
            }
        };
        fetchGuilds();
    }, [isAuthenticated, session]);
    if (!isAuthenticated) {
        return null;
    }
    const getGuildIconUrl = (guildId, icon) => {
        if (!icon) {
            return null;
        }
        // Discord CDN URL for guild icons
        return `https://cdn.discordapp.com/icons/${guildId}/${icon}.png`;
    };
    const getGuildInitials = (name) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };
    return (_jsxs("div", { className: "discord-guilds-sidebar", children: [_jsx("div", { className: "sidebar-header", children: _jsx("h3", { className: "sidebar-title", children: "Your Servers" }) }), _jsx("div", { className: "sidebar-content", children: loading ? (_jsx("div", { className: "sidebar-loading", children: _jsx("span", { children: "Loading servers..." }) })) : error ? (_jsx("div", { className: "sidebar-error", children: _jsx("span", { children: error }) })) : guilds.length === 0 ? (_jsx("div", { className: "sidebar-empty", children: _jsx("span", { children: "No servers found" }) })) : (_jsx("div", { className: "guilds-list", children: guilds.map((guild) => (_jsxs("div", { className: `guild-item ${selectedGuildId === guild.id ? 'selected' : ''}`, title: guild.name, onClick: () => onGuildSelect?.(guild), role: "button", tabIndex: 0, onKeyDown: (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onGuildSelect?.(guild);
                            }
                        }, children: [getGuildIconUrl(guild.id, guild.icon) ? (_jsx("img", { src: getGuildIconUrl(guild.id, guild.icon), alt: guild.name, className: "guild-icon" })) : (_jsx("div", { className: "guild-icon-placeholder", children: getGuildInitials(guild.name) })), _jsx("span", { className: "guild-name", children: guild.name })] }, guild.id))) })) })] }));
}
