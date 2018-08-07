/**
 * Created by mt on 2018/06/21.
 */
import Vue from 'vue';
import axios from 'axios';

const Log=  {
  init () {
    this.initErrorEvent();
    this.initAxios()
  },
  //添加一个响应拦截器
  initAxios(){
    var self = this;
    axios.interceptors.response.use(function(res){
      //在这里对返回的数据进行处理
      return res;
    }, function(err){
      //Do something with response error
      var obj={
        type: 'Ajax Error',
        method: err.config.method,
        requestData:JSON.parse(err.config.data),
        responseData:typeof err.response.data=='string'? '':err.response.data,
        timeout: err.config.timeout, // 请求时长
        url:location.href+err.config.url, // 请求接口
        status: err.response.status, // 返回状态码
        statusText: err.response.statusText
      }
      self.post(obj);
      return Promise.reject(err);
    })
  },
  /**
   * @param {String}  errorMessage   错误信息
   * @param {String}  scriptURI      出错的文件
   * @param {Long}    lineNumber     出错代码的行号
   * @param {Long}    columnNumber   出错代码的列号
   * @param {Object}  errorObj       错误的详细信息，Anything
   */
  initErrorEvent () {
    var self = this;
    window.onerror = function(msg, url, line, col, error) {
      let _error = Object.assign({ type: 'Window onError'}, self.processError(error));
      try {
        self.post(_error); //发送报告到后台
      } catch(e) {}
      // console.log(_error);
    }
  },
  processError(errObj) {
    try {
      if (errObj.stack) {
        var url = errObj.stack.match("https?://[^\n]+");
        url = url ? url[0] : "";
        var rowCols = url.match(":(\\d+):(\\d+)");
        if (!rowCols) {
          rowCols = [0, 0, 0];
        }

        var stack = errObj.stack;
        return {
          msg: stack,
          line: rowCols[1],
          col: rowCols[2],
          target: url.replace(rowCols[0], "").replace(')', ''),
          _orgMsg : errObj.toString()
        };
      } else {
        if (errObj.name && errObj.message && errObj.description) {
          return {
            msg: JSON.stringify(errObj)
          };
        }
        return errObj;
      }
    } catch (err) {
      return errObj;
    }
  },
  // 将错误发送到后端
  post (errObj, level) {
    // 不允许输入和显示  ?  \  "  /  '  <  ~  > 这些字符
    Vue.prototype.openApi && Vue.prototype.openApi({
      data: {
        level: level || 'error', // or warn , info(default)
        msg: JSON.stringify(errObj)
      },
      apiId: 'crt.crtmc2.mc.writeLog'
    });
  }
}
// 提供给vue的接口
Vue.prototype.postError = function(msg){
  Log.post(msg);
}
Vue.config.errorHandler = function (err, vm, info){
  let { message, name, stack } = err;
  // script, line, column,
  // 在vue提供的error对象中，script、line、column目前是空的。但这些信息其实在错误栈信息里可以看到。

  // 解析错误栈信息
  let stackStr = stack ? stack.toString() : `${name}:${message}`;
  let errorObj = {
    msg: stackStr,
    type: 'Vue Capture Error'
  }
  Log.post(errorObj)
}
Log.init();
export default Log;

