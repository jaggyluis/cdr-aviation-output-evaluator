
(function () {


    document.getElementById('dxf-input').addEventListener('change', onFileSelected, false);

    function onFileSelected(evt) {

        var file = evt.target.files[0];
        var reader = new FileReader();

        reader.onprogress = updateProgress;
        reader.onloadend = onSuccess;
        reader.onabort = abortUpload;
        reader.onerror = errorHandler;
        reader.readAsText(file);
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

        // Three.js changed the way fonts are loaded, and now we need to use FontLoader to load a font
        //  and enable TextGeometry. See this example http://threejs.org/examples/?q=text#webgl_geometry_text
        //  and this discussion https://github.com/mrdoob/three.js/issues/7398 
        var font;
        var loader = new THREE.FontLoader();
        loader.load('fonts/helvetiker_regular.typeface.json', function (response) {
            font = response;
        });

        cadCanvas = new ThreeDxf.Viewer(dxf, document.getElementById('scene-frame'), 400, 400, font);


    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }


})();
