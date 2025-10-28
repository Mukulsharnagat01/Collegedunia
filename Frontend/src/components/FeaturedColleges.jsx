export default function FeaturedColleges() {
    const colleges = [
        {
            name: 'Indian Institute of Technology Delhi',
            location: 'New Delhi, Delhi',
            rating: 4.8,
            reviews: 1234,
            fees: '₹2.5L - ₹4L',
            placement: '95%',
            badge: 'Top Ranked',
            img: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=IIT+Delhi',

        },
        {
            name: 'All India Institute of Medical Sciences',
            location: 'New Delhi, Delhi',
            rating: 4.9,
            reviews: 987,
            fees: '₹5K - ₹10K',
            placement: '100%',
            badge: 'Medical',
            img: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=AIIMS+Delhi',
        },
        {
            name: 'Indian Institute of Management Ahmedabad',
            location: 'Ahmedabad, Gujarat',
            rating: 4.7,
            reviews: 876,
            fees: '₹20L - ₹25L',
            placement: '98%',
            badge: 'Management',
            img: 'https://via.placeholder.com/300x200/DB2777/FFFFFF?text=IIM+Ahmedabad',
        }
        // Add more as needed
    ];

    return (
        <section id="colleges" className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-10">Featured Colleges</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {colleges.map((c, i) => (
                        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                            <div className="relative">
                                <img src={c.img} alt={c.name} className="w-full h-48 object-cover" />
                                <span className="absolute top-2 left-2 bg-indigo-600 text-white px-2 py-1 rounded text-sm">
                                    {c.badge}
                                </span>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-semibold text-lg mb-1">{c.name}</h3>
                                <p className="text-sm text-gray-600 flex items-center mb-2">
                                    <i className="fas fa-map-marker-alt mr-1"></i> {c.location}
                                </p>
                                <div className="flex items-center mb-2">
                                    {[...Array(5)].map((_, s) => (
                                        <i key={s} className={`fas fa-star ${s < Math.floor(c.rating) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                                    ))}
                                    <span className="ml-2 text-sm text-gray-600">({c.reviews})</span>
                                </div>
                                <div className="flex justify-between text-sm mb-4">
                                    <div>
                                        <span className="font-medium">Fees:</span> {c.fees}
                                    </div>
                                    <div>
                                        <span className="font-medium">Placement:</span> {c.placement}
                                    </div>
                                </div>
                                <button className="mt-auto bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}