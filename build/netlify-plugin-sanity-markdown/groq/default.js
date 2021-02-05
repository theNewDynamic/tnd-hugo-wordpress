const query = `
*[_type in ["movie", "person", "screening"]]{
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
  },
  _type == 'screening' => {
    _type,
    'remote_id': _id,
    'title': title,
    'movie': movie->_id,
    beginAt,
    endAt
  }
}
`

module.exports = query