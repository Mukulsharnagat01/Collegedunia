// backend/middleware.js
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.REFRESH_SECRET

export const authMiddleware = (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
    const token = auth.split(' ')[1]
    try {
        const payload = jwt.verify(token, JWT_SECRET)
        req.user = payload
        next()
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' })
    }
}

export const adminOnly = (req, res, next) => {
    if (req.user.type !== 'admin') return res.status(403).json({ error: 'Admin only' })
    next()
}

export const refreshToken = async (req, res) => {
    const cookie = req.cookies.refreshToken
    if (!cookie) return res.status(401).json({ error: 'No refresh token' })
    try {
        const payload = jwt.verify(cookie, REFRESH_SECRET)
        const accessToken = jwt.sign({ id: payload.id, type: (await import('mongoose').then(m => m.model('User')).findById(payload.id)).type }, JWT_SECRET, { expiresIn: '15m' })
        res.json({ accessToken })
    } catch (e) {
        res.status(401).json({ error: 'Invalid refresh token' })
    }
}