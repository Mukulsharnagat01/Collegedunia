export default function StudentReviews() {
    const reviews = [
        { name: 'Priya Sharma', course: 'B.Tech CSE', rating: 5, text: 'Best platform to find colleges!' },
        { name: 'Aman Verma', course: 'MBA', rating: 4, text: 'Helped me choose the right college.' },
    ]

    return (
        <section id="reviews" className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-10">Student Reviews</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    {reviews.map((r, i) => (
                        <div key={i} className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center mb-3">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                    {r.name[0]}
                                </div>
                                <div className="ml-3">
                                    <h4 className="font-semibold">{r.name}</h4>
                                    <p className="text-sm text-gray-600">{r.course}</p>
                                </div>
                            </div>
                            <div className="flex mb-2">
                                {[...Array(5)].map((_, s) => (
                                    <i key={s} className={`fas fa-star ${s < r.rating ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                                ))}
                            </div>
                            <p className="text-gray-700">{r.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}