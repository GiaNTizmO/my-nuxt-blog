<script setup lang="ts">
import { useAsyncData, useRoute } from '#app'
import type { ContentDocument } from '@nuxt/content'

// Получаем текущую локаль из i18n
const route = useRoute()
const locale = route.params.locale || 'en'
// Если вы выбрали стратегию prefix_except_default, то 
// для defaultLocale (en) params.locale может быть undefined.
// Тогда нас устроит «en» как дефолт.

const { data: posts } = await useAsyncData<ContentDocument[]>(`posts-${locale}`, () =>
  queryContent(`${locale}/posts`)
    .sort({ pubDate: -1 })
    .find()
)
</script>

<template>
  <div class="container mx-auto py-8">
    <h1 class="text-3xl font-bold mb-6">
      {{ $t('posts') }} <!-- этот ключ из vueI18n.messages -->
    </h1>
    <ul class="space-y-4">
      <li v-for="post in posts" :key="post._path">
        <NuxtLink :to="`/${locale}/posts/${post.slug}`" class="text-blue-600 hover:underline">
          {{ post.title }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
