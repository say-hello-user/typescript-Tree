/**
 * DOM操作封装
 */
interface EventOnPara {
    (el: EventTarget, type: string, cb: EventListener);

    (el: Node, type: string, selector: string, cb: EventListener);
}

interface EventOffPara {
    (el: EventTarget, type?: string, cb?: EventListener);

    (el: Node, type?: string, selector?: string, cb?: EventListener);
}

// interface EventSelectorFunPara extends EventFunPara{
//     (elSelector : string, type : string, cb : EventListener);
//     (elSelector : string, type : string, evSelector : string, cb : EventListener);
//     (elSelector : string, el : Node, type : string, cb : EventListener);
//     (elSelector : string, el : Node,  type : string, evSelector : string, cb : EventListener);
// }

interface EventCache {
    handlers: {
        [event: string]: {
            [selector: string]: EventListener[]
        }
    };
    disabled: boolean;
    dispatcher: EventListener;
}

namespace G {
    /**
     * 操作element自定义数据
     * @type {{get: ((elem: Node) => obj); remove: ((elem: Node) => any)}}
     */
    let elemData = (function () {
        let cache: obj = {},
            guidCounter = 1,
            expando = `__data${(new Date).getTime()}`;

        /**
         * 获取数据
         * @param {Node} elem
         * @returns {obj}
         */
        function get(elem: Node): obj {
            let guid = elem[expando];
            if (!guid) {
                guid = elem[expando] = guidCounter++;
                cache[guid] = {};
            }

            return cache[guid];
        }

        /**
         * 删除
         * @param {Node} elem
         */
        function remove(elem: Node) {
            let guid = elem[expando];
            if (guid) {
                delete cache[guid];
                delete elem[expando]
            }
        }

        return {get, remove}

    }());

    /**
     * 事件管理
     */
    let event = (function () {

        // 委托元素对应的回调
        let eventHash = '__event',
            noDelegateSelector = '';

        function _getElPath(target: Node) {
            let path: EventTarget[] = [];

            let currentElem = target;
            while (currentElem) {
                path.push(currentElem);
                currentElem = currentElem.parentNode;
            }
            if (path.indexOf(window) === -1 && path.indexOf(document) === -1) {
                path.push(document);
            }
            if (path.indexOf(window) === -1) {
                path.push(window);
            }

            return path;
        }

        function _selectorEvent(el: Element, eventHandlers: objOf<EventListener[]>, evt: Event) {
            let isMatches = false;
            // 匹配委托元素
            for (let selector in eventHandlers) {
                let selectorHandlers = eventHandlers[selector],
                    target: Element = null;

                // 委托选择器不为空时则继续
                if (!selector) {
                    continue;
                }

                target = d.matches(el, selector) ? el : null;
                if (target && selectorHandlers && selectorHandlers[0]) {
                    isMatches = true;
                    selectorHandlers.forEach(handler => {
                        handler.call(target, evt);
                    })
                }
            }

            return isMatches;
        }


        /**
         * 开启事件
         * @param {EventTarget | Node} el
         * @param {string} type
         * @param {EventListener | string} selector
         * @param {EventListener} cb
         */
        let on: EventOnPara = function (el, type, selector, cb?) {

            // 是否第一次绑定此元素的此事件类型
            let first = false;

            // 委托选择器是函数的时候，则选择器为空
            if (typeof selector !== 'string') {
                cb = <EventListener>selector;
                selector = noDelegateSelector
            }

            // 获取当前是否已经绑定事件
            !elemData.get(el)[eventHash] && (elemData.get(el)[eventHash] = {});
            let elData = <EventCache>elemData.get(el)[eventHash];

            // 初始化数据结
            !elData.handlers && (elData.handlers = {});
            let handlers = elData.handlers;
            if (!handlers[type]) {
                first = true;
                handlers[type] = {};
            }
            !handlers[type][selector] && (handlers[type][selector] = []);

            // 回调函数入栈
            handlers[type][selector].push(cb);

            //
            if (!elData.dispatcher) {
                elData.disabled = false;
                elData.dispatcher = function (evt: Event) {
                    if (elData.disabled || d.closest(this, '.disabled')) { // this has disabled
                        return;
                    }

                    let eventType = evt.type,
                        noDelegateHandler = handlers[eventType][noDelegateSelector];

                    // 没有委托时永远都执行绑定的方法
                    if (noDelegateHandler && noDelegateHandler[0]) {
                        noDelegateHandler.forEach(handler => {
                            handler.call(this, evt);
                        })
                    }


                    let eventPath: Element[] = (function (evt) {

                        if ('path' in evt) {

                            return evt['path'];
                        } else if (evt.deepPath) {

                            return evt.deepPath();
                        } else {

                            return _getElPath(<Node>evt.target);
                        }
                    }(evt));

                    // 冒泡匹配委托元素并执行相应的事件
                    for (let el of eventPath) {

                        // 跳过直接绑定事件元素
                        if (el === this) {
                            continue;
                        }

                        let isMatches = false; // 接下去的匹配是否有匹配到委托元素
                        // 匹配委托元素
                        for (let selector in handlers[eventType]) {
                            let selectorHandlers = handlers[eventType][selector],
                                target: Element = null;

                            // 委托选择器不为空时则继续
                            if (!selector) {
                                continue;
                            }

                            target = d.matches(el, selector) ? el : null;
                            // target has disabled
                            if (target && !target.classList.contains('disabled') && selectorHandlers && selectorHandlers[0]) {
                                isMatches = true;
                                selectorHandlers.forEach(handler => {
                                    handler.call(target, evt);
                                })
                            }
                        }

                        // 如果匹配到委托元素，则不再继续冒泡
                        if (isMatches) {
                            break;
                        }
                    }
                }
            }

            if (first) {
                el.addEventListener(type, elData.dispatcher, false);
            }
        };

        /**
         * 关闭事件
         * @param {EventTarget | Node} el
         * @param {string} type
         * @param {EventListener | string} selector
         * @param {EventListener} cb
         */
        let off: EventOffPara = function (el, type?, selector?, cb?) {

            let elData = <EventCache>elemData.get(el)[eventHash];
            if (!elData || !elData.dispatcher) {
                return;
            }

            if (typeof type === "undefined") {
                for (let type in elData.handlers) {
                    removeHandler(type);
                }
                return;
            }

            if (typeof selector === 'undefined') {
                removeHandler(type);
                return;
            }

            // 委托选择器是函数的时候，则选择器为空
            if (typeof selector !== 'string') {
                cb = <EventListener>selector;
                selector = noDelegateSelector
            }

            if (typeof cb === 'undefined') {
                removeHandler(type, selector);
                return;
            }

            // 删除一个回调函数
            let selectorHandlers = tools.keysVal(elData.handlers, [type, selector]),
                cbIndex = Array.isArray(selectorHandlers) ? selectorHandlers.indexOf(cb) : -1;

            if (cbIndex >= 0) {
                selectorHandlers.splice(cbIndex, 1);
            }
            tidyUp(el, type, selector);

            function removeHandler(t: string, s?: string) {
                let selectorHandlers = elData.handlers[t];

                if (typeof s === 'undefined') {
                    for (let selector in selectorHandlers) {
                        selectorHandlers[selector] = [];
                        tidyUp(el, t, selector);
                    }
                } else {
                    selectorHandlers[s] = [];
                    tidyUp(el, t, s)
                }
            }

            function tidyUp(el: Node, type: string, seletor: string) {
                let elData = <EventCache>elemData.get(el)[eventHash],
                    isEmpty = tools.valid.isEmpty;

                // 选择器函数数组为空
                if (elData.handlers[type] && isEmpty(elData.handlers[type][seletor])) {
                    delete elData.handlers[type][seletor];
                }

                // 一个事件下没有委托的选择器
                if (isEmpty(elData.handlers[type])) {

                    delete elData.handlers[type];
                    el.removeEventListener(type, elData.dispatcher);

                }

                if (isEmpty(elData.handlers)) {
                    delete elData.handlers;
                    delete elData.dispatcher;
                }

                if (isEmpty(elData)) {
                    elemData.remove(el);
                }
            }
        };

        /**
         * 只执行一次事件
         * @param {EventTarget | Node} el
         * @param {string} type
         * @param {EventListener | string} selector
         * @param {EventListener} cb
         */
        let once: EventOnPara = function (el, type, selector, cb?) {

            if (typeof selector === 'function') {
                let func = selector;
                selector = function (e) {
                    off(el, type, selector, cb);
                    func(e);
                };
            } else {
                let func = cb;
                cb = function (e) {
                    // debugger;
                    off(el, type, selector, cb);
                    func(e);
                };
            }
            on(el, type, selector, cb)
        };

        /**
         * 触发一次事件
         * @param {EventTarget} elem
         * @param {string} type
         * @param {string} selector
         */
        let trigger = function (elem: EventTarget, type: string, selector?: string) {
            // if(el !== window){
            for (let el of <Element[]>_getElPath(<Node>elem)) {
                let eventData = elemData.get(el)[eventHash];
                if (eventData) {

                }
            }
            // }

        };

        // let elSelectorEventOn:EventSelectorFunPara = function(a, b, c, d?, e?){
        //     if(typeof a !== 'string'){
        //         on(a, b, c, d);
        //     }else{
        //         if(typeof b === 'string'){
        //             G.d.queryAll(document, b).forEach(el => on(el, b, c, d))
        //         }else{
        //             G.d.queryAll(b, a).forEach(el => on(el, c, d, e))
        //         }
        //     }
        // };
        //
        // let elSelectorEventOff:EventSelectorFunPara = function(a, b, c, d?, e?){
        //     if(typeof a !== 'string'){
        //         off(a, b, c, d);
        //     }else{
        //         if(typeof b === 'string'){
        //             G.d.queryAll(document, b).forEach(el => off(el, b, c, d))
        //         }else{
        //             G.d.queryAll(b, a).forEach(el => off(el, c, d, e))
        //         }
        //     }
        // };

        // let elSelectorEventOnce:EventSelectorFunPara = function(a, b, c, d?, e?){
        //     if(typeof a !== 'string'){
        //         off(a, b, c, d);
        //     }else{
        //         if(typeof b === 'string'){
        //             G.d.queryAll(document, b).forEach(el => off(el, b, c, d))
        //         }else{
        //             G.d.queryAll(b, a).forEach(el => off(el, c, d, e))
        //         }
        //     }
        // };
        return {on, off, once}
    }());


    export const d = {
        /**
         * 一个元素是否匹配一个css选择器
         * @param {Element} dom
         * @param {string} selector
         * @return {boolean}
         */
        matches(dom: Element, selector: string) {
            if ('matches' in dom) {

                return dom.matches(selector);
                // }else if('matchesSelector' in dom){
                // 兼容老版本浏览器
                // return dom.matches(selector);
            } else if ('webkitMatchesSelector' in dom) {
                // 兼容android 4.4
                return dom.webkitMatchesSelector(selector);
            } else {
                return false;
            }
        },

        /**
         * 设置innerHTML 可执行html中的script里面脚本
         * @param {HTMLElement} dom
         * @param {string} html
         */
        setHTML(dom: HTMLElement, html: string) {
            dom.innerHTML = html;
            let scripts = dom.querySelectorAll('script');
            for (let i = 0, s: HTMLScriptElement = null; s = scripts.item(i); i++) {
                let newSc: HTMLScriptElement = document.createElement('script');
                newSc.text = s.text;
                s.parentNode.replaceChild(newSc, s);
            }
        },

        /**
         * 通过html字符串创建元素
         * @param {string} html
         * @param {string} parent
         * @return {HTMLElement}
         */
        createByHTML(html: string, parent = 'div') {
            let div = document.createElement(parent);
            div.innerHTML = html;
            return <HTMLElement>div.firstElementChild;
        },

        /**
         * 通过html字符串创建DocumentFragment
         * @param {string} html
         * @return {DocumentFragment}
         */
        createFragmentByHTML(html: string) {
            return document.createRange().createContextualFragment(html);
        },
        /**
         * 移除一个元素
         * @param {Element} node
         * @param {boolean} [clearEvent=true] - 是否移除此元素以及所有子元素的事件, 默认true
         */
        remove(node: Element, clearEvent = true) {
            if (node) {
                if (clearEvent) {
                    d.off(node);
                    d.queryAll('*', node).forEach(nd => {
                        d.off(nd);
                    })
                }
                node.parentNode && node.parentNode.removeChild(node);
            }
        },
        /**
         * 向上冒泡遍历查找与能与css选择器匹配的元素(包含自身),
         * @param {HTMLElement} target
         * @param {string} selector
         * @return {HTMLElement}
         */
        closest: function (target: HTMLElement, selector: string) {
            let tar = target;
            while (tar) {
                if (d.matches(tar, selector)) {
                    return tar;
                }
                tar = tar.parentElement;
            }
            return null;
        },
        /**
         * 查询匹配的集合
         * @param {string} selector
         * @param {NodeSelector} dom
         * @return {HTMLElement[]}
         */
        queryAll(selector: string, dom: NodeSelector|Window = document): HTMLElement[] {

            return Array.prototype.slice.call(<NodeListOf<HTMLElement>>(<NodeSelector>dom).querySelectorAll(selector), 0);
        },
        /**
         * 查询一个
         * @param {string} selector
         * @param {NodeSelector} dom
         * @return {HTMLElement}
         */
        query(selector: string, dom: NodeSelector|Window = document): HTMLElement {
            if(dom === window){
                dom = document;
            }
            return <HTMLElement>(<NodeSelector>dom).querySelector(selector);
        },
        /**
         * 往父元素最后附加一个元素
         * @param {Element} parent
         * @param {Node | string} child
         */
        append(parent: Element, child: Node | string) {
            if(typeof child === 'string'){
                child = document.createTextNode(child);
            }
            parent.appendChild(child);
        },
        /**
         * 往父元素第一个位置插入一个元素
         * @param {Element} parent
         * @param {Node | string} child
         */
        prepend(parent: Element, child: Node | string) {
            if(typeof child === 'string'){
                child = document.createTextNode(child);
            }
            parent.insertBefore(child, parent.firstElementChild)
        },
        /**
         * 在某个元素之前插入一个元素
         * @param {Element} ref
         * @param {Node | string} el
         */
        before(ref: Element, el:  Node | string) {
            if(typeof el === 'string'){
                el = document.createTextNode(el);
            }
            ref.parentNode.insertBefore(el, ref);
        },

        /**
         * 在某个元素之后插入一个元素
         * @param {Element} ref
         * @param {Node | string} el
         */
        after(ref: Element, el:  Node | string) {
            if(typeof el === 'string'){
                el = document.createTextNode(el);
            }
            ref.parentNode.insertBefore(el, ref.nextElementSibling);
        },
        /**
         * 将oldEl替换为newEl
         * @param {Element} newEl
         * @param {Element} oldEl
         */
        replace(newEl: Element, oldEl: Element) {
            oldEl.parentNode.replaceChild(newEl, oldEl);
        },

        /**
         * 设置el相对relEl的绝对定位位置, 使得el出现在relEl的下方
         * 调用该函数后，el会被放到body下
         * @param {HTMLElement} el
         * @param {HTMLElement} relEl
         * @param {boolean} [useRelWidth]
         */
        setPosition(el: HTMLElement, relEl: HTMLElement, useRelWidth = true) {
            if (el.parentNode !== document.body) {
                d.append(document.body, el);
            }
            let relRect = relEl.getBoundingClientRect();
            el.style.position = 'absolute';
            el.style.left = relRect.left + 'px';
            el.style.top = (relRect.top + relRect.height + 5) + 'px';
            el.style.zIndex = '1001';
            //是否将el的宽度设置为relEl的宽度
            if (useRelWidth) {
                el.style.width = relRect.width + 'px';
            }
        },
        off: event.off,
        on: event.on,
        once: event.once
    };
}