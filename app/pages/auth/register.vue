<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const { t } = useI18n()

useHead({
  title: t('auth.register.title')
})

const { register } = useAuth()
const username = ref('')
const password = ref('')
const email = ref('')
const confirmPassword = ref('')
const error = ref('')
const isLoading = ref(false)

const handleRegister = async () => {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = t('auth.error.passwordMismatch')
    return
  }


  isLoading.value = true
  try {
    await register({
      username: username.value,
      password: password.value,
      email: email.value,
      confirmPassword: confirmPassword.value
    })
  } catch (e: any) {
    if (e.data?.localizationKey) {
      error.value = t(e.data.localizationKey)
    } else if (!e.response) {
      error.value = t('error.serverUnreachable')
    } else {
      error.value = e.data?.reason || e.message || t('error.generic')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthCard :title="$t('auth.register.title')">
    <form @submit.prevent="handleRegister" class="space-y-3">
      <AuthInput :required="true" :label="$t('auth.username')" v-model="username" type="text"
        :placeholder="$t('auth.username')" autofocus />

      <AuthInput :required="false" :label="$t('auth.email')" v-model="email" type="email"
        :placeholder="$t('auth.email')" />

      <AuthInput :required="true" :label="$t('auth.password')" v-model="password" type="password"
        :placeholder="$t('auth.password')" />

      <AuthInput :required="true" :label="$t('auth.confirmPassword')" v-model="confirmPassword" type="password"
        :placeholder="$t('auth.confirmPassword')" />

      <AuthError :error="error" />

      <AppButton block :label="$t('auth.register.title')" variant="white" size="md" type="submit" :loading="isLoading"
        :disabled="username.length === 0 || password.length === 0 || confirmPassword.length === 0" />
    </form>

    <template #footer>
      <p class="text-sm text-primary-200">
        {{ $t('auth.register.footer') }}
        <NuxtLink to="/auth/login"
          class="text-white hover:text-primary-50 font-semibold hover:underline decoration-2 underline-offset-2 transition-all">
          {{ $t('auth.register.action') }}
        </NuxtLink>
      </p>
    </template>
  </AuthCard>
</template>
