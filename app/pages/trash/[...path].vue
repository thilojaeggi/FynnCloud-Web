<script setup lang="ts">
const { files, fetchTrash, restoreFile, deleteFile, breadcrumbs } = useFiles()

const { t } = useI18n()
useHead({
    title: t('navigation.trash')
})

const route = useRoute()
const folderID = computed(() => {
    if (Array.isArray(route.params.path)) {
        return route.params.path[route.params.path.length - 1] || null
    }
    return (route.params.path as string) || null
})

watch(folderID, async (newID) => {
    await fetchTrash(newID)
}, { immediate: true })

const refresh = async () => await fetchTrash(folderID.value)
</script>

<template>
    <FileExplorer :path="folderID ? [folderID] : []" :items="files" :is-trash="true" :read-only="true"
        :refresh="refresh" :breadcrumbs="breadcrumbs" />
</template>
