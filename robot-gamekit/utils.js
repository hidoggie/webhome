class Utils {
  static lerp3D(start, end, amt) {
    return {
      x: Utils.lerp(start.x, end.x, amt),
      y: Utils.lerp(start.y, end.y, amt),
      z: Utils.lerp(start.z, end.z, amt),
    }
  }

  static lerp(start, end, amt) {
    return (1 - amt) * start + amt * end
  }

  static angleDeg(x1, y1, x2, y2) {
    return Math.atan2(y1 - y2, x2 - x1) * 180 / Math.PI
  }

  static getVec3String(v3) {
    return `${v3.x} ${v3.y} ${v3.z}`
  }

  static getRandomVec2(minX, maxX, minY, maxY) {
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
    }
  }
}
export {
  Utils,
}
