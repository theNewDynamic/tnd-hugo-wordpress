module.exports = (data) => {

  const frontmatter = {
    ...require('./base.js')(data),
    start: data.beginAt,
    end: data.endAt,
    movie: data.movie
  }

  return frontmatter;

}