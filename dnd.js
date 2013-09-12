/**
 * @fileOverview 拖拽组件
 *      支持绑定多个源节点和多个目标节点
 *      支持设置一次拖动单独一个节点
 *      支持设置拖动的代理
 *      如果没有绑定目标节点的话，则采用只有drag的模式，没有drop
 *      支持设置自动返回原本位置
 *      支持手柄式拖动
 *      支持一些拖动的样式作为视觉反馈
 *      支持dragStart dragMove dragEnd dropIn dropOut drop事件
 *      支持手动注销事件
 *      <b>注：目前需限制handler为source的一级子节点，否则程序出错</b>
 *      用法：var dnd = new DnD(source, options);
 * @param {string} source 源节点，传入选择器字符串（必须）
 * @param {object} options 配置参数，详细配置如下：
 *                   @param {string} target 目标节点，选择器字符串，如果为空则为drag模式，如果为类选择器则绑定多个节点；
 *                   @param {string} handler 手柄节点，选择器字符串，如果为空则整个源节点都可以拖动；
 *                   @param {striing} proxy 代理节点，选择器字符串，如果为空则拖动源节点，否则拖动代理节点；
 *                   @param {boolean} isRevert 是否自动返回原位置；
 *                   @param {boolean} isMultiDrag 是否支持同时拖动多个源节点；
 *                   @param {fuction} onDragStart 拖动开始的响应函数；
 *                                   @param {jQuery object} $source 源节点
 *                                   @param {jQuery object} $targets 目标节点集合（如果有的话）
 *                   @param {fuction} onDragMove 拖动中的响应函数；
 *                                   @param {jQuery object} $source 源节点
 *                                   @param {jQuery object} $targets 目标节点集合（如果有的话）
 *                   @param {fuction} onDragEnd 拖动结束的响应函数；
 *                                   @param {jQuery object} $source 源节点
 *                                   @param {jQuery object} $targets 目标节点集合（如果有的话）
 *                   @param {fuction} onDropIn 源节点被拖进目标节点时响应；
 *                                   @param {jQuery object} $source 源节点
 *                                   @param {jQuery object} $target 目标节点
 *                   @param {fuction} onDropOut 源节点被拖出目标节点时响应；
 *                                   @param {jQuery object} $source 源节点
 *                                   @param {jQuery object} $target 目标节点
 *                   @param {fuction} onDrop 源节点在目标节点内释放时响应；
 *                                   @param {jQuery object} $source 源节点
 *                                   @param {jQuery object} $target 目标节点
 *                   @param {string} hoverClass 拖动源节点在目标节点里面时，目标节点的样式；
 *                   @param {string} activeClass 拖动源节点在目标节点外面时，目标节点的样式；
 * @example var dnd = new DnD(".sourceEle", {
 *               "target" : ".targetEle",
 *               "handler" : ".handlerEle",
 *               "isMultiDrag" : false,
 *               "onDrop" : function($source, $target){
 *                   // this.destory();
 *               },
 *               "hoverClass" : "hoverTarget",
 *               "activeClass" : "activeTarget"
 *           });
 * @version 0.0.1
 * @author zhuxiaohua
 * @date 2013-09-10
 * @todo 
 *      1.修复在css中设定bottom或者right会导致源元素返回的位置有错的bug；
 *      2.设置拖动的模式为复制、剪切、移动;
 */


var DnD = function(ele, opt){
    var _dnd = {
        init: function(element, options){
            var defaults = {
                "source" : element,
                "ele" : null,
                "target" : null,
                "handler" : null,
                "proxy" : null,
                "isRevert" : true,
                "isMultiDrag" : true,
                "onDragStart" : null,
                "onDragMove" : null,
                "onDragEnd" : null,
                "onDropIn" : null,
                "onDropOut" : null,
                "onDrop" : null,
                "hoverClass" : null,
                "activeClass" : null,
                "_oldEle" : null,
                "_revert" : true,
                "_isCatch" : false,
                "_lastPointer": {
                    "x" : 0,
                    "y" : 0
                },
                "_oldCssPosition" : {},
                "_targetRect" : [],
                "_inOutCount" : [],
                "_eleCollection" : []
            };
            $.extend(defaults, options);
            $.extend(this, defaults);
            if(!this.source){
                return false;
            }
            this.ele = this.source;
            $(this.ele).attr("data-dragged", "false");
            if(!this.handler){
            	this.handler = this.ele;
            }
            this._oldEle = this.ele;

            //组装_eleCollection
            this.bindElement();

            if(this.target){
                $(this.target).each(function(index, item){
                    _dnd._targetRect[index] = {
                        "x" : $(item).offset().left,
                        "y" : $(item).offset().top,
                        "w" : $(item).outerWidth(),
                        "h" : $(item).outerHeight()
                    };
                });   
            }
            for(var i = 0; i < $(this.target).length; i++){
                this._inOutCount[i] = {
                    "in" : 0,
                    "out" : 0
                };
            }
            this._revert = this.isRevert;

            if(this._revert){
            	this._oldCssPosition = {
            		"position" : $(this._oldEle).css("position"),
            		"offsetTop" : $(this._oldEle).offset().top,
            		"offsetLeft" : $(this._oldEle).offset().left,
                    "top" : $(this._oldEle).css("top"),
                    "left" : $(this._oldEle).css("left"),
                    "bottom" : $(this._oldEle).css("bottom"),
                    "right" : $(this._oldEle).css("right")
            	};
            }
            $(this.handler)
                .css({
                    "user-select" : "none"
                })
                .hover(function(){
                	$(this).css("cursor", "move");
                }, function(){
                	$(this).css("cursor", "default");
                });

            this.create();
        },

        /*
         * 绑定事件
         * @return {void}
         */
        create: function(){
            $(this.handler).bind('mousedown', $.proxy(this.dragStart, this));
            $(document).bind('mouseup', $.proxy(this.dragEnd, this));
            $(document).bind('mousemove', $.proxy(this.dragMove, this));
        },

        /*
         * 绑定source handler proxy这三个节点到_eleCollection中
         * @return {void}
         */
        bindElement: function(){
            var _source = $(this.source),
                _handler = $(this.handler),
                _proxy = "";
            var _sourceLen = _source.length,
                _handlerLen = _handler.length,
                _proxyLen = 0;
            if(this.proxy){
                _proxy = $(this.proxy);
                _proxyLen = _proxy.length;
            }
            var _sourceItem, _handlerItem, _proxyItem;
            for(var u = 0; u < _sourceLen; u++){
                $(_handler[u]).attr("data-handlerid", u);
                _sourceItem = $(_source[u]);
                _handlerItem = _sourceLen == _handlerLen? $(_handler[u]) : $(_handler[0]);
                if(this.proxy){
                    _proxyItem = _sourceLen == _proxyLen ? $(_proxy[u]) : $(_proxy[0]);
                }else{
                    _proxyItem = "";
                }
                this._eleCollection[u] = {
                    "source" : _sourceItem,
                    "handler" : _handlerItem,
                    "proxy" : _proxyItem
                };
            }
        },

        /*
         * mousedown响应函数
         * @param {object} event
         * @return {void}
         */
        dragStart: function(evt){
        	if(evt.which != 1){ //如果点击的不是鼠标左键
        		return ;
        	}
        	evt.preventDefault();
            this._isCatch = true;
            this._lastPointer.x = evt.pageX;
            this._lastPointer.y = evt.pageY;

            //设置标志位，标记哪一个源节点是被点击的
            var eleIndex = $(evt.target).attr("data-handlerid");
            this._eleCollection[eleIndex].source.attr("data-dragged", "true");
            

            //如果不是多节点拖动，则设置this.ele为当前点击的节点
            if(!this.isMultiDrag){
                this.ele = this.source+'[data-dragged=\"true\"]';
            }

            this._oldEle = this.ele;
            if(this.proxy){
                if(this.isMultiDrag){
                    this.ele = this.proxy;
                }else{
                    this.ele = this._eleCollection[eleIndex].proxy;
                }
                
                //有些proxy是设置为隐藏的节点，在拖动的时候需要显示出来
                //让proxy获得source节点的位置信息
                $(this.ele).css({
                    "display" : "block",
                    "position" : "absolute"
                });
                $(this.ele).offset({
                    "top" : $(this._oldEle).offset().top,
                    "left" : $(this._oldEle).offset().left
                });
            }

            if($(this.ele).css("position") == "static"){
                $(this.ele).css("position", "relative");
            }

            //将所有源节点重叠到一起来拖动
            var gapTop = 8, gapLeft = 8,
                draggedEleTop = $(evt.target).offset().top,
                draggedEleLeft = $(evt.target).offset().left;
            $(this.ele).each(function(_index, _item){
                $(_item).offset({
                    "top" : draggedEleTop,
                    "left" : draggedEleLeft
                });
                draggedEleTop += gapTop;
                draggedEleLeft += gapLeft;
            });

            if(this.target && this.activeClass){
                $(this.target).addClass(this.activeClass);
            }

            if(this.onDragStart){
                if(this.target){
                    this.onDragStart($(this._oldEle), $(this.target));
                }else{
                    this.onDragStart($(this._oldEle));
                }
            }
        },

        /*
         * mouseup响应函数
         * @param {object} event
         * @return {void}
         */
        dragEnd: function(evt){	
            if(this._isCatch){
                if(evt.which != 1){ //如果点击的不是鼠标左键
                    return ;
                }
                var pX = evt.pageX, pY = evt.pageY;
                evt.preventDefault();
                if(this._revert){
                    this.revertToOldPosition();
                }else if(this.proxy){
                    //将source移动到当前位置，同时让proxy隐藏         
                    $(this._oldEle).offset({
                        "top" : pY,
                        "left" : pX
                    });
                    $(this.ele).css("display", "none");
                }

                if(this.target && this.activeClass){
                    $(this.target).removeClass(this.activeClass);
                    if(this.hoverClass){
                        $(this.target).removeClass(this.hoverClass);
                    }
                }

                //判断是否在目标节点内释放鼠标
                if(this.target){
                    for(var k = 0; k < this._targetRect.length; k++){
                        if(this.checkInTarget(pX, pY, k)){
                            this.drop(k);
                            break;
                        }
                    }
                }

                if(this.onDragEnd){
                    if(this.target){
                        this.onDragEnd($(this._oldEle), $(this.target));
                    }else{
                        this.onDragEnd($(this._oldEle));
                    }
                }
                this._isCatch = false;
            }

            //重置标志位和this.ele
            $(this.source).attr("data-dragged", "false");
            this.ele = this.source;
        },

        /*
         * mousemove响应函数
         * @param {object} event
         * @return {void}
         */
        dragMove: function(evt){
        	evt.preventDefault();
            if(this._isCatch){
            	var pX = evt.pageX;
            	var pY = evt.pageY;
            	var _ele = $(this.ele);
                var distanceTop, distanceLeft;
                
                _ele.each(function(_index, _item){
                    var element = $(_item);
                    distanceTop = element.offset().top + pY - _dnd._lastPointer.y;
                    distanceLeft = element.offset().left + pX - _dnd._lastPointer.x;
                    element.offset({
                        "top" : distanceTop,
                        "left" : distanceLeft
                    });
                });
                 
                this._lastPointer.x = pX;
                this._lastPointer.y = pY;
                //拖拽到目标节点上时
                if(this.target){
                    this._revert = this.isRevert;
                    var _target = $(this.target);
                    for(var j = 0; j < _target.length; j++){
                        if(this.checkInTarget(pX, pY, j)){
                            this.dropIn(j);
                        }else{
                            this.dropOut(j);
                        }
                    }
                }

                if(this.onDragMove){
                    if(this.target){
                        this.onDragMove($(this._oldEle), $(this.target));
                    }else{
                        this.onDragMove($(this._oldEle));
                    }
                }
            } 
        },

        /*
         * 源节点被拖进目标节点时的响应函数
         * @param {integer} index 第几个目标节点
         * @return {void}
         */
        dropIn: function(index){
            this._revert = false;

            this._inOutCount[index].in++;
            //判断是否从目标外拖到目标内
            if(this._inOutCount[index].in >0 && this._inOutCount[index].out > 0){
                if(this.hoverClass){
                    if(this.activeClass){
                        $($(this.target)[index]).removeClass(this.activeClass);
                    }
                    $($(this.target)[index]).addClass(this.hoverClass);
                }
                if(this.onDropIn){
                    this.onDropIn($(this._oldEle), $($(this.target)[index]));
                }
                this._inOutCount[index].out = 0;
            }         
        },

        /*
         * 源节点被拖出目标节点时的响应函数
         * @param {integer} index 第几个目标节点
         * @return {void}
         */
        dropOut: function(index){
            /*if(this.isRevert){
                this._revert = true;
            }*/

            this._inOutCount[index].out++;
            //判断是否从目标内拖到目标外
            if(this._inOutCount[index].in >0 && this._inOutCount[index].out > 0){
                if(this.hoverClass){
                    if(this.activeClass){
                        $($(this.target)[index]).addClass(this.activeClass);
                    }
                    $($(this.target)[index]).removeClass(this.hoverClass);
                }
                if(this.onDropOut){
                    this.onDropOut($(this._oldEle), $($(this.target)[index]));
                }
                this._inOutCount[index].in = 0;
            } 
        },

        /*
         * 源节点在目标节点里释放时的响应函数
         * @param {integer} index 第几个目标节点
         * @return {void}
         */
        drop: function(index){
            if(this.onDrop){
                this.onDrop($(this._oldEle), $($(this.target)[index]));
            }
        },

        /*
         * 判断鼠标指针是否在目标节点内
         * @param {integer} x 鼠标x坐标
         * @param {integer} y 鼠标y坐标
         * @param {integer} index 第几个目标节点
         * @return {boolean} 是否
         */
        checkInTarget: function(x, y, index){
            if(!this.target){
                return false;
            }
            var left = this._targetRect[index].x,
                top = this._targetRect[index].y,
                right = this._targetRect[index].x + this._targetRect[index].w,
                bottom = this._targetRect[index].y + this._targetRect[index].h;
            if(x >= left && x <= right && y >= top && y <= bottom){
                return true;
            }else{
                return false;
            }
        },

        /*
         * 源节点返回原本的位置
         * @return {void}
         */
        revertToOldPosition: function(){
            /*this.animateTo($(this.ele), this._oldCssPosition.top, this._oldCssPosition.left, 500, function(){
                $(this.ele).css({
                    "position" : _dnd._oldCssPosition.position,
                    "top" : _dnd._oldCssPosition.top,
                    "left" : _dnd._oldCssPosition.left,
                    "bottom" : _dnd._oldCssPosition.bottom,
                    "right" : _dnd._oldCssPosition.right
                });
            });*/
            var cssObj = {};
            var _oldTop, _oldLeft;
            var _position = this._oldCssPosition.position;
            if(_position == "relative" || _position == "static"){
                cssObj.top = this._oldCssPosition.top == "auto"? 0 : this._oldCssPosition.top;
                cssObj.left = this._oldCssPosition.left == "auto"? 0 : this._oldCssPosition.left;
            }else if(_position == "absolute" || _position == "fixed"){
                var autoCount = 0,
                    cssArray = ["top", "left", "bottom", "right"],
                    positionArray = [this._oldCssPosition.top, this._oldCssPosition.left, this._oldCssPosition.bottom, this._oldCssPosition.right];
                for(var i = 0; i < 4; i++){
                        cssObj[cssArray[i]] = positionArray[i];
                }//这里的bug是：如果position为absolute，而且设置了bottom或者right，则bottom或者right不能变化
                if(autoCount == 4){ //在absolute的情况下，如果四个方向都是auto，浏览器默认位置为节点出现的位置
                    cssObj = {
                        "top" : 0,
                        "left" : 0
                    };
                }
            }else{
                return;
            }

            $(this.ele).animate(cssObj, 500, function(){
                //回归原本的css属性
                $(this._oldEle).css({
                    "position" : _dnd._oldCssPosition.position,
                    "top" : _dnd._oldCssPosition.top,
                    "left" : _dnd._oldCssPosition.left,
                    "bottom" : _dnd._oldCssPosition.bottom,
                    "right" : _dnd._oldCssPosition.right
                });
                if(_dnd.proxy){
                    $(this).css("display", "none");
                }
            });
        },

        /*
         * 通过offsetTop和offsetLeft来进行的移动动画
         * 因为jQuery的animate函数不支持offsetTop和offsetLeft，所以我自己写了一个
         * @param {jQuery Object} $elem 要移动的节点
         * @param {integer} offsetTop 纵坐标
         * @param {integer} offsetLeft 横坐标
         * @param {integer} runtime 动画的持续时间，单位毫秒
         * @param {function} callback 回调函数
         * @return {void}
         */
        animateTo: function($elem, offsetTop, offsetLeft, runtime, callback){
            var duration = 10; //单步是10毫秒
            var count = runtime / duration; //执行的步数
            var remainTime = runtime % duration;
            var oldTop = $elem.offset().top;
            var oldLeft = $elem.offset().left;
            if(!(offsetTop - oldTop) && !(offsetLeft - oldLeft)){
                return;
            }
            var topStep = (offsetTop - oldTop) / count;
            var remainTopStep = (offsetTop - oldTop) % count;
            var leftStep = (offsetLeft - oldLeft) / count;
            var remainLeftStep = (offsetLeft - oldLeft) % count;

            var step = 1;
            window.animateTimer  = setInterval(function(){
                if(step < count){
                    oldTop+=topStep;
                    oldLeft+=leftStep;
                    $elem.offset({
                        "top" : oldTop,
                        "left" : oldLeft
                    });
                    step++;
                }else if(step == count){
                    oldTop+=topStep;
                    oldLeft+=leftStep;
                    $elem.offset({
                        "top" : oldTop,
                        "left" : oldLeft
                    });
                    clearInterval(window.animateTimer);
                    window.animateTimeout = setTimeout(function(){
                        oldTop+=remainTopStep;
                        oldLeft+=remainLeftStep;
                        $elem.offset({
                            "top" : oldTop,
                            "left" : oldLeft
                        });
                        clearTimeout(window.animateTimeout);
                        if(callback){
                            callback();
                        }
                    }, remainTime);
                }
            }, duration);
        },

        /*
         * 事件解绑和相应的对象注销
         * @return {void}
         */
        destroy: function(){
            $(this.handler)
                .css({
                    "user-select" : "auto"
                })
                .off('mouseenter mouseleave')
                .unbind('mousedown', this.dragStart);
            $(document).unbind('mouseup', this.dragEnd);
            $(document).unbind('mousemove', this.dragMove);
        }
    };

    _dnd.init(ele, opt);
    return _dnd;
};