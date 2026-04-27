const bcrypt = require('bcryptjs');
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
        const { fullname, email, password, role } = req.body;
        
        const admin = await db.getOne('SELECT role FROM users WHERE id = ?', [authUser.id]);
        
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        if (!fullname || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const existing = await db.getOne('SELECT id FROM users WHERE email = ?', [email]);
        
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role === 'admin' ? 'admin' : 'user';
        
        const userId = await db.insert(
            'INSERT INTO users (full_name, email, password, role, status) VALUES (?, ?, ?, ?, "active")',
            [fullname, email, hashedPassword, userRole]
        );
        
        res.json({ success: true, userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};