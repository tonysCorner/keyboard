;(function (win, id, factory) {
    "use strict";
    if (typeof (module) !== 'undefined' && module.exports) { // CommonJS
        module.exports = factory(id, win);
    } else if (typeof (define) === 'function' && define.amd ) { // AMD
        define(function () {
            return factory(id, win);
        });
    } else { // <script>
        win[id] = factory(id, win);
    }

})(window, 'SycKeyBoard', function (id, window) {

    var CONSTANTS = {
        SHOW_CLASS: 'show',
        HIDE_CLASS: 'hide',
        CLICK_EVENT : 'click',
        TOUCH_START_EVENT : 'touchstart',
        TOUCH_MOVE_EVENT : 'touchmove',
        TOUCH_END_EVENT : 'touchend',
        PARENT_CLASS : "main",
        KEYS : [
            '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
            'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
            'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
            'Z', 'X', 'C', 'V', 'B', 'N', 'M', '删除'
        ]
    };

    var blinkInterval ;

    function SycKeyBoard(tar, callback, maxLength) {
        if (tar === undefined) {
            throw "请绑定目标input"
        }
        this.tar = tar;
        this.callback = callback;
        this.maxLength = maxLength;
        this.fontSize = window.getComputedStyle(tar).fontSize;
        this.cursorWidth = 0;
        this.__value = [];
        this.targetMarginTop = 0;
        this.kbStatus = false;

        this.__addTargetEvent();

    }

    SycKeyBoard.prototype.__initKB = function () {
        this.__createKBWidget();
        this.__addKBEvent();
    };

    SycKeyBoard.prototype.getValue = function () {
        this.cursorWidthDom.innerHTML = this.__value.join("");
        this.cursorWidth = this.cursorWidthDom.offsetWidth;
        return this.__value.join("");
    };

    SycKeyBoard.prototype.setValue = function (value) {

        if (this.__value.length > this.maxLength - 1) {
            return
        }
        if (value instanceof Array) {
            this.__value = [];
            this.__value.concat(value)
        }else if (typeof value === 'string') {
            this.__value.push(value);
        } else {
            throw "无法设置正确的值!"
        }
        this.callback(this);
    };

    SycKeyBoard.prototype.shiftValue = function() {
        if(this.__value.length !== 0) {
            this.__value.pop();
        }
    };

    SycKeyBoard.prototype.clearValue = function() {
        if(this.__value.length !== 0) {
            this.__value = [];
        }
    };
    //初始化键盘dom样式,返回不同按键dom节点,以便后续绑定事件处理 ps:考虑到多个实例只需要公用同一个dom样式
    SycKeyBoard.prototype.__createKBWidget = function () {

        //说明页面存在键盘dom
        if (document.getElementsByClassName("keyboard").length > 0 ) {
            this.__removeKBWidget();
        }

        var KBDiv = document.createElement("div");
        KBDiv.className = 'kb_keyboard';

        var titleDiv = document.createElement("div"),
            titleLeftSpan = document.createElement("span"),
            titleRightSpan = document.createElement("span");

        titleDiv.className = 'kb_title';

        titleLeftSpan.className = 'kb_title_left';
        titleLeftSpan.innerHTML = '清除';
        titleDiv.appendChild(titleLeftSpan);

        titleRightSpan.className = 'kb_title_right';
        titleRightSpan.innerHTML = '确认';
        titleDiv.appendChild(titleRightSpan);

        KBDiv.appendChild(titleDiv);

        var keyUl = document.createElement("ul");

        CONSTANTS.KEYS.forEach(function (key) {
            var keyLi = document.createElement("li");

            keyLi.dataset['key'] = key;
            keyLi.innerHTML = key;
            keyUl.appendChild(keyLi);
        });

        KBDiv.appendChild(keyUl);

        document.body.appendChild(KBDiv);

        var maskDiv = document.createElement("div");
        maskDiv.className = 'kb_mask';
        document.body.appendChild(maskDiv);

        var cursorDiv = document.createElement("div");
        cursorDiv.className = 'kb_cursor';
        cursorDiv.innerHTML = '|';
        document.body.appendChild(cursorDiv);

        var cursorWidthDiv = document.createElement("div");
        cursorWidthDiv.className = 'kb_cursorWidthDiv';
        cursorWidthDiv.style.fontSize = this.fontSize;
        cursorWidthDiv.innerHTML = this.tar.value;
        document.body.appendChild(cursorWidthDiv);

        this.KBDom = KBDiv;
        this.maskDom = maskDiv;
        this.confirmDom = titleRightSpan;
        this.clearDom = titleLeftSpan;
        this.keyUlDom = keyUl;
        this.cursorDom = cursorDiv;
        this.cursorWidthDom = cursorWidthDiv;

    };
    //删除键盘dom节点
    SycKeyBoard.prototype.__removeKBWidget = function () {

        //先移除绑定事件
        this.__removeKBEvent();
        document.body.removeChild(this.KBDom);
        document.body.removeChild(this.maskDom);
        document.body.removeChild(this.cursorDom);
        document.body.removeChild(this.cursorWidthDom);

    };
    //显示键盘&背景遮罩
    SycKeyBoard.prototype.showKB = function () {

        if (this.kbStatus) {
            return;
        }

        this.__initKB();

        var KBDomClassList = this.KBDom.classList,
            maskDomClassList = this.maskDom.classList;
        this.__toggleClass(KBDomClassList, CONSTANTS.SHOW_CLASS, CONSTANTS.HIDE_CLASS);
        this.__toggleClass(maskDomClassList, CONSTANTS.SHOW_CLASS, CONSTANTS.HIDE_CLASS);
        this.__showCursor();
        this.kbStatus = true;

    };
    //隐藏键盘&背景遮罩
    SycKeyBoard.prototype.hideKB = function () {
        if (!this.kbStatus) {
            return;
        }

        var KBDomClassList = this.KBDom.classList,
            maskDomClassList = this.maskDom.classList;

        this.__toggleClass(KBDomClassList, CONSTANTS.HIDE_CLASS, CONSTANTS.SHOW_CLASS);
        this.__toggleClass(maskDomClassList, CONSTANTS.HIDE_CLASS, CONSTANTS.SHOW_CLASS);
        this.__hideCursor();
        this.__removeKBWidget();
        this.kbStatus = false;

    };

    SycKeyBoard.prototype.__addTargetEvent = function () {
        var tar     = this.tar,
            that       = this;

        tar.addEventListener(CONSTANTS.TOUCH_START_EVENT, function (e) {
            e.preventDefault();
            adjustPage();
            that.showKB();
        }, false);
    };
    //获取dom节点,绑定响应事件
    SycKeyBoard.prototype.__addKBEvent = function () {
        var tar     = this.tar,
            maskDom    = this.maskDom,
            keyUlDom   = this.keyUlDom,
            clearDom   = this.clearDom,
            confirmDom = this.confirmDom,
            that       = this;


        maskDom.addEventListener(CONSTANTS.TOUCH_END_EVENT, function(e) {
            e.preventDefault();
            that.hideKB();
        }, false);

        keyUlDom.addEventListener(CONSTANTS.TOUCH_START_EVENT, function(e) {
            e.preventDefault();
            //debugger;
            if (e.target.nodeName.toUpperCase() === 'LI' && e.target.dataset['key'] !== '删除') {
                that.setValue(e.target.dataset['key']);
            } else if (e.target.nodeName.toUpperCase() === 'LI' && e.target.dataset['key'] === '删除') {
                that.shiftValue();
            }
            tar.value = that.getValue();
            that.__updateCursor();
            //console.log(that.getValue());
        }, false);

        clearDom.addEventListener(CONSTANTS.TOUCH_START_EVENT, function(e) {
            e.preventDefault();
            that.clearValue();
            tar.value = that.getValue();
            that.__updateCursor();
        }, false);

        confirmDom.addEventListener(CONSTANTS.TOUCH_START_EVENT, function(e) {
            e.preventDefault();
            that.hideKB();
        }, false)


    };
    //删除dom响应事件
    SycKeyBoard.prototype.__removeKBEvent = function () {

    };
    //初始光标
    SycKeyBoard.prototype.__showCursor = function () {
        if (blinkInterval !== undefined) {
            clearInterval(blinkInterval);
        }
        var tar = this.tar,
            cursorDom = this.cursorDom;
        var fontSize = this.fontSize;
        this.targetMarginTop = getChildToParentTop(CONSTANTS.PARENT_CLASS, tar);

        //判断屏幕是否需要上移
        setDocumentMoveUp(this.targetMarginTop);

        cursorDom.style.top  = this.targetMarginTop + "px";
        cursorDom.style.left = this.cursorWidth + getChildToParentLeft(CONSTANTS.PARENT_CLASS, tar) + "px";
        cursorDom.style.fontSize = fontSize;

        this.__toggleClass(cursorDom.classList, "show", "hide");
        this.__blinkCursor();

    };

    SycKeyBoard.prototype.__updateCursor = function () {
        //debugger;
        var tar = this.tar,
            cursorDom = this.cursorDom;

        if (this.cursorWidth > this.tar.clientWidth) {
            this.__hideCursor();
        } else {
            this.__showCursor();
            cursorDom.style.left = this.cursorWidth + getChildToParentLeft(CONSTANTS.PARENT_CLASS, tar) + "px";
        }

    };
    //删除光标事件
    SycKeyBoard.prototype.__hideCursor = function () {
        if (blinkInterval !== undefined) {
            clearInterval(blinkInterval);
        }
        this.__toggleClass(this.cursorDom.classList, "hide", "show");
        setDocumentMoveUp(0);
    };
    //光标闪烁
    SycKeyBoard.prototype.__blinkCursor = function () {
        var that = this,
            cursorDom = this.cursorDom;

        blinkInterval = setInterval(function(e){
            that.__toggleClass(cursorDom.classList, "hide", "show");

            setTimeout(function(e){
                that.__toggleClass(cursorDom.classList, "show", "hide");
            }, 300)
        }, 1000)
    };

    SycKeyBoard.prototype.__toggleClass = function (classList, targetClass, sourceTarget) {
        if (classList.contains(sourceTarget)) {
            classList.remove(sourceTarget);
        }

        if (!classList.contains(targetClass)) {
            classList.add(targetClass);
        }
    };

    function adjustPage() {
        window.scrollTo(0,0);
        var inputDomArr = document.getElementsByTagName("input");
        for (var i = 0, lth = inputDomArr.length; i < lth; i ++) {
            inputDomArr[i].blur();
        }
    }

    function setDocumentMoveUp(distance) {
        var screenHeight = document.body.offsetHeight;

        if (distance === 0) {
            document.body.style.marginTop = 0;
        } else if (distance > screenHeight / 2){
            document.body.style.marginTop = "-"  + screenHeight / 2 + "px";
        }

    }

    function getChildToParentLeft(parentClassName, target){

        var left = 0;

        if (target.offsetParent.classList.contains(parentClassName)) {
            left = target.clientLeft + target.offsetLeft;
        } else if (target.offsetParent.offsetParent && target.offsetParent.offsetParent.classList.contains(parentClassName)) {
            left = target.clientLeft + target.offsetLeft + target.offsetParent.clientLeft + target.offsetParent.offsetLeft;
        } else {
            throw "relative层级超过上级,请坐特殊处理"
        }
        return left;
    }

    function getChildToParentTop(parentClassName, target){
        var top = 0;

        if (target.offsetParent.classList.contains(parentClassName)) {
            top = target.clientTop + target.offsetTop;
        } else if (target.offsetParent.offsetParent && target.offsetParent.offsetParent.classList.contains(parentClassName)) {
            top = target.clientTop + target.offsetTop + target.offsetParent.clientTop + target.offsetParent.offsetTop;
        } else {
            throw "relative层级超过上级,请坐特殊处理"
        }
        return top;
    }

    return SycKeyBoard;

});





