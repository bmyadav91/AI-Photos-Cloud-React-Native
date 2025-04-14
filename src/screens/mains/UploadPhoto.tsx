import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { apiRequest } from "../../../src/services/MainAPI";
import { showToast } from '../../utils/toast';

interface FileItem {
  id: string;
  name: string;
  extension: string;
  size: string;
  status: string;
  isSuccess?: boolean;
}

export default function UploadScreen() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDataBaseFull, setIsDataBaseFull] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        const response = await apiRequest({ API: '/upload', METHOD: 'GET' });
        if (response.success && response.max_photos_reached) {
          setIsDataBaseFull(response.max_photos_reached);
          showToast('Database is full, Please contact us to increase the limit.', 'info'); 
        }
      } catch (error: any) {
        showToast(error.message || 'An error occurred', 'error');
      }
    };

    checkDatabaseStatus();
  }, []);

  const MAX_FILES = 50;
  const MAX_SIZE_MB = 20;

  const fileValidation = (fileSize: number, fileType: string) => {
    const sizeInMB = fileSize / (1024 * 1024);
    if (sizeInMB > MAX_SIZE_MB) {
      showToast(`Max size should be ${MAX_SIZE_MB}MB.`, "error");
      return false;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      showToast('Only JPG, JPEG, PNG, and WEBP files are allowed.', "error");
      return false;
    }
    return true;
  };

  const generateElementId = (fileName: string) => {
    let validId = fileName.trim().replace(/[^a-zA-Z0-9_\u00C0-\uFFFF-]+/g, '-');
    if (/^\d/.test(validId)) {
      validId = `id-${validId}`;
    }
    validId = validId.replace(/-+/g, '-').replace(/-$/, '');
    return validId || Math.floor(Math.random() * 1000000).toString();
  };

  const handleImagePick = async () => {
    // Request permission first
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API level 33+), we need READ_MEDIA_IMAGES
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: "Photo Permission",
              message: "App needs access to your photos to upload them.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            showToast("You need to enable permission to access your photos", "error");
            return;
          }
        } 
        // For Android 10-12 (API level 29-32), we need READ_EXTERNAL_STORAGE
        else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: "Photo Permission",
              message: "App needs access to your photos to upload them.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            showToast("You need to enable permission to access your photos", "error");
            return;
          }
        }
      } catch (err) {
        console.warn(err);
        showToast("Permission request failed", "error");
        return;
      }
    }

    if (isDataBaseFull) {
      showToast('Database is full. Please contact us to increase the limit.', "error");
      return;
    }

    if (files.length >= MAX_FILES) {
      showToast(`You can only upload up to ${MAX_FILES} files at once.`, "error");
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: MAX_FILES - files.length,
        quality: 1,
      });

      if (result.didCancel) {
        return;
      }

      if (result.assets) {
        for (const asset of result.assets) {
          const isValid = fileValidation(asset.fileSize || 0, asset.type || '');
          if (!isValid) continue;

          const fileName = asset.fileName || 'image';
          const fileId = generateElementId(fileName);
          const extension = fileName.split('.').pop()?.toUpperCase() || 'IMG';
          const fileSize = `${((asset.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB`;

          setFiles(prev => [...prev, {
            id: fileId,
            name: fileName,
            extension,
            size: fileSize,
            status: 'Uploading...'
          }]);

          await uploadFile(asset.uri || '', fileId);
        }
      }
    } catch (error) {
      showToast('Error picking image', "error");
    }
  };

  const uploadFile = async (uri: string, fileId: string) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      const fileName = uri.split('/').pop() || 'image';
      const mimeType = fileName.split('.').pop()?.toLowerCase() || 'jpeg';
      formData.append('file', {
        uri,
        type: `image/${mimeType}`,
        name: fileName,
      } as any);

      const response = await apiRequest({
        API: '/upload',
        DATA: formData,
        METHOD: 'POST',
        FORM_DATA: true
      });

      if (response.success) {
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: 'Uploaded', isSuccess: true } : f
        ));
        showToast('File uploaded successfully!', "success");
      } else {
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: 'Failed', isSuccess: false } : f
        ));
        showToast('Upload failed', "error");
      }
    } catch (error: any) {
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'Failed', isSuccess: false } : f
      ));
      showToast(error.message || 'Upload failed', "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.accordion}>
          <View style={styles.accordionHeader}>
            <Text style={styles.title}>Upload Photo</Text>
          </View>

          <View style={styles.accordionContent}>
            {isDataBaseFull && (
              <View style={styles.warningBar}>
                <Text style={styles.warningText}>
                  You have reached your maximum photo limit. Please contact us to increase the limit.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.uploadArea, isDataBaseFull && styles.disabled]}
              onPress={handleImagePick}
              disabled={isDataBaseFull || isUploading}
            >
              <Text style={styles.uploadText}>
                Tap here to select images
              </Text>
              {isUploading && <ActivityIndicator style={styles.loader} />}
            </TouchableOpacity>

            <View style={styles.uploadStatusContainer}>
              {files.map(file => (
                <View key={file.id} style={styles.fileItem}>
                  <View style={styles.fileIcon}>
                    <Text style={styles.fileIconText}>{file.extension}</Text>
                  </View>
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{file.name}</Text>
                    <Text style={styles.fileStatus}>
                      {file.size} • {file.status}
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[
                        styles.progress,
                        file.isSuccess && styles.successProgress
                      ]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomStatic}>
        <Text style={styles.bottomText}>
          Note: Uploading image will take some time to appear in the gallery
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  accordion: {
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  accordionHeader: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1.5,
    borderBottomColor: '#b0eeff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  accordionContent: {
    padding: 10,
  },
  warningBar: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  warningText: {
    color: '#856404',
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  uploadText: {
    color: '#777',
    fontSize: 16,
  },
  loader: {
    marginTop: 10,
  },
  uploadStatusContainer: {
    marginTop: 10,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 10,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#7289DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileIconText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 10,
  },
  fileName: {
    fontWeight: '500',
  },
  fileStatus: {
    fontSize: 12,
    color: 'gray',
  },
  progressBar: {
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
    marginTop: 5,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  successProgress: {
    backgroundColor: '#4CAF50',
  },
  bottomStatic: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bottomText: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 12,
  },
}); 