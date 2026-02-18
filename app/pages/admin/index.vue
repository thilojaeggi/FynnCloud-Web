<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { t } = useI18n()
const { appName, environment } = useBackEndConfig()
const { frontendVersion, backendVersion } = useAppVersions()

useHead({
    title: t('admin.overview'),
})

interface ServerAlert {
    key: string
    severity: 'critical' | 'warning' | 'info'
    message: string
}

const alerts = ref<ServerAlert[]>([])
const loadingAlerts = ref(true)

const severityConfig = {
    critical: {
        icon: 'heroicons:exclamation-circle-20-solid',
        row: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50',
        iconColor: 'text-red-500 dark:text-red-400',
        textColor: 'text-red-700 dark:text-red-300',
    },
    warning: {
        icon: 'mage:exclamation-square-fill',
        row: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50',
        iconColor: 'text-amber-400 dark:text-amber-400',
        textColor: 'text-amber-700 dark:text-amber-300',
    },
    info: {
        icon: 'material-symbols:info-rounded',
        row: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50',
        iconColor: 'text-blue-500 dark:text-blue-400',
        textColor: 'text-blue-700 dark:text-blue-300',
    },
}

const severityOrder = ['critical', 'warning', 'info'] as const

const sortedAlerts = computed(() =>
    [...alerts.value].sort(
        (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
    ),
)

const hasCritical = computed(() => alerts.value.some(a => a.severity === 'critical'))
const hasWarnings = computed(() => alerts.value.some(a => a.severity === 'warning'))

const statusColor = computed(() =>
    hasCritical.value
        ? 'red'
        : hasWarnings.value
            ? 'amber'
            : 'green',
)

const systemInfoRows = computed(() => [
    { label: t('admin.appName'), value: appName, mono: false },
    { label: t('admin.uiVersion'), value: frontendVersion, mono: true },
    { label: t('admin.serverVersion'), value: backendVersion, mono: true },
    { label: t('admin.environment'), value: environment, mono: false, capitalize: true },
])

onMounted(async () => {
    try {
        const res = await useApi<{ alerts: ServerAlert[] }>('/api/alerts')
        alerts.value = res?.alerts ?? []
    }
    catch (e) {
        console.error('Failed to fetch alerts:', e)
    }
    finally {
        loadingAlerts.value = false
    }
})
</script>

<template>
    <div class="space-y-2 px-2">
        <div class="flex items-center justify-between">
            <h1 class="text-4xl font-medium text-gray-900 dark:text-gray-100">
                {{ t('admin.overview') }}
            </h1>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            <!-- Alerts — 8 of 12 columns -->
            <section
                class="lg:col-span-8 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/60">
                <div class="p-3">
                    <div v-if="loadingAlerts"
                        class="flex items-center gap-3 py-1 text-sm text-gray-900 dark:text-neutral-200">
                        <svg class="h-5 w-5 animate-spin text-primary-500" xmlns="http://www.w3.org/2000/svg"
                            fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span class="font-normal ">{{ t('common.loading') }}…</span>
                    </div>

                    <div v-else class="space-y-4">
                        <div class="flex items-center gap-3.5">
                            <div :class="[
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                {
                                    'bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400': statusColor === 'red',
                                    'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400': statusColor === 'amber',
                                    'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400': statusColor === 'green',
                                },
                            ]">
                                <svg v-if="hasCritical" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <svg v-else-if="hasWarnings" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                    stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                <Icon v-else name="heroicons:check-16-solid" class="h-6 w-6" />
                            </div>

                            <div class="min-w-0">
                                <h3 :class="[
                                    'text-lg font-light leading-snug',
                                    {
                                        'text-red-600 dark:text-red-400': statusColor === 'red',
                                        'text-amber-600 dark:text-amber-400': statusColor === 'amber',
                                        'text-green-600 dark:text-green-400': statusColor === 'green',
                                    },
                                ]">
                                    {{
                                        hasCritical
                                            ? t('admin.alerts.criticalIssues')
                                            : hasWarnings
                                                ? t('admin.alerts.someIssues')
                                                : t('admin.alerts.noIssues')
                                    }}
                                </h3>
                                <p class="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">
                                    {{ sortedAlerts.length }} active {{ sortedAlerts.length === 1 ? 'report' : 'reports'
                                    }}
                                </p>
                            </div>
                        </div>

                        <div v-if="sortedAlerts.length > 0" class="space-y-1.5">
                            <div v-for="alert in sortedAlerts" :key="alert.key" :class="[
                                'flex items-center gap-2.5 rounded-lg border p-2 transition-colors',
                                severityConfig[alert.severity].row,
                            ]">
                                <Icon :name="severityConfig[alert.severity].icon" class="h-5 w-5 shrink-0"
                                    :class="severityConfig[alert.severity].iconColor" />
                                <span class="text-[13px] font-medium leading-snug"
                                    :class="severityConfig[alert.severity].textColor">
                                    {{ t(`admin.alerts.${alert.key}`) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- System Info — 4 of 12 columns -->
            <section
                class="lg:col-span-4 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-800/60">
                <h2 class="px-3 pb-1 pt-2 text-lg font-light text-gray-900 dark:text-neutral-100">
                    {{ t('admin.systemInfo') }}
                </h2>

                <dl class="divide-y divide-gray-100 dark:divide-neutral-700/50 mt-2">
                    <div v-for="(row, i) in systemInfoRows" :key="i"
                        class="flex items-center justify-between gap-4 px-3.5 py-3">
                        <dt class="text-sm text-gray-500 dark:text-neutral-400">
                            {{ row.label }}
                        </dt>
                        <dd :class="[
                            'text-sm font-medium text-gray-900 dark:text-neutral-100',
                            row.mono ? 'font-mono tabular-nums' : '',
                            row.capitalize ? 'capitalize' : '',
                        ]">
                            {{ row.value }}
                        </dd>
                    </div>
                </dl>
            </section>
        </div>
    </div>
</template>