/* EG:
未经测试
 site.ajax({
 url: 'http://ecmobile.dev.platform.ymc.com/api/services/Products/Store/GetStoreInfoById',
 async: true,
 type:'POST',
 data: {
 "id": "50f17477-981d-4099-a73d-87942ef51397"
 },
 dataType:'text/json'
 }).then(
 function (xhr) {
 console.log("data",xhr.response);a
 },
 function (e) {
 console.log(JSON.stringify(e))
 }
 )
 */
let siteEs6 = {
  // ajax函数的默认参数
  ajaxOptions : {
    url: '#',
    type: 'GET',
    async: true,
    timeout: 0,
    data: null,
    dataType: 'text／json',
    header: {},
    xhr: null
  },

  /**
   * ajax函数，返回一个promise对象
   * @param {Object} optionsOverride 参数设置，支持的参数如下
   *   url:                     url地址，默认"#"
   *   type:                  请求方法，仅支持GET,POST,默认GET
   *   async:                   是否异步，默认true
   *   timeout:                 请求时限，超时将在promise中调用reject函数
   *   data:                    发送的数据，该函数不支持处理数据，将会直接发送
   *   dataType:                接受的数据的类型，默认为text
   *   headers:                 一个对象，包含请求头信息
   *   xhr:                     允许在函数外部创建xhr对象传入，但必须不能是使用过的
   * @return {Promise}
   *   该函数注册xhr.onloadend回调函数，判断xhr.status是否属于 [200,300)&&304 ，
   *   如果属于则promise引发resolve状态，允许拿到xhr对象
   *   如果不属于，或已经引发了ontimeout,onabort,则引发reject状态，允许拿到xhr对象
   *
   * 关于reject
   *   返回一个对象，包含
   *   errorType:错误类型，
   *     abort_error:   xhr对象调用abort函数
   *     timeout_error: 请求超时
   *     onerror:       xhr对象触发了onerror事件
   *     send_error:    发送请求出现错误
   *     status_error:  响应状态不属于 [200,300)&&304
   */
  request : function(optionsOverride) {
    function getXHR() {
      if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
      } else {
        //遍历IE中不同版本的ActiveX对象
        let versions = ["Microsoft", "msxm3", "msxml2", "msxml1"];
        for (let i = 0; i < versions.length; i++) {
          try {
            let version = versions[i] + ".XMLHTTP";
            return new ActiveXObject(version);
          } catch (e) {}
        }
      }
    }

    // 将传入的参数与默认设置合并
    let options = {};
    let ajaxOptions = this.ajaxOptions;
    for (let k in ajaxOptions) {
      options[k] = optionsOverride[k] || ajaxOptions[k];
    }
    options.async = options.async === false ? false : true;
    let xhr = options.xhr = options.xhr || getXHR();
    return new Promise(function (resolve, reject) {
      xhr.open(options.type, options.url, options.async);
      xhr.timeout = options.timeout;

      //设置请求头
      for (let k in options.header) {
        xhr.setRuquestHeader(k, options.header[k]);
      }

      // xhr.responseType = options.dataType;
      xhr.onabort = function () {
        reject(new Error({
          errorType: 'abort_error',
          xhr: xhr
        }));
      }
      xhr.ontimeout = function () {
        reject({
          errorType: 'timeout_error',
          xhr: xhr
        });
      }
      xhr.onerror = function () {
        reject({
          errorType: 'onerror',
          xhr: xhr
        })
      }
      xhr.onreadystatechange = function () {

        if (xhr.readyState == 4) {
          if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304){
            //响应信息返回后处理，在页面提示用户
            const data = result.data || null
            resolve(data);
            //JSON.parse(xhr.response)
          }
          else{
            //alert("响应失败！");
            var _response_json = {};
            if (xhr.response) {
              try {
                _response_json = JSON.parse(xhr.response);
              } catch (e) {
                site.log.debug(e);
              }
            }
            if (_response_json.behavior && _response_json.behavior.content) {
              site.modal.error(_response_json.behavior.content);
            } else {
              site.modal.error('<a href="javascript:void(0);" style="text-decoration: underline;color: #FFF;" onclick="window.location.reload();">亲~网络不给力。点此刷新重试</a>', null, 60000);
            }

            reject({
              errorType: 'status_error',
              xhr: xhr
            })
          }
        }
        /*else{
         alert("请求未发送！")
         }*/

      }

      try {
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("ClientVersion", "10000");
        let params =  options.type === 'GET' ? formatParams(options.data) : JSON.stringify(options.data);
        xhr.send(params);
      }
      catch (e) {
        reject({
          errorType: 'send_error',
          error: e
        });
      }
    })


    function formatParams(data) {
      let arr = [];
      for (let name in data) {
        arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
      }
      return arr.join('&');
    }
  }
};

export default siteEs6;
