
d3.comparator = function(config) {
	
    var __ = {
        data: [],
        collapsed: false,
        width : null,
        height: null,
        margin: { top: 10, right: 5, bottom: 5, left: 5 },
        xScale: d3.scale.linear(),
        yScale: d3.scale.linear(),
        fontSize: 8,
        fontPadding: 2,
        var1Color: "#cc0000",
        var2Color: "#006699",
        blendColor: "#ffffff",
        colors: [],
        id: null,
        highlighted: -1, // off
        opacityCollapsed: 0.6,
        opacity: 0.2

    }

    extend(__, config);

    var lineFunc = d3.svg.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .interpolate('linear');

	var cp = function(selection) {

	    selection = cp.selection = d3.select(selection);
		
	    __.data = selection[0][0][0][0].__data__;
	    __.width = __.width ? __.width : selection[0][0][0][0].clientWidth;
	    __.height = __.height ? __.height : 100;

	    cp.div = selection[0][0]
            .append("div")
	        .attr("class", "comparator-box");

	    cp.svg = cp.div
            .append("svg")
                .attr("width", __.width)
                .attr("height", __.height)
        
	    cp.build();
      
	    return cp;
	}

    cp.buildLegend = function() {

        cp.legendGroup = cp.svg.append("g");

        var opacity = 1,
            stroke = "black";

        // center line
	    cp.legendGroup.append("path")
            .attr("d", lineFunc([
                { x: __.margin.left, y: __.height / 2 },
                { x: __.width - __.margin.right, y: __.height / 2 },
            ]))
            .attr("stroke", stroke)
            .attr("stroke-width", 0.3)
            .attr("opacity", opacity)
            .attr("fill", "none");

        // left vertical line
	    cp.legendGroup.append("path")
             .attr("d", lineFunc([
                { x: __.margin.left, y: __.margin.top },
                { x: __.margin.left, y: __.height - __.margin.bottom },
             ]))
            .attr("stroke", stroke)
			.attr("stroke-width", 0.3)
			.attr("opacity", opacity)
			.attr("fill", "none");

        // top max line
	    cp.legendGroup.append("path")
             .attr("d", lineFunc([
                {
                    x: __.margin.left,
                    y: __.height / 2 - __.yScale(cp.yMax1)
                },
                {
                    x: __.xScale(cp.xMax1) + __.margin.left,
                    y: __.height / 2 - __.yScale(cp.yMax1)
                },
             ]))
            .attr("stroke", stroke)
            .attr("stroke-width", 0.3)
            .style("stroke-dasharray", ("3, 3"))
            .attr("opacity", opacity)
            .attr("fill", "none");

        // bottom max line
	    cp.legendGroup.append("path")
             .attr("d", lineFunc([
                {
                    x: __.margin.left,
                    y: __.height / 2 + __.yScale(cp.yMax2)
                },
                {
                    x: __.xScale(cp.xMax2) + __.margin.left,
                    y: __.height / 2 + __.yScale(cp.yMax2)
                },
             ]))
            .attr("stroke", stroke)
            .attr("stroke-width", 0.3)
            .style("stroke-dasharray", ("3, 3"))
            .attr("opacity", opacity)
            .attr("fill", "none");

        // top text
	    cp.legendGroup.append("text")
            .attr("x", __.margin.left + __.fontPadding)
            .attr("y", __.margin.top - __.yScale(cp.yMax1) + __.height / 2)
            .text(round(cp.yMax1, 2), 1)
            .style("font-size", __.fontSize + "px");

        // bottom text
	    cp.legendGroup.append("text")
            .attr("x", __.margin.left + __.fontPadding)
            .attr("y", __.margin.top + __.yScale(cp.yMax2) + __.height / 2)
            .text(round(cp.yMax2, 2), 1)
            .style("font-size", __.fontSize + "px");
    }

    cp.buildTable = function() {

        cp.tableGroup = cp.svg.append("g");

        var yVals1 = __.data[0].map(function (d) { return d.y; }),
            yVals2 = __.data[1].map(function (d) { return d.y; });

        var yMax = Math.abs(d3.max(yVals1) + d3.max(yVals2)) * 0.75;

        var color_scale1 = d3.scale.linear().domain([0, yMax]).range([__.blendColor, __.var1Color]);
        var color_scale2 = d3.scale.linear().domain([0, yMax]).range([__.blendColor, __.var2Color]);

        var xLocations = __.data[0].map(function (d) { return __.xScale(d.x); }),
            delta = xLocations[1] - xLocations[0];

        if (__.collapsed) {
            __.margin.top = 0;
        } else {
            __.margin.top = 10;
        }

        __.colors = [];

        for (var i = 0; i < xLocations.length ; i++) {

            var val = yVals1[i] - yVals2[i];
            var color;

            if (val > 0) {
                color = color_scale1(val);
            } else {
                color = color_scale2(-val);
            }

            __.colors.push(color);

            var height = __.collapsed
                ? __.height
                : __.height - __.margin.top - __.margin.bottom;

            var opacity = __.collapsed
                ? __.opacityCollapsed
                : __.opacity;

            cp.tableGroup.append("rect")
                .attr("x", xLocations[i] - delta / 2)
                .attr("y", __.margin.top)
                .attr("width", delta)
                .attr("height", height)
                .attr("opacity", opacity)
                .attr("fill", color)
                .attr("stroke-opacity", "0.5")
        }

        cp.buildTableOutlines();

        return cp;
    }

    cp.build = function () {

        cp.dataGroup = cp.svg.append("g");

        var xVals = [],
            yVals = [];

        cp.xMax1 = 0,
        cp.xMax2 = 0;

        cp.yMax1 = 0,
        cp.yMax2 = 0;

        for (var key in __.data) {

            __.data[key].forEach(function (d) {

                if (key % 2 == 0) {
                    if (d.y > cp.yMax1) {
                        cp.xMax1 = d.x;
                        cp.yMax1 = d.y;
                    }
                }
                else if (key % 2 == 1) {
                    if (d.y > cp.yMax2) {
                        cp.xMax2 = d.x;
                        cp.yMax2 = d.y;
                    }
                }

                xVals.push(d.x);
                yVals.push(d.y)
            })
        }

        __.xScale.domain([0, d3.max(xVals)]).range([0, __.width - __.margin.right]);
        __.yScale.domain([0, d3.max(yVals)]).range([0, __.height / 4]);

        cp.buildTable();

        if (!__.collapsed) {

            for (var key in __.data) {

                var mul,
                    color;

                if (key == 0) {
                    mul = -1;
                    color = __.var1Color;
                }
                else {
                    mul = 1;
                    color = __.var2Color;
                }

                var startPoint = {
                    x: __.data[key][0].x,
                    y: 0
                };

                var endPoint = {
                    x: __.data[key][__.data[key].length - 1].x,
                    y: 0
                };

                var allPoints = __.data[key].slice(0);

                allPoints.splice(0,0, startPoint);
                allPoints.push(endPoint);
               
                cp.dataGroup.append("path")
                    .attr("d", lineFunc(allPoints.map(function (d) {

                        return {
                            x: __.xScale(d.x),
                            y: mul * __.yScale(d.y) + __.height / 2
                        }

                    })))
                    .attr("stroke", "grey")
                    .attr("stroke-width", 1)
                    .attr("fill", color)
                    .attr("fill-opacity", 0.5)
                    .attr("stroke", color)
            }

            cp.buildLegend();
        }

        return cp;
    }

    cp.rebuild = function (bool) {

        cp.svg[0][0].innerHTML = "";

        cp.collapsed(bool).build();

        return cp;        
    }

    cp.buildTableOutlines = function () {

        for (var i = 0; i < cp.tableGroup.length; i++) {

            var group = cp.tableGroup[i][0],
                children = group.children;

            for (var j = 0; j < children.length; j++) {

                d3.select(children[j]).attr("stroke", function () {

                    return j === __.highlighted ? "black" : "None";
                });
            }
        }
    }

    cp.width = function(val) {

        __.width = val;

        cp.svg.attr("width", __.width)

        return cp;
    }

    cp.height = function (val) {

        __.height = val;

        cp.svg.attr("height", __.height)

        return cp;
    }

    cp.id = function (id) {

        __.id = id;

        cp.svg[0][0].id = __.id;

        return cp;
    }

    cp.title = function (title) {

        cp.titleGroup = cp.svg.append("g");

        if (!__.collapsed) {

            cp.titleGroup.append("text")
                .attr("x", __.margin.left + __.fontPadding)
                .attr("y", __.margin.top)
                .text(title)
                .style("font-weight", "bold")
                .style("font-size", __.margin.top + "px");
        }
        else {

            cp.titleGroup.append("text")
                .attr("x", __.margin.left + __.fontPadding)
                .attr("y", 8)
                .text(title)
                .style("font-size", 8 + "px");
        }

        return cp;
    }

    cp.collapsed = function (bool) {

        __.collapsed = bool;

        return cp;
    }

    cp.isCollapsed = function () {

        return __.collapsed;
    }

    cp.onClick = function (func) {

        cp.svg[0][0].addEventListener("click", func);

        return cp;
    }

    cp.getColors = function () {

        return __.colors;
    }

    cp.setHighlightedValue = function (val) {

        __.highlighted = val;

        cp.buildTableOutlines();

        return cp;
    }

	return cp;
}

///
/// from d3.parcoords
///
function extend(target, source) {
    for (key in source) {
        target[key] = source[key];
    }
    return target;
};

///
/// from http://www.jacklmoore.com/notes/rounding-in-javascript/
///
function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}
