var fs = require('fs')
var Unit = require('deadunit')

var stateFile = __dirname+'/install.state'
if(fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile)
}

Unit.test(function(t) {
    var install = require('../install')
    var Future = install.Future

    this.count(4)

    this.ok(fs.existsSync(stateFile) === false)

    var first;
    this.test("First run", function() {
        first = runInstaller(this, 0)
    })

    first.then(function() {
        t.ok(fs.existsSync(stateFile) === true)

        var second;
        t.test("Second run", function() {
            second = runInstaller(this, 1)
        })

        return second.then(function() {
            fs.unlinkSync(stateFile)
        })
    }).done()



    function runInstaller(t, timesAlreadyRan) {
        if(timesAlreadyRan === 0) {
            t.count(5)
        } else {
            t.count(2)
        }

        return install(stateFile, [
            function() {
                t.ok(true) // first one ran
            },
            {   check: function() {
                    t.ok(true) // second check ran
                    return Future(true)
                },
                install: function() {
                    t.ok(true) // second ran
                }
            },
            function() {
                var f = new Future
                setTimeout(function() {
                    t.ok(true) // third one ran
                    f.return()
                },100)
                return f
            },
            function() {
                var f = new Future
                process.nextTick(function() {
                    t.ok(true) // fourth one ran
                    f.return()
                })
                return f
            }
        ])
    }

}).writeConsole()


