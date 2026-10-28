<script setup lang="ts">
import { useTemplateRef } from 'vue'

withDefaults(defineProps<{
  /** `true` when the composer slot owns its bottom space, such as a foldable composer whose tab drops to the bottom edge. */
  composerAtEdge?: boolean
}>(), {
  composerAtEdge: false,
})

defineSlots<{
  composer: () => unknown
  history: (props: { tailInset: number }) => unknown
}>()

const historyLayer = useTemplateRef<HTMLElement>('history-layer')

defineExpose({
  historyLayer,
})
</script>

<template>
  <div
    data-testid="chat-viewport-layout"
    :class="[
      'chat-viewport-layout',
    ]"
  >
    <div
      ref="history-layer"
      data-testid="chat-history-layer"
      :class="[
        'chat-history-layer',
      ]"
    >
      <slot name="history" :tail-inset="0" />
    </div>

    <div
      data-testid="chat-composer-layer"
      :class="[
        'chat-composer-layer',
        composerAtEdge ? 'chat-composer-layer--at-edge' : '',
      ]"
    >
      <slot name="composer" />
    </div>
  </div>
</template>

<style scoped>
.chat-viewport-layout {
  display: grid;
  grid-template-areas: 'history' 'composer';
  grid-template-rows: minmax(0, 1fr) auto;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.chat-history-layer {
  grid-area: history;
  position: relative;
  min-height: 0;
}

.chat-composer-layer {
  grid-area: composer;
  align-self: end;
  position: relative;
  z-index: 20;
  min-height: 0;
  max-height: calc(100% - 1rem);
  margin: 0 1rem 1rem;
  overflow: hidden;
}

.chat-composer-layer--at-edge {
  margin-bottom: 0;
}

.chat-viewport-layout :deep(.chat-history-list) {
  --chat-history-bottom-inset: 0px;

  box-sizing: border-box;
  border-radius: 0 !important;
  padding: 1rem;
}
</style>
