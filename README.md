[github](https://github.com/yangnianbing/jd-price-protect)  

安装
-----
通过`npm`安装
```bash
$ npm install jd-price-protect -g
```

实例
----
```bash
$ jd-price-protect start
? 请输入京东账号 ***
? 请输入京东密码 ***
? 请输入chrome路径
? 输入间隔时间，单位分钟 10
? 是否采用无头模式 false
```
按照提示输入京东的用户名和密码，如果需要输入校验码的话登录失败，请手动输入校验码进行登录。chrome地址可以为空，因为在通过`npm install`的时候会自己去下载chrome，如果你的电脑可以翻墙的话。
如果电脑不能翻墙，在`npm install`安装包依赖之前，可以在环境变量中添加变量`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`。然后指定本地已安装的chrome目录。
间隔时间单位为分钟 ，每隔指定时间去抓取商品当前价格和购买价格对比，看是否可以进行保价。

