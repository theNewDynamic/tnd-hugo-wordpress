const query = `
*[_type in ["movie", "person"]]{
  _type == 'movie' => {
    _type,
    'remote_id': _id,
    title,
    slug,
    overview,
    releaseDate,
    popularity,
    'poster': poster.asset->url,
    'cast': castMembers[]{
      'character': characterName,
      'person': person->_id
    }
  },
  _type == 'person' => {
    _type,
    slug,
    'remote_id': _id,
    'title': name,
    'image': image.asset->url
  }
}
`

module.exports = query