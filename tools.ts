/**
 * js各种公用且与业务无关的工具类方法
 */
namespace G{
    export let tools = {
        randomColor() {
            let colorClass = ['blue', 'green', 'yellow', 'red', 'purple', 'black', 'grey'];
            return colorClass[(Math.random() * (colorClass.length - 1)).toFixed(0)];
        },
        escapeRegExp(str) {
            return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        },
        /**
         * 为特定字符串设置为高亮
         * @param {string} str - 整个字符串
         * @param {string} hlstr - 需要设置为高亮的字符串
         * @param {string} color - 高亮颜色
         * @param {boolean} ignoreCase
         * @returns {string}
         */
        highlight(str: string, hlstr: string, color: string, ignoreCase = true){

            if(typeof str === 'string' && hlstr.trim()){
                let searchPara = new RegExp(`(${tools.escapeRegExp(hlstr)})`, ignoreCase ? 'ig' : 'g');
                return str.replace(searchPara, `<span class="${color}">$1</span>`);

            }else{
                return str;
            }
        },
        /**
         * 直接通过键值组获取数据，没有则返回undefined
         * @param obj
         * @param {(number | string)[]} keys - 键值数组
         * @return {boolean}
         */
        keysVal(obj, keys: (number | string)[]){
            let last = obj,
                keyLen = keys.length;

            for (let i = 0; i < keyLen; i ++){
                let key = keys[i];

                if(typeof last === 'object' && last !== null){
                    if(key in last){
                        last = last[key];
                    } else {
                        return undefined;
                    }

                    // 最后
                }else{
                    return i === keyLen - 2 ? last : undefined;
                }
            }

            return last;
        },

        copy(text: string){
            let input = <HTMLTextAreaElement>d.createByHTML(
                '<textarea style="position: absolute;top: -1px;height: 1px;width: 1px;"></textarea>');
            input.value = text;
            d.append(document.body, input);
            input.select();
            document.execCommand("Copy");
            // G.Modal.toast('复制成功');
            d.remove(input);
        },
        getGuid : (function () {
            let guid = 999;
            return function (prefix = 'guid-') {
                return `${prefix}${guid++}`
            }
        }()),
        isMb: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        val2RGB(colorVal:number){
            let r = 0,
                g = 0,
                b = 0;

            // 显示颜色
            if(typeof colorVal === 'number'){
                r = colorVal % 256;
                g = Math.floor(colorVal / 256) % 256;
                b = Math.floor(colorVal / 256 / 256) % 256;
            }

            return {r, g, b};
        },
        url: {
            /**
             * 获取url中请求参数的值
             * @param {string} name - 参数名
             * @param {string} [url]
             * @returns {*}
             */
            getPara: function (name:string, url = window.location.href) {
                let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
                let r = url.split('?')[1] ? url.split('?')[1].match(reg) : null;
                return r !== null ? decodeURI(r[2]) : null;
            },
            /**
             * url连接object为后面的参数
             * @param {string} url
             * @param {object} obj
             * @param {boolean} [isLowCase=true]
             * @return {string}
             */
            addObj: function (url : string, obj : obj, isLowCase= true) {
                for(let key in obj){
                    if(tools.url.getPara(key, url)){
                        delete obj[key];
                    }
                }
                if (!tools.valid.isEmpty(obj)) {
                    return url + (url.indexOf('?') === -1 ? '?' : '&') + tools.obj.toUri(obj, isLowCase);
                } else {
                    return url;
                }
            }
        },
        str: {
            /**
             * null,undefined,false 转为 ''
             * @param value
             * @param str
             * @return {*|string}
             */

            toEmpty: function (value: any, str: string = '') {
                return value || value === 0 ? value : str;
            },
            /**
             * 移除html标签
             * @param s
             * @return {string}
             */
            _htmlTagReg : /(&nbsp;|<([^>]+)>)/ig,
            removeHtmlTags: function (s:string) {
                if(typeof s === 'string'){
                    return s.replace(tools.str._htmlTagReg, '').replace(/\s+/g, ' ');
                }else{
                    return s;
                }
                // let div = document.createElement('div');
                // div.innerHTML = s;
                // return div.innerText;
            },
            /**
             * html encode
             * @param html
             * @return {string}
             */
            htmlEncode: function (html: string) {
                if(html === null || typeof html === 'undefined'){
                    html = '';
                }

                return html.toString().replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\//g, '&#x2F;');

            },
            /**
             * 解析模版 模板中的{{xxx}} 对应 data中的属性名xxx
             * @param tpl
             * @param data
             * @param isEncode
             * @return {string}
             */
            parseTpl: function (tpl : string, data : obj, isEncode = true) {
                let parseReg = /\{\{\S+?}}/g,
                    self = this;
                return tpl.replace(parseReg, function (param) {
                    param = param.slice(2, -2);

                    let [key, param1] = param.split(','),
                        isEn = param1 ? param1 === '1' : isEncode;

                    return tools.valid.isEmpty(data[key]) ? '' : (isEn ? self.htmlEncode(data[key]) : data[key]);
                });
            },
            removeEmpty: function (str: string) {
                let parseReg = /\s{2,}/g;
                if(typeof str === 'string'){
                    return str.replace(parseReg, ' ');
                }
                return str;
            },

            /**
             * 按utf-8编码 截取字符串
             * @param {string} str 字符串
             * @param {int} len 长度
             * @return {string}
             */
            cut: function (str: string, len:number) {
                let cutStr = '';
                let realLength = 0;
                if (!tools.valid.isEmpty(len)) {
                    let sLen = str.length;
                    for (let i = 0; i < sLen; i++) {
                        if (str.charCodeAt(i) >= 0 && str.charCodeAt(i) <= 128) {
                            realLength += 1;
                        } else {
                            realLength += 2;
                        }
                        if (realLength > len) {
                            continue;
                        }
                        cutStr += str[i];
                    }

                    if (cutStr.length > 0 && realLength > len) {
                        cutStr += '...';
                    }
                } else {
                    cutStr = str;
                }

                return cutStr;
            },
            utf8Len: function (str) {
                let sLen = str.length,
                    utf8len = 0;
                for (let i = 0; i < sLen; i++) {
                    if (str.charCodeAt(i) >= 0 && str.charCodeAt(i) <= 128) {
                        utf8len += 1;
                    } else {
                        utf8len += 2;
                    }
                }
                return utf8len;
            },
            toBytes: function (str) {
                let pos = 0;
                let len = str.length;
                if (len % 2 != 0) {
                    return null;
                }
                len /= 2;
                let hexA = [];
                for (let i = 0; i < len; i++) {
                    let s = str.substr(pos, 2);
                    let v = parseInt(s, 16);
                    hexA.push(v);
                    pos += 2;

                }
                return hexA;
            },

            /**
             * 为特定字符串设置为高亮
             * @param {string} str - 整个字符串
             * @param {string} hlstr - 需要设置为高亮的字符串
             * @param {string} hue - 高亮颜色
             * @returns {string}
             */
            setHeightLight: function(str, hlstr, hue){
                let color = {
                    red: '#dd524d',
                };
                if(Object.prototype.toString.call(str).slice(8, -1) === 'String'){
                    return str.replace(hlstr, `<span style="color:${hue}" >${hlstr}</span>`);
                }else{
                    return str;
                }
            }

        },
        obj: {
            /**
             * 原型继承
             * @param Child 子类
             * @param Parent 父类
             * @param {Object} [newProto] 需要重写的prototype
             */
            protoExtend: function (Child, Parent, newProto) {
                newProto = newProto || {};
                let F = function () {
                };
                F.prototype = Parent.prototype;
                Child.prototype = new F();
                //新的proto
                for (let attr in newProto) {
                    if (!newProto.hasOwnProperty(attr)) {
                        continue;
                    }
                    Child.prototype[attr] = newProto[attr];
                }
                Child.prototype.constructor = Child;
            },

            /**
             * 对象转成url参数
             * @param {Object} object
             * @param {boolean} isLowCase
             * @returns {string} urlDataStr
             */
            toUri: function (object:obj, isLowCase = true) {
                let urlDataStr = '';
                for (let key in object) {
                    if (object.hasOwnProperty(key)) {
                        urlDataStr += `&${isLowCase ? key.toLowerCase() : key}=${encodeURIComponent(object[key])}`;
                    }
                }
                return urlDataStr.slice(1);
            },
            /**
             * object转dom属性
             * @param {Object} object
             * @return {string}
             */
            toAttr: function (object): string {
                let attrStr = '';
                for (let key in object) {
                    if (object.hasOwnProperty(key)) {
                        attrStr += (' ' + key + '="' + object[key] + '"');
                    }
                }
                return attrStr;
            },
            /**
             * 浅复制Object
             * @param {object} object
             * @return {object}
             */
            copy: function (object) : any{
                let key, cp = {};
                for (key in object) {
                    if (object.hasOwnProperty(key)) {
                        cp[key] = object[key];
                    }
                }
                return cp;
            },
            /**
             * 对象合并，第一个参数为true时，则为深度合并
             * @param args
             * @return {{}}
             */
            merge: function (...args) : obj {
                // Variables
                let extended = {};
                let deep = false;
                let i = 0;
                let length = args.length;

                // Check if a deep merge
                if (Object.prototype.toString.call(args[0]) === '[object Boolean]') {
                    deep = args[0];
                    i++;
                }

                // Merge the object into the extended object
                let merge = function (obj) {
                    for (let prop in obj) {
                        if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
                            continue;
                        }
                        // If deep merge and property is an object, merge properties
                        let objStr = Object.prototype.toString.call(obj[prop]);
                        if (deep && ( objStr === '[object Object]' || objStr === '[object Array]' )) {

                            if (objStr === '[object Object]') {
                                extended[prop] = tools.obj.merge(true, extended[prop], obj[prop]);
                            } else {
                                extended[prop] = obj[prop].slice(0);
                            }
                        } else {
                            extended[prop] = obj[prop];
                        }
                    }
                };

                // Loop through each object and conduct a merge
                for (; i < length; i++) {
                    let obj = args[i];
                    merge(obj);
                }

                return extended;
            },
            /**
             * 对象转数组
             * @param {obj} o
             * @return {Array}
             */
            toArr(o : obj){
                let arr = [];
                for(let key in o){
                    if(o.hasOwnProperty(key)){
                        arr.push(o[key])
                    }
                }
                return arr;
            }
        },
        cookie: {
            set: function (name, value, days) {
                let expires = "";
                if (days) {
                    let date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                document.cookie = name + "=" + value + expires + "; path=/sf/";
            },
            get: function (name) {
                let nameEQ = name + "=";
                let ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
                }
                return null;
            },
            clear: function eraseCookie(name) {
                this.set(name, "", 0);
            }
        },
        valid: {
            isTel: function (tel) {
                return /^1[34578]\d{9}$/.test(tel);
            },
            /**
             * undefined null '' [] {} 为空
             * @param {*} obj
             * @return {boolean} is_empty
             */
            isEmpty: function (obj) {
                let is_empty = false;
                if (obj === undefined || obj === null || obj === '') {
                    is_empty = true;
                } else if (Array.isArray(obj) && obj.length === 0) {
                    is_empty = true;
                } else if (obj.constructor === Object && Object.keys(obj).length === 0) {
                    is_empty = true;
                }
                return is_empty;
            },
            isObj: function (obj) {
                return Object.prototype.toString.call(obj).substring(8, 1) === 'object';
            }
        },
        event: {
            /**
             * 触发自定义事件
             * @param eventName
             * @param detail
             * @param [win]
             */
            fire: function (eventName:string, detail = null, win:EventTarget = window) {
                let e = null;
                if(typeof eventName !== 'string' || !eventName){
                    return ;
                }
                if ('CustomEvent' in window) {
                    e = new CustomEvent(eventName, {detail: detail, bubbles : true});
                } else {
                    e = document.createEvent('CustomEvent');
                    e.initCustomEvent(eventName, true, false, {detail: detail});
                }
                win.dispatchEvent(e);
            },

        },
        /**
         * 发送一个XMLHttpRequest 请求 (ajax)
         * @param {url} url - ajax url
         * @param {Object} [para]
         * @param {'GET'|'POST'|'DELETE'|'PUT'|'HEAD'|'OPTIONS'} [para.type=GET]
         * @param {string | object} [para.data] - ajax提交数据
         * @param {'script'|'json'|'xml'|'html'|'text'} [para.dataType=text] - 接受的数据类型
         * @param {object} [para.headers]
         * @param {boolean} [para.cache = false]
         * @param {int} [para.timeout] - 超时时间
         * @param {function} [para.success] - 成功回调函数  参数: (服务端返回数据, 'success', xhr)
         * @param {function} [para.error] - 错误时的回调 参数: (xhr, 错误类型, 异常)
         *
         */
        XMLRequest: (function () {
            let ajaxCache:obj = {};

            // 针对同时请求多次相同请求的回调缓存处理
            let callback = (()=>{
                const callbackStack: objOf<AjaxCb> = {};

                /**
                 * 添加缓存
                 * @return 返回是否中断此次请求
                 */
                function add(hash:string, cb:{success:AjaxSuccess, error:AjaxError}):boolean{
                    let isFirst = !(hash in callbackStack);
                    if(isFirst){
                        callbackStack[hash] = {
                            success : [],
                            error: [],
                        };
                    }

                    if(typeof cb.success === 'function'){
                        callbackStack[hash].success.push(cb.success);
                    }
                    if(typeof cb.error === 'function'){
                        callbackStack[hash].error.push(cb.error);
                    }

                    return !isFirst;
                }

                /**
                 * 清理缓存
                 */
                function clear(hash:string){
                    if(!(hash in callbackStack)){
                        return
                    }
                    delete callbackStack[hash];
                }
                /**
                 * 执行成功
                 */
                function success(hash:string, response : any, s?: string, xhr? :XMLHttpRequest){
                    let stack = callbackStack[hash];
                    if(!stack || !Array.isArray(stack.success)){
                        return;
                    }
                    stack.success.forEach((fun)=>{
                        fun(response, s, xhr);
                    });
                    clear(hash);
                }

                /**
                 * 执行失败
                 */
                function error(hash:string, xhr?: XMLHttpRequest, type?:string, text?:string){
                    let stack = callbackStack[hash];
                    if(!stack || !Array.isArray(stack.error)){
                        return;
                    }
                    stack.error.forEach((fun)=>{
                        fun(xhr, type, text);
                    });
                    clear(hash);
                }


                return{
                    add, success, error
                }
            })();


            function getCache (data){
                return typeof data === 'object' ? tools.obj.merge(true, data) : data;
            }

            return function (url, para) {
                let xhr = new XMLHttpRequest();
                let abortTimeout = null, paraSettings, conf:Ajax_Para, accepts, mine;
                //     type: ['GET', 'POST', 'DELETE', 'PUT', 'HEAD', 'OPTIONS']
                paraSettings = {
                    type: 'GET'
                    , data: ''
                    , dataType: 'text'
                    , headers: {}
                    , cache: false
                    , timeout: 0
                    , success: ()=>{}
                    , error: ()=>{}
                };

                accepts = {
                    script: 'text/javascript, application/javascript, application/x-javascript',
                    json: 'application/json',
                    xml: 'application/xml, text/xml',
                    html: 'text/html',
                    text: 'text/plain'
                };

                conf = tools.obj.merge(paraSettings, para);
                conf.dataType = conf.dataType.toLowerCase();
                conf.type = conf.type.toUpperCase();
                mine = accepts[conf.dataType];

                if (typeof conf.data === 'object') {
                    if (conf.type === 'GET') {
                        url = tools.url.addObj(url, conf.data);
                        conf.data = '';
                    } else {
                        conf.data = tools.obj.toUri(conf.data);
                    }
                }

                // 缓存hash
                let cacheHash = conf.type + url + conf.dataType + conf.data;

                // 如果添加到了回调缓存, 则终止此次请求
                if(callback.add(cacheHash, { success: conf.success, error: conf.error })){
                    return;
                }

                // 直接读取缓存
                if (conf.cache && cacheHash in ajaxCache) {
                    callback.success(cacheHash, getCache(ajaxCache[cacheHash]), 'success', xhr);
                    // conf.success(getCache(ajaxCache[cacheHash]), 'success', xhr);
                    // console.log(ajaxCache);
                    return;
                }

                xhr.open(conf.type, url);
                //
                // if('responseType' in xhr){
                //     // console.log(conf.dataType);
                //     xhr.responseType = conf.dataType;
                // }

                if (mine) {
                    xhr.overrideMimeType(mine.split(',')[0]);
                }

                //设置请求headers
                conf.headers['X-Requested-With'] = 'XMLHttpRequest';
                conf.headers['Accept'] = mine || '*/*';
                if (conf.type !== 'GET' && !tools.valid.isEmpty(conf.data)) {
                    conf.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
                for (let key in conf.headers) {
                    if (conf.headers.hasOwnProperty(key)) {
                        xhr.setRequestHeader(key, conf.headers[key]);
                    }
                }

                //超时设置
                if (conf.timeout > 0) {
                    abortTimeout = setTimeout(function () {
                        xhr.onreadystatechange = ()=>{};
                        xhr.abort();
                        callback.error(cacheHash, xhr, 'timeout', '');

                        // conf.error(xhr, 'timeout', null);
                    }, conf.timeout);
                }

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === XMLHttpRequest.DONE) {

                        if (abortTimeout !== null) {
                            clearTimeout(abortTimeout);
                        }

                        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                            let error,
                                dataType = conf.dataType,
                                result: any = xhr.responseText;
                            try {
                                if (dataType === 'script') {
                                    (eval)(result);
                                } else if (dataType === 'xml') {
                                    result = xhr.responseXML;
                                } else if (dataType === 'json') {
                                    result = JSON.parse(result);
                                }
                            } catch (e) {
                                error = e;
                            }
                            if (error) {
                                callback.error(cacheHash, xhr, 'parsererror', error);

                                // conf.error(xhr, 'parsererror', error);
                            } else {
                                // 设置缓存
                                if (conf.cache) {

                                    ajaxCache[cacheHash] = getCache(result);
                                    // console.log(ajaxCache);
                                }
                                callback.success(cacheHash, result, 'success', xhr);
                            }
                        } else {
                            let status = xhr.status ? 'error' : 'abort';
                            let statusText = xhr.statusText || null;

                            callback.error(cacheHash, xhr, status, statusText);
                            // conf.error(xhr, status, statusText);
                        }

                    }
                };

                xhr.send(conf.data);
            }
        }()),
        date: {
            oneDay: 86400000,
            today: () => new Date(),
            add: (date: Date, day: number) => {
                date.setTime(date.getTime() + day * tools.date.oneDay);
                return date;
            },
            tomorrow: () => tools.date.add(new Date(), 1),
            yesterday: () => tools.date.add(new Date(), -1),
            range: {
                today: () => {
                    return tools.date._getRange(new Date(), new Date());
                },
                yesterday: () => {
                    return tools.date._getRange(tools.date.yesterday(), tools.date.yesterday());
                },
                tomorrow: () => {
                    return tools.date._getRange(tools.date.tomorrow(), tools.date.tomorrow());
                },
                thisWeek: () => {
                    let date1 = new Date(), date2 = new Date(),
                        day = date1.getDay();
                    return tools.date._getRange(tools.date.add(date1, -day + 1), tools.date.add(date2, 7 - day));
                },
                lastWeek: () => {
                    let date1 = new Date(), date2 = new Date(),
                        lastWeekDay = date1.getDay();

                    lastWeekDay = lastWeekDay === 0 ? 7 : lastWeekDay;
                    return tools.date._getRange(tools.date.add(date1, -lastWeekDay - 6), tools.date.add(date2, -lastWeekDay));
                },

                thisMonth: () => {
                    let date = new Date(),
                        year = date.getFullYear(),
                        month = date.getMonth();

                    return tools.date._getRange(new Date(year, month, 1), new Date(year, month + 1, 0));
                },
                lastMonth: () => {
                    let date = new Date();
                    date.setMonth(date.getMonth() - 1);
                    let year = date.getFullYear(),
                        month = date.getMonth();

                    return tools.date._getRange(new Date(year, month, 1), new Date(year, month + 1, 0));
                },
                _getSeasonIndex: (date: Date) => Math.floor(date.getMonth() / 3),
                _getSeason: (year, season) => {
                    let firstMonth = season * 3,
                        monthLen = ((firstMonth / 9 % 1 === 0) ? 31 : 30);
                    return tools.date._getRange(new Date(year, firstMonth, 1), new Date(year, firstMonth + 2, monthLen))
                },
                // (year) => [new Date(year, 3, 1), new Date(year, 5, 30)],
                // (year) => [new Date(year, 6, 1), new Date(year, 8, 30)],
                // (year) => [new Date(year, 9, 1), new Date(year, 11, 31)]
                thisSeason: () => {
                    let date = new Date(),
                        dateRange = tools.date.range;

                    return dateRange._getSeason(date.getFullYear(), dateRange._getSeasonIndex(date));
                },
                lastSeason: () => {
                    let date = new Date(),
                        dateRange = tools.date.range,
                        lastSeasonIndex = (dateRange._getSeasonIndex(date) - 1 + 4) % 4,
                        year = date.getFullYear() - (lastSeasonIndex === 3 ? -1 : 0);

                    return dateRange._getSeason(year, lastSeasonIndex);
                },
                thisYear: () => {
                    let year = new Date().getFullYear();
                    return tools.date._getRange(new Date(year, 0, 1), new Date(year, 11, 31));
                },
                lastYear: () => {
                    let year = new Date().getFullYear() - 1;
                    return tools.date._getRange(new Date(year, 0, 1), new Date(year, 11, 31));
                }
            },
            _getRange:(date1 : Date, date2: Date) => {
                date1.setHours(0,0,0,0);
                date2.setHours(23,59,59,999);
                return [date1, date2];
            },
            format: (date: Date, fmt: string) => {
                if(!fmt){
                    return date.toString();
                }
                let o = {
                    "M+": date.getMonth() + 1,                 //月份
                    "d+": date.getDate(),                    //日
                    "H+": date.getHours(),                   //小时
                    "m+": date.getMinutes(),                 //分
                    "s+": date.getSeconds()                 //秒
                    // "S": date.getMilliseconds()             //毫秒
                };
                if (/(y+)/.test(fmt))
                    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
                for (let k in o)
                    if (new RegExp("(" + k + ")").test(fmt))
                        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                return fmt;
            }
        },

        pattern: {
            singleton : function (fn) {
                let single = null;
                return function () {
                    return single || ( single = fn .apply(this, arguments ) );
                }
            }
        },
        /**
         * 获取offset参数
         * @author yrh
         */
        offset: {
            left: function(obj){
                if(obj === window){
                    return 0;
                }
                return obj.offsetLeft + (obj.offsetParent ? this.left(obj.offsetParent) : 0);
            },
            top: function(obj){
                if(obj === window){
                    return 0;
                }
                return obj.offsetTop + (obj.offsetParent ? this.top(obj.offsetParent) : 0);
            }
        },
        /**
         * 获取滚动条scrollTop
         * @author yrh
         */
        scrollTop: function() {
            return document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
        },


        // select多选下拉框，选中项移动
        selectMove: function(oldSel, newSel) {
            let opts = oldSel.options;
            for(let i=0, l=opts.length; i<l; i++) {
                if(opts[i].selected) {
                    newSel.appendChild(opts[i]);
                    i--;
                    l--;
                }
            }
        },
        iPage: function (src, attrs) {
            let iframe = d.createByHTML('<iframe class="pageIframe" src="' + src + '"' + tools.obj.toAttr(attrs) + '></iframe>');

                document.body.appendChild(iframe);

            return {
                show: function () {console.log(1);
                    iframe.classList.add('active');
                },
                close: function () {
                    iframe.classList.remove('active');
                }
            }
        },

        // 设置select表单选中
        selVal(select, val) {
            for(var i=0; i<select.options.length; i++){  
                if(select.options[i].value == val){  
                    select.options[i].selected = true;  
                    break;  
                }  
            }
        }
    };
    tools.iPage.prototype.getActives = function () {
        return document.querySelectorAll('iframe.pageIframe.active');
    };
}