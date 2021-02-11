module.exports = (data) => ({
  date: data.date,
  title: data.title ? data.title.rendered : '',
  remote_id: data.id,
  remote_service: 'wp',
})