<script setup lang="ts">
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '~/components/ui/dropdown-menu'
import { queryCollection } from '#imports'

const route = useRoute()
const switchLocalePath = useSwitchLocalePath()
const { locale, defaultLocale } = useI18n()
const currentIcon = computed(() => (locale.value === 'en' ? 'twemoji:flag-united-kingdom' : 'twemoji:flag-russia'))

const isPostRoute = computed(() => /^(\/en)?\/posts\//.test(route.path))

async function resolveAltPath(target: 'ru' | 'en') {
  // For posts, attempt to map by tKey
  if (isPostRoute.value) {
    const current = await queryCollection('content').path(route.path).first() as any
    // If current path doesn't exist (e.g., wrong slug in locale), try fallback RU
    let baseDoc = current
    if (!baseDoc && (route.params as any)?.slug) {
      const fallback = await queryCollection('content').path(`/posts/${(route.params as any).slug}`).first() as any
      baseDoc = fallback
    }
    const tKey = baseDoc?.meta?.tKey
    if (tKey) {
      const prefix = target === (defaultLocale as 'ru' | 'en') ? '' : `/${target}`
      const candidates = await queryCollection('content')
        .where('path', 'LIKE', `${prefix}/posts/%`).all() as any[]
      const alt = candidates.find(d => d?.meta?.tKey === tKey)
      if (alt?.path) return alt.path
    }
  }
  // Fallback to standard switcher
  return switchLocalePath(target)
}

async function changeLocale(target: 'ru' | 'en') {
  const path = await resolveAltPath(target)
  if (path) await navigateTo(path)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" class="border-white/20 text-white/90 hover:text-white hover:border-white/40 flex items-center gap-2">
        <Icon :name="currentIcon" class="h-4 w-4" />
        <span>{{ locale.toUpperCase() }}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-24">
      <DropdownMenuItem @click="changeLocale('ru')">
        <div class="flex items-center gap-2">
          <Icon name="twemoji:flag-russia" class="h-4 w-4" />
          <span>RU — {{ $t('lang.ru') }}</span>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem @click="changeLocale('en')">
        <div class="flex items-center gap-2">
          <Icon name="twemoji:flag-united-kingdom" class="h-4 w-4" />
          <span>EN — {{ $t('lang.en') }}</span>
        </div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
