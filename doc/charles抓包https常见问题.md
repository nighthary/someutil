#macOS使用Charles抓包HTTPS常见问题

##1.工作环境

	
	MAC OSX  10.12.4
	ios 10.3
	charles 4.1

Charles抓包HTTPS最基础设置方法请参考[这里](http://blog.csdn.net/shaobo8910/article/details/52936066)
###2.常见问题

>	SSLHandshake: Received fatal alert: unknown_ca


	1.手机打开http://www.charlesproxy.com/getssl/这个地址，安装Charles的代理证书
	2.进入设置->通用->证书信任设置->Charles Proxy Cutom Root Certificate...,  点击信任
	3.进入设置->通用->描述文件->Charles Proxy Cutom Root Certificate...,点击信任
	
	
>	SSL Proxying not enabled for this host: enable in Proxy Settings, SSL locations

	1.找到Charles->menu->Proxy->SLL Proxying Setting
	2.Enable SLL Proxying
	3.添加受信任的域名
		HOSTL: *
		PORT: 443
		
> 其他问题
	
其他问题可以参考这个[地址](https://www.charlesproxy.com/documentation/faqs/)