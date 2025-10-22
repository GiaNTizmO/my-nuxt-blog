<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { queryCollection } from '#imports'

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
  () => queryCollection('content').where('path', 'LIKE', '/posts/%').all() as any
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
        <h1 class="text-4xl md:text-6xl font-bold mb-4">Gamania.Me</h1>
        <p class="text-lg md:text-xl mb-8 opacity-90">Блог о всём, что тебе нужно</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
           <Button as="a" href="#recent-posts" variant="default" class="bg-white text-black hover:bg-gray-100">Последние посты</Button>
          <Button as="a" href="/posts" variant="outline" class="border-white text-white hover:bg-white hover:text-black">Все посты</Button>
          <Button as="a" href="/contact" variant="outline" class="border-white text-white hover:bg-white hover:text-black">Контакты</Button>
        </div>
      </div>
    </section>

    <!-- Core Features Section -->
    <section class="container mx-auto py-20">
      <h2 class="text-3xl font-semibold mb-6">Core features</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div>
          <h3 class="text-xl font-bold mb-2">Admin Dashboard</h3>
          <p>Manage this site's pages and posts from the admin dashboard.</p>
        </div>
        <div>
          <h3 class="text-xl font-bold mb-2">Preview</h3>
          <p>Using versions, drafts, and preview, editors can review and share their changes before publishing them.</p>
        </div>
        <div>
          <h3 class="text-xl font-bold mb-2">Page Builder</h3>
          <p>Custom page builder allows you to create unique page, post, and project layouts for any type of content.</p>
        </div>
        <div>
          <h3 class="text-xl font-bold mb-2">SEO</h3>
          <p>Editors have complete control over SEO data and site content directly from the admin dashboard.</p>
        </div>
        <div>
          <h3 class="text-xl font-bold mb-2">Dark Mode</h3>
          <p>Users will experience this site in their preferred color scheme and each block can be inverted.</p>
        </div>
      </div>
    </section>

    <!-- Recent Posts Section -->
    <section id="recent-posts" class="py-20">
      <div class="container mx-auto">
        <h2 class="text-3xl font-semibold mb-6">Последние посты</h2>
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
      <h2 class="text-3xl font-semibold mb-4">Ищешь остальные посты?</h2>
      <p class="mb-6">Переходи на страницу с постами и найди то, что тебе нужно.</p>
      <Button as="a" href="/posts" variant="default">Все посты</Button>
    </section>
  </main>
</template>
