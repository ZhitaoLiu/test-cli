'use strict';

module.exports = commandInit;

function commandInit() {
    // TODO
    const args = Array.from(arguments)
    console.log('command init npm包')
    console.log('args[0] : ' + args[0])
    console.log('args[1] : %o', args[1])
    console.log('args[2] : %o', args[2])

}
