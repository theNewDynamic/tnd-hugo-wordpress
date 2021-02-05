const dedent = require( 'dedent')
module.exports = (content) => {

const md = `
  ---
  title: "${content.title}"
  remote_id: ${content.remote_id}
  slug: "${content.slug.current}"
  remote_service: sanity
  description: ${content.description}
  poster: ${content.poster}
  cast: ${content.cast.map(
    (char) => `\n- {character: ${char.character}, person: ${char.person}}`
  ).join('')}
  ---
  \n
`
  return dedent(md);
}