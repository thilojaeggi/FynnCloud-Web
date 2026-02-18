<script setup lang="ts">
import type { FileItem } from '~/types/file'

const props = defineProps<{
    showCreateFolder: boolean
    showRename: boolean
    showDelete: boolean
    showMove: boolean
    newFolderName: string
    renameName: string
    renameExtension: string
    deleteTitle: string
    deleteDescription: string
    deleteConfirmLabel: string
    isDeleting: boolean
    activeItems: FileItem[]
    currentFolderId: string | null
}>()

const emit = defineEmits<{
    'update:showCreateFolder': [value: boolean]
    'update:showRename': [value: boolean]
    'update:showDelete': [value: boolean]
    'update:showMove': [value: boolean]
    'update:newFolderName': [value: string]
    'update:renameName': [value: string]
    createFolder: []
    rename: []
    delete: []
    moved: [payload: { sourceIds: string[], targetId: string | null }]
}>()

const { t } = useI18n()
const renameInput = ref<any>(null)

watch(() => props.showRename, async (newVal) => {
    if (newVal) {
        await nextTick()
        renameInput.value?.input?.focus()
    }
})
</script>

<template>
    <!-- Create Folder Modal -->
    <AppDialog :model-value="showCreateFolder" @update:model-value="emit('update:showCreateFolder', $event)"
        :title="t('files.actions.createFolder.title')">
        <div class="text-sm text-gray-500 mb-4">
            {{ t('files.actions.createFolder.description') }}
        </div>
        <AppInput :model-value="newFolderName" @update:model-value="emit('update:newFolderName', $event)"
            :placeholder="t('files.actions.createFolder.placeholder')" :label="t('common.name')" :autofocus="true"
            @keyup.enter="emit('createFolder')" />
        <template #footer="{ close }">
            <div class="flex gap-2">
                <AppButton variant="secondary" rounded="rounded-md" @click="close">{{ t('common.cancel') }}</AppButton>
                <AppButton variant="primary" rounded="rounded-md" @click="emit('createFolder')">{{
                    t('files.actions.createFolder.button') }}</AppButton>
            </div>
        </template>
    </AppDialog>

    <!-- Rename Modal -->
    <AppDialog :model-value="showRename" @update:model-value="emit('update:showRename', $event)"
        :title="t('files.actions.rename.title')">
        <div class="text-sm text-gray-500 mb-2">
            {{ t('files.actions.rename.description') }}
        </div>
        <div class="flex items-end gap-2">
            <div class="flex-1">
                <AppInput ref="renameInput" :model-value="renameName"
                    @update:model-value="emit('update:renameName', $event)"
                    :placeholder="t('files.actions.rename.placeholder')" :label="t('common.name')" :autofocus="true"
                    @keyup.enter="emit('rename')" />
            </div>
            <div v-if="renameExtension" class="pb-2 text-gray-500 font-medium select-none">
                .{{ renameExtension }}
            </div>
        </div>
        <template #footer="{ close }">
            <div class="flex gap-2">
                <AppButton variant="secondary" rounded="rounded-md" @click="close">{{ t('common.cancel') }}</AppButton>
                <AppButton variant="primary" rounded="rounded-md" @click="emit('rename')">{{
                    t('files.actions.rename.button') }}
                </AppButton>
            </div>
        </template>
    </AppDialog>

    <!-- Delete Confirmation -->
    <AppAlertDialog :model-value="showDelete" @update:model-value="emit('update:showDelete', $event)"
        :title="deleteTitle" :description="deleteDescription" :confirmLabel="deleteConfirmLabel" variant="danger"
        :loading="isDeleting" @confirm="emit('delete')" />

    <!-- Move File Dialog -->
    <AppMoveFileDialog :model-value="showMove" @update:model-value="emit('update:showMove', $event)"
        :items="activeItems" :initial-folder-id="currentFolderId" @moved="emit('moved', $event)" />
</template>
