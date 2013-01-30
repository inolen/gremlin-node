package com.entrendipity.gremlin.javascript;

import com.tinkerpop.blueprints.Element;
import com.tinkerpop.gremlin.Tokens;
import com.tinkerpop.gremlin.groovy.GremlinGroovyPipeline;

/**
 * @author Frank Panetta (frank.panetta@entrendipity.com.au)
 */
public class GremlinJSPipeline<S, E> extends GremlinGroovyPipeline<S, E> {

    private static final String FLOAT_SUFFIX = "f";

    public GremlinJSPipeline() {
        super();
    }

    public GremlinJSPipeline(final Object starts) {
        super(starts);
    }

    public GremlinGroovyPipeline<S, ? extends Element> has(final String key, final String value) {
        if (value.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(value))){
            return (GremlinGroovyPipeline<S, ? extends Element>)super.has(key, Float.parseFloat(value));
        }
        return (GremlinGroovyPipeline<S, ? extends Element>)super.has(key, value);
    }

    public GremlinGroovyPipeline<S, ? extends Element> has(final String key, final Tokens.T comparison, final String value) {
        if (value.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(value))){
            return (GremlinGroovyPipeline<S, ? extends Element>)super.has(key, comparison, Float.parseFloat(value));
        }
        return (GremlinGroovyPipeline<S, ? extends Element>)super.has(key, comparison, value);
    }

    public GremlinGroovyPipeline<S, ? extends Element> hasNot(final String key, final String value) {
        if (value.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(value))){
            return (GremlinGroovyPipeline<S, ? extends Element>)super.hasNot(key, Float.parseFloat(value));
        }
        return (GremlinGroovyPipeline<S, ? extends Element>)super.hasNot(key, value);
    }

    public GremlinGroovyPipeline<S, ? extends Element> hasNot(final String key, final Tokens.T comparison, final String value) {
        if (value.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(value))){
            return (GremlinGroovyPipeline<S, ? extends Element>)super.hasNot(key, comparison, Float.parseFloat(value));
        }
        return (GremlinGroovyPipeline<S, ? extends Element>)super.hasNot(key, comparison, value);
    }

    public GremlinGroovyPipeline<S, ? extends Element> interval(final String key, final String startValue, final String endValue) {
        Object tmpStartValue = startValue;
        Object tmpEndValue = endValue;
        if (startValue.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(startValue))){
            tmpStartValue = Float.parseFloat(startValue);
        }
        if (endValue.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(endValue))){
            tmpEndValue = Float.parseFloat(endValue);
        }
        return (GremlinGroovyPipeline<S, ? extends Element>)super.interval(key, tmpStartValue, tmpEndValue);
    }
}