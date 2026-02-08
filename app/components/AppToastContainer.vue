<script setup lang="ts">
const { toasts, removeToast } = useToast()
</script>

<template>
    <Teleport to="body">
        <div
            class="fixed bottom-0 right-0 z-200 flex flex-col gap-3 pointer-events-auto max-h-[calc(100vh)] overflow-y-auto p-4">
            <TransitionGroup enter-active-class="transition-all duration-500 ease-out"
                enter-from-class="opacity-0 translate-x-full scale-75"
                enter-to-class="opacity-100 translate-x-0 scale-100"
                leave-active-class="transition-all duration-300 ease-in"
                leave-from-class="opacity-100 translate-x-0 scale-100"
                leave-to-class="opacity-0 translate-x-full scale-75" move-class="transition-all duration-300 ease-out">
                <div v-for="(toast, index) in toasts" :key="toast.id" :style="{ transitionDelay: `${index * 50}ms` }">
                    <AppToast :toast="toast" :on-close="removeToast" :duration="5000" />
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>