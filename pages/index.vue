<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { queryCollection } from '#imports'
const route = useRoute()
const prefix = computed(() => route.path.startsWith('/en') ? '/en' : '')

// Тип поста для Nuxt Content 3.5
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

// Получаем посты из коллекции content и фильтруем только /posts/*
const { data: allPosts } = await useAsyncData<Post[]>(
  'posts',
  () => queryCollection('content').where('path', 'LIKE', `${prefix.value || ''}/posts/%`).all() as any,
  { watch: [prefix] }
)

// Берём последние 3 поста по дате (meta.pubDate || pubDate)
const posts = computed(() => {
  const list = (allPosts.value as unknown as Post[]) || []
  const byDateDesc = [...list].sort((a: any, b: any) => {
    const da = new Date(a?.meta?.pubDate || a?.pubDate || 0).getTime()
    const db = new Date(b?.meta?.pubDate || b?.pubDate || 0).getTime()
    return db - da
  })
  return byDateDesc.slice(0, 3)
})
</script>

<template>
  <!-- Main Content -->
  <main>
    <!-- Hero Section -->
    <section class="relative text-center py-20 min-h-screen flex items-center justify-center overflow-hidden">
      <!-- Background Image with Gradient Overlay -->
      <div class="absolute inset-0 z-0">
        <img 
          src="/images/image-hero1.webp" 
          alt="Hero Background" 
          class="w-full h-full object-cover"
        />
        <!-- Gradient overlay for smooth edges -->
        <div class="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-background/100"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/70"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent via-transparent to-transparent"></div>
        <!-- Additional bottom fade for ultra-smooth transition -->
        <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 text-white max-w-4xl mx-auto px-4 pt-20">
        <h1 class="text-4xl md:text-6xl font-bold mb-4">{{ $t('hero.title') }}</h1>
        <p class="text-lg md:text-xl mb-8 opacity-90">{{ $t('hero.subtitle') }}</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
           <Button as="a" href="#recent-posts" variant="default" class="bg-white text-black hover:bg-gray-100">{{ $t('hero.buttons.recent') }}</Button>
          <Button as="a" href="/posts" variant="outline" class="border-white text-white hover:bg-white hover:text-black">{{ $t('hero.buttons.allPosts') }}</Button>
          <Button as="a" href="/contact" variant="outline" class="border-white text-white hover:bg-white hover:text-black">{{ $t('hero.buttons.contact') }}</Button>
        </div>
      </div>
    </section>

    <!-- Core Features Section -->
    <section class="container mx-auto py-20">
      <h2 class="text-3xl font-semibold mb-6">{{ $t('features.title') }}</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div>
          <h3 class="text-xl font-bold mb-2">{{ $t('features.admin.title') }}</h3>
          <p>{{ $t('features.admin.text') }}</p>
        </div>
        <div>
          <h3 class="text-xl font-bold mb-2">{{ $t('features.preview.title') }}</h3>
          <p>{{ $t('features.preview.text') }}</p>
        </div>
        <div>
          <h3 class="text-xl font-bold mb-2">{{ $t('features.builder.title') }}</h3>
          <p>{{ $t('features.builder.text') }}</p>
        </div>
        <div>
          <h3 class="text-xl font-bold mb-2">{{ $t('features.seo.title') }}</h3>
          <p>{{ $t('features.seo.text') }}</p>
        </div>
        <div>
          <h3 class="text-xl font-bold mb-2">{{ $t('features.dark.title') }}</h3>
          <p>{{ $t('features.dark.text') }}</p>
        </div>
      </div>
    </section>

    <!-- Recent Posts Section -->
    <section id="recent-posts" class="py-20">
      <div class="container mx-auto">
        <h2 class="text-3xl font-semibold mb-6">{{ $t('recentPosts.title') }}</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div 
            v-for="post in (posts as Post[])" 
            :key="post._path || post.path" 
            class="h-96"
          >
            <PostCard :post="post as any" />
          </div>
        </div>
      </div>
    </section>

    <!-- Call to Action Section -->
    <section class="text-center py-20">
      <h2 class="text-3xl font-semibold mb-4">{{ $t('cta.title') }}</h2>
      <Button as="a" href="/posts" variant="default">{{ $t('cta.button') }}</Button>
    </section>
  </main>
</template>
