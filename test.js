var md = require('markdown-it')(),
    mk = require('markdown-it-katex');
var fs = require('fs');

md.use(mk);
var result = md.render('# Math Rulez! \n  $\\sqrt{3x-1}+(1+x)^2$');
//if (fs.existsSync(tdir + '/config.yml')) {
//function loadAll(dir) {
//if (!fs.existsSync(dir)) return;
//var files = fs.readdirSync(dir);
//files.forEach(function(item) {
//require(dir + '/' + item);
//});
//}
//

//if (!fs.existsSync(folder)) {
//fs.mkdirSync(folder);
var test = fs.readFileSync('./test.md', 'utf8');
result = md.render(test);
fs.writeFileSync('test.html', result);
console.log(result);