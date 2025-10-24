import { useState } from 'react'

export default function LoginModal({ close, switchToSignup, onLogin }) {
    const [email, setEmail] = useState('')
    const [pwd, setPwd] = useState('')

    const submit = (e) => {
        e.preventDefault()
        onLogin(email, pwd)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Login</h2>
                    <button onClick={close} className="text-gray-500 hover:text-gray-800">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Password</label>
                        <input
                            type="password"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                        Login
                    </button>
                    <p className="text-center text-sm">
                        Don't have an account?{' '}
                        <button type="button" onClick={switchToSignup} className="text-indigo-600 underline">
                            Sign up
                        </button>
                    </p>
                </form>
            </div>
        </div>
    )
}