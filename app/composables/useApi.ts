let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = []

const processQueue = (error: any = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve()
        }
    })
    failedQueue = []
}

export const useApi = <T>(url: string, options: any = {}) => {
    const apiBase = useApiBase()

    const defaults = {
        baseURL: apiBase
    }

    const params = {
        ...defaults,
        ...options,
        headers: {
            ...options.headers
        }
    }

    return $fetch<T>(url, {
        ...params,
    }).catch(async (error) => {
        if (error.response?.status === 401) {
            // If the failed request was the refresh token request itself, log out
            if (url.includes('/api/auth/refresh')) {
                const user = useState('user')
                user.value = null
                navigateTo('/auth/login')
                throw error
            }

            if (isRefreshing) {
                // unexpected error: if many requests fail at once, we queue them
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(() => {
                    return $fetch<T>(url, options as any)
                }).catch((e) => {
                    return Promise.reject(e)
                })
            }

            isRefreshing = true

            try {
                // Attempt to refresh the token
                await $fetch(`${apiBase}/api/auth/refresh`, { method: 'POST' })
                
                // On success, process queue and retry original
                processQueue()
                return $fetch<T>(url, options as any)
            } catch (err) {
                // On failure, reject all and logout
                processQueue(err)
                const user = useState('user')
                user.value = null
                navigateTo('/auth/login')
                throw err
            } finally {
                isRefreshing = false
            }
        }

        throw error as Error
    })
}
