<script setup lang="ts">
import { usePreview } from '~/composables/usePreview'
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
const { isVisible: isPreviewVisible, previewUrl, close, currentFile, isLoading, error, download, next, previous, hasNext, hasPrevious } = usePreview()

const isVisible = computed(() => isPreviewVisible.value && currentFile.value?.type === 'image')


const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const imageRef = ref<HTMLImageElement | null>(null)

// Reset zoom/pan when image changes or closes
watch([previewUrl, isVisible], () => {
    resetZoom()
})

function resetZoom() {
    scale.value = 1
    translateX.value = 0
    translateY.value = 0
    isDragging.value = false
}

function zoomIn() {
    scale.value = Math.min(scale.value + 0.5, 5)
}

function zoomOut() {
    scale.value = Math.max(scale.value - 0.5, 0.5)
}

function handleWheel(event: WheelEvent) {
    event.preventDefault()

    const container = event.currentTarget as HTMLElement
    const rect = container.getBoundingClientRect()

    const delta = event.deltaY * -0.001
    const oldScale = scale.value
    const newScale = Math.min(Math.max(0.5, oldScale + delta), 5)

    const mouseX = event.clientX - rect.left - rect.width / 2
    const mouseY = event.clientY - rect.top - rect.height / 2

    const k = newScale / oldScale

    translateX.value = mouseX * (1 - k) + translateX.value * k
    translateY.value = mouseY * (1 - k) + translateY.value * k

    scale.value = newScale
}

function startDrag(event: MouseEvent | TouchEvent) {
    let clientX: number
    let clientY: number

    if ('touches' in event) {
        if (event.touches.length === 0) return
        clientX = event.touches[0]!.clientX
        clientY = event.touches[0]!.clientY
    } else {
        clientX = (event as MouseEvent).clientX
        clientY = (event as MouseEvent).clientY
    }

    isDragging.value = true
    startX.value = clientX - translateX.value
    startY.value = clientY - translateY.value
}

function onDrag(event: MouseEvent | TouchEvent) {
    if (!isDragging.value) return
    event.preventDefault() // Prevent scrolling on touch

    let clientX: number
    let clientY: number

    if ('touches' in event) {
        if (event.touches.length === 0) return
        clientX = event.touches[0]!.clientX
        clientY = event.touches[0]!.clientY
    } else {
        clientX = (event as MouseEvent).clientX
        clientY = (event as MouseEvent).clientY
    }

    translateX.value = clientX - startX.value
    translateY.value = clientY - startY.value
}

function stopDrag() {
    isDragging.value = false
}


onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    // Global mouseup to stop dragging if cursor leaves the element
    window.addEventListener('mouseup', stopDrag)
    window.addEventListener('touchend', stopDrag)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('mouseup', stopDrag)
    window.removeEventListener('touchend', stopDrag)
})

function handleKeydown(e: KeyboardEvent) {
    if (!isVisible.value) return

    if (e.key === 'Escape') {
        close()
    } else if (e.key === 'ArrowRight') {
        next()
    } else if (e.key === 'ArrowLeft') {
        previous()
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
            <div v-if="isVisible" class="fixed inset-0 z-60 overflow-hidden pointer-events-none p-4 md:p-8">
                <div class="flex min-h-full items-center justify-center relative">

                    <button v-if="hasPrevious" @click="previous" title="Previous Image"
                        class=" absolute left-4 md:left-10 flex items-center justify-center p-2 rounded-full bg-white dark:bg-neutral-800 hover:bg-white/80 dark:hover:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-xl backdrop-blur-sm transition-all pointer-events-auto z-70 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-neutral-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-8 h-8 pr-1">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    <div v-if="isVisible"
                        class="relative w-full h-[85vh] max-w-6xl bg-white dark:bg-neutral-900 rounded-lg shadow-2xl flex flex-col overflow-hidden pointer-events-auto">

                        <div
                            class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 shrink-0">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <FileIcon file-type="image" class="size-6" />

                                <h3 class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ currentFile?.name
                                    }}</h3>
                            </div>
                            <div class="flex items-center gap-2">

                                <button @click="resetZoom" title="Reset Zoom"
                                    v-if="scale !== 1 || translateX !== 0 || translateY !== 0"
                                    class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-600 dark:text-gray-300 font-medium transition-colors">
                                    Reset
                                </button>

                                <button @click="zoomOut" title="Zoom Out"
                                    class="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                        class="size-5">
                                        <path fill-rule="evenodd"
                                            d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z"
                                            clip-rule="evenodd" />
                                    </svg>
                                </button>
                                <span
                                    class="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[3ch] text-center">{{
                                        Math.round(scale * 100) }}%</span>
                                <button @click="zoomIn" title="Zoom In"
                                    class="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                        class="size-5">
                                        <path
                                            d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                                    </svg>
                                </button>

                                <div class="w-px h-6 bg-gray-200 dark:bg-neutral-700 mx-1"></div>

                                <button @click="download" title="Download Image"
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


                        <div class="flex-1 relative bg-gray-100 dark:bg-neutral-950 flex items-center justify-center overflow-hidden select-none"
                            @wheel="handleWheel" @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag"
                            @mouseleave="stopDrag" @touchstart="startDrag" @touchmove="onDrag" @touchend="stopDrag">
                            <div v-if="isLoading" class="flex flex-col items-center gap-3">
                                <div
                                    class="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 dark:border-neutral-700 border-t-purple-500">
                                </div>
                                <p class="text-gray-500 dark:text-gray-400 font-medium">Loading Image...</p>
                            </div>

                            <div v-else-if="error" class="text-center p-6 max-w-md">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    stroke-width="1.5" stroke="currentColor" class="size-12 text-red-500 mx-auto mb-3">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                <p class="text-gray-900 dark:text-gray-100 font-medium mb-1">Unable to load Image</p>
                                <p class="text-gray-500 dark:text-gray-400 text-sm">{{ error }}</p>
                                <button @click="close"
                                    class="mt-4 px-4 py-2 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 rounded text-sm font-medium transition-colors">
                                    Close
                                </button>
                            </div>

                            <img v-else-if="previewUrl" :src="previewUrl" ref="imageRef"
                                class="max-w-full max-h-full object-contain will-change-transform" :style="{
                                    transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                                    cursor: isDragging ? 'grabbing' : 'grab'
                                }" alt="Image Preview" draggable="false" />
                        </div>
                    </div>
                    <button v-if="hasNext" @click="next" title="Next Image"
                        class="absolute right-4 md:right-10 flex items-center justify-center p-2 rounded-full bg-white dark:bg-neutral-800 hover:bg-white/80 dark:hover:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-xl backdrop-blur-sm transition-all pointer-events-auto z-70 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-neutral-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-8 h-8 pl-1">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>

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
