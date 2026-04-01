<script setup lang="ts">
import { ref } from 'vue'

const { networkDelay, isDevMenuOpen, forceError, simulate401, slowUploads, debugUI } = useDevConfig()
const { isOffline } = useBackEndConfig()
const isDev = import.meta.dev

const toggleMenu = () => {
    isDevMenuOpen.value = !isDevMenuOpen.value
}

const delayOptions = [
    { label: 'None', value: 0 },
    { label: '0.5s', value: 500 },
    { label: '1s', value: 1000 },
    { label: '2s', value: 2000 },
    { label: '5s', value: 5000 },
]

const resetState = () => {
    if (confirm("Are you sure you want to completely clear browser state?")) {
        localStorage.clear()
        sessionStorage.clear()
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        window.location.reload()
    }
}

</script>

<template>
    <div v-if="isDev" class="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3 font-sans">

        <!-- Expanded Menu Panel (Styled like AppDialog) -->
        <transition enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-4 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-4 scale-95">
            <div v-if="isDevMenuOpen"
                class="w-72 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">

                <div class="flex items-start justify-between px-4 pt-3 pb-2">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Icon name="heroicons:wrench-screwdriver-20-solid" class="w-5 h-5 text-primary-500" />
                        Dev Menu
                    </h3>
                    <button @click="toggleMenu"
                        class="inline-flex items-center justify-center p-1 -mr-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                        <Icon name="heroicons:x-mark-20-solid" class="w-4 h-4" />
                    </button>
                </div>

                <div class="px-4 pb-4 pt-2 space-y-5">

                    <!-- Network Delay -->
                    <div class="space-y-3">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Simulated Network Delay
                        </label>

                        <div class="flex flex-wrap gap-2">
                            <button v-for="option in delayOptions" :key="option.value"
                                @click="networkDelay = option.value"
                                class="px-2.5 py-1 text-[11px] font-medium rounded-xl border transition-all duration-200"
                                :class="[
                                    networkDelay === option.value
                                        ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                        : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700'
                                ]">
                                {{ option.label }}
                            </button>
                        </div>

                        <div class="flex items-center gap-4 pt-1">
                            <input type="range" v-model.number="networkDelay" min="0" max="10000" step="100"
                                class="flex-1 h-2 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-500" />
                            <span
                                class="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[48px] text-right font-mono">
                                {{ networkDelay }}ms
                            </span>
                        </div>
                    </div>

                    <hr class="border-gray-100 dark:border-neutral-800" />

                    <!-- API & Network -->
                    <div class="space-y-3">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            API & Network Tools
                        </label>

                        <div class="grid grid-cols-2 gap-2">
                            <button @click="isOffline = !isOffline; toggleMenu()"
                                class="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-xl border transition-all duration-200"
                                :class="isOffline ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-neutral-700 hover:border-orange-300'">
                                <Icon name="heroicons:wifi-20-solid" class="w-3.5 h-3.5" v-if="!isOffline" />
                                <Icon name="heroicons:wifi-slash-20-solid" class="w-3.5 h-3.5" v-else />
                                Offline Mode
                            </button>

                            <button @click="slowUploads = !slowUploads"
                                class="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-xl border transition-all duration-200"
                                :class="slowUploads ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-neutral-700 hover:border-indigo-300'">
                                <Icon name="heroicons:arrow-up-tray-20-solid" class="w-3.5 h-3.5" />
                                Slow Uploads
                            </button>

                            <button @click="forceError = true; toggleMenu()"
                                class="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-xl border transition-all duration-200 bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-neutral-700 hover:border-red-300 hover:text-red-600 cursor-pointer"
                                title="Throws a 500 error on the very next API request">
                                <Icon name="heroicons:exclamation-circle-20-solid" class="w-3.5 h-3.5" />
                                Force 500
                            </button>

                            <button @click="simulate401 = true; toggleMenu()"
                                class="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-xl border transition-all duration-200 bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-neutral-700 hover:border-yellow-400 hover:text-yellow-600 cursor-pointer"
                                title="Throws a 401 unauthorized on the very next API request">
                                <Icon name="heroicons:lock-closed-20-solid" class="w-3.5 h-3.5" />
                                Mock 401
                            </button>
                        </div>
                    </div>

                    <hr class="border-gray-100 dark:border-neutral-800" />

                    <!-- UI Tools -->
                    <div class="space-y-3">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            UI Tools
                        </label>
                        <div class="grid grid-cols-2 gap-2">
                            <button @click="debugUI = !debugUI"
                                class="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-xl border transition-all duration-200"
                                :class="debugUI ? 'bg-teal-500 text-white border-teal-500 shadow-sm' : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-neutral-700 hover:border-teal-300'">
                                <Icon name="heroicons:view-columns-20-solid" class="w-3.5 h-3.5" />
                                UI Outlines
                            </button>
                            <button @click="resetState"
                                class="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-xl border transition-all duration-200 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 cursor-pointer">
                                <Icon name="heroicons:trash-20-solid" class="w-3.5 h-3.5" />
                                Clear State
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Floating Button Trigger -->
        <button @click="toggleMenu"
            class="relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 border border-gray-100 dark:border-neutral-700"
            :class="[
                isDevMenuOpen
                    ? 'bg-primary-600 border-primary-500 text-white'
                    : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
            ]" title="Toggle Dev Menu">
            <Icon name="heroicons:beaker-20-solid" class="w-6 h-6" />

            <!-- Badges -->
            <div class="absolute -top-1 -right-1 flex gap-1">
                <span v-if="isOffline"
                    class="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-500 text-white text-[9px] font-bold shadow-sm border border-white dark:border-neutral-800">
                    <Icon name="heroicons:wifi-slash-16-solid" class="w-2.5 h-2.5" />
                </span>
                <span v-if="networkDelay > 0"
                    class="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold shadow-sm border border-white dark:border-neutral-800">
                    {{ networkDelay >= 1000 ? (networkDelay / 1000) + 's' : networkDelay }}
                </span>
            </div>
        </button>

    </div>
</template>
