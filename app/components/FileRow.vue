<script setup lang="ts">
import type { FileItem, ColumnDefinition } from '~/types/file'
import FileIcon from './FileIcon.vue'

const { t, d, locale } = useI18n()

const props = defineProps<{
    item: FileItem
    selected: boolean
    isDropTarget?: boolean
    isFirst?: boolean
    isLast?: boolean
    columns: ColumnDefinition[]
}>()

const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void
    (e: 'toggle-select'): void
    (e: 'open'): void
    (e: 'dblclick', event: MouseEvent): void
    (e: 'contextmenu', event: MouseEvent): void
    // Simplified Drag events
    (e: 'dragstart', event: DragEvent): void
    (e: 'dragover', event: DragEvent): void
    (e: 'dragleave', event: DragEvent): void
    (e: 'drop', event: DragEvent): void
}>()

const cornerClasses = computed(() => [
    props.isFirst ? 'first:rounded-tl-xl' : 'first:rounded-tl-md',
    props.isLast ? 'first:rounded-bl-xl' : 'first:rounded-bl-md',
    props.isFirst ? 'last:rounded-tr-xl' : 'last:rounded-tr-md',
    props.isLast ? 'last:rounded-br-xl' : 'last:rounded-br-md'
])

const handleRowClick = (event: MouseEvent) => {
    emit('click', event)
    emit('open')
}

const rowBackgroundClasses = computed(() => {
    if (props.selected) {
        return 'bg-linear-to-b from-primary-500 to-primary-700 border-primary-500 shadow-[inset_0_2px_2px_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.2)]'
    }
    if (props.isDropTarget) {
        return 'bg-primary-50 dark:bg-primary-900/10 !border-primary-500 !border-y-2 first:!border-l-2 last:!border-r-2'
    }
    return [
        'bg-linear-to-b from-white to-gray-50',
        'dark:from-zinc-900 dark:to-zinc-950',
        'border-gray-200 dark:border-zinc-800',
        'group-hover:from-gray-50 group-hover:to-gray-100',
        'dark:group-hover:from-zinc-700 dark:group-hover:to-zinc-800', // Lighter gradient
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none',
        'dark:group-hover:border-zinc-600' // Lighter border on hover
    ].join(' ')
})

const formatDate = (date: Date | undefined) => {
    if (!date) return ''
    try {
        return new Intl.DateTimeFormat(locale.value, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    } catch (e) {
        return date.toLocaleDateString()
    }
}
</script>
<template>
    <tr class="group transition-shadow duration-200 ease-out cursor-pointer relative"
        :class="{ 'drop-shadow-xs z-10': selected || isDropTarget, 'drop-shadow-xs hover:drop-shadow-sm': !selected }"
        draggable="true" @dragstart="emit('dragstart', $event)" @dragover="emit('dragover', $event)"
        @dragleave="emit('dragleave', $event)" @drop="emit('drop', $event)" @click="handleRowClick"
        @dblclick.prevent.stop="$emit('dblclick', $event)" @contextmenu.prevent.stop="$emit('contextmenu', $event)">

        <!-- Checkbox -->
        <td class="px-6 py-4 whitespace-nowrap w-10 transition-all duration-200 border-y first:border-l last:border-r"
            :class="[
                ...cornerClasses,
                rowBackgroundClasses
            ]" @click.stop>
            <div class="flex items-center justify-center">
                <AppCheckbox size="md" :model-value="selected" :box-class="selected ? 'border-white' : ''"
                    class="relative z-10" @change="$emit('toggle-select')" />
            </div>
        </td>

        <!-- Name -->
        <td class="px-6 py-4 whitespace-nowrap transition-all duration-200 border-y first:border-l last:border-r"
            :class="[
                ...cornerClasses,
                rowBackgroundClasses
            ]">
            <div class="flex items-center relative z-10">
                <div class="mr-4 shrink-0 transition-transform duration-200 flex items-center justify-center">
                    <FileIcon :file-type="item.type" :selected="selected" />
                </div>
                <div class="flex-1 min-w-0">
                    <span v-if="item.type === 'folder'" class="font-semibold truncate block text-base tracking-tight"
                        :class="selected ? 'text-white drop-shadow-md' : 'text-gray-800 dark:text-zinc-200 dark:group-hover:text-white'">
                        {{ item.name }}
                    </span>
                    <span v-else class="truncate block font-medium tracking-tight"
                        :class="selected ? 'text-primary-50 drop-shadow-md' : 'text-gray-700 dark:text-zinc-300 dark:group-hover:text-zinc-50'">
                        {{ item.name }}
                    </span>
                </div>
            </div>
        </td>

        <!-- Dynamic Columns -->
        <td v-for="col in columns" :key="col.key"
            class="px-6 py-4 whitespace-nowrap text-sm text-right transition-all duration-300 border-y first:border-l last:border-r "
            :class="[
                col.class || '',
                ...cornerClasses,
                rowBackgroundClasses,
                selected ? 'text-primary-50' : 'text-gray-500  dark:group-hover:text-zinc-300'
            ]">
            <template v-if="col.type === 'size'">
                {{ item.type === 'folder' ? '-' : item.size }}
            </template>
            <template v-else-if="col.type === 'date'">
                {{ item[col.key] ? formatDate(item[col.key] as Date) : t('common.justNow') }}
            </template>
            <template v-else>
                {{ item[col.key] }}
            </template>
        </td>
    </tr>
</template>
