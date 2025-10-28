import React from 'react'

export default function AdminTopBar({ user, onLogout }) {
    return (
        <div className="w-full bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="text-lg font-semibold">Admin Panel</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
                <div>
                    <button
                        onClick={() => onLogout()}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}
