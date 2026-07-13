const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../services/mail');

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
        
        // Generate a 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const user = await User.create({ 
            username, 
            email: email.toLowerCase(), 
            passwordHash,
            isVerified: false,
            verificationCode,
            verificationCodeExpires
        });

        // Send verification email
        await sendVerificationEmail(user.email, user.username, verificationCode);

        res.status(201).json({ 
            message: 'Registered successfully. Please check your email for a verification code.', 
            email: user.email 
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

        // Check if user is verified
        if (!user.isVerified) {
            // Generate a new code just in case they didn't get the first one or it expired
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.verificationCode = verificationCode;
            user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
            await user.save();
            await sendVerificationEmail(user.email, user.username, verificationCode);

            return res.status(403).json({ 
                message: 'Your account is not verified. A verification code has been sent to your email.', 
                isVerified: false, 
                email: user.email 
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ message: 'Logged in successfully', token, user: { _id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.verify = async (req, res) => {
    try {
        let { email, code } = req.body;
        email = typeof email === 'string' ? email.trim().toLowerCase() : '';
        code = typeof code === 'string' ? code.trim() : '';

        if (!email || !code) {
            return res.status(400).json({ message: 'Email and verification code are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            // Already verified, issue token to log them in
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
            return res.json({ message: 'Email already verified', token, user: { _id: user._id, username: user.username, email: user.email } });
        }

        // Validate code & expiration
        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        if (new Date() > user.verificationCodeExpires) {
            return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ 
            message: 'Account verified successfully!', 
            token, 
            user: { _id: user._id, username: user.username, email: user.email } 
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.resendCode = async (req, res) => {
    try {
        let { email } = req.body;
        email = typeof email === 'string' ? email.trim().toLowerCase() : '';

        if (!email) {
            return res.status(400).json({ message: 'Email address is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(user.email, user.username, verificationCode);

        res.json({ message: 'Verification code resent successfully!' });
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