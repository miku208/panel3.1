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
        
        // Check if server belongs to user
        const userServer = await db.getOne(
            'SELECT server_id FROM user_servers WHERE user_id = ? AND server_id = ?',
            [user.id, serverId]
        );
        
        if (!userServer && user.role !== 'admin') {
            return res.status(403).json({ error: 'You do not own this server' });
        }
        
        // Get Pterodactyl settings
        const settings = await db.getPterodactylSettings();
        
        if (settings.ptero_api_key && settings.ptero_url) {
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
                console.error('Pterodactyl delete error:', data);
                // Continue to delete from local DB even if Pterodactyl fails
            }
        }
        
        // Delete from database
        await db.deleteQuery(
            'DELETE FROM user_servers WHERE server_id = ?',
            [serverId]
        );
        
        res.json({ success: true, message: 'Server deleted successfully' });
    } catch (error) {
        console.error('Delete server error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete server' });
    }
};