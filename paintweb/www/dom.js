function fill(ctx, fillColor) {
  if (fillColor != "null") {
    ctx.fillStyle = fillColor
    ctx.fill()
  }
}
class QShapeStyle {
  constructor(lineWidth, lineColor, fillColor) {
    this.lineWidth = lineWidth
    this.lineColor = lineColor
    this.fillColor = fillColor
  }
  clone() {
    return new QShapeStyle(this.lineWidth, this.lineColor, this.fillColor)
  }
}

class QLine {
  constructor(point1, point2, style) {
    this.pt1 = point1
    this.pt2 = point2
    this.style = style
  }

  onpaint(ctx) {
    let style = this.style
    ctx.lineWidth = style.lineWidth
    ctx.strokeStyle = style.lineColor
    ctx.beginPath()
    ctx.moveTo(this.pt1.x, this.pt1.y)
    ctx.lineTo(this.pt2.x, this.pt2.y)
    ctx.stroke()
  }
}

class QRect {
  constructor(r, style) {
    this.x = r.x
    this.y = r.y
    this.width = r.width
    this.height = r.height
    this.style = style
  }

  onpaint(ctx) {
    let style = this.style
    ctx.lineWidth = style.lineWidth
    ctx.strokeStyle = style.lineColor
    ctx.beginPath()
    ctx.rect(this.x, this.y, this.width, this.height)
    fill(ctx, style.fillColor)
    ctx.stroke()
  }
}

class QEllipse {
  constructor(x, y, radiusX, radiusY, style) {
    this.x = x
    this.y = y
    this.radiusX = radiusX
    this.radiusY = radiusY
    this.style = style
  }
  onpaint(ctx) {
    let style = this.style
    ctx.lineWidth = style.lineWidth
    ctx.strokeStyle = style.lineColor
    ctx.beginPath()
    ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, 0, 0, 2 * Math.PI)
    fill(ctx, style.fillColor)
    ctx.stroke()
  }
}

class QPath {
  constructor(points, close, style) {
    this.points = points
    this.clone = close
    this.style = style
  }

  onpaint(ctx) {
    let points = this.points
    let n = points.length
    if (n < 1) {
      return
    }
    let style = this.style
    ctx.lineWidth = style.lineWidth
    ctx.strokeStyle = style.lineColor
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < n; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    if (this.close) {
      ctx.closePath()
    }
    ctx.stroke()
  }
}

class QPaintDoc {
  constructor() {
    this.shapes = []
  }

  addShape(shape) {
    if (shape != null) {
      this.shapes.push(shape)
    }
  }

  onpaint(ctx) {
    let shapes = this.shapes
    for (let i in shapes) {
      shapes[i].onpaint(ctx)
    }
  }
}
