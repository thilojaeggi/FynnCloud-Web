<script setup lang="ts">
const { initTheme } = useTheme()
const { initAppConfig, isOffline, appName } = useBackEndConfig()

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - ${appName.value}` : appName.value
  }
})

onMounted(() => {
  initTheme()
  initAppConfig()
})
</script>

<template>
  <NuxtLayout name="auth" v-if="isOffline">
    <ServerOffline />
  </NuxtLayout>
  <template v-else>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppToastContainer />
  </template>
</template>
