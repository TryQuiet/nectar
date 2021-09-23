import debug from 'debug'
export default Object.assign(debug('nectar'), {
  error: debug('nectar:err')
})
