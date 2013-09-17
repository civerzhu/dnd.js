var DnDManager = (function(){
	var _dndManger = {
		draggers: [],
		droppers: [],
        draggerGroup: [],
        groupMap: [],
		init: function(){
		},
		addDragger: function(dragger){
			this.draggers.push(dragger);
			var dragID = this.draggers.length - 1;
			return dragID;
		},
		addDropper: function(dropper){
			this.droppers.push(dropper);
			var dropID = this.droppers.length - 1;
			return dropID;
		},
		deleteDragger: function(dragID){
			if(dragID >= 0){
				this.draggers[dragID] = undefined;
			}
		},
		deleteDropper: function(dropID){
			if(dropID >= 0){
				this.droppers[dropID] = undefined;
			}
		},
		getDragger: function(dragID){
			var result;
			if(!dragID && dragID !== 0){
				result = this.draggers;
			}else if(this.draggers[dragID]){
				result = this.draggers[dragID];
			}else{
				if(this.draggers[0]){
					result = this.draggers[0];
				}else{
					result = [];
				}
			}
			return $.makeArray(result);
		},
		getDropper: function(dropID){
			var result;
			if(!dropID && dropID !== 0){
				result = this.droppers;
			}else if(this.droppers[dropID]){
				result = this.droppers[dropID];
			}else{
				if(this.droppers[0]){
					result = this.droppers[0];
				}else{
					result = [];
				}
			}
			return $.makeArray(result);
		},
        bindGroup: function(draggers){
            if(!draggers.length || draggers.length == 1){
                return -1;
            }
            for(var i = 0; i < draggers.length; i++){
                if(this.groupMap[draggers[i].draggerID]){
                    //同一个dragger不能重复绑定到多个组中去
                    return -1;
                    break;
                }
            }
            this.draggerGroup.push(draggers);
            var groupId = this.draggerGroup.length -1;
            for(var j = 0; j < draggers.length; j++){
                this.groupMap[draggers[j].draggerID] = groupId;
            }
            return groupId;
        },
        unbindGroup: function(groupId){
            if(groupId == -1){
                return;
            }
            for(var t = 0; t < this.draggerGroup[groupId].length; t++){
                var index = this.draggerGroup[groupId][t].draggerID;
                this.groupMap[index] = undefined;
            }
            if(this.draggerGroup[groupId]){
                this.draggerGroup[groupId] = undefined;
            }
        },
        getGroup: function(dragger){
            var result = [];
            var _groupId = this.groupMap[dragger.draggerID];
            if(_groupId !== undefined && _groupId != -1){
                result = this.draggerGroup[_groupId];
            }else{
                result.push(dragger);
            }
            return result;
        }
	};
	_dndManger.init();
	return _dndManger;
})();





var Dragger = function(ele, opt){
	var _dragger = {
		init: function(element, options){
			var defaults = {
				"ele": element,
				"dragEle" : null,
				"dropEle" : null,
				"handler" : null,
				"proxy" : null,
				"data" : null,
				"effectAllowed" : "move",
				"isRevert" : true,
				"draggerID" : -1,
				"ondragstart" : null,
				"ondragmove" : null,
                "ondragend" : null,
                "_isCatch" : false,
                "_revert" : true,
                "_cloneDragEle" : null,
                "_lastPointer": {
                    "x" : 0,
                    "y" : 0
                },
                "_originalPosition" : {}
			};
			$.extend(defaults, options);
            $.extend(this, defaults);
            if(!this.ele){
                return false;
            }
            this.ele = $(this.ele[0]);
            this.dragEle = this.ele;
            if(this.handler){
            	this.handler = $(this.handler[0]);
            }else{
            	this.handler = this.dragEle;
            }

            this._cloneDragEle = this.ele.clone().unbind("mousedown").css({
            	"display" : "none",
            	"position" : "absolute"
            });
            $("body").append(this._cloneDragEle);

            this._revert = this.isRevert;
            

            if(this._revert){
            	this._originalPosition = {
                    "position" : this.dragEle.css("position"),
                    "offsetTop" : this.dragEle.offset().top,
                    "offsetLeft" : this.dragEle.offset().left,
                    "top" : this.dragEle.css("top"),
                    "left" : this.dragEle.css("left"),
                    "bottom" : this.dragEle.css("bottom"),
                    "right" : this.dragEle.css("right")
                };
            }

            this.handler.css({
                "user-select" : "none"
            })
            .hover(function(){
                $(this).css("cursor", "move");
            }, function(){
                $(this).css("cursor", "default");
            });

            this.create();
            this.register();
		},

		create: function(){
            this.handler.bind('mousedown', $.proxy(this.dragStart, this));
            $(document).bind('mouseup', $.proxy(this.dragEnd, this));
            $(document).bind('mousemove', $.proxy(this.dragMove, this));
        },

        register: function(){
            this.draggerID = DnDManager.addDragger(this);
        },

        dragStart: function(evt){
        	if(evt.which != 1){ //如果点击的不是鼠标左键
                return ;
            }
            evt.preventDefault();
            evt.stopPropagation();
            this._isCatch = true;
            this._lastPointer.x = evt.pageX;
            this._lastPointer.y = evt.pageY;

            if(this.proxy){
            	this.proxy.css({
            		"display" : "block",
                    "position" : "absolute"
            	});
            	this.proxy.offset({
            		"top" : this.ele.offset().top,
                    "left" : this.ele.offset().left
            	});
            	this.dragEle = this.proxy;
            }else{
    			this._cloneDragEle.offset({
    				"top" : this.ele.offset().top,
    				"left" : this.ele.offset().left
    			});
    			this._cloneDragEle.css("display", "block");
    			this.dragEle = this._cloneDragEle;
            }

            if(this.effectAllowed == "move"){
            	this.ele.css("visibility", "hidden");
            }else if(this.effectAllowed == "copy"){
            	// do nothing...
            }

            //通过DnDManager获得dropEle
            this.dropEle = DnDManager.getDropper();

            if(this.dropEle && this.dropEle.length){
            	for(var n = 0; n < this.dropEle.length; n++){
            		this.dropEle[n].addStyle("active");
            	}
            }

            if(this.ondragstart){
            	this.ondragstart(this.ele);
            }
        },


        dragEnd: function(evt){
        	if(this._isCatch){
        		if(evt.which != 1){ //如果点击的不是鼠标左键
                    return ;
                }
                var pX = evt.pageX, pY = evt.pageY;
                evt.preventDefault();
	            if(this._revert){
	            	if(this.proxy){
	            		if(this.effectAllowed == "copy"){
	            			this.revertToOldPosition(function(){
	            				_dragger.proxy.hide();
	            			});
	            		}else if(this.effectAllowed == "move"){
	            			this.revertToOldPosition(function(){
	            				_dragger.ele.css("visibility", "visible");
	            				_dragger.proxy.hide();
	            			});
	            		}
	            	}else{
	            		if(this.effectAllowed == "copy"){
	            			this.revertToOldPosition(function(){
	            				_dragger._cloneDragEle.css("display", "none");
	            			});
	            		}else if(this.effectAllowed == "move"){
	            			this.revertToOldPosition(function(){
	            				_dragger._cloneDragEle.css("display", "none");
	            				_dragger.ele.css("visibility", "visible");
	            			});
	            		}
	            	}
	            }else{
	            	if(this.proxy){
	            		if(this.effectAllowed == "copy"){
	            			this.ele.offset({
	            				"top" : this.dragEle.offset().top,
	            				"left" : this.dragEle.offset().left
	            			});
	            			this.dragEle.hide();
	            		}else if(this.effectAllowed == "move"){
	            			this.ele.offset({
	            				"top" : this.dragEle.offset().top,
	            				"left" : this.dragEle.offset().left
	            			});
	            			this.ele.css("visibility", "visible");
	            			this.dragEle.hide();
	            		}
	            	}else{
	            		if(this.effectAllowed == "copy"){
	            			this.ele.offset({
	            				"top" : this.dragEle.offset().top,
	            				"left" : this.dragEle.offset().left
	            			});
	            			this.dragEle.hide();
	            		}else if(this.effectAllowed == "move"){
	            			this.ele.offset({
	            				"top" : this.dragEle.offset().top,
	            				"left" : this.dragEle.offset().left
	            			});
	            			this.ele.css("visibility", "visible");
	            			this.dragEle.hide();
	            		}
	            	}
	            }

                if(this.dropEle && this.dropEle.length){
                	for(var j = 0; j < this.dropEle.length; j++){
                		this.dropEle[j].removeStyle("active");
                		this.dropEle[j].removeStyle("hover");
                		//判断是否在目标节点内释放鼠标
                		if(this.checkInDrop(pX, pY, j)){
                			this.dropEle[j].drop(this.ele, this.data);
                		}
                	}
                }

                if(this.ondragend){
                	this.ondragend(this.ele);
                }
                this._isCatch = false;
                this.dragEle = this.ele;
        	}
        },


        dragMove: function(evt){
        	evt.preventDefault();
            if(this._isCatch){
            	var pX = evt.pageX;
                var pY = evt.pageY;
                var _dragEle = this.dragEle;
                var distanceTop, distanceLeft;
                distanceTop = _dragEle.offset().top + pY - this._lastPointer.y;
                distanceLeft = _dragEle.offset().left + pX - this._lastPointer.x;
                _dragEle.offset({
                	"top" : distanceTop,
                	"left" : distanceLeft
                });
                this._lastPointer.x = pX;
                this._lastPointer.y = pY;
                //拖拽到目标节点上时
                if(this.dropEle && this.dropEle.length){
                	this._revert = this.isRevert;
                	for(var k = 0; k < this.dropEle.length; k++){
                		if(this.checkInDrop(pX, pY, k)){
                			this.dropEle[k].dropIn(this.ele);
                			this._revert = false;
                		}else{
                			this.dropEle[k].dropOut(this.ele);
                		}
                	}
                }

                if(this.ondragmove){
                	this.ondragmove(this.ele);
                }
            }
        },


        checkInDrop: function(x, y, index){
        	if(!this.dropEle || !this.dropEle.length){
        		return false;
        	}
        	var left = this.dropEle[index].rect.x,
                top = this.dropEle[index].rect.y,
                right = this.dropEle[index].rect.x + this.dropEle[index].rect.w,
                bottom = this.dropEle[index].rect.y + this.dropEle[index].rect.h;
            if(x >= left && x <= right && y >= top && y <= bottom){
                return true;
            }else{
                return false;
            }
        },

        revertToOldPosition: function(callback){
            /*this.animateTo($(this.ele), this._originalPosition.top, this._originalPosition.left, 500, function(){
                $(this.ele).css({
                    "position" : _dragger._originalPosition.position,
                    "top" : _dragger._originalPosition.top,
                    "left" : _dragger._originalPosition.left,
                    "bottom" : _dragger._originalPosition.bottom,
                    "right" : _dragger._originalPosition.right
                });
            });*/
            var cssObj = {};
            var _oldTop, _oldLeft;
            var _position = this._originalPosition.position;
            if(_position == "relative" || _position == "static"){
                cssObj.top = this._originalPosition.top == "auto"? 0 : this._originalPosition.top;
                cssObj.left = this._originalPosition.left == "auto"? 0 : this._originalPosition.left;
            }else if(_position == "absolute" || _position == "fixed"){
                var autoCount = 0,
                    cssArray = ["top", "left", "bottom", "right"],
                    positionArray = [this._originalPosition.top, this._originalPosition.left, this._originalPosition.bottom, this._originalPosition.right];
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

            this.dragEle.animate(cssObj, 500, function(){
                //回归原本的css属性
                _dragger.ele.css({
                    "position" : _dragger._originalPosition.position,
                    "top" : _dragger._originalPosition.top,
                    "left" : _dragger._originalPosition.left,
                    "bottom" : _dragger._originalPosition.bottom,
                    "right" : _dragger._originalPosition.right
                });
                if(callback){
                	callback();
                }
                /*if(_dragger.proxy){
                    _dragger.proxy.css("display", "none");
                }*/
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

        destroy: function(){
            this.handler.css({
                "user-select" : "auto"
            })
            .off('mouseenter mouseleave')
            .unbind('mousedown', this.dragStart);
            $(document).unbind('mouseup', this.dragEnd);
            $(document).unbind('mousemove', this.dragMove);
            DnDManager.deleteDragger(this.draggerID);
        }
	};


	_dragger.init(ele, opt);
	return _dragger;
};




var Dropper = function(ele, opt){
	var _dropper = {
		init: function(element, options){
			var defaults = {
				"ele" : element,
				"ondropin" : null,
				"ondropout" : null,
				"ondrop" : null,
				"hoverClass" : null,
				"activeClass" : null,
				"dropperID" : -1,
				"rect" : null
			};
			$.extend(defaults, options);
            $.extend(this, defaults);

            if(!this.ele){
            	return false;
            }
            this.ele = $(this.ele[0]);

            this.rect = {
            	"x" : this.ele.offset().left,
            	"y" : this.ele.offset().top,
            	"w" : this.ele.outerWidth(),
            	"h" : this.ele.outerHeight()
            };

            this.register();
		},

		register: function(){
            this.dropperID = DnDManager.addDropper(this);
        },

        dropIn: function(dragEle){
        	this.removeStyle("active");
        	this.addStyle("hover");
        	if(this.ondropin){
        		this.ondropin(dragEle, this.ele);
        	}
        },

        dropOut: function(dragEle){
        	this.addStyle("active");
        	this.removeStyle("hover");
        	if(this.ondropout){
        		this.ondropout(dragEle, this.ele);
        	}
        },

        drop: function(dragEle, data){
        	if(this.ondrop){
        		this.ondrop(dragEle, this.ele, data);
        	}
        },

        addStyle: function(cssMode){
        	if(cssMode == "active" && this.activeClass){
        		this.ele.addClass(this.activeClass);
        	}
        	if(cssMode == "hover" && this.hoverClass){
        		this.ele.addClass(this.hoverClass);
        	}
        },

        removeStyle: function(cssMode){
        	if(cssMode == "active" && this.activeClass){
        		this.ele.removeClass(this.activeClass);
        	}
        	if(cssMode == "hover" && this.hoverClass){
        		this.ele.removeClass(this.hoverClass);
        	}
        },

        destory: function(){
        	DnDManager.deleteDropper(this.dropperID);
        }
	};

	_dropper.init(ele, opt);
	return _dropper;
};