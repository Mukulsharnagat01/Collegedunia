import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

// Paste your schemas here (User, College, Course, Exam)

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Clear existing
    await College.deleteMany({})
    await Course.deleteMany({})
    await Exam.deleteMany({})

    // Colleges
    const colleges = await College.insertMany([
        { name: 'IIT Delhi', location: 'Delhi', rating: 9.8, fees: 250000, image: 'https://via.placeholder.com/300x200?text=IIT+Delhi' },
        { name: 'IIM Ahmedabad', location: 'Gujarat', rating: 9.7, fees: 2300000, image: 'https://via.placeholder.com/300x200?text=IIM+Ahmedabad' }
    ])

    // Courses
    await Course.insertMany([
        { name: 'Computer Science', collegeId: colleges[0]._id, duration: '4 years', fees: 250000, description: 'B.Tech CS' },
        { name: 'MBA', collegeId: colleges[1]._id, duration: '2 years', fees: 2300000, description: 'Master of Business Administration' }
    ])

    // Exams
    await Exam.insertMany([
        { name: 'JEE Main', date: new Date('2025-01-15'), collegeId: colleges[0]._id, description: 'Entrance for IITs' },
        { name: 'CAT', date: new Date('2025-11-24'), collegeId: colleges[1]._id, description: 'Entrance for IIMs' }
    ])

    console.log('Sample data seeded!')
    process.exit()
})