export default function PopularCourses() {
    const courses = [
        { name: 'B.Tech Computer Science', colleges: '1,200+', img: 'https://via.placeholder.com/300x200/6366F1/FFFFFF?text=CS' },
        { name: 'MBBS', colleges: '850+', img: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=MBBS' },
        { name: 'MBA', colleges: '2,100+', img: 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=MBA' },
    ]

    return (
        <section id="courses" className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-10">Popular Courses</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {courses.map((c, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg overflow-hidden shadow">
                            <img src={c.img} alt={c.name} className="w-full h-40 object-cover" />
                            <div className="p-4">
                                <h3 className="font-semibold text-lg">{c.name}</h3>
                                <p className="text-sm text-gray-600">{c.colleges} Colleges</p>
                                <button className="mt-3 text-indigo-600 hover:underline">Explore →</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}