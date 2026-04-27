const db = require('../lib/db');

function getUserFromToken(token) {
    if (!token) return null;
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [userId] = decoded.split(':');
        return { id: parseInt(userId) };
    } catch {
        return null;
    }
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    const authUser = getUserFromToken(token);
    
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const { serverId } = req.body;
        
        const user = await db.getOne('SELECT id, role, status FROM users WHERE id = ?', [authUser.id]);
        
        if (!user || user.status === 'banned') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Get Pterodactyl settings
        const settings = await db.getPterodactylSettings();
        
        if (!settings.ptero_api_key || !settings.ptero_url) {
            return res.status(500).json({ error: 'Pterodactyl not configured' });
        }
        
        // Delete server via Pterodactyl API
        const response = await fetch(`${settings.ptero_url}/api/application/servers/${serverId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${settings.ptero_api_key}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok && response.status !== 404) {
            const data = await response.json();
            throw new Error(data.errors?.[0]?.detail || 'Failed to delete server');
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};