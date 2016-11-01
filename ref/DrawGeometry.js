/* Global Variables */
var INFINITE = 10000;
var SEGMENTS = 64;
var DEFAULT_COLOR = 'rgb(100,100,100)';
var BLACK = 'rgb(0,0,0)';
var minX;
var maxX;
var minY;
var maxY;
var minZ;
var maxZ;

function drawGeometry(decodesData) {
	for (var i = 0; i < decodesData.length; i++){
		switch (decodesData[i].py_object){
			case "Point":
				drawPoint(decodesData[i]);
				break;
			case "Segment":
				drawSegment(decodesData[i]);
				break;
			case "Vec":
				drawVec(decodesData[i]);
				break;
			case "Ray":
				drawRay(decodesData[i]);
				break;
			case "Line":
				drawLine(decodesData[i]);
				break;
			case "Curve": //fall through to same function as PLine
			case "PLine":
				drawPLine(decodesData[i]);
				break;
			case "Arc":
				drawArc(decodesData[i]);
				break;
			case "RGon": //fall through to same function as PGon
			case "PGon":
				drawPGon(decodesData[i]);
				break;
			case "Circle":
				drawCircle(decodesData[i]);
				break;
			case "Plane":
				drawPlane(decodesData[i]);
				break;
			case "CS":
				drawCS(decodesData[i]);
				break;
			case "Surface": //fall through to same function as Mesh
			case "Mesh":
				drawMesh(decodesData[i]);
				break;
			default:
				console.warn("JSON geometry is not valid.");
		}
	}
	// Set default extents if they haven't been set yet
	if (typeof minX === "undefined"){
		minX = maxX = minY = maxY = minZ = maxZ = 0;
	}
	
	render();
}

/* Draw Point */
/* Sample Point Object: {"py_object": "Point", "xyz": [0, 0, 0], "props": {"color": [255, 0, 0], "weight": 1.5}} */
function drawPoint(decodesObj){
	var pointGeom = new THREE.Geometry();
	pointGeom.vertices.push(convert(new THREE.Vector3(decodesObj.xyz[0],decodesObj.xyz[1],decodesObj.xyz[2]))); //point
	var pointMat = new THREE.PointCloudMaterial({color:BLACK,size:1});
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			pointMat.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
		if (decodesObj.props.hasOwnProperty('weight')){
			pointMat.size = decodesObj.props.weight;
		}
	}
	scene.add(new THREE.PointCloud(pointGeom, pointMat));
	updateExtentsPoint(convert(new THREE.Vector3(decodesObj.xyz[0],decodesObj.xyz[1],decodesObj.xyz[2])));
}

/* Draw Segment */
/* Sample Segment Object: {"py_object": "Segment", "ept": [4, 2, 0], "spt": [2, 2, 0], "props": {"color": [255, 0, 0], "name": "myseg", "weight": 5.0}} */
/* Notes: Linewidth will always render as 1 on windows machines */
function drawSegment(decodesObj) {
	var segGeom = new THREE.Geometry();
	segGeom.vertices.push(convert(new THREE.Vector3(decodesObj.spt[0], decodesObj.spt[1], decodesObj.spt[2]))); //start point
	segGeom.vertices.push(convert(new THREE.Vector3(decodesObj.ept[0], decodesObj.ept[1], decodesObj.ept[2]))); //end point
	var segMat = new THREE.LineBasicMaterial({color:BLACK, linewidth:1}); //default
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			segMat.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
		if (decodesObj.props.hasOwnProperty('weight')){
			segMat.linewidth = decodesObj.props.weight;
		}
	}
	scene.add(new THREE.Line(segGeom, segMat));
	segGeom.computeBoundingBox();
	updateExtents(segGeom.boundingBox);
}

/* Draw Vec */
/* Sample Vec Object: {"py_object": "Vec", "xyz": [2, 3, 0], "props": {"color": [255, 0, 0], "weight": 1.5}} */
/* Notes: Linewidth will always render as 1 on windows machines */
function drawVec(decodesObj) {
	var vecGeom = new THREE.Geometry();
	vecGeom.vertices.push(convert(new THREE.Vector3(0,0,0))); //start point
	vecGeom.vertices.push(convert(new THREE.Vector3(decodesObj.xyz[0], decodesObj.xyz[1], decodesObj.xyz[2]))); //end point
	var vecMat = new THREE.LineBasicMaterial({color:BLACK, linewidth:1}); //default
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			vecMat.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
		if (decodesObj.props.hasOwnProperty('weight')){
			vecMat.linewidth = decodesObj.props.weight;
		}
	}
	scene.add(new THREE.Line(vecGeom, vecMat));
	vecGeom.computeBoundingBox();
	updateExtents(vecGeom.boundingBox);
}

/* Draw Ray */
/* Sample Ray Object: {"py_object": "Ray", "pt": [2, 3, 0], "vec": [5, 6, 3], "props": {"color": [255, 0, 0], "weight": 1.5}} */
/* Notes: Linewidth will always render as 1 on windows machines */
function drawRay(decodesObj) {
	var rayGeom = new THREE.Geometry();
	var ptX = INFINITE*(decodesObj.vec[0] - decodesObj.pt[0]) + decodesObj.pt[0];
	var	ptY = INFINITE*(decodesObj.vec[1] - decodesObj.pt[1]) + decodesObj.pt[1];
	var	ptZ = INFINITE*(decodesObj.vec[2] - decodesObj.pt[2]) + decodesObj.pt[2];						
	rayGeom.vertices.push(convert(new THREE.Vector3(decodesObj.pt[0], decodesObj.pt[1], decodesObj.pt[2])));
	rayGeom.vertices.push(convert(new THREE.Vector3(ptX, ptY, ptZ)));
	var rayMat = new THREE.LineBasicMaterial({color:BLACK, linewidth:1}); //default
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			rayMat.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
		if (decodesObj.props.hasOwnProperty('weight')){
			rayMat.linewidth = decodesObj.props.weight;
		}
	}
	scene.add(new THREE.Line(rayGeom, rayMat));
	updateExtentsPoint(convert(new THREE.Vector3(decodesObj.pt[0], decodesObj.pt[1], decodesObj.pt[2])));
}

/* Draw Line */
/* Sample Line Object: {"py_object": "Line", "pt": [2, 3, 0], "vec": [5, 6, 3], "props": {"color": [255, 0, 0], "weight": 1.5}} */
/* Notes: Linewidth will always render as 1 on windows machines */
function drawLine(decodesObj) {
	var lineGeom = new THREE.Geometry();
	var ptX = INFINITE*(decodesObj.vec[0] - decodesObj.pt[0]) + decodesObj.pt[0];
	var	ptY = INFINITE*(decodesObj.vec[1] - decodesObj.pt[1]) + decodesObj.pt[1];
	var	ptZ = INFINITE*(decodesObj.vec[2] - decodesObj.pt[2]) + decodesObj.pt[2];	
	var ptX2 = ptX*-1, ptY2 = ptY*-1, ptZ2 = ptZ*-1;
	lineGeom.vertices.push(convert(new THREE.Vector3(decodesObj.pt[0], decodesObj.pt[1], decodesObj.pt[2])));
	lineGeom.vertices.push(convert(new THREE.Vector3(ptX, ptY, ptZ)));
	lineGeom.vertices.push(convert(new THREE.Vector3(ptX2, ptY2, ptZ2)));
	var lineMat = new THREE.LineBasicMaterial({color:BLACK, linewidth:1}); //default
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			lineMat.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
		if (decodesObj.props.hasOwnProperty('weight')){
			lineMat.linewidth = decodesObj.props.weight;
		}
	}
	scene.add(new THREE.Line(lineGeom, lineMat));
	updateExtentsPoint(convert(new THREE.Vector3(decodesObj.pt[0], decodesObj.pt[1], decodesObj.pt[2])));
}

/* Draw PLine */
/* Sample PLine Object: {"py_object": "PLine", "pts": [[20.0, 20.0, 20.0], [20.0, 40.0, 20.0], [40.0, 40.0, 20.0]], "props": {"color": [255, 0, 0], "weight": 1.5}} */
/* Notes: Linewidth will always render as 1 on windows machines.*/
function drawPLine(decodesObj) {
	var plineGeom = new THREE.Geometry();
	for (var i = 0; i < decodesObj.pts.length; i++){
		plineGeom.vertices.push(convert(new THREE.Vector3(decodesObj.pts[i][0],decodesObj.pts[i][1],decodesObj.pts[i][2])));
	}
	var plineMat = new THREE.LineBasicMaterial({color:BLACK, linewidth:1}); //default
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			plineMat.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
		if (decodesObj.props.hasOwnProperty('weight')){
			plineMat.linewidth = decodesObj.props.weight;
		}
	}
	scene.add(new THREE.Line(plineGeom, plineMat));
	plineGeom.computeBoundingBox();
	updateExtents(plineGeom.boundingBox);
}

/* Draw Arc */
/* Sample Arc Object: {"py_object": "Arc", "rad": 2.5, "cs": [0, 1, 2, 0.0, 0.0, 1.0, 0.0, -1.0, 0.0], "angle": 1.0471975511965976} */
/* Notes: Linewidth will always render as 1 on windows machines */
function drawArc(decodesObj) {
	var arcGeom = new THREE.CircleGeometry(decodesObj.rad,SEGMENTS,0,decodesObj.angle);
	// Remove center vertex
	arcGeom.vertices.shift();
	var arcMat = new THREE.LineBasicMaterial({color:BLACK, linewidth:1}); //default
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			arcMat.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
		if (decodesObj.props.hasOwnProperty('weight')){
			arcMat.linewidth = decodesObj.props.weight;
		}
	}
	arc = new THREE.Line(arcGeom, arcMat);
	var position = convert(new THREE.Vector3(decodesObj.cs[0],decodesObj.cs[1],decodesObj.cs[2]));
	var xAxis = convert(new THREE.Vector3(decodesObj.cs[3], decodesObj.cs[4], decodesObj.cs[5]));
	var yAxis = convert(new THREE.Vector3(decodesObj.cs[6], decodesObj.cs[7], decodesObj.cs[8]));
	var zAxis = new THREE.Vector3();
	zAxis.crossVectors(xAxis,yAxis);
	zAxis.normalize();
	position.add(zAxis);
	arc.lookAt(zAxis);
	scene.add(arc);
	arc.geometry.computeBoundingBox();
	updateExtents(arc.geometry.boundingBox);
}

/* Draw PGon */
/* Sample PGon Object: {"py_object": "PLine", "pts": [[2, 3, 0],[5, 6, 1],[5, 3, 2]], "props": {"color": [255, 0, 0]} */
/* Notes: If order of vertices is incorrect it will draw incorrectly */
/* Notes: Same function to draw RGon */
function drawPGon(decodesObj) {
	var pgonGeom = new THREE.Geometry(); // shape
	for (var i = 0; i < decodesObj.pts.length; i++){
		pgonGeom.vertices.push(convert(new THREE.Vector3(decodesObj.pts[i][0],decodesObj.pts[i][1],decodesObj.pts[i][2])));
	}
	for (var i = 1; i < pgonGeom.vertices.length-1; i++){
		pgonGeom.faces.push(new THREE.Face3(0,i,i+1)); //triangulate polygon faces
	}
	var pgonMatLine = new THREE.MeshBasicMaterial({color:BLACK, wireframe:true}); //default outline
	var pgonMatFill = new THREE.MeshBasicMaterial({color:DEFAULT_COLOR, side: THREE.DoubleSide}); //default fill
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			pgonMatLine.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
		if (decodesObj.props.hasOwnProperty('weight')){
			pgonMatLine.wireframeLinewidth = decodesObj.props.weight;
		}
		if (decodesObj.props.hasOwnProperty('fill')){
			pgonMatFill.color = new THREE.Color('rgb('+decodesObj.props.fill+')');
		}
	}
	scene.add(new THREE.Mesh(pgonGeom, pgonMatLine)); //outline
	scene.add(new THREE.Mesh(pgonGeom, pgonMatFill)); //fill
	pgonGeom.computeBoundingBox();
	updateExtents(pgonGeom.boundingBox);
}

/* Draw Circle */
/* {"py_object": "Circle", "rad": 10, "center": [0, 0, 0], "plane": [0, 0, 0, 0.7071067811865475, 0.7071067811865475, 0.0]} */
/* Notes: Fix drawing outline of circle by drawing arcs instead of wireframe of mesh */
function drawCircle(decodesObj) {
	var circleGeomLine = new THREE.CircleGeometry(decodesObj.rad,SEGMENTS);
	var circleGeomFill = new THREE.CircleGeometry(decodesObj.rad,SEGMENTS);
	// Remove center vertex
	circleGeomLine.vertices.shift();
	var circleMatLine = new THREE.LineBasicMaterial({color:BLACK}); //default outline
	var circleMatFill = new THREE.MeshBasicMaterial({color:DEFAULT_COLOR, side: THREE.DoubleSide}); //default fill
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			circleMatLine.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
		if (decodesObj.props.hasOwnProperty('weight')){
			circleMatLine.linewidth = decodesObj.props.weight;
		}
		if (decodesObj.props.hasOwnProperty('fill')){
			circleMatFill.color = new THREE.Color('rgb('+decodesObj.props.fill+')');
		}
	}
	var circleLine = new THREE.Line(circleGeomLine, circleMatLine); //outline
	var circleFill = new THREE.Mesh(circleGeomFill, circleMatFill); //fill
	var position = convert(new THREE.Vector3(decodesObj.plane[0],decodesObj.plane[1],decodesObj.plane[2]));
	var normal = convert(new THREE.Vector3(decodesObj.plane[3],decodesObj.plane[4],decodesObj.plane[5]));
	position.add(normal);
	circleLine.lookAt(position);
	circleFill.lookAt(position);
	scene.add(circleLine);
	scene.add(circleFill);
	circleLine.geometry.computeBoundingBox();
	updateExtents(circleLine.geometry.boundingBox);
}

/* Draw Plane */
/* Sample Plane Object: {"py_object": "Plane", "center": [3, 3, 0], "normal": [0.7071067811865475, 0.7071067811865475, 0.0]} */
/* Notes: In ThreeJS the default normal for a plane is (0,0,1), i.e positive z axis, which is pointing outwards from the screen */
function drawPlane(decodesObj) {
	var planeGeom = new THREE.PlaneGeometry(INFINITE,INFINITE);
	var planeMat = new THREE.MeshBasicMaterial({color:'rgb(100,100,100)', side:THREE.DoubleSide}); //default
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			planeMat.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
	}
	var plane = new THREE.Mesh(planeGeom, planeMat);
	plane.position.set(decodesObj.center[0],decodesObj.center[2],-decodesObj.center[1]);
	var position = plane.position.clone();
	var normal = convert(new THREE.Vector3(decodesObj.normal[0],decodesObj.normal[1],decodesObj.normal[2]));
	position.add(normal);
	plane.lookAt(position);
	scene.add(plane);
	updateExtentsPoint(convert(new THREE.Vector3(decodesObj.center[0],decodesObj.center[1],decodesObj.center[2])));
}


/* Draw CS */
/* Sample CS Object: {"py_object": "CS", "origin": [3, 0, 3], "x_axis": [0.0, 0.0, 1.0], "y_axis": [-1.0, 0.0, 0.0]} */
function drawCS(decodesObj) {
	var origin = convert(new THREE.Vector3(decodesObj.origin[0], decodesObj.origin[1], decodesObj.origin[2]));
	var xAxis = convert(new THREE.Vector3(decodesObj.x_axis[0], decodesObj.x_axis[1], decodesObj.x_axis[2]));
	var yAxis = convert(new THREE.Vector3(decodesObj.y_axis[0], decodesObj.y_axis[1], decodesObj.y_axis[2]));
	var zAxis = new THREE.Vector3();
	zAxis.crossVectors(xAxis,yAxis);
	zAxis.normalize();
	xAxis.add(origin);
	yAxis.add(origin);
	zAxis.add(origin);
	
	//Show X-Axis - Red
	var xGeom = new THREE.Geometry();
	xGeom.vertices.push(origin);
	xGeom.vertices.push(xAxis);
	var xMat = new THREE.LineBasicMaterial({color: "rgb(255,0,0)"});
	scene.add(new THREE.Line(xGeom, xMat));
	
	//Show Y-Axis - Green
	var yGeom = new THREE.Geometry();
	yGeom.vertices.push(origin);
	yGeom.vertices.push(yAxis);
	var yMat = new THREE.LineBasicMaterial({color: "rgb(0,255,0)"});
	scene.add(new THREE.Line(yGeom, yMat));
	
	//Show Z-Axis - Green
	var zGeom = new THREE.Geometry();
	zGeom.vertices.push(origin);
	zGeom.vertices.push(zAxis);
	var zMat = new THREE.LineBasicMaterial({color: "rgb(0,0,255)"});
	scene.add(new THREE.Line(zGeom, zMat));
				
	//Show Origin - Black Sphere
	var originGeom = new THREE.SphereGeometry( 0.05, 16, 16 );
	var originMat = new THREE.MeshBasicMaterial({color: BLACK});
	var originMarker = new THREE.Mesh(originGeom, originMat);
	originMarker.position.set(origin.x,origin.y,origin.z)
	scene.add(originMarker);
	updateExtentsPoint(convert(new THREE.Vector3(decodesObj.origin[0], decodesObj.origin[1], decodesObj.origin[2])));
}

/* Draw Mesh */
/* Sample Mesh Object: {"py_object": "Mesh", "pts": [[0.0, 0.0, 0.0], [0.9510565, 0.0, 0.0], [0.688191, 1.3763819, 0.0], [0.5257311, 0.688191, 0.5]], "faces": [[0, 1, 2], [0, 2, 3], [2, 3, 0], [3, 0, 1]]} */
function drawMesh(decodesObj) {
	var meshGeom = new THREE.Geometry();
	for (var i = 0; i < decodesObj.pts.length; i++){
		meshGeom.vertices.push(convert(new THREE.Vector3(decodesObj.pts[i][0],decodesObj.pts[i][1],decodesObj.pts[i][2])));
	}
	for (var i = 0; i < decodesObj.faces.length; i++){
		meshGeom.faces.push(new THREE.Face3(decodesObj.faces[i][0],decodesObj.faces[i][1],decodesObj.faces[i][2]));
	}
	var meshMatLine = new THREE.MeshBasicMaterial({color:BLACK, wireframe:true}); //default outline
	var meshMatFill = new THREE.MeshBasicMaterial({color:DEFAULT_COLOR, side: THREE.DoubleSide}); //default fill
	if (decodesObj.hasOwnProperty('props')) {
		if (decodesObj.props.hasOwnProperty('color')){
			meshMatLine.color = new THREE.Color('rgb('+decodesObj.props.color+')');
		}
		if (decodesObj.props.hasOwnProperty('weight')){
			meshnMatLine.wireframeLinewidth = decodesObj.props.weight;
		}
		if (decodesObj.props.hasOwnProperty('fill')){
			meshMatFill.color = new THREE.Color('rgb('+decodesObj.props.fill+')');
		}
	}
	scene.add(new THREE.Mesh(meshGeom, meshMatLine)); //outline
	scene.add(new THREE.Mesh(meshGeom, meshMatFill)); //fill
	meshGeom.computeBoundingBox();
	updateExtents(meshGeom.boundingBox);
}

/* Convert*/
/* Description: Helper function to convert coordinates from cad convention where z is up to screen convention where z is toward you */
function convert(vec){
	return new THREE.Vector3(vec.x,vec.z,-vec.y);
}

/* Update Extents */
/* Description: Helper function to update the extents of all drawn geometry in the project */
function updateExtents(bb){
	if (typeof minX === "undefined" || minX > bb.min.x){
		minX = bb.min.x;
	}
	if (typeof minY === "undefined" || minY > bb.min.y){
		minY = bb.min.y;
	} 
	if (typeof minZ === "undefined" || minZ > bb.min.z){
		minZ = bb.min.z;
	} 
	if (typeof maxX === "undefined" || maxX < bb.max.x){
		maxX = bb.max.x;
	} 
	if (typeof maxY === "undefined" || maxY < bb.max.y){
		maxY = bb.max.y;
	} 
	if (typeof maxZ === "undefined" || maxZ < bb.max.z){
		maxZ = bb.max.z;
	} 	
}

/* Update Extents Point */
/* Description: Helper function to update the extents of geometry that does not have extents (e.g. point, ray) */
function updateExtentsPoint(vec){
	if (typeof minX === "undefined" || minX > vec.x){
		minX = vec.x;
	}
	if (typeof minY === "undefined" || minY > vec.y){
		minY = vec.y;
	}
	if (typeof minZ === "undefined" || minZ > vec.z){
		minZ = vec.z;
	}
	if (typeof maxX === "undefined" || maxX < vec.x){
		maxX = vec.x;
	}
	if (typeof maxY === "undefined" || maxY < vec.y){
		maxY = vec.y;
	}
	if (typeof maxZ === "undefined" || maxZ < vec.z){
		maxZ = vec.z;
	}
}






