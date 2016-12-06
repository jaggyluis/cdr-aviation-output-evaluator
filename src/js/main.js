/// <reference path="lib/d3.summarator.js" />
/// <reference path="model.js" />
/// <reference path="lib/d3.selector.js" />
/// <reference path="lib/cdr.min.js" />
/// <reference path="lib/three-dxf.js" />
/// <reference path="lib/d3.v3.min.js" />
/// <reference path="lib/three.js" />
/// <reference path="lib/d3.comparator.js" />

(function () {

    console.log("init aviation-output-comparator");

    var camera,
        scene,
        renderer,
        intersects,
        mouse,
        frustum,
        projScreenMatrix;    

    var helper = document.getElementById("helper"),
        helperRect = helper.getBoundingClientRect();

    var slider0 = document.getElementById("evals-slider-input-0"),
        slider1 = document.getElementById("evals-slider-input-1")
        time = document.getElementById("evals-time"),
        tags = document.getElementById("scene-tags");

    var sceneBox = document.getElementById("scene-box"),
        sceneFrame = document.getElementById("scene-frame"),
        sceneRect = sceneFrame.getBoundingClientRect(),
        sceneSelector = document.getElementById("scene-selector");

    var evalsBox = document.getElementById("evals-box"),
        evalsRect = evalsBox.getBoundingClientRect(),
        evalsWidth = evalsBox.clientWidth;

    var evaluationsFrame = document.getElementById("evaluations-frame"),
        evaluationsToggle = document.getElementById("evals-title-evaluations"),
        evaluationsComparators = [];

    var comparisonsFrame = document.getElementById("comparisons-frame"),
        comparisonsToggle = document.getElementById("evals-title-comparisons"),
        comparisonsComparators = [];

    var summaryFrame = document.getElementById("summary-frame"),
        summaryToggle = document.getElementById("evals-title-summary");

    var legendOptions = ['Scheme1', "Scheme2"];
    var colorScale = function (d, i) { return ["#cc0000", "#006699"][i] }

    var svg = d3.select(helper)
        .append("svg")
        .attr("width", helper.clientWidth)
        .attr("height", helper.clientHeight);

    var lineFunc = d3.svg.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .interpolate('linear');

    var shiftDown = false,
        cntrlDown = false;

    var MAXDENSITY = -1; // max density

    var file0 = "doc/occupationdata1.csv",
        file1 = "doc/occupationdata2.csv"

    d3.csv(file0, function (d0) {

        document.getElementById("legend0-color").style.backgroundColor = colorScale(null, 0);

        d3.csv(file1, function (d1) {

            document.getElementById("legend1-color").style.backgroundColor = colorScale(null, 1);

            cdr.core.file.readFile("doc/spatialstructure.dxf", function (o) {

                var parser = new window.DxfParser();
                var dxf = parser.parseSync(o);

                model = new Model();
                model.setDataNodes(buildDataNodes(d0, d1));
                model.setDXFData(dxf);

                init(model);            
            });
        })
    });

    function init(model) {
    
        buildEvalsFrames(model);
        buildEvalsSettings(model);
        buildScene(model);
        buildSceneSettings(model);
        buildsliders(model);
        buildKeyEvents(model);
    }

    function buildEvalsFrames(model) {

        buildEvaluations(model, evaluationsFrame);
        buildComparisons(model, comparisonsFrame);
        buildSummary(model, summaryFrame);

        evaluationsToggle.addEventListener("click", function () {

            evaluationsFrame.classList.remove("collapsed");
            comparisonsFrame.classList.add("collapsed");
            summaryFrame.classList.add("collapsed");

            evaluationsToggle.classList.remove("title-inactive");
            comparisonsToggle.classList.add("title-inactive");
            summaryToggle.classList.add("title-inactive");
        })

        comparisonsToggle.addEventListener("click", function () {

            evaluationsFrame.classList.add("collapsed");
            comparisonsFrame.classList.remove("collapsed");
            summaryFrame.classList.add("collapsed");

            evaluationsToggle.classList.add("title-inactive");
            comparisonsToggle.classList.remove("title-inactive");
            summaryToggle.classList.add("title-inactive");
        })

        summaryToggle.addEventListener("click", function () {

            evaluationsFrame.classList.add("collapsed");
            comparisonsFrame.classList.add("collapsed");
            summaryFrame.classList.remove("collapsed");

            evaluationsToggle.classList.add("title-inactive");
            comparisonsToggle.classList.add("title-inactive");
            summaryToggle.classList.remove("title-inactive");
        })
    }

    function buildEvalsSettings(model) {

        var settingsButton = document.getElementById("evals-settings"),
            settingsButtonRect = settingsButton.getBoundingClientRect(),
            settingsBox = document.getElementById("evals-settings-box");

        settingsBox.style.left = settingsButtonRect.right - settingsBox.clientWidth + "px";
        settingsBox.style.top = settingsButtonRect.bottom + "px";

        settingsButton.addEventListener("click", function (e) {
            settingsBox.classList.toggle("hidden");
        });

        var settingsFilterTypes = Object.keys(model.getDataNodeLocationTypes());
        var settingsFilterTypesCheckBox = document.getElementById("evals-settings-filter-types-checkbox");
        var settingsFilterTypesCheckBoxes =  buildCheckbox(settingsFilterTypes, "_locationType", settingsFilterTypesCheckBox);

        var namesMapped = model.getDataNodeNames();

        var settingsFilterNames = Object.keys(namesMapped).filter(function (name) {
            return namesMapped[name].length > 1;
        });
        var settingsFilterNamesCheckbox = document.getElementById("evals-settings-filter-names-checkbox");
        var settingsFilterNamesCheckboxes = buildCheckbox(settingsFilterNames, "_name", settingsFilterNamesCheckbox);

        var settingsFilterTypesTextInput = document.getElementById("filter-types-text-input");

        settingsFilterTypesTextInput.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        settingsFilterTypesTextInput.addEventListener("keyup", function (e) {

            var dataNodes = model.getDataNodes(),
                property = "_name",
                match = new RegExp(this.value.toLowerCase());

            for (var j = 0; j < dataNodes.length; j++) {

                if (!dataNodes[j].isSelected) continue;

                var prop = dataNodes[j][property].toLowerCase();

                if (prop.match(match) !== null) {

                    toggleActive(dataNodes[j], true);
                }
                else {

                    toggleActive(dataNodes[j], false);
                }
            }

            buildComparisons(model, comparisonsFrame);
            buildSummary(model, summaryFrame);
        });

        return model;
    }

    function buildSceneSettings(model) {

        var settingsButton = document.getElementById("scene-settings"),
            settingsButtonRect = settingsButton.getBoundingClientRect(),
            settingsBox = document.getElementById("scene-settings-box");

        settingsBox.style.left = settingsButtonRect.right - settingsBox.clientWidth + "px";
        settingsBox.style.top = settingsButtonRect.bottom + "px";

        settingsButton.addEventListener("click", function (e) {
            settingsBox.classList.toggle("hidden");
        });

        var settingsTextToggleItem = document.getElementById("text-toggle-info"),
            settingsTextToggleCheckBox = document.getElementById("text-toggle-input");

        var dataNodes = model.getDataNodes();

        settingsTextToggleItem.addEventListener("click", function (e) {

            settingsTextToggleCheckBox.checked = !settingsTextToggleCheckBox.checked
            cdr.core.event.eventFire(settingsTextToggleCheckBox, "change", true);
            e.stopPropagation();
        });

        settingsTextToggleCheckBox.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        settingsTextToggleCheckBox.addEventListener("change", function (e) {

            for (var i = 0; i < dataNodes.length; i++) {

                var tag = dataNodes[i].getAttribute("tag")

                tag.classList.toggle("hidden");
            }
            e.stopPropagation();
        });

        return model;
    }

    function buildCheckbox(types, property, domElement) {

        var clones = [],
            dataNodes = model.getDataNodes();

        domElement.addEventListener("click", function (e) {
            e.stopPropagation();
        })

        for (var i = 0; i < types.length; i++) {

            var template = document.querySelector("#filter-types-checkbox-template");
            var clone = document.importNode(template.content, true);

            var settingsSubItem = clone.querySelector("#filter-types-checkbox-item-"),
                settingsSubItemInput = clone.querySelector("#filter-types-checkbox-input-"),
                settingsSubItemInfo = clone.querySelector("#filter-types-checkbox-info-");

            settingsSubItem.id += types[i];
            settingsSubItemInput.id += types[i];
            settingsSubItemInfo.id += types[i];

            settingsSubItemInfo.innerHTML = types[i];

            for (var j = 0; j < dataNodes.length; j++) {

                if (dataNodes[j][property] === types[i]) {

                    if (dataNodes[j].getAttribute("input") === null) {
                        dataNodes[j].setAttribute("input", []);
                    }

                    dataNodes[j].getAttribute("input").push(settingsSubItemInput);
                }
            }

            settingsSubItemInfo.addEventListener("click", (function (locationType, e) {

                var item = document.getElementById("filter-types-checkbox-input-" + locationType);

                item.checked = !item.checked
                cdr.core.event.eventFire(item, "change", true);

                e.stopPropagation();

            }).bind(this, types[i]));

            settingsSubItemInput.addEventListener("change", (function (locationType, e) {

                var bool = e.srcElement.checked;

                for (var j = 0; j < dataNodes.length; j++) {

                    if (dataNodes[j].getAttribute("input").includes(e.srcElement)) {

                        toggleActive(dataNodes[j], bool);
                    }
                }

                buildComparisons(model, comparisonsFrame);
                buildSummary(model, summaryFrame);
               
                e.stopPropagation();

            }).bind(this, types[i]));

            clones.push(clone);
            domElement.appendChild(clone);
        }

        return clones;
    }

    function buildEvaluations(model, domElement) {

        domElement.innerHTML = "";

        var width = evalsWidth * 0.95;
        var node = d3.select(domElement),
            dataNodes = model.getDataNodes().filter(function (dataNode) {
                return dataNode.isActive;
            });

        dataNodes.forEach(function (dataNode) {

            var data = dataNode.findData(),
                dataFormatted = [],
                id = cdr.core.string.generateUUID();

            for (var scheme in data) {

                var s = [];

                for (var key in data[scheme]) {

                    if (cdr.core.time.isTime(key)) {

                        s.push([data[scheme][key] / data[scheme]["Dimension"]]);
                    }
                }

                dataFormatted.push(s);                
            }

            var vals = [+slider0.value, +slider1.value],
                min = Math.min(vals[0], vals[1]),
                max = Math.max(vals[0], vals[1]);

            var comparator = d3.comparator({
                    height: 10,
                    width: width,
                    margin: { top: 0, right: 5, bottom: 0, left: 5 },
                    color: colorScale,
                    ignore: [],
                    //max: MAXDENSITY,
                    highlighted: { start: min, end: max }
                })
                .collapsed(true)
                .id(id);

            node.datum(dataFormatted).call(comparator);

            comparator
                .title(dataNode.getName())
                .onClick(function () {

                    var vals = [+slider0.value, +slider1.value],
                        min = Math.min(vals[0], vals[1]),
                        max = Math.max(vals[0], vals[1]);

                    this
                        .collapsed(!this.collapsed())
                        .margin((this.collapsed()
                            ? { top: 0, right: 5, bottom: 0, left: 5 }
                            : { top: 10, right: 5, bottom: 5, left: 5 }))
                        .height((this.collapsed() ? 10 : 100))
                        .highlighted({ start: min, end: max })
                        .build()
                        .title(this.title())
                });

            evaluationsComparators.push(comparator);
            dataNode.setAttribute("colors", comparator.colors());
            dataNode.setAttribute("id", id);
            dataNode.setAttribute("comparator", comparator);
        });

        return model;
    }

    function buildComparisons(model, domElement) {

        domElement.innerHTML = "";

        var data = buildTypeData(model.getDataFormatted(), 0, -1),
            width = evalsWidth * 0.95;

        for (var type in data) {

            var typeDiv = document.createElement("div");
            typeDiv.id = type + "-comparisons";
            typeDiv.classList.add("comparisons-box");

            domElement.appendChild(typeDiv);

            var node = d3.select(typeDiv);

            var vals = [+slider0.value, +slider1.value],
                min = Math.min(vals[0], vals[1]),
                max = Math.max(vals[0], vals[1]);

            var comparator = d3.comparator({
                height: 10,
                width: width,
                margin: { top: 0, right: 5, bottom: 0, left: 5 },
                color: colorScale,
                ignore: [],
                //max: MAXDENSITY,
                highlighted: { start: min, end: max }
                })
                .collapsed(true);

            node.datum(data[type]).call(comparator)

            comparator
                .title(type)
                .onClick(function () {

                    var vals = [+slider0.value, +slider1.value],
                        min = Math.min(vals[0], vals[1]),
                        max = Math.max(vals[0], vals[1]);

                    this
                        .collapsed(!this.collapsed())
                        .margin((this.collapsed()
                            ? { top: 0, right: 5, bottom: 0, left: 5 }
                            : { top: 10, right: 5, bottom: 5, left: 5 }))
                        .height((this.collapsed() ? 10 : 400))
                        .highlighted({start: min, end: max})
                        .build()
                        .title(this.title())
               
                });

            comparisonsComparators.push(comparator);

        }

        return model;
    }

    function buildSummary(model, domElement) {

        domElement.innerHTML = "";

        var min = Math.min(+slider0.value, +slider1.value),
            max = Math.max(+slider0.value, +slider1.value);

        var data = buildTypeData(model.getDataFormatted(), min, max),
            width = evalsWidth,
            height = width;

        for (var type in data) {
            
            var vals = [];

            data[type].forEach(function (scheme) {

                var n = [];

                for (var i = 0; i < scheme.length; i++) {
                    for (var j = 0; j < scheme[i].length; j++) {
                        n.push(scheme[i][j]);
                    }
                }

                vals.push(n);
            });

            data[type] = vals;
        }

        var summaryDiv = document.createElement("div");
        summaryDiv.classList.add("summary-box");

        domElement.appendChild(summaryDiv);

        var node = d3.select(summaryDiv);
        var summarator = d3.summarator({
            height: height,
            width: width,
            color: colorScale,
            max: MAXDENSITY
        });

        node.datum(data).call(summarator);

        return model;
    }

    function buildScene(model) {
       
        var viewer = new ThreeDxf.Viewer(
            model.getDXFData(),
            sceneFrame,
            sceneFrame.clientWidth,
            sceneFrame.clientHeight);

        scene = viewer.scene;
        renderer = viewer.renderer;

        mouse = new THREE.Vector2();
        frustum = new THREE.Frustum();
        projScreenMatrix = new THREE.Matrix4();

        controls = viewer.controls;
        controls.enableRotate = false;
        controls.update();
        controls.addEventListener('change', onCameraChange);

        camera = viewer.camera;
        camera.zoom = 0.004;
        camera.updateProjectionMatrix();
                   
        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('mousemove', onDocumentMouseMove, false);

        var selector = d3.selector(),
            dataNodes = model.getDataNodes().filter(function (dataNode) {
            return dataNode.isActive;
        });
        dataNodes.forEach(function (dataNode, i) {

            var point = buildPoint(dataNode);
            var tag = buildTag(dataNode);

            scene.add(point);

            dataNode.setAttribute("tag", tag);
            dataNode.setAttribute("point", point);
        });

        d3.select(sceneSelector).call(selector);

        selector.on("mouseup", function (sel) {

            if (sel.select === false) return;

            model.getDataNodes().forEach(function (dataNode) {

                var rect = dataNode.getAttribute("tag").getBoundingClientRect();

                if (rect.top - sceneRect.top >= sel.y &&
                    rect.bottom - sceneRect.top <= sel.y + sel.height &&
                    rect.left - sceneRect.left >= sel.x &&
                    rect.right - sceneRect.left <= sel.x + sel.width) {

                    toggleActive(dataNode, true);
                    toggleSelected(dataNode, true);
                }
                else {
                    toggleActive(dataNode, false);
                    toggleSelected(dataNode, false);
                }
            });

            buildComparisons(model, comparisonsFrame);
            buildSummary(model, summaryFrame);
        });

        animate();
        onWindowResize();
        onCameraChange();

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(sceneFrame.clientWidth, sceneFrame.clientHeight);
        }

        function onCameraChange() {

            dataNodes.forEach(function (dataNode, i) {

                var point = dataNode.getAttribute("point"),
                    tag = dataNode.getAttribute("tag");

                var proj = toScreenPosition(point, camera);

                var posX =  proj.x + 'px',
                    posY =  proj.y + 'px';

                tag.style.left = posX;
                tag.style.top = posY;

                projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
                frustum.setFromMatrix(projScreenMatrix);

                if (!frustum.intersectsObject(point)) {

                    if (tags.contains(tag)) {
                        tags.removeChild(tag);
                    }
                }
                else {

                    if (!tags.contains(tag)) {
                        tags.appendChild(tag);
                    }
                    tag.style.left = posX;
                    tag.style.top = posY;
                }
            });
        }

        function toScreenPosition(obj, camera) {
    
            var vector = new THREE.Vector3();
            var canvas = renderer.domElement;
            var geom = obj.geometry.vertices[0]

            vector.set(geom.x, geom.y, geom.z);
            vector.project(camera);

            vector.x = Math.round((vector.x + 1) * canvas.width / 2);
            vector.y = Math.round((-vector.y + 1) * canvas.height / 2);
            vector.z = 0;

            return {
                x: vector.x,
                y: vector.y
            };
        }
        
        function onDocumentMouseMove(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }

        function animate() {
            requestAnimationFrame(animate);
            render();
        }

        function render() {
            renderer.render(scene, camera);
        }

        return model;
    }

    function buildsliders(model) {
        
        var dataNodes = model.getDataNodes(),
            sliders = [slider0, slider1];

        sliders.forEach(function (slider) {

            slider.addEventListener("change", function () {

                var vals = [+slider0.value, +slider1.value],
                    min = Math.min(vals[0], vals[1]),
                    max = Math.max(vals[0], vals[1]);

                for (var i = 0; i < dataNodes.length; i++) {

                    var comparator = dataNodes[i].getAttribute("comparator"),
                        point = dataNodes[i].getAttribute("point"),
                        color = dataNodes[i].getAttribute("colors")[min];

                    comparator.highlighted({ start: min, end: max });
                    point.material.color.set(color);
                }

                for (var i = 0; i < comparisonsComparators.length; i++) {

                    var comparator = comparisonsComparators[i];
                    comparator.highlighted({ start: min, end: max })
                }

                buildSummary(model, summaryFrame);
            })

            slider.addEventListener("mousemove", function () {

                var min = Math.min(+slider0.value, +slider1.value);
                    max = Math.max(+slider0.value, +slider1.value);

                time.innerHTML = cdr.core.time.decimalDayToTime(min / 24) +
                    " to " +
                    cdr.core.time.decimalDayToTime(max / 24)
            });
        });

        return model;
    }

    function buildKeyEvents(model) {

        var settingsTextToggleItem = document.getElementById("text-toggle-info");

        document.addEventListener("keydown", function (e) {

            switch (e.key) {

                case "Shift":
                    sceneSelector.classList.add("selecting");
                    shiftDown = true;
                    break;

                case "Control":
                    cntrlDown = true;
                    break;

                case "Escape":
                    model.getDataNodes().forEach(function (dataNode) {

                        toggleActive(dataNode, true);
                        toggleSelected(dataNode, true);
                    })
                    buildComparisons(model, comparisonsFrame);
                    buildSummary(model, summaryFrame);
                    break;

                case "i":
                    if (cntrlDown) {
                        cdr.core.event.eventFire(settingsTextToggleItem, "click", false);
                    }
                    break;

                case "x":
                    if (cntrlDown) {
                        MAXDENSITY = MAXDENSITY === 0.4 ? -1 : 0.4;
                        //buildEvaluations(model, evaluationsFrame);
                        //buildComparisons(model, comparisonsFrame);
                        buildSummary(model, summaryFrame);
                    }
                    break;
                 

                default: break;
            }
        });

        document.addEventListener("keyup", function (e) {

            switch (e.key) {

                case "Shift":
                    sceneSelector.classList.remove("selecting");
                    shiftDown = false;
                    break;

                case "Control":
                    cntrlDown = false;
                    break;

                default: break;
            }
        });
    }

    ///
    /// model helpers
    /// ------------------------------------------------
    ///

    function buildTypeData(data, start, end) {

        var typeData = {};

        for (var type in data) {

            var dataFormatted = [];

            for (var scheme in data[type]) {

                dataFormatted.push(Object.keys(data[type][scheme]).map(function (k) {

                    return data[type][scheme][k];
                }));
            }

            typeData[type] = dataFormatted.map(function (scheme) {

                if (end === undefined || end === -1) {
                    
                    return scheme.slice(start);
                }
                else {
                    return scheme.slice(start, end + 1);
                }
                
            });
        }

        return typeData;
    }

    ///
    /// dataNode helpers
    /// ------------------------------------------------
    ///

    function buildPoint(dataNode) {

        var types = {

            "Circulation": {
                color: 'rgb(0, 0, 0)',
                size: 5,
                sizeAttenuation: false
            },
            "Other": {
                color: 'rgb(0, 0, 0)',
                size: 15,
                sizeAttenuation: false
            },
        }

        var data = dataNode.findData()[0]["Name"],
            attr;

        if (data in types) {
            attr = types[data];
        }
        else {
            attr = types["Other"];
        }

        ///
        /// make this the average of the mean
        ///
        attr.color = dataNode.getAttribute("colors")[+slider0.value];

        var pointGeom = new THREE.Geometry();
        pointGeom.vertices.push(convert(new THREE.Vector3(dataNode._pos.x, dataNode._pos.y, 0)));
        var pointMat = new THREE.PointsMaterial(attr);
        var point = new THREE.Points(pointGeom, pointMat);

        return point;

        function convert(vec) {
            return new THREE.Vector3(vec.y, -vec.x, vec.z);
        }
    }

    function buildTag(dataNode) {

        var tag = document.createElement("div");
        tag.id = dataNode.getName();
        tag.classList.add("tag");
        tag.innerText = dataNode.getName();

        var data = dataNode.findData();

        var info = document.createElement("div");
        info.classList.add("info");
        info.classList.add("collapsed");

        var id = dataNode.getAttribute("id"),
            comparator = dataNode.getAttribute("comparator"),
            comparatorDomElement = document.getElementById(id)

        var evals = document.getElementById("evals-title-evaluations");

        tag.addEventListener("mouseenter", function () {

            var point = dataNode.getAttribute("point"),
                color = {
                    r: point.material.color.r, 
                    g: point.material.color.g,
                    b: point.material.color.b
                };

            point.material.color.setRGB(0, 0, 0);

            tag.addEventListener("mouseleave", function () {

                this.removeEventListener(this.type, arguments.callee)

                point.material.color.setRGB(color.r, color.g, color.b);
            });
        });

        tag.addEventListener("click", function () {

            cdr.core.event.eventFire(evals, "click");

            info.classList.remove("collapsed");
            comparatorDomElement.scrollIntoView();

            if (comparator.collapsed()) {
                cdr.core.event.eventFire(comparatorDomElement, "click");
            }

            drawCornerLines(tag, comparatorDomElement);
        });

        tag.addEventListener("mouseleave", function () {

            info.classList.add("collapsed");
            svg.selectAll("*").remove();
        });

        tag.appendChild(info);

        function drawCornerLines(fromElement, toElement) {

            var fromRect = fromElement.getBoundingClientRect(),
                toRect = toElement.getBoundingClientRect();

            var p1 = {
                y: fromRect.top - helperRect.top,
                x: fromRect.left - helperRect.left
            }

            var p2 = {
                y: toRect.top - helperRect.top,
                x: toRect.left - helperRect.left
            }

            var p3 = {
                y: fromRect.bottom - helperRect.top,
                x: fromRect.right - helperRect.left
            }

            var p4 = {
                y: toRect.bottom - helperRect.top,
                x: toRect.left - helperRect.left
            }

            svg.selectAll("*").remove();

            svg.append("path")
                .attr("d", lineFunc([p1, p2]))
                .attr("stroke", "black")
                .style("stroke-dasharray", ("3, 3"))
                .attr("stroke-width", 0.7)
                .attr("opacity", 0.5)
                .attr("fill", "none");

            svg.append("path")
                .attr("d", lineFunc([p3, p4]))
                .attr("stroke", "black")
                .style("stroke-dasharray", ("3, 3"))
                .attr("stroke-width", 0.7)
                .attr("opacity", 0.5)
                .attr("fill", "none");
        }

        return tag;
    }

    function toggleActive(dataNode, active) {

        var selected = dataNode.isSelected;
        var checked = !dataNode.getAttribute("input").map(i => i.checked).includes(false);

        if ((active && !selected) || (active && !checked)) return dataNode;

        dataNode.isActive = active;
        dataNode.getAttribute("point").visible = active;

        if (active) {
            dataNode.getAttribute("tag").classList.remove("collapsed");
            dataNode
                .getAttribute("comparator")
                .div[0][0]
                .classList.remove("collapsed");

        }
        else {
            dataNode.getAttribute("tag").classList.add("collapsed");
            dataNode
                .getAttribute("comparator")
                .div[0][0]
                .classList.add("collapsed");
        }

        return dataNode;
    }

    function toggleSelected(dataNode, bool) {

        dataNode.isSelected = bool;

        return dataNode;
    }

})()