const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
    try {
        let { username, email, password } = req.body;
        
        // Trim inputs
        username = typeof username === 'string' ? username.trim() : '';
        email = typeof email === 'string' ? email.trim() : '';
        password = typeof password === 'string' ? password : '';

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email address format' });
        }

        // Username format validation
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' });
        }

        // Password complexity validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character' });
        }

        const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: { $regex: new RegExp(`^${username}$`, 'i') } }] });
        if (existingUser) return res.status(400).json({ message: 'Username or email already exists' });

        const passwordHash = await bcrypt.hash(password, 10);
        
        const user = await User.create({ 
            username, 
            email: email.toLowerCase(), 
            passwordHash,
            isVerified: true
        });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.status(201).json({ 
            message: 'Registered successfully', 
            token, 
            user: { _id: user._id, username: user.username, email: user.email } 
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;
        
        email = typeof email === 'string' ? email.trim() : '';
        password = typeof password === 'string' ? password : '';

        if (!email || !password) {
            return res.status(400).json({ message: 'Email/Username and Password are required' });
        }

        // Search case-insensitively for email or exact username
        const user = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() }, 
                { username: { $regex: new RegExp(`^${email}$`, 'i') } }
            ] 
        });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ message: 'Logged in successfully', token, user: { _id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
};

exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};