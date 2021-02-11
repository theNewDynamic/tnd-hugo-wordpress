module.exports = (data) => {

  const frontmatter = {
    ...require('./base.js')(data),
    slug: data.slug,
    description: data.description
  }

  return frontmatter;

}