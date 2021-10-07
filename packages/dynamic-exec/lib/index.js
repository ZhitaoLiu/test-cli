'use strict';

const path = require('path')
const npmlog = require('@estayjs/util-log')
const Package = require('@estayjs/package')
const { spawn } = require('@estayjs/utils')

const COMMAND_CONFIG = {
    init: '@estayjs/command-init'
}

async function dynamicExec() {
    console.log('进入 动态执行命令 阶段')
    const cliHomePath = process.env.CLI_HOME_PATH;
    let localPath = process.env.CLI_LOCAL_PATH;
    npmlog.verbose('cliHomePath', cliHomePath);
    npmlog.verbose('localPath', localPath);
    let pkg;

    const command = arguments[arguments.length - 1];
    const cmdName = command.name();
    const packageName = COMMAND_CONFIG[cmdName]
    const packageVersion = 'latest';
    
    if(!localPath) {
        //
        const targetPath = path.resolve(cliHomePath, 'dependencies')
        const storeDir = path.resolve(targetPath, 'node_modules')

        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion
        })

        if (await pkg.exists()) {
            console.log('更新npm包：' + packageName)
            await pkg.update();
        } else {
            console.log('安装npm包：' + packageName)
            await pkg.install();
        }

    } else {
        // 本地调试
        pkg = new Package({
            targetPath: localPath,
            packageName,
            packageVersion
        })
    }

    // 入口文件
    const rootFile = pkg.getRootFilePath()
    if(rootFile) {
        try {
            const args = Array.from(arguments)
            // 对cmd瘦身
            const cmd = args[args.length - 1];
            const o = Object.create(null);
            Object.keys(cmd).forEach(key => {
                if (cmd.hasOwnProperty(key) &&
                  !key.startsWith('_') &&
                  key !== 'parent') {
                  o[key] = cmd[key];
                }
              });
            args[args.length - 1] = o;
            //
            const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
            // 开启子进程执行
            const child = spawn('node', ['-e', code], {
                cwd: process.cwd(),
                stdio: 'inherit'
            })
            child.on('error', e => {
                console.log('222222')
                npmlog.error(e.message);
                process.exit(1);
            });
            child.on('exit', e => {
                console.log('333333')
                npmlog.verbose('命令执行成功:' + e);
                process.exit(e);
            });
        } catch (error) {
            npmlog.error('123')
            npmlog.error(error.message)
        }
    }
}

module.exports = dynamicExec;
