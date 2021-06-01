import sketch from 'sketch';

export default function () {
  const document = sketch.getSelectedDocument();
  const selectedLayers = document?.selectedLayers;
  if (!selectedLayers) return;

  const getLayerOffset = (layer, coord) => {
    const parent = layer.parent;
    if (parent && parent.type !== 'Document') {
      return layer.frame[coord] + getLayerOffset(parent, coord);
    }
    return layer.frame[coord];
  };

  const roundPath = (layer) => {
    layer.points.forEach((point) => {
      const xInFrame = point.point.x * layer.frame.width;
      const xOffset = getLayerOffset(layer, 'x');
      const xOld = xInFrame + xOffset;
      const xNew = Math.round(xOld);
      const xInFrameNew = xNew - xOffset;
      const x = xInFrameNew / layer.frame.width;

      const yInFrame = point.point.y * layer.frame.height;
      const yOffset = getLayerOffset(layer, 'y');
      const yOld = yInFrame + yOffset;
      const yNew = Math.round(yOld);
      const yInFrameNew = yNew - yOffset;
      const y = yInFrameNew / layer.frame.height;

      point.point.x = x;
      point.point.y = y;
    });
  };

  const roundLayer = (layer) => {
    if (layer.layers) {
      layer.layers.forEach(roundLayer);
    } else {
      roundPath(layer);
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

  const showPointWarning = (count) => {
    const dialog = NSAlert.alloc().init();
    dialog.setMessageText('That’s a lot of points!');
    dialog.setInformativeText(
      `You’re about to process ${count} points. This might take quite a while. Are you sure you want to proceed?`,
    );
    dialog.addButtonWithTitle('Proceed');
    dialog.addButtonWithTitle('Cancel');
    return dialog.runModal();
  };

  if (selectedLayers.length === 0) {
    sketch.UI.alert(
      'No layers selected!',
      'You must select at least one layer.',
    );
  } else {
    const pointCount = countPoints(selectedLayers);
    if (pointCount > 1000) {
      const responseCode = showPointWarning(pointCount);
      if (responseCode !== NSAlertFirstButtonReturn) {
        return;
      }
    }

    selectedLayers.forEach(roundLayer);
    sketch.UI.alert('Done!', `${pointCount} points aligned.`);
  }
}
