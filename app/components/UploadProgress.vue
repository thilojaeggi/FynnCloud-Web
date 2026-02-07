<script setup lang="ts">
const { uploads, removeUpload } = useUploads()
import FileIcon from './FileIcon.vue'

const isMinimized = ref(false)
const contentRef = ref<HTMLElement | null>(null)
const contentHeight = ref(0)

const hasUploads = computed(() => uploads.value.length > 0)

const activeUploadsCount = computed(() =>
    uploads.value.filter(u => u.status === 'uploading' || u.status === 'processing').length
)
const completedCount = computed(() =>
    uploads.value.filter(u => u.status === 'completed').length
)
const errorCount = computed(() =>
    uploads.value.filter(u => u.status === 'error').length
)

const summaryText = computed(() => {
    if (activeUploadsCount.value > 0) {
        return `${activeUploadsCount.value} uploading`
    }
    const parts: string[] = []
    if (completedCount.value > 0) parts.push(`${completedCount.value} done`)
    if (errorCount.value > 0) parts.push(`${errorCount.value} failed`)
    return parts.join(' · ') || 'All complete'
})

const overallProgress = computed(() => {
    if (uploads.value.length === 0) return 0
    const total = uploads.value.filter(u => u.status !== 'error').reduce((sum, u) => sum + u.progress, 0)
    return Math.round(total / uploads.value.length)
})

const isAllComplete = computed(() =>
    uploads.value.length > 0 && uploads.value.every(u => u.status === 'completed' || u.status === 'error')
)

const toggleMinimize = () => {
    isMinimized.value = !isMinimized.value
}

const updateHeight = () => {
    if (contentRef.value) {
        contentHeight.value = contentRef.value.scrollHeight
    }
}

watch(uploads, () => {
    nextTick(updateHeight)
}, { deep: true })

onMounted(() => {
    nextTick(updateHeight)
})

const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return '0 B/s'
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024))
    return `${(bytesPerSecond / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}
</script>

<template>
    <Transition enter-active-class="transition ease-[cubic-bezier(0.16,1,0.3,1)] duration-500"
        enter-from-class="translate-y-8 opacity-0 scale-[0.97]" enter-to-class="translate-y-0 opacity-100 scale-100"
        leave-active-class="transition ease-[cubic-bezier(0.7,0,0.84,0)] duration-300"
        leave-from-class="translate-y-0 opacity-100 scale-100" leave-to-class="translate-y-6 opacity-0 scale-[0.97]">
        <div v-if="hasUploads"
            class="fixed bottom-5 right-5 w-95 rounded-2xl overflow-hidden z-100
                   bg-white/92 backdrop-blur-xl backdrop-saturate-[1.8]
                   border border-black/6
                   shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_16px_-2px_rgba(0,0,0,0.08),0_12px_40px_-4px_rgba(0,0,0,0.06)]
                   dark:bg-zinc-900/95 dark:border-white/[0.07]
                   dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_4px_16px_-2px_rgba(0,0,0,0.4),0_12px_40px_-4px_rgba(0,0,0,0.3)]">
            <!-- Header -->
            <div class="relative px-4 py-3.5 flex justify-between items-center cursor-pointer select-none transition-colors
                       bg-gray-50/60 hover:bg-gray-100/80
                       dark:bg-white/3 dark:hover:bg-white/5" @click="toggleMinimize">
                <div class="flex items-center gap-3 min-w-0">
                    <!-- Animated icon -->
                    <div class="relative rounded-full flex items-center justify-center shrink-0" :class="isAllComplete
                        ? 'p-1 bg-transparent'
                        : 'p-1 bg-primary-500/8 dark:bg-primary-500/12'">
                        <div v-if="!isAllComplete"
                            class="absolute inset-0 rounded-full bg-primary-500/15 dark:bg-primary-500/20 animate-[icon-pulse_2s_ease-in-out_infinite]" />
                        <Icon :name="isAllComplete ? 'heroicons:check-circle-solid' : 'heroicons:cloud-arrow-up-solid'"
                            class="relative z-10 transition-transform duration-300" :class="isAllComplete
                                ? 'text-emerald-500 dark:text-emerald-400 w-7 h-7'
                                : 'text-primary-500 dark:text-primary-400 w-5 h-5'" />
                    </div>
                    <div class="min-w-0">
                        <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-none mb-0.5">
                            {{ isAllComplete ? 'Uploads complete' : 'Uploading files' }}
                        </h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400 leading-none tabular-nums">
                            {{ summaryText }}
                            <span v-if="!isAllComplete" class="text-gray-400 dark:text-gray-500">
                                · {{ overallProgress }}%
                            </span>
                        </p>
                    </div>
                </div>

                <button type="button" class="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
                           hover:bg-black/4 dark:hover:bg-white/6">
                    <Icon :name="isMinimized ? 'heroicons:chevron-up-solid' : 'heroicons:chevron-down-solid'"
                        class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-300" />
                </button>
            </div>

            <!-- Overall thin progress bar -->
            <div v-if="!isAllComplete" class="h-0.5 w-full bg-gray-100 dark:bg-white/5 relative overflow-hidden">
                <div class="h-full bg-linear-to-r from-blue-400 to-blue-500
                           dark:from-blue-500 dark:to-blue-400
                           transition-all duration-500 ease-out" :style="{ width: `${overallProgress}%` }" />
            </div>

            <!-- Upload List — grid-rows for smooth height transition -->
            <div class="grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
                :class="isMinimized ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'">
                <div class="overflow-hidden">
                    <div ref="contentRef" class="overflow-y-auto max-h-80 scrollbar-thin">
                        <TransitionGroup enter-active-class="transition ease-[cubic-bezier(0.16,1,0.3,1)] duration-400"
                            enter-from-class="opacity-0 -translate-y-2 scale-[0.98]"
                            enter-to-class="opacity-100 translate-y-0 scale-100"
                            leave-active-class="transition ease-in duration-200"
                            leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-[0.96]"
                            @after-enter="updateHeight" @after-leave="updateHeight">
                            <div v-for="(item, index) in uploads" :key="item.id" class="group relative transition-colors duration-150
                                       hover:bg-black/1.5 dark:hover:bg-white/2"
                                :class="index > 0 ? 'border-t border-black/4 dark:border-white/4' : ''">
                                <div class="flex items-center gap-3 px-4 py-3">
                                    <div class="relative shrink-0">
                                        <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300"
                                            :class="{
                                                'bg-red-50 dark:bg-red-500/10': item.status === 'error',
                                                'bg-emerald-50 dark:bg-emerald-500/10': item.status === 'completed',
                                                'bg-gray-50 dark:bg-white/5': item.status === 'uploading' || item.status === 'processing'
                                            }">
                                            <FileIcon :file-type="determineFileType(item.file)" />
                                        </div>
                                        <!-- Status dot -->
                                        <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full
                                                   border-2 border-white dark:border-zinc-900
                                                   transition-colors duration-300" :class="{
                                                    'bg-red-400': item.status === 'error',
                                                    'bg-emerald-400': item.status === 'completed',
                                                    'bg-primary-400 animate-pulse': item.status === 'uploading' || item.status === 'processing'
                                                }" />
                                    </div>

                                    <!-- Info -->
                                    <div class="min-w-0 flex-1">
                                        <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate leading-tight"
                                            :title="item.name">
                                            {{ item.name }}
                                        </p>
                                        <p class="text-[0.7rem] mt-0.5 leading-tight tabular-nums transition-colors duration-300"
                                            :class="{
                                                'text-red-500 dark:text-red-400': item.status === 'error',
                                                'text-emerald-600 dark:text-emerald-400': item.status === 'completed',
                                                'text-gray-500 dark:text-gray-400': item.status === 'uploading' || item.status === 'processing'
                                            }">
                                            <template v-if="item.status === 'error'">
                                                {{ $t(item.error || 'upload.error.unknown') }}
                                            </template>
                                            <template v-else-if="item.status === 'completed'">
                                                {{ $t('upload.state.completed') }}
                                            </template>
                                            <template v-else>
                                                {{ $t(`upload.state.${item.status}`, { progress: item.progress }) }}
                                                <span v-if="item.status === 'uploading' && item.speed && item.speed > 0"
                                                    class="text-gray-400 dark:text-gray-500">
                                                    · {{ formatSpeed(item.speed) }}
                                                </span>
                                            </template>
                                        </p>

                                        <!-- Progress bar only for active uploads -->
                                        <div v-if="item.status === 'uploading' || item.status === 'processing'"
                                            class="mt-2 w-full h-1 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                                            <div class="h-full rounded-full transition-[width] duration-500 ease-out
                                                       bg-primary-500/80 dark:bg-primary-400/80"
                                                :style="{ width: `${item.progress}%` }" />
                                        </div>
                                    </div>

                                    <button v-if="item.status === 'error' || item.status === 'completed'"
                                        @click.stop="removeUpload(item.id)" class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                                               text-gray-400/70 hover:text-gray-500 hover:bg-black/5
                                               dark:text-gray-500/50 dark:hover:text-gray-400 dark:hover:bg-white/[0.06]
                                               opacity-0 group-hover:opacity-100 focus:opacity-100
                                               transition-all duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                            class="w-3.5 h-3.5">
                                            <path
                                                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>
