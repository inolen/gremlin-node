g = require('gremlin-node'),
T = g.Tokens;

var TinkerGraphFactory = g.java.import("com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory");
var tg = TinkerGraphFactory.createTinkerGraphSync();
g.SetGraph(tg);

console.log('1==>'+g.V('name', 'marko').out('knows').property('name').toList().toString());

console.log('2==>'+g.E().has('weight', T.gt, '0.5f').toList().toString());

console.log('3==>'+g.V().and(g._().both("knows"), g._().both("created")).toArray().toString());

console.log('4==>'+g.v(1).out().gather(function(it){ return it.sizeSync();}).toList().toString());

console.log('5==>'+g.v(1).out().in().dedup().toList().toString());

console.log('6==>'+g.V().and(g._().both("knows"), g._().both("created")).toList().toString());


var list = new g.ArrayList();
g.v(1).out().fill(list);
console.log('fill==>'+list.toString());



var map = new g.HashMap();
g.V().groupBy(map, '{it}{it.out}').iterate();

console.log('map ==>'+ map.toString());


var r = g.V().out().groupBy('{it.name}{it.in}{it.unique().findAll{i -> i.age > 30}.name}').cap().toArray();
console.log('7==>'+ r.toString());

var m = new g.ArrayList();

var t = g.v(1).out().fill(m);
console.log('8==>'+t.toString());
console.log('9==>'+m.toString());

var x = new g.ArrayList();
 
//When filling variables need to force the iteration with
//the last call being iterate(), toList() or toArray() 

//var a1 = g.v(1).out().aggregate(x).out().retain(x);
var a1 = g.v(1).out().store(x).next();
console.log('10==>'+a1.toString());
console.log('11==>'+x.toString());

console.log('12==>'+g.V().retain([g.v(1), g.v(2)]).toList().toString());


var xx = g.E().has('weight', T.gt, '0.5f');
console.log('13==>'+xx.inV().toList().toString());


var map2 = new g.HashMap();
g.V().out().out().memoize(1, map2).property('name').iterate();
console.log('map2 ==>'+ map2.toString());


var t = new g.Table();
var tableList = g.V().property('name').as('name').back(1).property('age').as('age').table(t).toList();
console.log('tableList ==>'+ tableList.toString());
console.log('table ==>'+ t.toString());

console.log('cap==>'+g.V('lang', 'java').in('created').property('name').groupCount().cap().toList());

//Should throw err because tree needs arguments
//console.log('tree1==>'+g.v(1).out().out().tree().toList() );

console.log('back==>'+g.V().out('knows').has('age', T.gt, 30).back(2).property('age').toArray());

console.log('back2==>'+g.V().as('x').outE('knows').inV().has('age', T.gt, 30).back('x').property('age').toArray());

console.log('memoize==>'+g.V().out().as('here').out().memoize('here').property('name').toArray());

console.log('JSON==>'+g.v(1).out('knows').toJSON());
console.log('JSON property==>'+g.v(1).out('knows').toJSON()[0].name);

