<script setup lang="ts">
import { Card } from '~/components/ui/card'
import { queryCollection } from '#imports'

type Post = {
  path?: string
  _path?: string
  title: string
  description: string
  pubDate?: string
  slug?: string
  body?: any
  meta?: Record<string, any>
  bgimg?: string | null
  video?: string | null
  media?: string | null
}

const route = useRoute()
const prefix = computed(() => route.path.startsWith('/en') ? '/en' : '')

const { data: allPosts } = await useAsyncData<Post[]>(
  'all-posts',
  () => queryCollection('content').where('path', 'LIKE', `${prefix.value || ''}/posts/%`).all() as any,
  { watch: [prefix] }
)

const posts = computed(() => {
  const list = (allPosts.value as unknown as Post[]) || []
  return [...list].sort((a: any, b: any) => {
    const da = new Date(a?.meta?.pubDate || a?.pubDate || 0).getTime()
    const db = new Date(b?.meta?.pubDate || b?.pubDate || 0).getTime()
    return db - da
  })
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-8">{{ $t('postsIndex.title') }}</h1>
    
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="post in (posts as Post[])" 
            :key="post._path || post.path" 
            class="h-96"
          >
            <PostCard :post="post as any" />
          </div>
        </div>
  </div>
</template> 
