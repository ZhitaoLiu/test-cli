'use strict';

module.exports = cli;

const path = require('path')
const { Command } = require('commander');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const colors = require('colors');
const npmlog = require('@estayjs/util-log')
const pkg = require('../package.json');

const program = new Command();


function cli() {
    // TODO
    console.log('进入cli/lib/index.js')
    
    try {
        prepare()
    } catch (error) {
        npmlog.error(error.message)
    }
}


// 1.准备阶段
function prepare() {
    checkCLIVersion()
    checkRootRole()
    checkUserHome()
    checkENV()
    checkCLIUpdate()
}
// 1.1 检查cli版本
function checkCLIVersion() {
    npmlog.info('cli', '当前脚手架版本为' + pkg.version)
}

// 1.2 检查root权限
function checkRootRole() {
    const rootCheck = require('root-check')
    rootCheck();
}

// 1.3 检查用户主目录
function checkUserHome() {
    console.log('用户主目录' + userHome)
    if(!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前用户主目录不存在！'))
    }
}

// 1.4 检查环境变量
function checkENV() {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(userHome, '.env')
    if(pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath
        })
    }
    // 设置默认环境变量
    let cliHomePath = path.join(userHome, '.test-cli')
    if(process.env.CLI_HOME) {
        cliHomePath = path.join(userHome, process.env.CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliHomePath
}

// 1.5 检查版本更新
function checkCLIUpdate(){
    console.log('检查版本更新')
}
// 注册阶段

