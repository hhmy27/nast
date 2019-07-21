'use strict'
const Prism = require('prismjs')
const loadLanguages = require('prismjs/components/')

const colorMap = require('./color-map')
const codeLangMap = require('./code-language-map')
const { convertNotionURLToLocalLink } = require('./notion-utils')
const { raiseWarning } = require('./log-utils')

const blockClass = 'block'

module.exports = {
  renderChildren,
  renderBlock,
  renderTitle,
  getBlockColor
}

/**
 * Render children nodes.
 * @param {*} nodeArray - Children nodes to render.
 * @param {*} renderNext - Render controller that will assign a node to 
 * a corresponding render function when iterating through nodeArray.
 * @returns {String} HTML.
 */
function renderChildren(nodeArray, renderNext) {
  let childrenHTMLArr = nodeArray.map(node => {
    /** PseudoBlock does not have id! */
    let html = `\
<div id="${node.id ? node.id : ''}">
  ${renderNext(node)}
</div>`
    return html
  })
  return childrenHTMLArr.join('')
}

/**
 * Render a block.
 * @param {Block} node 
 * @param {String} contentHTML
 * @param {String} defaultColor
 * @returns {String} 
 */
function renderBlock(node, contentHTML, defaultColor, tag = 'div') {
  let blockColor = getBlockColor(node, defaultColor)
  let html = `\
<${tag} class="${blockClass} ${blockClass}--${node.type} ${blockColor}">
  ${contentHTML}
</${tag}>`
  return html
}

/**
 * Render styled strings.
 * @param {StyledString[]} titleTokens
 * @returns {String} HTML
 */
function renderTitle(titleTokens, isCode = false, lang) {
  let textArr = titleTokens.map(token => {
    let codeLang = codeLangMap[lang]
    let text = token[0]
    if (isCode) {
      text = renderCode(text, codeLang)
    } else {
      text = escapeString(text)
    }
    let textStyles = token[1]
    let html = text
    if (textStyles) {
      html = styleToHTML(text, textStyles)
    }
    return html
  })

  let html = `\
<span>${textArr.join('')}</span>`
  return html
}

function renderCode(str, lang) {
  loadLanguages([lang])
  return Prism.highlight(str, Prism.languages[lang], lang)
}

/**
 * Render a styled string.
 * @param {String} text 
 * @param {TextStyle[]} styles 
 * @returns {String} HTML
 */
function styleToHTML(text, styles) {
  let html = text

  for (let i = styles.length - 1; i >= 0; --i) {
    switch (styles[i][0]) {
      /* Bold */
      case 'b':
        html = `<strong>${html}</strong>`
        break
      /* Italic */
      case 'i':
        html = `<em>${html}</em>`
        break
      /* Strike */
      case 's':
        html = `<del>${html}</del>`
        break
      /* Link */
      case 'a':
        html = `<a href="${convertNotionURLToLocalLink(styles[i][1])}">${html}</a>`
        break
      /* Inline Code */
      case 'c':
        html = `<code>${html}</code>`
        break
      /* Color or Background Color */
      case 'h':
        html = `<span class="${renderColor(styles[i][1])}">${html}</span>`
        break
      /* Inline Mention User */
      case 'u':
        html = `<span class="color-mention">@user_id:${styles[i][1]}</span>`
        break
      /* Inline Mention Page */
      case 'p':
        html = `<span class="color-mention">@page_id:${styles[i][1]}</span>`
        break
      /* Inline Mention Date */
      case 'd':
        html = `<span class="color-mention">@${styles[i][1].start_date}</span>`
        break
      /* Comment */
      case 'm':
        html = `<span class="color-comment">${html}</span>`
        break
      default:
        raiseWarning(`Unsupported style: ${styles[i][0]}`)
    }
  }

  return html
}

/**
 * Get color string of a block.
 * @param {Block} node 
 * @param {String} defaultColor 
 * @returns {String} Color string of the block.
 */
function getBlockColor(node, defaultColor = '') {
  let blockColor

  if (node['raw_value'] && node['raw_value'].format) {
    blockColor = node['raw_value'].format['block_color']
      ? node['raw_value'].format['block_color'] : defaultColor
  } else {
    blockColor = defaultColor
  }

  return renderColor(blockColor)
}

/**
 * Map color string in NotionAST to another string that is intended to use
 * as a CSS class.
 * @param {String} str 
 * @returns {String}
 */
function renderColor(str) {
  const colorPrefix = 'color-'
  const colorBgPrefix = 'background-'
  switch (str) {
    case colorMap.gray:
      return colorPrefix + 'gray'
    case colorMap.brown:
      return colorPrefix + 'brown'
    case colorMap.orange:
      return colorPrefix + 'orange'
    case colorMap.yellow:
      return colorPrefix + 'yellow'
    case colorMap.green:
      return colorPrefix + 'green'
    case colorMap.blue:
      return colorPrefix + 'blue'
    case colorMap.purple:
      return colorPrefix + 'purple'
    case colorMap.pink:
      return colorPrefix + 'pink'
    case colorMap.red:
      return colorPrefix + 'red'
    case colorMap.grayBg:
      return colorBgPrefix + 'gray'
    case colorMap.brownBg:
      return colorBgPrefix + 'brown'
    case colorMap.orangeBg:
      return colorBgPrefix + 'orange'
    case colorMap.yellowBg:
      return colorBgPrefix + 'yellow'
    case colorMap.greenBg:
      return colorBgPrefix + 'green'
    case colorMap.blueBg:
      return colorBgPrefix + 'blue'
    case colorMap.purpleBg:
      return colorBgPrefix + 'purple'
    case colorMap.pinkBg:
      return colorBgPrefix + 'pink'
    case colorMap.redBg:
      return colorBgPrefix + 'red'
    default:
      return str
  }
}

/**
 * Escape special characters in a string.
 * @param {String} str 
 * @returns {String}
 */
function escapeString(str) {
  let character, escapedString = ''

  for (let i = 0; i < str.length; ++i) {
    character = str.charAt(i)
    switch (character) {
      case '<':
        escapedString += '&lt;'
        break
      case '>':
        escapedString += '&gt;'
        break
      case '&':
        escapedString += '&amp;'
        break
      case '/':
        escapedString += '&#x2F;'
        break
      case '"':
        escapedString += '&quot;'
        break
      case '\'':
        escapedString += '&#x27;'
        break
      default:
        escapedString += character
    }
  }

  return escapedString
}