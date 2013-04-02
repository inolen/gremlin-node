var g = require("gremlin")

/* Copy all of your titan Libs to Libs folder before running this example */

var BaseConfiguration = g.java.import('org.apache.commons.configuration.BaseConfiguration');

conf = new BaseConfiguration();
conf.setPropertySync("storage.backend","cassandra");
conf.setPropertySync("storage.hostname","127.0.0.1");
conf.setPropertySync("storage.keyspace","titan");

var TitanFactory = g.java.import('com.thinkaurelius.titan.core.TitanFactory');
gt = TitanFactory.openSync(conf);
g.SetGraph(gt);

var grandfather = g.V('name','hercules').out('father').out('father').toJSON()[0].name

console.log(grandfather);
