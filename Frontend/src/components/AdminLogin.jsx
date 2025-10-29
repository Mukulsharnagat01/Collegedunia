// src/components/AdminLogin.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setAccessToken } from '../lib/api'

export default function AdminLogin() {
    const [email, setEmail] = useState('admin@site')
    const [password, setPassword] = useState('admin')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const resp = await api.post('/auth/login', { email, password })
            const { user, accessToken } = resp.data

            localStorage.setItem('collegedunia_user', JSON.stringify(user))
            setAccessToken(accessToken)

            navigate('/admin', { replace: true })
        } catch (err) {
            setError(err?.response?.data?.error || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">Admin Login</h1>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        className="w-full px-4 py-2 border rounded-lg"
                        disabled={loading}
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full px-4 py-2 border rounded-lg"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login as Admin'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Demo: <strong>admin@site</strong> / <strong>admin</strong>
                </p>
            </div>
        </div>
    )
}