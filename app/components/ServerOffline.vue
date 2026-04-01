<script setup lang="ts">
const { initAppConfig, isOffline } = useBackEndConfig()
const isLoading = ref(false)
const hasFailed = ref(false)
let pollingInterval: ReturnType<typeof setInterval> | null = null

const performCheck = async (isBackground = false) => {
    if (isLoading.value) return;

    if (!isBackground) {
        isLoading.value = true
        hasFailed.value = false
    }

    await initAppConfig()

    if (isOffline.value) {
        if (!isBackground) {
            hasFailed.value = true
        }
    }

    if (!isBackground) {
        isLoading.value = false
    }
}

const retry = () => performCheck(false)

onMounted(() => {
    pollingInterval = setInterval(() => {
        performCheck(true)
    }, 5000)
})

onUnmounted(() => {
    if (pollingInterval) {
        clearInterval(pollingInterval)
    }
})
</script>

<template>
    <AuthCard :title="$t('error.serverOffline', 'Server Offline')">
        <div class="space-y-4">
            <div class="w-full bg-white/5 rounded-xl border border-white/10 p-5 flex flex-col gap-3">
                <div class="flex items-start gap-4">
                    <div class="p-2 bg-red-500/10 rounded-lg ring-1 ring-red-500/20 ring-inset shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-5 h-5 text-red-500">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>

                    <div class="flex flex-col pt-0.5 space-y-2">
                        <p class="text-zinc-300 text-sm leading-relaxed">
                            {{ $t('error.serverUnreachable', `We're unable to connect to FynnCloud. Please check your
                            internet connection or try again later.`) }}
                        </p>

                        <div class="h-4 flex items-center justify-start">
                            <Transition enter-active-class="transition duration-200 ease-out"
                                enter-from-class="transform scale-95 opacity-0"
                                enter-to-class="transform scale-100 opacity-100"
                                leave-active-class="transition duration-150 ease-in"
                                leave-from-class="transform scale-100 opacity-100"
                                leave-to-class="transform scale-95 opacity-0">
                                <p v-if="hasFailed" class="text-red-400 text-xs font-medium flex items-center gap-1.5">
                                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {{ $t('error.stillUnableToConnect', 'Still unable to connect.') }}
                                </p>
                            </Transition>
                        </div>
                    </div>
                </div>
            </div>

            <div class="pt-2">
                <AppButton block variant="white" :loading="isLoading" @click="retry">
                    {{ $t('action.retryConnection', 'Retry Connection') }}
                </AppButton>
            </div>
        </div>
    </AuthCard>
</template>