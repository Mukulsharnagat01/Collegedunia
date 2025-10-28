export default function Exams() {
    const exams = [
        { name: 'JEE Main', description: 'Engineering entrance exam' },
        { name: 'NEET', description: 'Medical entrance exam' },
        { name: 'CAT', description: 'MBA entrance exam' },
    ]

    return (
        <section id="exams" className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-10">Exams</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {exams.map((e, i) => (
                        <div key={i} className="bg-gray-50 p-6 rounded-lg shadow">
                            <h3 className="font-semibold text-lg mb-2">{e.name}</h3>
                            <p className="text-sm text-gray-600">{e.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
