/// <reference path="d3.v3.min.js" />
(function () {

    d3.summarator = function (config) {

        var __ = {
            radius: 5,
            width: 600,
            height: 600,
            factor: 0.6,
            factorLegend: 0.8,
            levels: 3,
            max: 0,
            id: null,
            radians: 2 * Math.PI,
            color: null
        }

        extend(__, config);

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
                total = axes.length;

            var dataGroup = sm.svg
                .append("g")
                .attr("class", "data-group")
                .attr("transform", "translate(" + __.width / 2 + "," + __.height / 2 + ")");

            var angle = d3.scale.linear()
                .domain([0, total])
                .range([0, 2 * Math.PI]);

            var radius = d3.scale.linear()
                .domain([0,1])
                .range([0, __.height / 2 * __.factor]);

            var line = d3.svg.line.radial()
                .interpolate("linear-closed")
                .angle(function (d) { return angle(d.x); })
                .radius(function (d) { return radius(d.y); });

            var area = d3.svg.area.radial()
                .interpolate("linear-closed")
                .angle(function (d) { return angle(d.xi); })
                .innerRadius(function (d) { return radius(d.yi); })
                .outerRadius(function (d) { return radius(d.yo); });

            var ln0 = [],
                ln1 = [],
                a0 = [],
                a1 = [];

            axes.forEach(function (axis, i) {

                var data = __.data[axis];
                var boxData = box(data);

                var max = d3.max([__.max, boxData[0].q[2], boxData[1].q[2]]);
                var boxScale = d3.scale.linear().domain([0, max]).range([0, 1])

                ln0.push(buildPoint(boxScale(boxData[0].q[1]), i, boxData[0].q[1]));
                ln1.push(buildPoint(boxScale(boxData[1].q[1]), i, boxData[1].q[1]));

                var p0i = buildPoint(boxScale(boxData[0].q[0]), i, boxData[0].q[0]),
                    p0o = buildPoint(boxScale(boxData[0].q[2]), i, boxData[0].q[2]);
                 
                a0.push(buildCombinPoint(p0i, p0o));

                var p1i = buildPoint(boxScale(boxData[1].q[0]), i, boxData[1].q[0]),
                    p1o = buildPoint(boxScale(boxData[1].q[2]), i, boxData[1].q[2]);

                a1.push(buildCombinPoint(p1i, p1o));

            });

            dataGroup.append("path")
                .attr("d", function (d) {

                    var ln = line(ln0),
                        lns = ln.slice(1, -1).split("L");

                    lns.forEach(function (coord, i) {

                        var c = coord.split(","),
                            cx = c[0],
                            cy = c[1];

                        dataGroup.append("text")
                            .attr("class", "val")
                            .text(function (e) {
                                return "m : " + round(ln0[i].v, 3);
                            })
                            .style("font-family", "sans-serif")
                            .style("font-size", "8px")
                            .style("font-weight", "bold")
                            .attr("text-anchor", "center")
                            .attr("dy", "1.5em")
                            .attr("fill", function (d, i) {
                                return __.color(d, 0);
                            })
                            .attr("transform", function (d) {
                                return "translate(" + cx + "," + cy + ")"
                            });
                    });

                    return ln;
                })
                .attr("stroke-width", "2px")
                .attr("fill", "None")
                .attr("stroke", function (d, i) {
                    return __.color(d, 0);
                });

            dataGroup.append("path")
                .attr("d", function (d) {

                    var ln = line(ln1),
                        lns = ln.slice(1,-1).split("L");

                    lns.forEach(function (coord, i) {

                        var c = coord.split(","),
                            cx = c[0],
                            cy = c[1] - 20;

                        dataGroup.append("text")
                            .attr("class", "val")
                            .text(function (e) {
                                return "m : " + round(ln1[i].v, 3);
                            })
                            .style("font-family", "sans-serif")
                            .style("font-size", "8px")
                            .style("font-weight", "bold")
                            .attr("text-anchor", "center")
                            .attr("dy", "1.5em")
                            .attr("fill", function (d, i) {
                                return __.color(d, 1);
                            })
                            .attr("transform", function (d) {
                                return "translate(" + cx + "," + cy + ")"
                            });
                    });

                    return ln;
                })
                .attr("stroke-width", "2px")
                .attr("fill", "None")
                .attr("stroke", function (d, i) {
                    return __.color(d, 1);
                });
            
            dataGroup.selectAll("path.area0")
                .data([a0])
                .enter().append("path")
                    .style("fill", function (d, i) {
                        return __.color(d, 0);
                    })
                    .attr("class", "area")
                    .attr("fill-opacity", 0.1)
                    .attr("d", function (d) {

                        var ln = area(d),
                            lns = ln.split("Z").slice(0,2);

                        var maxLn = lns[0].slice(1).split("L"),
                            minLn = lns[1].slice(1).split("L");

                        maxLn.forEach(function (coord, i) {

                            var c = coord.split(","),
                                cx = c[0],
                                cy = c[1];

                            dataGroup.append("text")
                                .attr("class", "val")
                                .text(function (e) {
                                    return "q3 : " + round(d[i].vo, 3);
                                })
                                .style("font-family", "sans-serif")
                                .style("font-size", "8px")
                                .attr("text-anchor", "center")
                                .attr("dy", "1.5em")
                                .attr("fill", function (d, i) {
                                    return __.color(d, 0);
                                })
                                .attr("transform", function (d) {
                                    return "translate(" + cx + "," + cy + ")"
                                });
                        });

                        return ln;
                    })
                    .attr("stroke", function (d, i) {
                        return __.color(d, 0);
                    })
                    .attr("stroke-opacity", 0.3)

            dataGroup.selectAll("path.area1")
                .data([a1])
                .enter().append("path")
                    .style("fill", function (d, i) {
                        return __.color(d, 1);
                    })
                    .attr("class", "area")
                    .attr("fill-opacity", 0.1)
                    .attr("d", function (d) {

                        var ln = area(d),
                            lns = ln.split("Z").slice(0, 2);

                        var maxLn = lns[0].slice(1).split("L"),
                            minLn = lns[1].slice(1).split("L");

                        maxLn.forEach(function (coord, i) {

                            var c = coord.split(","),
                                cx = c[0],
                                cy = c[1] - 20;

                            dataGroup.append("text")
                                .attr("class", "val")
                                .text(function (e) {
                                    return "q3 : " + round(d[i].vo, 3);
                                })
                                .style("font-family", "sans-serif")
                                .style("font-size", "8px")
                                .attr("text-anchor", "center")
                                .attr("dy", "1.5em")
                                .attr("fill", function (d, i) {
                                    return __.color(d, 1);
                                })
                                .attr("transform", function (d) {
                                    return "translate(" + cx + "," + cy + ")"
                                });

                        });

                        return ln;
                    })
                    .attr("stroke", function (d, i) {
                        return __.color(d, 1);
                    })
                    .attr("stroke-opacity", 0.3)

            buildAxes();

            return sm;

        }

        function buildAxes() {

            var axes = Object.keys(__.data),
                total = axes.length;

            var axisGroup = sm.svg
                .append("g")
                .attr("class", "axis-group")
                .attr("transform", "translate(" + __.width / 2 + "," + __.height / 2 + ")");

            var angle = d3.scale.linear()
                .domain([0, total])
                .range([0, 2 * Math.PI]);

            var radius = d3.scale.linear()
                .domain([0, 1])
                .range([0, __.height / 2]);

            var line = d3.svg.line.radial()
                .interpolate("linear-closed")
                .angle(function (d) { return angle(d.x); })
                .radius(function (d) { return radius(d.y) * __.factor; });

            var loc = d3.svg.line.radial()
                .interpolate("linear-closed")
                .angle(function (d) { return angle(d.x); })
                .radius(function (d) { return radius(d.y) * __.factorLegend; });

            axes.forEach(function (axis, i) {

                var ln = [
                    {
                        x: i,
                        y: 0
                    },
                    {
                        x: i,
                        y: 1
                    }
                ];

                axisGroup.append("path")
                    .attr("d", function (d) {

                        var l = line(ln),
                            pos = loc(ln);

                        axisGroup.append("text")
                            .attr("class", "legend")
                            .text(axis)
                            .style("font-family", "sans-serif")
                            .style("font-size", "11px")
                            .attr("text-anchor", "middle")
                            .attr("dy", "1.5em")
                            .attr("transform", function (d) {

                                var split = pos.split('L');
                                var coords = split[1].slice(0, -1);

                                return "translate(" + coords + ")"
                            })

                        return l;
                    })
                    .attr("class", "line")
                    .attr("stroke-width", "1px")
                    .attr("fill", "None")
                    .attr("stroke", "grey");



            });

            return sm;
        }

        function buildPoint(radius, angle, value) {

            return {
                x: angle,
                y: radius,
                v: value
            };
        }

        function buildCombinPoint(pi, po) {

            return {
                xi: pi.x,
                xo: po.x,
                yi: pi.y,
                yo: po.y,
                vi: pi.v,
                vo: po.v
            };
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