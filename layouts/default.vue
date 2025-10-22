<template>
  <div>
    <!-- Header -->
    <header class="absolute top-0 left-0 right-0 z-50">
      <div class="container mx-auto flex justify-between items-center py-4 px-6">
        <nuxt-link to="/" class="text-xl font-bold text-white">Gamania</nuxt-link>
        <nav class="space-x-4">
          <nuxt-link to="/posts" class="text-white/90 hover:text-white transition-colors">Посты</nuxt-link>
          <nuxt-link to="/contact" class="text-white/90 hover:text-white transition-colors">Контакты</nuxt-link>
          <!--<input type="text" placeholder="Поиск" class="border border-white/30 rounded px-2 py-1 bg-white/10 text-white placeholder-white/70 focus:bg-white/20 focus:border-white/50 transition-all" />-->
        </nav>
      </div>
    </header>
    
    <main class="p-6 pt-0">
      <slot />
    </main>
    
    <footer class="border-t py-4 text-center">
      © 2025 Gamania.Me - Все права принадлежат правообладателям
    </footer>
  </div>
</template>
