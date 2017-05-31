/* EG:
 wx.request({
 url: 'test.php', //仅为示例，并非真实的接口地址
 data: {
 x: '' ,
 y: ''
 },
 header: {
 'content-type': 'application/json'
 },
 success: function(res) {
 console.log(res.data)
 }
 })
 */
let ajaxWx = {
  // ajax函数的默认参数
  ajaxOptions : {
    url: '#',
    method: 'GET',
    data: null,
    dataType: 'text／json',
    header: {}
  },

  /**
   * ajax函数，返回一个promise对象
   *   url:                     url地址，默认"#"
   *   method:                  请求方法，仅支持GET,POST,默认GET
   *   data:                    发送的数据，该函数不支持处理数据，将会直接发送
   *   header:                 设置请求的 header , header 中不能设置 Referer
   *   dataType:                默认为 json。如果设置了 dataType 为 json，则会尝试对响应的数据做一次 JSON.parse
   */


  request : function(options) {

    return new Promise((resolve, reject) => {
      const defaultHeader = {
        'content-type': options.contentType || 'application/json'
      }
      const header = options.header || {}

      wx.request({
        url: options.url,
        data: options.data,
        header: Object.assign(defaultHeader, header),
        method: options.method || 'GET',
        success: function(res) {
          const result = res.data
          const statusCode = res.statusCode

          if (statusCode < 399) {
            // 2XX, 3XX 成功
            const data = result.data || null
            resolve(data)
          } else {
            // 4XX, 5XX 失败
            let err
            if (typeof result === 'object') {
              // 服务端可以处理的错误
              const error = result.error || null
              const errorMessage = error.message || error.alertMessage
              err = new Error(errorMessage)
              reject(err)
            } else {
              err = new Error(result)
              reject(err)
            }
          }
        },
        /**
         * 微信失败回调
         *
         * @param {Object} err
         * @param {String} err.errMsg
         */
        fail(err) {
          const error = new Error('网络请求错误')
          reject(error)
        }
      })
    })

  }


};

export default ajaxWx;
