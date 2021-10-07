'use strict';

const path = require('path');

function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
}

// 兼容不同系统的路径差异
function systemPathFormat(p) {
  if (p && typeof p === 'string') {
    const sep = path.sep;
    if (sep === '/') {
      return p;
    } else {
      return p.replace(/\\/g, '/');
    }
  }
  return p;
}

// 异步进程的创建并执行（异步方式）
function spawn(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd.exe' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return require('child_process').spawn(cmd, cmdArgs, options || {});
}

// 异步进程的创建并执行（同步方式）
function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = spawn(command, args, options);
    p.on('error', e => {
      reject(e);
    });
    p.on('exit', c => {
      resolve(c);
    });
  });
}

module.exports = {
    isObject,
    systemPathFormat,
    spawn,
    spawnAsync
}