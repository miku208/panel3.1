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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    const authUser = getUserFromToken(token);
    
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const user = await db.getOne('SELECT id, email, full_name, role, status FROM users WHERE id = ?', [authUser.id]);
        
        if (!user || user.status === 'banned') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Get user's servers from database
        const servers = await db.query(
            'SELECT id, server_id, server_name, server_type, status, created_at FROM user_servers WHERE user_id = ? ORDER BY created_at DESC',
            [user.id]
        );
        
        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullname: user.full_name,
                role: user.role,
                status: user.status
            },
            servers: servers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};