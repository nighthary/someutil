###手机不越狱/ROOT访问需要修改hosts的网站

>需求来源:
>	网站需要升级HTTPS,但是最开始只开放单节点进行测试(通过修改hosts来访问),但是iPhone不越狱(Android不ROOT)的时候是没办法修改hosts的,但是大家都不愿意把爱机随随便便的越狱,所以就有了在不越狱的前提下怎么进行测试

###1.准备工具

	电脑一台(Mac/PC均可以) 
	JAVA开发环境(jdk)
	Charles代理软件(Mac/PC均有此软件)

###2.设置代理

主要原理:

	电脑修改hosts.
	手机和电脑保证在同一个局域网,手机设置代理(在连接WIFI的详情里面有代理设置的位置,Android&IOS均可以),通过Charles将网络请求转发到本地电脑上.
	简单的说就是,手机的所有网络请求都通过电脑来访问,而电脑是修改了host的.
	
具体步骤:

*	1.安装Charles

	[Chalres使用教程](http://blog.csdn.net/liguilicsdn/article/details/51208909)

	[下载地址](https://www.charlesproxy.com/)
*	2.电脑修改HOSTS

		host路径
		
		MAC: /etc/hosts
		WINDOW:c:/windows/system32/drivers/etc/hosts
	
	编辑hosts文件,添加需要修改的hosts地址
		
*	3.手机连接WIFI,设置代理

		1.手机进入WIFI连接界面,连接成功之后进入连接详情
		2.底部有HTTP代理设置,选择手动方式,输入电脑的IP地址(ipconfig/ifconfig-查看ip地址),输入端口号(这个端口可以在Charles中设置,默认是8888)

		
*	测试连接

	手机打开需要访问的地址,查看charles中是否拦截到了网络请求,如果拦截到了,应该就可以正常访问
	
<mark>注意:PC可能需要管理防火墙以及杀毒软件(如果MAC安装了杀毒软件,可能也需要管理,本人未测试过)</mark>
<br/>
<mark>注意:使用中请保证电脑和手机在同一局域网</mark>