'use strict';

const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const inquirer = require('inquirer');
const semver = require('semver');
const userHome = require("user-home")
const glob = require("glob")
const ejs = require('ejs')
const Command = require("@estayjs/command")
const npmlog = require("@estayjs/util-log")
const Package = require("@estayjs/package")
const { isValidProjectName, isDirEmpty, spinnerStart, sleep, spawnAsync } = require("@estayjs/utils")

const WHITE_COMMAND = ['npm', 'cnpm'];

class InitCommand extends Command {
    // 重写
    init() {
        this.projectName = (this._argv || []).length > 0 ? this._argv[0] : ''
        this.force = (this._options || {}).force
    }
    // 重写
    async exec() {
        try {
            // 
            const projectInfo = await this.prepare()
            npmlog.verbose('用户输入信息 projectInfo', projectInfo);
            this.projectInfo = projectInfo
            await this.downloadTemplate();
            await this.installTemplate();
        } catch (e) {
            npmlog.error(e.message);
            if (this._options.debug || process.env.LOG_LEVEL === 'verbose') {
              console.log(e);
            }
        }
    }
    // 准备工作并获取用户输入信息
    async prepare() {
        // TODO: 接入模版服务接口
        const template = [
            {
                "_id" : '60dd5af21f683b5c176f0b4e',
                "name" : "React H5模板",
                "npmName" : "test-cli-template-react-h5",
                "version" : "1.0.0",
                "type" : "normal",
                "installCommand" : "npm install --registry=https://registry.npm.taobao.org",
                "startCommand" : "npm run start",
                "tag" : [ 
                    "project"
                ],
                "ignore" : [ 
                    "**/public/**"
                ]
            }
        ]
        if(!template || template.length === 0) {
            throw new Error('项目模版不存在');
        }
        this.template = template
        const cwdPath = process.cwd()
        if(!isDirEmpty(cwdPath)) {
            // 当前目录不为空
            let isContinue = false
            if(!this.force) {
                isContinue = (await inquirer.prompt([{
                    type: 'confirm',
                    name: 'isContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？',
                  }])).isContinue;
                if(!isContinue) {
                    return 
                }
            }
            if(this.force || isContinue) {
                const { confirmDelete } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件？',
                }]);
                if(confirmDelete) {
                    fse.emptyDirSync(cwdPath);
                }
            }

        }

        return new Promise(async (resolve, reject) => {
            let projectInfo = {};
            let isProjectNameValid = false
            if(isValidProjectName(this.projectName)) {
                isProjectNameValid = true
                projectInfo.projectName = this.projectName
            }
            // 选择创建项目或组件
            const { type } = await inquirer.prompt([{
                type: 'list',
                name: 'type',
                message: '请选择初始化类型',
                default: 'project',
                choices: [{
                    name: '项目',
                    value: 'project',
                }, {
                    name: '组件',
                    value: 'component',
                }],
            }])
            // 筛选对应类型的模版
            this.template = this.template.filter(template =>
                template.tag.includes(type))
            const title = type === 'project' ? '项目' : '组件'
            // 输入信息收集
            const projectPrompt = [];
            if(!isProjectNameValid) {
                projectPrompt.push({
                    type: 'input',
                    name: 'projectName',
                    message: `请输入${title}名称`,
                    default: '',
                    validate: function(v) {
                      const done = this.async()
                      setTimeout(function() {
                        if (!isValidProjectName(v)) {
                          done(`请输入合法的${title}名称`)
                          return
                        }
                        done(null, true);
                      }, 0)
                    },
                    filter: function(v) {
                      return v
                    },
                })
            }
            projectPrompt.push(
                {
                    type: 'input',
                    name: 'projectVersion',
                    message: `请输入${title}版本号`,
                    default: '1.0.0',
                    validate: function(v) {
                        const done = this.async();
                        setTimeout(function() {
                            if (!(!!semver.valid(v))) {
                            done('请输入合法的版本号');
                            return;
                            }
                            done(null, true);
                        }, 0);
                    },
                    filter: function(v) {
                        if (!!semver.valid(v)) {
                            return semver.valid(v);
                        } else {
                            return v;
                        }
                    },
                },
                {
                    type: 'list',
                    name: 'templateNpmName',
                    message: `请选择${title}模板`,
                    choices: this.template.map(item => ({
                                value: item.npmName,
                                name: item.name,
                             }))
                }
            )

            const project = await inquirer.prompt(projectPrompt)
            projectInfo = {
                type,
                ...projectInfo,
                ...project
            }
            if(projectInfo.projectName) {
                projectInfo.name = projectInfo.projectName
                projectInfo.className = require('kebab-case')(projectInfo.name).replace(/^-/, '');
            }
            if(projectInfo.projectVersion) {
                projectInfo.version = projectInfo.projectVersion
            }
            resolve(projectInfo)
        })

    }

    // 下载or更新模版
    async downloadTemplate() {
        const { templateNpmName } = this.projectInfo
        const templateInfo = this.template.find(item => item.npmName === templateNpmName)
        this.templateInfo = templateInfo
        const { npmName, version } = templateInfo
        const targetPath = path.resolve(userHome, '.test-cli', 'template')
        const storeDir = path.resolve(userHome, '.test-cli', 'template', 'node_modules')
        const templatePackage = new Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version,
        })
        if(!await templatePackage.exists()) {
            const spinner = spinnerStart('正在下载模板...');
            await sleep();
            try {
                await templatePackage.install()
            } catch (e) {
                throw e;
            } finally {
                spinner.stop(true);
                if (await templatePackage.exists()) {
                    npmlog.success('下载模板成功！')
                    this.templatePackage = templatePackage
                }
            }
        } else {
            const spinner = spinnerStart('正在更新模板...');
            await sleep();
            try {
                await templatePackage.update()
            } catch (e) {
                throw e;
            } finally {
                spinner.stop(true);
                if (await templatePackage.exists()) {
                    npmlog.success('更新模板成功！')
                    this.templatePackage = templatePackage
                }
            }
        }
    }

    // 安装模版
    async installTemplate() {
        npmlog.verbose('所选模版信息 templateInfo', this.templateInfo);
        if(this.templateInfo) {
            if(!this.templateInfo.type) {
                this.templateInfo.type = 'normal'
            }
            switch (this.templateInfo.type) {
                case 'normal':
                    await this.installTemplateNormal()
                    break;
                case 'custom':
                    await this.installTemplateCustom()
                    break;
                default:
                    throw new Error('无法识别模板类型！')
            }
        } else {
            throw new Error('模板信息不存在！')
        }
    }

    // 安装模版-标准
    async installTemplateNormal() {
        const { cacheFilePath } = this.templatePackage
        const { ignore=[], installCommand, startCommand } = this.templateInfo
        let spinner = spinnerStart('正在安装模板...')
        await sleep();
        try {
            const fromPath = path.resolve(cacheFilePath, 'template')
            const toPath = process.cwd()
            fse.ensureDirSync(fromPath)
            fse.ensureDirSync(toPath)
            fse.copySync(fromPath, toPath)
        } catch (e) {
            throw e;
        } finally {
            spinner.stop(true);
            npmlog.success('安装模板成功！')
        }
        const ignoreFiles = ['**/node_modules/**', ...ignore]
        //
        await this.ejsRender({ ignoreFiles })
        // 安装依赖
        await this.execCommand(installCommand, '安装依赖失败！')
        // 项目启动
        await this.execCommand(startCommand, '项目启动失败！')
    }

    // 安装模版-自定义
    async installTemplateCustom() {
        
    }

    // 渲染模版，填充数据
    async ejsRender(options) {
        const { ignoreFiles } = options
        const curDir = process.cwd()
        const projectInfo = this.projectInfo
        return new Promise((resolve, reject) => {
            glob('**', {
                cwd: curDir,
                ignore: ignoreFiles || '',
                nodir: true
            }, function name(er, matches) {
                if(er) {
                    reject(er)
                    return
                }
                Promise.all(matches.map(file => {
                    const filePath = path.join(curDir, file)
                    return new Promise((resolve1, reject1) => {
                        ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                            if(err) {
                                reject1(err)
                                return
                            }
                            fse.writeFileSync(filePath, result)
                            resolve1(result)
                        })
                    }).then(()=>{
                        resolve()
                    }).catch(err => {
                        reject(err)
                    })
                }))
            })
        })

    }

    // 执行命令
    async execCommand(commandLine, errorMsg) {
        let result;
        if(commandLine) {
            const cmdArr = commandLine.split(' ')
            const cmd = this.checkCommand(cmdArr[0])
            if(!cmd) {
                throw new Error(`脚手架不存在${cmd}该命令, 有效命令：${JSON.stringify(WHITE_COMMAND)}`)
            }
            const args = cmdArr.slice(1)
            result = await spawnAsync(cmd, args, {
                stdio: 'inherit',
                cwd: process.cwd(),
            })
        }
        if(result !== 0) {
            throw new Error(errorMsg)
        }
        return result

    }

    // 检查命令
    checkCommand(cmd) {
        if(WHITE_COMMAND.includes(cmd)) {
            return cmd
        }
        return null
    }
}

function commandInit(argv) {
    return new InitCommand(argv)
}

module.exports = commandInit
module.exports.InitCommand = InitCommand

