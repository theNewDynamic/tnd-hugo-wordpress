const dedent = require( 'dedent')
module.exports = (content) => {

const md = `
  ---
  title: "${content.title}"
  remote_id: ${content.remote_id}
  slug: "${content.slug.current}"
  remote_service: sanity
  ${content.image ? `image: ${content.image}` : ''}
  ---
  \n
`
  return dedent(md);
}