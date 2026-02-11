<script setup lang="ts">
import { usePreview } from '~/composables/usePreview'
import { onMounted, computed } from 'vue'

const { isVisible: isPreviewVisible, previewUrl, close, currentFile } = usePreview()

const isVisible = computed(() => isPreviewVisible.value && currentFile.value?.type === 'video')


onMounted(() => {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isVisible.value) {
            close()
        }
    })
})

const handleVideoError = async (e: Event) => {
    const video = e.target as HTMLVideoElement
    if (video.error) {
        // Try to refresh token
        const { handle401 } = useTokenRefresh()
        const refreshed = await handle401()

        if (refreshed && previewUrl.value) {
            // Force reload by updating src (adding timestamp to bust cache if needed, 
            // though for 401s usually just retrying the same URL works if cookies are updated)
            // But we need to trigger a network request.
            const currentTime = video.currentTime
            const originalSrc = previewUrl.value

            // Force reload by updating src (adding timestamp to bust cache)
            const separator = originalSrc.includes('?') ? '&' : '?'
            video.src = `${originalSrc}${separator}t=${Date.now()}`
            video.currentTime = currentTime
            try {
                await video.play()
            } catch (e) { }
        }
    }
}
</script>

<template>
    <Teleport to="body">

        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="isVisible" class="fixed inset-0 bg-gray-900/75 z-60 transition-opacity" @click="close" />
        </Transition>


        <Transition enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100" leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <div v-if="isVisible"
                class="fixed inset-0 z-60 overflow-y-auto pointer-events-none p-4 md:p-8 flex items-center justify-center">
                <div
                    class="relative w-full max-w-6xl bg-white dark:bg-neutral-900 rounded-lg shadow-2xl flex flex-col overflow-hidden pointer-events-auto">

                    <div
                        class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 shrink-0">
                        <div class="flex items-center gap-2 overflow-hidden">
                            <FileIcon file-type="video" class="size-6" />
                            <h3 class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ currentFile?.name }}
                            </h3>
                        </div>
                        <div class="flex items-center gap-2">
                            <button @click="close"
                                class="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                    class="size-5">
                                    <path
                                        d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                </svg>
                            </button>
                        </div>
                    </div>


                    <div class="flex-1 relative bg-black flex items-center justify-center overflow-hidden aspect-video">
                        <video v-if="previewUrl" :src="previewUrl" controls autoplay
                            class="w-full h-full max-h-[80vh] outline-none" @error="handleVideoError"></video>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
