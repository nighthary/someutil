
/**
 * 原生js对上的class的一些常见操作
 * @description the day without jquery
 * @type {Object}
 */
var DOMClassUtil = {

	/**
	 * 判断是否存在某个class
	 * @FileName   DOMClassUtil
	 * @CreateDate 2016-03-25T10:42:04+0800
	 * @param      {[elements]}                 elements [原生js取到的节点]
	 * @param      {[cName]}                 cName    [className]
	 * @return     {Boolean}                         [是否存在]
	 */
	this.hasClass = function(elements,cName){
		return !!elements.className.match( new RegExp( "(\\s|^)" + cName + "(\\s|$)") );
	}

	/**
	 * 添加class
	 * @FileName   DOMClassUtil
	 * @CreateDate 2016-03-25T10:44:03+0800
	 * @param      {[type]}                 elements [原生js取到的节点]
	 * @param      {[type]}                 cName    [className]
	 */
	this.addClass = function ( elements,cName ){
	    if( !hasClass( elements,cName ) ){
	        elements.className += " " + cName;
	    };
	};

	/**
	 * 移除某个class
	 * @FileName   DOMClassUtil
	 * @CreateDate 2016-03-25T10:44:41+0800
	 * @param      {[type]}                 elements [原生js取到的节点]
	 * @param      {[type]}                 cName    [className]
	 */
	this.removeClass = function( elements,cName ){
	    if( hasClass( elements,cName ) ){
	        elements.className = elements.className.replace( new RegExp( "(\\s|^)" + cName + "(\\s|$)" ), " " );
	    };
	};
}
