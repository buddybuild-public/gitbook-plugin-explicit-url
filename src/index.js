const url = require('url')
const path = require('path')
const fs = require('fs')
const cheerio = require('cheerio')

let updatedPages = []

const getTargetHtmlPath = (mdPath) => {
  const mdInfo = path.parse(mdPath)
  let targetFile = mdInfo.base.replace('.md', '.html')
  if (mdInfo.base === 'README.md') {
    targetFile = 'index.html'
  }
  const relpath = path.join('./', '_book', mdInfo.dir, targetFile)
  return path.resolve(relpath)
}


const useExplicitUrl = (filename) => {
  const data = fs.readFileSync(filename, 'UTF-8')
  const $ = cheerio.load(data)
  $('a').each((idx, element) => {
    const href = element.attribs.href
    if (href === undefined) return

    const link = url.parse(href)
    if (link.pathname === null) {
      link.pathname = ''
    }
    const basename = link.pathname.split('/').pop()

    if (link.protocol) {
      // this is a external link
    } else if (link.pathname === '' && link.hash !== '') {
      // this is anchor
    } else if (link.pathname.endsWith('/')) {
      link.pathname += 'index.html'
    } else if (!basename.includes('.')) {
      link.pathname += '/index.html'
    }
    element.attribs.href = url.format(link)
  })
  fs.writeFileSync(filename, $.html({decodeEntities: false}), 'UTF-8')
}

module.exports = {
  book: {},
  hooks: {
    page: (page) => {
      updatedPages.push(page.path)
      return page
    },
    finish: () => {
      for (let page of updatedPages) {
        const filePath = getTargetHtmlPath(page)
        useExplicitUrl(filePath)
      }
      updatedPages = []
    }
  }
}
