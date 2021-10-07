'use strict';

const semver = require('semver')
const colors = require('colors/safe');
const npmlog = require('@estayjs/util-log')

const LOWEST_NODE_VERSION = '12.0.0'

class Command {
    constructor(argv) {
        console.log('22222')
        console.log(typeof argv)
        if(!argv) {
            throw new Error('参数不能为空！');
        }
        if (!Array.isArray(argv)) {
            throw new Error('参数必须为数组！');
        }
        if (argv.length < 1) {
            throw new Error('参数列表为空！');
        }
        this._argv = argv
        new Promise((resolve, reject) => {
            let chain = Promise.resolve()
            chain = chain.then(() => this.checkNodeVersion())
            chain = chain.then(() => this.initArgs())
            chain = chain.then(() => this.init()) // 调用实现类的init
            chain = chain.then(() => this.exec()) // 调用实现类的exec
            chain.catch(err => {
                npmlog.error(err.message)
            })
        })
    }
    // 检查node版本
    checkNodeVersion() {
        if(!semver.gte(process.version, LOWEST_NODE_VERSION)) {
            throw new Error(colors.red(`脚手架 最低支持 ${LOWEST_NODE_VERSION} 以上的 Node.js 版本`))
        }
    }

    // 初始化参数
    initArgs() {
        console.log('参数1 %s', this._argv[0])
        console.log('参数2 %o', this._argv[1])
        console.log('参数3 %o', this._argv[2])
    }

    // 初始化
    init() {
        throw new Error('继承基类Command的子类必须实现init方法！');
    }

    // 执行
    exec() {
        throw new Error('继承基类Command的子类必须实现exec方法！');
    }
}

module.exports = Command;
