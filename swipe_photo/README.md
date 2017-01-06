# swipe_photo

移动端端图片放大查看组件，放大后可以左右滑动&amp;缩放图片


	采用了  http://photoswipe.com  的缩放组件，本项目算是对该组件的使用，修改了部分源代码使得其能够满足自己的业务需求。


主要修改地方:

	photoswipe-ui-default.js  line74   修改属性tapToClose为true,使得当图片放大时点击图
	片时可以直接关闭弹出层.