'use strict';

// Controls Interface class is used to provide something to the UI that it can bind to.
// It helps the UI keep in line with the layer state.
// Due to bindings, we cannot destroy & recreate an interface when a legend item
// goes from 'Unknown Placeholder' to 'Specific Layer Type'. This means we cannot
// do object heirarchies, as to go from PlaceholderInterface to FeatureLayerInterface
// would require a new object. Instead, we have a class that exposes all possible
// methods and properties as error throwing stubs. Then we replace those functions
// with real ones once we know the flavour of interface we want.

class LayerInterface {

    /**
     * @param {Object} source     object that provides info to the interface. usually a LayerRecord or FeatureClass
     */
    constructor (source) {
        this._source = source;

        // TODO revisit isPlaceholder after grand refactor
        this._isPlaceholder = true;
    }

    get isPlaceholder () { return this._isPlaceholder; } // returns Boolean

    // these expose ui controls available on the interface and indicate which ones are disabled
    get symbology () { return undefined; } // returns Array

    // can be group or node name
    get name () { return undefined; } // returns String

    // these are needed for the type flag
    get layerType () { return undefined; } // returns String
    get geometryType () { return undefined; } // returns String
    get featureCount () { return undefined; } // returns Integer
    get extent () { return undefined; } // returns Object (Esri Extent)

    // layer states
    get state () { return undefined; } // returns String

    // these return the current values of the corresponding controls
    get visibility () { return undefined; } // returns Boolean
    get opacity () { return undefined; } // returns Decimal
    get query () { return undefined; } // returns Boolean
    get snapshot () { return undefined; } // returns Boolean
    get highlightFeature () { return undefined; } // returns Boolean

    // fetches attributes for use in the datatable
    get formattedAttributes () { return undefined; } // returns Promise of Object

    // returns a feature name of an attribute set
    getFeatureName () { return undefined; } // returns String

    // formats an attribute to standard details
    attributesToDetails () { return undefined; } // returns Array

    // these set values to the corresponding controls
    setVisibility () { return undefined; }
    setOpacity () { return undefined; }
    setQuery () { return undefined; }

    fetchGraphic () { return undefined; } // returns promise that resolves with object containing graphics info
    zoomToBoundary () { return undefined; } // returns promise that resolves after zoom completes

    // param: string
    setDefinitionQuery () { return undefined; }

    // param: spatialReference object
    validateProjection () { return undefined; } // returns Boolean

    // updates what this interface is pointing to, in terms of layer data source.
    // often, the interface starts with a placeholder to avoid errors and return
    // defaults. This update happens after a layer has loaded, and new now want
    // the interface reading off the real FC.
    // TODO docs
    updateSource (newSource) {
        this._source = newSource;
    }

    convertToSingleLayer (layerRecord) {
        this._source = layerRecord;
        this._isPlaceholder = false;

        newProp(this, 'symbology', standardGetSymbology);
        newProp(this, 'state', standardGetState);

        newProp(this, 'visibility', standardGetVisibility);
        newProp(this, 'opacity', standardGetOpacity);
        newProp(this, 'query', standardGetQuery);

        newProp(this, 'name', standardGetName);

        newProp(this, 'geometryType', standardGetGeometryType);
        newProp(this, 'layerType', standardGetLayerType);
        newProp(this, 'featureCount', standardGetFeatureCount);
        newProp(this, 'extent', standardGetExtent);

        this.setVisibility = standardSetVisibility;
        this.setOpacity = standardSetOpacity;
        this.setQuery = standardSetQuery;
        this.zoomToBoundary = standardZoomToBoundary;
        this.validateProjection = standardValidateProjection;
    }

    convertToFeatureLayer (layerRecord) {
        this.convertToSingleLayer(layerRecord);

        newProp(this, 'snapshot', featureGetSnapshot);
        newProp(this, 'formattedAttributes', standardGetFormattedAttributes);
        newProp(this, 'geometryType', featureGetGeometryType);
        newProp(this, 'featureCount', featureGetFeatureCount);
        newProp(this, 'highlightFeature', featureGetHighlightFeature);

        this.getFeatureName = featureGetFeatureName;
        this.attributesToDetails = featureAttributesToDetails;
        this.fetchGraphic = featureFetchGraphic;
        this.setDefinitionQuery = featureSetDefinitionQuery;
    }

    convertToDynamicLeaf (dynamicFC) {
        this._source = dynamicFC;
        this._isPlaceholder = false;

        newProp(this, 'symbology', dynamicLeafGetSymbology);
        newProp(this, 'state', dynamicLeafGetState);

        newProp(this, 'name', dynamicLeafGetName);

        newProp(this, 'visibility', dynamicLeafGetVisibility);
        newProp(this, 'opacity', dynamicLeafGetOpacity);
        newProp(this, 'query', dynamicLeafGetQuery);
        newProp(this, 'formattedAttributes', dynamicLeafGetFormattedAttributes);

        newProp(this, 'geometryType', dynamicLeafGetGeometryType);
        newProp(this, 'layerType', dynamicLeafGetLayerType);
        newProp(this, 'featureCount', dynamicLeafGetFeatureCount);
        newProp(this, 'extent', dynamicLeafGetExtent);

        newProp(this, 'highlightFeature', dynamicLeafGetHighlightFeature);

        this.setVisibility = dynamicLeafSetVisibility;
        this.setOpacity = dynamicLeafSetOpacity;
        this.setQuery = dynamicLeafSetQuery;
        this.zoomToBoundary = dynamicLeafZoomToBoundary;
        this.getFeatureName = featureGetFeatureName;
        this.attributesToDetails = dynamicLeafAttributesToDetails;
        this.fetchGraphic = dynamicLeafFetchGraphic;
        this.setDefinitionQuery = dynamicLeafSetDefinitionQuery;
    }

    convertToPlaceholder (placeholderFC) {
        this._source = placeholderFC;
        this._isPlaceholder = true;

        newProp(this, 'symbology', standardGetSymbology);
        newProp(this, 'name', standardGetName);
        newProp(this, 'state', standardGetState);
        newProp(this, 'layerType', standardGetLayerType);
    }

}

/**
 * Worker function to add or override a get property on an object
 *
 * @function newProp
 * @private
 * @param {Object} target     the object that will receive the new property
 * @param {String} propName   name of the get property
 * @param {Function} getter   the function defining the guts of the get property.
 */
function newProp(target, propName, getter) {
    Object.defineProperty(target, propName, {
        get: getter,
        enumerable: true,
        configurable: true
    });
}

// these functions are upgrades to the duds above.
// we don't use arrow notation, as we want the `this` to point at the object
// that these functions get smashed into.

function standardGetState() {
    /* jshint validthis: true */
    return this._source.state;
}

function dynamicLeafGetState() {
    /* jshint validthis: true */
    return this._source.state;
}

function standardGetVisibility() {
    /* jshint validthis: true */
    return this._source.visibility;
}

function dynamicLeafGetVisibility() {
    /* jshint validthis: true */
    return this._source.getVisibility();
}

function standardGetName() {
    /* jshint validthis: true */
    return this._source.name;
}

function dynamicLeafGetName() {
    /* jshint validthis: true */
    return this._source.name;
}

function standardGetOpacity() {
    /* jshint validthis: true */
    return this._source.opacity;
}

function dynamicLeafGetOpacity() {
    /* jshint validthis: true */
    return this._source.opacity;
}

function standardGetLayerType() {
    /* jshint validthis: true */
    return this._source.layerType;
}

function dynamicLeafGetLayerType() {
    /* jshint validthis: true */
    return this._source.layerType;
}

function standardGetExtent() {
    /* jshint validthis: true */
    return this._source.extent;
}

function dynamicLeafGetExtent() {
    /* jshint validthis: true */
    return this._source.extent;
}

function standardGetQuery() {
    /* jshint validthis: true */
    return this._source.isQueryable();
}

function dynamicLeafGetQuery() {
    /* jshint validthis: true */
    return this._source.queryable;
}

function standardGetFormattedAttributes() {
    /* jshint validthis: true */

    return this._source.getFormattedAttributes();
}

function dynamicLeafGetFormattedAttributes() {
    /* jshint validthis: true */

    // TODO code-wise this looks identical to standardGetFormattedAttributes.
    //      however in this case, ._source is a DynamicFC, not a LayerRecord.
    //      This is safer. Deleting this would avoid the duplication. Decide.
    return this._source.getFormattedAttributes();
}

function standardGetSymbology() {
    /* jshint validthis: true */
    return this._source.symbology;
}

function dynamicLeafGetSymbology() {
    /* jshint validthis: true */

    // TODO code-wise this looks identical to standardGetSymbology.
    //      however in this case, ._source is a DynamicFC, not a LayerRecord.
    //      This is safer. Deleting this would avoid the duplication. Decide.
    return this._source.symbology;
}

function standardGetGeometryType() {
    /* jshint validthis: true */
    return undefined;
}

function featureGetGeometryType() {
    /* jshint validthis: true */
    return this._source.getGeomType();
}

function dynamicLeafGetGeometryType() {
    /* jshint validthis: true */

    // TEST STATUS none
    return this._source.geomType;
}

function standardGetFeatureCount() {
    /* jshint validthis: true */
    return undefined;
}

function featureGetFeatureCount() {
    /* jshint validthis: true */
    return this._source.featureCount;
}

function dynamicLeafGetFeatureCount() {
    /* jshint validthis: true */
    return this._source.featureCount;
}

function standardSetVisibility(value) {
    /* jshint validthis: true */
    this._source.visibility = value;
}

function dynamicLeafSetVisibility(value) {
    /* jshint validthis: true */
    this._source.setVisibility(value);
}

function standardSetOpacity(value) {
    /* jshint validthis: true */
    this._source.opacity = value;
}

function dynamicLeafSetOpacity(value) {
    /* jshint validthis: true */
    this._source.opacity = value;
}

function standardSetQuery(value) {
    /* jshint validthis: true */
    this._source.setQueryable(value);
}

function dynamicLeafSetQuery(value) {
    /* jshint validthis: true */
    this._source.queryable = value;
}

function featureGetSnapshot() {
    /* jshint validthis: true */
    return this._source.isSnapshot;
}

function featureGetHighlightFeature() {
    return true;
}

function dynamicLeafGetHighlightFeature() {
    /* jshint validthis: true */
    return this._source.highlightFeature;
}

function standardZoomToBoundary(map) {
    /* jshint validthis: true */
    this._source.zoomToBoundary(map);
}

function dynamicLeafZoomToBoundary(map) {
    /* jshint validthis: true */
    this._source.zoomToBoundary(map);
}

function featureGetFeatureName(objId, attribs) {
    /* jshint validthis: true */
    return this._source.getFeatureName(objId, attribs);
}

function featureAttributesToDetails(attribs, fields) {
    /* jshint validthis: true */
    return this._source.attributesToDetails(attribs, fields);
}

function dynamicLeafAttributesToDetails(attribs, fields) {
    /* jshint validthis: true */
    return this._source._parent.attributesToDetails(attribs, fields);
}

function featureFetchGraphic(oid, ignoreLocal = false) {
    /* jshint validthis: true */
    return this._source.fetchGraphic(oid, ignoreLocal);
}

function dynamicLeafFetchGraphic(oid, ignoreLocal = false) {
    /* jshint validthis: true */
    return this._source.fetchGraphic(oid, ignoreLocal);
}

function featureSetDefinitionQuery(query) {
    /* jshint validthis: true */
    this._source.setDefinitionQuery(query);
}

function dynamicLeafSetDefinitionQuery(query) {
    /* jshint validthis: true */
    this._source.setDefinitionQuery(query);
}

function standardValidateProjection(spatialReference) {
     /* jshint validthis: true */
    return this._source.validateProjection(spatialReference);
}

module.exports = () => ({
    LayerInterface
});
