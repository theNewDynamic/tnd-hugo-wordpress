const dedent = require( 'dedent')
module.exports = (content) => {

const md = `
  ---
  title: "${content.title}"
  remote_id: ${content.remote_id}
  remote_service: sanity
  start: ${content.beginAt}
  end: ${content.endAt}
  movie: ${content.movie}
  ---
  \n
`
  return dedent(md);
}