# gamania.me

Статический двуязычный блог (английский по умолчанию, русский — переключателем EN/RU): Markdown, рубрики, поиск по полному тексту, Three.js, светлая и тёмная темы, оглавление, подсветка и копирование кода, RSS.

## Локальная сборка

Требуется Node.js 22+.

```bash
npm ci
npm run check
npm run build
```

Раздайте `dist/` любым статическим HTTP-сервером. Не открывайте HTML через `file://`: загрузка `content.json` требует HTTP.

## Как написать статью

Добавьте файл `content/posts/en/my-first-post.md` (английская версия) и, при желании, `content/posts/ru/my-first-post.md` с тем же именем — это переводы одной статьи. Если перевода нет, статья показывается на другом языке с пометкой.

```markdown
---
title: Заголовок статьи
date: '2026-11-15'
description: Короткое описание для главной и RSS.
category: code
tags: [JavaScript, архитектура]
featured: false
draft: false
art: code
---

## Первый раздел

Текст статьи в Markdown.
```

Рубрики задаются ключами: `code`, `reverse`, `tools`, `life` (названия на обоих языках — в `src/i18n.js`). Все тексты интерфейса тоже в `src/i18n.js`. RSS: `feed.xml` (EN) и `feed.ru.xml` (RU). Ссылки вида `#/en/post/slug` и `#/ru/post/slug`. Варианты миниатюры `art`: `code`, `reverse`, `terminal`, `system`, `life`. `featured: true` выделяет статью на главной; при нескольких выбирается самая свежая. `draft: true` исключает материал из публикации, поиска, скачиваемых Markdown-файлов и RSS. Даты в кавычках, slug берётся из имени файла и должен состоять из строчных латинских букв, цифр и одиночных дефисов.

Удалите демонстрационные файлы или замените их своим контентом. Флаг `demo: true` обозначает пример в интерфейсе.

## GitHub Pages

1. Поместите проект в GitHub-репозиторий с основной веткой `main`.
2. В **Settings → Pages → Build and deployment → Source** выберите **GitHub Actions**.
3. Выполните push или запустите **Actions → Publish blog to GitHub Pages → Run workflow**.

Workflow `.github/workflows/pages.yml` загружает Markdown из checkout репозитория, собирает `dist/` и публикует в Pages. После каждого push контент обновляется. Это сборка из GitHub, без токенов и GitHub API в браузере. Работают и `username.github.io`, и `username.github.io/repository/`: ресурсы используют относительные пути, навигация — hash-маршруты.

Адрес GitHub и базовый URL RSS автоматически берутся из GitHub Actions. Для другой среды задайте `repository`, `branch`, `url` в `site.config.json` или переменную `SITE_URL` при сборке. Файл `.openai/hosting.json` нужен только для зеркала в Sites.

Текущий интерфейс — клиентское приложение с hash-маршрутами: ссылки на статьи открываются напрямую и не требуют серверного fallback. Отдельные Open Graph и SEO-страницы на каждую статью не генерируются. RSS содержит заголовки, описания и ссылки. Для внешних читателей RSS используйте публичный GitHub Pages URL; закрытое зеркало Sites требует авторизации.

## Приватность и доступность

Нет аналитики, cookies и серверной базы данных. Язык задаётся ссылкой. Главная и ссылки без указания языка открываются на английском. Three.js и DOMPurify включены в сборку и не загружаются с CDN. Шрифты Golos Text и IBM Plex Mono загружаются с Google Fonts; при недоступности используются системные шрифты. Markdown при отображении очищается DOMPurify. Текстовые поля экранируются. Анимация учитывает `prefers-reduced-motion`, имеет кнопку паузы и SVG-запасной вариант при отсутствии WebGL. Поиск: `Ctrl+K` / `⌘K`, закрытие: Escape.

## Документация публикации

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Структура

- `src/` — интерфейс и 3D-сцена.
- `content/posts/` — исходники статей.
- `scripts/build.mjs` — валидация, Markdown → HTML/JSON, подсветка кода, RSS.
- `site.config.json` — имя, описание, репозиторий и базовый URL.
- `.github/workflows/pages.yml` — автоматическая публикация.
- `dist/` — результат сборки; не коммитится.

Зависимости зафиксированы в package-lock.json. Лицензии клиентских библиотек копируются в dist/vendor/.
