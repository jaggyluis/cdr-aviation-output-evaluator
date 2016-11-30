
d3.selector = function (config) {

    var __ = {
    }

    extend(__, config);

    var sl = function (selection) {

        __.height = selection[0][0].clientHeight;
        __.width = selection[0][0].clientWidth;

        sl.svg = selection
        .append("svg")
        .attr("width", __.width)
        .attr("height", __.height);

        sl.down = null;
        sl.up = null;

        sl.svg
        .on("mousedown", function () {

            var p = d3.mouse(this);

            sl.svg.append("rect")
            .attr({
                rx: 0, //6
                ry: 0,
                class: "selection",
                x: p[0],
                y: p[1],
                width: 0,
                height: 0
            })

            var s = sl.svg.select("rect.selection");

            if (!s.empty()) {
                var p = d3.mouse(this),

                    d = {
                        x: parseInt(s.attr("x"), 10),
                        y: parseInt(s.attr("y"), 10),
                        width: parseInt(s.attr("width"), 10),
                        height: parseInt(s.attr("height"), 10)
                    },
                    move = {
                        x: p[0] - d.x,
                        y: p[1] - d.y
                    }
                ;

                sl.down = d;
            }
        })
        .on("mousemove", function () {
            var s = sl.svg.select("rect.selection");

            if (!s.empty()) {
                var p = d3.mouse(this),

                    d = {
                        x: parseInt(s.attr("x"), 10),
                        y: parseInt(s.attr("y"), 10),
                        width: parseInt(s.attr("width"), 10),
                        height: parseInt(s.attr("height"), 10),
                        select: true
                    },
                    move = {
                        x: p[0] - d.x,
                        y: p[1] - d.y
                    }
                ;

                if (move.x < 1 || (move.x * 2 < d.width)) {
                    //d.x = p[0];
                    //d.width -= move.x;
                    d.select = false;
                } else {
                    d.width = move.x;
                }

                if (move.y < 1 || (move.y * 2 < d.height)) {
                    //d.y = p[1];
                    //d.height -= move.y;
                    d.select = false;
                } else {
                    d.height = move.y;
                }

                s.attr(d);
                sl.up = d;
            }
        })
        .on("mouseup", function () {
            sl.svg.select(".selection").remove();
        })
        .on("mouseleave", function () {
            sl.svg.select(".selection").remove();
        });

        return sl;
    }

    sl.on = function (e, cb) {

        var func = sl.svg.on(e);

        sl.svg.on(e, function () {

            cb(sl.down, sl.up);
            func();
        })

        return cb;
    }

    return sl;
}

function extend(target, source) {
    for (key in source) {
        target[key] = source[key];
    }
    return target;
};