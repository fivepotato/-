<h3>运行要求</h3>

安装最新版本的Node.js，然后安装依赖包```puppeteer```和```puppeteer-jquery```

```bat
npm i puppeteer --save
npm i puppeteer-jquery --save
```



<h3>账号配置</h3>

首次使用需要配置账号和密码。

先进行密码的生成。在当前目录下执行命令

```bat
node encrypt [your-password]
```

输出加密后的密码

```bat
{ "iv":"something", "content":"something" }
```

将加密后的密码按如下格式输入到文件```password.json```中

```json
[
    {
        "id": "PB00000001",
        "passwd": null,
        "passwd_encrypted": {
            "iv": "something",
            "content": "something"
        },
        "jinji": [
            "example",
            "example",
            "example"
        ],
        "teshu": "无"
    },
    {
        "id": "PB00000002",
        "passwd": null,
        "passwd_encrypted": {
            "iv": "something",
            "content": "something"
        },
        "jinji": [
            "example",
            "example",
            "example"
        ],
        "teshu": "无"
    }
]
```

如果你已经填写了passwd_encrypted字段，请将passwd字段保持为null。

请确保你运行环境的安全，不要将账号配置中的任何内容泄漏给其他人！



<h3>使用(Windows环境下)</h3>

账号配置完成后，打开文件```打卡.bat```即可运行。

```bat
node main
```

将依次登录```password.json```中的所有账号。

```循环打卡.bat```简单地给出一种过一段时间打卡一次的方法

```bat
:start
node main
timeout /t 32000
goto start
```
