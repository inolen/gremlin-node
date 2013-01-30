g = require('../../gremlin-node');

//new Graph()

/*
Transform
        _
        both
        bothE
        bothV
        cap
        E
        gather
        id
        in
        inE
        inV
        key
        label
        map
        memoize
        order
        out
        outE
        outV
        path
        scatter
        select
        transform
        V
*/
describe('Basic Transforms', function(){

  it('both', function(){
    var control = new g.ArrayList();
    control.addSync(g.v(1).next());
    control.addSync(g.v(5).next());
    control.addSync(g.v(3).next());
    
    var test = g.v(4).both('knows', 'created').toList();
    expect(test.containsAllSync(control)).toEqual(true);
    
  });

});