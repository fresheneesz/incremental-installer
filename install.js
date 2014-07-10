var child = require("child_process")
var fs = require("fs")
var path = require('path')

var Future = require('async-future')

var temporaryPackageFolder = 'temporaryPackageFolder'

module.exports = function() {
    if(arguments.length === 1) {
        var scripts = arguments[0]
    } else {
        var stateFile = arguments[0]
        var scripts = arguments[1]
    }

    var state;
    function getState() {
        if(state === undefined) {
            if(fs.existsSync(stateFile)) {
                state = parseInt(fs.readFileSync(stateFile))
            } else {
                state = 0
            }
        }
    }

    var lastFuture = Future(true)
    scripts.forEach(function(v, n) {
        lastFuture = lastFuture.then(function() {
            if(typeof(v) === 'function') {
                getState()

                if(state <= n) {
                    var returnValue = v() // return value should be a future (or undefined)

                    var recordNewState = function() {
                        state = n+1
                        if(state !== undefined) { // only if state was used
                            // save state
                            makePath(path.dirname(stateFile))
                            fs.writeFileSync(stateFile, state)
                        }
                    }

                    if(returnValue !== undefined) {
                        return returnValue.then(function(){
                            recordNewState()
                        })
                    } else {
                        recordNewState()
                    }
                }
            } else if(typeof(v) === 'object') {
                return v.check().then(function(needsToRun) {
                    if(needsToRun) {
                        return v.install()
                    }
                })
            } else {
                // ignore it
            }
        })
    })

    return lastFuture
}

module.exports.Future = Future

var run = module.exports.run = function (command, printToConsole){
    if(printToConsole === undefined) printToConsole = true

    var stdout = '', stderr = '', stdtogether = ''
    var childProcess = child.exec(command)

    var aChild = futureChild(childProcess)
    aChild.stdout.on('data', function(data){
        stdout += data
        stdtogether += data
    })
    aChild.stderr.on('data', function(data){
        stderr += data
        stdtogether += data
    })

    if(printToConsole) {
        aChild.stdout.pipe(process.stdout)
        aChild.stderr.pipe(process.stderr)
    }

    return aChild.then(function(code) {
        if(code !== 0){
            var e = Error('command "'+command+'" ended with non 0 return code ('+code+') '+stdtogether)
            e.code = code
            e.stdout = stdout
            e.stderr = stderr
            throw e
        }

        return Future({responseCode: code, stdout: stdout, stderr: stderr, stdtogether: stdtogether})
    })
}


// wraps a child-process object into a future that also has the stream properties stdout and sterr
function futureChild(childProcess) {
    var f = new Future
    f.stdout = childProcess.stdout
    f.stderr = childProcess.stderr
    childProcess.on('error', function(e) {
        f.throw(e)
    })
    childProcess.on('exit', function(code, signal) {
        if(code !== null) {
            f.return(code)
        } else if(signal !== null) {
            f.throw('Process was killed with signal: '+signal)
        } else {
            f.throw(Error("Unknown")) // should never happen
        }
    })

    return f
}

// path is a path to a desired directory
// if any of the parts of the path don't yet exist, they will be created as directories
function makePath(directoryPath) {
    var parts = directoryPath.split(path.sep)

    var current = ''
    for(var n=0; n<parts.length; n++) {
        current += parts[n]+path.sep
        if(fs.existsSync(current)) {
            if(!fs.statSync(current).isDirectory()) {
                throw Error(current+' already exists but isn\'t a directory.')
            }
        } else {
            fs.mkdirSync(current)
        }
    }
}
