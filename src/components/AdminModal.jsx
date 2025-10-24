export default function AdminModal({ close }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Admin Panel</h2>
                    <button onClick={close} className="text-gray-500 hover:text-gray-800">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-6 rounded text-center">
                        <h3 className="font-bold text-lg">Total Colleges</h3>
                        <p className="text-3xl font-bold text-indigo-600">10,000+</p>
                    </div>
                    <div className="bg-gray-100 p-6 rounded text-center">
                        <h3 className="font-bold text-lg">Total Users</h3>
                        <p className="text-3xl font-bold text-indigo-600">1M+</p>
                    </div>
                </div>
                <button
                    onClick={close}
                    className="mt-6 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                >
                    Close
                </button>
            </div>
        </div>
    )
}