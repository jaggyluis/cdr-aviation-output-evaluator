
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
        name = nodeString[1];

    point2d = point2d.replace(/=/g, ':');
    point2d = point2d.replace(/ /g, '"');
    point2d = point2d.replace(/,/g, '",');
    point2d = JSON.parse(point2d);

    for (key in point2d) {
        point2d[key] = parseFloat(point2d[key]);
    }

    dataNode = new DataNode(point2d, (name != "" ? name : null));
    dataNode.setData(data);

    return dataNode;
}

// model ---
function DataNode(point2d, name) {

    this._pos = point2d;
    this._name = name;
    this._data = {};
}
DataNode.prototype = {

    getName: function () {

        return this._name;
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
    }
}

function Model() {

    this._dataNodes = [];
}
Model.prototype = {

    setDataNodes: function (dataNodes) {

        this._dataNodes = dataNodes;
    },

    getDataNodes: function () {

        return this._dataNodes;
    }
}