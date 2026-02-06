<script setup lang="ts">
const props = defineProps<{
    modelValue?: string
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const searchInput = ref<HTMLInputElement | null>(null)

// Keyboard shortcut to focus search
onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
})

const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInput.value?.focus()
    }
}

const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:modelValue', target.value)
}
</script>

<template>
    <div class="relative group">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                class="w-4 h-4 text-gray-400 group-focus-within:text-primary-600 dark:text-gray-500 dark:group-focus-within:text-primary-400 transition-colors">
                <path fill-rule="evenodd"
                    d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
                    clip-rule="evenodd" />
            </svg>
        </div>
        <input ref="searchInput" type="text" :value="modelValue" :placeholder="placeholder || 'Search...'"
            class="block w-full rounded-xl border-none ring-1 ring-black/5 dark:ring-white/10 bg-gray-100 dark:bg-neutral-800 py-2 pl-10 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:focus:ring-primary-500/40 transition-all duration-200"
            @input="handleInput" />
        <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <kbd
                class="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-700 text-[10px] font-sans font-medium text-gray-400 dark:text-gray-500">
                <span class="text-xs">⌘</span>K
            </kbd>
        </div>
    </div>
</template>
