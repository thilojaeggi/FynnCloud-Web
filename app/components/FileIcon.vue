<script setup lang="ts">
import type { FileType } from '~/types/file'

const props = defineProps<{
  fileType: FileType
  selected?: boolean
}>()

const iconMap: Record<FileType, string> = {
  folder: 'heroicons:folder-solid',
  image: 'fa:file-image-o',
  video: 'fa:file-video-o',
  audio: 'heroicons:musical-note-solid',
  pdf: 'fa:file-pdf-o',
  doc: 'fa:file-text-o',
  sheet: 'garden:file-spreadsheet-stroke-16',
  slide: 'fa:file-powerpoint-o',
  archive: 'heroicons:archive-box-solid',
  code: 'heroicons:code-bracket',
  file: 'fa:file-o'
}

const colorMap: Record<FileType, string> = {
  folder: 'text-yellow-500',
  image: 'text-purple-500',
  video: 'text-pink-500',
  audio: 'text-yellow-600',
  pdf: 'text-red-500',
  doc: 'text-primary-600',
  sheet: 'text-green-600',
  slide: 'text-orange-500',
  archive: 'text-gray-600',
  code: 'text-indigo-500',
  file: 'text-gray-400'
}

// Return size class 
const sizeClass = computed<string>(() => {
  switch (props.fileType) {
    default:
      return 'w-6 h-6'
  }
})

const iconName = computed(() => iconMap[props.fileType] || iconMap.file)
const currentColorClass = computed(() =>
  props.selected ? 'text-white' : (colorMap[props.fileType] || 'text-gray-400')
)
</script>

<template>
  <Icon :name="iconName" :class="[sizeClass, currentColorClass]" />
</template>