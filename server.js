var express = require('express');
var bodyParser = require('body-parser');
var config = require(__dirname + '/config.js');



//first launch
var fs = require('fs');
var folder = "src/grimoire";
if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
}
var file = folder + "/grimoire.js";
if (!fs.existsSync(file)) {
    var startQ = { tutorial: { simple: { parts: [], tags: [], interval: 0, last: 0, gtype: "grimroire" } } };
    fs.writeFileSync("./src/grimoire/grimoire.js", "module.exports = " + JSON.stringify(startQ));
}



var webpack = require("webpack");
var webpackConfig = require("./webpack.config.js");
var compiler = webpack(webpackConfig);
compiler.watch({ // watch options:
    aggregateTimeout: 3000, // wait so long for more changes
    poll: false // use polling instead of native watchers
        // pass a number to set the polling interval
}, function(err, stats) {
    // ...
    console.log("err", err);
});

var doCompileStep = false; //compile all md to html


var app = express();

var chokidar = require('chokidar');


//var sys = require('sys');
var exec = require('child_process').exec;


app.use(express.static(__dirname + '/src'));
app.use(bodyParser.json({ limit: '10mb' }));
//app.use(express.bodyParser({ limit: '50mb' }))
app.listen(config.express.port, '0.0.0.0');


var md = require('markdown-it')(),
    mk = require('markdown-it-katex');
md.use(mk);

var sections = require("sections");

function compile(topic, item) {
    console.log("recompiling...");
    var dir = "./src/grimoire";
    var grimoire = require("./src/grimoire/grimoire.js");
    //console.log("module.exports = " + JSON.stringify(grimoire, null, 2));
    //make this smarter (else it will take too long to load)
    //only update if newer than last update ... 
    function compileStep(topic, item) {
        grimoire[topic][item]["parts"].forEach(function(part) {
            //console.log(part);
            var fiName = dir + "/" + topic + "/" + item + "/" + part;
            //add this back in when you add the static compilation stuff
            /*
            var test = fs.readFileSync(fiName + ".md", 'utf8');
            var parsedSections = sections.parse(test);
            //console.log("ps", parsedSections);
            var ii = 0;
            parsedSections.sections.forEach(function(sect) {
                //console.log("sect", sect["body"]);
                result = md.render(sect["body"]);
                fs.writeFileSync(fiName + String(ii++) + ".html", result);
            })
            grimoire[topic][item]["headings"] = parsedSections["headings"];
            */
            //result = md.render(test);
            //fs.writeFileSync(fiName + ".html", result);
            //console.log(result);
        });
        if (!("gtype" in grimoire[topic][item])) {
            grimoire[topic][item]["gtype"] = "grok";
        }
    }
    if (!topic || !item) {
        for (var topic in grimoire) {
            //console.log(topic);
            for (var item in grimoire[topic]) {
                //console.log(item);
                compileStep(topic, item);
                //check if topic / item has interval and last?
                var theItem = grimoire[topic][item];
                if (!("interval" in theItem | "last" in theItem)) {
                    var firstFibInterval = Math.floor(24 * 60 * 60 / 1.61);
                    grimoire[topic][item]["interval"] = firstFibInterval;
                    grimoire[topic][item]["last"] = Math.floor(Date.now() / 1000) - firstFibInterval - 1;
                }
            }
        }
    } else {
        compileStep(topic, item);
    }
    fs.writeFileSync("./src/grimoire/grimoire.js", "module.exports = " + JSON.stringify(grimoire, null, 2));
}
compile()

function compileFile(fiName) {
    //console.log("recompiling...");
    parts = fiName.split("/");
    topic = parts[2];
    item = parts[3];
    var dir = "./src/grimoire";
    var grimoire = require("./src/grimoire/grimoire.js");
    var test = fs.readFileSync(fiName, 'utf8');
    var parsedSections = sections.parse(test);
    //console.log("ps", parsedSections);
    var ii = 0;
    if (doCompileStep) {
        parsedSections.sections.forEach(function(sect) {
            //console.log("sect", sect["body"]);
            //console.log(sect["body"]);
            result = md.render(sect["body"]);
            fs.writeFileSync(fiName.replace(".md", "") + String(ii++) + ".html", result);
        })
    }
    if (topic) {
        try {
            grimoire[topic][item]["headings"] = parsedSections["headings"];
            fs.writeFileSync("./src/grimoire/grimoire.js", "module.exports = " + JSON.stringify(grimoire, null, 2));
        } catch (e) { // this will happen if topic is undefined.. 
            console.log("error parsing grimoire topic:", topic);
        }
    }
}

var watcher = chokidar.watch('./src/grimoire/', {
    persistent: true,
    depth: 10
});
var log = console.log.bind(console);
watcher
    .on('add', function(path) {
        if (path.indexOf(".md") > 0) {
            log('File', path, 'has been added');
            compileFile(path);
        }
    })
    .on('change', function(path) {
        if (path.indexOf(".md") > 0) {
            compileFile(path);
            log('File', path, 'has been changed');
        }
    })
    .on('ready', function() { log('Initial scan complete. Ready for changes.'); })

//var test = fs.readFileSync(itemDir + "/" + part + ".md", 'utf8');
//result = md.render(test);

//fs.writeFileSync("./src/index.json", JSON.stringify(topicsJ));

function addEntry(topic, item, gtype) {
    var k = "grok";
    var grimoire = require("./src/grimoire/grimoire.js");

    var folder = "src/grimoire/" + topic
    if (!(topic in grimoire)) {
        grimoire[topic] = {}
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    }
    folder = folder + "/" + item
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
        grimoire[topic][item] = {
            "parts": [item],
            "tags": [],
            "interval": 24 * 60 * 60,
            "last": Math.floor(Date.now() / 1000) - 24 * 60 * 60 - 1,
            "gtype": gtype //if grok, item is quizzed. Else just stored for reference
        }
        fs.writeFileSync(folder + "/" + item + ".md", "# " + topic + " / " + item + "\n");
        if (k) {
            grimoire[topic][item]["tags"].push(k)
        }
        //console.log(grimoire);
        var gString = "module.exports = " + JSON.stringify(grimoire, null, 2)
        fs.writeFileSync("src/grimoire/grimoire.js", gString);
        //console.log(gString);
    }
}

function updateMarkdown(topic, item, newMarkdown) {
    var folder = "src/grimoire/" + topic + "/" + item
    fs.writeFileSync(folder + "/" + item + ".md", newMarkdown);
}

function resetGrok(topic, item) {
    var grimoire = require("./src/grimoire/grimoire.js");
    try {
        var firstFibInterval = Math.floor(24 * 60 * 60 / 1.61);
        grimoire[topic][item]["interval"] = firstFibInterval;
        grimoire[topic][item]["last"] = Math.floor(Date.now() / 1000) - firstFibInterval - 1;
        var gString = "module.exports = " + JSON.stringify(grimoire, null, 2)
        fs.writeFileSync("src/grimoire/grimoire.js", gString);
        console.log(gString);
    } catch (e) {
        console.log(e, "fail reset grok");
    }
}

function incrementGrok(topic, item) {
    var grimoire = require("./src/grimoire/grimoire.js");
    try {
        grimoire[topic][item]["interval"] = math.floor(grimoire[topic][item]["interval"] * 1.61);
        grimoire[topic][item]["last"] = Math.floor(Date.now() / 1000);
        var gString = "module.exports = " + JSON.stringify(grimoire, null, 2)
        fs.writeFileSync("src/grimoire/grimoire.js", gString);
        console.log(gString);
    } catch (e) {
        console.log(e, "fail reset grok");
    }
}

function setGtype(topic, item, gtype) {
    var grimoire = require("./src/grimoire/grimoire.js");
    try {
        grimoire[topic][item]["gtype"] = gtype
        var gString = "module.exports = " + JSON.stringify(grimoire, null, 2)
        fs.writeFileSync("src/grimoire/grimoire.js", gString);
        console.log(gString, gtype);
    } catch (e) {
        console.log(e, "fail reset grok");
    }
}

app.post("/resetGrok", function(req, res, next) {
    console.log(req.body);
    var topic = req.body.topic;
    var item = req.body.item;
    resetGrok(topic, item);
});

app.post("/setGtype", function(req, res, next) {
    console.log(req.body);
    var topic = req.body.topic;
    var item = req.body.item;
    var gtype = req.body.gtype;
    setGtype(topic, item, gtype);
});

app.post("/incrementGrok", function(req, res, next) {
    console.log(req.body);
    var topic = req.body.topic;
    var item = req.body.item;
    incrementGrok(topic, item);
});

//we will do this less sketchily once editor is built-in
app.post("/add", function(req, res, next) {
    var topic = req.body.topic;
    var item = req.body.item;
    console.log("adding ", topic, item);
    var gtype = req.body.gtype;
    addEntry(topic, item, gtype);
    //exec("code ./src/grimoire/" + topic + "/" + item + "/" + item + ".md");
    res.send({ success: "success" });
});

app.post("/edit", function(req, res, next) {
    var topic = req.body.topic;
    var item = req.body.item;

    console.log("editing", topic, item);
    var newMarkdown = req.body.newMarkdown;
    updateMarkdown(topic, item, newMarkdown);
    //exec("code ./src/grimoire/" + topic + "/" + item + "/" + item + ".md");
    res.send({ success: "success" });
});

app.post("/addImage", function(req, res, next) {
    console.log(req.body);
    var topic = req.body.topic;
    var item = req.body.item;
    var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");

    var fiName = topic + "-" + item + "-" + String(Math.floor(Date.now() / 1000)) + ".png";
    var thePath = "./src/grimoire/" + topic + "/" + item + "/";
    fs.writeFile(thePath + fiName, base64Data, 'base64', function(err) {
        console.log(err);
        res.send({ filename: fiName });
    });
});

//we will do this less sketchily once editor is built-in
app.post("/read", function(req, res, next) {
    console.log(req.body);
    var topic = req.body.topic;
    var item = req.body.item;
    var fiName = "./src/grimoire/" + topic + "/" + item + "/" + item + ".md";
    try {
        var test = sections.parse(fs.readFileSync(fiName, 'utf8'));
    } catch (e) {
        console.log("error parsing requested topic");
        var gtype = "grok";
        addEntry(topic, item, "grok")
        var test = "# " + topic + " / " + item + "\n";
    }
    res.send({ markdown: test });
    //addEntry(topic, item);
    //exec("code ./src/grimoire/" + topic + "/" + item + "/" + item + ".md");
});

var ip = require("ip");
console.log("ip:", ip.address());

console.log('Listening on port ' + config.express.port);

/* if you want it to open in the browser (kind of annoying if it's already pinned) */
//require("openurl").open("http://"+ip.address()+":" + String(config.express.port));