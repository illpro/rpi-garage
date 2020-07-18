#! /usr/bin/env node


const http = require('http')

const hostname = '127.0.0.1'
const port = 3000

const gpio_pin = 7
var gpio = require('rpi-gpio')


function cleanUp(exit, err) {
    exit = exit || false

    gpio.destroy(function() {
        console.log('unexported gpio pins')
        if (err) {
            console.log(err.stack)
        }
        if (exit) {
            process.exit()
        }
    })
}
process.on('exit', cleanUp)
process.on('SIGINT', cleanUp.bind(null, true))
process.on('SIGTERM', cleanUp.bind(null, true))
process.on('uncaughtException', cleanUp.bind(null, true))


// set the gpio pin to "high" for 1 second
function triggerDoorOpener() {
    gpio.write(gpio_pin, false, function(err) {
        if (err) {
            throw err
        }

        console.log('turned on pin', gpio_pin)
        setTimeout(function() {
            gpio.write(gpio_pin, true, function(err) {
                if (err) {
                    throw err
                }
                console.log('turned off pin', gpio_pin)
            })
        }, 1000)
    })
}


// handle an http request
function handleHttpRequest(req, res) {
    try {
        triggerDoorOpener()
    }
    catch(err) {
        console.log('error:', err)
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end('{"success": true}')
}


// log the server is setup and ready to run
function serverSetupComplete() {
    console.log(`Server running at http://${hostname}:${port}/`)
}


// start the http server
function startServer() {
    var server = http.createServer(handleHttpRequest)
    server.listen(port, hostname, serverSetupComplete)
}


// open the gpio pin and then start the http server
gpio.setup(gpio_pin, gpio.DIR_HIGH, startServer)

