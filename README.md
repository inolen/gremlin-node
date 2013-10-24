gremlin-node
============

Implementation of [Gremlin](https://github.com/tinkerpop/gremlin/wiki) for node.js. Gremlin-node is a javascript wrapper around the Gremlin API. The node-java module provides the bridge between node and Java, allowing gremlin-node to access java classes and methods.

N.B. Gremlin-node is still in development.

## Dependencies

[__node-java__](https://github.com/nearinfinity/node-java)

Bridge API to connect with existing Java APIs. Please read the [__node-java__](https://github.com/nearinfinity/node-java) installation notes, as it outlines how to install the node-java module on specific platforms and it's dependencies. N.B. One of it's dependencies is python 2.x.


[__maven__](http://maven.apache.org/index.html)

Maven enables the installation of the base jar files. Database specific .jar files need to be sourced from the relevant vendors and placed in the ``lib`` directory.

## Installation

```bash
$ npm install gremlin
```
Gremlin-node includes the required .jar files for Tinkergraph, OrientDB graphEd and Titan.

For other Blueprints database implementations, you will need to obtain the relevant .jars files and place them in the lib directory or create a new folder for them. You can organise them how you please. Gremlin-node will find them. Class files will however, must be placed in the ``lib`` root directory.

Then in node:

```
var g = require(“gremlin”),
    T = g.Tokens,
    Direction = g.Direction,
    Type = g.ClassTypes;
```

Once installation is complete, ensure that you delete the ``target`` directory. Please note that gremlin-node now uses Blueprints 2.4.0 and has upgraded database dependencies. If you are upgrading from an old version you should remove all the old jar files from ``lib/dependencies`` prior to running npm install.

## Introduction

Node.js adopts a non-blocking I/O model, which means function calls are asynchronous. Node-java remains true to this model and requires that calls to Java are also asynchronous and therefore require a callback. See the example below, the ``add`` method has a node style callback.

```javascript
var list = new ArrayList();

list.add("itemA", function(err, result) {
    if(err) { console.error(err); return; }
});
```

However, node-java does allow for synchronous calls, but requires that the method name be suffixed with the word 'Sync'. The example below shows the ``add`` method being called synchronously.

```javascript
var list = new ArrayList();

list.addSync('item1');
```

There is no need to add 'Sync' to gremlin-node functions, as they are synchronous by default. Gremlin-node tries to implement Gremlin syntax as closely as possible. However, there are some differences.

* All method calls require brackets __()__, even if there are no arguments.
* __Closures__ passed in as string.

    ```e.g.
    g.v(1).out().gather('{it.size()}')
    ```
* __Float__ is not a native javascript Type. In order pass an argument as a Float, pass in a string suffixed with a 'f'.

    ```e.g.
    g.v(1).outE().has("weight", T.gte, "0.5f").property("weight")
    ```

As mentioned above, gremlin-node is a javascript wrapper. You are, however, able to access the gremlin pipeline by calling the ``pipe`` or ``iterator`` methods. These methods return the Java version of the Gremlin pipeline. You need to provide a callback or append 'Sync' to the method names for calls against this object. This will become clearer as we go along. 

##Connect to Graph

###TinkerGraph

```javascript
var TinkerGraphFactory = g.java.import("com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory");
var graphDB = TinkerGraphFactory.createTinkerGraphSync();
g.SetGraph(graphDB);
```

###OrientGraph

```javascript
var OrientGraph = g.java.import('com.tinkerpop.blueprints.impls.orient.OrientGraph');
var graphDB = new OrientGraph('local:/path/to/database/files', 'admin', 'admin');
g.SetGraph(graphDB);
```

###Titan

```javascript
var BaseConfiguration = g.java.import('org.apache.commons.configuration.BaseConfiguration');

conf = new BaseConfiguration();
conf.setPropertySync("storage.backend","cassandra");
conf.setPropertySync("storage.hostname","127.0.0.1");
conf.setPropertySync("storage.keyspace","titan");

var TitanFactory = g.java.import('com.thinkaurelius.titan.core.TitanFactory');
graphDB = TitanFactory.openSync(conf);
g.SetGraph(graphDB);
```

##Working with the Database

Once you have connected to the database, you are able to call all implementation specific database methods synchronously. (You can try calling these asynchronously, but I have found that some methods work and some don't).

For example here's how you would add two Vertices and an Edge and associate them in an OrientDB graph.

```javascript
var luca = graphDB.addVertexSync(null);
luca.setPropertySync( "name", "Luca" );

var marko = graphDB.addVertexSync(null);
marko.setPropertySync( "name", "Marko" );

var lucaKnowsMarko = graphDB.addEdgeSync(null, luca, marko, "knows");

graphDB.commitSync();
graphDB.shutdownSync();
```

N.B. Remember to call shutdown if you no longer need the Database.

## Examples

A good resource to understand the Gremlin API is [GremlinDocs](http://gremlindocs.com/). Below are examples of gremlin and it's equivalent gremlin-node syntax.

__Example 1: Basic Transforms__

```
gremlin>  g.V('name', 'marko').out

node>     g.V('name', 'marko').out();

node>     g.V({name: 'marko'}).out();

gremlin>  g.v(1, 4).out('knows', 'created').in

node>     g.v(1, 4).out('knows', 'created').in();

node>     g.v([1, 4]).out(['knows', 'created']).in(); 
```

__Example 2: [i]__

```
gremlin>  g.V[0].name

node>     g.V().index(0).property('name');
```

__Example 3: [i..j]__

```
gremlin>  g.V[0..<2].name

node>     g.V().range(0,1).property('name');
```

__Example 4: has__

```
gremlin>    g.E.has('weight', T.gt, 0.5f).outV.transform{[it.id,it.age]}

node>       g.E().has('weight', T.gt, '0.5f').outV().transform('{[it.id,it.age]}');
```

__Example 5: and & or__


```
gremlin>  g.V.and(_().both("knows"), _().both("created"))

node>     g.V().and(g._().both("knows"), g._().both("created"));

gremlin>  g.v(1).outE.or(_().has('id', T.eq, "9"), _().has('weight', T.lt, 0.6f))

node>     g.v(1).outE().or(g._().has('id', T.eq, 9), g._().has('weight', T.lt, '0.6f')); 
```

__Example 6: groupBy__

```
gremlin>    g.V.out.groupBy{it.name}{it.in}{it.unique().findAll{i -> i.age > 30}.name}.cap

node>       g.V().out().groupBy('{it.name}{it.in}{it.unique().findAll{i -> i.age > 30}.name}').cap();
```

__Example 7: retain__

```
gremlin>  g.V.retain([g.v(1), g.v(2), g.v(3)])

node>     g.V().retain([g.v(1), g.v(2), g.v(3)]);
```

__Example 8: groupBy with map__
```
gremlin>    m = [:]

gremlin>    g.V.groupBy(m){it}{it.out}.iterate();null;

node>       var map = new g.HashMap();

node>       g.V().groupBy(map, '{it}{it.out}').iterate();
```

__Example 9: aggregate__
```
gremlin>    x = []

gremlin>    g.v(1).out.aggregate(x).out.retain(x)

node>       var x = new g.ArrayList();

node>       g.v(1).out().aggregate(x).out().retain(x);
```

__Example 10: accessing returned values__
```
node>       g.v(1).out().iterator().toListSync();

node>       g.v(1).out().toList();

node>       g.v(1).out().toJSON();
```

__Example 11: Adding Vertices and Edge__
```
node>       var luca = graphDB.addVertexSync(null);
node>       luca.setPropertySync( "name", "Luca" );

node>       var marko = graphDB.addVertexSync(null);
node>       marko.setPropertySync( "name", "Marko" );

node>       var lucaKnowsMarko = graphDB.addEdgeSync(null, luca, marko, "knows");

node>       graphDB.commitSync();
```

__Example 12: Updating Vertices__
```
node>       var marko = g.V("name", "Marko").iterator().nextSync();
node>       marko.setPropertySync("name", "Frank");

node>       var luca = g.v("8:27").iterator().nextSync();
node>       luca.setPropertySync("name", "John");

node>       graphDB.commitSync();

```

__Example 13: Removing a Vertex__
```
node>       var marko = g.v(1).iterator().nextSync();
node>		marko.removeSync();
node>		graphDB.commitSync();

```

__Example 14: Removing Vertices__
```
node>       var vertices = g.V().iterator();
node>		var element;
node>		while(vertices.hasNextSync()){
				element = vertices.nextSync();
				element.removeSync();
			};
node>		graphDB.commitSync();

```

__Example 15: Titan Indexing__
```javascript
var g = require("gremlin"),
    T = g.Tokens,
    Direction = g.Direction,
    Type = g.ClassTypes;

//Get a reference to Titan specific Enum
var UniqCon = g.java.import("com.thinkaurelius.titan.core.TypeMaker$UniquenessConsistency");

var BaseConfiguration = g.java.import('org.apache.commons.configuration.BaseConfiguration');

conf = new BaseConfiguration();
conf.setPropertySync("storage.backend","cassandra");
conf.setPropertySync("storage.hostname","127.0.0.1");
conf.setPropertySync("storage.keyspace","titan");

var TitanFactory = g.java.import('com.thinkaurelius.titan.core.TitanFactory');
var graphDB = TitanFactory.openSync(conf);
g.SetGraph(graphDB);

//Create index
graphDB.makeTypeSync().nameSync("foo").dataTypeSync(Type.String.class).indexedSync(Type.Vertex.class)
    .uniqueSync(Direction.BOTH, UniqCon.NO_LOCK).makePropertyKeySync();
```

__Example 7: linkBoth/linkIn/linkOut__

```
gremlin>  marko = g.v(1)
gremlin>  g.V.except([marko]).linkBoth('connected', marko)

// This type of operation, retrieving the underlying vertex using nextSync()
// cannot be done on a JS variable
node>     g.V().except(g.v(1)).linkBoth('connected', g.v(1).iterator().nextSync());
```

## Performance Tuning

Please refer to [Tuning Linux & the JVM for Graph Databases](https://github.com/tinkerpop/blueprints/wiki/Tuning-Linux-&-the-JVM-for-Graph-Databases) for implementation specific performance tuning.

## Author

Frank Panetta  - [Follow @entrendipity](https://twitter.com/intent/follow?screen_name=entrendipity)

Anthony Pesch - [inolen](https://github.com/inolen)

## Contributors

Jared Camins-Esakov

##License
###The MIT License (MIT)

Copyright (c) 2013 entrendipity pty ltd
Parts copyright (c) 2013 C & P Bibliography Services, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
