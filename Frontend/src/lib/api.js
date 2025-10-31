import axios from 'axios'

const DEV = import.meta.env.DEV
const PROD_BACKEND_URL = import.meta.env.VITE_API_BASE
const DEV_PROXY_BASE = '/api/v1'  // For dev proxy

const API = import.meta.env.VITE_BACKEND_URL

// Example: Fetch colleges
fetch(`${API}/api/v1/colleges`)
    .then(res => res.json())
    .then(data => console.log(data))

const api = axios.create({
    baseURL: DEV ? DEV_PROXY_BASE : PROD_BACKEND_URL,
    withCredentials: true,
})

// Global token (rest of the code remains the same)
let accessToken = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken
export const clearAccessToken = () => { accessToken = null }

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
                const refreshBase = DEV ? 'https://collegedunia-o5i9.onrender.com/api/v1' : PROD_BACKEND_URL
                const resp = await axios.post(`${refreshBase}/auth/refresh`, {}, { withCredentials: true })
                const newToken = resp.data?.accessToken
                if (!newToken) throw new Error('No token')

                setAccessToken(newToken)
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return api(originalRequest)
            } catch (refreshError) {
                logout()
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api