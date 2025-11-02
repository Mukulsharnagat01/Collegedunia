// src/components/FeaturedColleges.jsx
import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function FeaturedColleges() {
    const [colleges, setColleges] = useState([])

    useEffect(() => {
        api.get('/colleges').then(res => setColleges(res.data.slice(0, 4)))
    }, [])

    return (
        <section id="colleges" className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Featured Colleges</h2>
                <div className="grid md:grid-cols-4 gap-8">
                    {colleges.map(college => (
                        <div key={college._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <img
                                src={college.image || null}  // ← FIX: null instead of ""
                                alt={college.name}
                                className="w-full h-48 object-cover bg-gray-200"
                                loading="lazy"
                            />
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-2">{college.name}</h3>
                                <p className="text-gray-600 mb-2">{college.location}</p>
                                <div className="flex justify-between">
                                    <span>₹{college.fees?.toLocaleString()}</span>
                                    <span className="text-yellow-500">★ {college.rating}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
