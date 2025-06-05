<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'
import type { ContentDocument } from '@nuxt/content'

const route = useRoute()
const slug = route.params.slug as string

const { data: post } = await useAsyncData<ContentDocument>('post', () =>
  queryContent('posts', { where: { slug } }).findOne()
)
</script>

<template>
  <article class="prose mx-auto py-8">
    <h1 class="text-3xl font-bold mb-4">{{ post?.title }}</h1>
    <div v-html="post?.body" />
  </article>
</template>