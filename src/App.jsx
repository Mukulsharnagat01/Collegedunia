import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Stats from './components/Stats';
import FeaturedColleges from './components/FeaturedColleges';
import PopularCourses from './components/PopularCourses';
import StudentReviews from './components/StudentReviews';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import AdminModal from './components/AdminModal';
import ProfileModal from './components/ProfileModal';

export default function App() {
    const [user, setUser] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('collegedunia_user');
        if (saved) {
            const u = JSON.parse(saved);
            setUser(u);
            setLoggedIn(true);
        }
    }, []);

    const login = (email, password) => {
        const isAdmin = email === 'admin@collegedunia.com' && password === 'admin123';
        const newUser = isAdmin
            ? { name: 'Admin User', email, type: 'admin', avatar: `https://ui-avatars.com/api/?background=dc2626&color=fff&name=A` }
            : { name: 'John Doe', email, type: 'student', avatar: `https://ui-avatars.com/api/?background=4f46e5&color=fff&name=J` };

        setUser(newUser);
        setLoggedIn(true);
        localStorage.setItem('collegedunia_user', JSON.stringify(newUser));
        setShowLogin(false);
    };

    const signup = (name, email, password, confirm, type) => {
        if (password !== confirm) return alert('Passwords do not match');
        const newUser = {
            name,
            email,
            type,
            avatar: `https://ui-avatars.com/api/?background=4f46e5&color=fff&name=${name[0].toUpperCase()}`,
        };
        setUser(newUser);
        setLoggedIn(true);
        localStorage.setItem('collegedunia_user', JSON.stringify(newUser));
        setShowSignup(false);
    };

    const logout = () => {
        setUser(null);
        setLoggedIn(false);
        localStorage.removeItem('collegedunia_user');
    };

    return (
        <>
            <Header
                loggedIn={loggedIn}
                user={user}
                openLogin={() => setShowLogin(true)}
                openSignup={() => setShowSignup(true)}
                openProfile={() => setShowProfile(true)}
                openAdmin={() => setShowAdmin(true)}
                logout={logout}
            />
            {/* Remove pt-16 — hero starts at top */}
            <main>
                <Hero />
                <Stats />
                <FeaturedColleges />
                <PopularCourses />
                <StudentReviews />
            </main>
            <Footer />

            {/* Modals */}
            {showLogin && <LoginModal close={() => setShowLogin(false)} switchToSignup={() => { setShowLogin(false); setShowSignup(true); }} onLogin={login} />}
            {showSignup && <SignupModal close={() => setShowSignup(false)} switchToLogin={() => { setShowSignup(false); setShowLogin(true); }} onSignup={signup} />}
            {showAdmin && <AdminModal close={() => setShowAdmin(false)} />}
            {showProfile && <ProfileModal close={() => setShowProfile(false)} user={user} />}
        </>
    )
}
