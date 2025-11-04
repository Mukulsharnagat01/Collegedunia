import express, { json } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4002

// --- CLOUDINARY CONFIG ---
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    })
}

// --- MIDDLEWARE ---
const allowedOrigins = [
    process.env.VITE_FRONTEND_URL,
    'http://localhost:5173',
    'https://collegedunia-kr3g.onrender.com'
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(json())
app.use(cookieParser())

// Multer for image upload
const storage = multer.memoryStorage()
const upload = multer({ storage })

const { sign, verify } = jwt
const { hashSync, compare } = bcrypt

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'dev-access-secret'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret'

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
    name: { type: String, required: true },
    location: { type: String, required: true },
    rating: { type: Number, min: 0, max: 10 },
    fees: Number,
    image: String
}, { timestamps: true })

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    duration: String,
    fees: Number,
    description: String
}, { timestamps: true })

const examSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: Date,
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    description: String
}, { timestamps: true })

const User = mongoose.model('User', userSchema)
const College = mongoose.model('College', collegeSchema)
const Course = mongoose.model('Course', courseSchema)
const Exam = mongoose.model('Exam', examSchema)

// --- AUTH MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
    const token = auth.split(' ')[1]
    try {
        const payload = verify(token, process.env.JWT_SECRET || 'superstrongsecret123')
        req.user = payload
        next()
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' })
    }
}

const adminOnly = (req, res, next) => {
    if (req.user.type !== 'admin') return res.status(403).json({ error: 'Admin only' })
    next()
}

// --- AUTH ROUTES ---
// Add new signup route
app.post('/api/v1/auth/signup', async (req, res) => {
    const { name, email, password, type } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' })

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return res.status(400).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        type: type || 'student'
    })

    const accessToken = sign({ id: user._id, type: user.type }, process.env.JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' })

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            type: user.type
        },
        accessToken
    })
})

// --- AUTH ROUTES ---
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const accessToken = sign({ id: user._id, type: user.type }, process.env.JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' })

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            type: user.type
        },
        accessToken
    })
})

// Existing Logout (assuming truncated)
app.post('/api/v1/auth/logout', (req, res) => {
    res.clearCookie('refreshToken')
    res.json({ ok: true })
})

// Refresh Token (assuming truncated)
app.post('/auth/refresh', async (req, res) => {
    const cookie = req.cookies.refreshToken
    if (!cookie) return res.status(401).json({ error: 'No refresh token' })

    try {
        const payload = verify(cookie, process.env.REFRESH_SECRET)
        const user = await User.findById(payload.id)
        if (!user) throw new Error()

        const accessToken = sign({ id: user._id, type: user.type }, process.env.JWT_SECRET, { expiresIn: '15m' })
        res.json({ accessToken })
    } catch (e) {
        res.status(401).json({ error: 'Invalid refresh token' })
    }
})

// Me Route (assuming truncated)
app.get('/api/v1/auth/me', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { passwordHash: _, ...safeUser } = user.toObject()
    res.json(safeUser)
})

// --- ADMIN ROUTES --- (assuming truncated, add if needed)
// Colleges CRUD
app.post('/api/v1/admin/colleges', authMiddleware, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const { name, location, rating, fees } = req.body
        let image = null
        if (req.file) {
            const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`)
            image = result.secure_url
        }
        const college = await College.create({ name, location, rating, fees, image })
        res.status(201).json(college)
    } catch (err) {
        res.status(500).json({ error: 'Failed to create college' })
    }
})

app.put('/api/v1/admin/colleges/:id', authMiddleware, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const { name, location, rating, fees } = req.body
        let image = req.body.image  // Keep existing if no new
        if (req.file) {
            const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`)
            image = result.secure_url
        }
        const college = await College.findByIdAndUpdate(
            req.params.id,
            { name, location, rating, fees, image },
            { new: true, runValidators: true }
        )
        if (!college) return res.status(404).json({ error: 'Not found' })
        res.json(college)
    } catch (err) {
        res.status(500).json({ error: 'Failed to update college' })
    }
})

app.delete('/api/v1/admin/colleges/:id', authMiddleware, adminOnly, async (req, res) => {
    const result = await College.findByIdAndDelete(req.params.id)
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
})

// Courses CRUD (similar, assuming truncated)

// Exams CRUD
app.post('/api/v1/admin/exams', authMiddleware, adminOnly, async (req, res) => {
    const { name, date, collegeId } = req.body
    if (!name || !date || !collegeId) {
        return res.status(400).json({ error: 'Name, date, and collegeId required' })
    }
    const exam = await Exam.create({ ...req.body, date: new Date(date) })
    const populated = await Exam.findById(exam._id).populate('collegeId')
    res.status(201).json(populated)
})

app.put('/api/v1/admin/exams/:id', authMiddleware, adminOnly, async (req, res) => {
    const exam = await Exam.findByIdAndUpdate(
        req.params.id,
        { ...req.body, date: req.body.date ? new Date(req.body.date) : undefined },
        { new: true, runValidators: true }
    ).populate('collegeId')
    if (!exam) return res.status(404).json({ error: 'Not found' })
    res.json(exam)
})

app.delete('/api/v1/admin/exams/:id', authMiddleware, adminOnly, async (req, res) => {
    const result = await Exam.findByIdAndDelete(req.params.id)
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
})

// --- PUBLIC ROUTES ---
app.get('/api/v1/colleges', async (req, res) => {
    const colleges = await College.find().sort({ rating: -1 })
    res.json(colleges)
})

app.get('/api/v1/courses', async (req, res) => {
    const courses = await Course.find().populate('collegeId')
    res.json(courses)
})

app.get('/api/v1/exams', async (req, res) => {
    const exams = await Exam.find().populate('collegeId').sort({ date: 1 })
    res.json(exams)
})

app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'OK', mongodb: mongoose.connection.readyState === 1 })
})

// --- CONNECT MONGO AND START SERVER ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
    })
    .catch(err => console.error('Mongo connection failed:', err))