import { defineContentConfig, defineCollection } from '@nuxt/content'

// export default defineContentConfig({
//   collections: {
//     content: defineCollection({
//       type: 'page',
//       source: '**/*.md'
//     })
//   }
// })
// content.config.ts


export default defineContentConfig({
  collections: {
    en: defineCollection({type: 'page', source: 'en/posts/*.md',   /* …schema… */ }),
    ru: defineCollection({type: 'page', source: 'ru/posts/*.md',   /* …schema… */ })
  }
})
