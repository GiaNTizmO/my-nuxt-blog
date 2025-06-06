<template>
  <!-- Оборачиваем всё в один контейнер -->
  <div class="">
    <!-- Header становится фиксированным и прозрачным -->
    <header class="absolute top-0 left-0 w-full h-16 z-20">
      <div
        class="container mx-auto h-full flex items-center justify-between px-6"
      >
        <nuxt-link to="/" class="text-xl font-bold">Logo</nuxt-link>
        <nav class="space-x-4">
          <nuxt-link
            to="/posts"
            >Posts</nuxt-link
          >
          <nuxt-link
            to="/contact"
            >Contact</nuxt-link
          >
        </nav>
      </div>
    </header>

    <!-- Main: с отступом сверху, равным высоте Header (h-16 = 4rem = 64px) -->
    <main>
      <slot />
    </main>

    <!-- Footer остаётся внизу без изменений -->
    <footer class="border-t py-6 text-center">
      <div class="container mx-auto">
        <nuxt-link to="/" class="text-xl font-bold">Logo</nuxt-link>
        <p class="mt-2">© 2025 Мой Блог</p>
      </div>
    </footer>
  </div>
</template>
