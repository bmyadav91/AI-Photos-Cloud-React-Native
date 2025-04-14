import React from 'react';
import ImageViewing from 'react-native-image-viewing';

type ImagePreviewProps = {
  images: { uri: string }[];
  visible: boolean;
  onClose: () => void;
  initialIndex?: number;
};

const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  visible,
  onClose,
  initialIndex = 0,
}) => {
  return (
    <ImageViewing
      images={images}
      imageIndex={initialIndex}
      visible={visible}
      onRequestClose={onClose}
    />
  );
};

export default ImagePreview;
