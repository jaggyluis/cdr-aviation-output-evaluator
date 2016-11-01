function buildDataNodes(data) {

    var dataNodes = {};

    for (var i = 0; i < data.length; i++) {

        if (!(data[i]["Location ID"] in dataNodes)) {

            dataNodes[data[i]["Location ID"]] = [];
        }

        dataNodes[data[i]["Location ID"]].push(data[i]);
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

function DataNode(point2d, name) {

    this._pos = point2d;
    this._name = name;
    this._data = {};
}
DataNode.prototype = {

    setData: function (data) {

        this._data = data;
    }
}