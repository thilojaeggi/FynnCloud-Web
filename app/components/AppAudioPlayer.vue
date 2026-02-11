<script setup lang="ts">
import { parseBlob } from 'music-metadata'
import { useApi } from '~/composables/useApi'
const { currentTrack, trackSrc, isPlaying, isVisible, pause, resume, close, playerHeight, next, previous, hasNext, hasPrevious, handleError } = useAudioPlayer()
const audioRef = ref<HTMLAudioElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const currentTime = ref(0)
const duration = ref(0)
const isDraggingProgress = ref(false)
const seekTime = ref(0) // Separate tracking for seek time when dragging


const seekInterval = ref<ReturnType<typeof setInterval> | null>(null)
const seekTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const isHoldSeeking = ref(false)
const SEEK_HOLD_DELAY = 300 // ms before hold-seek activates
const SEEK_STEP = 0.15 // seconds per interval tick
const SEEK_INTERVAL = 16 // ~60fps
const SEEK_ACCELERATION = 1.06 // multiplier applied each tick
let currentSeekStep = SEEK_STEP


const title = ref<string | null>(null)
const artist = ref<string | null>(null)
const album = ref<string | null>(null)
const coverInitials = ref<string>('')
const coverUrl = ref<string | null>(null)
const audioUrl = ref<string | null>(null)
const error = ref<string | null>(null)

const currentDisplayTime = computed(() => {
    return isDraggingProgress.value ? seekTime.value : currentTime.value
})

const progressPercent = computed(() => {
    if (!duration.value) return 0
    return (currentDisplayTime.value / duration.value) * 100
})

watch(isPlaying, (newVal) => {
    if (!audioRef.value || !audioUrl.value) return
    if (newVal) audioRef.value.play().catch(e => console.error(e))
    else audioRef.value.pause()
})

const loadTrack = async () => {

    error.value = null


    if (coverUrl.value) {
        URL.revokeObjectURL(coverUrl.value)
        coverUrl.value = null
    }
    if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value)
        audioUrl.value = null
    }


    title.value = null
    artist.value = null
    album.value = null
    coverInitials.value = ''

    if (!currentTrack.value || !trackSrc.value) return

    try {
        const response = await useApi<Blob>(
            trackSrc.value,
            {
                responseType: 'blob'
            }
        )

        if (!response) {
            throw new Error(`Failed to load audio`)
        }

        const blob = response

        audioUrl.value = URL.createObjectURL(blob)

        // Start playback immediately, don't wait for metadata
        await nextTick()
        if (audioRef.value) {
            audioRef.value.load()
            if (isPlaying.value) audioRef.value.play().catch(e => console.error("Play error:", e))
        }


        parseMetadata(blob)

    } catch (e: any) {
        console.error("Failed to load track", e)
        error.value = e.data?.localizationKey ? $t(e.data.localizationKey) : $t('error.unknown')
    }
}

const parseMetadata = async (blob: Blob) => {
    try {
        const metadata = await parseBlob(blob)

        if (metadata.common) {
            title.value = metadata.common.title || null
            artist.value = metadata.common.artist || null
            album.value = metadata.common.album || null

            if (metadata.common.picture && metadata.common.picture.length > 0) {
                const picture = metadata.common.picture[0]
                if (picture) {
                    const picBlob = new Blob([new Uint8Array(picture.data)], { type: picture.format })
                    coverUrl.value = URL.createObjectURL(picBlob)
                }
            }
        }
    } catch (e) {
        console.error("Failed to parse metadata", e)
    }
}

watch(trackSrc, async () => {

    currentTime.value = 0
    seekTime.value = 0
    duration.value = 0


    await loadTrack()
})

const onTimeUpdate = () => {
    if (audioRef.value && !isHoldSeeking.value) {
        currentTime.value = audioRef.value.currentTime
    }
}

const onLoadedMetadata = () => {
    if (audioRef.value) {
        duration.value = audioRef.value.duration
        if (isPlaying.value) audioRef.value.play().catch(e => console.error(e))
    }
}

const onEnded = () => {
    if (hasNext.value) {
        next()
    } else {
        pause()
        currentTime.value = 0
    }
}

const togglePlay = () => {
    if (isPlaying.value) pause()
    else resume()
}

const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}



const handleSeekStart = (e: MouseEvent) => {
    isDraggingProgress.value = true
    seekTime.value = currentTime.value
    handleSeekMove(e)
    document.body.style.cursor = 'grabbing'
    document.addEventListener('mousemove', handleSeekMove)
    document.addEventListener('mouseup', handleSeekEnd)
}

const handleSeekMove = (e: MouseEvent) => {
    if (!progressBarRef.value || !duration.value) return
    const rect = progressBarRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    seekTime.value = percent * duration.value
}

const handleSeekEnd = () => {
    isDraggingProgress.value = false
    if (audioRef.value) {
        audioRef.value.currentTime = seekTime.value
        currentTime.value = seekTime.value // Sync visuals immediately
    }
    document.removeEventListener('mousemove', handleSeekMove)
    document.removeEventListener('mouseup', handleSeekEnd)
    document.body.style.cursor = 'auto'
}



const startHoldSeek = (direction: 'forward' | 'backward') => {
    currentSeekStep = SEEK_STEP
    // Start a timeout; if the user holds long enough, begin continuous seeking
    seekTimeout.value = setTimeout(() => {
        isHoldSeeking.value = true
        seekInterval.value = setInterval(() => {
            if (!audioRef.value || !duration.value) return
            currentSeekStep *= SEEK_ACCELERATION
            const delta = direction === 'forward' ? currentSeekStep : -currentSeekStep
            const newTime = Math.max(0, Math.min(duration.value, audioRef.value.currentTime + delta))
            audioRef.value.currentTime = newTime
            currentTime.value = newTime
        }, SEEK_INTERVAL)
    }, SEEK_HOLD_DELAY)
}

const stopHoldSeek = (direction: 'forward' | 'backward') => {
    if (seekTimeout.value) {
        clearTimeout(seekTimeout.value)
        seekTimeout.value = null
    }
    if (seekInterval.value) {
        clearInterval(seekInterval.value)
        seekInterval.value = null
    }

    if (!isHoldSeeking.value) {
        if (direction === 'forward') next()
        else previous()
    }
    isHoldSeeking.value = false
    currentSeekStep = SEEK_STEP
}



const updateHeight = () => {
    if (containerRef.value) {
        playerHeight.value = containerRef.value.offsetHeight
    }
}

let resizeObserver: ResizeObserver | null = null

watch(() => isVisible.value, (visible) => {
    if (visible) {
        nextTick(() => {
            if (containerRef.value) {
                updateHeight()
                resizeObserver = new ResizeObserver(updateHeight)
                resizeObserver.observe(containerRef.value)
            }
        })
    } else {
        playerHeight.value = 0
        if (resizeObserver) {
            resizeObserver.disconnect()
            resizeObserver = null
        }
    }
})

onUnmounted(() => {
    document.removeEventListener('mousemove', handleSeekMove)
    document.removeEventListener('mouseup', handleSeekEnd)
    if (seekInterval.value) clearInterval(seekInterval.value)
    if (seekTimeout.value) clearTimeout(seekTimeout.value)
    if (coverUrl.value) URL.revokeObjectURL(coverUrl.value)
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
    if (resizeObserver) resizeObserver.disconnect()
    playerHeight.value = 0
})
</script>

<template>
    <Transition enter-active-class="transition-transform duration-300 ease-out" enter-from-class="translate-y-full"
        enter-to-class="translate-y-0" leave-active-class="transition-transform duration-300 ease-in"
        leave-from-class="translate-y-0" leave-to-class="translate-y-full">
        <div ref="containerRef" v-if="isVisible"
            class="absolute bottom-0 left-0 right-0 w-full z-40 flex flex-col justify-end pointer-events-none">
            <div
                class="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm mb-2 mx-2 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl p-1 flex flex-row gap-3 pointer-events-auto border border-gray-200 dark:border-neutral-700 transition-colors">
                <template v-if="error">
                    <div class="flex items-center gap-4 w-full px-2 py-1">
                        <div class="p-2 bg-red-50 rounded-full shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                class="size-6 text-red-500">
                                <path fill-rule="evenodd"
                                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0 flex flex-col">
                            <span class="font-medium text-red-900">Unable to play audio</span>
                            <span class="text-sm text-red-700 truncate">{{ error }}</span>
                        </div>
                        <button @click="close"
                            class="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                class="size-5">
                                <path
                                    d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                            </svg>
                        </button>
                    </div>
                </template>

                <template v-else>
                    <!-- Header: Title and Close -->
                    <div class="flex justify-between items-center w-full min-w-0 ">
                        <div
                            class="flex flex-row items-start gap-2 overflow-hidden bg-gray-100/80 dark:bg-neutral-800/80 p-1 rounded-xl border border-gray-200 dark:border-neutral-700 transition-colors">
                            <div
                                class="w-12 h-12 rounded-lg bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0 overflow-hidden relative">
                                <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover"
                                    alt="Album Art" />
                                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                    class="size-6 text-white/80">
                                    <path fill-rule="evenodd"
                                        d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122Z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="flex flex-col min-w-0 pr-2">
                                <span class="font-semibold text-md truncate">{{ title || currentTrack?.name }}</span>
                                <span class="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {{ [artist, album].filter(Boolean).join(' • ') || $t('audioPlayer.preview') }}
                                </span>
                            </div>
                        </div>



                        <div class="flex items-center gap-3 text-xs font-medium text-gray-400 flex-1 select-none px-4">
                            <span>{{ formatTime(currentDisplayTime) }}</span>
                            <div ref="progressBarRef" class="relative flex items-center flex-1 h-5 cursor-pointer group"
                                @mousedown="handleSeekStart">

                                <div class="absolute inset-x-0 h-2 bg-gray-200 rounded-full">
                                    <div class="absolute h-full bg-primary-500 rounded-full pointer-events-none transition-[width] duration-75 ease-linear"
                                        :style="{ width: `${Math.min(Math.max(1, progressPercent), 100)}%` }">
                                    </div>
                                </div>

                                <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary-500 text-white rounded-full shadow border border-gray-200 pointer-events-none transition-opacity duration-150"
                                    :class="isDraggingProgress ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                                    :style="{ left: `${Math.min(Math.max(1, progressPercent), 99)}%` }">
                                </div>
                            </div>
                            <span>{{ formatTime(duration) }}</span>
                        </div>


                        <div class="flex justify-center items-center gap-4 mr-4">

                            <button @mousedown.prevent="hasPrevious || duration ? startHoldSeek('backward') : undefined"
                                @mouseup="hasPrevious || duration ? stopHoldSeek('backward') : undefined"
                                @mouseleave="(seekInterval || seekTimeout) ? stopHoldSeek('backward') : undefined"
                                :disabled="!hasPrevious && !duration"
                                :class="{ 'opacity-50 cursor-not-allowed': !hasPrevious && !duration, 'active:scale-[0.98] cursor-pointer': hasPrevious || duration }"
                                class="group relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150 ease-out border-2 border-gray-200 dark:border-gray-800 select-none">
                                <div class="absolute inset-0 bg-linear-to-b from-white to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-[inset_0_2px_3px_rgba(255,255,255,0.9),0_6px_10px_rgba(0,0,0,0.15)] dark:shadow-none rounded-full transition-all duration-150 ease-out"
                                    :class="{
                                        'shadow-[inset_0_6px_12px_-2px_rgba(0,0,0,0.4)]!': isHoldSeeking,
                                        'group-active:shadow-[inset_0_6px_12px_-2px_rgba(0,0,0,0.4)]': hasPrevious || duration,
                                        'active:scale-none! shadow-none! scale-none!': !hasPrevious && !duration
                                    }">
                                </div>
                                <div
                                    class="relative z-10 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                                    <Icon name="heroicons:backward-solid" class="size-5" />
                                </div>
                            </button>


                            <button @click="togglePlay"
                                class="group relative inline-flex items-center justify-center w-14 h-14 rounded-full cursor-pointer transition-all duration-150 ease-out active:scale-[0.98] shadow-lg shadow-gray-900/3 border-2 border-gray-200 dark:border-none">
                                <div
                                    class="absolute inset-0 bg-linear-to-b from-primary-600 to-primary-800 shadow-[inset_0_2px_2px_rgba(255,255,255,0.3),0_4px_6px_rgba(0,0,0,0.3)] dark:shadow-none rounded-full transition-all duration-150 ease-out group-active:shadow-[inset_0_8px_16px_-2px_rgba(0,0,0,0.4)]">
                                </div>


                                <div class="relative z-10 text-white">
                                    <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                        fill="currentColor" class="size-7">
                                        <path fill-rule="evenodd"
                                            d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
                                            clip-rule="evenodd" />
                                    </svg>
                                    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                        fill="currentColor" class="size-7 pl-1">
                                        <path fill-rule="evenodd"
                                            d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                                            clip-rule="evenodd" />
                                    </svg>
                                </div>
                            </button>


                            <button @mousedown.prevent="hasNext || duration ? startHoldSeek('forward') : undefined"
                                @mouseup="hasNext || duration ? stopHoldSeek('forward') : undefined"
                                @mouseleave="(seekInterval || seekTimeout) ? stopHoldSeek('forward') : undefined"
                                :disabled="!hasNext && !duration"
                                :class="{ 'opacity-50 cursor-not-allowed scale-none! shadow-none!': !hasNext && !duration, 'active:scale-[0.98] cursor-pointer': hasNext || duration }"
                                class="group relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150 ease-out border-2 border-gray-200 dark:border-gray-800 select-none">
                                <div class="absolute inset-0 bg-linear-to-b from-white to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-[inset_0_2px_3px_rgba(255,255,255,0.9),0_6px_10px_rgba(0,0,0,0.15)] dark:shadow-none rounded-full transition-all duration-150 ease-out"
                                    :class="{
                                        'shadow-[inset_0_6px_12px_-2px_rgba(0,0,0,0.4)]!': isHoldSeeking,
                                        'group-active:shadow-[inset_0_6px_12px_-2px_rgba(0,0,0,0.4)]': hasNext || duration,
                                        'active:scale-none! shadow-none!': !hasNext && !duration
                                    }">
                                </div>

                                <div
                                    class="relative z-10 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                                    <Icon name="heroicons:forward-solid" class="size-5" />
                                </div>
                            </button>
                        </div>


                        <button @click="close"
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                class="size-5">
                                <path
                                    d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                            </svg>
                        </button>

                    </div>
                </template>
                <audio ref="audioRef" :src="audioUrl || undefined" @timeupdate="onTimeUpdate"
                    @loadedmetadata="onLoadedMetadata" @ended="onEnded" @error="handleError" class="hidden"></audio>
            </div>
        </div>
    </Transition>
</template>