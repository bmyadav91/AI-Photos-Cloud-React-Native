import { PermissionsAndroid, Platform } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import { showToast } from '../utils/toast';

const DownloadToGallery = async (photoUrl: string) => {
  try {
    if (Platform.OS === 'android') {
      const permission = Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

      const granted = await PermissionsAndroid.request(permission);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        showToast('Permission denied', 'error');
        return;
      }
    }

    const filename = `photo_${Date.now()}.jpg`;
    const localPath = `${RNFS.CachesDirectoryPath}/${filename}`;

    const res = await RNFS.downloadFile({
      fromUrl: photoUrl,
      toFile: localPath,
    }).promise;

    if (res.statusCode === 200) {
      await CameraRoll.saveAsset(localPath);
      showToast('Downloaded to gallery!', 'success');
    } else {
      showToast('Download failed', 'error');
    }
  } catch (error) {
    console.error('Download error:', error);
    showToast('Failed to download', 'error');
  }
};

export default DownloadToGallery;