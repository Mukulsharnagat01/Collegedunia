import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Stats() {
    const [stats, setStats] = useState({
        colleges: '0+',
        courses: '0+',
        exams: '0+',
        students: '1M+',  // Demo value (backend में users count add करें अगर चाहें)
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true)
                // Parallel API calls (सिर्फ public endpoints)
                const [collegesRes, coursesRes, examsRes] = await Promise.all([
                    api.get('/colleges').catch(() => ({ data: [] })),  // Error handle
                    api.get('/courses').catch(() => ({ data: [] })),
                    api.get('/exams').catch(() => ({ data: [] })),
                ])

                setStats({
                    colleges: collegesRes.data.length.toLocaleString() + '+',
                    courses: coursesRes.data.length.toLocaleString() + '+',
                    exams: examsRes.data.length.toLocaleString() + '+',
                    students: '1M+',  // Static demo – backend में /stats endpoint add करें
                })
            } catch (error) {
                console.error('Stats load error:', error)
                // Fallback to demo values
                setStats({
                    colleges: '10,000+',
                    courses: '50,000+',
                    exams: '100+',
                    students: '1M+',
                })
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])  // Empty dependency array – सिर्फ एक बार run होगी

    const items = [
        { num: stats.colleges, label: 'Colleges' },
        { num: stats.courses, label: 'Courses' },
        { num: stats.students, label: 'Students' },
        { num: stats.exams, label: 'Exams' },
    ]

    if (loading) {
        return (
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {items.map((item, index) => (
                        <div key={item.label} className="animate-pulse">
                            <div className="h-10 bg-gray-200 rounded mx-auto w-20 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                        </div>
                    ))}
                </div>
            </section>
        )
    }

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {items.map((item) => (
                    <div key={item.label}>
                        <h3 className="text-3xl md:text-4xl font-bold text-indigo-600 animate-count-up">
                            {item.num}
                        </h3>
                        <p className="text-gray-600">{item.label}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}