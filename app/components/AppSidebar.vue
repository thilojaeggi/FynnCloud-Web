<script setup lang="ts">
const { t } = useI18n()
const { user } = useAuth()

const links = computed(() => [
  { label: t('navigation.allFiles'), icon: 'heroicons:folder-solid', to: '/' },
  { label: t('navigation.recentFiles'), icon: 'heroicons:clock-solid', to: '/recent' },
  { label: t('navigation.favoriteFiles'), icon: 'heroicons:star-solid', to: '/favorites' },
  { label: t('navigation.sharedFiles'), icon: 'heroicons:share-solid', to: '/shared' },
])

const { formattedUsage, percentage } = useQuota()
</script>

<template>
  <div class="h-full">
    <div class="h-full pb-2 flex flex-col justify-between transition-colors duration-300
                bg-linear-to-b from-primary-600 via-primary-700 to-primary-800
                dark:from-primary-700 dark:via-primary-800 dark:to-primary-900
                shadow-[inset_0_1px_0_rgba(255,255,255,0.12),4px_0_12px_rgba(0,0,0,0.08)]
                dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),4px_0_12px_rgba(0,0,0,0.2)]">

      <nav class="space-y-1 p-2">
        <AppSidebarItem v-for="link in links" :key="link.to" :link="link" />
      </nav>
      <div class="grow">
      </div>
      <div class="px-2 space-y-1">

        <div class="h-px bg-white/10 mx-1 mb-1"></div>

        <AppSidebarItem v-if="user?.isAdmin"
          :link="{ label: t('admin.title'), icon: 'heroicons:cog-6-tooth-solid', to: '/admin' }" />
        <AppSidebarItem
          :link="{ label: t('navigation.trash'), icon: 'heroicons:trash-solid', to: '/trash', variant: 'danger' }" />
      </div>
      <div class="mt-4 mx-auto w-full px-4 mb-2 space-y-1">
        <div class="flex justify-between mx-1">
          <p class="text-xs text-gray-200 text-center">{{ t('quota.usedSpace') }}:</p>
          <p class="text-xs text-gray-200 text-center">{{ formattedUsage }}</p>
        </div>
        <div
          class="relative w-full bg-primary-950/40 rounded-full h-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] border-b border-white/10">
          <div v-if="percentage >= 6"
            class="h-full rounded-full transition-all duration-500 ease-out bg-linear-to-b from-white to-gray-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.2)] border-t border-white/50"
            :style="{ width: `${percentage}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>
