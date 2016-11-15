/// <reference path="lib/aviation.min.js" />
/// <reference path="lib/three-dxf.js" />
/// <reference path="lib/d3.v3.min.js" />
/// <reference path="model.js" />
/// <reference path="lib/three.js" />

(function () {

    console.log("init aviation-output-comparator");

    var camera,
        scene,
        scenePoints,
        renderer,
        raycaster,
        intersects,
        mouse,
        frustum,
        projScreenMatrix;
        

    var helper = document.getElementById("helper"),
        slider = document.getElementById("evals-slider-input"),
        time = document.getElementById("evals-time");

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
    
        buildEvaluations(model, document.getElementById("evals-frame"), true);
        buildEvaluationSettings(model);
        buildScene(model, document.getElementById("scene-frame"));
        buildSceneSettings(model);
        buildSlider(model);
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

    function buildEvaluations(model, domElement, collapsed) {

        domElement.innerHTML = "";

        var node = d3.select(domElement),
            dataNodes = model.getDataNodes().filter(function (dataNode) {
                return dataNode.isActive;
            });

        dataNodes.forEach(function (dataNode) {

            var data = dataNode.findData(),
                points = {},
                id = aviation.core.string.generateUUID();

            for (var scheme in data) {

                points[scheme] = [];

                for (var key in data[scheme]) {

                    if (isTime(key)) {

                        var dd = aviation.core.time.timeToDecimalDay(key);

                        points[scheme].push({
                            x: dd,
                            y: Number(data[scheme][key])
                        });
                    }
                }
            }

            var height = collapsed ? 10 : 100,
                comparator = d3.comparator({ height: height }).collapsed(collapsed);

            node.datum(points)
                .call(comparator);

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

        function isTime(testString) {
            return testString.match(/\d*:\d*/g) != null;
        }

        return model;
    }

    function buildEvaluationSettings(model) {

        var settingsButton = document.getElementById("evals-settings"),
            settingsBox = document.getElementById("evals-settings-box");

        var settingsButtonRect = settingsButton.getBoundingClientRect();

        settingsBox.style.left = settingsButtonRect.right - settingsBox.clientWidth + "px";
        settingsBox.style.top = settingsButtonRect.bottom + "px";

        settingsButton.addEventListener("mouseenter", function () {
            settingsBox.classList.remove("hidden");
        });
        settingsButton.addEventListener("mouseleave", function () {
            settingsBox.classList.add("hidden");
        });

        var types = Object.keys(model.getDataNodeLocationTypes());

        var settingsFilterTypesCheckBox = document.getElementById("evals-settings-filter-types-checkbox");

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

                    if (dataNodes[j].getLocationType() === locationType) {

                        dataNodes[j].isActive = bool;
                        dataNodes[j].getAttribute("tag").classList.toggle("collapsed");
                        dataNodes[j]
                            .getAttribute("comparator")
                            .div[0][0]
                            .classList.toggle("collapsed");
                    }
                }
            }).bind(this, types[i]));

            settingsFilterTypesCheckBox.appendChild(clone);
        }

        return model;
    }

    function buildScene(model, domElement) {

        var node = domElement,
            width = node.clientWidth,
            height = node.clientHeight;

        var dataNodes = model.getDataNodes().filter(function (dataNode) {
            return dataNode.isActive;
        });;

        //camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
        //camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, -5000, 10000);
        //scene = new THREE.Scene();
        
        var font;
        var loader = new THREE.FontLoader();

        loader.load('fonts/helvetiker_regular.typeface.json', function (response) {
            font = response;
        });

        var viewer = new ThreeDxf.Viewer(model.getDXFData(), node, width, height, font);

        scene = viewer.scene;
        renderer = viewer.renderer;
        camera = viewer.camera;
        controls = viewer.controls;

        controls.enableRotate = false;

        //renderer.setPixelRatio(window.devicePixelRatio);
        //renderer.setSize(width, height);
        //renderer.setClearColor(0xffffff);

        controls.update();

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        scenePoints = [];

        frustum = new THREE.Frustum();
        projScreenMatrix = new THREE.Matrix4();


        //camera.position.set(161, -115, 9);
        camera.zoom = 0.004;
        camera.updateProjectionMatrix();

        controls.addEventListener('change', onCameraChange);    
        window.addEventListener('resize', onWindowResize, false);

        dataNodes.forEach(function (dataNode, i) {

            var point = buildPoint(dataNode);
            var tag = buildTag(dataNode);

            scene.add(point);
            scenePoints.push(point);

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

            var domElement = document.getElementById("scene-tags");

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

                    if (domElement.contains(tag)) {
                        domElement.removeChild(tag);
                    }
                }
                else {

                    if (!domElement.contains(tag)) {
                        domElement.appendChild(tag);
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
            //event.preventDefault();
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
        settingsButton.addEventListener("mouseenter", function () {
            settingsBox.classList.remove("hidden");
        });
        settingsButton.addEventListener("mouseleave", function () {
            settingsBox.classList.add("hidden");
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

    function buildSlider(model) {
        
        var dataNodes = model.getDataNodes();

        slider.addEventListener("change", function () {

            for (var i = 0; i < dataNodes.length; i++) {

                var value = +this.value,
                    comparator = dataNodes[i].getAttribute("comparator"),
                    point = dataNodes[i].getAttribute("point"),
                    color = dataNodes[i].getAttribute("colors")[value];

                comparator.setHighlightedValue(value);
                point.material.color.set(color);
            }
        })

        slider.addEventListener("mousemove", function () {

            time.innerHTML = aviation.core.time.decimalDayToTime(+this.value / 24);
        });
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
        //return !bool ? dataNode.getName().slice(0, 11) : dataNode.getName();
        return dataNode.getName();
    }

    function convert(vec) {
        //return new THREE.Vector3(vec.x, vec.z, -vec.y);
        return new THREE.Vector3(vec.y, -vec.x, vec.z);
        //return vec;
    }

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