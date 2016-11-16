/// <reference path="lib/aviation.min.js" />

// helper functions ---
function buildDataNodes() {

    var dataNodes = {};

    for (var i = 0; i < arguments.length; i++) {

        for (var j = 0; j < arguments[i].length; j++) {

            if (!(arguments[i][j]["Location ID"] in dataNodes)) {

                dataNodes[arguments[i][j]["Location ID"]] = {};
            }

            if (!(i in dataNodes[arguments[i][j]["Location ID"]])) {

                dataNodes[arguments[i][j]["Location ID"]][i] = [];
            }

            dataNodes[arguments[i][j]["Location ID"]][i].push(arguments[i][j]);
        }
    }
    
    dataNodes = Object.keys(dataNodes).map(function (nodeString, i) {

        return buildDataNode(nodeString, dataNodes[nodeString], i);
    });

    return dataNodes;
}

function buildDataNode(nodeString, data, index) {

    nodeString = nodeString.split('}');

    var point2d = (nodeString[0] + "}").replace('Point2D ', ''),
        name = data[0][0]["Name"],
        locationType = data[0][0]["Location type"];

    point2d = point2d.replace(/=/g, ':');
    point2d = point2d.replace(/ /g, '"');
    point2d = point2d.replace(/,/g, '",');
    point2d = JSON.parse(point2d);

    for (var key in point2d) {
        point2d[key] = parseFloat(point2d[key]);
    }

    dataNode = new DataNode(point2d, name, locationType);
    dataNode.setData(data);

    return dataNode;
}

// model ---
function DataNode(point2d, name, locationType) {

    this._pos = point2d;
    this._name = name;
    this._locationType = locationType;
    this._data = {};
    this._attributes = {};

    this.isActive = true;
}
DataNode.prototype = {

    getName: function () {

        return this._name;
    },

    getLocationType: function () {

        return this._locationType;
    },

    setData: function (data) {

        this._data = data;
    },

    getData: function () {
       
        return this._data;
    },

    findData: function () { // specific to csv

        var data = {};

        for (var scheme in this.getData()) {

            data[scheme] = this.getData()[scheme].find(function (data) {

                return data['Passenger type'] == 'All' &&
                    data['Value'] == 'MEAN';

            });
        };

        return data;
    },

    getAttribute: function (key) {

        if (key in this._attributes) {
            
            return this._attributes[key];
        }

        return null;
    },

    setAttribute: function (key, value) {

        this._attributes[key] = value;
    }
}

function Model() {

    this._dataNodes = [];
    this._dataNodeLocationTypes = {};
    this._dataNodeNames = {};
    this._dxf = null;
}
Model.prototype = {

    setDataNodes: function (dataNodes) {

        this._dataNodes = dataNodes;

        for (var i = 0; i < this._dataNodes.length; i++) {

            var dataNode = this._dataNodes[i];

            if (!(dataNode.getLocationType() in this._dataNodeLocationTypes)) {
                this._dataNodeLocationTypes[dataNode.getLocationType()] = [];
            }

            if (!(dataNode.getName() in this._dataNodeNames)) {
                this._dataNodeNames[dataNode.getName()] = [];
            }

            this._dataNodeLocationTypes[dataNode.getLocationType()].push(dataNode);
            this._dataNodeNames[dataNode.getName()].push(dataNode);
        }
    },

    getDataNodes: function () {

        return this._dataNodes;
    },

    getDataNodeLocationTypes: function () {

        return this._dataNodeLocationTypes;
    },

    getDataNodeNames: function () {

        return this._dataNodeNames;
    },

    setDXFData: function (dxf) {

        this._dxf = dxf;
    },

    getDXFData: function () {

        return this._dxf;
    }


}