const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { select, insert, update } = require('../../utils/db');
const { Logger } = require('../../utils/logger');
const bcrypt = require('bcrypt');
const { validateMid } = require('../../utils/middleware');

const validateSignup = [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    validateMid,
];

const validateSignin = [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validateMid,
];

const validateResetPassword = [
    body('email').isEmail(),
    body('currentPassword').isString(),
    body('newPassword').isLength({ min: 6 }),
    validateMid,
];

const signUp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, first_name, last_name } = req.body;

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await select.getUserByEmail(email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                created_at: user.created_at,
            },
        });
    } catch (err) {
        Logger.error(`Signin failed: ${err.message}`);
        res.status(500).json({ error: 'Signin failed' });
    }
};

const resetPassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    try {
        const user = await select.getUserByEmail(email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid current password' });

        const hashed = await bcrypt.hash(newPassword, 10);

        const updated = await update.updateUserPassword(user.id, hashed);
        if (!updated) throw new Error('Password update failed');

        res.status(200).json({ success: true });
    } catch (err) {
        Logger.error(`Password reset failed for ${email}: ${err.message}`);
        res.status(500).json({ error: 'Password reset failed' });
    }
};

router.post('/signup', validateSignup, signUp);
router.post('/signin', validateSignin, signIn);
router.put('/reset-password', validateResetPassword, resetPassword);

module.exports = router;
