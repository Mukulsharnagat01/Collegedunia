import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { logout } from '../lib/api'; // Use centralized logout
import {
    HomeIcon,
    AcademicCapIcon,
    BookOpenIcon,
    ClipboardDocumentCheckIcon,
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    ArrowLeftOnRectangleIcon,
    NewspaperIcon,
    BriefcaseIcon
} from '@heroicons/react/24/outline';

const AdminPanel = () => {
    const [activePage, setActivePage] = useState('Dashboard');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch stats on mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await api.get('/admin/stats');
                setStats(response.data);
            } catch (err) {
                const msg = err?.response?.data?.error || 'Failed to load dashboard';
                setError(msg);
                console.error('Admin stats error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (activePage === 'Dashboard') {
            fetchStats();
        }
    }, [activePage]);

    const menuItems = [
        { name: 'Dashboard', icon: HomeIcon },
        { name: 'Colleges', icon: AcademicCapIcon },
        { name: 'Courses', icon: BookOpenIcon },
        { name: 'Exams', icon: ClipboardDocumentCheckIcon },
        { name: 'Reviews', icon: ChatBubbleLeftRightIcon },
        { name: 'Leads / Enquiries', icon: UserGroupIcon },
        { name: 'Advertisements / Featured Listings', icon: NewspaperIcon },
        { name: 'Analytics / Reports', icon: ChartBarIcon },
        { name: 'Users / Admins', icon: BriefcaseIcon },
        { name: 'Settings', icon: Cog6ToothIcon },
    ];

    const handleLogout = async () => {
        await logout(); // Uses api.js logout with refresh token cleanup
    };

    // Render page content
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    {error}
                </div>
            );
        }

        if (activePage === 'Dashboard' && stats) {
            return (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Total Colleges', value: stats.totalColleges },
                            { label: 'Pending Reviews', value: stats.pendingReviews },
                            { label: 'New Leads Today', value: stats.newLeadsToday },
                            { label: 'Featured Colleges', value: stats.featuredColleges },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                            >
                                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Traffic Chart Placeholder */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Traffic Overview</h3>
                        <div className="h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                            <p className="text-gray-500">Traffic chart will appear here (Recharts / Chart.js)</p>
                        </div>
                    </div>
                </>
            );
        }

        // Placeholder for other pages
        return (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{activePage}</h3>
                <p className="text-gray-600">This section is under development.</p>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-gradient-to-b from-[#4A90E2] to-[#357ABD] text-white p-6 shadow-lg">
                <div className="flex items-center mb-10">
                    <AcademicCapIcon className="h-8 w-8 mr-2" />
                    <h1 className="text-2xl font-bold">Collegedunia</h1>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.name}
                                onClick={() => setActivePage(item.name)}
                                className={`flex items-center w-full p-3 rounded-lg transition-all ${activePage === item.name
                                    ? 'bg-white text-[#4A90E2] shadow-md font-semibold'
                                    : 'hover:bg-blue-600 text-white'
                                    }`}
                            >
                                <Icon className="h-5 w-5 mr-3" />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}

                    <div className="pt-6 mt-6 border-t border-blue-400">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full p-3 rounded-lg hover:bg-red-600 text-white transition-all"
                        >
                            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
                            <span>Logout</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">{activePage}</h2>
                        <div className="text-sm text-gray-500">
                            Admin • {new Date().toLocaleDateString()}
                        </div>
                    </div>

                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;