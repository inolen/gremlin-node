package com.entrendipity.gremlin.javascript;

import com.tinkerpop.blueprints.Element;
import com.tinkerpop.gremlin.Tokens;
import com.tinkerpop.gremlin.java.GremlinPipeline;


/**
 * @author Frank Panetta (frank.panetta@entrendipity.com.au)
 */
public class GremlinJSPipeline<S, E> extends GremlinPipeline<S, E> {

    private static final String FLOAT_SUFFIX = "f";

    public GremlinJSPipeline() {
        super();
    }

    public GremlinJSPipeline(final Object starts, final boolean doQueryOptimization) {
        super(starts, doQueryOptimization);
    }

    public GremlinJSPipeline(final Object starts) {
        this(starts, true);
    }

    public GremlinPipeline<S, ? extends Element> has(final String key, final String value) {
        if (value.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(value))){
            return super.has(key, Float.parseFloat(value));
        }
        return super.has(key, value);
    }

    public GremlinPipeline<S, ? extends Element> has(final String key, final Tokens.T comparison, final String value) {
        if (value.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(value))){
            return super.has(key, comparison, Float.parseFloat(value));
        }
        return super.has(key, comparison, value);
    }

    public GremlinPipeline<S, ? extends Element> hasNot(final String key, final String value) {
        if (value.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(value))){
            return super.hasNot(key, Float.parseFloat(value));
        }
        return super.hasNot(key, value);
    }

    public GremlinPipeline<S, ? extends Element> hasNot(final String key, final Tokens.T comparison, final String value) {
        if (value.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(value))){
            return super.hasNot(key, comparison, Float.parseFloat(value));
        }
        return super.hasNot(key, comparison, value);
    }

    public GremlinPipeline<S, ? extends Element> interval(final String key, final String startValue, final String endValue) {
        Object tmpStartValue = startValue;
        Object tmpEndValue = endValue;
        if (startValue.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(startValue))){
            tmpStartValue = Float.parseFloat(startValue);
        }
        if (endValue.endsWith(FLOAT_SUFFIX) && !Float.isNaN(Float.parseFloat(endValue))){
            tmpEndValue = Float.parseFloat(endValue);
        }
        return super.interval(key, tmpStartValue, tmpEndValue);
    }
}