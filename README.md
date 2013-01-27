gremlin-node
============

Node.JS implementation of [Gremlin](https://github.com/tinkerpop/gremlin/wiki).

## Dependancies

[__node-java__](https://github.com/nearinfinity/node-java)

Bridge API to connect with existing Java APIs. Please read the [__node-java__](https://github.com/nearinfinity/node-java) installation notes, as it outlines how to install the node-java module on specific platforms and it's dependancies. N.B. One of it's dependancies is python 2.x.

## Installation

```bash
$ npm install gremlin-node
```

Place the .jar files for the desired Blueprints database into a directory within the module. You can place them in lib or create a new folder and place them there. You can organise them how you please. Gremlin-node will find them. Class files will however, need to be placed in the ``lib`` directory.

Then in node:

```
var g = require(“gremlin-node”),
    T = g.Tokens;
```

N.B. Gremlin-node is still in development and only implements the TinkerGraph mock database and OrientDB (remote: connection only) for proof of concept. We will add the other Blueprints databasees soon.

## Introduction

Gremlin-node is a javascript wrapper around the Gremlin API. The node-java module provides the bridge between node and Java, allowing gremlin-node to access java classes and methods. Node.JS adopts a non-blocking I/O model, which means function calls are asynchronous. Node-java remains true to this model and requires that calls to Java are also asynchronous and therefore require a callback. See the example below, the ``add`` method has a node style callback.

```javascript
var list = new ArrayList();

list.add("itemA", function(err, result) {
    if(err) { console.error(err); return; }
});

```

However, node-java does allow for synchronous calls, but requires that the method name be suffixed with the word 'Sync'. It can then be treated like a regular Java call. The example below shows the synchronous version of the ``add`` method being called synchronously.

```javascript
var list = new ArrayList();

list.addSync('item1');
```

All gremlin-node calls are synchronous by default, so there is no need to add 'Sync' to method calls. Gremlin-node tries to implement Gremlin syntax as closely as possible. However, there are some differences.

* All method calls require brackets __()__, even if there are no arguments.
* __Closures__ passed in as string.

    ```e.g.
    g.v(1).out().gather('{it.size()}')
    ```
* __Float__'s are not native javascript Types so need to be passed in as a string to gremlin-node methods. Floats need to be suffixed with a 'f'.

    ```e.g.
    g.v(1).outE().has("weight", T.gte, "0.5f").property("weight")
    ```

As mentioned above, gremlin-node is a javascript wrapper. We are, however, able to get access to the actual gremlin pipeline by calling the ``pipe`` or ``iterator`` methods. These methods return the Java version of the Gremlin pipeline, which you can make calls against. But remember, now that we are calling Java methods, we need to provide a callback or append 'Sync' to the method names. This will become clearer as we go along. 

## API
 Still to come...meanwhile the examples below should get you started.

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

##TODO
* Add other Blueprints Graphs
* Create, Update, Delete
* Indexing
* Error trapping
* Testing

## Author

Frank Panetta  - [Follow @entrendipity](https://twitter.com/intent/follow?screen_name=entrendipity)

##License
###The MIT License (MIT)

Copyright (c) 2013 entrendipity pty ltd

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
