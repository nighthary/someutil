var Util = function(){

	/*
	 *	检测是否是NaN
	 */
	function isReallyNaN(x){
		return x !== x;
	}
	return {
		isNaN:isReallyNaN
	}
}();
