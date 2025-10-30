import axios from 'axios'

// Base URL from .env
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4001/api/v1'

const api = axios.create({
    baseURL: import.meta.env.DEV ? '/api' : 'https://collegedunia-backend.onrender.com/api',
    withCredentials: true,
})

// Global token
let accessToken = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken
export const clearAccessToken = () => { accessToken = null }

// LOGOUT FIRST (must be defined before use in interceptor)
export const logout = async () => {
    try {
        await api.post('/auth/logout')
    } catch (err) {
        console.warn('Logout API failed (non-critical)', err)
    } finally {
        clearAccessToken()
        localStorage.removeItem('collegedunia_user')
        window.location.assign('/')
    }
}

// Inject token
api.interceptors.request.use(config => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
})

// Auto-refresh on 401
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const resp = await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true })
                const newToken = resp.data?.accessToken
                if (!newToken) throw new Error('No token')

                setAccessToken(newToken)
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return api(originalRequest)
            } catch (refreshError) {
                logout() // Now safe to call
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api