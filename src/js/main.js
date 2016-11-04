
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

    d3.csv("doc/occupationdata.csv", function (d1) {

        d3.csv("doc/occupationdata_rand.csv", function (d2) {

            model = new Model();
            model.setDataNodes(buildDataNodes(d1, d2));

            init(model.getDataNodes());
        })
    });

    function init(dataNodes) {

        var evalsCollapsed = document.getElementById("evals-collapsed-input");

        buildScene(
            buildEvaluations(
                dataNodes,
                document.getElementById("evals-frame"), true),
            document.getElementById("scene-frame"));

        evalsCollapsed.addEventListener("change", function () {
            buildEvaluations(dataNodes, document.getElementById("evals-frame"), this.checked);
        })
    }

    function buildEvaluations(dataNodes, domElement, collapsed) {

        domElement.innerHTML = "";

        var node = d3.select(domElement);

        dataNodes.forEach(function (dataNode) {

            var data = dataNode.findData(),
                points = {};

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
                comparator = d3.comparator({ height: height }).collapsed(collapsed),
                name = getName(dataNode);

            node.datum(points)
                .call(comparator);

            comparator
                .title(name)
                .onClick(function () {

                    var height = comparator.isCollapsed()
                        ? 100
                        : 10;

                    comparator
                        .height(height)
                        .rebuild(!comparator.isCollapsed())
                        .title(name);
                });

            dataNode.setAttribute("colors", comparator.getColors());

        });

        function isTime(testString) {
            return testString.match(/\d*:\d*/g) != null;
        }

        return dataNodes;
    }

    function buildScene(dataNodes, domElement) {

        var node = domElement;
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        scene = new THREE.Scene();

        scene.add(new THREE.AmbientLight(0xffffff, 0.3));

        var gridHelper = new THREE.GridHelper(14, 28, 0x303030, 0x303030);
        gridHelper.position.set(0, -0.04, 0);
        scene.add(gridHelper);

        var manager = new THREE.LoadingManager();
        manager.onProgress = function (item, loaded, total) {
            console.log(item, loaded, total);
        };

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(node.clientWidth, node.clientHeight);
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

        var points = [],
            rects = [];

        dataNodes.forEach(function (dataNode, i) {

            if (i != 0) return;

            var point = buildPoint(dataNode);
            var tag = buildTag(dataNode);
            //var rect = buildRect(dataNode);

            scene.add(point);
            //scene.add(rect);
            //rects.push(rect);
            points.push(point);
            document.getElementById("scene-box").appendChild(tag);

            dataNode.setAttribute("tag", tag);
            dataNode.setAttribute("point", point);
        });


        document.addEventListener('mousemove', onDocumentMouseMove, false);

        animate();

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(node.clientWidth, node.clientHeight);
        }

        // http://jsfiddle.net/wilt/kgxeuz24/65/
        function onCameraChange() {

            
            dataNodes.forEach(function (dataNode, i) {

                if (i != 0) return;

                var point = dataNode.getAttribute("point"),
                    tag = dataNode.getAttribute("tag"),
                    parent = tag.parentNode;

                var proj = toScreenPosition(point, camera);

                var posX = 0.82 * proj.x + 'px',
                    posY = 0.82 * proj.y + 'px';

                tag.style.left = posX;
                tag.style.top = posY;

                projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
                frustum.setFromMatrix(projScreenMatrix);
                if (!frustum.containsPoint(point)) {
                    console.log("offscreen")
                }

                var parentRect = parent.getBoundingClientRect(),
                    tagRect = tag.getBoundingClientRect();

                if (tagRect.top < parentRect.top ||
                    tagRect.right > parentRect.right ||
                    tagRect.bottom > parentRect.bottom ||
                    tagRect.left < parentRect.left) {
                    tag.classList.add("hidden");
                }
                else {
                    tag.classList.remove("hidden");
                }

            })
            
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


            raycaster.setFromCamera(mouse, camera);
            intersects = raycaster.intersectObjects(rects, true);

            if (intersects.length > 0) {
                
                console.log(intersects);

            } else {

            }

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

    function buildRect(dataNode) {

        var colors = dataNode.getAttribute("colors");

        var vec = convert(new THREE.Vector3(dataNode._pos.x, dataNode._pos.y, 0))

        var l = 10,
            w = 10,
            x = dataNode._pos.x,
            y = 0,
            z = -dataNode._pos.y;

        var shape = new THREE.Shape();
        shape.moveTo(l / 2, -l / 2);
        shape.lineTo(l / 2, l / 2);
        shape.lineTo(-l / 2, l / 2);
        shape.lineTo(-l / 2, -l / 2);
        shape.lineTo(l / 2, -l / 2);

        var geometry = new THREE.ShapeGeometry(shape);

        var mesh = new THREE.Mesh(geometry,
            new THREE.MeshLambertMaterial({ color: colors[0], opacity: 1, transparent: true }));
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(-Math.PI / 2, 0, 0);
        mesh.position.set(x, y, z);

        return mesh;
    }

    function buildTag(dataNode) {

        var tag = document.createElement("div");
        tag.id = getName(dataNode);
        tag.classList.add("tag");
        tag.classList.add("hidden");
        tag.innerText = getName(dataNode);

        return tag;
    }

    function getName(dataNode) {

        return dataNode.getName() == null
                ? dataNode.findData()[0]["Name"].slice(0, 11)
                : dataNode.getName();
    }

    function convert(vec) {
        return new THREE.Vector3(vec.x, vec.z, -vec.y);
    }
})()