<script setup lang="ts">
import { Card } from '~/components/ui/card'

// Получаем все посты из папки content/posts через API
const { data: postsResponse } = await useAsyncData('all-posts', () => 
  $fetch('/api/posts')
)

const posts = computed(() => postsResponse.value?.posts || [])

// Логируем данные для отладки
console.log('Posts data:', posts.value)

// Определяем тип для постов
type Post = {
  _path: string
  title: string
  description: string
  pubDate: string
  slug: string
  content: string
  bgimg?: string | null
  video?: string | null
  media?: string | null
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-8">Все посты</h1>
    
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="post in (posts as Post[])" 
            :key="post._path" 
            class="h-96"
          >
            <PostCard :post="post as any" />
          </div>
        </div>
  </div>
</template> 
