/// <reference path="lib/aviation.min.js" />
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
        buildScene(model, document.getElementById("scene-frame"));
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
            settingsBox = document.getElementById("evals-settings-box");

        var settingsButtonRect = settingsButton.getBoundingClientRect();

        settingsBox.style.left = settingsButtonRect.right - settingsBox.clientWidth + "px";
        settingsBox.style.top = settingsButtonRect.bottom + "px";

        settingsButton.addEventListener("mouseenter", function () {
            settingsBox.classList.remove("hidden");
        });
        settingsButton.addEventListener("mouseleave", function () {
            setTimeout(function () {
                settingsBox.classList.add("hidden");
            }, 200);          
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
                points = formatToComparator(data),
                id = aviation.core.string.generateUUID();

            var height = collapsed ? 10 : 100;
            var comparator = d3.comparator({ height: height, width: width}).collapsed(collapsed);

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
            height = 200,
            width = document.getElementById("evals-box").clientWidth * 0.95;
        
        console.log(data);

        for (var type in data) {

            var typeDiv = document.createElement("div");
            typeDiv.id = type + "-comparisons";
            typeDiv.classList.add("comparisons-box");

            domElement.appendChild(typeDiv);

            for (var scheme in data[type]) {

                 data[type][scheme] = Object.keys(data[type][scheme]).reduce(function (obj, key) {

                     var values = data[type][scheme][key],
                         deviation = d3.deviation(values),
                         mean = d3.mean(values),
                         ret;
                     

                     var qVals = [],
                         qMean,
                         qDev;

                     for (var i = 0; i < values.length; i++) {
                         
                         if (values[i] >= mean - 2 * deviation &&
                             values[i] <= mean + 2 * deviation) {

                             qVals.push(values[i]);
                         }
                     }

                     qMean = d3.mean(qVals);
                     qDev = d3.deviation(qVals);

                     ret = qMean
                         ? qMean
                         : mean

                     ret = mean - deviation;

                     obj[key] = ret > 0 ? ret : 0;

                    return obj;

                }, {});
            }

            var node = d3.select(typeDiv);
            var points = formatToComparator(data[type]);
            var comparator = d3.comparator({
                height: height,
                width: width,
                opacity: 0.3
            }).collapsed(false);

            node.datum(points).call(comparator);

            comparator
                .title(type + " occupancy values")
                .setHighlightedValue(+slider.value);

            comparisonComparators.push(comparator);
        }

        return model;
    }

    function buildSummary(model, domElement) {

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
        settingsButton.addEventListener("mouseenter", function () {
            settingsBox.classList.remove("hidden");
        });
        settingsButton.addEventListener("mouseleave", function () {

            setTimeout(function () {

                settingsBox.classList.add("hidden");

            }, 200);
        });

        settingsTextToggleItem.addEventListener("click", function () {

            settingsTextToggleCheckBox.checked = !settingsTextToggleCheckBox.checked
            eventFire(settingsTextToggleCheckBox, "change");
        });

        settingsTextToggleCheckBox.addEventListener("change", function () {

            for (var i = 0; i < dataNodes.length; i++) {

                var tag = dataNodes[i].getAttribute("tag")

                tag.classList.toggle("hidden");
            }
        });

        return model;
    }

    function buildScene(model, domElement) {

        var node = domElement,
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
                comparator.setHighlightedValue(value)
            }
        })

        slider.addEventListener("mousemove", function () {

            time.innerHTML = aviation.core.time.decimalDayToTime(+this.value / 24);
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

            settingsSubItemInfo.addEventListener("click", (function () {

                var item = document.getElementById("filter-types-checkbox-input-" + this);

                item.checked = !item.checked
                eventFire(item, "change");

            }).bind(types[i]));

            settingsSubItemInput.addEventListener("change", (function (locationType, e) {

                var dataNodes = model.getDataNodes(),
                    bool = e.srcElement.checked;

                for (var j = 0; j < dataNodes.length; j++) {

                    if (dataNodes[j][property] === locationType) {

                        dataNodes[j].isActive = bool;

                        if (bool) {
                            dataNodes[j].getAttribute("tag").classList.remove("collapsed");
                            dataNodes[j]
                                .getAttribute("comparator")
                                .div[0][0]
                                .classList.remove("collapsed");
                        }
                        else {
                            dataNodes[j].getAttribute("tag").classList.add("collapsed");
                            dataNodes[j]
                                .getAttribute("comparator")
                                .div[0][0]
                                .classList.add("collapsed");
                        }
                    }
                }
            }).bind(this, types[i]));

            clones.push(clone);
            domElement.appendChild(clone);
        }

        return clones;
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

                            if (aviation.core.time.isTime(attribute)) {

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

                if (aviation.core.time.isTime(key)) {

                    var dd = aviation.core.time.timeToDecimalDay(key);

                    __[scheme].push({
                        x: dd,
                        y: Number(obj[scheme][key])
                    });
                }
            }
        }

        return __;
    }

    function formatToSpiderGraph(obj) {

    }

    ///
    /// helper mathods
    /// --------------------------------------------
    ///

    // http://stackoverflow.com/questions/2705583/how-to-simulate-a-click-with-javascript
    function eventFire(el, etype) {
        if (el.fireEvent) {
            el.fireEvent('on' + etype);
        } else {
            var evObj = document.createEvent('Events');
            evObj.initEvent(etype, true, false);
            el.dispatchEvent(evObj);
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
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

})()