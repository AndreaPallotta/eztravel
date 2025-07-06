const router = require('express').Router();
const { select, insert } = require('../../utils/db');
const { Logger } = require('../../utils/logger');
const bcrypt = require('bcrypt');

const signUp = async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const existing = await select.getUserByEmail(email);
        if (existing) return res.status(409).json({ error: 'User already exists' });

        const hashed = await bcrypt.hash(password, 10);
        const success = await insert.insertUser(email, hashed, first_name, last_name);

        if (!success) throw new Error('Failed to insert user');
        res.status(201).json({ success: true });
    } catch (err) {
        Logger.error(`Signup failed: ${err.message}`);
        res.status(500).json({ error: 'Signup failed' });
    }
};

const signIn = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }

    try {
        const user = await select.getUserByEmail(email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        res.status(200).json({ success: true, user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            created_at: user.created_at,
        }});
    } catch (err) {
        Logger.error(`Signin failed: ${err.message}`);
        res.status(500).json({ error: 'Signin failed' });
    }
}

router.post('/signup', signUp);
router.post('/signin', signIn);

module.exports = router;
