import sketch from 'sketch';
import simplify from 'simplify-js';

export default function () {
  const document = sketch.getSelectedDocument();
  const selectedLayers = document?.selectedLayers;
  if (!selectedLayers) return;

  let prevPointCount = 0;
  let newPointCount = 0;

  const getLayerOffset = (layer, coord) => {
    const parent = layer.parent;
    if (parent && parent.type !== 'Document') {
      return layer.frame[coord] + getLayerOffset(parent, coord);
    }
    return layer.frame[coord];
  };

  const smoothPath = (threshold) => (layer) => {
    prevPointCount += layer.points.length;
    const points = layer.points.map((point) => {
      return {
        x: point.point.x * layer.frame.width,
        y: point.point.y * layer.frame.height,
      };
    });

    const result = simplify(points, parseInt(threshold, 10), true);
    newPointCount += result.length;
    const straight = sketch.ShapePath.PointType.Straight;
    layer.points = result.map((raw) => {
      const point = {
        x: raw.x / layer.frame.width,
        y: raw.y / layer.frame.height,
      };
      return {
        type: 'CurvePoint',
        pointType: straight,
        cornerRadius: 0,
        curveFrom: point,
        curveTo: point,
        point,
      };
    });
  };

  const smoothLayers = (threshold) => (layer) => {
    const smooth = smoothPath(threshold);
    if (layer.layers) {
      layer.layers.forEach(smooth);
    } else {
      smooth(layer);
    }
  };

  const countPoints = (layers) => {
    return layers.reduce((total, layer) => {
      if (layer.layers) {
        return total + countPoints(layer.layers);
      }
      return total + layer.points.length;
    }, 0);
  };

  if (selectedLayers.length === 0) {
    sketch.UI.alert(
      'No layers selected!',
      'You must select at least one layer.',
    );
  } else {
    sketch.UI.getInputFromUser(
      'Choose a Threshold',
      {
        description: 'Between 1 and 5.',
        initialValue: '1',
      },
      (err, value) => {
        if (err) {
          // most likely the user canceled the input
          return;
        }
        selectedLayers.forEach(smoothLayers(value));
        sketch.UI.message(
          `Reduced ${prevPointCount} to ${newPointCount} points.`,
        );
      },
    );
  }
}
