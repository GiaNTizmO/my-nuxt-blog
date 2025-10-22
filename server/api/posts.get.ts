import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export default defineEventHandler(async (event) => {
  try {
    const postsDir = path.join(process.cwd(), 'content', 'posts')
    
    // Проверяем, существует ли папка
    if (!fs.existsSync(postsDir)) {
      return { error: 'Posts directory not found', posts: [] }
    }
    
    const files = fs.readdirSync(postsDir)
    const posts = []
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(postsDir, file)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const { data, content } = matter(fileContent)
        
        posts.push({
          _path: `/posts/${data.slug || file.replace('.md', '')}`,
          title: data.title,
          description: data.description,
          pubDate: data.pubDate,
          slug: data.slug || file.replace('.md', ''),
          content: content,
          bgimg: data.bgimg || null,
          video: data.video || null,
          media: data.media || null
        })
      }
    }
    
    // Сортируем по дате
    posts.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    
    return { posts }
  } catch (error: any) {
    return { error: error.message, posts: [] }
  }
})
