<script setup lang="ts">
import { useAsyncData } from '#app'

import { useI18n } from '#imports'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'

const { locale } = useI18n()
console.log(`User locale: ${locale.value}`);

const postr = ref(await useAsyncData(async () => queryCollection(locale.value).all()));

console.log(postr.value.data);
</script>

<template>
  <!-- Main Content -->
  <main>
    <!-- Hero Section (с фоновой картинкой) -->
    <section
      class="relative bg-[url('/images/image-hero1.webp')] bg-cover bg-center h-[80vh] flex items-center justify-center"
    >
      <!-- Если нужен затемняющий оверлей, раскомментируйте: -->
       <div class="absolute inset-0 bg-black/30"></div>

      <div class="relative text-center text-white px-4">
        <h1 class="text-5xl font-bold mb-4">Gamania test</h1>
        <p class="mb-6 text-lg">
          The code for this template is completely open-source and can be found on our Github.
        </p>
        <div class="space-x-4">
          <Button as="a" href="/admin" variant="default">Visit the admin dashboard</Button>
          <Button as="a" href="/posts" variant="outline">All posts</Button>
          <Button as="a" href="/contact" variant="outline">Contact</Button>
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
    <section class="text-center py-20">
      <div class="container mx-auto">
        <h2 class="text-3xl font-semibold mb-6">{{ $t('recent_posts') }}</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <Card v-for="post in postr.data" class="p-6">
            <h3 class="text-xl font-bold mb-2">
              <nuxt-link :to="`${post.path}`" class="hover:underline">
                {{ post.title }}
              </nuxt-link>
            </h3>
            <p class="text-gray-600 mb-4">{{ post.description }}</p>
            <Button as="a" :href="`${post.path}`" variant="link">{{ $t('read_more') }}</Button>
          </Card>
        </div>
      </div>
    </section>

    <!-- Call to Action Section -->
    <section class="text-center py-20">
      <h2 class="text-3xl font-semibold mb-4">This is a call to action</h2>
      <p class="mb-6">This is a custom layout building block configured in the admin dashboard.</p>
      <Button as="a" href="/posts" variant="default">All posts</Button>
    </section>
  </main>
</template>
