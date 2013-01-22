var g = require('gremlin-node'),
    repl = require("repl");


g.addFunction('count', function() {
  return this.gremlinPipeline.countSync();
});
g.addFunction('next', function(number){
    if(number){
        return this.gremlinPipeline.nextSync(number);    
    }
    return this.gremlinPipeline.nextSync();
});
g.addFunction('toList', function() {
  return this.gremlinPipeline.toListSync();
});
g.addFunction('toArray', function() {
  return this.gremlinPipeline.toListSync().toArraySync();
});
g.addFunction('fill', function(collection) {
  this.gremlinPipeline.fillSync(collection);
  return collection;
});
g.addFunction('size', function() {
  return this.gremlinPipeline.sizeSync();
});
g.addFunction('hasNext', function() {
  return this.gremlinPipeline.hasNextSync();
});
g.addFunction('getCurrentPath', function() {
  return this.gremlinPipeline.getCurrentPathSync();
});
g.addFunction('getPipes', function() {
  return this.gremlinPipeline.getPipesSync();
});
g.addFunction('getStarts', function() {
  return this.gremlinPipeline.getStartsSync();
});
g.addFunction('remove', function(index) {
  return index ? this.gremlinPipeline.removeSync(index) : this.gremlinPipeline.removeSync();
});
g.addFunction('get', function(index) {
  return this.gremlinPipeline.getSync();
});
g.addFunction('equals', function(object) {
  return this.gremlinPipeline.equalsSync(object);
});

//g.orientDB('remote:localhost/tinkerpop');

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
            arr = it.toList();
            for (var i = 0, l = arr.sizeSync(); i < l; i++) {
                process.stdout.write('==>'+arr.getSync(i)+'\n');
            };
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