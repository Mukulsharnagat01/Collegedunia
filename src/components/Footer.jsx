export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-3">CollegeDunia</h3>
                    <p className="text-gray-400">Your trusted partner in finding the perfect college and career path.</p>
                    <div className="flex space-x-4 mt-4">
                        {['facebook', 'twitter', 'linkedin', 'instagram'].map((s) => (
                            <a key={s} href="#" className="text-gray-400 hover:text-white">
                                <i className={`fab fa-${s}`}></i>
                            </a>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Quick Links</h4>
                    <ul className="space-y-1 text-gray-400">
                        {['Colleges', 'Courses', 'Exams', 'Reviews'].map((l) => (
                            <li key={l}>
                                <a href={`#${l.toLowerCase()}`} className="hover:text-white">
                                    {l}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Popular Searches</h4>
                    <ul className="space-y-1 text-gray-400">
                        {['Engineering Colleges', 'Medical Colleges', 'MBA Colleges', 'IIT Colleges'].map((l) => (
                            <li key={l}>
                                <a href="#" className="hover:text-white">
                                    {l}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Contact Info</h4>
                    <p className="flex items-center text-gray-400">
                        <i className="fas fa-phone mr-2"></i> +91 9876543210
                    </p>
                    <p className="flex items-center text-gray-400">
                        <i className="fas fa-envelope mr-2"></i> info@collegedunia.com
                    </p>
                    <p className="flex items-center text-gray-400">
                        <i className="fas fa-map-marker-alt mr-2"></i> New Delhi, India
                    </p>
                </div>
            </div>
            <div className="mt-8 text-center text-gray-500 text-sm">
                © 2025 CollegeDunia Clone. All rights reserved.
            </div>
        </footer>
    )
}