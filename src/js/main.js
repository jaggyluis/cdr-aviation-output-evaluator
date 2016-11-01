
(function () {

    console.log("init aviation-output-evaluator");

    var camera,
        scene,
        renderer;

    CSVData = d3.csv("doc/occupationdata.csv", function (data) {

        dataNodes = buildDataNodes(data);

        init(dataNodes);
    });

    function init(dataPoints) {

        main = document.getElementById("main");

        console.log(main);

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
        renderer.setSize(main.clientWidth, main.clientHeight);
        renderer.setClearColor(0xffffff);
        main.appendChild(renderer.domElement);
        
        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 12, 0);
        camera.position.set(2, 18, 28);
        controls.update();
        window.addEventListener('resize', onWindowResize, false);

        threePoints = [];

        dataPoints.forEach(function (dataPoint) {

            var pointGeom = new THREE.Geometry();
            pointGeom.vertices.push(convert(new THREE.Vector3(dataPoint._pos.x, dataPoint._pos.y, 0))); //point
            var pointMat = new THREE.PointsMaterial({ color: 'rgb(0, 0, 0)', size: 1 });

            scene.add(new THREE.Points(pointGeom, pointMat));
        })


        animate();
    }

    function convert(vec) {
        return new THREE.Vector3(vec.x, vec.z, -vec.y);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        renderer.render(scene, camera);
    }

})()