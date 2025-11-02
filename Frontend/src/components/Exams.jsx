import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function Exams() {
    const [exams, setExams] = useState([])

    useEffect(() => {
        api.get('/exams').then(res => setExams(res.data.slice(0, 4)))
    }, [])

    return (
        <section id='exams' className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Upcoming Exams</h2>
                <div className="grid md:grid-cols-4 gap-8">
                    {exams.map(exam => (
                        <div key={exam._id} className="bg-white rounded-lg shadow-md p-6 text-center">
                            <h3 className="text-xl font-semibold mb-2">{exam.name}</h3>
                            <p className="text-gray-600 mb-4">{exam.collegeId?.name || 'Top College'}</p>
                            <p className="text-indigo-600 font-semibold">{new Date(exam.date).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-500 mt-2">{exam.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}