<script setup lang="ts">
interface Props {
  bgimg?: string | null
  video?: string | null
  media?: string | null
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: 'Post media'
})

// Определяем, какой тип медиа показывать
const mediaType = computed(() => {
  if (props.video) return 'video'
  if (props.bgimg) return 'image'
  if (props.media) {
    const extension = props.media.split('.').pop()?.toLowerCase()
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension || '')) {
      return 'video'
    }
    return 'image'
  }
  return null
})

const mediaSrc = computed(() => {
  if (props.video) return props.video
  if (props.bgimg) return props.bgimg
  if (props.media) return props.media
  return null
})
</script>

<template>
  <div v-if="mediaType && mediaSrc" class="w-full mb-8">
    <!-- Video -->
    <video 
      v-if="mediaType === 'video'"
      :src="`/images/${mediaSrc}`"
      :alt="alt"
      class="w-full h-auto rounded-lg shadow-lg"
      autoplay
      muted
      loop
      playsinline
    />
    
    <!-- Image -->
    <img 
      v-else-if="mediaType === 'image'"
      :src="`/images/${mediaSrc}`"
      :alt="alt"
      class="w-full h-auto rounded-lg shadow-lg"
    />
  </div>
</template>

