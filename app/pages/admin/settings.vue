<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { t } = useI18n()
const { toast } = useToast()
const { setPrimaryColor, availableColors } = useTheme()
const { initAppConfig } = useBackEndConfig()

useHead({ title: t('admin.settings') })

interface SettingsResponse {
    appName: string
    primaryColor: string
}

const form = reactive({ appName: '', primaryColor: '' })
const loading = ref(true)
const saving = ref(false)
const hasChanges = ref(false)
let originalValues = { appName: '', primaryColor: '' }

const fetchSettings = async () => {
    loading.value = true
    try {
        const data = await useApi<SettingsResponse>('/api/settings')
        if (data) {
            form.appName = data.appName
            form.primaryColor = data.primaryColor
            originalValues = { appName: data.appName, primaryColor: data.primaryColor }
        }
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

watch(() => ({ ...form }), (newVal) => {
    hasChanges.value = newVal.appName !== originalValues.appName
        || newVal.primaryColor !== originalValues.primaryColor
}, { deep: true })

const saveSettings = async (event?: MouseEvent) => {
    saving.value = true
    try {
        const data = await useApi<SettingsResponse>('/api/settings', {
            method: 'PUT',
            body: { appName: form.appName, primaryColor: form.primaryColor }
        })

        if (data) {
            hasChanges.value = false
            // Helper to update state
            const updateState = () => {
                originalValues = { appName: data.appName, primaryColor: data.primaryColor }
                form.appName = data.appName
                form.primaryColor = data.primaryColor
                setPrimaryColor(data.primaryColor)
            }

            // Fallback if view transitions are not supported
            if (!document.startViewTransition) {
                updateState()
                await initAppConfig()
                toast.success(t('admin.settingsPage.saved'))
                return
            }

            // Find the selected color bubble to originate the transition
            let x = innerWidth / 2
            let y = innerHeight / 2

            // Try to find the element for the picked color
            const colorBubble = document.getElementById(`color-bubble-${data.primaryColor}`)
            if (colorBubble) {
                const rect = colorBubble.getBoundingClientRect()
                x = rect.left + rect.width / 2
                y = rect.top + rect.height / 2
            } else if (event) {
                // Fallback to click position if bubble not found
                x = event.clientX
                y = event.clientY
            }

            const endRadius = Math.hypot(
                Math.max(x, innerWidth - x),
                Math.max(y, innerHeight - y)
            )

            // Please note: event may be undefined if triggered programmatically, but here it's from click

            // Add class to override dark mode z-index behavior
            document.documentElement.classList.add('color-transition')

            const transition = document.startViewTransition(async () => {
                updateState()
                await nextTick()
            })

            transition.finished.finally(() => {
                document.documentElement.classList.remove('color-transition')
            })

            transition.ready.then(() => {
                const clipPath = [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${endRadius}px at ${x}px ${y}px)`
                ]

                document.documentElement.animate(
                    {
                        clipPath: clipPath
                    },
                    {
                        duration: 500,
                        easing: 'ease-in',
                        pseudoElement: '::view-transition-new(root)'
                    }
                )
            })

            await initAppConfig()
            toast.success(t('admin.settingsPage.saved'))
        }
    } catch (e: any) {
        toast.error(e?.data?.reason ?? t('error.generic'))
    } finally {
        saving.value = false
    }
}

onMounted(fetchSettings)
</script>

<template>
    <div class="space-y-2 px-2">
        <div class="flex items-center justify-between">
            <h1 class="text-4xl font-medium text-gray-900 dark:text-gray-100">
                {{ t('admin.settings') }}
            </h1>
        </div>

        <div v-if="loading" class="flex justify-center py-20">
            <Icon name="heroicons:arrow-path-20-solid" class="w-6 h-6 animate-spin text-gray-400" />
        </div>

        <div v-else
            class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 class="px-3 pb-1 pt-2 text-xl font-light text-gray-900 dark:text-neutral-100">
                {{ t('admin.settingsPage.branding') }}
            </h2>

            <div class="space-y-6 max-w-lg px-3 pb-3">
                <div>
                    <label for="appName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {{ t('admin.appName') }}
                    </label>
                    <AppInput id="appName" v-model="form.appName" type="text" />
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {{ t('admin.settingsPage.appNameHint') }}
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {{ t('admin.settingsPage.primaryColor') }}
                    </label>
                    <div class="flex flex-wrap gap-[0.7rem]">


                        <button v-for="color in availableColors" :key="color" :id="'color-bubble-' + color"
                            @click="form.primaryColor = color"
                            class="group relative w-8 h-8 rounded-full transition-all duration-150" :class="[
                                `bg-${color}-500`,
                                form.primaryColor === color
                                    ? 'ring-2 ring-offset-1 ring-gray-900 dark:ring-white dark:ring-offset-neutral-900 scale-110'
                                    : 'hover:scale-110 hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 dark:hover:ring-neutral-600 dark:hover:ring-offset-neutral-900'
                            ]" :title="color">
                            <Transition name="fade">
                                <Icon v-if="form.primaryColor === color" name="heroicons:check-20-solid"
                                    class="absolute inset-0 m-auto w-4 h-4 text-white" />
                            </Transition>
                        </button>
                    </div>
                </div>
            </div>

            <div class="mt-2 flex flex-col items-start gap-3 border-t border-gray-200 dark:border-neutral-800 p-3">
                <p v-if="hasChanges"
                    class="text-xs text-amber-600 dark:text-amber-400 px-2 py-1 bg-amber-500/20 dark:bg-amber-500/10 rounded-lg">
                    {{ t('admin.settingsPage.unsavedChanges') }}
                </p>
                <AppButton class="transition-colors! duration-300!" variant="primary" :base-color="form.primaryColor"
                    rounded="rounded-lg" @click="saveSettings($event)" :loading="loading"
                    :disabled="loading || !hasChanges">
                    {{ t('common.save') }}
                </AppButton>

            </div>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
