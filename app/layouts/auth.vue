<script setup lang="ts">

useHead({
  bodyAttrs: {
    class: 'min-h-dvh min-w-dvw bg-linear-to-br from-zinc-900 to-primary-700 dark:from-primary-950 dark:to-zinc-950 '
  },
  htmlAttrs: {
    class: 'bg-zinc-900 dark:bg-zinc-950 transition-colors duration-300'
  }
})
</script>

<template>
  <div class="min-h-dvh min-w-dvw flex items-center justify-center p-4 relative overflow-hidden font-sans">
    <div class="absolute top-6 right-6 z-20 flex gap-2">
      <ThemeSwitcher
        class="bg-transparent dark:bg-transparent hover:bg-white/10! dark:hover:bg-black/10! text-white dark:text-white!" />
      <LanguageSwitcher
        class="bg-transparent dark:bg-transparent hover:bg-white/10! dark:hover:bg-black/10! text-white dark:text-white!" />
    </div>
    <div class="relative z-10 w-full flex justify-center">

      <slot />
    </div>
  </div>
</template>