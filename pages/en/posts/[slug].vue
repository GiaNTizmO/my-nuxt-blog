<script setup lang="ts">
import { useAsyncData, useRoute } from '#app'
import type { EnCollectionItem, RuCollectionItem } from '@nuxt/content'

// Получаем params: { slug, locale? }
const route = useRoute()
const { locale } = useI18n()
const slug = route.params.slug as string

console.log('Current locale:', locale.value)
console.log('Looking for slug:', slug)

// Сначала получим все документы для проверки
const { data: allPosts } = await useAsyncData(() => queryCollection(locale.value).all())
console.log('All posts in collection:', allPosts.value)
var post: EnCollectionItem | RuCollectionItem | null = null;
for (const _post of allPosts.value!) {
  console.log('DS', _post.meta.slug)
  if (_post.meta.slug == slug) {
    post = _post;
  }
}

// const { data: post } = await useAsyncData(() => queryCollection(locale.value).where('meta.slug', 'LIKE', slug).first())
// console.log('Query result:', post.value)
</script>

<template>
  <article v-if="post" class="prose mx-auto py-8">
    <h1 class="text-3xl font-bold mb-4">{{ post.title }}</h1>
    <div v-html="post.description" />
    <ContentRenderer :value="post" />
  </article>
  <div v-else class="text-center py-8">
    {{ $t('post_not_found') }}
  </div>
</template>
