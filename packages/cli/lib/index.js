'use strict';

module.exports = cli;

const path = require('path')
const semver = require('semver');
const { Command } = require('commander');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const colors = require('colors');
const npmlog = require('@estayjs/util-log')
const dynamicExec = require('@estayjs/dynamic-exec')
const pkg = require('../package.json');

const program = new Command();


async function cli() {
    try {
       await prepare()
       register()
    } catch (error) {
        npmlog.error(error.message)
        if(program.opts().debug) {
            console.log(error);
        }
    }
}


// 1.准备阶段
async function prepare() {
    npmlog.info('进入准备阶段')
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
    npmlog.info('检查root权限...');
    const rootCheck = require('root-check')
    rootCheck();
}

// 1.3 检查用户主目录 (后续要往主目录写入缓存)
function checkUserHome() {
    npmlog.info('检查用户主目录...');
    if(!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前用户主目录不存在！'))
    }
}

// 1.4 检查环境变量 (本地缓存需要)
function checkENV() {
    npmlog.info('检查环境变量...');
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
    npmlog.info('检查版本更新...');
    const curVersion = pkg.version
    const npmName = pkg.name
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
    npmlog.info('进入注册阶段')
    program
        .name(Object.keys(pkg.bin)[0])
        .version(pkg.version, '-v, --version', '当前脚手架版本号')
        .usage('<command> [options]')
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-lp, --local-path [localPath]', '是否指定本地调试文件的入口路径', '')

    // init 命令
    program
        .command('init [projectName]')
        .description('初始化项目')
        .option('-f, --force', '是否强制初始化项目')
        .action((projectName, options, command) => {
            // console.log(`projectName:  ${projectName}`);
            // console.log(`options:  %o`, options);
            // console.log(`command name:  ${command.name()}`);
            // console.log(`program .opts: %o`, program.opts());
            const programOpts = program.opts() || {}
            // 动态执行命令
            dynamicExec(projectName, {...programOpts, ...options}, command)

        });

    // TODO: 其他命令

    // 监听debug模式
    program.on('option:debug', function () {
        if(this.opts().debug) {
            process.env.LOG_LEVEL = 'verbose';
        } else {
            process.env.LOG_LEVEL = 'info';
        }
        npmlog.level = process.env.LOG_LEVEL
    })

    // 监听指定本地调试文件入口路径
    program.on('option:local-path', function () {
        console.log('本地调试文件路径： ' + this.opts().localPath)

        process.env.CLI_LOCAL_PATH = this.opts().localPath
    })

    // 监听未知命令
    program.on('command:*', function (operands) {
        const availableCommands = program.commands.map(cmd => cmd.name());
        console.log(colors.red('未知的命令：' + operands[0]));
        if(availableCommands.length) {
            console.log(colors.red('可用命令：' + availableCommands.join(',')));
        }
    });

    // 自定义帮助
    program.addHelpText('after',
    `
Example call:
    $ test-cli --help
    `);


    // 解析参数
    program.parse(process.argv);

    
    if (program.args && program.args.length < 1) {
        program.outputHelp();
    }
}

