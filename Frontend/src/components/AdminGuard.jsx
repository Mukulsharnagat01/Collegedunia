// components/AdminGuard.jsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../lib/api'

export default function AdminGuard({ children }) {
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const check = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('collegedunia_user') || '{}')
                if (!user?.type) throw new Error()

                if (user.type === 'admin') {
                    setIsAdmin(true)
                } else {
                    // Try to get fresh user
                    const resp = await api.get('/auth/me')
                    const freshUser = resp.data
                    localStorage.setItem('collegedunia_user', JSON.stringify(freshUser))
                    setIsAdmin(freshUser.type === 'admin')
                }
            } catch (err) {
                setIsAdmin(false)
            } finally {
                setLoading(false)
            }
        }
        check()
    }, [])

    if (loading) return <div className="p-8">Loading...</div>
    if (!isAdmin) return <Navigate to="/admin/login" replace />

    return children
}