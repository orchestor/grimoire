#!/usr/local/bin/node

var grimoire = require("./src/grimoire/grimoire.js");
var argv = require('minimist')(process.argv.slice(2));
var fs = require("fs");
var topic = argv['t'];
var item = argv['i'];
var k = argv['k'];
if (!topic || !item || !k) {
    console.log("-t <topic> -i <item> -k grok/grimoire ");
    console.log("current topics:");
    for (var topic in grimoire) {
        console.log(topic);
    }
} else {
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
    }
    grimoire[topic][item] = {
        "parts": [item],
        "tags": []
    }
    fs.writeFileSync(folder + "/" + item + ".md", "# " + item + "\n");
    if (k) {
        grimoire[topic][item]["tags"].push(k)
    }
    //console.log(grimoire);
    var gString = "module.exports = " + JSON.stringify(grimoire, null, 2)
    fs.writeFileSync("src/grimoire/grimoire.js", gString);
    console.log(gString);
}
/*
 "fullstack": {
        "openchain": {
            "parts": ["openchain"],
            "tags": []
        }
    }
*/