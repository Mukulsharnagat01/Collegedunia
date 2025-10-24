import { useState, useEffect } from 'react'

export default function Hero() {
    const slides = [
        { src: '/Collage D.webp', alt: 'Campus 1' },
        { src: '/Collage D1.webp', alt: 'Campus 2' },
        { src: '/Collage D2.webp', alt: 'Campus 3' },
    ]
    const [idx, setIdx] = useState(0)

    useEffect(() => {
        const id = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000)
        return () => clearInterval(id)
    }, [slides.length])

    const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length)
    const next = () => setIdx((i) => (i + 1) % slides.length)

    return (
        <section id="home" className="relative h-screen overflow-hidden">
            {/* Full-screen images */}
            {slides.map((s, i) => (
                <div
                    key={i}
                    className={`absolute inset-0 transition-opacity duration-1000 ${i === idx ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <img
                        src={s.src}
                        alt={s.alt}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>
                </div>
            ))}

            {/* Nav Buttons */}
            <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur hover:bg-white/40 rounded-full flex items-center justify-center text-white z-10"
            >
                <i className="fas fa-chevron-left"></i>
            </button>
            <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur hover:bg-white/40 rounded-full flex items-center justify-center text-white z-10"
            >
                <i className="fas fa-chevron-right"></i>
            </button>

            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIdx(i)}
                        className={`transition-all ${i === idx ? 'w-8 h-2 bg-white rounded' : 'w-2 h-2 bg-white/50 rounded-full'}`}
                    />
                ))}
            </div>

            {/* Hero Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 z-10">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
                    Find Your Perfect College
                </h1>
                <p className="text-lg md:text-xl mb-8 max-w-2xl drop-shadow">
                    Discover thousands of colleges, courses, and career opportunities
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-2xl mb-6">
                    <div className="flex bg-white/90 backdrop-blur rounded-full shadow-xl overflow-hidden">
                        <input
                            type="text"
                            placeholder="Search colleges, courses, or exams..."
                            className="flex-1 px-6 py-3 text-gray-800 outline-none"
                        />
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3">
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {['All', 'Engineering', 'Medical', 'Management', 'Arts'].map((f) => (
                        <button
                            key={f}
                            className={`px-4 py-2 rounded-full transition backdrop-blur-sm ${f === 'All'
                                ? 'bg-white text-indigo-600 font-medium'
                                : 'bg-white/30 text-white hover:bg-white/50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}