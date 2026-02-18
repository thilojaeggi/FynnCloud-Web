<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { t } = useI18n()
useHead({ title: t('admin.users') })
const { toast } = useToast()

// --- Types ---
interface AdminUser {
    id: string
    username: string
    email: string
    currentStorageUsage: number
    groups: GroupInfo[]
    tierID: number | null
}

interface GroupInfo { id: number; name: string; tierID: number | null, isAdmin: boolean | false }
interface TierInfo { id: number; name: string; limitBytes: number }

// --- State ---
const users = ref<AdminUser[]>([])
const groups = ref<GroupInfo[]>([])
const tiers = ref<TierInfo[]>([])
const loading = ref(true)

// Modal State: Groups
const selectedUser = ref<AdminUser | null>(null)
const showGroupsDialog = ref(false)
const groupSearchQuery = ref('')

// Draft State (The new buffer)
const draftGroups = ref<string[]>([])
const isSavingGroups = ref(false)

// Modal State: Delete
const showDeleteDialog = ref(false)
const userToDelete = ref<AdminUser | null>(null)
const isDeleting = ref(false)

// Modal State: Create User
const showCreateUserDialog = ref(false)
const newUsername = ref('')
const newEmail = ref('')
const newPassword = ref('')
const isCreatingUser = ref(false)

// Group Management State
const showCreateGroupDialog = ref(false)
const newGroupName = ref('')
const isCreatingGroup = ref(false)

const showRenameGroupDialog = ref(false)
const editingGroup = ref<GroupInfo | null>(null)
const editGroupName = ref('')
const isRenamingGroup = ref(false)

const showDeleteGroupDialog = ref(false)
const groupToDelete = ref<GroupInfo | null>(null)
const isDeletingGroup = ref(false)

// --- Helpers ---
import { formatSize } from '~/utils/file'

// --- Computed ---
// Filter available groups based on what is currently in the DRAFT, not the user object
const availableGroupsFiltered = computed(() => {
    const currentDraft = draftGroups.value
    // Filter out groups already in the draft
    const available = groups.value.filter(g => !currentDraft.includes(g.name))

    if (!groupSearchQuery.value) return available
    const lower = groupSearchQuery.value.toLowerCase()
    return available.filter(g => g.name.toLowerCase().includes(lower))
})

// --- API ---
const fetchData = async () => {
    loading.value = true
    try {
        const [u, g, ti] = await Promise.all([
            useApi<AdminUser[]>('/api/admin/users'),
            useApi<GroupInfo[]>('/api/admin/groups'),
            useApi<TierInfo[]>('/api/admin/tiers'),
        ])
        users.value = u ?? []
        groups.value = g ?? []
        tiers.value = ti ?? []
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(fetchData)

// --- Actions: Groups (Transactional) ---

const openGroups = (user: AdminUser) => {
    selectedUser.value = user
    // Clone the user's current groups into the draft
    draftGroups.value = [...user.groups.map(g => g.name)]
    groupSearchQuery.value = ''
    showGroupsDialog.value = true
}

// Local draft modification only — receives a GroupInfo from the available list
const addToDraft = (group: GroupInfo) => {
    if (!draftGroups.value.includes(group.name)) {
        draftGroups.value.push(group.name)
    }
}

// Local draft modification only — receives a group name string from the draft list
const removeFromDraft = (groupName: string) => {
    draftGroups.value = draftGroups.value.filter(g => g !== groupName)
}

const saveGroups = async () => {
    if (!selectedUser.value) return
    isSavingGroups.value = true

    // Both sides are now string[] for a clean diff
    const originalGroupNames = selectedUser.value.groups.map(g => g.name)
    const newGroupNames = draftGroups.value
    const userId = selectedUser.value.id

    // Calculate Diff — comparing strings to strings
    const toAdd = newGroupNames.filter(name => !originalGroupNames.includes(name))
    const toRemove = originalGroupNames.filter(name => !newGroupNames.includes(name))

    try {
        const promises = []

        // Queue Add Requests
        for (const name of toAdd) {
            const gInfo = groups.value.find(g => g.name === name)
            if (gInfo) {
                promises.push(useApi(`/api/admin/users/${userId}/groups/${gInfo.id}`, { method: 'POST' }))
            }
        }

        // Queue Remove Requests
        for (const name of toRemove) {
            const gInfo = groups.value.find(g => g.name === name)
            if (gInfo) {
                promises.push(useApi(`/api/admin/users/${userId}/groups/${gInfo.id}`, { method: 'DELETE' }))
            }
        }

        await Promise.all(promises)

        // Update local user state — map draft names back to GroupInfo objects
        // Use distinct parameter names to avoid shadowing
        selectedUser.value.groups = draftGroups.value
            .map(name => groups.value.find(g => g.name === name))
            .filter((g): g is GroupInfo => g !== undefined)

        toast.success(t('common.success'))
        showGroupsDialog.value = false

    } catch (e) {
        console.error(e)
        toast.error(t('admin.userManagement.fetchError'))
    } finally {
        isSavingGroups.value = false
    }
}

// --- Actions: Instant (Table Context) ---

// Direct remove from table
const quickRemoveGroup = async (user: AdminUser, group: GroupInfo) => {
    const groupInfo = groups.value.find(g => g === group)
    if (!groupInfo) return

    const original = [...user.groups]
    user.groups = user.groups.filter(g => g !== group) // Optimistic

    try {
        await useApi(`/api/admin/users/${user.id}/groups/${groupInfo.id}`, { method: 'DELETE' })
    } catch (e) {
        user.groups = original
        toast.error(t('admin.users.updateFailed'))
    }
}

const handleTierChange = async (user: AdminUser, event: Event) => {
    const val = (event.target as HTMLSelectElement).value
    const newTierID = (val === 'null' || val === '') ? null : Number(val)
    user.tierID = newTierID
    try {
        await useApi(`/api/admin/users/${user.id}/tier`, { method: 'PUT', body: { tierID: newTierID } })
    } catch (e) { console.error(e) }
}

// --- Actions: Delete ---
const confirmDelete = (user: AdminUser) => {
    userToDelete.value = user
    showDeleteDialog.value = true
}

const executeDelete = async () => {
    if (!userToDelete.value) return
    isDeleting.value = true
    try {
        await useApi(`/api/admin/users/${userToDelete.value.id}`, { method: 'DELETE' })
        users.value = users.value.filter(u => u.id !== userToDelete.value?.id)
        showDeleteDialog.value = false
        toast.success(t('common.success'))
    } catch (e: any) {
        toast.error(t('error.generic'))
    } finally {
        isDeleting.value = false
        userToDelete.value = null
    }
}

// --- Actions: Create User ---

const openCreateUser = () => {
    newUsername.value = ''
    newEmail.value = ''
    newPassword.value = ''
    showCreateUserDialog.value = true
}

const createUser = async () => {
    if (!newUsername.value.trim() || !newEmail.value.trim() || !newPassword.value) return
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/
    if (!passwordRegex.test(newPassword.value)) {
        toast.error(t('auth.error.passwordTooWeak'))
        return
    }

    isCreatingUser.value = true
    try {
        const created = await useApi<AdminUser>('/api/admin/users', {
            method: 'POST',
            body: { username: newUsername.value.trim(), email: newEmail.value.trim(), password: newPassword.value },
        })
        if (created) users.value.push(created)
        showCreateUserDialog.value = false
        toast.success(t('common.success'))
    } catch (e: any) {
        toast.error(e?.data?.localizationKey ? t(e.data.localizationKey) : t('error.generic'))
    } finally {
        isCreatingUser.value = false
    }
}

// --- Actions: Group Management ---

const openCreateGroup = () => {
    newGroupName.value = ''
    showCreateGroupDialog.value = true
}

const createGroup = async () => {
    if (!newGroupName.value.trim()) return
    isCreatingGroup.value = true
    try {
        const created = await useApi<GroupInfo>('/api/admin/groups', {
            method: 'POST',
            body: { name: newGroupName.value.trim() },
        })
        if (created) groups.value.push(created)
        showCreateGroupDialog.value = false
        toast.success(t('common.success'))
    } catch (e) {
        toast.error(t('admin.groupManagement.createError'))
    } finally {
        isCreatingGroup.value = false
    }
}

const openRenameGroup = (group: GroupInfo) => {
    editingGroup.value = group
    editGroupName.value = group.name
    showRenameGroupDialog.value = true
}

const renameGroup = async () => {
    if (!editingGroup.value || !editGroupName.value.trim()) return
    isRenamingGroup.value = true
    const oldGroup = editingGroup.value
    try {
        const updated = await useApi<GroupInfo>(`/api/admin/groups/${editingGroup.value.id}`, {
            method: 'PUT',
            body: { name: editGroupName.value.trim() },
        })
        if (updated) {
            const idx = groups.value.findIndex(g => g.id === updated.id)
            if (idx !== -1) groups.value[idx] = updated
            // Update group name in all users
            users.value.forEach(u => {
                const gi = u.groups.indexOf(oldGroup)
                if (gi !== -1) u.groups[gi] = updated
            })
        }
        showRenameGroupDialog.value = false
        toast.success(t('common.success'))
    } catch (e) {
        toast.error(t('error.generic'))
    } finally {
        isRenamingGroup.value = false
    }
}

const confirmDeleteGroup = (group: GroupInfo) => {
    groupToDelete.value = group
    showDeleteGroupDialog.value = true
}

const executeDeleteGroup = async () => {
    if (!groupToDelete.value) return
    isDeletingGroup.value = true
    try {
        await useApi(`/api/admin/groups/${groupToDelete.value.id}`, { method: 'DELETE' })
        const deletedGroup = groupToDelete.value
        groups.value = groups.value.filter(g => g.id !== groupToDelete.value?.id)
        // Remove from all users
        users.value.forEach(u => {
            u.groups = u.groups.filter(g => g !== deletedGroup)
        })
        showDeleteGroupDialog.value = false
        toast.success(t('common.success'))
    } catch (e) {
        toast.error(t('error.generic'))
    } finally {
        isDeletingGroup.value = false
        groupToDelete.value = null
    }
}

const handleGroupTierChange = async (group: GroupInfo, event: Event) => {
    const val = (event.target as HTMLSelectElement).value
    const newTierID = (val === 'null' || val === '') ? null : Number(val)
    group.tierID = newTierID
    try {
        await useApi(`/api/admin/groups/${group.id}/tier`, { method: 'PUT', body: { tierID: newTierID } })
    } catch (e) { console.error(e) }
}
</script>

<template>
    <div class="space-y-2 px-2">


        <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-start">
            <!-- Users Table -->
            <div class="flex flex-col items-stretch justify-between min-w-0">
                <h1 class="text-4xl font-medium text-gray-900 dark:text-gray-100">
                    {{ t('admin.userManagement.title') }}
                </h1>
                <div
                    class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 mt-2 max-h-[75vh] overflow-y-auto">
                    <table class="min-w-full divide-y divide-gray-100 dark:divide-neutral-800 w-full">
                        <thead class="bg-gray-50/50 dark:bg-neutral-800/50 sticky top-0 z-10">
                            <tr>
                                <th class="py-3 pl-4 text-left text-xs font-medium uppercase text-gray-500">User</th>
                                <th class="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 w-[40%]">
                                    Groups
                                </th>
                                <th class="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Usage</th>
                                <th class="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Tier</th>
                                <th class="py-3 pr-4 text-right text-xs font-medium uppercase text-gray-500">
                                    <button @click="openCreateUser"
                                        class="inline-flex items-center justify-start text-start gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors">
                                        <Icon name="heroicons:plus-20-solid" class="h-3.5 w-3.5" />
                                        {{ t('admin.userManagement.addUser') }}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-neutral-800">
                            <tr v-for="user in users" :key="user.id"
                                class="group hover:bg-gray-50 dark:hover:bg-neutral-800/40 transition-colors">

                                <td class="py-3 pl-4 align-middle">
                                    <div class="font-medium text-gray-900 dark:text-white">{{ user.username }}</div>
                                    <div class="text-xs text-gray-500">{{ user.email }}</div>
                                </td>

                                <td class="px-3 py-3 align-middle">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span v-for="group in user.groups" :key="group.id"
                                            class="group/tag inline-flex items-center rounded-md pl-2 pr-1 py-1 text-xs font-medium ring-1 ring-inset"
                                            :class="group.isAdmin
                                                ? 'bg-red-50 text-red-700 ring-red-700/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/30'
                                                : 'bg-primary-50 text-primary-700 ring-primary-700/10 dark:bg-primary-400/10 dark:text-primary-400 dark:ring-primary-400/30'
                                                ">
                                            {{ group.name }}
                                            <div class="w-5 h-4 flex items-center justify-center">
                                                <button @click.stop="quickRemoveGroup(user, group)"
                                                    class="ml-1 inline-flex items-center justify-center rounded-full p-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                                                    :class="group.isAdmin
                                                        ? 'text-red-600/70 hover:bg-red-200 hover:text-red-800 dark:text-red-400/70 dark:hover:bg-red-800 dark:hover:text-red-200'
                                                        : 'text-primary-600/70 hover:bg-primary-200 hover:text-primary-800 dark:text-primary-400/70 dark:hover:bg-primary-800 dark:hover:text-primary-200'
                                                        ">
                                                    <Icon name="heroicons:x-mark-20-solid" class="h-3 w-3" />
                                                </button>
                                            </div>
                                        </span>

                                        <button @click="openGroups(user)"
                                            class="inline-flex items-center justify-center rounded-md border border-dashed border-gray-300 px-2 py-1 text-xs font-medium text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:border-neutral-700 dark:text-neutral-500 dark:hover:border-neutral-600 dark:hover:text-neutral-400 transition-colors">
                                            <Icon name="heroicons:pencil-square-20-solid" class="mr-1 h-3 w-3" /> Edit
                                        </button>
                                    </div>
                                </td>

                                <td class="px-3 py-3 text-right text-sm text-gray-500 font-mono align-middle">
                                    {{ formatSize(user.currentStorageUsage) }}
                                </td>

                                <td class="px-3 py-3 align-middle">
                                    <div class="relative w-fit">
                                        <select :value="user.tierID ?? 'null'" @change="handleTierChange(user, $event)"
                                            class="appearance-none block w-full rounded-lg border-0 bg-white py-1.5 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6 cursor-pointer hover:bg-gray-50 hover:ring-gray-300 dark:bg-neutral-800 dark:text-white dark:ring-neutral-700 dark:hover:bg-neutral-700 transition-shadow"
                                            :class="{ 'text-gray-400 dark:text-neutral-500': user.tierID === null }">
                                            <option value="null" class="text-gray-500">{{
                                                t('admin.userManagement.inherit')
                                                }}</option>
                                            <option v-for="tier in tiers" :key="tier.id" :value="tier.id"
                                                class="text-gray-900 dark:text-white">
                                                {{ tier.name }} ({{ formatSize(tier.limitBytes) }})
                                            </option>
                                        </select>
                                        <div
                                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <Icon name="heroicons:chevron-up-down-20-solid"
                                                class="h-4 w-4 text-gray-400" aria-hidden="true" />
                                        </div>
                                    </div>
                                </td>

                                <td class="py-3 pr-4 text-right align-middle">
                                    <button @click="confirmDelete(user)"
                                        class="inline-flex items-center text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <Icon name="heroicons:trash-20-solid" class="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot class="sticky bottom-0">
                            <tr>
                                <td colspan="5" class="py-1 px-2 text-xs text-red-500 dark:text-red-400">{{
                                    t('admin.userManagement.redGroupsAdminPrivsInfo') }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Groups Table -->
            <div class="min-w-[320px]">
                <h1 class="text-4xl font-medium text-gray-900 dark:text-gray-100">
                    {{ t('admin.groupManagement.title') }}
                </h1>
                <div
                    class="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 max-h-[75vh] overflow-y-auto">
                    <table class="min-w-full divide-y divide-gray-100 dark:divide-neutral-800">
                        <thead class="bg-gray-50/50 dark:bg-neutral-800/50 sticky top-0 z-10">
                            <tr>
                                <th class="py-3 pl-4 text-left text-xs font-medium uppercase text-gray-500">
                                    {{ t('admin.groupManagement.groupName') }}</th>
                                <th class="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Tier</th>
                                <th class="py-3 pr-4 text-right text-xs font-medium uppercase text-gray-500">
                                    <button @click="openCreateGroup"
                                        class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors">
                                        <Icon name="heroicons:plus-20-solid" class="h-3.5 w-3.5" />
                                        {{ t('admin.groupManagement.addGroup') }}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-neutral-800">
                            <tr v-for="group in groups" :key="group.id"
                                class="group hover:bg-gray-50 dark:hover:bg-neutral-800/40 transition-colors">
                                <td class="py-3 pl-4 align-middle">
                                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ group.name
                                        }}</span>
                                </td>
                                <td class="px-3 py-3 align-middle">
                                    <div class="relative w-fit">
                                        <select :value="group.tierID ?? 'null'"
                                            @change="handleGroupTierChange(group, $event)"
                                            class="appearance-none block w-full rounded-lg border-0 bg-white py-1.5 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6 cursor-pointer hover:bg-gray-50 hover:ring-gray-300 dark:bg-neutral-800 dark:text-white dark:ring-neutral-700 dark:hover:bg-neutral-700 transition-shadow"
                                            :class="{ 'text-gray-400 dark:text-neutral-500': group.tierID === null }">
                                            <option value="null" class="text-gray-500">{{
                                                t('admin.userManagement.noTier')
                                                }}</option>
                                            <option v-for="tier in tiers" :key="tier.id" :value="tier.id"
                                                class="text-gray-900 dark:text-white">
                                                {{ tier.name }} ({{ formatSize(tier.limitBytes) }})
                                            </option>
                                        </select>
                                        <div
                                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <Icon name="heroicons:chevron-up-down-20-solid"
                                                class="h-4 w-4 text-gray-400" aria-hidden="true" />
                                        </div>
                                    </div>
                                </td>
                                <td class="py-3 pr-4 text-right align-middle">
                                    <div class="flex items-center justify-end gap-1">
                                        <button @click="openRenameGroup(group)"
                                            class="inline-flex items-center text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
                                            <Icon name="heroicons:pencil-square-20-solid" class="w-5 h-5" />
                                        </button>
                                        <button @click="confirmDeleteGroup(group)"
                                            class="inline-flex items-center text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Icon name="heroicons:trash-20-solid" class="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- User Groups Assignment Dialog -->
        <AppDialog v-model="showGroupsDialog" :title="t('admin.userManagement.manageGroups')">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {{ t('admin.userManagement.manageGroupsDescription', { name: selectedUser?.username }) }}
            </p>

            <div class="mb-4">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {{ t('admin.userManagement.groups') }}
                </p>
                <div v-if="draftGroups.length > 0" class="flex flex-wrap gap-2">
                    <transition-group name="list" tag="div" class="contents">
                        <div v-for="groupName in draftGroups" :key="groupName"
                            class="group inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium ring-1 ring-inset"
                            :class="groups.find(g => g.name === groupName)?.isAdmin
                                ? 'bg-red-50 text-red-700 ring-red-700/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/30'
                                : 'bg-primary-50 text-primary-700 ring-primary-700/10 dark:bg-primary-400/10 dark:text-primary-400 dark:ring-primary-400/30'
                                ">
                            {{ groupName }}
                            <button @click="removeFromDraft(groupName)"
                                class="flex items-center justify-center rounded-full p-0.5 transition-colors" :class="groups.find(g => g.name === groupName)?.isAdmin
                                    ? 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50'
                                    : 'bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50'
                                    ">
                                <Icon name="heroicons:x-mark-16-solid" class="w-3 h-3" />
                            </button>
                        </div>
                    </transition-group>
                </div>
                <div v-else class="text-sm text-gray-400 dark:text-neutral-500 italic">
                    {{ t('admin.userManagement.noGroups') }}
                </div>
            </div>

            <div class="relative mb-2">
                <Icon name="heroicons:magnifying-glass-20-solid"
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <AppInput v-model="groupSearchQuery" type="text"
                    :placeholder="t('admin.userManagement.searchGroups')" />
            </div>

            <div
                class="max-h-48 overflow-y-auto flex flex-wrap gap-2 rounded-lg ring-1 ring-gray-200 dark:ring-neutral-700 p-2 bg-gray-50/50 dark:bg-neutral-900/50">
                <button v-for="group in availableGroupsFiltered" :key="group.id" @click="addToDraft(group)"
                    class="group inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    :class="group.isAdmin
                        ? 'hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                        : 'hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-400'
                        ">
                    <span>{{ group.name }}</span>
                    <Icon name="heroicons:plus-small-20-solid"
                        class="w-4 h-4 text-gray-400 dark:text-neutral-500 transition-colors" :class="group.isAdmin
                            ? 'group-hover:text-red-600 dark:group-hover:text-red-400'
                            : 'group-hover:text-primary-600 dark:group-hover:text-primary-400'
                            " />
                </button>
                <div v-if="availableGroupsFiltered.length === 0"
                    class="w-content px-2 py-2 text-sm text-gray-400 dark:text-neutral-500 text-center italic">
                    {{ t('admin.userManagement.noGroups') }}
                </div>
            </div>

            <template #footer>
                <div class="flex gap-3">
                    <AppButton variant="secondary" rounded="rounded-lg" @click="showGroupsDialog = false"
                        :disabled="isSavingGroups">
                        {{ t('common.cancel') }}
                    </AppButton>
                    <AppButton variant="primary" rounded="rounded-lg" @click="saveGroups" :loading="isSavingGroups">
                        {{ t('common.save') }}
                    </AppButton>
                </div>
            </template>
        </AppDialog>

        <!-- Create Group Dialog -->
        <AppDialog v-model="showCreateGroupDialog" :title="t('admin.groupManagement.addGroup')">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('admin.groupManagement.groupName') }}
                    </label>
                    <AppInput v-model="newGroupName" type="text" autofocus @keydown.enter="createGroup"
                        :placeholder="t('admin.groupManagement.namePlaceholder')" />
                </div>
            </div>

            <template #footer>
                <div class="flex gap-3">
                    <AppButton variant="secondary" rounded="rounded-lg" @click="showCreateGroupDialog = false"
                        :disabled="isCreatingGroup">
                        {{ t('common.cancel') }}
                    </AppButton>
                    <AppButton variant="primary" rounded="rounded-lg" @click="createGroup" :loading="isCreatingGroup"
                        :disabled="!newGroupName.trim()">
                        {{ t('admin.groupManagement.addGroup') }}
                    </AppButton>
                </div>
            </template>
        </AppDialog>

        <!-- Rename Group Dialog -->
        <AppDialog v-model="showRenameGroupDialog" :title="t('admin.groupManagement.renameGroup')">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('admin.groupManagement.groupName') }}
                    </label>
                    <AppInput v-model="editGroupName" type="text" autofocus @keydown.enter="renameGroup"
                        :placeholder="t('admin.groupManagement.namePlaceholder')" />
                </div>
            </div>

            <template #footer>
                <div class="flex gap-3">
                    <AppButton variant="secondary" rounded="rounded-lg" @click="showRenameGroupDialog = false"
                        :disabled="isRenamingGroup">
                        {{ t('common.cancel') }}
                    </AppButton>
                    <AppButton variant="primary" rounded="rounded-lg" @click="renameGroup" :loading="isRenamingGroup"
                        :disabled="!editGroupName.trim()">
                        {{ t('common.save') }}
                    </AppButton>
                </div>
            </template>
        </AppDialog>

        <!-- Delete Group Confirmation -->
        <AppAlertDialog v-model="showDeleteGroupDialog" :title="t('admin.groupManagement.deleteGroup')"
            :description="t('admin.groupManagement.deleteConfirm', { name: groupToDelete?.name })"
            :confirmLabel="t('admin.groupManagement.deleteGroup')" variant="danger" :loading="isDeletingGroup"
            @confirm="executeDeleteGroup" />

        <!-- Create User Dialog -->
        <AppDialog v-model="showCreateUserDialog" :title="t('admin.userManagement.addUser')">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('admin.userManagement.username') }}
                    </label>
                    <AppInput v-model="newUsername" type="text" autofocus
                        :placeholder="t('admin.userManagement.usernamePlaceholder')" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('admin.userManagement.email') }}
                    </label>
                    <AppInput v-model="newEmail" type="email"
                        :placeholder="t('admin.userManagement.emailPlaceholder')" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('admin.userManagement.password') }}
                    </label>
                    <AppInput v-model="newPassword" type="password" @keydown.enter="createUser"
                        :placeholder="t('admin.userManagement.passwordPlaceholder')" />
                </div>
            </div>

            <template #footer>
                <div class="flex gap-3">
                    <AppButton variant="secondary" rounded="rounded-lg" @click="showCreateUserDialog = false"
                        :disabled="isCreatingUser">
                        {{ t('common.cancel') }}
                    </AppButton>
                    <AppButton variant="primary" rounded="rounded-lg" @click="createUser" :loading="isCreatingUser"
                        :disabled="!newUsername.trim() || !newEmail.trim() || !newPassword">
                        {{ t('admin.userManagement.addUser') }}
                    </AppButton>
                </div>
            </template>
        </AppDialog>

        <!-- Delete User Confirmation -->
        <AppAlertDialog v-model="showDeleteDialog" :title="t('admin.userManagement.deleteUser')"
            :description="t('admin.userManagement.deleteConfirm', { name: userToDelete?.username })"
            :confirmLabel="t('admin.userManagement.deleteUser')" variant="danger" :loading="isDeleting"
            @confirm="executeDelete" />
    </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
    transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
</style>