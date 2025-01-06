# OAuth授权码流程

假设我们有一个统一授权中心服务，称为IdentityServer.

然后我们有一个网站应用，称为ServiceA.

## 跳转到认证中心

在ServiceA中提供页面链接，跳转至统一授权中心。

Endpoint:`/connect/authorize?`

链接参数如下:

```http
GET /connect/authorize?response_type=code&client_id=s6BhdRkqt3&state=af0ifjsldkj&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcb HTTP/1.1

```

参数如下

```js
client_id:test
response_type:code
state:123
scope:api
redirect_uri:http://127.0.0.1:8082/abc.html
```

## 用户验证

认证中心应提供验证交互页面，如用户名密码登录页面。

用户输入验证成功后，并提示应用请求的授权范围，点击同意后，在url中携带code信息，跳转至ServiceA页面。

## 获取Token

前端页面获取到code信息后，将code通过接口发送给ServiceA.

ServiceA拿到code后，向统一授权中心服务换取token，然后返回给前端。

```http
POST /connect/token  HTTP/1.1
Content-Type: application/x-www-form-urlencoded

code:OX1jQs6_YT1A7vLztDylRm-Ut7wLf8RWUsNhQolQGBk
grant_type:authorization_code
client_id:test
client_secret:JustLocalTest
redirect_uri:http://127.0.0.1:8082/abc.html
```
