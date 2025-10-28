export default function Stats() {
    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                    { num: '10,000+', label: 'Colleges' },
                    { num: '50,000+', label: 'Courses' },
                    { num: '1M+', label: 'Students' },
                    { num: '100+', label: 'Exams' },
                ].map((s) => (
                    <div key={s.label}>
                        <h3 className="text-3xl md:text-4xl font-bold text-indigo-600">{s.num}</h3>
                        <p className="text-gray-600">{s.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}