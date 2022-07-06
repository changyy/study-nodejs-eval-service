const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const NodeCache = require( "node-cache" )
const myCache = new NodeCache();

const app = express()
const port = 8080
const beginTime = new Date()

function fetchRemoteResource(input) {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(input);
            request.get(url.href, function (error, response, body) {
                if (error) {
                    reject(error);
                    return;
                }
                if (response.statusCode != 200) {
                    reject("response.statusCode != 200");
                    return;
                }
                resolve(body);
            });
        } catch (e) {
            reject(e);
        }
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    }); 
}

app.use(bodyParser.urlencoded({ extended: true, limit: '5mb', }));
app.use(bodyParser.json({limit: '5mb',}));
//app.use(bodyParser.raw());

app.get('/', async (req, res) => {
    let current = new Date();
    res.json( { 
        "begin": beginTime, 
        "current": current, 
        "running": Math.floor((current - beginTime)*10000/(1000*60*60*24))/10000 + " days",
        "cache": {
            "status": myCache.getStats(), 
            "keys":  myCache.keys(),
        },
    } );
    return;
})

app.all('/eval', async (req, res) => {
    let output = { "status": false, "input":[], "output":[], "error": [] }

    if (req.query && req.query.debug) {
        console.log({
            'now': new Date(), 
            'query_strings': req.query,
            'post': req.body,
        });
    }

    output['status'] = true;

    let prepareJSInput = [];
    if (req.query && req.query.js)
        prepareJSInput.push(req.query.js);
    if (req.body && req.body.js) 
        prepareJSInput.push(req.body.js);

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
    output['status'] = true;
    prepareJSInput.forEach(function(target) {
        if (Array.isArray(target)) {
            for (let i=0, cnt=target.length ; i<cnt ; ++i) {
                try {
                    const testURL = new URL(target[i]);
                    output['input'].push( testURL.href );
                    output['error'].push( null );
                } catch (e) {
                    output['status'] = false;
                    output['input'].push( target[i] );
                    output['error'].push( e );
                }
            }
        } else {
            try {
                const testURL = new URL(target);
                output['input'].push( testURL.href );
                output['error'].push( null );
            } catch (e) {
                output['status'] = false;
                output['input'].push( target );
                output['error'].push( e );
            }
        }
    });

    if (!output['status']) {
        res.json(output);
        return;
    }

    output['input'].forEach(async function(jsURL, index) {
        let cacheKey = jsURL;
        var value = myCache.get( cacheKey );
        if (value == undefined) {
            let data = await fetchRemoteResource(jsURL);
            if (data && data.length > 0) {
                myCache.mset([
                    {
                        key: cacheKey, 
                        val: data,
                        ttl: 3600,
                    }
                ]);
            }
            value = data;
        }
        if (value == undefined) {
            output['error'][index] = "data not found";
            output['status'] = false;
            output['output'][index] = 'error';
        } else {
            try {
                (function () {
                    require('browser-env')();
                    eval(value);
                    output['output'][index] = 'done';
                })();
            } catch (e) {
                output['error'][index] = "eval error: " + e;
                output['status'] = false;
                output['output'][index] = 'eval error';
            }
        }
    });

    while (output['output'].length != output['input'].length) {
        await sleep( 100 );
    }
    res.json(output);
    return;
})

app.listen(port, () => {
    console.log(`running on port ${port}`)
})
