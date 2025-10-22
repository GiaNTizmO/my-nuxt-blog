<script setup lang="ts">
import { queryCollection } from '#imports'

const route = useRoute()
const slug = String(route.params.slug)
const prefix = computed(() => route.path.startsWith('/en') ? '/en' : '')

type PostDoc = {
  path: string
  title?: string
  description?: string
  pubDate?: string
  slug?: string
  body?: any
  meta?: Record<string, any>
  video?: string | null
  bgimg?: string | null
  media?: string | null
}

const currentPath = computed(() => `${prefix.value}/posts/${slug}`)

const { data: post } = await useAsyncData<PostDoc | null>(
  `post-${slug}`,
  async () => {
    let doc = await queryCollection('content').path(currentPath.value).first() as any
    if (!doc && prefix.value) {
      // Try RU fallback by slug
      const fallback = await queryCollection('content').path(`/posts/${slug}`).first() as any
      if (fallback?.meta?.tKey) {
        // Try to find proper localized doc by shared translation key
        const candidates = await queryCollection('content').where('path', 'LIKE', `${prefix.value}/posts/%`).all() as any[]
        const alt = candidates.find(d => d?.meta?.tKey === fallback.meta.tKey)
        if (alt) {
          if (import.meta.client && alt.path !== route.path) await navigateTo(alt.path)
          return alt
        }
      }
      return fallback
    }
    return doc
  },
  { watch: [prefix] }
)

const { data: allPosts } = await useAsyncData<PostDoc[]>(
  'all-posts',
  () => queryCollection('content').where('path', 'LIKE', `${prefix.value || ''}/posts/%`).all() as any,
  { watch: [prefix] }
)

const mediaType = computed(() => {
  const p = post.value as any
  const video = p?.video ?? p?.meta?.video
  const bgimg = p?.bgimg ?? p?.meta?.bgimg
  const media = p?.media ?? p?.meta?.media
  if (video) return 'video'
  if (bgimg) return 'image'
  if (media) {
    const ext = String(media).split('.').pop()?.toLowerCase()
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext || '')) return 'video'
    return 'image'
  }
  return null
})

const mediaSrc = computed(() => {
  const p = post.value as any
  return p?.video ?? p?.bgimg ?? p?.media ?? p?.meta?.video ?? p?.meta?.bgimg ?? p?.meta?.media ?? null
})

const localeTag = computed(() => (prefix.value === '/en' ? 'en-US' : 'ru-RU'))
const publishedDate = computed(() => {
  const p = post.value as any
  const d = p?.pubDate ?? p?.meta?.pubDate
  return d ? new Date(d as string).toLocaleDateString(localeTag.value) : ''
})

const randomPosts = computed(() => {
  const posts = (allPosts.value as unknown as PostDoc[]) || []
  const filtered = posts.filter(p => p.path !== currentPath.value)
  return filtered.sort(() => 0.5 - Math.random()).slice(0, 2)
})

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found: ' + slug })
}
</script>

<template>
  <div>
    <section class="relative text-center py-20 min-h-screen flex items-center justify-center overflow-hidden">
      <div v-if="mediaType && mediaSrc" class="absolute inset-0 z-0">
        <video
          v-if="mediaType === 'video'"
          :src="`/images/${mediaSrc}`"
          :alt="(post as PostDoc)?.title"
          class="w-full h-full object-cover"
          autoplay
          muted
          loop
          playsinline
        />
        <img
          v-else-if="mediaType === 'image'"
          :src="`/images/${mediaSrc}`"
          :alt="(post as PostDoc)?.title"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-background/100"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/70"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
      </div>

      <div class="relative z-10 text-white max-w-4xl mx-auto px-4 pt-20">
        <h1 class="text-4xl md:text-6xl font-bold mb-6">{{ (post as PostDoc)?.title }}</h1>
        <div class="text-white/80 mb-6">
          <p class="text-lg">{{ $t('post.author') }}: Gamania</p>
          <p class="text-lg">{{ $t('post.published') }}: {{ publishedDate }}</p>
        </div>
        <div class="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
          {{ (post as PostDoc)?.description }}
        </div>
      </div>
    </section>

    <section class="py-20">
      <div class="container mx-auto px-4">
        <article class="prose prose-lg mx-auto max-w-4xl">
          <ContentRenderer v-if="post" :value="post as any" :prose="false" />
        </article>
      </div>
    </section>

    <section v-if="randomPosts.length > 0" class="py-20">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-semibold mb-8 text-center">{{ $t('post.related') }}</h2>
        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div
            v-for="relatedPost in randomPosts"
            :key="relatedPost.path"
            class="h-80"
          >
            <PostCard :post="relatedPost as any" />
          </div>
        </div>
      </div>
    </section>
  </div>
  
</template>
