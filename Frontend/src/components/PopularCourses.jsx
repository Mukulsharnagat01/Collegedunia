import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function PopularCourses() {
    const [courses, setCourses] = useState([])

    useEffect(() => {
        api.get('/courses').then(res => setCourses(res.data.slice(0, 6)))
    }, [])

    return (
        <section id="courses" className="py-16">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Popular Courses</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {courses.map(course => (
                        <div key={course._id} className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold mb-2">{course.name}</h3>
                            <p className="text-gray-600 mb-4">{course.collegeId?.name || 'Top College'}</p>
                            <p className="text-sm text-gray-500 mb-4">{course.description}</p>
                            <div className="flex justify-between">
                                <span className="text-indigo-600 font-semibold">₹{course.fees?.toLocaleString()}</span>
                                <span className="text-sm text-gray-500">{course.duration}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}