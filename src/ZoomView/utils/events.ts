//From  https://github.com/keske/react-native-easy-gestures.git


export interface TouchEvent {
    nativeEvent: {
        touches: Array<{
            pageX: number;
            pageY: number;
        }>;
    };
}

export interface TransformStyle {
    transform?: Array<{
        rotate?: string;
        scale?: number;
    }>;
}

export const getTouches = (event: TouchEvent) => event.nativeEvent.touches;

export const getAngle = (event: TouchEvent, styles: TransformStyle, diffAngle: number): string => {
  const { transform = [] } = styles;

  const currentAngle = transform.map(style => {
      // Extract the rotation value and convert to a number
      const rotation = style.rotate ? parseFloat(style.rotate) : 0;
      return rotation;
  }).reduce((a, b) => b || a, 0); // This already returns a number

  return `${currentAngle - diffAngle}deg`;
};


export const getScale = (event: TouchEvent, styles: TransformStyle, diffDistance: number): number => {
    const { transform = [] } = styles;

    const currentScale = transform
        .map(style => style.scale || 1)
        .reduce((a, b) => b || a, 1);

    const newScale = currentScale - diffDistance / 400;

    return newScale;
};

export const isMultiTouch = (event: TouchEvent): boolean => {
    const currentTouches = getTouches(event);
    return currentTouches.length > 1;
};

