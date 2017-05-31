'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
var ajaxWx = {
  // ajax函数的默认参数
  ajaxOptions: {
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

  request: function request(options) {

    return new _promise2.default(function (resolve, reject) {
      var defaultHeader = {
        'content-type': options.contentType || 'application/json'
      };
      var header = options.header || {};

      wx.request({
        url: options.url,
        data: options.data,
        header: (0, _assign2.default)(defaultHeader, header),
        method: options.method || 'GET',
        success: function success(res) {
          var result = res.data;
          var statusCode = res.statusCode;

          if (statusCode < 399) {
            // 2XX, 3XX 成功
            var data = result.data || null;
            resolve(data);
          } else {
            // 4XX, 5XX 失败
            var err = void 0;
            if ((typeof result === 'undefined' ? 'undefined' : (0, _typeof3.default)(result)) === 'object') {
              // 服务端可以处理的错误
              var error = result.error || null;
              var errorMessage = error.message || error.alertMessage;
              err = new Error(errorMessage);
              reject(err);
            } else {
              err = new Error(result);
              reject(err);
            }
          }
        },
        /**
         * 微信失败回调
         *
         * @param {Object} err
         * @param {String} err.errMsg
         */
        fail: function fail(err) {
          var error = new Error('网络请求错误');
          reject(error);
        }
      });
    });
  }

};

exports.default = ajaxWx;