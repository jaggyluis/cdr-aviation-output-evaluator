(function () {

    d3.comparator = function (config) {

        var __ = {
            data: [],
            width: null,
            height: null,
            color: null,
            colors: [],
            collapsed: false,
            title: null,
            ignore: [],
            id: null,
            margin: { top: 10, right: 5, bottom: 5, left: 5 },
            xScale: d3.scale.linear(),
            yScale: d3.scale.linear(),
            highlighted: -1, // off
        }

        extend(__, config);

        var lineFunc = d3.svg.line()
            .x(function (d) { return d.x; })
            .y(function (d) { return d.y; })
            .interpolate('linear');

        var cp = function (selection) {

            selection = cp.selection = d3.select(selection);

            __.data = selection[0][0][0][0].__data__;
            __.width = __.width ? __.width : selection[0][0][0][0].clientWidth;
            __.height = __.height ? __.height : 100;

            cp.div = selection[0][0]
                .append("div")
                .attr("class", "comparator-box");

            cp.svg = cp.div
                .append("svg")
                .attr("class", "comparator-svg")
                .attr("width", __.width)
                .attr("height", __.height);

            if (__.id) {
                cp.svg.attr("id", __.id);
            }

            cp.build();

            return cp;
        }

        cp.build = function() {

            cp.svg.selectAll("*").remove();

            cp.tableGroup = cp.svg.append("g")
                .attr("class", "table-group");

            cp.colorGroup = cp.svg.append("g")
                .attr("class", "color-group");

            cp.valueGroup = cp.svg.append("g")
                .attr("class", "value-group");

            var xVals = [],
                yVals = [];

            var width = __.width / __.data[0].length;

            cp.boxData = [];

            __.data.forEach(function (scheme, i) {

                scheme.forEach(function (key, j) {

                    key.forEach(function (item, k) {

                        xVals.push(j / __.width);
                        yVals.push(item);
                    });
                });
            });

            __.xScale.domain([0, d3.max(xVals)]).range([__.margin.left, __.width - __.margin.right]);
            __.yScale.domain([0, d3.max(yVals)]).range([0, __.height / 4]);

            __.data.forEach(function (g, k) {

                var g = cp.svg.append("g")
                    .attr("class", "data-group");

                var points = [];
                var values = box(__.data[k]);

                cp.boxData.push(values);

                if (__.collapsed) return;

                for (var j = 0; j < values.length; j++) {

                    if (__.ignore.includes(j)) continue;

                    var x = __.xScale(j / __.width) - (width / 2),
                        y = __.yScale(values[j].q[0]),
                        w = width,
                        h = __.yScale(values[j].q[2]) - __.yScale(values[j].q[0]),
                        o = values[j].q[2] - values[j].q[0]

                    y = k === 1
                        ? __.height / 2 + y
                        : __.height / 2 - y - h;

                    g.append("rect")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("width", w)
                        .attr("height", h)
                        .attr("opacity", 0.5 - o)
                        .attr("fill", function (d, i) {
                            return __.color(d, k);
                        })

                    var x = __.xScale(j / __.width) - (width / 2),
                        y = __.yScale(values[j].w[0]),
                        w = width,
                        h = __.yScale(values[j].w[1]) - __.yScale(values[j].w[0]);

                    if (k == 1) {
                        y = __.height / 2 + y;
                    }
                    else {
                        y = __.height / 2 - y - h;
                    }

                    g.append("rect")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("width", w)
                        .attr("height", h)
                        .attr("opacity", 0.2)
                        .attr("fill", function (d, i) {
                            return __.color(d, k);
                        })

                    var x = __.xScale(j / __.width) - (width / 2),
                        y = __.yScale(values[j].q[1]),
                        w = width,
                        h = 1;

                    if (k == 1) {
                        y = __.height / 2 + y;
                    }
                    else {
                        y = __.height / 2 - y - h;
                    }

                    /*
                    g.append("rect")
                        .attr("class", "value-rect")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("width", w)
                        .attr("height", h)
                        .attr("opacity", 0.7)
                        .attr("fill", "Black")
                        .attr("stroke-opacity", "0.2");
                    */

                    points.push({
                        x: x + width / 2,
                        y: y
                    })
                }

                g.append("path")
                    .attr("d", lineFunc(points.map(function (point) {

                        g.append("circle")
                            .attr("class", "data-point")
                            .attr("r", 1)
                            .attr("cx", point.x)
                            .attr("cy", point.y)
                            .attr("fill", function (d, i) {
                                return __.color(d, k);
                            })
                            .attr("stroke", "None")

                        return point;
                    })))
                    .attr("stroke-width", "1px")
                    .attr("fill", "None")
                    .attr("stroke", function (d, i) {
                        return __.color(d, k);
                    })

            });

            if (!__.collapsed) buildLegend();

            buildTable();

            return cp;
        }

        function buildTable() {

            var width = __.width / __.data[0].length;

            var values = cp.boxData.map(function (s) {

                return s.map(function (t) {
                    return t.q[1];
                })
            })

            var max = d3.max([d3.max(values[0]), d3.max(values[1])]) * 0.75;
            var colorScale0 = d3.scale.linear().domain([0, max]).range(["#ffffff", __.color(null ,0)]),
                colorScale1 = d3.scale.linear().domain([0, max]).range(["#ffffff", __.color(null, 1)]);

            for (var i = 0; i < cp.boxData[0].length; i++) {


                var x = __.xScale(i / __.width) - (width / 2),
                    y = __.yScale(0) + __.margin.top,
                    w = width,
                    h = __.height - __.margin.bottom - __.margin.top,
                    color;

                var val = values[0][i] - values[1][i];

                if (val > 0) {
                    color = colorScale0(val);
                } else {
                    color = colorScale1(-val);
                }

                cp.tableGroup.append("rect")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("width", w)
                    .attr("height", h)
                    .attr("opacity", (__.collapsed ? 0.8 : 0.5))
                    .attr("stroke", "None")
                    .attr("stroke-opacity", (__.collapsed ? 0.8 : 0.5))
                    .attr("fill", "None");

                cp.colorGroup.append("rect")
                    .attr("class", "color-rect")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("width", w)
                    .attr("height", h)
                    .attr("opacity", (__.collapsed ? 0.8 : 0.2))
                    .attr("stroke", "None")
                    .attr("stroke-opacity", 0.5)
                    .attr("fill", color);
              
                __.colors.push(color);

                buildHighlighted();
            }
        }

        function buildHighlighted() {

            cp.valueGroup.selectAll("*").remove();

            for (var i = 0; i < cp.tableGroup.length; i++) {

                var group = cp.tableGroup[i][0],
                    children = group.children;

                for (var j = 0; j < children.length; j++) {

                    d3.select(children[j]).attr("stroke", function () {

                        return j === __.highlighted ? "black" : "None";
                    });
                }
            }

            if (__.collapsed) return;

            var values = [cp.boxData[0][__.highlighted], cp.boxData[1][__.highlighted]];

            cp.valueGroup.append("path")
                 .attr("d", lineFunc([
                    {
                        x: __.margin.left,
                        y: __.height / 2 + __.yScale(values[1].q[1])
                    },
                    {
                        x: __.xScale(__.highlighted / __.width),
                        y: __.height / 2 + __.yScale(values[1].q[1])
                    },
                 ]))
                .attr("stroke", "black")
                .attr("stroke-width", 0.3)
                .style("stroke-dasharray", ("3, 3"))
                .attr("opacity", 1)
                .attr("fill", "none");

            cp.valueGroup.append("path")
                 .attr("d", lineFunc([
                    {
                        x: __.margin.left,
                        y: __.height / 2 - __.yScale(values[0].q[1])
                    },
                    {
                        x: __.xScale(__.highlighted / __.width),
                        y: __.height / 2 - __.yScale(values[0].q[1])
                    },
                 ]))
                .attr("stroke", "black")
                .attr("stroke-width", 0.3)
                .style("stroke-dasharray", ("3, 3"))
                .attr("opacity", 1)
                .attr("fill", "none");

            cp.valueGroup.append("text")
                .attr("x", __.margin.left + 3)
                .attr("y", __.margin.top + __.height / 2 - __.yScale(values[0].q[1]))
                .text(round(values[0].q[1], 2), 1)
                .style("font-size", 8 + "px");

            cp.valueGroup.append("text")
                .attr("x", __.margin.left + 3)
                .attr("y", __.margin.top + __.height / 2 + __.yScale(values[1].q[1]))
                .text(round(values[1].q[1], 2), 1)
                .style("font-size", 8 + "px");

            return cp;
        }

        function buildLegend () {

            cp.legendGroup = cp.svg.append("g")
                .attr("class", "legend-group");

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

            return cp;
        }

        cp.width = function (val) {
            __.width = val;
            cp.svg.attr("width", __.width)
            return cp;
        }

        cp.height = function (val) {
            __.height = val;
            cp.svg.attr("height", __.height)
            return cp;
        }

        cp.margin = function (obj) {
            if (!arguments.length) return __.margin;
            __.margin = obj;
            return cp;
        }

        cp.title = function (title) {
            if (!arguments.length) return __.title;
            __.title = title;

            cp.titleGroup = cp.svg.append("g")
                .attr("class", "title-group");

            if (!__.collapsed) {

                cp.titleGroup.append("text")
                    .attr("x", __.margin.left + 3)
                    .attr("y", __.margin.top)
                    .text(title)
                    .style("font-weight", "bold")
                    .style("font-size", 10 + "px");
            }
            else {

                cp.titleGroup.append("text")
                    .attr("x", __.margin.left + 3)
                    .attr("y", 8)
                    .text(title)
                    .style("font-size", 8 + "px");
            }

            return cp;
        }

        cp.colors = function () {
            return __.colors;
        }

        cp.highlighted = function (val) {
            __.highlighted = val;
            buildHighlighted();
            return cp;
        }

        cp.id = function (id) {
            if (!arguments.length) return __.id;
            __.id = id;
            return cp;
        }

        cp.collapsed = function (bool) {
            if (!arguments.length) return __.collapsed;
            __.collapsed = bool;
            return cp;
        }

        cp.ignore = function (arr) {
            __.ignore = __.ignore.concat(arr);
            return cp;
        }

        cp.color = function (val) {
            __.color = val;
            return cp;
        }

        cp.onClick = function (func) {
            cp.svg[0][0].addEventListener("click", (func).bind(cp));
            return cp;
        }

        return cp;
    }

    // Inspired by http://informationandvisualization.de/blog/box-plot
    function box (data) {

        var __ = [];

        data.forEach(function (d, i) {
            d = d.map(Number).sort(d3.ascending);
            var g = d3.select(this),
                n = d.length,
                min = d[0],
                max = d[n - 1];

            var quartileData = d.quartiles = quartiles(d);

            var whiskerIndices = whiskers && whiskers.call(this, d, i),
                whiskerData = whiskerIndices && whiskerIndices.map(function (i) { return d[i]; });

            __.push({
                q: quartileData,
                w: whiskerData
            })

        });

        return __;
    };

    function extend(target, source) {
        for (key in source) {
            target[key] = source[key];
        }
        return target;
    };

    function round(value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    function iqr(k) {
        return function (d, i) {
            var q1 = d.quartiles[0],
                q3 = d.quartiles[2],
                iqr = (q3 - q1) * k,
                i = -1,
                j = d.length;
            while (d[++i] < q1 - iqr);
            while (d[--j] > q3 + iqr);
            return [i, j];
        };
    }

    function whiskers(d) {
        return [0, d.length - 1];
    }

    function quartiles(d) {
        return [
          d3.quantile(d, .25),
          d3.quantile(d, .5),
          d3.quantile(d, .75)
        ];
    }

})();