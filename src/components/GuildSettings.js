import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// File: src/components/GuildSettings.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './GuildSettings.css';
export default function GuildSettings({ guild, onBack }) {
    const { isAuthenticated } = useAuth();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    useEffect(() => {
        if (!guild || !isAuthenticated) {
            setLoading(false);
            return;
        }
        const fetchSettings = async () => {
            try {
                setLoading(true);
                setError(null);
                const authApiUrl = import.meta.env.PROD
                    ? (import.meta.env.VITE_AUTH_API_URL || '/api')
                    : '/api';
                const response = await fetch(`${authApiUrl}/guilds/${guild.id}/settings`, {
                    credentials: 'include',
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        setError('Please log in to view settings');
                        return;
                    }
                    if (response.status === 403) {
                        setError('You do not have access to this server');
                        return;
                    }
                    throw new Error('Failed to fetch settings');
                }
                const data = await response.json();
                setSettings(data.settings);
            }
            catch (err) {
                console.error('Error fetching settings:', err);
                setError('Failed to load settings');
            }
            finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [guild, isAuthenticated]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!guild || !settings)
            return;
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);
            const authApiUrl = import.meta.env.PROD
                ? (import.meta.env.VITE_AUTH_API_URL || '/api')
                : '/api';
            const response = await fetch(`${authApiUrl}/guilds/${guild.id}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(settings),
            });
            if (!response.ok) {
                if (response.status === 401) {
                    setError('Please log in to update settings');
                    return;
                }
                if (response.status === 403) {
                    setError('You do not have permission to update settings');
                    return;
                }
                throw new Error('Failed to update settings');
            }
            const data = await response.json();
            setSettings(data.settings);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        catch (err) {
            console.error('Error updating settings:', err);
            setError('Failed to save settings');
        }
        finally {
            setSaving(false);
        }
    };
    const handleChange = (field, value) => {
        if (!settings)
            return;
        setSettings({
            ...settings,
            [field]: value,
        });
    };
    const getGuildIconUrl = (guildId, icon) => {
        if (!icon)
            return null;
        return `https://cdn.discordapp.com/icons/${guildId}/${icon}.png`;
    };
    if (!guild) {
        return null;
    }
    if (loading) {
        return (_jsx("div", { className: "guild-settings", children: _jsx("div", { className: "settings-loading", children: _jsx("span", { children: "Loading settings..." }) }) }));
    }
    if (error && !settings) {
        return (_jsx("div", { className: "guild-settings", children: _jsxs("div", { className: "settings-error", children: [_jsx("span", { children: error }), _jsx("button", { onClick: onBack, className: "back-button", children: "Back to Servers" })] }) }));
    }
    if (!settings) {
        return null;
    }
    return (_jsxs("div", { className: "guild-settings", children: [_jsxs("div", { className: "settings-header", children: [_jsx("button", { onClick: onBack, className: "back-button", children: "\u2190 Back" }), _jsxs("div", { className: "guild-header-info", children: [getGuildIconUrl(guild.id, guild.icon) ? (_jsx("img", { src: getGuildIconUrl(guild.id, guild.icon), alt: guild.name, className: "guild-header-icon" })) : (_jsx("div", { className: "guild-header-icon-placeholder", children: guild.name.substring(0, 2).toUpperCase() })), _jsxs("h2", { className: "guild-header-name", children: [guild.name, " Settings"] })] })] }), _jsxs("div", { className: "settings-content", children: [error && (_jsx("div", { className: "settings-message error", children: error })), success && (_jsx("div", { className: "settings-message success", children: "Settings saved successfully!" })), _jsxs("form", { onSubmit: handleSubmit, className: "settings-form", children: [_jsxs("div", { className: "settings-section", children: [_jsx("h3", { className: "section-title", children: "Playlist Settings" }), _jsxs("div", { className: "setting-field", children: [_jsxs("label", { htmlFor: "playlistLimit", children: ["Playlist Limit", _jsx("span", { className: "field-description", children: "Maximum number of tracks that can be added from a playlist" })] }), _jsx("input", { type: "number", id: "playlistLimit", min: "1", max: "200", value: settings.playlistLimit, onChange: (e) => handleChange('playlistLimit', parseInt(e.target.value) || 50) })] })] }), _jsxs("div", { className: "settings-section", children: [_jsx("h3", { className: "section-title", children: "Queue Settings" }), _jsxs("div", { className: "setting-field", children: [_jsxs("label", { htmlFor: "defaultQueuePageSize", children: ["Default Queue Page Size", _jsx("span", { className: "field-description", children: "Number of tracks shown per page in the queue command" })] }), _jsx("input", { type: "number", id: "defaultQueuePageSize", min: "1", max: "30", value: settings.defaultQueuePageSize, onChange: (e) => handleChange('defaultQueuePageSize', parseInt(e.target.value) || 10) })] }), _jsx("div", { className: "setting-field", children: _jsxs("label", { htmlFor: "queueAddResponseEphemeral", children: [_jsx("input", { type: "checkbox", id: "queueAddResponseEphemeral", checked: settings.queueAddResponseEphemeral, onChange: (e) => handleChange('queueAddResponseEphemeral', e.target.checked) }), "Hide Queue Add Responses", _jsx("span", { className: "field-description", children: "Make queue add responses only visible to the user who added the track" })] }) })] }), _jsxs("div", { className: "settings-section", children: [_jsx("h3", { className: "section-title", children: "Voice Channel Settings" }), _jsxs("div", { className: "setting-field", children: [_jsxs("label", { htmlFor: "secondsToWaitAfterQueueEmpties", children: ["Wait Time After Queue Empties (seconds)", _jsx("span", { className: "field-description", children: "Time to wait before leaving the voice channel when queue empties (0 = never leave)" })] }), _jsx("input", { type: "number", id: "secondsToWaitAfterQueueEmpties", min: "0", max: "300", value: settings.secondsToWaitAfterQueueEmpties, onChange: (e) => handleChange('secondsToWaitAfterQueueEmpties', parseInt(e.target.value) || 30) })] }), _jsx("div", { className: "setting-field", children: _jsxs("label", { htmlFor: "leaveIfNoListeners", children: [_jsx("input", { type: "checkbox", id: "leaveIfNoListeners", checked: settings.leaveIfNoListeners, onChange: (e) => handleChange('leaveIfNoListeners', e.target.checked) }), "Leave If No Listeners", _jsx("span", { className: "field-description", children: "Automatically leave when all other participants leave the voice channel" })] }) })] }), _jsxs("div", { className: "settings-section", children: [_jsx("h3", { className: "section-title", children: "Volume Settings" }), _jsxs("div", { className: "setting-field", children: [_jsxs("label", { htmlFor: "defaultVolume", children: ["Default Volume", _jsx("span", { className: "field-description", children: "Default volume level (0-100)" })] }), _jsx("input", { type: "number", id: "defaultVolume", min: "0", max: "100", value: settings.defaultVolume, onChange: (e) => handleChange('defaultVolume', parseInt(e.target.value) || 100) })] }), _jsx("div", { className: "setting-field", children: _jsxs("label", { htmlFor: "turnDownVolumeWhenPeopleSpeak", children: [_jsx("input", { type: "checkbox", id: "turnDownVolumeWhenPeopleSpeak", checked: settings.turnDownVolumeWhenPeopleSpeak, onChange: (e) => handleChange('turnDownVolumeWhenPeopleSpeak', e.target.checked) }), "Auto-Duck When People Speak", _jsx("span", { className: "field-description", children: "Automatically lower volume when people are speaking" })] }) }), settings.turnDownVolumeWhenPeopleSpeak && (_jsxs("div", { className: "setting-field", children: [_jsxs("label", { htmlFor: "turnDownVolumeWhenPeopleSpeakTarget", children: ["Duck Volume Target", _jsx("span", { className: "field-description", children: "Volume level to lower to when people speak (0-100)" })] }), _jsx("input", { type: "number", id: "turnDownVolumeWhenPeopleSpeakTarget", min: "0", max: "100", value: settings.turnDownVolumeWhenPeopleSpeakTarget, onChange: (e) => handleChange('turnDownVolumeWhenPeopleSpeakTarget', parseInt(e.target.value) || 20) })] }))] }), _jsxs("div", { className: "settings-section", children: [_jsx("h3", { className: "section-title", children: "Announcement Settings" }), _jsx("div", { className: "setting-field", children: _jsxs("label", { htmlFor: "autoAnnounceNextSong", children: [_jsx("input", { type: "checkbox", id: "autoAnnounceNextSong", checked: settings.autoAnnounceNextSong, onChange: (e) => handleChange('autoAnnounceNextSong', e.target.checked) }), "Auto-Announce Next Song", _jsx("span", { className: "field-description", children: "Automatically announce when the next song starts playing" })] }) })] }), _jsx("div", { className: "settings-actions", children: _jsx("button", { type: "submit", className: "save-button", disabled: saving, children: saving ? 'Saving...' : 'Save Settings' }) })] })] })] }));
}
