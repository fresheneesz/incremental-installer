var fs = require('fs')
var Unit = require('deadunit')

var stateFile = __dirname+'/install.state'
var stateFile2 = __dirname+'/install.state2'
var stateFile3 = __dirname+'/install.state3'
if(fs.existsSync(stateFile)) fs.unlinkSync(stateFile)
if(fs.existsSync(stateFile2)) fs.unlinkSync(stateFile2)
if(fs.existsSync(stateFile3)) fs.unlinkSync(stateFile3)

Unit.test(function(t) {
    var install = require('../install')
    var Future = install.Future

    this.count(2)


       //*
    this.test('successful run', function(t) {
        this.count(4)

        this.ok(fs.existsSync(stateFile) === false)

        var first;
        this.test("First run", function(t) {
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
            t.ok(fs.existsSync(stateFile) === true)

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
                fs.unlinkSync(stateFile)
            })
        }).done()



        function runInstaller(event) {
            return install(stateFile, [
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

    this.test('errors', function() {

        this.test('synchronous error', function(t) {
            this.count(5)

            this.ok(!fs.existsSync(stateFile2))

            install(stateFile2, [
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
                t.eq(fs.readFileSync(stateFile2).toString(), '1')
            }).then(function() {
                return install(stateFile2, [
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

            this.ok(!fs.existsSync(stateFile3))

            install(stateFile3, [
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
                t.eq(fs.readFileSync(stateFile3).toString(), '1')
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
            throw new Error("Unexpected call: "+n)
        // else
        fns[n].apply(this,arguments)
    }
}