var g = require("gremlin"),
	T = g.Tokens,
	//Compare = g.Compare,
	Direction = g.Direction,
	Type = g.ClassTypes;

/*Titan specific Enums >>>>>*/
var TTC = g.java.import("com.thinkaurelius.titan.graphdb.types.TitanTypeClass");
var UniqCon = g.java.import("com.thinkaurelius.titan.core.TypeMaker$UniquenessConsistency");
/*Titan specific Enums <<<<<*/
//console.log(TTC.LABEL.toString());
//console.log(TTC.KEY.toString());
//console.log(UniqCon.LOCK.toString());
//console.log(UniqCon.NO_LOCK.toString());

var BaseConfiguration = g.java.import('org.apache.commons.configuration.BaseConfiguration');

conf = new BaseConfiguration();
conf.setPropertySync("storage.backend","cassandra");
conf.setPropertySync("storage.hostname","127.0.0.1");
conf.setPropertySync("storage.keyspace","titan");

var TitanFactory = g.java.import('com.thinkaurelius.titan.core.TitanFactory');
var gt = TitanFactory.openSync(conf);
g.SetGraph(gt);

gt.makeTypeSync().nameSync("foo").dataTypeSync(Type.String.class).indexedSync(Type.Vertex.class)
 	.uniqueSync(Direction.BOTH, UniqCon.NO_LOCK).makePropertyKeySync();

// var vertex = gt.addVertexSync(null);
// vertex.setPropertySync('name', 'Frank');
// gt.commitSync();

//g.v(8, 12).consoleOut();
// g.E().has('weight', T.gt, g.Float(0.2)).property('weight').consoleOut();
// g.V('name','Frank').consoleOut();
g.V().consoleOut();
console.log("All good!");