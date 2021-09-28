'use strict';

module.exports = cli;

const path = require('path')
const semver = require('semver');
const { Command } = require('commander');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const colors = require('colors');
const npmlog = require('@estayjs/util-log')
const pkg = require('../package.json');

const program = new Command();


async function cli() {
    // TODO
    console.log('进入cli/lib/index.js')
    
    try {
       await prepare()
       register()
    } catch (error) {
        npmlog.error(error.message)
    }
}


// 1.准备阶段
async function prepare() {
    console.log('进入准备阶段')
    checkCLIVersion()
    checkRootRole()
    checkUserHome()
    checkENV()
    await checkCLIUpdate()
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
async function checkCLIUpdate(){
    const curVersion = pkg.version
    const npmName = pkg.name
    console.log(npmName, curVersion)
    const { getNpmSemverVersion } = require('@estayjs/util-npm')
    const latestVersion = await getNpmSemverVersion(curVersion, npmName)
    if(latestVersion && semver.gt(latestVersion, curVersion)) {
        npmlog.warn(colors.yellow(
            `当前版本：${curVersion}，最新版本：${latestVersion}，
            建议手动执行命令 npm install -g ${npmName}
            `))
    }

}

// 2.注册阶段
function register() {
    console.log('进入注册阶段')
    // 
    program
        .name(Object.keys(pkg.bin)[0])
        .version(pkg.version, '-v, --version', '当前脚手架版本号')
        .usage('<command> [options]')
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-lp, --local-path', '是否指定本地调试文件的入口路径', '')

    program.parse(process.argv);

    program.outputHelp();
}

