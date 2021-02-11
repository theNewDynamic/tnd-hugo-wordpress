module.exports = (data) => {
  const cast = data.cast.map(
    (char) => ({
      character: char.character,
      person: char.person
    })
  )

  const frontmatter = {
    ...require('./base.js')(data),
    description: data.description,
    poster: data.poster,
    cast
  }
  return frontmatter
}