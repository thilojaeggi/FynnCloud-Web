<script setup lang="ts">
import { usePreview } from '~/composables/usePreview'
import { onMounted, computed } from 'vue'

const { isVisible: isPreviewVisible, previewUrl, close, currentFile, isLoading, error, download } = usePreview()

const isVisible = computed(() => isPreviewVisible.value && currentFile.value?.type === 'pdf')


onMounted(() => {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isVisible.value) {
            close()
        }
    })
})
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
            <div v-if="isVisible" class="fixed inset-0 z-60 overflow-y-auto pointer-events-none p-4 md:p-8">
                <div class="flex min-h-full items-center justify-center">
                    <div
                        class="relative w-full h-[85vh] max-w-6xl bg-white dark:bg-neutral-900 rounded-lg shadow-2xl flex flex-col overflow-hidden pointer-events-auto">

                        <div
                            class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 shrink-0">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <FileIcon file-type="pdf" class="size-6" />
                                <h3 class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ currentFile?.name
                                    }}</h3>
                            </div>
                            <div class="flex items-center gap-2">
                                <button @click="download" title="Download PDF"
                                    class="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" x2="12" y1="15" y2="3" />
                                    </svg>
                                </button>
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


                        <div
                            class="flex-1 relative bg-gray-100 dark:bg-neutral-950 flex items-center justify-center overflow-hidden">
                            <div v-if="isLoading" class="flex flex-col items-center gap-3">
                                <div
                                    class="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 dark:border-neutral-700 border-t-primary-500">
                                </div>
                                <p class="text-gray-500 dark:text-gray-400 font-medium">Loading PDF...</p>
                            </div>

                            <div v-else-if="error" class="text-center p-6 max-w-md">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="size-12 text-red-500 mx-auto mb-3">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                <p class="text-gray-900 dark:text-gray-100 font-medium mb-1">Unable to load PDF</p>
                                <p class="text-gray-500 dark:text-gray-400 text-sm">{{ error }}</p>
                                <button @click="close"
                                    class="mt-4 px-4 py-2 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 rounded text-sm font-medium transition-colors">
                                    Close
                                </button>
                            </div>

                            <iframe v-else-if="previewUrl" :src="previewUrl" class="w-full h-full border-0 block"
                                title="PDF Viewer"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.animate-fade-in-up {
    animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}
</style>
