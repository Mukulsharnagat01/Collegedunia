import express, { json } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4001

// --- MONGODB CONNECT ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin123@clusterone.mym38ni.mongodb.net/collegedunia?retryWrites=true&w=majority'

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err))

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    type: { type: String, default: 'student' },
    phone: String,
    city: String,
    course: String
}, { timestamps: true })

const collegeSchema = new mongoose.Schema({
    name: String,
    location: String,
    rating: Number,
    fees: Number,
    image: String
}, { timestamps: true })

const User = mongoose.model('User', userSchema)
const College = mongoose.model('College', collegeSchema)

// --- MIDDLEWARE ---
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(json())
app.use(cookieParser())

const { sign, verify } = jwt
const { hashSync, compare } = bcrypt

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'dev-access-secret'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret'

const refreshTokens = new Set()

// --- JWT HELPERS ---
const generateAccessToken = (user) => sign(
    { sub: user._id, type: user.type, email: user.email, name: user.name },
    ACCESS_SECRET,
    { expiresIn: '15m' }
)

const generateRefreshToken = (user) => sign(
    { sub: user._id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
)

// --- AUTH MIDDLEWARE ---
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Missing token' })

    try {
        const payload = verify(token, ACCESS_SECRET)
        const user = await User.findById(payload.sub).select('-passwordHash')
        if (!user) throw new Error('User not found')
        req.user = user
        next()
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' })
    }
}

const adminOnly = (req, res, next) => {
    if (req.user.type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' })
    }
    next()
}

// --- AUTO-CREATE ADMIN ON STARTUP ---
User.findOne({ email: 'admin@site' }).then(async (user) => {
    if (!user) {
        const passwordHash = hashSync('admin', 8)
        await User.create({
            name: 'Admin User',
            email: 'admin@site',
            passwordHash,
            type: 'admin'
        })
        console.log('Admin created: admin@site / admin')
    }
})

// --- ROUTES ---

// SIGNUP
app.post('/api/v1/auth/signup', async (req, res) => {
    const { name, email, password, phone, city, course } = req.body
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password required' })
    }

    try {
        const exists = await User.findOne({ email: email.toLowerCase() })
        if (exists) return res.status(409).json({ error: 'Email already registered' })

        const passwordHash = hashSync(password, 8)
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            passwordHash,
            phone,
            city,
            course
        })

        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)
        refreshTokens.add(refreshToken)

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        res.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                type: user.type
            },
            accessToken
        })
    } catch (err) {
        res.status(500).json({ error: 'Signup failed' })
    }
})

// LOGIN
app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' })
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user) return res.status(401).json({ error: 'Invalid credentials' })

        const valid = await compare(password, user.passwordHash)
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)
        refreshTokens.add(refreshToken)

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                type: user.type
            },
            accessToken
        })
    } catch (err) {
        res.status(500).json({ error: 'Login failed' })
    }
})

// REFRESH TOKEN
app.post('/api/v1/auth/refresh', (req, res) => {
    const token = req.cookies.refreshToken
    if (!token || !refreshTokens.has(token)) {
        return res.status(401).json({ error: 'Invalid refresh token' })
    }

    try {
        const payload = verify(token, REFRESH_SECRET)
        User.findById(payload.sub).then(user => {
            if (!user) throw new Error()
            const newAccessToken = generateAccessToken(user)
            res.json({ accessToken: newAccessToken })
        })
    } catch (e) {
        res.status(401).json({ error: 'Invalid refresh token' })
    }
})

// LOGOUT
app.post('/api/v1/auth/logout', (req, res) => {
    const token = req.cookies.refreshToken
    if (token) refreshTokens.delete(token)
    res.clearCookie('refreshToken')
    res.json({ ok: true })
})

// ME (GET CURRENT USER)
app.get('/api/v1/auth/me', authMiddleware, async (req, res) => {
    res.json({
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        type: req.user.type
    })
})

// --- ADMIN CRUD: COLLEGES ---
app.get('/api/v1/admin/colleges', authMiddleware, adminOnly, async (req, res) => {
    try {
        const colleges = await College.find().sort({ createdAt: -1 })
        res.json(colleges)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch colleges' })
    }
})

app.post('/api/v1/admin/colleges', authMiddleware, adminOnly, async (req, res) => {
    try {
        const college = await College.create(req.body)
        res.status(201).json(college)
    } catch (err) {
        res.status(400).json({ error: 'Invalid data' })
    }
})

app.put('/api/v1/admin/colleges/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const college = await College.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        if (!college) return res.status(404).json({ error: 'Not found' })
        res.json(college)
    } catch (err) {
        res.status(400).json({ error: 'Update failed' })
    }
})

app.delete('/api/v1/admin/colleges/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await College.findByIdAndDelete(req.params.id)
        if (!result) return res.status(404).json({ error: 'Not found' })
        res.json({ ok: true })
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' })
    }
})

// --- HEALTH CHECK ---
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'OK', mongodb: mongoose.connection.readyState === 1 })
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})