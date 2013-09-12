dnd.js
======

Drag and Drop javascript labriry. 拖拽组件的JavaScript类库。


# 简单介绍

dnd.js是一个拖拽组件的JavaScript类库。使用它，你可以轻易地让你的网页内容可以拖动，可以放置到某个容器内。它基于jQuery，内部的实现原理是使用了鼠标的mouse相关事件。（注：如无意外，下文所说的“源节点”指被拖动的节点，“目标节点”指被释放的目标容器）

dnd.js的特点有：

* 可以设置单独拖动或者是拖动和拽放同时出现；
* 可以设置拖动的手柄；
* 可以设置拖动的代理节点；
* 可以设置释放鼠标时自动回到原本位置；
* 可以设置多个源节点同时拖动；
* 支持一些拖动的样式作为视觉反馈
* 支持dragStart dragMove dragEnd dropIn dropOut drop事件
* 支持手动注销事件

# 使用方法

    var dnd = new DnD(source, options);

参数如下：

* @param {string} source 源节点，传入选择器字符串（必须）；
* @param {object} options 配置参数；

options的详细配置如下：

* @param {string} target 目标节点，选择器字符串，如果为空则为drag模式，如果为类选择器则绑定多个节点；
*                   @param {string} handler 手柄节点，选择器字符串，如果为空则整个源节点都可以拖动；
*                   @param {striing} proxy 代理节点，选择器字符串，如果为空则拖动源节点，否则拖动代理节点；
*                   @param {boolean} isRevert 是否自动返回原位置；
*                   @param {boolean} isMultiDrag 是否支持同时拖动多个源节点；
*                   @param {fuction} onDragStart 拖动开始的响应函数；
*                   @param {fuction} onDragMove 拖动中的响应函数；
*                   @param {fuction} onDragEnd 拖动结束的响应函数；
*                   @param {fuction} onDropIn 源节点被拖进目标节点时响应；
*                   @param {fuction} onDropOut 源节点被拖出目标节点时响应；
*                   @param {fuction} onDrop 源节点在目标节点内释放时响应；
*                   @param {string} hoverClass 拖动源节点在目标节点里面时，目标节点的样式；
*                   @param {string} activeClass 拖动源节点在目标节点外面时，目标节点的样式；

# 使用例子

形如一下的方式：

    var dnd = new DnD(".sourceEle", {
        "target" : ".targetEle",
        "handler" : ".handlerEle",
        "isMultiDrag" : false,
        "onDrop" : function($source, $target){
            // this.destory();
        },
        "hoverClass" : "hoverTarget",
        "activeClass" : "activeTarget"
    });

详细的Demo可以看源码中的demo.html。

# 兼容性

因为使用了HTML原声的mouse事件（未有使用HTML5的Drag and Drop），因此基本上兼容主流的浏览器。







