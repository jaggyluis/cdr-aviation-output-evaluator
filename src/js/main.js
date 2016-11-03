
(function () {

    console.log("init aviation-output-evaluator");

    var camera,
        scene,
        renderer;

    d3.csv("doc/occupationdata.csv", function (d1) {

        d3.csv("doc/occupationdata_rand.csv", function (d2) {

            model = new Model();
            model.setDataNodes(buildDataNodes(d1, d2));

            init(model.getDataNodes());
        })
    });

    ///
    /// This needs heavy refactoring
    ///

    function init(dataNodes) {

        var evalsCollapsed = document.getElementById("evals-collapsed-input");

        buildEvaluations(dataNodes, document.getElementById("evals-frame"), true);

        evalsCollapsed.addEventListener("change", function () {
            buildEvaluations(dataNodes, document.getElementById("evals-frame"), this.checked);
        })

        buildScene(dataNodes,  document.getElementById("scene-frame"));       
    }

    function buildScene(dataNodes, domElement) {

        var node = domElement;
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        scene = new THREE.Scene();

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

        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 12, 0);
        camera.position.set(2, 18, 28);
        controls.update();
        controls.addEventListener('change', onCameraChange);
        window.addEventListener('resize', onWindowResize, false);

        var threePoints = [],
            threeTags = [];

        dataNodes.forEach(function (dataNode, i) {

            var pointGeom = new THREE.Geometry();
            pointGeom.vertices.push(convert(new THREE.Vector3(dataNode._pos.x, dataNode._pos.y, 0))); //point
            var pointMat = new THREE.PointsMaterial({ color: 'rgb(0, 0, 0)', size: 1 });
            var point = new THREE.Points(pointGeom, pointMat)

            scene.add(point);
            threePoints.push(point);

            if (i == 20) {

                var threeTag = document.createElement("div");
                threeTag.id = i;
                threeTag.classList.add("tag")
                threeTag.innerText = "A test"
                
                document.body.appendChild(threeTag);
                threeTags.push(threeTag);
            }

        });

        animate();

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(node.clientWidth, node.clientHeight);
        }

        // http://jsfiddle.net/wilt/kgxeuz24/65/
        function onCameraChange() {

            var proj = toScreenPosition(threePoints[20], camera);

            console.log(proj, threeTags[0]);

            threeTags[0].style.left = proj.x + 'px';
            threeTags[0].style.top = proj.y + 'px';
        }

        function toScreenPosition(obj, camera) {

            var vector = new THREE.Vector3();

            var widthHalf = 0.5 * renderer.context.canvas.width;
            var heightHalf = 0.5 * renderer.context.canvas.height;

            obj.updateMatrixWorld();
            vector.setFromMatrixPosition(obj.matrixWorld);
            vector.project(camera);

            vector.x = (vector.x * widthHalf) + widthHalf;
            vector.y = -(vector.y * heightHalf) + heightHalf;

            return {
                x: vector.x,
                y: vector.y
            };
        }

        function animate() {
            requestAnimationFrame(animate);
            render();
        }

        function render() {
            renderer.render(scene, camera);
        }

        function convert(vec) {
            return new THREE.Vector3(vec.x, vec.z, -vec.y);
        }
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
                name = dataNode.getName() == null
                    ? data[0]["Name"]
                    : dataNode.getName();

            node.datum(points)
                .call(comparator)

            comparator.title(name);
        });

        function isTime(testString) {
            return testString.match(/\d*:\d*/g) != null;
        }
    }
})()