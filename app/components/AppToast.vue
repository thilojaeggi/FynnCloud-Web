<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { Toast } from '~/composables/useToast'

const props = defineProps<{
    toast: Toast
    onClose: (id: string) => void
    duration?: number
}>()

const progress = ref(100)
const isHovered = ref(false)
let progressTimer: ReturnType<typeof setInterval> | null = null
let pausedProgress = 100

const config = computed(() => {
    const configs = {
        error: {
            icon: 'heroicons:exclamation-circle-20-solid',
            toastBg: 'bg-red-700',
            borderColor: 'border-red-200 dark:border-red-900/50',
            progressBg: 'bg-red-500 dark:bg-red-600',
            glowColor: 'shadow-red-500/20 dark:shadow-red-500/30',
        },
        success: {
            icon: 'heroicons:check-16-solid',
            toastBg: 'bg-green-700',
            borderColor: 'border-green-200 dark:border-green-900/50',
            progressBg: 'bg-green-500 dark:bg-green-600',
            glowColor: 'shadow-green-500/20 dark:shadow-green-500/30',
        },
        warning: {
            icon: 'mage:exclamation-square-fill',
            toastBg: 'bg-amber-500',
            borderColor: 'border-amber-200 dark:border-amber-900/50',
            progressBg: 'bg-amber-500 dark:bg-amber-600',
            glowColor: 'shadow-amber-500/20 dark:shadow-amber-500/30',
        },
        info: {
            icon: 'material-symbols:info-rounded',
            toastBg: 'bg-blue-700',
            borderColor: 'border-blue-200 dark:border-blue-900/50',
            progressBg: 'bg-blue-500 dark:bg-blue-600',
            glowColor: 'shadow-blue-500/20 dark:shadow-blue-500/30',
        },
    }
    return configs[props.toast.type]
})

const handleClose = () => {
    if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
    }
    props.onClose(props.toast.id)
}

const pauseProgress = () => {
    isHovered.value = true
    if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
        pausedProgress = progress.value
    }
}

const resumeProgress = () => {
    isHovered.value = false
    if (props.duration && props.duration > 0 && !progressTimer) {
        const interval = 50
        const decrement = (interval / props.duration) * 100

        progressTimer = setInterval(() => {
            progress.value -= decrement
            if (progress.value <= 0) {
                handleClose()
            }
        }, interval)
    }
}

onMounted(() => {
    if (props.duration && props.duration > 0) {
        const interval = 50
        const decrement = (interval / props.duration) * 100

        progressTimer = setInterval(() => {
            progress.value -= decrement
            if (progress.value <= 0) {
                handleClose()
            }
        }, interval)
    }
})

onUnmounted(() => {
    if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
    }
})
</script>

<template>
    <div class="toast-container flex items-stretch min-w-40 max-w-md rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300 ease-out"
        :class="[
            config.toastBg,
            config.borderColor,
            config.glowColor,
        ]" @mouseenter="pauseProgress" @mouseleave="resumeProgress">
        <div class="flex-1 flex items-center gap-3 px-4 py-4 relative">
            <Icon :name="config.icon"
                class="w-6 h-6 relative z-10 drop-shadow-sm text-white transition-transform duration-300 ease-out" />

            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium leading-relaxed break-words text-white">
                    {{ toast.message }}
                </p>
            </div>

            <button @click="handleClose"
                class="shrink-0 p-1.5 rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-200 flex items-center justify-center group active:scale-90"
                aria-label="Close notification">
                <Icon name="heroicons:x-mark" class="w-5 h-5 text-white" />
            </button>

            <!-- Progress bar with smooth animation -->
            <div v-if="duration" class="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                <div class="h-full transition-all duration-100 ease-linear rounded-r-full" :class="config.progressBg"
                    :style="{
                        width: `${progress}%`,
                        opacity: isHovered ? 0.5 : 1
                    }"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.toast-container {
    box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05),
        0 0 0 1px rgba(0, 0, 0, 0.05);
}

.dark .toast-container {
    box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.4),
        0 4px 6px -2px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1);
}

.toast-container:hover {
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.15),
        0 10px 10px -5px rgba(0, 0, 0, 0.08),
        0 0 0 1px rgba(0, 0, 0, 0.05);
}

.dark .toast-container:hover {
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.5),
        0 10px 10px -5px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.15);
}

.icon-wrapper {
    animation: iconEntry 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>