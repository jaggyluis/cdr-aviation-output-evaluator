/// <reference path="d3.v3.min.js" />
(function () {

    d3.summarator = function (config) {

        var __ = {
            radius: 5,
            width: 600,
            height: 600,
            factor: 1,
            factorLegend: .85,
            levels: 3,
            max: 0,
            id: null,
            radians: 2 * Math.PI,
            color: null
        }

        extend(__, config);

        var lineFunc = d3.svg.line()
            .x(function (d) { return d.x; })
            .y(function (d) { return d.y; })
            .interpolate('linear');

        var sm = function (selection) {

            selection = sm.selection = d3.select(selection);

            __.data = selection[0][0][0][0].__data__;
            __.width = __.width ? __.width : selection[0][0][0][0].clientWidth;
            __.height = __.height ? __.height : 100;

            sm.div = selection[0][0]
                .append("div")
                .attr("class", "summarator-box");

            sm.svg = sm.div
                .append("svg")
                .attr("class", "summarator-svg")
                .attr("width", __.width)
                .attr("height", __.height);

            if (__.id) {
                sm.svg.attr("id", __.id);
            }

            sm.build();

            return sm;
        }

        sm.build = function () {

            var axes = Object.keys(__.data),
                total = axes.length,
                radius = __.factor * Math.min(__.width / 2, __.height / 2);

            var dataGroup = sm.svg
                .append("g")
                .attr("class", "data-group");

            var ln0 = [],
                ln1 = [];

            axes.forEach(function (axis, i) {

                var data = __.data[axis];
                var boxData = box(data);

                var max = d3.max([__.max, boxData[0].q[2], boxData[1].q[2]]);
                var boxScale = d3.scale.linear().domain([0, max]).range([0,1])

                var val0 = boxScale(boxData[0].q[1]),
                    val1 = boxScale(boxData[1].q[1]);

                ln0.push({
                    x : __.width / 2 * (1 - val0 * __.factor * Math.sin(i * __.radians / total)),
                    y: __.width / 2 * (1 - val0 * __.factor * Math.cos(i * __.radians / total)),
                    v: boxData[0].q[1]
                });

                ln1.push({
                    x: __.width / 2 * (1 - val1 * __.factor * Math.sin(i * __.radians / total)),
                    y: __.width / 2 * (1 - val1 * __.factor * Math.cos(i * __.radians / total)),
                    v: boxData[1].q[1]
                });
            });

            ln0.push(ln0[0]);
            ln1.push(ln1[0]);

            dataGroup.append("path")
                .attr("d", lineFunc(ln0.map(function (point) {

                    dataGroup.append("circle")
                        .attr("class", "data-point")
                        .attr("r", 3)
                        .attr("cx", point.x)
                        .attr("cy", point.y)
                        .attr("fill", function (d, i) {
                            return __.color(d, 0);
                        })
                        .attr("stroke", "None")

                    return point;
                })))
                .attr("stroke-width", "2px")
                .attr("fill", "None")
                .attr("stroke", function (d, i) {
                    return __.color(d, 0);
                });

            dataGroup.append("path")
                .attr("d", lineFunc(ln1.map(function (point) {

                    dataGroup.append("circle")
                        .attr("class", "data-point")
                        .attr("r", 3)
                        .attr("cx", point.x)
                        .attr("cy", point.y)
                        .attr("fill", function (d, i) {
                            return __.color(d, 1);
                        })
                        .attr("stroke", "None")

                    return point;
                })))
                .attr("stroke-width", "2px")
                .attr("fill", "None")
                .attr("stroke", function (d, i) {
                    return __.color(d, 1);
                });

            buildAxes();

            return sm;

        }

        function buildAxes() {

            var axes = Object.keys(__.data),
                total = axes.length,
                radius = __.factor * Math.min(__.width / 2, __.height / 2);

            var axisGroup = sm.svg
                .append("g")
                .attr("class", "axis-group");

            var axis = axisGroup.selectAll(".axis")
                .data(axes)
                .enter()
                .append("g")
                .attr("class", "axis");

            axis.append("line")
                .attr("x1", __.width / 2)
                .attr("y1", __.height / 2)
                .attr("x2", function (d, i) {
                    return __.width / 2 * (1 - __.factor * Math.sin(i * __.radians / total));
                })
                .attr("y2", function (d, i) {
                    return __.height / 2 * (1 - __.factor * Math.cos(i * __.radians / total));
                })
                .attr("class", "line")
                .style("stroke", "grey")
                .style("stroke-width", "1px");

            axis.append("text")
                .attr("class", "legend")
                .text(function (d) { return d })
                .style("font-family", "sans-serif")
                .style("font-size", "11px")
                .attr("text-anchor", "middle")
                .attr("dy", "1.5em")
                .attr("transform", function (d, i) { return "translate(0, -10)" })
                .attr("x", function (d, i) {
                    return __.width / 2 *
                        (1 - __.factorLegend * Math.sin(i * __.radians / total)) -
                        60 * Math.sin(i * __.radians / total);
                })
                .attr("y", function (d, i) {
                    return __.height / 2 *
                        (1 - Math.cos(i * __.radians / total)) -
                        20 * Math.cos(i * __.radians / total);
                });

            return sm;
        }

        sm.id = function (id) {
            if (!arguments.length) return __.id;
            __.id = id;
            return sm;
        }

        sm.max = function (val) {
            if (!arguments.length) return __.max;
            __.max = val;
            return sm;
        }

        sm.onClick = function (func) {
            sm.svg[0][0].addEventListener("click", (func).bind(sm));
            return sm;
        }

        return sm;
    }

    // Inspired by http://informationandvisualization.de/blog/box-plot
    function box(data) {

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