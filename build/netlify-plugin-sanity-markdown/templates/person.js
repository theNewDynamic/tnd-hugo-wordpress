module.exports = (data) => {
  const base = require('./base.js')(data)

  let frontmatter = {
    ...require('./base.js')(data)
  }

  if(data.image){
    frontmatter['image'] = data.image
  }

return frontmatter
}