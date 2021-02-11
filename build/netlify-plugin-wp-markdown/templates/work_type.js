module.exports = (data) => {

  const frontmatter = {
    ...require('./base.js')(data),
    slug: data.slug,
    excerpt: data.custom_excerpt ? data.custom_excerpt : ''
  }

  return frontmatter;

}