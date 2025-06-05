<template>
  <div>
    <!-- Header -->
  <header class="bg-white shadow">
    <div class="container mx-auto flex justify-between items-center py-4 px-6">
      <nuxt-link to="/" class="text-xl font-bold">Logo</nuxt-link>
      <nav class="space-x-4">
        <nuxt-link to="/posts" class="text-gray-600 hover:text-gray-900">Posts</nuxt-link>
        <nuxt-link to="/contact" class="text-gray-600 hover:text-gray-900">Contact</nuxt-link>
        <input type="text" placeholder="Search" class="border rounded px-2 py-1" />
      </nav>
    </div>
  </header>
    <main class="p-6">
      <slot />
    </main>
    <footer class="bg-gray-100 py-4 text-center">
      © 2025 Мой Блог
    </footer>
  </div>
</template>
