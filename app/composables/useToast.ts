export interface Toast {
    id: string
    message: string
    type: 'error' | 'success' | 'warning' | 'info'
    duration?: number
}

export const useToast = () => {
    const toasts = useState<Toast[]>('toasts', () => [])
    const { t } = useI18n()

    const addToast = (message: string, type: Toast['type'], duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random()}`
        const toast: Toast = { id, message, type, duration }
        toasts.value.push(toast)
        return id
    }

    const removeToast = (id: string) => {
        toasts.value = toasts.value.filter(t => t.id !== id)
    }

    const toast = {
        error: (message: string, duration?: number) => addToast(message, 'error', duration),
        success: (message: string, duration?: number) => addToast(message, 'success', duration),
        warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
        info: (message: string, duration?: number) => addToast(message, 'info', duration),
    }

    return {
        toasts,
        toast,
        removeToast
    }
}