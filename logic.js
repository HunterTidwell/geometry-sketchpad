const debug = false;

const element_id = "body";

function log(msg) {
	if (debug) {
		console.log(msg);
	}
}

const tau = 2 * Math.PI;

//todo: account for offset in render. two eyes crossed, where do the screens need to be?
//todo: correctly project points from behind the viewer.
//todo: implement mousedrag manipulation.

///////////////////////////////////////////////////////////////////////////////

function begin() {
	const width = 1000;
	const height = 500;

	const element = document.getElementById(element_id);

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	element.appendChild(canvas);

	function btn(func, name) {
		b = document.createElement("button");
		b.onclick = func;
		b.innerHTML = name;
		element.appendChild(b);
	}

	update = make_stuff(View(canvas), width, height);
	timer = 'paused'
	timer = window.setInterval(update, 10);
	//update();
	function pause() {
		if (timer == 'paused') {
			timer = window.setInterval(update, 10);
		} else {
			window.clearInterval(timer);
			timer = 'paused';
		}
	}
	btn(pause, 'Halt and catch fire');
}

// entry point
window.onload = begin;

///////////////////////////////////////////////////////////////////////////////

function make_stuff(v, w, h) {
	center = [w/2, h/2, 0];
	center3 = Vector3(center[0], center[1], center[2]);
	cube_side = w/4;
	//points = cube_points(loc, cube_side);
	//lines = cube_lines(center, cube_side);
	faces = cube_faces(Vector3(center[0], center[1], center[2]), cube_side);
	axis = [1, 1, 1];
	angle = tau * 1 / 5 / 100;
	meta_axis = [1, 1, 0];
	meta_angle = tau * 1 / 24 / 100;

	screen_tl = [0, 0, 0];
	screen_x = [w, 0, 0];
	screen_y = [0, h, 0];
	eye1 = [w/2 + 2*w/10, h/2, 2*w];
	eye2 = [w/2 - 2*w/10, h/2, 2*w];
	screen_dims = [w, h];
	perspective1 = create_projection(screen_tl, screen_x, screen_y, eye1, screen_dims);
	perspective2 = create_projection(screen_tl, screen_x, screen_y, eye2, screen_dims);
	function rotate_cube(c, ax, an) {
		// lines = lines.map((l) => {
		// 	return l.map((p) => {
		// 		dumb = rotate(p.tuple(), c, ax, an);
		// 		return Vector3(dumb[0], dumb[1], dumb[2]);
		// 	})
		// })
		faces = faces.map((f) => {
			return f.map((p) => {
				dumb = rotate(p.tuple(), c, ax, an);
				return Vector3(dumb[0], dumb[1], dumb[2]);
			})
		})
	}

	//rotate_cube(center, [1, 0, 0], tau/8);
	//rotate_cube(center, [0, 1, 0], Math.asin(1 / Math.sqrt(3)));

	function render() {
		v.clear();

		color1 = '#8bb8bb';
		thickness = 2;
		color2 = 'black';
		mirrored = false;

		offset = Vector2(w/2, 0);

		v.draw_line(Vector2(w/2, 0), Vector2(w/2, h), 'black', 1);
		
		// lines.forEach((l) => {
		// 	v.draw_line(perspective(l[0])[0], perspective(l[1])[0], color, 1);
		// })
		newfaces = [];
		faces.forEach((f) => {
			furthest_d = 0;
			newf = [];
			f.forEach((p) => {
				[newp, d] = perspective1(p);
				log("d" + d)
				newf.push(newp.minus(offset.times(0.5)));
				if (d > furthest_d) {
					furthest_d = d;
				}
			})
			newf.dist = furthest_d;
			newfaces.push(newf);
		})

		newfaces.sort((f1, f2) => {
			return f2.dist - f1.dist;
		})

		// newfaces = newfaces.map((f) => {
		// 	return [f[0], f[1], f[2], f[3]];
		// })

		newfaces.forEach((f) => {
			log(f.dist)
			v.draw_polygon(f, color1, thickness, color2);
			//log ('drawing something around ' + f[0].x + "," + f[0].y)
		})

		////////////////////////////////////////////////////////////////

		newfaces = [];
		faces.forEach((f) => {
			furthest_d = 0;
			newf = [];
			f.forEach((p) => {
				[newp, d] = perspective2(p);
				if (mirrored) {
					newp = Vector2(center[0] * 2 - newp.x, newp.y);
				}
				newp = newp.plus(offset.times(0.5));
				newf.push(newp);
				if (d > furthest_d) {
					furthest_d = d;
				}
				newf.dist = furthest_d;
			})
			newfaces.push(newf);
		})

		newfaces.sort((f1, f2) => {
			return f2.dist - f1.dist;
		})

		// newfaces = newfaces.map((f) => {
		// 	return [f[0], f[1], f[2], f[3]];
		// })

		newfaces.forEach((f) => {
			v.draw_polygon(f, color1, thickness, color2);
			//log ('drawing something around ' + f[0].x + "," + f[0].y)
		})

	}
	function move() {
		rotate_cube(center, axis, angle);
		rotate_cube(center, meta_axis, meta_angle);
		axis = rotate(axis, [0, 0, 0], meta_axis, meta_angle);
	}
	function update() {
		render();
		move();
	}
	return update;
}

function cube_faces(center, side) {
	dims = [Vector3(side * 0.5, 0, 0), Vector3(0, side * 0.5, 0), Vector3(0, 0, side * 0.5)];
	faces = [];
	for (d in dims) {
		faces.push(get_face(d, dims, center, 1));
		faces.push(get_face(d, dims, center, -1));
	}
	return faces;
}

function get_face(d, dims, center, dir) {
	face = [];
	face.push(center.plus(dims[d].times(dir)));
	newface = [];
	for (d2 in dims) {
		if (d != d2) {
			face.forEach((p) => {
				newface.push(p.plus(dims[d2]));
				newface.push(p.minus(dims[d2]));
			})
			face = newface;
			newface = [];
		}
	}
	temp = face[0];
	face[0] = face[1];
	face[1] = temp;
	return face;
}

function create_projection(screen_tl, screen_x, screen_y, eye, screen_dims) {
	screen_tl = Vector3(screen_tl[0], screen_tl[1], screen_tl[2]);
	screen_x = Vector3(screen_x[0], screen_x[1], screen_x[2]);
	screen_y = Vector3(screen_y[0], screen_y[1], screen_y[2]);
	eye = Vector3(eye[0], eye[1], eye[2]);
	screen_perp = screen_x.cross(screen_y).unit();
	//log(screen_perp)
	function project(point) {
		//log("point" + point)
		//p = project_to_plane(point, screen_tl, screen_perp); // wrong projection. need to account for "eye"
		[p, dist] = allign_to_plane(point, eye, screen_tl, screen_perp);
		x = p.minus(screen_tl).dot(screen_x) / screen_x.mag2();
		y = p.minus(screen_tl).dot(screen_y) / screen_y.mag2();
		//log("" + x + ", " + y)
		//log(x + "," + y)
		out = Vector2(x * screen_dims[0], y * screen_dims[1]);
		return [out, dist];
	}
	return project;
}

function allign_to_plane(point, eye, plane_start, plane_perp) {

	// eye.plus(point.minus(eye).times(factor));

	// that minus plane_start dot plane_perp = 0;

	// (i + t(p-i))-p_s . p_p = 0 = i . pp + t(p-i) . pp - ps . pp
	// t(p-i) . pp = (ps - i) . pp
	// t = (ps - i) . pp / (p - i) . pp
	// out = i + (p-i)t = i + (p-i) * (ps - i) . pp / (p - i) . pp

	pmi = point.minus(eye);
	dist2 = pmi.mag2();
	t = plane_start.minus(eye).dot(plane_perp) / pmi.dot(plane_perp);
	out = eye.plus(pmi.times(t));


	// v = point.minus(plane_start);
	// v = v.project(plane_perp);
	// p = point.minus(v);
	// v2 = eye.minus(plane_start);
	// v2 = v2.project(plane_perp);
	// p2 = eye.minus(v2);
	// p_l = v.mag();
	// p2_l = v2.mag();
	// out = p.times(p2_l).plus(p2.times(p_l)).times(1 / (p_l + p2_l));
	// dist2 = point.minus(eye).mag2();

	return [out, dist2];
}

function project_to_plane(point, plane_start, plane_perp) {
	plane_perp = plane_perp.unit();
	v = point.minus(plane_start);
	v = plane_perp.times(v.dot(plane_perp));
	p = point.minus(v);
	return p;
}

function cube_lines(center, side) {
	lines = [];
	bl = Vector3(center[0], center[1], center[2]).minus(Vector3(side/2, side/2, side/2));
	tr = bl.plus(Vector3(side, side, side));
	midpoints = []
	for (d = 0; d < 3; d++) {
		stick = [0, 0, 0];
		stick[d] = side;
		newp = bl.plus(Vector3(stick[0], stick[1], stick[2]))
		lines.push([bl, newp]);
		midpoints.push(newp);
	}
	for (what = 0; what < 3; what++) {
		for (d = 0; d < 3; d++) {
			if (d != what) {
				stick = [0, 0, 0];
				stick[d] = side;
				newp = midpoints[what].plus(Vector3(stick[0], stick[1], stick[2]));
				lines.push([midpoints[what], newp]);
			}
		}
	}
	for (d = 0; d < 3; d++) {
		stick = [0, 0, 0];
		stick[d] = side;
		newp = tr.minus(Vector3(stick[0], stick[1], stick[2]));
		lines.push([tr, newp]);
	}
	return lines;
}

function cube_points(center, side) {
	points = []
	for (i = -1; i < 2; i += 2) {
		for (j = -1; j < 2; j += 2) {
			for (k = -1; k < 2; k += 2) {
				v = Vector3(center[0], center[1], center[2]).plus(Vector3(i, j, k).times(side / 2));
				points.push(v.tuple());
			}
		}
	}
	return points;
}

function rotate(s, c, ax, angle) {
	s = Vector3(s[0], s[1], s[2]);
	c = Vector3(c[0], c[1], c[2]);
	ax = Vector3(ax[0], ax[1], ax[2]).unit();

	to_c = s.minus(c);
	component = to_c.project(ax);
	projected = s.minus(component);
	rel = projected.minus(c);
	if (rel.mag2() < 0.00000005) {
		return s.tuple();
	}

	perp = rel.cross(ax);
	turnt = rel.times(Math.cos(angle)).plus(perp.times(Math.sin(angle)));

	out = turnt.plus(c).plus(component)

	return [out.x, out.y, out.z];
}

function matmult(m1, m2) {
	m3 = [];
	for (i = 0; i < m1.length; i++) {
		m3[i] = [];
		for (j = 0; j < m2.length; j++) {
			m3[i][j] = 0;
			for (k = 0; k < m1[0].length; k++) {
				m3[i][j] += m1[i][k] * m2[k][j];
			}
		}
	}
	return m3;
}

function Vector3from(arry) {
	return Vector3(arry[0], arry[1], arry[2]);
}

///////////////////////////////////////////////////////////////////////////////

function Vector2(x, y) {
	function plus(v) {
		return Vector2(x + v.x, y + v.y);
	}

	function minus(v) {
		return Vector2(x - v.x, y - v.y);
	}

	function times(c) {
		return Vector2(x * c, y * c);
	}

	function dot(v) {
		return x * v.x + y * v.y;
	}

	function mag2() {
		return x*x + y*y;
	}

	function mag() {
		return Math.sqrt(mag2());
	}

	function unit() {
		return times(1 / mag());
	}

	function project(v) {
		return v.times(dot(v) / v.mag2());
	}

	function angle() {
		return Math.atan2(y, x);
	}

	return {x, y, plus, minus, times, dot, mag2, mag, project, unit, angle}
}

function Vector3(x, y, z) {
	function plus(v) {
		return Vector3(x + v.x, y + v.y, z + v.z);
	}

	function minus(v) {
		return Vector3(x - v.x, y - v.y, z - v.z);
	}

	function times(c) {
		return Vector3(x * c, y * c, z * c);
	}

	function dot(v) {
		return x * v.x + y * v.y + z * v.z;
	}

	function mag2() {
		return x*x + y*y + z*z;
	}

	function mag() {
		return Math.sqrt(mag2());
	}

	function unit() {
		return times(1 / mag());
	}

	function project(v) {
		return v.times(dot(v) / v.mag2());
	}

	function cross(v) {
		return Vector3(y * v.z - z * v.y, z * v.x - x * v.z, x * v.y - y * v.x);
	}

	function tuple() {
		return [x, y, z];
	}

	return {x, y, z, plus, minus, times, dot, mag2, mag, project, unit, cross, tuple}
}

function View(canvas) {
	const ctx = canvas.getContext("2d");

	const width = canvas.width;
	const height = canvas.height;

	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	function draw_polygon(points, color, thickness, outline_color) {
		var stroked = false;
		var filled = true;

		if (typeof thickness !== 'undefined') {
			stroked = true;
			filled = false;
		}
		if (typeof outline_color !== 'undefined') {
			filled = true;
		} else {
			outline_color = color;
		}

		ctx.beginPath();
		last = points[points.length - 1];
		ctx.moveTo(last.x, last.y);
		points.forEach((p) => {
			ctx.lineTo(p.x, p.y);
		})

		if (filled) {
			ctx.fillStyle = color;
			ctx.fill();
		}

		if (stroked) {
			ctx.lineWidth = thickness;
			ctx.strokeStyle = outline_color;
			ctx.stroke();
		}
	}

	// defaults: no thick -> filled; no fill -> fill alpha/white
	function draw_circle(center, r, color, thickness, outline_color) {
		var stroked = false;
		var filled = true;

		if (typeof thickness !== 'undefined') {
			stroked = true;
			filled = false;
			r -= thickness;
		}
		if (typeof outline_color !== 'undefined') {
			filled = true;
		} else {
			outline_color = color;
		}

		ctx.beginPath();
		ctx.arc(center.x, center.y, r, 0, 2 * Math.PI);
		ctx.closePath();

		if (filled) {
			ctx.fillStyle = color;
			ctx.fill();
		}
		if (stroked) {
			ctx.lineWidth = thickness;
			ctx.strokeStyle = outline_color;
			ctx.stroke();
		}
	}

	function draw_line(start, end, color, thickness) {
		ctx.beginPath();
		ctx.moveTo(start.x, start.y); // ctx,moveTo(point1[0], point1[1]); 
		ctx.lineTo(end.x, end.y);
		ctx.lineWidth = thickness;
		ctx.strokeStyle = color;
		ctx.stroke();
	}

	function clear() {
		ctx.clearRect(0, 0, width, height);
	}

	return {canvas, width, height, draw_circle, draw_line, draw_polygon, clear}
}

///////////////////////////////////////////////////////////////////////////////



