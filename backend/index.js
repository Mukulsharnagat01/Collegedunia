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
app.use(cors({
    origin: process.env.VITE_FRONTEND_URL,
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

// --- AUTO-CREATE ADMIN ---
mongoose.connection.once('open', async () => {
    try {
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
    } catch (err) {
        console.error('Admin creation failed:', err)
    }
})

// --- MONGODB & SERVER START ---
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

        // Start server only after DB is connected
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`)
        })

        // Handle port in use
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Exiting...`)
                process.exit(1)
            } else {
                console.error('Server error:', err)
            }
        })
    })
    .catch(err => {
        console.error('MongoDB Connection Failed:', err.message)
        process.exit(1)
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
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        res.status(201).json({
            user: { id: user._id, email: user.email, name: user.name, type: user.type },
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
        if (!user || !await compare(password, user.passwordHash)) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)
        refreshTokens.add(refreshToken)

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        res.json({
            user: { id: user._id, email: user.email, name: user.name, type: user.type },
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
        res.status(401).json({ error: 'Invalid refresh token' })
    }
})

app.post('/api/v1/auth/logout', (req, res) => {
    const token = req.cookies.refreshToken
    if (token) refreshTokens.delete(token)
    res.clearCookie('refreshToken')
    res.json({ ok: true })
})

// app.get('/api/v1/auth/me', authMiddleware, (req, res) => {
//     res.json({
//         id: req.user._id,
//         email: req.user.email,
//         name: req.user.name,
//         type: req.user.type
//     })
// })

// ADD THIS: GET /api/v1/auth/me - Missing route jo 404 de raha hai
app.get('/api/v1/auth/me', authMiddleware, async (req, res) => {
    try {
        // req.user.id from token payload
        const fullUser = await User.findById(req.user.id).select('-passwordHash -__v');
        if (!fullUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(fullUser);
    } catch (error) {
        console.error('Error fetching /auth/me:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- ADMIN: COLLEGES ---
app.get('/api/v1/admin/colleges', authMiddleware, adminOnly, async (req, res) => {
    const colleges = await College.find().sort({ createdAt: -1 })
    res.json(colleges)
})

app.post('/api/v1/admin/colleges', upload.single('image'), authMiddleware, adminOnly, async (req, res) => {
    try {
        let imageUrl = ''
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'colleges' },
                    (error, result) => error ? reject(error) : resolve(result)
                )
                uploadStream.end(req.file.buffer)
            })
            imageUrl = result.secure_url
        }

        const college = await College.create({ ...req.body, image: imageUrl })
        res.status(201).json(college)
    } catch (err) {
        console.error('College create error:', err)
        res.status(400).json({ error: err.message || 'Invalid data' })
    }
})

app.put('/api/v1/admin/colleges/:id', upload.single('image'), authMiddleware, adminOnly, async (req, res) => {
    try {
        let imageUrl = req.body.image
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: 'colleges' },
                    (error, result) => error ? reject(error) : resolve(result)
                ).end(req.file.buffer)
            })
            imageUrl = result.secure_url
        }

        const college = await College.findByIdAndUpdate(
            req.params.id,
            { ...req.body, image: imageUrl },
            { new: true, runValidators: true }
        )
        if (!college) return res.status(404).json({ error: 'Not found' })
        res.json(college)
    } catch (err) {
        res.status(400).json({ error: 'Update failed' })
    }
})

app.delete('/api/v1/admin/colleges/:id', authMiddleware, adminOnly, async (req, res) => {
    const result = await College.findByIdAndDelete(req.params.id)
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
})

// --- ADMIN: COURSES, EXAMS (unchanged for brevity) ---
app.get('/api/v1/admin/courses', authMiddleware, adminOnly, async (req, res) => {
    const courses = await Course.find().populate('collegeId').sort({ createdAt: -1 })
    res.json(courses)
})

app.post('/api/v1/admin/courses', authMiddleware, adminOnly, async (req, res) => {
    const { name, collegeId } = req.body
    if (!name || !collegeId || !mongoose.Types.ObjectId.isValid(collegeId)) {
        return res.status(400).json({ error: 'Valid name and collegeId required' })
    }
    const course = await Course.create(req.body)
    const populated = await Course.findById(course._id).populate('collegeId')
    res.status(201).json(populated)
})

app.put('/api/v1/admin/courses/:id', authMiddleware, adminOnly, async (req, res) => {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!course) return res.status(404).json({ error: 'Not found' })
    res.json(course)
})

app.delete('/api/v1/admin/courses/:id', authMiddleware, adminOnly, async (req, res) => {
    const result = await Course.findByIdAndDelete(req.params.id)
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
})

// --- ADMIN: EXAMS ---
app.get('/api/v1/admin/exams', authMiddleware, adminOnly, async (req, res) => {
    const exams = await Exam.find().populate('collegeId').sort({ date: -1 })
    res.json(exams)
})

app.post('/api/v1/admin/exams', authMiddleware, adminOnly, async (req, res) => {
    const { name, date, collegeId } = req.body
    if (!name || !date || !collegeId || !mongoose.Types.ObjectId.isValid(collegeId)) {
        return res.status(400).json({ error: 'Valid name, date, and collegeId required' })
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