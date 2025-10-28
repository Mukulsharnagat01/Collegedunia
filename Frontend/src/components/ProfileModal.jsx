export default function ProfileModal({ close, user }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">My Profile</h2>
                    <button onClick={close} className="text-gray-500 hover:text-gray-800">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="flex items-center mb-6">
                    <img src={user?.avatar} alt={user?.name} className="w-20 h-20 rounded-full" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold">{user?.name}</h3>
                        <p className="text-gray-600">{user?.email}</p>
                        <p className="text-sm text-indigo-600 capitalize">{user?.type}</p>
                    </div>
                </div>
                <button
                    onClick={close}
                    className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                >
                    Close
                </button>
            </div>
        </div>
    )
}