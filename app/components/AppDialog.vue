<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
    modelValue: boolean
    title?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'close'): void
}>()

const modalRef = ref<HTMLElement | null>(null)

const close = () => {
    emit('update:modelValue', false)
    emit('close')
}

watch(() => props.modelValue, async (val) => {
    if (val) {
        await nextTick()
        const autofocusElement = modalRef.value?.querySelector('[autofocus]') as HTMLElement
        if (autofocusElement) {
            autofocusElement.focus()
        } else {
            modalRef.value?.focus()
        }
    }
})
</script>

<template>
    <Teleport to="body">
        <!-- Backdrop -->
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="modelValue" class="fixed inset-0 bg-zinc-900/50 z-100" @click="close" aria-hidden="true" />
        </Transition>

        <!-- Modal Container -->
        <Transition enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100" leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <div v-if="modelValue" class="fixed inset-0 z-101 overflow-y-auto pointer-events-none">
                <div class="flex min-h-full items-end justify-center text-center sm:items-center ">
                    <div class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 text-left shadow-2xl transition-all w-full sm:max-w-lg border border-gray-100 dark:border-neutral-800 pointer-events-auto p-3 outline-none"
                        @click.stop role="dialog" aria-modal="true" aria-labelledby="modal-title" ref="modalRef"
                        tabindex="-1">
                        <div class="bg-white dark:bg-neutral-900">
                            <div class="sm:flex sm:items-start">
                                <div class="mt-3 sm:mt-0 w-full">
                                    <h3 v-if="title"
                                        class="text-3xl font-light leading-6 text-gray-900 dark:text-white mb-2"
                                        id="modal-title">{{ title }}</h3>
                                    <div class="">
                                        <slot />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="sm:flex sm:flex-row-reverse  gap-3 mt-4 mb-3 sm:mb-0">
                            <slot name="footer" :close="close" />
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
