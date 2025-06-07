<script setup lang="ts">
import { useAsyncData, useRoute } from '#app'

// Получаем params: { slug, locale? }
const route = useRoute()
const { locale } = useI18n()
const slug = route.params.slug as string

// const { data: post } = await useAsyncData<ContentDocument>(
//   `post-${locale}-${slug}`,
//   () =>
//     queryCollection(`${locale}`, {
//       where: { slug }
//     }).findOne()
// )
console.log(slug)
const { data: post } = await useAsyncData(() => queryCollection(locale.value).where('meta.slug', 'LIKE', 'slug').first())

console.log(post.value!)
</script>

<template>
  <article v-if="post" class="prose mx-auto py-8">
    <h1 class="text-3xl font-bold mb-4">{{ post.title }}</h1>
    <div v-html="post.body" />
  </article>
  <div v-else class="text-center py-8">
    {{ $t('post_not_found') }}
  </div>
</template>
