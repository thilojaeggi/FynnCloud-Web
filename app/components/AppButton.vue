<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  to?: string
  icon?: string
  loading?: boolean
  block?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'white' | 'custom' | 'clear' | 'canvas'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit'
  rounded?: string
  textColor?: string

  // Custom gradient options
  gradientFrom?: string
  gradientTo?: string
  gradientFromActive?: string
  gradientToActive?: string

  // Additional customization
  shadow?: string
  activeShadow?: string
  borderClass?: string
  paddingX?: string
  paddingY?: string
  fontSize?: string
  fontWeight?: string
  textShadow?: boolean

  baseColor?: string
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  rounded: 'rounded-xl',
  fontWeight: 'font-medium',
  textShadow: true
})

const variantClasses = computed(() => {
  if (props.baseColor) {
    return `from-${props.baseColor}-500 to-${props.baseColor}-700 group-active:from-${props.baseColor}-600 group-active:to-${props.baseColor}-800`
  }

  if (props.variant === 'custom' && props.gradientFrom && props.gradientTo) {
    const from = props.gradientFrom
    const to = props.gradientTo
    const fromActive = props.gradientFromActive || props.gradientFrom
    const toActive = props.gradientToActive || props.gradientTo

    return `from-${from} to-${to} group-active:from-${fromActive} group-active:to-${toActive}`
  }

  const map = {
    primary: 'from-primary-500 to-primary-700 group-active:from-primary-600 group-active:to-primary-800',
    secondary: 'from-gray-500 to-gray-600 group-active:from-gray-600 group-active:to-gray-700 dark:from-gray-600 dark:to-gray-700 dark:group-active:from-gray-700 dark:group-active:to-gray-800 border-[0.5px] border-gray-700/30 dark:border-gray-500/30',
    white: 'from-white to-gray-200 group-active:from-gray-100 group-active:to-gray-300 border-[0.5px] border-gray-400/75',
    danger: 'from-red-500 to-red-700 group-active:from-red-600 group-active:to-red-800',
    ghost: 'bg-transparent shadow-none',
    clear: 'bg-transparent shadow-none',
    canvas: 'from-white to-gray-200 group-active:from-gray-100 group-active:to-gray-300 dark:from-neutral-800 dark:to-neutral-900 dark:group-active:from-neutral-800 dark:group-active:to-neutral-900 border-[0.5px] border-gray-400/75',
    custom: ''
  }
  return map[props.variant]
})

const textColor = computed(() => {
  if (props.textColor) return props.textColor

  const map = {
    primary: 'text-white',
    secondary: 'text-white',
    white: 'text-gray-900',
    danger: 'text-white',
    ghost: 'text-gray-600',
    clear: 'text-gray-600',
    custom: 'text-white',
    canvas: 'text-gray-600 dark:text-gray-200'
  }
  return map[props.variant]
})

const sizeClasses = computed(() => {
  if (props.paddingX && props.paddingY) {
    return `${props.paddingX} ${props.paddingY}`
  }

  const map = {
    sm: 'px-2 py-1',
    md: 'px-2 py-1.5',
    lg: 'px-6 py-3',
    xl: 'px-8 py-4'
  }
  return map[props.size]
})

const textSize = computed(() => {
  if (props.fontSize) return props.fontSize

  const map = {
    sm: 'text-sm',
    md: 'text-md',
    lg: 'text-lg',
    xl: 'text-xl'
  }
  return map[props.size]
})

const shadowClasses = computed(() => {
  const defaultShadow = 'shadow-[inset_0_2px_2px_rgba(255,255,255,0.3),0_4px_6px_rgba(0,0,0,0.1)]'
  const defaultActiveShadow = 'shadow-[inset_0_8px_16px_-2px_rgba(0,0,0,0.4)]'

  return {
    normal: props.shadow || defaultShadow,
    active: props.activeShadow || defaultActiveShadow
  }
})

const textShadowClass = computed(() => {
  return props.textShadow ? 'drop-shadow-md' : ''
})

const inlineGradientStyle = computed(() => {
  if (props.variant === 'custom' && props.gradientFrom && props.gradientTo) {
    if (props.gradientFrom.includes('#') || props.gradientFrom.includes('rgb')) {
      return {
        backgroundImage: `linear-gradient(to bottom, ${props.gradientFrom}, ${props.gradientTo})`
      }
    }
  }
  return {}
})
</script>

<template>
  <component :is="to ? 'NuxtLink' : 'button'" :to="to" :type="!to ? type : undefined" :disabled="loading"
    class="group relative inline-flex items-center justify-center transition-all duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
    :class="[block ? 'flex w-full' : '', rounded, sizeClasses]">
    <div v-if="variant !== 'ghost'" class="absolute inset-0 bg-gradient-to-b transition-all duration-150 ease-out"
      :class="[
        variantClasses,
        rounded,
        borderClass,
        shadowClasses.normal,
        `group-active:${shadowClasses.active}`
      ]" :style="inlineGradientStyle"></div>

    <div class="relative z-10 flex items-center justify-center gap-2 transition-transform duration-150 ease-out"
      :class="[textColor, textShadowClass]">
      <svg v-if="loading" class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>

      <span v-if="icon && !loading" :class="[icon, 'h-5 w-5']" />

      <span class="font-sans tracking-tight" :class="[textSize, fontWeight]">
        <slot>{{ label }}</slot>
      </span>
    </div>
  </component>
</template>