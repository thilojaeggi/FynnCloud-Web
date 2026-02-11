<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const { t } = useI18n()

useHead({
  title: t('auth.login.title')
})

const { login } = useAuth()
const { locales, setLocale } = useI18n()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

useHead({
  title: t('auth.login.title')
})

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true
  try {
    await login({
      username: username.value,
      password: password.value
    })
  } catch (e: any) {
    if (e.data?.localizationKey) {
      error.value = t(e.data.localizationKey)
    } else if (e.response && (e.response.status === 401 || e.response.status === 404 || e.response.status === 403)) {
      error.value = t('auth.error.credentials')
    } else if (!e.response) {
      error.value = t('error.serverUnreachable')
    } else {
      error.value = t('error.generic')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthCard :title="$t('auth.login.title')">
    <form @submit.prevent="handleLogin" class="space-y-3">
      <AuthInput :label="$t('auth.username')" v-model="username" type="text" :placeholder="$t('auth.username')"
        autofocus />

      <AuthInput :label="$t('auth.password')" v-model="password" type="password" :placeholder="$t('auth.password')" />


      <AuthError :error="error" />

      <div class=" flex justify-end ">
        <AppButton block :label="$t('auth.login.title')" variant="white" type="submit" :loading="isLoading"
          :disabled="username.length === 0 || password.length === 0" />
      </div>
    </form>

    <template #footer>
      <p class="text-sm text-primary-200">
        {{ $t('auth.login.footer') }}
        <NuxtLink to="/auth/register"
          class="text-white hover:text-primary-50 font-semibold hover:underline decoration-2 underline-offset-2 transition-all">
          {{ $t('auth.login.action') }}
        </NuxtLink>
      </p>
    </template>
  </AuthCard>
</template>
