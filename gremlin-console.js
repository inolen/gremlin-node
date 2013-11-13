'use strict';

var gremlin = require('./gremlin-node')(),
    T = gremlin.Tokens,
    repl = require('repl')/*,
    require('repl.history')(repl, './.node_history')*/;

var TinkerGraphFactory = gremlin.java.import('com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory');
var TitanFactory = gremlin.java.import('com.thinkaurelius.titan.core.TitanFactory');
var GraphOfTheGodsFactory = gremlin.java.import('com.thinkaurelius.titan.example.GraphOfTheGodsFactory');

process.stdout.write('\n');
process.stdout.write('         \\,,,/' + '\n');
process.stdout.write('         (o o)' + '\n');
process.stdout.write('-----oOOo-(_)-oOOo-----' + '\n');

var r = repl.start({
    prompt: 'gremlin> ',
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    writer: outFunc,
    ignoreUndefined: true
});

function _isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
}

function outFunc(it){
    var arr, msg;
    if(_isObject(it) && it.Type === 'GremlinJSPipeline'){
        arr = it.pipeline.toListSync();
        process.stdout.write('==>' + arr + '\n');
    } else {
        msg = it.graph ? it.graph.toString() : it.toString();
        process.stdout.write('==>'+ msg +'\n');
    }
    return '';
}

r.context.gremlin = gremlin;
r.context.TinkerGraphFactory = TinkerGraphFactory;
r.context.TitanFactory = TitanFactory; //TitanFactory.openSync('./tmp/titan');
r.context.GraphOfTheGodsFactory = GraphOfTheGodsFactory;

r.on('exit', function () {
    console.log('Good-bye from Gremlin!');
    process.exit();
});
