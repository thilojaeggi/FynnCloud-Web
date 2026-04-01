<script setup lang="ts">
defineProps<{
    /** Optional text label shown next to the spinner */
    label?: string
    /** Size passed through to AppSpinner */
    size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
    <div class="flex items-center justify-center gap-3">
        <AppSpinner :size="size" />
        <span v-if="label" class="text-sm text-gray-500 dark:text-neutral-400">{{ label }}</span>
    </div>
</template>
