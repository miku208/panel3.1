const db = require('../../lib/db');

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
        const { userId, role } = req.body;
        
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const admin = await db.getOne('SELECT role FROM users WHERE id = ?', [authUser.id]);
        
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const targetUser = await db.getOne('SELECT id FROM users WHERE id = ?', [userId]);
        
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        await db.update('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};