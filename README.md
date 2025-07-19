# 环境安装指南
## NVM 安装
``` 
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```
## Node.js 16 安装
```
nvm install 16
nvm use 16
```
## 安装依赖包
 ```
 npm install
 ```
## 启动开发服务器
```
npm run dev
```
### 若启动报错：TypeError: crypto$2.getRandomValues is not a function
```
npm install vite@4.3.9 --save-exact
```