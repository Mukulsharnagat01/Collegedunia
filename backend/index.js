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
app.listen(PORT, '0.0.0.0', () => {  // Add '0.0.0.0'
    console.log(`Server on port ${PORT}`)
});

// --- CLOUDINARY (Optional – for image upload) ---
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    })
}

// --- MONGODB CONNECT ---
const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
    console.error('MONGO_URI missing in .env – exiting')
    process.exit(1)
}

mongoose.set('strictQuery', false)

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('MongoDB Connected Successfully')
        startServer()
    })
    .catch(err => {
        console.error('MongoDB Connection Failed:', err.message)
        process.exit(1)
    })

function startServer() {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`)
    })
}

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

// --- MIDDLEWARE ---
app.use(cors({
    origin: 'https://collegenest.onrender.com',
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
    try {
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) return res.status(401).json({ error: 'Missing token' })

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

// --- AUTO-CREATE ADMIN (After Connection) ---
mongoose.connection.once('open', async () => {
    const admin = await User.findOne({ email: 'admin@site' })
    if (!admin) {
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

// --- ROUTES: AUTH ---
app.post('/api/v1/auth/signup', async (req, res) => {
    try {
        const { name, email, password, phone, city, course } = req.body
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password required' })
        }

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
        console.error('Signup error:', err)
        res.status(500).json({ error: 'Signup failed' })
    }
})

app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' })
        }

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
        console.error('Login error:', err)
        res.status(500).json({ error: 'Login failed' })
    }
})

app.post('/api/v1/auth/refresh', async (req, res) => {
    try {
        const token = req.cookies.refreshToken
        if (!token || !refreshTokens.has(token)) {
            return res.status(401).json({ error: 'Invalid refresh token' })
        }

        const payload = verify(token, REFRESH_SECRET)
        const user = await User.findById(payload.sub)
        if (!user) throw new Error('User not found')

        const accessToken = generateAccessToken(user)
        res.json({ accessToken })
    } catch (e) {
        console.error('Refresh error:', e)
        res.status(401).json({ error: 'Invalid refresh token' })
    }
})

app.post('/api/v1/auth/logout', (req, res) => {
    try {
        const token = req.cookies.refreshToken
        if (token) refreshTokens.delete(token)
        res.clearCookie('refreshToken')
        res.json({ ok: true })
    } catch (err) {
        res.status(500).json({ error: 'Logout failed' })
    }
})

app.get('/api/v1/auth/me', authMiddleware, async (req, res) => {
    try {
        res.json({
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            type: req.user.type
        })
    } catch (err) {
        res.status(500).json({ error: 'Failed to get user' })
    }
})

// --- ADMIN CRUD: COLLEGES ---
app.get('/api/v1/admin/colleges', authMiddleware, adminOnly, async (req, res) => {
    try {
        const colleges = await College.find().sort({ createdAt: -1 })
        res.json(colleges)
    } catch (err) {
        console.error('Colleges GET error:', err)
        res.status(500).json({ error: 'Failed to fetch colleges' })
    }
})

app.post('/api/v1/admin/colleges', upload.single('image'), authMiddleware, adminOnly, async (req, res) => {
    try {
        let imageUrl = ''
        if (req.file) {
            const result = await cloudinary.uploader.upload_stream(
                { folder: 'colleges' },
                (error, result) => {
                    if (error) throw error
                    imageUrl = result.secure_url
                }
            ).end(req.file.buffer)
        }

        const college = await College.create({
            ...req.body,
            image: imageUrl
        })
        res.status(201).json(college)
    } catch (err) {
        console.error('Colleges POST error:', err)
        res.status(400).json({ error: 'Invalid data' })
    }
})

app.put('/api/v1/admin/colleges/:id', upload.single('image'), authMiddleware, adminOnly, async (req, res) => {
    try {
        let imageUrl = req.body.image
        if (req.file) {
            const result = await cloudinary.uploader.upload_stream(
                { folder: 'colleges' },
                (error, result) => {
                    if (error) throw error
                    imageUrl = result.secure_url
                }
            ).end(req.file.buffer)
        }

        const college = await College.findByIdAndUpdate(
            req.params.id,
            { ...req.body, image: imageUrl },
            { new: true, runValidators: true }
        )
        if (!college) return res.status(404).json({ error: 'Not found' })
        res.json(college)
    } catch (err) {
        console.error('Colleges PUT error:', err)
        res.status(400).json({ error: 'Update failed' })
    }
})

app.delete('/api/v1/admin/colleges/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await College.findByIdAndDelete(req.params.id)
        if (!result) return res.status(404).json({ error: 'Not found' })
        res.json({ ok: true })
    } catch (err) {
        console.error('Colleges DELETE error:', err)
        res.status(500).json({ error: 'Delete failed' })
    }
})

// --- ADMIN CRUD: COURSES ---
app.get('/api/v1/admin/courses', authMiddleware, adminOnly, async (req, res) => {
    try {
        const courses = await Course.find().populate('collegeId').sort({ createdAt: -1 })
        res.json(courses)
    } catch (err) {
        console.error('Courses GET error:', err)
        res.status(500).json({ error: 'Failed to fetch courses' })
    }
})

app.post('/api/v1/admin/courses', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, collegeId, duration, fees, description } = req.body
        if (!name || !collegeId) {
            return res.status(400).json({ error: 'Name and collegeId required' })
        }
        if (!mongoose.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ error: 'Invalid collegeId' })
        }

        const course = await Course.create({ name, collegeId, duration, fees, description })
        const populated = await Course.findById(course._id).populate('collegeId')
        res.status(201).json(populated)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

app.put('/api/v1/admin/courses/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (!course) return res.status(404).json({ error: 'Not found' })
        res.json(course)
    } catch (err) {
        console.error('Courses PUT error:', err)
        res.status(400).json({ error: 'Update failed' })
    }
})

app.delete('/api/v1/admin/courses/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await Course.findByIdAndDelete(req.params.id)
        if (!result) return res.status(404).json({ error: 'Not found' })
        res.json({ ok: true })
    } catch (err) {
        console.error('Courses DELETE error:', err)
        res.status(500).json({ error: 'Delete failed' })
    }
})

// --- ADMIN CRUD: EXAMS ---
app.get('/api/v1/admin/exams', authMiddleware, adminOnly, async (req, res) => {
    try {
        const exams = await Exam.find().populate('collegeId').sort({ date: -1 })
        res.json(exams)
    } catch (err) {
        console.error('Exams GET error:', err)
        res.status(500).json({ error: 'Failed to fetch exams' })
    }
})

// --- ADMIN CRUD: EXAMS (FIXED) ---
app.post('/api/v1/admin/exams', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, date, collegeId, description } = req.body

        if (!name || !date || !collegeId) {
            return res.status(400).json({ error: 'Name, date, and collegeId are required' })
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ error: 'Invalid collegeId format' })
        }

        const exam = await Exam.create({
            name,
            date: new Date(date),
            collegeId,
            description
        })

        const populated = await Exam.findById(exam._id).populate('collegeId')
        res.status(201).json(populated)
    } catch (err) {
        console.error('Exam create error:', err)
        res.status(400).json({ error: err.message || 'Failed to create exam' })
    }
})

app.put('/api/v1/admin/exams/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { collegeId } = req.body
        if (collegeId && !mongoose.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ error: 'Invalid collegeId format' })
        }

        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            { ...req.body, date: req.body.date ? new Date(req.body.date) : undefined },
            { new: true, runValidators: true }
        ).populate('collegeId')

        if (!exam) return res.status(404).json({ error: 'Exam not found' })
        res.json(exam)
    } catch (err) {
        res.status(400).json({ error: err.message || 'Update failed' })
    }
})

app.delete('/api/v1/admin/exams/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await Exam.findByIdAndDelete(req.params.id)
        if (!result) return res.status(404).json({ error: 'Not found' })
        res.json({ ok: true })
    } catch (err) {
        console.error('Exams DELETE error:', err)
        res.status(500).json({ error: 'Delete failed' })
    }
})

// --- PUBLIC ROUTES ---
app.get('/api/v1/colleges', async (req, res) => {
    try {
        const colleges = await College.find().sort({ rating: -1 })
        res.json(colleges)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch colleges' })
    }
})

app.get('/api/v1/courses', async (req, res) => {
    try {
        const courses = await Course.find().populate('collegeId')
        res.json(courses)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch courses' })
    }
})

app.get('/api/v1/exams', async (req, res) => {
    try {
        const exams = await Exam.find().populate('collegeId').sort({ date: 1 })
        res.json(exams)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch exams' })
    }
})

// --- HEALTH CHECK ---
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'OK', mongodb: mongoose.connection.readyState === 1 })
})