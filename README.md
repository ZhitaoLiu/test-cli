
### 1. Failed to connect to github.com port 443: Operation timed out
- 开启VPN，设置代理, port为http代理端口(41081)
` git config --global http.proxy "localhost:port" ` 
`git config --global http.proxy "localhost:41081" `

- 完成后取消设置
` git config --global --unset http.proxy `