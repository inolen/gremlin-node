var g = require('gremlin-node'),
    repl = require("repl");

process.stdout.write('\n');
process.stdout.write('         \\,,,/' + '\n');
process.stdout.write('         (o o)' + '\n');
process.stdout.write('-----oOOo-(_)-oOOo-----' + '\n');

var r = repl.start({
  prompt: "gremlin> ",
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  writer: outFunc
})


function _isObject(o) {
    return toString.call(o) === '[object Object]';
}

function outFunc(it){ 
    var arr;
        if(_isObject(it) && it.Type == 'GremlinJSPipeline'){
            arr = it.iterator();
            while(arr.hasNextSync()){
                process.stdout.write('==>'+arr.nextSync()+'\n');
            }

        } else {
            process.stdout.write('==>'+it+'\n');
        }
        return '';
}

r.context.g = g;

r.on('exit', function () {
  console.log('Good-bye from Gremlin!');
  process.exit();
});