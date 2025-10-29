import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import Stats from './components/Stats'
import FeaturedColleges from './components/FeaturedColleges'
import PopularCourses from './components/PopularCourses'
import StudentReviews from './components/StudentReviews'
import Exams from './components/Exams'
import About from './components/About'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import SignupModal from './components/SignupModal'
import ProfileModal from './components/ProfileModal'
import AdminPanel from './components/AdminPanel'
import AdminLogin from './components/AdminLogin'
import AdminGuard from './components/AdminGuard'
import AdminTopBar from './components/AdminTopBar'
import api, { setAccessToken } from './lib/api'
import { logout as apiLogout } from './lib/api'


export default function App() {
    const [user, setUser] = useState(null)
    const [loggedIn, setLoggedIn] = useState(false)
    const [showLogin, setShowLogin] = useState(false)
    const [showSignup, setShowSignup] = useState(false)
    const [showProfile, setShowProfile] = useState(false)

    // Load user from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('collegedunia_user')
        if (saved) {
            const u = JSON.parse(saved)
            setUser(u)
            setLoggedIn(true)
        }
    }, [])

    // REAL LOGIN
    const login = async (email, password) => {
        try {
            const resp = await api.post('/auth/login', { email, password })
            const { user, accessToken } = resp.data

            const userWithAvatar = {
                ...user,
                avatar: `https://ui-avatars.com/api/?background=4f46e5&color=fff&name=${encodeURIComponent(user.name)}`
            }

            localStorage.setItem('collegedunia_user', JSON.stringify(userWithAvatar))
            setAccessToken(accessToken)
            setUser(userWithAvatar)
            setLoggedIn(true)
            setShowLogin(false)
        } catch (err) {
            alert(err?.response?.data?.error || 'Login failed')
        }
    }

    // REAL SIGNUP
    const signup = async (name, email, password, confirmPassword, type) => {
        if (password !== confirmPassword) {
            alert('Passwords do not match')
            return
        }
        try {
            const resp = await api.post('/auth/register', { name, email, password, type })
            const { user } = resp.data
            const userWithAvatar = {
                ...user,
                avatar: `https://ui-avatars.com/api/?background=4f46e5&color=fff&name=${encodeURIComponent(user.name)}`
            }
            localStorage.setItem('collegedunia_user', JSON.stringify(userWithAvatar))
            setUser(userWithAvatar)
            setLoggedIn(true)
            setShowSignup(false)
        } catch (err) {
            alert(err?.response?.data?.error || 'Signup failed')
        }
    }

    // LOGOUT
    const logout = () => {
        setUser(null)
        setLoggedIn(false)
        localStorage.removeItem('collegedunia_user')
    }

    const location = useLocation()
    const showHeader = !location.pathname.startsWith('/admin')
    const showAdminBar = location.pathname.startsWith('/admin') && user?.type === 'admin'

    const logoutAdmin = () => {
        logout()
        window.location.assign('/')
    }

    return (
        <>
            {showHeader && (
                <Header
                    loggedIn={loggedIn}
                    user={user}
                    openLogin={() => setShowLogin(true)}
                    openSignup={() => setShowSignup(true)}
                    openProfile={() => setShowProfile(true)}
                    logout={logout}
                />
            )}

            {showAdminBar && <AdminTopBar user={user} onLogout={logoutAdmin} />}

            <Routes>
                <Route path="/" element={
                    <main>
                        <Hero />
                        <Stats />
                        <FeaturedColleges />
                        <PopularCourses />
                        <Exams />
                        <StudentReviews />
                        <About />
                    </main>
                } />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminGuard><AdminPanel /></AdminGuard>} />
            </Routes>

            {showHeader && <Footer />}

            {/* MODALS */}
            {showLogin && (
                <LoginModal
                    close={() => setShowLogin(false)}
                    switchToSignup={() => { setShowLogin(false); setShowSignup(true); }}
                    onLogin={login}
                />
            )}
            {showSignup && (
                <SignupModal
                    close={() => setShowSignup(false)}
                    switchToLogin={() => { setShowSignup(false); setShowLogin(true); }}
                    onSignup={signup}   // ← Your existing real signup function
                />
            )}
            {showProfile && <ProfileModal close={() => setShowProfile(false)} user={user} />}
        </>
    )
}