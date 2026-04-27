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
        const { name, type } = req.body;
        
        const user = await db.getOne('SELECT id, role, status FROM users WHERE id = ?', [authUser.id]);
        
        if (!user || user.status === 'banned') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Get Pterodactyl settings
        const settings = await db.getPterodactylSettings();
        
        if (!settings.ptero_api_key || !settings.ptero_url) {
            return res.status(500).json({ error: 'Pterodactyl not configured' });
        }
        
        // Create server via Pterodactyl API
        const response = await fetch(`${settings.ptero_url}/api/application/servers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.ptero_api_key}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                user: user.id,
                egg: type === 'minecraft' ? 1 : 2, // Example egg IDs
                docker_image: type === 'minecraft' ? 'ghcr.io/pterodactyl/yolks:java_17' : 'ghcr.io/parkervcp/yolks:nodejs_18',
                startup: type === 'minecraft' ? 'java -Xmx1024M -Xms1024M -jar server.jar nogui' : 'npm start',
                environment: {},
                limits: {
                    memory: 1024,
                    swap: 0,
                    disk: 5120,
                    io: 500,
                    cpu: 100
                },
                feature_limits: {
                    databases: 1,
                    allocations: 1,
                    backups: 1
                }
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errors?.[0]?.detail || 'Failed to create server');
        }
        
        res.json({ success: true, server: data.attributes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};