import express, { json } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const { sign, verify } = jwt
const { compare, hashSync } = bcrypt

const app = express()
const PORT = process.env.PORT || 4001

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'dev-access-secret'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret'

// CORS
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.options('*', cors())

app.use(json())
app.use(cookieParser())

// In-memory DB
const users = [
    { id: '1', email: 'admin@site', name: 'Admin User', passwordHash: hashSync('admin', 8), type: 'admin' },
    { id: '2', email: 'user@example.com', name: 'Test User', passwordHash: hashSync('user', 8), type: 'student' }
]
const refreshTokens = new Set()

const generateAccessToken = (user) => sign(
    { sub: user.id, type: user.type, email: user.email, name: user.name },
    ACCESS_SECRET,
    { expiresIn: '15m' }
)

const generateRefreshToken = (user) => sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: '7d' })

// LOGIN
app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' })

    const user = users.find(u => u.email === email)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)
    refreshTokens.add(refreshToken)

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000
    })

    return res.json({
        user: { id: user.id, email: user.email, name: user.name, type: user.type },
        accessToken
    })
})

// SIGNUP
app.post('/api/v1/auth/signup', async (req, res) => {
    const { name, email, password } = req.body || {}
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' })

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email' })

    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (exists) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = hashSync(password, 8)
    const newUser = {
        id: String(users.length + 1),
        email: email.toLowerCase(),
        name,
        passwordHash,
        type: 'student'
    }

    users.push(newUser)

    const accessToken = generateAccessToken(newUser)
    const refreshToken = generateRefreshToken(newUser)
    refreshTokens.add(refreshToken)

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000
    })

    return res.status(201).json({
        user: { id: newUser.id, email: newUser.email, name: newUser.name, type: newUser.type },
        accessToken
    })
})

// REFRESH
app.post('/api/v1/auth/refresh', (req, res) => {
    const token = req.cookies.refreshToken
    if (!token || !refreshTokens.has(token)) return res.status(401).json({ error: 'Invalid refresh token' })

    try {
        const payload = verify(token, REFRESH_SECRET)
        const user = users.find(u => u.id === payload.sub)
        if (!user) return res.status(401).json({ error: 'User not found' })

        const accessToken = generateAccessToken(user)
        return res.json({ accessToken })
    } catch (e) {
        return res.status(401).json({ error: 'Invalid refresh token' })
    }
})

// LOGOUT
app.post('/api/v1/auth/logout', (req, res) => {
    const token = req.cookies.refreshToken
    if (token) refreshTokens.delete(token)
    res.clearCookie('refreshToken')
    return res.json({ ok: true })
})

// MIDDLEWARES
const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization
    if (!header) return res.status(401).json({ error: 'Missing auth' })
    const token = header.split(' ')[1]
    try {
        req.user = verify(token, ACCESS_SECRET)
        next()
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' })
    }
}

const adminOnly = (req, res, next) => {
    if (req.user?.type !== 'admin') return res.status(403).json({ error: 'Admin only' })
    next()
}

// ME
app.get('/api/v1/auth/me', authMiddleware, (req, res) => {
    const u = users.find(x => x.id === req.user.sub)
    if (!u) return res.status(404).json({ error: 'User not found' })
    return res.json({ id: u.id, email: u.email, name: u.name, type: u.type })
})

// ADMIN STATS
app.get('/api/v1/admin/stats', authMiddleware, adminOnly, (req, res) => {
    return res.json({
        totalColleges: 1204,
        pendingReviews: 32,
        newLeadsToday: 18,
        featuredColleges: 5,
        traffic: []
    })
})

app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`))