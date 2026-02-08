<script setup lang="ts">
const { initTheme } = useTheme()
const { initAppConfig } = useBackEndConfig()

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - FynnCloud` : 'FynnCloud'
  }
})

onMounted(() => {
  initTheme()
  initAppConfig()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppToastContainer />
</template>
