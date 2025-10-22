import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')
    
    if (!slug) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Slug is required'
      })
    }
    
    const postsDir = path.join(process.cwd(), 'content', 'posts')
    
    // Проверяем, существует ли папка
    if (!fs.existsSync(postsDir)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Posts directory not found'
      })
    }
    
    const files = fs.readdirSync(postsDir)
    let foundPost = null
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(postsDir, file)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const { data, content } = matter(fileContent)
        
        const postSlug = data.slug || file.replace('.md', '')
        
        if (postSlug === slug) {
          foundPost = {
            _path: `/posts/${postSlug}`,
            title: data.title,
            description: data.description,
            pubDate: data.pubDate,
            slug: postSlug,
            content: content,
            bgimg: data.bgimg || null,
            video: data.video || null,
            media: data.media || null
          }
          break
        }
      }
    }
    
    if (!foundPost) {
      throw createError({
        statusCode: 404,
        statusMessage: `Post not found: ${slug}`
      })
    }
    
    return foundPost
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})
