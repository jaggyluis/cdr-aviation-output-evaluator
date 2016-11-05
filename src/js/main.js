
(function () {

    console.log("init aviation-output-evaluator");

    var camera,
        scene,
        renderer,
        raycaster,
        intersects,
        mouse,
        frustum,
        projScreenMatrix;

    var helper = document.getElementById("helper");

    var svg = d3.select(helper)
        .append("svg")
        .attr("width", helper.clientWidth)
        .attr("height", helper.clientHeight);

    var lineFunc = d3.svg.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .interpolate('linear');

    d3.csv("doc/occupationdata.csv", function (d1) {

        d3.csv("doc/occupationdata_rand.csv", function (d2) {

            model = new Model();
            model.setDataNodes(buildDataNodes(d1, d2));

            init(model);
        })
    });

    function init(model) {

        buildScene(
            buildEvaluations(
                model.getDataNodes(),
                document.getElementById("evals-frame"), true),
            document.getElementById("scene-frame"));

        buildEvaluationSettings();
    }

    function buildEvaluationSettings(dataNodes) {

        var settingsButton = document.getElementById("evals-settings"),
            settingsBox = document.getElementById("evals-settings-box");

        var settingsButtonRect = settingsButton.getBoundingClientRect();

        settingsBox.style.left = settingsButtonRect.right -
            settingsBox.clientWidth - 5 + "px";

        settingsBox.style.top = settingsButtonRect.bottom + "px";

        //console.log(settings)

        settingsButton.addEventListener("mouseenter", function () {

            settingsBox.classList.remove("hidden");
        });

        settingsButton.addEventListener("mouseleave", function () {

            settingsBox.classList.add("hidden");
        });

    }

    function buildEvaluations(dataNodes, domElement, collapsed) {

        domElement.innerHTML = "";

        var node = d3.select(domElement);

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

        return dataNodes;
    }

    function buildSceneSettings() {



    }

    function buildScene(dataNodes, domElement) {

        var node = domElement,
            width = node.clientWidth,
            height = node.clientHeight;

        camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
        scene = new THREE.Scene();

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        renderer.setClearColor(0xffffff);
        node.appendChild(renderer.domElement);

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        frustum = new THREE.Frustum();
        projScreenMatrix = new THREE.Matrix4();

        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 12, 0);
        camera.position.set(2, 18, 28);
        controls.update();
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
        onCameraChange();

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(node.clientWidth, node.clientHeight);
        }

        function onCameraChange() {

            var domElement = document.getElementById("scene-box");

            dataNodes.forEach(function (dataNode, i) {

                var point = dataNode.getAttribute("point"),
                    tag = dataNode.getAttribute("tag");

                var proj = toScreenPosition(point, camera);

                ///
                /// TODO - this is bad - should be a function of parent
                ///
                var posX = 0.82 * proj.x + 'px',
                    posY = 0.82 * proj.y + 50 + 'px';

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
            event.preventDefault();
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

        return dataNodes;
    }

    function buildPoint(dataNode) {

        var types = {

            "Circulation": { color: 'rgb(0, 0, 0)', size: 5 },
            "Other": { color: 'rgb(0, 0, 0)', size: 15 },
        }

        var data = dataNode.findData()[0]["Name"],
            attr;

        if (data in types) {
            attr = types[data];
        }
        else {
            attr = types["Other"];
        }

        attr.color = dataNode.getAttribute("colors")[0];

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

        return dataNode.getName() == null
                ? bool
                    ? dataNode.findData()[0]["Name"]
                    : dataNode.findData()[0]["Name"].slice(0, 11)
                : dataNode.getName();
    }

    function convert(vec) {
        return new THREE.Vector3(vec.x, vec.z, -vec.y);
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
})()