<script setup lang="ts">
interface Props {
  post: {
    _path?: string
    path?: string
    title: string
    description: string
    pubDate?: string
    slug?: string
    content?: string
    meta?: Record<string, any>
    bgimg?: string | null
    video?: string | null
    media?: string | null
  }
}

const props = defineProps<Props>()

// Определяем, какой тип медиа показывать
const mediaType = computed(() => {
  const video = props.post.video ?? props.post.meta?.video
  const bgimg = props.post.bgimg ?? props.post.meta?.bgimg
  const media = props.post.media ?? props.post.meta?.media
  if (video) return 'video'
  if (bgimg) return 'image'
  if (media) {
    const extension = String(media).split('.').pop()?.toLowerCase()
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension || '')) {
      return 'video'
    }
    return 'image'
  }
  return null
})

const mediaSrc = computed(() => {
  return props.post.video ?? props.post.bgimg ?? props.post.media ?? props.post.meta?.video ?? props.post.meta?.bgimg ?? props.post.meta?.media ?? null
})
</script>

<template>
  <nuxt-link :to="post._path || post.path" class="block group">
    <div class="bg-background rounded-lg shadow-lg border border-white/10 overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-white/20 w-full h-full flex flex-col">
      <!-- Media Section -->
      <div v-if="mediaType && mediaSrc" class="relative h-64 overflow-hidden flex-shrink-0 isolate">
        <!-- Video -->
        <video 
          v-if="mediaType === 'video'"
          :src="`/images/${mediaSrc}`"
          :alt="post.title"
          class="w-full h-full object-cover"
          autoplay
          muted
          loop
          playsinline
        />
        
        <!-- Image -->
        <img 
          v-else-if="mediaType === 'image'"
          :src="`/images/${mediaSrc}`"
          :alt="post.title"
          class="w-full h-full object-cover"
        />
        
        <!-- Enhanced gradient overlay for smooth transition -->
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>
        <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 h-12 bg-background"></div>
        <!-- Additional overlay to ensure complete coverage -->
        <div class="absolute bottom-0 left-0 right-0 h-6 bg-background opacity-100"></div>
      </div>
      
      <!-- Content Section -->
      <div class="p-6 pt-4 flex-1 flex flex-col">
        <h3 class="text-xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
          {{ post.title }}
        </h3>
        <p class="text-white/80 text-sm leading-relaxed line-clamp-3 flex-1">
          {{ post.description }}
        </p>
      </div>
    </div>
  </nuxt-link>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
