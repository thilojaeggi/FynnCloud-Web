<script setup lang="ts">
import type { FileItem, BreadcrumbItem, ColumnDefinition } from '~/types/file'
import AppMoveFileDialog from './AppMoveFileDialog.vue'
const config = useRuntimeConfig()

const props = withDefaults(defineProps<{
  path: string[]
  items?: FileItem[]
  readOnly?: boolean
  isTrash?: boolean | false
  refresh?: () => Promise<any>
  breadcrumbs?: BreadcrumbItem[]
}>(), {
  readOnly: false,
  isTrash: false,
  breadcrumbs: () => []
})

const { uploadFile } = useUploads()
const { openFile } = useFileHandlers()
const { createFolder, deleteFiles, deleteFilesPermanently, renameFile, moveFile, restoreFile, getDeleteDescription } = useFiles()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const selectedFiles = ref<Set<string>>(new Set())
const activeItems = ref<FileItem[]>([])
const isDeleting = ref(false)

// Modal Toggles
const showCreateFolderModal = ref(false)
const showDeleteConfirm = ref(false)
const showRenameModal = ref(false)
const showMoveDialog = ref(false)

// Input Refs
const newFolderName = ref('')
const renameName = ref('')
const renameExtension = ref('')
const renameInput = ref<any>(null)

const draggingIds = ref<string[]>([])
const dropTargetId = ref<string | null>(null)
const dragGhostRef = ref<HTMLElement | null>(null)
const isExternalDragging = ref(false)
let dragCounter = 0

// File Upload
const fileInput = ref<HTMLInputElement | null>(null)

const handleTriggerUpload = () => {
  fileInput.value?.click()
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const files = Array.from(input.files)
  await Promise.all(files.map(file => uploadFile(file, currentFolderID.value)))
  await refreshCurrentView()

  input.value = ''
}

// Ghost UI State
const ghostData = ref<{
  name: string;
  count: number;
  type: FileItem['type'];
}>({
  name: '',
  count: 1,
  type: 'file' as FileItem['type']
})

const currentFolderID = computed(() => props.path[props.path.length - 1] || null)
const currentItems = computed(() => Array.isArray(props.items) ? props.items : [])
const currentDirectory = computed(() => {
  const lastItem = props.breadcrumbs?.[props.breadcrumbs.length - 1]
  if (lastItem?.labelKey) return t(lastItem.labelKey)
  if (lastItem && !lastItem.id && !lastItem.labelKey) return t('navigation.allFiles')
  return lastItem?.name || t('navigation.allFiles')
})

// Selection Helpers
const isAllSelected = computed(() => currentItems.value.length > 0 && selectedFiles.value.size === currentItems.value.length)
const isIndeterminate = computed(() => selectedFiles.value.size > 0 && selectedFiles.value.size < currentItems.value.length)

// Delete Dialog Text Computeds
const deleteDescription = computed(() => getDeleteDescription(activeItems.value, props.isTrash))
const deleteTitle = computed(() => props.isTrash ? t('files.actions.deletePermanent.title') : t('files.actions.delete.title'))
const deleteConfirmLabel = computed(() => props.isTrash ? t('files.actions.deletePermanent.button') : t('files.actions.delete.button'))

const availableColumns = computed<ColumnDefinition[]>(() => [
  { key: 'size', label: 'files.columns.size', type: 'size', sortable: true, class: 'w-32 hidden sm:table-cell' },
  { key: 'updatedAt', label: 'files.columns.lastChanged', type: 'date', sortable: true, class: 'w-48 hidden md:table-cell' },
  { key: 'createdAt', label: 'files.columns.created', type: 'date', sortable: true, class: 'w-48 hidden lg:table-cell' },
  ...(props.isTrash ? [{ key: 'deletedAt' as keyof FileItem, label: 'files.columns.deletedAt', type: 'date', sortable: true, class: 'w-48 hidden md:table-cell' } as ColumnDefinition] : [])
])


const hiddenColumnKeys = ref<Set<string>>(new Set())
const showColumnMenu = ref(false)

const activeColumns = computed(() => {
  return availableColumns.value.filter(col => !hiddenColumnKeys.value.has(col.key))
})

const toggleColumn = (col: ColumnDefinition) => {
  if (hiddenColumnKeys.value.has(col.key)) {
    hiddenColumnKeys.value.delete(col.key)
  } else {
    hiddenColumnKeys.value.add(col.key)
  }
}

type SortField = keyof FileItem
const sortField = ref<SortField>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

const sortedItems = computed(() => {
  const items = [...currentItems.value]
  return items.sort((a, b) => {
    let aVal: any = a[sortField.value]
    let bVal: any = b[sortField.value]

    // Special handling for size to sort by bytes
    if (sortField.value === 'size') {
      aVal = a.sizeBytes || 0
      bVal = b.sizeBytes || 0
    }

    // Generic Date handling
    if (aVal instanceof Date) aVal = aVal.getTime()
    if (bVal instanceof Date) bVal = bVal.getTime()

    // Generic String handling
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()

    const modifier = sortDirection.value === 'asc' ? 1 : -1
    return aVal < bVal ? -1 * modifier : aVal > bVal ? 1 * modifier : 0
  })
})

const toggleSort = (field: SortField) => {
  sortDirection.value = (sortField.value === field && sortDirection.value === 'asc') ? 'desc' : 'asc'
  sortField.value = field
}

const toggleSelection = (id: string) => selectedFiles.value.has(id) ? selectedFiles.value.delete(id) : selectedFiles.value.add(id)
const toggleSelectAll = () => {
  if (isAllSelected.value) return selectedFiles.value.clear()
  currentItems.value.forEach(item => selectedFiles.value.add(item.id))
}
const clearSelection = () => selectedFiles.value.clear()

const refreshCurrentView = async () => props.refresh && await props.refresh()

const openCreateFolderModal = () => {
  newFolderName.value = ''
  showCreateFolderModal.value = true
}

const handleCreateFolder = async () => {
  if (!newFolderName.value) return
  try {
    await createFolder(newFolderName.value, currentFolderID.value)
    showCreateFolderModal.value = false
  } catch (e) {
    alert(t('files.alerts.createFolderFailed'))
  }
}

const openDeleteConfirm = (item?: FileItem) => {
  activeItems.value = item ? [item] : currentItems.value.filter(i => selectedFiles.value.has(i.id))
  if (activeItems.value.length > 0) showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  isDeleting.value = true
  try {
    const ids = activeItems.value.map(i => i.id)
    if (props.isTrash) {
      await deleteFilesPermanently(ids)
    } else {
      await deleteFiles(ids)
    }
    clearSelection()
    showDeleteConfirm.value = false
  } catch (e) {
    alert(t('files.alerts.deleteFailed'))
  } finally {
    isDeleting.value = false
    activeItems.value = []
  }
}

const startRename = async (item: FileItem) => {
  activeItems.value = [item]
  const parts = item.name.split('.')
  const isFolder = item.type === 'folder'
  renameExtension.value = (!isFolder && parts.length > 1) ? parts.pop()! : ''
  renameName.value = !isFolder ? parts.join('.') : item.name
  showRenameModal.value = true
  await nextTick()
  renameInput.value?.input?.focus()
}

const handleRename = async () => {
  const item = activeItems.value[0]
  if (!item || !renameName.value) return
  try {
    const fullName = renameExtension.value ? `${renameName.value}.${renameExtension.value}` : renameName.value
    await renameFile(item.id, fullName)
    showRenameModal.value = false
  } catch (e) {
    alert(t('files.alerts.renameFailed'))
  }
}

const handleRestore = async (item?: FileItem) => {
  const targets = item ? [item] : currentItems.value.filter(i => selectedFiles.value.has(i.id))
  try {
    await Promise.all(targets.map(t => restoreFile(t.id)))
    clearSelection()
  } catch (e) {
    alert(t('files.alerts.restoreFailed'))
  }
}

const handleMoveFile = async (payload: { sourceIds: string[], targetId: string | null }) => {
  if (payload.sourceIds.length === 0) return
  try {
    await Promise.all(payload.sourceIds.map(id => moveFile(id, payload.targetId)))
    clearSelection()
  } catch (e) {
    alert(t('files.alerts.moveFailed'))
  }
}

const handleDownloadFile = async (item: FileItem) => {
  try {
    const apiBase = useApiBase()
    const url = `${apiBase}/api/files/${item.id}/download`
    const link = document.createElement('a')
    link.href = url
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) { alert(t('files.alerts.downloadFailed')) }
}

const openMoveDialog = (item?: FileItem) => {
  activeItems.value = item ? [item] : currentItems.value.filter(i => selectedFiles.value.has(i.id))
  if (activeItems.value.length > 0) showMoveDialog.value = true
}

const onRowDragStart = (event: DragEvent, item: FileItem) => {
  if (!event.dataTransfer) return
  let ids = [item.id]
  if (selectedFiles.value.has(item.id)) {
    ids = Array.from(selectedFiles.value)
  }
  draggingIds.value = ids
  ghostData.value = { name: item.name, count: ids.length, type: item.type }

  const data = JSON.stringify(ids)
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/json', data)
  event.dataTransfer.setData('text/plain', data)

  nextTick(() => {
    if (dragGhostRef.value && event.dataTransfer) {
      event.dataTransfer.setDragImage(dragGhostRef.value, 20, 20)
    }
  })
}

const onRowDragOver = (event: DragEvent, targetItem: FileItem) => {
  if (isExternalDragging.value) return
  if (targetItem.type === 'folder' && !draggingIds.value.includes(targetItem.id)) {
    event.preventDefault()
    dropTargetId.value = targetItem.id
  }
}

const onRowDrop = async (event: DragEvent, targetItem: FileItem) => {
  dropTargetId.value = null

  if (targetItem.type !== 'folder') return

  const rawData = event.dataTransfer?.getData('application/json')
  if (rawData) {
    try {
      const sourceIds = JSON.parse(rawData) as string[]

      if (sourceIds.includes(targetItem.id)) return

      await handleMoveFile({ sourceIds, targetId: targetItem.id })
    } catch (e) {
      console.error("Drop failed", e)
    }
  }

  draggingIds.value = []
}

const onGlobalDragEnter = (e: DragEvent) => {
  if (props.readOnly || !e.dataTransfer?.types.includes('Files')) return
  dragCounter++
  isExternalDragging.value = true
}

const onGlobalDragLeave = () => {
  dragCounter--
  if (dragCounter <= 0) {
    isExternalDragging.value = false
    dragCounter = 0
  }
}

const onGlobalDrop = async (e: DragEvent) => {
  isExternalDragging.value = false
  dragCounter = 0
  if (props.readOnly || !e.dataTransfer?.files) return
  const files = Array.from(e.dataTransfer.files)
  await Promise.all(files.map(file => uploadFile(file, currentFolderID.value)))
  await refreshCurrentView()
}

const contextMenuRef = ref()
const handleContextMenu = (event: MouseEvent, item: FileItem) => contextMenuRef.value?.open(event, item)

const handleContextMenuAction = (action: string, item: FileItem) => {
  if (!item) return
  switch (action) {
    case 'open': openFile(item, sortedItems.value); break
    case 'download': handleDownloadFile(item); break
    case 'move-to-recycle-bin': openDeleteConfirm(item); break
    case 'restore': handleRestore(item); break
    case 'delete-permanently': openDeleteConfirm(item); break
    case 'rename': startRename(item); break
    case 'move': openMoveDialog(item); break
  }
}

watch(() => props.breadcrumbs, (newVal) => {
  if (!newVal || newVal.length <= 1) return
  const pathString = '/' + newVal.filter(i => i.id !== null).map(i => i.name).join('/')
  if (route.query.path !== pathString) router.replace({ query: { ...route.query, path: pathString } })
}, { immediate: true })
</script>

<template>
  <div class="space-y-2 relative min-h-125 p-2" @dragenter.prevent="onGlobalDragEnter" @dragover.prevent
    @dragleave.prevent="onGlobalDragLeave" @drop.prevent="onGlobalDrop">


    <div class="flex items-center justify-between">
      <div class="self-start min-w-0 flex-1 mr-4">
        <h1
          class="text-3xl font-semibold text-gray-900 dark:text-gray-100 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {{ currentDirectory }}</h1>
        <FileBreadcrumbs :items="breadcrumbs" class="mt-1 -ml-1 -mb-1.5" @move="handleMoveFile" />
      </div>
      <div class="flex flex-col items-end justify-end gap-2 self-end">
        <div class="flex flex-row items-center gap-2">
          <input ref="fileInput" type="file" multiple class="hidden" @change="onFileChange" />
          <AppButton v-if="!readOnly" @click="handleTriggerUpload" rounded="rounded-xl" variant="white"
            border-class="border border-gray-300" textColor="text-primary-700" :text-shadow="false">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
                <path fill-rule="evenodd"
                  d="M10.5 3.75a6 6 0 0 0-5.98 6.496A5.25 5.25 0 0 0 6.75 20.25H18a4.5 4.5 0 0 0 2.206-8.423 3.75 3.75 0 0 0-4.133-4.303A6.001 6.001 0 0 0 10.5 3.75Zm2.03 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v4.94a.75.75 0 0 0 1.5 0v-4.94l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z"
                  clip-rule="evenodd" />
              </svg>
              {{ t('files.upload') }}
            </div>
          </AppButton>
          <AppButton v-if="!readOnly" @click="openCreateFolderModal" rounded="rounded-xl" color="green">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
                <path fill-rule="evenodd"
                  d="M19.5 21a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-5.379a.75.75 0 0 1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Zm-6.75-10.5a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V10.5Z"
                  clip-rule="evenodd" />
              </svg>
              {{ t('files.newFolder') }}
            </div>
          </AppButton>
        </div>

        <!-- Column Toggle -->
        <div v-if="(items?.length ? items.length > 0 : false) || breadcrumbs.length > 1"
          class="relative z-20 float-right">
          <AppButton @click="showColumnMenu = !showColumnMenu" rounded="rounded-xl" variant="white" class="px-3!">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="size-5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </AppButton>

          <div v-if="showColumnMenu"
            class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-700 p-2 origin-top-right transition-all"
            @click.stop>
            <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 py-1.5">{{
              t('files.columns.title') }}</div>
            <label v-for="col in availableColumns" :key="col.key"
              class="flex items-center px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-md cursor-pointer">
              <AppCheckbox :model-value="!hiddenColumnKeys.has(col.key)" class="mr-3" @change="toggleColumn(col)" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ t(col.label) }}</span>
            </label>
            <!-- Outside click handler overlay could be added globally or use a directive, but simple backdrop for now -->
            <div class="fixed inset-0 -z-10" @click="showColumnMenu = false"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- File Table -->
    <div class="w-full relative">
      <table v-if="currentItems.length > 0"
        class="min-w-full divide-y-0 border-separate border-spacing-y-1 bg-white dark:bg-neutral-800 rounded-2xl px-2 pb-1.25 transition-colors duration-300">
        <thead>
          <tr>
            <!-- Static columns -->
            <th scope="col" class="px-6 py-2 text-left w-10">
              <AppCheckbox :model-value="isAllSelected" :indeterminate="isIndeterminate" @change="toggleSelectAll" />
            </th>

            <th scope="col"
              class="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 group select-none transition-colors duration-200"
              @click="toggleSort('name')">
              <div class="flex items-center space-x-1">
                <span>{{ t('files.columns.name') }}</span>
                <span v-if="sortField === 'name'" class="text-primary-500">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
                <span v-else class="text-gray-300 opacity-0 group-hover:opacity-100">↕</span>
              </div>
            </th>

            <!-- Dynamic columns -->
            <th v-for="col in activeColumns" :key="col.key" scope="col"
              class="px-6 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 group select-none transition-colors duration-200"
              :class="col.class" @click="col.sortable && toggleSort(col.key)">
              <div class="flex items-center justify-end space-x-1">
                <span>{{ t(col.label) }}</span>
                <span v-if="sortField === col.key" class="text-primary-500">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
                <span v-else-if="col.sortable" class="text-gray-300 opacity-0 group-hover:opacity-100">↕</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <FileRow v-for="(item, index) in sortedItems" :key="item.id" :item="item" :columns="activeColumns"
            :selected="selectedFiles.has(item.id)" :is-drop-target="dropTargetId === item.id" :is-first="index === 0"
            :is-last="index === sortedItems.length - 1" @dragstart="onRowDragStart($event, item)"
            @dragover="onRowDragOver($event, item)" @dragleave="dropTargetId = null" @drop="onRowDrop($event, item)"
            @toggle-select="toggleSelection(item.id)" @contextmenu="handleContextMenu($event, item)"
            @open="handleContextMenuAction('open', item)" />
        </tbody>
      </table>
      <div v-else class="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="w-16 h-16 mb-4 opacity-50">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        <p class="text-lg font-medium">{{ t('files.empty') }}</p>
        <p v-if="!readOnly" class="text-sm">{{ t('files.dragAndDropHint') }}</p>
      </div>
      <div v-if="isExternalDragging"
        class="absolute inset-0 z-50 bg-primary-50/25 border-2 border-primary-500 border-dashed rounded-xl flex flex-col items-center justify-center pointer-events-none backdrop-blur-xs max-h-[calc(100vh-10rem)]">
        <p class="text-xl font-semibold text-primary-700">{{ t('files.dragAndDrop') }}</p>
      </div>
    </div>



    <Teleport to="body">
      <div class="fixed -top-96 left-0 z-50 pointer-events-none">
        <div ref="dragGhostRef"
          class="flex items-center gap-3 bg-white p-3 rounded-lg shadow-lg ring-1 ring-black/5 w-56">
          <div class="shrink-0 p-1.5 bg-primary-50 rounded-md">
            <div v-if="ghostData.count > 1"
              class="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-600 rounded font-bold">
              {{ ghostData.count }}
            </div>
            <FileIcon v-else :file-type="ghostData.type" class="w-8 h-8" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 truncate">
              {{ ghostData.count > 1 ? t('files.drag.multiple', { count: ghostData.count }) : ghostData.name }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>

    <AppDialog v-model="showCreateFolderModal" :title="t('files.actions.createFolder.title')">
      <div class="text-sm text-gray-500 mb-4">
        {{ t('files.actions.createFolder.description') }}
      </div>
      <AppInput v-model="newFolderName" :placeholder="t('files.actions.createFolder.placeholder')"
        :label="t('common.name')" :autofocus="true" @keyup.enter="handleCreateFolder" />
      <template #footer="{ close }">
        <div class="flex gap-3">
          <AppButton variant="secondary" rounded="rounded-md" @click="close">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" rounded="rounded-md" @click="handleCreateFolder">{{
            t('files.actions.createFolder.button') }}</AppButton>
        </div>
      </template>
    </AppDialog>

    <AppDialog v-model="showRenameModal" :title="t('files.actions.rename.title')">
      <div class="text-sm text-gray-500 mb-4">
        {{ t('files.actions.rename.description') }}
      </div>
      <div class="flex items-end gap-2">
        <div class="flex-1">
          <AppInput ref="renameInput" v-model="renameName" :placeholder="t('files.actions.rename.placeholder')"
            :label="t('common.name')" :autofocus="true" @keyup.enter="handleRename" />
        </div>
        <div v-if="renameExtension" class="pb-2 text-gray-500 font-medium select-none">
          .{{ renameExtension }}
        </div>
      </div>
      <template #footer="{ close }">
        <div class="flex gap-3">
          <AppButton variant="secondary" rounded="rounded-md" @click="close">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" rounded="rounded-md" @click="handleRename">{{ t('files.actions.rename.button') }}
          </AppButton>
        </div>
      </template>
    </AppDialog>

    <AppAlertDialog v-model="showDeleteConfirm" :title="deleteTitle" :description="deleteDescription"
      :confirmLabel="deleteConfirmLabel" variant="danger" :loading="isDeleting" @confirm="confirmDelete" />

    <files-context-menu ref="contextMenuRef" @action="handleContextMenuAction" />

    <AppMoveFileDialog v-model="showMoveDialog" :items="activeItems" :initial-folder-id="currentFolderID"
      @moved="handleMoveFile" />

    <!-- Floating Action Bar -->
    <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-full"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-full">
      <div v-if="selectedFiles.size > 0"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-xl rounded-full p-2 pl-4 flex items-center gap-2">
        <div class="text-md font-medium text-gray-700 dark:text-white">
          {{ t('files.selected', { count: selectedFiles.size }) }}
        </div>

        <div class="h-6 w-px bg-gray-200 dark:bg-neutral-600 mx-1"></div>

        <div class="flex items-center gap-2">
          <!-- Move -->
          <!-- Restore (Only in Trash) -->
          <AppButton v-if="isTrash" variant="primary" rounded="rounded-lg" size="md" @click="handleRestore()">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"
                stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
              {{ t('files.actions.restore') }}
            </div>
          </AppButton>

          <!-- Move (Hidden in Trash) -->
          <AppButton v-if="!isTrash" variant="primary" rounded="rounded-lg" size="md" @click="openMoveDialog()">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 14 20 9 15 4" />
                <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
              </svg>
              {{ t('files.actions.move.button') }}
            </div>
          </AppButton>

          <!-- Delete -->
          <AppButton @click="openDeleteConfirm()" variant="danger" rounded="rounded-lg" size="md">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" x2="10" y1="11" y2="17" />
                <line x1="14" x2="14" y1="11" y2="17" />
              </svg>
              {{ isTrash ? t('files.actions.deletePermanent.button') : t('files.actions.delete.button') }}
            </div>
          </AppButton>

          <div class="h-6 w-px bg-gray-200 dark:bg-neutral-600 mx-1"></div>

          <!-- Deselect (Circular) -->
          <AppButton @click="clearSelection" variant="canvas" text-color="dark:text-white" rounded="rounded-full"
            size="md" class="h-10 w-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </AppButton>
        </div>
      </div>
    </transition>
  </div>
</template>
