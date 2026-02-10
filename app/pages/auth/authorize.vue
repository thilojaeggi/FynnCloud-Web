<script setup lang="ts">
import { useApiBase } from '~/composables/useApiBase'

definePageMeta({
    layout: 'auth'
})

const route = useRoute()
const { user } = useAuth()
const config = useRuntimeConfig()
const { $toast } = useNuxtApp()
const { t } = useI18n()


// Query params
const responseType = route.query.response_type as string
const clientId = route.query.client_id as string
const redirectUri = route.query.redirect_uri as string
const codeChallenge = route.query.code_challenge as string
const codeChallengeMethod = route.query.code_challenge_method as string
const state = route.query.state as string

const clientName = computed(() => {
    if (clientId === 'fynncloud-desktop') return 'FynnCloud Desktop'
    return clientId
})

const error = ref<string | null>(null)
const loading = ref(false)
const finished = ref(false)
const alreadyAuthorized = ref(false)


// Basic validation
if (!responseType || !clientId || !codeChallenge) {
    error.value = t('auth.authorize.error.missingParams')
}

// Ensure clientId is "fynncloud-desktop"
if (clientId !== "fynncloud-desktop") {
    error.value = t('auth.authorize.error.invalidClientId')
}

// Ensure responseType is "code"
if (responseType !== "code") {
    error.value = t('auth.authorize.error.invalidResponseType')
}

// Ensure codeChallengeMethod is "S256"
if (codeChallengeMethod !== "S256") {
    error.value = t('auth.authorize.error.invalidCodeChallengeMethod')
}

const authorize = async () => {
    loading.value = true
    const apiBase = useApiBase()
    try {
        const { callbackURL } = await $fetch<{ callbackURL: string }>(`${apiBase}/api/auth/authorize`, {
            method: 'POST',
            body: {
                clientId,
                codeChallenge: codeChallenge,
                redirectURI: redirectUri,
                state
            }
        })
        finished.value = true
        // Redirect to the callback URL (app scheme or http)
        window.location.href = callbackURL
    } catch (e: any) {
        console.error("Authorization failed", e)
        error.value = e.response?._data?.reason || t('error.unknown')
    } finally {
        loading.value = false
    }
}





const cancel = () => {
    // Close tab
    window.close()
}
</script>

<template>
    <AuthCard :title="t('auth.authorize.title')">
        <AuthError :error="error" class="mb-6" />

        <div v-if="!error" class="text-start">
            <div class="mb-8 relative">
                <p class="text-gray-300 text-sm leading-relaxed" v-if="!finished && !alreadyAuthorized"
                    v-html="t('auth.authorize.description', { client: `<span class='font-semibold text-white'>${clientName}</span>` })">
                </p>
                <p class="text-gray-300 text-sm leading-relaxed" v-else-if="!finished && alreadyAuthorized"
                    v-html="t('auth.authorize.alreadyAuthorized', { client: `<span class='font-semibold text-white'>${clientName}</span>` })">
                </p>
                <p class="text-gray-300 text-sm leading-relaxed" v-else v-html="t('auth.authorize.success')">
                </p>
            </div>

            <div class="space-y-6" v-if="!finished">
                <!-- Info Card -->
                <div
                    class="bg-white/5 rounded-2xl p-5 border border-white/10 shadow-lg text-left space-y-4 backdrop-blur-sm">
                    <div class="flex items-center justify-between group">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{
                            t('auth.authorize.account') }}</span>
                        <div class="flex items-center gap-2">
                            <div
                                class="w-6 h-6 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20">
                                {{ user?.username?.charAt(0).toUpperCase() }}
                            </div>
                            <span class="text-sm font-medium text-white">{{ user?.username }}</span>
                        </div>
                    </div>
                    <div class="h-px bg-white/10"></div>
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{
                            t('auth.authorize.permissions') }}</span>
                        <span
                            class="inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium ring-1 ring-inset ring-emerald-500/20">
                            {{ t('auth.authorize.fullAccess') }}
                        </span>
                    </div>
                </div>

                <!-- Actions -->
                <div class="grid grid-cols-2 gap-3 pt-2">
                    <AppButton variant="ghost" size="lg" text-color="text-white" rounded="rounded-xl"
                        class="w-full  hover:bg-white/10" @click="cancel" :disabled="loading">
                        {{ t('common.cancel') }}
                    </AppButton>
                    <AppButton variant="primary" size="lg" rounded="rounded-xl" class="w-full shadow-lg shadow-black/20"
                        @click="authorize" :disabled="loading" :loading="loading">
                        {{ alreadyAuthorized ? t('auth.authorize.continue') : t('auth.authorize.action') }}
                    </AppButton>
                </div>
            </div>
        </div>
    </AuthCard>
</template>