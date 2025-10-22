<script setup lang="ts">
// Language switcher moved to a Shadcn dropdown component
</script>

<template>
  <div>
    <!-- Header -->
    <header class="absolute top-0 left-0 right-0 z-50">
      <div class="container mx-auto flex justify-between items-center py-4 px-6">
        <nuxt-link to="/" class="text-xl font-bold text-white">Gamania</nuxt-link>
        <nav class="flex items-center gap-4">
          <nuxt-link to="/posts" class="text-white/90 hover:text-white transition-colors">{{ $t('nav.posts') }}</nuxt-link>
          <nuxt-link to="/contact" class="text-white/90 hover:text-white transition-colors">{{ $t('nav.contact') }}</nuxt-link>
          
          <!-- Language Switcher (Shadcn) -->
          <div class="ml-4">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
    
    <main class="p-6 pt-0">
      <slot />
    </main>
    
    <footer class="border-t py-4 text-center">
      {{ $t('footer.copyright') }}
    </footer>
  </div>
</template>
