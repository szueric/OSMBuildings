
var SkyDome = {};

(function() {

  var shader;

  var vertices = [];
  var texCoords = [];

  var tris;

  var vertexBuffer;
  var texCoordBuffer;
  var texture;
  var textureIsLoaded;

  SkyDome.initShader = function() {
    var url = 'skydome.jpg';

    tris = { vertices: [], texCoords: [] };
    Triangulate.dome(tris, [0, 0], Renderer.fogRadius, 0, Renderer.fogRadius/2);

    shader = new glx.Shader({
      vertexShader: SHADERS.skydome.vertex,
      fragmentShader: SHADERS.skydome.fragment,
      attributes: ["aPosition", "aTexCoord"],
      uniforms: ["uMatrix", "uTileImage", "uFogColor"]
    });

    vertexBuffer = new glx.Buffer(3, new Float32Array(tris.vertices));
    texCoordBuffer = new glx.Buffer(2, new Float32Array(tris.texCoords));
    texture = new glx.Texture();

    Activity.setBusy();
    texture.load(url, function(image) {
      Activity.setIdle();
      if (image) {
        textureIsLoaded = true;
      }
    });

    return this;
  };

  SkyDome.render = function(vpMatrix) {
    if (!textureIsLoaded) {
      return;
    }

    shader.enable();

    GL.uniform3fv(shader.uniforms.uFogColor, [Renderer.backgroundColor.r, Renderer.backgroundColor.g, Renderer.backgroundColor.b]);

    var mMatrix = new glx.Matrix();
    var inMeters = TILE_SIZE / (Math.cos(Map.position.latitude*Math.PI/180) * EARTH_CIRCUMFERENCE);
    var scale = Math.pow(2, 16) * inMeters;
    mMatrix.scale(scale, scale, scale);

    var mvp = glx.Matrix.multiply(mMatrix, vpMatrix);
    GL.uniformMatrix4fv(shader.uniforms.uMatrix, false, mvp);

    vertexBuffer.enable();
    GL.vertexAttribPointer(shader.attributes.aPosition, vertexBuffer.itemSize, GL.FLOAT, false, 0, 0);

    texCoordBuffer.enable();
    GL.vertexAttribPointer(shader.attributes.aTexCoord, texCoordBuffer.itemSize, GL.FLOAT, false, 0, 0);

    texture.enable(0);
    GL.uniform1i(shader.uniforms.uTileImage, 0);

    GL.drawArrays(GL.TRIANGLES, 0, vertexBuffer.numItems);

    shader.disable();
  };

}());
