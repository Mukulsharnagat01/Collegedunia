import { useState } from 'react'

export default function Header({ loggedIn, user, openLogin, openSignup, openProfile, openAdmin, logout }) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-300">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center">
                    <h2 className="text-white font-bold text-xl drop-shadow-md">CollegeDunia</h2>
                </div>

                {/* Desktop Menu */}
                <ul className="hidden md:flex space-x-8">
                    {['Home', 'Colleges', 'Courses', 'Exams', 'Reviews', 'About'].map((item) => (
                        <li key={item}>
                            <a
                                href={`#${item.toLowerCase()}`}
                                className="text-white hover:text-indigo-300 transition drop-shadow"
                            >
                                {item}
                            </a>
                        </li>
                    ))}
                </ul>

                {/* Auth */}
                <div className="hidden md:flex items-center space-x-4">
                    {!loggedIn ? (
                        <>
                            <button
                                onClick={openLogin}
                                className="text-white hover:text-indigo-300 font-medium drop-shadow"
                            >
                                Login
                            </button>
                            <button
                                onClick={openSignup}
                                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-md hover:bg-white/30 transition"
                            >
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <div className="relative group">
                            <button className="flex items-center space-x-2 text-white drop-shadow">
                                <span>{user?.name}</span>
                                <i className="fas fa-chevron-down text-sm"></i>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                                <button
                                    onClick={(e) => { e.preventDefault(); openProfile(); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={(e) => { e.preventDefault(); openProfile(); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Profile
                                </button>
                                {user?.type === 'admin' && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); openAdmin(); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Admin Panel
                                    </button>
                                )}
                                <button
                                    onClick={(e) => { e.preventDefault(); logout(); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button onClick={() => setMobileOpen(!mobileOpen)} className="mdsp:hidden text-white">
                    <i className={`fas ${mobileOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
                </button>
            </nav>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-sm border-t">
                    <ul className="flex flex-col p-4 space-y-2">
                        {['Home', 'Colleges', 'Courses', 'Exams', 'Reviews', 'About'].map((item) => (
                            <li key={item}>
                                <a href={`#${item.toLowerCase()}`} className="block py-2 text-gray-800 hover:text-indigo-600">
                                    {item}
                                </a>
                            </li>
                        ))}
                        {!loggedIn ? (
                            <>
                                <button onClick={openLogin} className="w-full text-left py-2 text-indigo-600">Login</button>
                                <button onClick={openSignup} className="w-full text-left py-2 text-indigo-600">Sign Up</button>
                            </>
                        ) : (
                            <>
                                <button onClick={openProfile} className="w-full text-left py-2">Dashboard</button>
                                <button onClick={openProfile} className="w-full text-left py-2">Profile</button>
                                {user?.type === 'admin' && <button onClick={openAdmin} className="w-full text-left py-2">Admin Panel</button>}
                                <button onClick={logout} className="w-full text-left py-2 text-red-600">Logout</button>
                            </>
                        )}
                    </ul>
                </div>
            )}
        </header>
    )
}