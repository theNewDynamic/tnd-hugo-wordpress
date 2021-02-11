module.exports = (data) => {

  const frontmatter = {
    ...require('./base.js')(data),
    excerpt: data.excerpt ? data.excerpt.rendered : ''
  }

  return frontmatter;

}