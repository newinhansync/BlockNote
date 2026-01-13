import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import puppeteer from 'puppeteer'

// GET /api/export?courseId=xxx&format=json|html|markdown|pdf
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId')
    const format = searchParams.get('format') || 'json'

    if (!courseId) {
      return NextResponse.json({ error: 'courseId가 필요합니다.' }, { status: 400 })
    }

    // Fetch course with all content
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        curriculums: {
          orderBy: { order: 'asc' },
          include: {
            pages: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    switch (format) {
      case 'json':
        return NextResponse.json(course)

      case 'html':
        const html = generateHTML(course)
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(course.title)}.html"`
          }
        })

      case 'markdown':
        const markdown = generateMarkdown(course)
        return new NextResponse(markdown, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(course.title)}.md"`
          }
        })

      case 'pdf':
        const pdfHtml = generateHTML(course)
        const pdfBuffer = await generatePDF(pdfHtml)
        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(course.title)}.pdf"`
          }
        })

      default:
        return NextResponse.json({ error: '지원하지 않는 형식입니다. (json, html, markdown, pdf)' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: '내보내기 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// Generate HTML from course data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateHTML(course: any): string {
  let html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(course.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #1a1a1a; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
    h2 { color: #333; margin-top: 2rem; }
    h3 { color: #555; }
    .curriculum { margin: 2rem 0; padding: 1rem; background: #f9f9f9; border-radius: 8px; }
    .page { margin: 1rem 0; padding: 1rem; background: white; border: 1px solid #eee; border-radius: 4px; }
    .page-title { font-weight: bold; margin-bottom: 0.5rem; }
    ul, ol { padding-left: 1.5rem; }
    img { max-width: 100%; height: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 1rem 0; padding-left: 1rem; color: #666; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; font-family: monospace; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
  </style>
</head>
<body>
  <h1>${escapeHTML(course.title)}</h1>
  ${course.description ? `<p>${escapeHTML(course.description)}</p>` : ''}
`

  for (const curriculum of course.curriculums) {
    html += `
  <div class="curriculum">
    <h2>${escapeHTML(curriculum.title)}</h2>
`
    for (const page of curriculum.pages) {
      html += `
    <div class="page">
      <div class="page-title">${escapeHTML(page.title)}</div>
      <div class="page-content">
        ${blocksToHTML(page.content)}
      </div>
    </div>
`
    }
    html += `  </div>
`
  }

  html += `
</body>
</html>`

  return html
}

// Generate Markdown from course data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateMarkdown(course: any): string {
  let md = `# ${course.title}\n\n`

  if (course.description) {
    md += `${course.description}\n\n`
  }

  for (const curriculum of course.curriculums) {
    md += `## ${curriculum.title}\n\n`

    for (const page of curriculum.pages) {
      md += `### ${page.title}\n\n`
      md += blocksToMarkdown(page.content)
      md += '\n\n'
    }
  }

  return md
}

// Convert BlockNote blocks to HTML
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blocksToHTML(blocks: any[]): string {
  if (!Array.isArray(blocks)) return ''

  return blocks.map(block => blockToHTML(block)).join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blockToHTML(block: any): string {
  const content = inlineContentToHTML(block.content)

  switch (block.type) {
    case 'paragraph':
      return `<p>${content}</p>`

    case 'heading':
      const level = block.props?.level || 1
      return `<h${level}>${content}</h${level}>`

    case 'bulletListItem':
      return `<ul><li>${content}</li></ul>`

    case 'numberedListItem':
      return `<ol><li>${content}</li></ol>`

    case 'checkListItem':
      const checked = block.props?.checked ? 'checked' : ''
      return `<ul><li><input type="checkbox" ${checked} disabled> ${content}</li></ul>`

    case 'image':
      const src = block.props?.url || ''
      const alt = block.props?.caption || ''
      return `<figure><img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}"><figcaption>${escapeHTML(alt)}</figcaption></figure>`

    case 'table':
      return tableToHTML(block)

    case 'codeBlock':
      const lang = block.props?.language || ''
      return `<pre><code class="language-${escapeHTML(lang)}">${escapeHTML(content)}</code></pre>`

    default:
      return content ? `<p>${content}</p>` : ''
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inlineContentToHTML(content: any[]): string {
  if (!Array.isArray(content)) return ''

  return content.map(item => {
    if (item.type === 'text') {
      let text = escapeHTML(item.text || '')
      if (item.styles?.bold) text = `<strong>${text}</strong>`
      if (item.styles?.italic) text = `<em>${text}</em>`
      if (item.styles?.underline) text = `<u>${text}</u>`
      if (item.styles?.strikethrough) text = `<del>${text}</del>`
      if (item.styles?.code) text = `<code>${text}</code>`
      return text
    }
    if (item.type === 'link') {
      const href = item.href || '#'
      const linkContent = inlineContentToHTML(item.content)
      return `<a href="${escapeHTML(href)}">${linkContent}</a>`
    }
    return ''
  }).join('')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tableToHTML(block: any): string {
  const rows = block.content?.rows || []
  if (!rows.length) return ''

  let html = '<table border="1" cellpadding="8" cellspacing="0">'
  for (let i = 0; i < rows.length; i++) {
    html += '<tr>'
    for (const cell of rows[i].cells) {
      const tag = i === 0 ? 'th' : 'td'
      html += `<${tag}>${inlineContentToHTML(cell)}</${tag}>`
    }
    html += '</tr>'
  }
  html += '</table>'
  return html
}

// Convert BlockNote blocks to Markdown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blocksToMarkdown(blocks: any[]): string {
  if (!Array.isArray(blocks)) return ''

  return blocks.map(block => blockToMarkdown(block)).join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blockToMarkdown(block: any): string {
  const content = inlineContentToMarkdown(block.content)

  switch (block.type) {
    case 'paragraph':
      return content

    case 'heading':
      const level = block.props?.level || 1
      return '#'.repeat(level) + ' ' + content

    case 'bulletListItem':
      return `- ${content}`

    case 'numberedListItem':
      return `1. ${content}`

    case 'checkListItem':
      const checked = block.props?.checked ? 'x' : ' '
      return `- [${checked}] ${content}`

    case 'image':
      const src = block.props?.url || ''
      const alt = block.props?.caption || ''
      return `![${alt}](${src})`

    case 'codeBlock':
      const lang = block.props?.language || ''
      return '```' + lang + '\n' + content + '\n```'

    default:
      return content
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inlineContentToMarkdown(content: any[]): string {
  if (!Array.isArray(content)) return ''

  return content.map(item => {
    if (item.type === 'text') {
      let text = item.text || ''
      if (item.styles?.bold) text = `**${text}**`
      if (item.styles?.italic) text = `*${text}*`
      if (item.styles?.strikethrough) text = `~~${text}~~`
      if (item.styles?.code) text = `\`${text}\``
      return text
    }
    if (item.type === 'link') {
      const href = item.href || '#'
      const linkContent = inlineContentToMarkdown(item.content)
      return `[${linkContent}](${href})`
    }
    return ''
  }).join('')
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Generate PDF from HTML using Puppeteer
async function generatePDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}
