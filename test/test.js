var fs = require('fs')
var Unit = require('deadunit')

var stateFiles = []
initStateFiles(4)

function initStateFiles(number) {
    for(var n=0; n<number; n++) {
        var stateFile = __dirname+'/install.state'+n
        if(fs.existsSync(stateFile)) fs.unlinkSync(stateFile)
        stateFiles.push(stateFile)
    }
}

Unit.test(function(t) {
    var install = require('../install')
    var Future = install.Future


       //*
    this.test('successful run', function(t) {
        this.count(4)

        this.ok(fs.existsSync(stateFiles[0]) === false)

        var first;
        this.test("First run", function(t) {
            this.count(5)

            var event = sequence(function(e) {
                t.eq(e, 'first')
            }, function(e) {
                t.eq(e, 'secondCheck')
            }, function(e) {
                t.eq(e, 'second')
            }, function(e) {
                t.eq(e, 'third')
            }, function(e) {
                t.eq(e, 'fourth')
            })

            first = runInstaller(event)
        })

        first.then(function() {
            t.ok(fs.existsSync(stateFiles[0]) === true)

            var second;
            t.test("Second run", function(t) {
                this.count(2)

                var event = sequence(function(e) {
                    t.eq(e, 'secondCheck')
                }, function(e) {
                    t.eq(e, 'second')
                })

                second = runInstaller(event)
            })

            return second.then(function() {
                fs.unlinkSync(stateFiles[0])
            })
        }).done()



        function runInstaller(event) {
            return install(stateFiles[0], [
                function() {
                    event('first') // first one ran
                },
                {   check: function() {
                        event('secondCheck') // second check ran
                        return Future(true)
                    },
                    install: function() {
                        event('second') // second ran
                    }
                },
                function() {
                    var f = new Future
                    setTimeout(function() {
                        event('third') // third one ran
                        f.return()
                    },100)
                    return f
                },
                function() {
                    var f = new Future
                    process.nextTick(function() {
                        event('fourth') // fourth one ran
                        f.return()
                    })
                    return f
                }
            ])
        }
    })

    this.test("object-tasks can be safely inserted in the middle", function(t) {
        this.count(5)

        var event = sequence(function(e) {
            t.eq(e, 'first')
        }, function(e) {
            t.eq(e, 'second')
        }, function(e) {
            t.eq(e, 'third')
        }, function(e) {
            t.eq(e, 'fourth')
        }, function(e) {
            t.eq(e, 'fifth')
        })

        install(stateFiles[3], [
            function() {
                event('first') // first one ran
            },
            function() {
                event('second') // first one ran
            }
        ])


        install(stateFiles[3], [
            function() {
                t.ok(false) // shouldn't be run
            },
            {   check: function() {
                    event('third')
                    return Future(true)
                },
                install: function() {
                    event('fourth')
                }
            },
            function() {
                t.ok(false) // shouldn't be run
            },
            function() {
                event('fifth')
            }
        ])
    })

    this.test('errors', function() {

        this.test('synchronous error', function(t) {
            this.count(5)

            this.ok(!fs.existsSync(stateFiles[1]))

            install(stateFiles[1], [
                function() {
                    t.ok(true) // first one ran
                },
                function() {
                    throw new Error("failure")
                },
                function() {
                    t.ok(false) // third one never runs
                }
            ]).catch(function(e){
                t.ok(e.message === 'failure')
            }).finally(function(){
                t.eq(fs.readFileSync(stateFiles[1]).toString(), '1')
            }).then(function() {
                return install(stateFiles[1], [
                    function() {
                        t.ok(false) // this one already ran successfully up there ^
                    },
                    function() {
                        t.ok(true)
                    }
                ])
            }).done()


        })

        this.test('future error', function(t) {
            this.count(4)

            this.ok(!fs.existsSync(stateFiles[2]))

            install(stateFiles[2], [
                function() {
                    t.ok(true) // first one ran
                },
                function() {
                    var f = new Future()
                    setTimeout(function() {
                        f.throw(new Error("async failure"))
                    })
                    return f
                },
                function() {
                    t.ok(false) // third one never runs
                }
            ]).catch(function(e){
                t.ok(e.message === "async failure")
            }).finally(function(){
                t.eq(fs.readFileSync(stateFiles[2]).toString(), '1')
            }).done()
        })
    })
    //*/

}).writeConsole()



function sequence() {
    var n=-1
    var fns = arguments
    return function() {
        n++
        if(n>=fns.length)
            throw new Error("Unexpected call "+n+": "+Array.prototype.slice.call(arguments,0))
        // else
        fns[n].apply(this,arguments)
    }
}