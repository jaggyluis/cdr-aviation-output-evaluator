/// <reference path="lib/d3.selector.js" />
/// <reference path="lib/d3.selector.js" />
/// <reference path="lib/d3.selector.js" />
/// <reference path="lib/cdr.min.js" />
/// <reference path="lib/three-dxf.js" />
/// <reference path="lib/d3.v3.min.js" />
/// <reference path="model.js" />
/// <reference path="lib/three.js" />

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
        slider = document.getElementById("evals-slider-input"),
        time = document.getElementById("evals-time"),
        tags = document.getElementById("scene-tags");

    var legendOptions = ['Scheme1', "Scheme2"];
    var colorScale = function (d, i) { return ["#cc0000", "#006699"][i] }

    var comparisonComparators = [];

    var svg = d3.select(helper)
        .append("svg")
        .attr("width", helper.clientWidth)
        .attr("height", helper.clientHeight);

    var lineFunc = d3.svg.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .interpolate('linear');

    d3.csv("doc/occupationdata1.csv", function (d1) {

        d3.csv("doc/occupationdata2.csv", function (d2) {

            readFile("doc/spatialstructure.dxf", function (dxf) {

                model = new Model();
                model.setDataNodes(buildDataNodes(d1, d2));
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
        buildSlider(model);
    }

    function buildEvalsFrames(model) {

        var evaluationsFrame = document.getElementById("evaluations-frame"),
            evaluationsToggle = document.getElementById("evals-title-evaluations");

        var comparisonsFrame = document.getElementById("comparisons-frame"),
            comparisonsToggle = document.getElementById("evals-title-comparisons");

        var summaryFrame = document.getElementById("summary-frame"),
            summaryToggle = document.getElementById("evals-title-summary");

        buildEvaluations(model, evaluationsFrame);
        buildComparisons(model, comparisonsFrame);
        //buildSummary(model, summaryFrame);

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
            settingsBox = document.getElementById("evals-settings-box");

        var settingsButtonRect = settingsButton.getBoundingClientRect();

        settingsBox.style.left = settingsButtonRect.right - settingsBox.clientWidth + "px";
        settingsBox.style.top = settingsButtonRect.bottom + "px";

        settingsButton.addEventListener("click", function (e) {
            settingsBox.classList.toggle("hidden");
        });

        var settingsFilterTypes = Object.keys(model.getDataNodeLocationTypes());
        var settingsFilterTypesCheckBox = document.getElementById("evals-settings-filter-types-checkbox");
        var settingsFilterTypesCheckbox =  buildCheckbox(settingsFilterTypes, "_locationType", settingsFilterTypesCheckBox);

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

                var prop = dataNodes[j][property].toLowerCase();

                if (prop.match(match) !== null) {

                    toggleActive(dataNodes[j], true);
                }
                else {

                    toggleActive(dataNodes[j], false);
                }
            }
        });

        return model;
    }

    function buildEvaluations(model, domElement) {

        domElement.innerHTML = "";

        var width = width = document.getElementById("evals-box").clientWidth * 0.95;
        var node = d3.select(domElement),
            collapsed = true,
            dataNodes = model.getDataNodes().filter(function (dataNode) {
                return dataNode.isActive;
            });

        dataNodes.forEach(function (dataNode) {

            var data = dataNode.findData(),
                dataFormatted = formatToComparator(data);
                id = cdr.core.string.generateUUID();

                var points = [
                    { mid: dataFormatted[0], dir: 1},
                    { mid: dataFormatted[1], dir: -1}
                ]

            var height = collapsed ? 10 : 100;
            var comparator = d3.comparatorPline({ height: height, width: width}).collapsed(collapsed);

            node.datum(points).call(comparator);

            comparator
                .title(getName(dataNode, !comparator.isCollapsed()))
                .id(id)
                .setHighlightedValue(+slider.value)
                .onClick(function () {

                    var height = comparator.isCollapsed()
                        ? 100
                        : 10;

                    comparator
                        .height(height)
                        .rebuild(!comparator.isCollapsed())
                        .title(getName(dataNode, !comparator.isCollapsed()));
                });

            dataNode.setAttribute("colors", comparator.getColors());
            dataNode.setAttribute("id", id);
            dataNode.setAttribute("comparator", comparator);
        });

        return model;
    }

    function buildComparisons(model, domElement) {

        var data = formatToAnalysis(model),
            dataNodeLocationTypeValues = {},
            height = 200,
            width = document.getElementById("evals-box").clientWidth * 0.95;
        

        for (var type in data) {

            var typeDiv = document.createElement("div");
            typeDiv.id = type + "-comparisons";
            typeDiv.classList.add("comparisons-box");

            domElement.appendChild(typeDiv);

            var dataFormatted = [];

            for (var scheme in data[type]) {

                dataFormatted.push(Object.keys(data[type][scheme]).map(function (k) {
                    return data[type][scheme][k];
                }))
            }

            var node = d3.select(typeDiv);
            var comparator = d3.comparatorBox({
                height: height,
                width: width,
                color: colorScale,
                ignore: [0]
            });

            node.datum(dataFormatted)
                .call(comparator)

            comparator.title(type + " Occupancy Data Range");

            comparisonComparators.push(comparator);
        }

        model.setDataNodeLocationTypeValues(dataNodeLocationTypeValues);

        return model;
    }

    function buildSummary(model, domElement) {

        var data = model.getDataNodeLocationTypeValues(),
            width = document.getElementById("evals-box").clientWidth * .75,
            height = width,
            typeValues = [[],[]],
            attr = "mid";

        var summaryDiv = document.createElement("div");
        summaryDiv.classList.add("summary-box");

        domElement.appendChild(summaryDiv);

        var config = {
            w: width,
            h: height,
            maxValue: 0,
            levels: 5,
            ExtraWidthX: 200,
            color: colorScale, 
        }

        for (var type in data) {

            var index = 0

            for (var scheme in data[type]) {

                var values = Object.keys(data[type][scheme][attr]).map(function (d) {

                    return data[type][scheme][attr][d];
                });

                var value = d3.mean(values);

                typeValues[index].push({
                    axis: type,
                    value: value
                });

                index++;
            }
        }

        RadarChart.draw(summaryDiv, typeValues, config);
        buildLegend(summaryDiv, 100, 100);

        return model;
    }

    function buildScene(model) {

        var node = document.getElementById("scene-frame"),
            width = node.clientWidth,
            height = node.clientHeight;

        var dataNodes = model.getDataNodes().filter(function (dataNode) {
            return dataNode.isActive;
        });;
       
        var viewer = new ThreeDxf.Viewer(model.getDXFData(), node, width, height);

        scene = viewer.scene;
        renderer = viewer.renderer;
        camera = viewer.camera;
        controls = viewer.controls;

        controls.enableRotate = false;
        controls.update();

        mouse = new THREE.Vector2();
        frustum = new THREE.Frustum();
        projScreenMatrix = new THREE.Matrix4();

        camera.zoom = 0.004;
        camera.updateProjectionMatrix();

        controls.addEventListener('change', onCameraChange);    
        window.addEventListener('resize', onWindowResize, false);

        dataNodes.forEach(function (dataNode, i) {

            var point = buildPoint(dataNode);
            var tag = buildTag(dataNode);

            scene.add(point);

            dataNode.setAttribute("tag", tag);
            dataNode.setAttribute("point", point);
        });

        document.addEventListener('mousemove', onDocumentMouseMove, false);

        var selector = d3.selector(),
            sceneSelector = document.getElementById("scene-selector");

        document.addEventListener("keydown", function (e) {
            
            if (e.key === "Shift") {
                sceneSelector.classList.add("selecting");
            }
        })

        document.addEventListener("keyup", function (e) {

            if (e.key === "Shift") {
                sceneSelector.classList.remove("selecting");
            }
        })

        d3.select(sceneSelector).call(selector);

        selector.on("mouseup", function (down, up) {

            console.log(down, up);
        })

        animate();
        onWindowResize();
        onCameraChange();

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(node.clientWidth, node.clientHeight);
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

    function buildSceneSettings(model) {

        var settingsButton = document.getElementById("scene-settings"),
            settingsBox = document.getElementById("scene-settings-box");

        var settingsButtonRect = settingsButton.getBoundingClientRect();

        var settingsTextToggleItem = document.getElementById("text-toggle-info"),
            settingsTextToggleCheckBox = document.getElementById("text-toggle-input");

        var dataNodes = model.getDataNodes();

        settingsBox.style.left = settingsButtonRect.right - settingsBox.clientWidth + "px";
        settingsBox.style.top = settingsButtonRect.bottom + "px";
        settingsButton.addEventListener("click", function (e) {
            settingsBox.classList.toggle("hidden");
        });

        settingsTextToggleItem.addEventListener("click", function (e) {

            settingsTextToggleCheckBox.checked = !settingsTextToggleCheckBox.checked
            eventFire(settingsTextToggleCheckBox, "change", true);
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

    function buildSlider(model) {
        
        var dataNodes = model.getDataNodes();

        slider.addEventListener("change", function () {

            var value = +this.value;

            for (var i = 0; i < dataNodes.length; i++) {

                var comparator = dataNodes[i].getAttribute("comparator"),
                    point = dataNodes[i].getAttribute("point"),
                    color = dataNodes[i].getAttribute("colors")[value];

                comparator.setHighlightedValue(value);
                point.material.color.set(color);
            }

            for (var i = 0; i < comparisonComparators.length; i++) {

                var comparator = comparisonComparators[i];
                comparator.highlighted(value)
            }
        })

        slider.addEventListener("mousemove", function () {

            time.innerHTML = cdr.core.time.decimalDayToTime(+this.value / 24);
        });

        return model;
    }

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

        attr.color = dataNode.getAttribute("colors")[+slider.value];

        var pointGeom = new THREE.Geometry();
        pointGeom.vertices.push(convert(new THREE.Vector3(dataNode._pos.x, dataNode._pos.y, 0)));
        var pointMat = new THREE.PointsMaterial(attr);
        var point = new THREE.Points(pointGeom, pointMat);

        return point;
    }

    function buildCheckbox(types, property, domElement) {

        var clones = [];

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

            settingsSubItemInfo.addEventListener("click", (function (locationType, e) {

                var item = document.getElementById("filter-types-checkbox-input-" + locationType);

                item.checked = !item.checked
                eventFire(item, "change", true);

                e.stopPropagation();

            }).bind(this, types[i]));

            settingsSubItemInput.addEventListener("change", (function (locationType, e) {

                var dataNodes = model.getDataNodes(),
                    bool = e.srcElement.checked;

                for (var j = 0; j < dataNodes.length; j++) {

                    if (dataNodes[j][property] === locationType) {

                        toggleActive(dataNodes[j], bool);
                    }
                }

                e.stopPropagation();

            }).bind(this, types[i]));

            clones.push(clone);
            domElement.appendChild(clone);
        }

        return clones;
    }

    function buildLegend(domElement, w,h) {

        var svg = d3.select(domElement)
            .selectAll('svg')
            .append('svg')
            .attr("width", w + 500)
            .attr("height", h)

        var text = svg.append("text")
            .attr("class", "title")
            .attr('transform', 'translate(' + 0 + ',0)')
            .attr("x", w - 70)
            .attr("y", 10)
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "#404040")
            .text("Total Mean Density Comparison");

        var legend = svg.append("g")
            .attr("class", "legend")
            .attr("height", 100)
            .attr("width", 200)
            .attr('transform', 'translate(' + 0 + ',20)');

        legend.selectAll('rect')
            .data(legendOptions)
            .enter()
            .append("rect")
            .attr("x", w - 65)
            .attr("y", function (d, i) { return i * 20; })
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", colorScale);

        legend.selectAll('text')
            .data(legendOptions)
            .enter()
            .append("text")
            .attr("x", w - 52)
            .attr("y", function (d, i) { return i * 20 + 9; })
            .attr("font-size", "11px")
            .attr("fill", "#737373")
            .text(function (d) { return d; });
    }

    function buildTag(dataNode) {

        var tag = document.createElement("div");
        tag.id = getName(dataNode);
        tag.classList.add("tag");
        tag.innerText = getName(dataNode);

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

            eventFire(evals, "click");

            info.classList.remove("collapsed");
            comparatorDomElement.scrollIntoView();

            if (comparator.isCollapsed()) {
                eventFire(comparatorDomElement, "click");
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

            ///
            /// TODO - this is bad - calculate
            ///
            var offset = 8;

            var p1 = {
                y: fromRect.top - offset,
                x: fromRect.left - offset
            }

            var p2 = {
                y: toRect.top - offset,
                x: toRect.left - offset
            }

            var p3 = {
                y: fromRect.bottom - offset,
                x: fromRect.right - offset
            }

            var p4 = {
                y: toRect.bottom - offset,
                x: toRect.left - offset
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

    function getName(dataNode, bool) {

        return dataNode.getName();
    }

    function convert(vec) {

        return new THREE.Vector3(vec.y, -vec.x, vec.z);
    }

    ///
    /// formatting methods
    /// --------------------------------------------
    ///

    function formatToAnalysis(model) {

        var dataTypes = model.getDataNodeNames();
        var __ = {};

        for (var type in dataTypes) {

            if (dataTypes[type].length > 1) {

                var schemes = {};

                for (var i = 0; i < dataTypes[type].length; i++) {

                    var dataNode = dataTypes[type][i],
                        data = dataNode.findData();

                    for (var scheme in data) {

                        if (!(scheme in schemes)) {

                            schemes[scheme] = [];
                        }

                        schemes[scheme].push(data[scheme]);
                    }
                }

                for (var scheme in schemes) {

                    var attributes = {};

                    for (var i = 0; i < schemes[scheme].length; i++) {

                        var dimension = +schemes[scheme][i]["Dimension"];

                        for (var attribute in schemes[scheme][i]) {

                            if (cdr.core.time.isTime(attribute)) {

                                if (!(attribute in attributes)) {

                                    attributes[attribute] = [];
                                }

                                attributes[attribute].push(+schemes[scheme][i][attribute] / dimension);
                            }
                        }
                    }

                    schemes[scheme] = attributes;
                }

                __[type] = schemes;
            }
        }

        return __;
    }

    function formatToComparator(obj) {

        var __ = {};

        for (var scheme in obj) {

            __[scheme] = [];

            for (var key in obj[scheme]) {

                if (cdr.core.time.isTime(key)) {

                    var dd = cdr.core.time.timeToDecimalDay(key);

                    __[scheme].push({
                        x: dd,
                        y: Number(obj[scheme][key])
                    });
                }
            }
        }

        return __;
    }

    function formatToRadarChart(obj) {

        var __ = [];

        for (var scheme in obj) {

            var lst = [];

            for (var key in obj[scheme]) {

                lst.push({
                    axis: key,
                    value: obj[scheme][value]
                })
            }

            __.push(lst);
        }

        return __;
    }

    ///
    /// helper mathods
    /// --------------------------------------------
    ///

    function toggleActive(dataNode, bool) {

        dataNode.isActive = bool;
        dataNode.getAttribute("point").visible = bool;

        if (bool) {
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

    // http://stackoverflow.com/questions/2705583/how-to-simulate-a-click-with-javascript
    function eventFire(el, etype, stop) {
        if (el.fireEvent) {
            el.fireEvent('on' + etype);
        } else {
            var evObj = document.createEvent('Events');
            evObj.initEvent(etype, true, false);
            el.dispatchEvent(evObj);
            if (stop) evObj.stopPropagation();
        }
    }

    function mode(arr) {

        var __ = {},
            mode = arr[0];

        arr.forEach(function (i) {

            if (!(i in __)) { __[i] = 0; }
            __[i]++;

        });

        for (var i in __) {
            if (__[i] > __[mode]) { mode = i; }
        }

        return mode;
    }

    function readFile(file, cb) {

        function readTextFile(file, cb) {
            var rawFile = new XMLHttpRequest();
            rawFile.responseType = "blob"
            rawFile.open("GET", file, true);
            rawFile.onreadystatechange = function () {

                if (rawFile.readyState === 4) {
                    if (rawFile.status === 200 || rawFile.status == 0) {

                        var response = rawFile.response;

                        cb(response);
                    }
                }
            }
            rawFile.send(null);
        }

        var reader = new FileReader();

        reader.onprogress = updateProgress;
        reader.onabort = abortUpload;
        reader.onerror = errorHandler;

        reader.onloadend = function (evt) {
            cb(onSuccess(evt));
        };

        readTextFile(file, function (data) {
            reader.readAsText(data);
        });
    }

    function abortUpload() {
        console.log('Aborted read!')
    }

    function errorHandler(evt) {
        switch (evt.target.error.code) {
            case evt.target.error.NOT_FOUND_ERR:
                alert('File Not Found!');
                break;
            case evt.target.error.NOT_READABLE_ERR:
                alert('File is not readable');
                break;
            case evt.target.error.ABORT_ERR:
                break; // noop
            default:
                alert('An error occurred reading this file.');
        }
    }

    function updateProgress(evt) {
        console.log('progress');
        console.log(Math.round((evt.loaded / evt.total) * 100));
    }

    function onSuccess(evt) {
        var fileReader = evt.target;
        if (fileReader.error) return console.log("error onloadend!?");

        var parser = new window.DxfParser();
        var dxf = parser.parseSync(fileReader.result);

        return dxf;
    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }

})()