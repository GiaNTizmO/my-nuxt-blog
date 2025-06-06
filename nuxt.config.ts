import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/content',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    'shadcn-nuxt',
    '@nuxtjs/i18n',
  ],
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', name: 'English', files: ['en.json'] },
      { code: 'ru', language: 'ru-RU', name: 'Русский', files: ['ru.json'] }
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    langDir: 'locales',
    restructureDir: '',
  },
  colorMode: {
    classSuffix: ''
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },
})