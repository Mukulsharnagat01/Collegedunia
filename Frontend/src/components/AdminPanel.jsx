import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { logout } from '../lib/api'

const TABS = [
    { id: 'colleges', label: 'Colleges', icon: 'university' },
    { id: 'courses', label: 'Courses', icon: 'book-open' },
    { id: 'exams', label: 'Exams', icon: 'clipboard' },
]

const PLACEHOLDER = 'https://placehold.co/80x80/eee/999?text=No+Image'

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('colleges')
    const [data, setData] = useState([])
    const [filteredData, setFilteredData] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(null)
    const [editingData, setEditingData] = useState({})
    const [formData, setFormData] = useState({})
    const [imageFile, setImageFile] = useState(null)
    const [imagePreviewUrl, setImagePreviewUrl] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [colleges, setColleges] = useState([])
    const navigate = useNavigate()

    // Fetch colleges for dropdown
    useEffect(() => {
        api.get('/admin/colleges')
            .then(res => setColleges(Array.isArray(res.data) ? res.data : []))
            .catch(() => setColleges([]))
    }, [])

    // Fetch current tab data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const resp = await api.get(`/admin/${activeTab}`)
                const items = Array.isArray(resp.data) ? resp.data : []
                setData(items)
                setFilteredData(items)
            } catch (err) {
                console.error(`Failed to load ${activeTab}:`, err)
                alert(err?.response?.data?.error || `Failed to load ${activeTab}`)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [activeTab])

    // Search (includes populated college name)
    useEffect(() => {
        const term = searchTerm.toLowerCase()
        const filtered = data.filter(item => {
            const values = Object.values(item)
            const collegeName = item.collegeId?.name || item.collegeId || ''
            return [...values, collegeName].some(val =>
                String(val || '').toLowerCase().includes(term)
            )
        })
        setFilteredData(filtered)
    }, [searchTerm, data])

    // Handle image preview
    useEffect(() => {
        if (imageFile) {
            const reader = new FileReader()
            reader.onloadend = () => setImagePreviewUrl(reader.result)
            reader.readAsDataURL(imageFile)
        } else {
            setImagePreviewUrl('')
        }
    }, [imageFile])

    // Save (Add or Edit)
    const handleSave = async (item) => {
        try {
            const form = new FormData()
            const payload = { ...item }

            // Convert date
            if (activeTab === 'exams' && payload.date) {
                payload.date = new Date(payload.date).toISOString()
            }

            // Append fields
            Object.keys(payload).forEach(key => {
                if (key !== 'imageFile' && payload[key] !== undefined && payload[key] !== null) {
                    form.append(key, payload[key])
                }
            })

            if (imageFile) form.append('image', imageFile)

            const resp = editing
                ? await api.put(`/admin/${activeTab}/${item._id}`, form)
                : await api.post(`/admin/${activeTab}`, form)

            const updatedItem = resp.data
            if (editing) {
                setData(data.map(d => d._id === updatedItem._id ? updatedItem : d))
            } else {
                setData([updatedItem, ...data])
                resetForm()
            }
            setEditing(null)
            alert('Saved successfully!')
        } catch (err) {
            const msg = err?.response?.data?.error || 'Save failed'
            alert(msg)
        }
    }

    const resetForm = () => {
        setFormData({})
        setImageFile(null)
        setImagePreviewUrl('')
        setShowForm(false)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this item?')) return
        try {
            await api.delete(`/admin/${activeTab}/${id}`)
            setData(data.filter(d => d._id !== id))
        } catch (err) {
            alert(err?.response?.data?.error || 'Delete failed')
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const getFields = () => {
        if (activeTab === 'colleges') return ['name', 'location', 'rating', 'fees', 'image']
        if (activeTab === 'courses') return ['name', 'collegeId', 'duration', 'fees', 'description']
        return ['name', 'date', 'collegeId', 'description']
    }

    const fields = getFields()

    const renderFieldInput = (field, isEdit = false, item = {}) => {
        const value = isEdit ? (editingData[field] ?? item[field] ?? '') : (formData[field] ?? '')

        if (field === 'image') {
            return (
                <div className="space-y-2">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files[0]
                            if (isEdit) setImageFile(file)
                            else setImageFile(file)
                        }}
                        className="w-full text-sm"
                    />
                    {(imagePreviewUrl || (isEdit && item.image)) && (
                        <img
                            src={imagePreviewUrl || item.image || PLACEHOLDER}
                            alt="Preview"
                            className="h-32 w-32 object-cover rounded border"
                        />
                    )}
                </div>
            )
        }

        if (field === 'collegeId' && (activeTab === 'courses' || activeTab === 'exams')) {
            return (
                <select
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value
                        if (isEdit) setEditingData({ ...editingData, collegeId: val })
                        else setFormData({ ...formData, collegeId: val })
                    }}
                    className="w-full px-3 py-2 border rounded"
                >
                    <option value="">Select College</option>
                    {colleges.map(college => (
                        <option key={college._id} value={college._id}>
                            {college.name} ({college.location})
                        </option>
                    ))}
                </select>
            )
        }

        if (field === 'date') {
            return (
                <input
                    type="date"
                    value={value.split('T')[0]}
                    onChange={(e) => {
                        const val = e.target.value
                        if (isEdit) setEditingData({ ...editingData, date: val })
                        else setFormData({ ...formData, date: val })
                    }}
                    className="w-full px-3 py-2 border rounded"
                />
            )
        }

        return (
            <input
                type={field === 'rating' || field === 'fees' ? 'number' : 'text'}
                value={value}
                placeholder={field}
                step={field === 'rating' ? '0.1' : undefined}
                min={field === 'rating' ? '0' : undefined}
                max={field === 'rating' ? '10' : undefined}
                onChange={(e) => {
                    const val = e.target.value
                    if (isEdit) setEditingData({ ...editingData, [field]: val })
                    else setFormData({ ...formData, [field]: val })
                }}
                className="w-full px-3 py-2 border rounded"
            />
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-gradient-to-b from-indigo-600 to-purple-700 text-white p-6">
                <h1 className="text-2xl font-bold mb-8 flex items-center">
                    <i className="fas fa-cog mr-2"></i> Admin Panel
                </h1>
                <nav className="space-y-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id)
                                setShowForm(false)
                                setEditing(null)
                                resetForm()
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition ${activeTab === tab.id ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
                                }`}
                        >
                            <i className={`fas fa-${tab.icon}`}></i>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 mt-8 hover:bg-red-600 transition"
                    >
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800 capitalize">{activeTab}</h2>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                        {showForm ? 'Cancel' : 'Add New'}
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Add Form */}
                {showForm && (
                    <div className="bg-white p-6 rounded-lg shadow mb-6">
                        <h3 className="text-lg font-semibold mb-4">Add New {activeTab.slice(0, -1)}</h3>
                        <div className="space-y-3">
                            {fields.map(field => (
                                <div key={field}>{renderFieldInput(field, false)}</div>
                            ))}
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleSave(formData)}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {fields.map(field => (
                                        <th key={field} className="px-6 py-4 text-left text-sm font-semibold text-gray-700 capitalize">
                                            {field}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={fields.length + 1} className="text-center py-8 text-gray-500">
                                            No {activeTab} found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map(item => (
                                        <tr key={item._id} className="border-b hover:bg-gray-50">
                                            {fields.map(field => (
                                                <td key={field} className="px-6 py-4">
                                                    {editing === item._id ? (
                                                        renderFieldInput(field, true, item)
                                                    ) : field === 'image' ? (
                                                        <img
                                                            src={item.image || PLACEHOLDER}
                                                            alt="college"
                                                            className="h-12 w-12 object-cover rounded"
                                                        />
                                                    ) : field === 'date' ? (
                                                        <span className="text-gray-700">
                                                            {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                                                        </span>
                                                    ) : field === 'collegeId' ? (
                                                        <span className="text-gray-700">
                                                            {item.collegeId?.name || item.collegeId || '-'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-700">{String(item[field] || '-')}</span>
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 text-center space-x-2">
                                                {editing === item._id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleSave({ ...item, ...editingData })}
                                                            className="text-green-600 hover:underline text-sm"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditing(null)
                                                                setImageFile(null)
                                                                setImagePreviewUrl('')
                                                            }}
                                                            className="text-gray-600 hover:underline text-sm ml-2"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditing(item._id)
                                                                setEditingData({
                                                                    ...item,
                                                                    collegeId: item.collegeId?._id || item.collegeId
                                                                })
                                                                setImageFile(null)
                                                                setImagePreviewUrl('')
                                                            }}
                                                            className="text-blue-600 hover:underline text-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item._id)}
                                                            className="text-red-600 hover:underline text-sm ml-2"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}