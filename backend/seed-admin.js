import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'  // Add this import for password hash

dotenv.config()

// Define schemas here (as per comment)
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

// Compile models
const User = mongoose.model('User', userSchema);
const College = mongoose.model('College', collegeSchema);
const Course = mongoose.model('Course', courseSchema);
const Exam = mongoose.model('Exam', examSchema);

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to MongoDB. Seeding...');

    // Clear existing data (optional - comment if you want to keep)
    await College.deleteMany({});
    await Course.deleteMany({});
    await Exam.deleteMany({});
    // Don't delete users, just check for admin

    // Create admin user if not exists
    const adminEmail = 'admin@site';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin', 10);
        await User.create({
            name: 'Admin User',
            email: adminEmail,
            passwordHash: hashedPassword,
            type: 'admin'
        });
        console.log('Admin user created: admin@site / admin');
    } else {
        console.log('Admin user already exists.');
    }

    // Colleges
    const colleges = await College.insertMany([
        {
            name: 'IIT Delhi',
            location: 'Delhi',
            rating: 9.8,
            fees: 250000,
            image: 'https://via.placeholder.com/300x200?text=IIT+Delhi'
        },
        {
            name: 'IIM Ahmedabad',
            location: 'Gujarat',
            rating: 9.7,
            fees: 2300000,
            image: 'https://via.placeholder.com/300x200?text=IIM+Ahmedabad'
        }
        // Add more if needed
    ]);
    console.log(`Seeded ${colleges.length} colleges.`);

    // Courses
    await Course.insertMany([
        {
            name: 'Computer Science',
            collegeId: colleges[0]._id,
            duration: '4 years',
            fees: 250000,
            description: 'B.Tech CS'
        },
        {
            name: 'MBA',
            collegeId: colleges[1]._id,
            duration: '2 years',
            fees: 2300000,
            description: 'Master of Business Administration'
        }
    ]);
    console.log('Seeded courses.');

    // Exams
    await Exam.insertMany([
        {
            name: 'JEE Main',
            date: new Date('2026-01-22'),  // Updated to tentative 2026 Session 1 midpoint
            collegeId: colleges[0]._id,
            description: 'Entrance for IITs'
        },
        {
            name: 'CAT',
            date: new Date('2025-11-30'),  // Updated to actual 2025 date
            collegeId: colleges[1]._id,
            description: 'Entrance for IIMs'
        }
    ]);
    console.log('Seeded exams.');

    console.log('Seeding complete!');
    process.exit(0);
}).catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});