<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { t } = useI18n()
useHead({ title: t('admin.tiers') })
const { toast } = useToast()

// --- Types ---
interface TierInfo { id: number; name: string; limitBytes: number }

// --- State ---
const tiers = ref<TierInfo[]>([])
const loading = ref(true)

// Create Dialog
const showCreateDialog = ref(false)
const newTierName = ref('')
const newTierLimitGB = ref<number | null>(null)
const newTierUnlimited = ref(false)
const isCreating = ref(false)

// Edit Dialog
const showEditDialog = ref(false)
const editingTier = ref<TierInfo | null>(null)
const editTierName = ref('')
const editTierLimitGB = ref<number | null>(null)
const editTierUnlimited = ref(false)
const isEditing = ref(false)

// Delete Dialog
const showDeleteDialog = ref(false)
const tierToDelete = ref<TierInfo | null>(null)
const isDeleting = ref(false)

// --- Helpers ---
import { formatSize } from '~/utils/file'

const gbToBytes = (gb: number) => Math.round(gb * 1024 * 1024 * 1024)
const bytesToGB = (bytes: number) => +(bytes / (1024 * 1024 * 1024)).toFixed(2)
const PB_BYTES = 1125899906842624

// --- API ---
const fetchTiers = async () => {
    loading.value = true
    try {
        const data = await useApi<TierInfo[]>('/api/admin/tiers')
        tiers.value = data ?? []
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(fetchTiers)

// --- Actions ---
const openCreate = () => {
    newTierName.value = ''
    newTierLimitGB.value = null
    newTierUnlimited.value = false
    showCreateDialog.value = true
}

const createTier = async () => {
    if (!newTierName.value.trim()) return
    if (!newTierUnlimited.value && !newTierLimitGB.value) return

    isCreating.value = true
    try {
        const limit = newTierUnlimited.value ? PB_BYTES : gbToBytes(newTierLimitGB.value!)
        const created = await useApi<TierInfo>('/api/admin/tiers', {
            method: 'POST',
            body: { name: newTierName.value.trim(), limitBytes: limit },
        })
        if (created) tiers.value.push(created)
        showCreateDialog.value = false
        toast.success(t('common.success'))
    } catch (e) {
        toast.error(t('admin.tierManagement.createError'))
    } finally {
        isCreating.value = false
    }
}

const openEdit = (tier: TierInfo) => {
    editingTier.value = tier
    editTierName.value = tier.name

    if (tier.limitBytes >= PB_BYTES) {
        editTierUnlimited.value = true
        editTierLimitGB.value = null
    } else {
        editTierUnlimited.value = false
        editTierLimitGB.value = bytesToGB(tier.limitBytes)
    }

    showEditDialog.value = true
}

const updateTier = async () => {
    if (!editingTier.value || !editTierName.value.trim()) return
    if (!editTierUnlimited.value && !editTierLimitGB.value) return

    isEditing.value = true
    try {
        const limit = editTierUnlimited.value ? PB_BYTES : gbToBytes(editTierLimitGB.value!)
        const updated = await useApi<TierInfo>(`/api/admin/tiers/${editingTier.value.id}`, {
            method: 'PUT',
            body: { name: editTierName.value.trim(), limitBytes: limit },
        })
        if (updated) {
            const idx = tiers.value.findIndex(t => t.id === updated.id)
            if (idx !== -1) tiers.value[idx] = updated
        }
        showEditDialog.value = false
        toast.success(t('common.success'))
    } catch (e) {
        toast.error(t('error.generic'))
    } finally {
        isEditing.value = false
    }
}

const confirmDelete = (tier: TierInfo) => {
    tierToDelete.value = tier
    showDeleteDialog.value = true
}

const executeDeletion = async () => {
    if (!tierToDelete.value) return
    isDeleting.value = true
    try {
        await useApi(`/api/admin/tiers/${tierToDelete.value.id}`, { method: 'DELETE' })
        tiers.value = tiers.value.filter(t => t.id !== tierToDelete.value?.id)
        showDeleteDialog.value = false
        toast.success(t('common.success'))
    } catch (e: any) {
        toast.error(e?.data?.reason ?? t('error.generic'))
    } finally {
        isDeleting.value = false
        tierToDelete.value = null
    }
}
</script>

<template>
    <div class="space-y-2 px-2">
        <div class="flex items-center justify-between">
            <h1 class="text-4xl font-medium text-gray-900 dark:text-gray-100">
                {{ t('admin.tiers') }}
            </h1>
        </div>

        <div v-if="loading" class="flex justify-center py-20">
            <Icon name="heroicons:arrow-path-20-solid" class="w-6 h-6 animate-spin text-gray-400" />
        </div>

        <div v-else
            class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-neutral-800">
                <thead class="bg-gray-50/50 dark:bg-neutral-800/50">
                    <tr>
                        <th class="py-3 pl-4 text-left text-xs font-medium uppercase text-gray-500">
                            {{ t('admin.tierManagement.tierName') }}
                        </th>
                        <th class="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            {{ t('admin.tierManagement.storageLimit') }}
                        </th>
                        <th class="py-3 pr-4 text-right text-xs font-medium uppercase text-gray-500">
                            <button @click="openCreate"
                                class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors">
                                <Icon name="heroicons:plus-20-solid" class="h-3.5 w-3.5" />
                                {{ t('admin.tierManagement.addTier') }}
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-neutral-800">
                    <tr v-for="tier in tiers" :key="tier.id"
                        class="group hover:bg-gray-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td class="py-3 pl-4 align-middle">
                            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ tier.name }}</span>
                        </td>
                        <td class="px-3 py-3 align-middle">
                            <span class="text-sm text-gray-600 dark:text-gray-300 font-mono">{{
                                formatSize(tier.limitBytes) }}</span>
                        </td>
                        <td class="py-3 pr-4 text-right align-middle">
                            <div class="flex items-center justify-end gap-1">
                                <button @click="openEdit(tier)"
                                    class="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
                                    <Icon name="heroicons:pencil-square-20-solid" class="w-5 h-5" />
                                </button>
                                <button @click="confirmDelete(tier)"
                                    class="flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <Icon name="heroicons:trash-20-solid" class="w-5 h-5" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Create Tier Dialog -->
        <AppDialog v-model="showCreateDialog" :title="t('admin.tierManagement.addTier')">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('admin.tierManagement.tierName') }}
                    </label>
                    <AppInput v-model="newTierName" type="text" autofocus
                        :placeholder="t('admin.tierManagement.namePlaceholder')" />
                </div>
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {{ t('admin.tierManagement.storageLimit') }}
                        </label>
                        <div class="flex items-center gap-2">
                            <AppCheckbox v-model="newTierUnlimited" id="createUnlimited"
                                :label="t('admin.tierManagement.unlimited')" />
                        </div>
                    </div>

                    <div class="relative">
                        <input v-model.number="newTierLimitGB" type="number" min="0" step="0.1"
                            @keydown.enter="createTier" :disabled="newTierUnlimited"
                            class="block w-full rounded-md border-none py-2 px-3 pr-10 text-sm text-gray-900 ring-1 ring-black/5 bg-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-neutral-800 dark:text-white dark:ring-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            :placeholder="newTierUnlimited ? t('admin.tierManagement.unlimited') : t('admin.tierManagement.limitPlaceholder')">
                        <span v-if="!newTierUnlimited"
                            class="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-gray-400 pointer-events-none">GB</span>
                    </div>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {{ t('admin.tierManagement.limitHint') }}
                    </p>
                </div>
            </div>

            <template #footer>
                <div class="flex gap-3">
                    <AppButton variant="secondary" rounded="rounded-lg" @click="showCreateDialog = false"
                        :disabled="isCreating">
                        {{ t('common.cancel') }}
                    </AppButton>
                    <AppButton variant="primary" rounded="rounded-lg" @click="createTier" :loading="isCreating"
                        :disabled="!newTierName.trim() || (!newTierUnlimited && !newTierLimitGB)">
                        {{ t('admin.tierManagement.addTier') }}
                    </AppButton>
                </div>
            </template>
        </AppDialog>

        <!-- Edit Tier Dialog -->
        <AppDialog v-model="showEditDialog" :title="t('admin.tierManagement.editTier')">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('admin.tierManagement.tierName') }}
                    </label>
                    <input v-model="editTierName" type="text" autofocus
                        class="block w-full rounded-lg border-none py-2 px-3 text-sm text-gray-900 ring-1 ring-black/5 bg-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:bg-neutral-800 dark:text-white dark:ring-white/10 dark:focus:ring-primary-500/40 transition-all duration-200"
                        :placeholder="t('admin.tierManagement.namePlaceholder')">
                </div>
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {{ t('admin.tierManagement.storageLimit') }}
                        </label>
                        <div class="flex items-center gap-2">
                            <input type="checkbox" v-model="editTierUnlimited" id="editUnlimited"
                                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600 dark:border-neutral-700 dark:bg-neutral-800 dark:checked:bg-primary-500">
                            <label for="editUnlimited"
                                class="text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">{{
                                    t('admin.tierManagement.unlimited') }}</label>
                        </div>
                    </div>
                    <div class="relative">
                        <input v-model.number="editTierLimitGB" type="number" min="0" step="0.1"
                            @keydown.enter="updateTier" :disabled="editTierUnlimited"
                            class="block w-full rounded-lg border-none py-2 px-3 pr-10 text-sm text-gray-900 ring-1 ring-black/5 bg-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:bg-neutral-800 dark:text-white dark:ring-white/10 dark:focus:ring-primary-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            :placeholder="editTierUnlimited ? t('admin.tierManagement.unlimited') : t('admin.tierManagement.limitPlaceholder')">
                        <span v-if="!editTierUnlimited"
                            class="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-gray-400 pointer-events-none">GB</span>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex gap-3">
                    <AppButton variant="secondary" rounded="rounded-lg" @click="showEditDialog = false"
                        :disabled="isEditing">
                        {{ t('common.cancel') }}
                    </AppButton>
                    <AppButton variant="primary" rounded="rounded-lg" @click="updateTier" :loading="isEditing"
                        :disabled="!editTierName.trim() || (!editTierUnlimited && !editTierLimitGB)">
                        {{ t('common.save') }}
                    </AppButton>
                </div>
            </template>
        </AppDialog>

        <!-- Delete Tier Confirmation -->
        <AppAlertDialog v-model="showDeleteDialog" :title="t('admin.tierManagement.deleteTier')"
            :description="t('admin.tierManagement.deleteConfirm', { name: tierToDelete?.name })"
            :confirmLabel="t('admin.tierManagement.deleteTier')" variant="danger" :loading="isDeleting"
            @confirm="executeDeletion" />
    </div>
</template>
