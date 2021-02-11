module.exports = (data) => {

  const frontmatter = {
    ...require('./base.js')(data),
    slug: data.slug,
    authors:data.tax_profile,
    work_types: data.tax_work_type,
    excerpt: data.custom_excerpt ? data.custom_excerpt : ''
  }

  return frontmatter;

}