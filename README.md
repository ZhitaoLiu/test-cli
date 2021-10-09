
### 1. Failed to connect to github.com port 443: Operation timed out
- 开启VPN，设置代理, port为http代理端口(41081)
- ` git config --global http.proxy "localhost:port" ` 
- ` git config --global http.proxy "localhost:41081" `

- 完成后取消设置
` git config --global --unset http.proxy `


### 2.本地缓存体系设计

- |- /Users/damon/        **用户主目录**
- |-- .test-cli    
- |--|-- dependencies     **脚手架动态依赖包target path**
- |--|--|-- node_modules  **store dir**
- |--|--|--|-- _@test-cli_command-init@版本号@@test-cli/command-init
- |--|-- template         **模版target path**
- |--|--|-- node_modules  **store dir**
