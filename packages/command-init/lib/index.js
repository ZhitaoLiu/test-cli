'use strict';

const Command = require("@estayjs/command")

class InitCommand extends Command {
    // 重写
    init() {

    }
    // 重写
    exec() {
        
    }
}

function commandInit(argv) {
    return new InitCommand(argv)
}

module.exports = commandInit
module.exports.InitCommand = InitCommand;

