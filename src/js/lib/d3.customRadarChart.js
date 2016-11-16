//Practically all this code comes from https://github.com/alangrafu/radar-chart-d3
//I only made some additions and aesthetic adjustments to make the chart look better 
//(of course, that is only my point of view)
//Such as a better placement of the titles at each line end, 
//adding numbers that reflect what each circular level stands for
//Not placing the last level and slight differences in color
//
//For a bit of extra information check the blog about it:
//http://nbremer.blogspot.nl/2013/09/making-d3-radar-chart-look-bit-better.html

var CustomRadarChart = {
    draw: function (id, d1, d2, options) {
        var cfg = {
            radius: 2,
            w: 600,
            h: 600,
            factor: 1,
            factorLegend: .85,
            levels: 3,
            maxValue: 0,
            radians: 2 * Math.PI,
            opacityArea: 0.2,
            ToRight: 5,
            TranslateX: 80,
            TranslateY: 30,
            ExtraWidthX: 100,
            ExtraWidthY: 100,
            color: d3.scale.category10(),
            doAdd: false
        };

        if ('undefined' !== typeof options) {
            for (var i in options) {
                if ('undefined' !== typeof options[i]) {
                    cfg[i] = options[i];
                }
            }
        }

        var d1max = d3.max(d1.m, function (i) { return d3.max(i.map(function (o) { return o.value; })) });

        if (d2 !== null) {

            var d2max = d3.max(d2.m, function (i) { return d3.max(i.map(function (o) { return o.value; })) });
            var dmax = Math.max(d1max, d2max);

            cfg.maxValue = Math.max(cfg.maxValue, dmax);
        }
        else {
            cfg.maxValue = Math.max(cfg.maxValue, d1max);
        }

        var allAxis = (d1.a[0].map(function (i, j) { return i.axis }));
        var total = allAxis.length;
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
        var Format = d3.format('%');
        d3.select(id).select("svg").remove();

        var g = d3.select(id)
                .append("svg")
                .attr("width", cfg.w + cfg.ExtraWidthX)
                .attr("height", cfg.h + cfg.ExtraWidthY)
                .append("g")
                .attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");
        ;

        this.g = g;

        var tooltip;

        var ds = [];

        if (d1 != null) {
            ds.push(d1)
        }
        if (d2 != null) {
            ds.push(d2);
        }

        series = 0;

        ds.forEach(function (scheme) {

            var d = scheme.m;
            dAdd = scheme.a

            d.forEach(function (y, x) {
                dataValues = [];
                g.selectAll(".nodes")
                  .data(y, function (j, i) {
                      dataValues.push([
                        cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(-i * cfg.radians / total)),
                        cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(-i * cfg.radians / total))
                      ]);
                  });
                dataValues.push(dataValues[0]);
                g.selectAll(".area")
                               .data([dataValues])
                               .enter()
                               .append("polygon")
                               .attr("class", "radar-chart-serie" + series)
                               .style("stroke-width", function () {
                                   return x == 0 ? "0.5px" : "0.5px";
                               })
                               .style("stroke", cfg.color(series))
                               .attr("points", function (d) {
                                   var str = "";
                                   for (var pti = 0; pti < d.length; pti++) {
                                       str = str + d[pti][0] + "," + d[pti][1] + " ";
                                   }
                                   return str;
                               })
                               .style("fill", function (j, i) {

                                   //return "None"

                                   return cfg.color(series);

                                   if (x == 0) {
                                       return "None";
                                   }
                                   else if (x == 1) {
                                       return cfg.color(series);
                                   }
                                   else if (x == 2) {
                                       return "White";
                                   }
                               })
                               .style("fill-opacity", function () {

                                   return x == 2 ? 0.5 : cfg.opacityArea;
                               });

                //Circular segments
                for (var j = 0; j < cfg.levels - 1; j++) {
                    var levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
                    g.selectAll(".levels")
                     .data(allAxis)
                     .enter()
                     .append("svg:line")
                     .attr("x1", function (d, i) { return levelFactor * (1 - cfg.factor * Math.sin(-i * cfg.radians / total)); })
                     .attr("y1", function (d, i) { return levelFactor * (1 - cfg.factor * Math.cos(-i * cfg.radians / total)); })
                     .attr("x2", function (d, i) { return levelFactor * (1 - cfg.factor * Math.sin((-i + 1) * cfg.radians / total)); })
                     .attr("y2", function (d, i) { return levelFactor * (1 - cfg.factor * Math.cos((-i + 1) * cfg.radians / total)); })
                     .attr("class", "line")
                     .style("stroke", "grey")
                     .style("stroke-opacity", "0.5")
                     .style("stroke-width", "0.1px")
                     .attr("transform", "translate(" + (cfg.w / 2 - levelFactor) + ", " + (cfg.h / 2 - levelFactor) + ")");
                }

                var axis = g.selectAll(".axis")
                    .data(allAxis)
                    .enter()
                    .append("g")
                    .attr("class", "axis");

                axis.append("line")
                    .attr("x1", cfg.w / 2)
                    .attr("y1", cfg.h / 2)
                    .attr("x2", function (d, i) { return cfg.w / 2 * (1 - cfg.factor * Math.sin(i * cfg.radians / total)); })
                    .attr("y2", function (d, i) { return cfg.h / 2 * (1 - cfg.factor * Math.cos(i * cfg.radians / total)); })
                    .attr("class", "line")
                    .style("stroke", "grey")
                    .style("stroke-width", "0.1px");

                axis.append("text")
                    .attr("class", "legend")
                    .text(function (d) { return d })
                    .style("font-family", "sans-serif")
                    .style("font-size", "11px")
                    .attr("text-anchor", "middle")
                    .attr("dy", "1.5em")
                    .attr("transform", function (d, i) { return "translate(0, -10)" })
                    .attr("x", function (d, i) { return cfg.w / 2 * (1 - cfg.factorLegend * Math.sin(-i * cfg.radians / total)) - 60 * Math.sin(-i * cfg.radians / total); })
                    .attr("y", function (d, i) { return cfg.h / 2 * (1 - Math.cos(-i * cfg.radians / total)) - 20 * Math.cos(-i * cfg.radians / total); });
            });

            if (!cfg.doAdd) {
                series++;
                return;
            };

            dAdd.forEach(function (y, x) {
                g.selectAll(".nodes")
                  .data(y).enter()
                  .append("svg:circle")
                  .attr("class", "radar-chart-serie" + series)
                  .attr('r', cfg.radius)
                  .attr("alt", function (j) { return Math.max(j.value, 0) })
                  .attr("cx", function (j, i) {
                      dataValues.push([
                        cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(-i * cfg.radians / total)),
                        cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(-i * cfg.radians / total))
                      ]);
                      return cfg.w / 2 * (1 - (Math.max(j.value, 0) / cfg.maxValue) * cfg.factor * Math.sin(-i * cfg.radians / total));
                  })
                  .attr("cy", function (j, i) {
                      return cfg.h / 2 * (1 - (Math.max(j.value, 0) / cfg.maxValue) * cfg.factor * Math.cos(-i * cfg.radians / total));
                  })
                  .attr("data-id", function (j) { return j.axis })
                  .style("stroke", cfg.color(series))
                .style("stroke-opacity", "0.1")
                    .style("stroke-weight", "0.1px")
                .style("fill", "None")
            });

            /*
            dAdd.forEach(function (y, x) {
                dataValues = [];
                g.selectAll(".nodes")
                  .data(y, function (j, i) {
                      dataValues.push([
                        cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(-i * cfg.radians / total)),
                        cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(-i * cfg.radians / total))
                      ]);
                  });
                dataValues.push(dataValues[0]);
                g.selectAll(".area")
                               .data([dataValues])
                               .enter()
                               .append("polygon")
                               .attr("class", "radar-chart-serie" + series)
                               .style("stroke-width", "0.2px")
                               .style("stroke-opacity", "0.2")
                               .style("stroke", cfg.color(series))
                               .attr("points", function (d) {
                                   var str = "";
                                   for (var pti = 0; pti < d.length; pti++) {
                                       str = str + d[pti][0] + "," + d[pti][1] + " ";
                                   }
                                   return str;
                               })
                               .style("fill", function (j, i) {
    
                                   return "None";
                               })
    
                //Circular segments
                for (var j = 0; j < cfg.levels - 1; j++) {
                    var levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
                    g.selectAll(".levels")
                     .data(allAxis)
                     .enter()
                     .append("svg:line")
                     .attr("x1", function (d, i) { return levelFactor * (1 - cfg.factor * Math.sin(-i * cfg.radians / total)); })
                     .attr("y1", function (d, i) { return levelFactor * (1 - cfg.factor * Math.cos(-i * cfg.radians / total)); })
                     .attr("x2", function (d, i) { return levelFactor * (1 - cfg.factor * Math.sin((-i + 1) * cfg.radians / total)); })
                     .attr("y2", function (d, i) { return levelFactor * (1 - cfg.factor * Math.cos((-i + 1) * cfg.radians / total)); })
                     .attr("class", "line")
                     .style("stroke-opacity", "0.75")
                     .style("stroke-width", "0.3px")
                     .attr("transform", "translate(" + (cfg.w / 2 - levelFactor) + ", " + (cfg.h / 2 - levelFactor) + ")");
                }	        
            });
    
             */

            series++;


        })

        series = 0;

        //Tooltip
        tooltip = g.append('text')
                   .style('opacity', 0)
                   .style('font-family', 'sans-serif')
                   .style('font-size', '13px');
    },
    title: function (str) {

        var titleGroup = this.g.append("g");

        titleGroup.append("text")
            .attr("x",0)
            .attr("y", 250)
            .text(str)
            .style("font-weight", "bold")
            .style("font-size", 10 + "px");
    }
};