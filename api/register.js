const bcrypt = require('bcryptjs');
const db = require('../lib/db');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { fullname, email, password } = req.body;
        
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
        
        const userId = await db.insert(
            'INSERT INTO users (full_name, email, password, role, status) VALUES (?, ?, ?, "user", "active")',
            [fullname, email, hashedPassword]
        );
        
        res.json({ success: true, userId, message: 'Registration successful! Please login.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};