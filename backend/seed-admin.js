// seed-admin.js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
dotenv.config()

const MONGO_URI = process.env.MONGO_URI

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    passwordHash: String,
    type: String
})

const User = mongoose.model('User', userSchema)

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected')

        const passwordHash = bcrypt.hashSync('admin', 8)
        const admin = await User.findOneAndUpdate(
            { email: 'admin@site' },
            { name: 'Admin User', email: 'admin@site', passwordHash, type: 'admin' },
            { upsert: true, new: true }
        )

        console.log('Admin created:', admin.email)
        process.exit()
    })
    .catch(err => {
        console.error(err)
        process.exit(1)
    })