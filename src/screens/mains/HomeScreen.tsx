import React, { useEffect, useState, useCallback, useRef, Suspense, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Dimensions, RefreshControl } from 'react-native';
import { apiRequest } from "../../../src/services/MainAPI";
import { getIconSource } from '../../utils/icons';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '../../utils/toast';
import { FlatList } from 'react-native';
import { Loader } from '../../utils/Loader';
import DownloadMedia from '../../components/DownloadMedia';

const FaceLinking = React.lazy(() => import('../../components/FaceLinking'));
const ImagePreview = React.lazy(() => import('../../components/ImagePreview'));


// ----------------------------- render faces -----------------------------

const HomeScreen = () => {
  const [faces, setFaces] = useState<any[]>([]);
  const FacePage = useRef(1);
  const isFacesPageLoading = useRef(false);
  const HasMoreFaces = useRef(true);

  const [photos, setPhotos] = useState<any[]>([]);
  const PhotoPage = useRef(1);
  const isPhotosPageLoading = useRef(false);
  const HasMorePhotos = useRef(true);

  const activityRef = useRef<ActivityIndicator | null>(null);

  const isDeleting = useRef(false);
  const isDownloading = useRef(false);
  const [isLinkingModal, setIsLinkingModal] = useState<number | null>(null);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<number | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const navigation = useNavigation();

  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // -------------------------- fetch photos ---------------------------------

  const fetchFaces = useCallback(async (pageNum: number = 1, isRefresh = false) => {
    if (isFacesPageLoading.current || !HasMoreFaces.current) return;
    isFacesPageLoading.current = true;
    try {
      const response = await apiRequest({
        API: `/faces?page=${pageNum}`,
        METHOD: 'GET'
      });
      if (response.success) {
        if (isRefresh) {
          setFaces(response.faces);
        } else {
          setFaces(prev => [...prev, ...response.faces]);
        }
        FacePage.current = response.current_page + 1;
        HasMoreFaces.current = response.has_next || false;
      }
    } catch (error) {
      showToast('Failed to load faces', 'error');
    } finally {
      isFacesPageLoading.current = false;
    }
  }, []);

  // -------------------------------- fetching photos ------------------------------

  const fetchPhotos = useCallback(async (page: number = 1, isRefresh = false) => {
    if (isPhotosPageLoading.current || !HasMorePhotos.current) return;
    isPhotosPageLoading.current = true;
    activityRef.current?.setNativeProps({ animating: true });
    try {
      const response = await apiRequest({
        API: `/photos?page=${page}`,
        METHOD: 'GET'
      });

      if (response.success) {
        if (isRefresh) {
          setPhotos(response.photos);
        } else {
          setPhotos(prev => [...prev, ...response.photos]);
        }
        HasMorePhotos.current = response.has_next || false;
        PhotoPage.current = response.current_page + 1;
      }
    } catch (error) {
      showToast('Failed to load photos', 'error');
    } finally {
      isPhotosPageLoading.current = false;
      activityRef.current?.setNativeProps({ animating: false });
    }
  }, []);

  // ------------------------------------- delete image ------------------------------------- 

  const handleDelete = useCallback(async (photoId: number) => {
    if (isDeleting.current) return;
    isDeleting.current = true;
    setDeletingPhotoId(photoId);
    try {
      const response = await apiRequest({ API: '/delete_photo', DATA: { photo_id: photoId } });
      if (response.success) {
        setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      showToast(errorMessage, 'error');
    } finally {
      isDeleting.current = false;
      setDeletingPhotoId(null);
    }
  }, []);

  // ------------ Handle download with loading state ---------------

  const handleDownload = useCallback(async (photoId: number, photoUrl: string) => {
    if (isDownloading.current) return;
    isDownloading.current = true;
    setDownloadingPhotoId(photoId);
    try {
      await DownloadMedia(photoUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download image';
      showToast(errorMessage, 'error');
    } finally {
      isDownloading.current = false;
      setDownloadingPhotoId(null);
    }
  }, []);

  // ------------ Handle linking with loading state ---------------

  const handleLinking = useCallback((photoId: number) => {
    setIsLinkingModal(photoId);
  }, []);

  // ------------------------------------ handle image preview ------------------------------------

  const imageData = useMemo(
    () => photos.map(photo => ({ uri: photo.photo_url })),
    [photos]
  );

  const handleImagePreview = useCallback((index: number) => {
    setCurrentIndex(index);
    setVisible(true);
  }, []);

  // ------------------------------------- load initial data -------------------------------------

  const loadInitialData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsInitialLoading(true);

      // Reset pagination state
      if (isRefresh) {
        FacePage.current = 1;
        PhotoPage.current = 1;
        HasMoreFaces.current = true;
        HasMorePhotos.current = true;
        setFaces([]);
        setPhotos([]);
      }

      await Promise.all([
        fetchFaces(1, isRefresh),
        fetchPhotos(1, isRefresh)
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      showToast('Error loading data');
    } finally {
      setIsInitialLoading(false);
      if (isRefresh) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  // ----------------------------- render faces -----------------------------

  const MemoizedFaceItem = useMemo(() => React.memo(({ item, onPress }: any) => (
    <TouchableOpacity
      style={styles.faceItem}
      onPress={() => onPress(item.id)}
    >
      <Image
        source={{ uri: item.face_url }}
        style={styles.faceImage}
        fadeDuration={300}
        onLoadStart={() => { }}
      />
      <Text style={styles.text} numberOfLines={1}>
        {item.name || "Untitled"}
      </Text>
    </TouchableOpacity>
  )), []);

  const renderFaces = useCallback(({ item }: any) => (
    <MemoizedFaceItem
      item={item}
      onPress={(id: number) => navigation.navigate('FaceDetails', { faceId: id })}
    />
  ), [navigation]);

  // ----------------------------- render photos -----------------------------

  const PhotoItem = React.memo(
    ({ item, index }: { item: any, index: number }) => (
      <View style={styles.galleryItem}>
        <TouchableOpacity onPress={() => handleImagePreview(index)}>
          <Image
            source={{ uri: item.photo_url }}
            style={styles.galleryItemImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <View style={styles.iconsContainer}>
          <TouchableOpacity
            style={[styles.iconButton, deletingPhotoId === item.id && styles.pendingIcon]}
            disabled={isDeleting.current}
            onPress={() => handleDelete(item.id)}
          >
            <Image source={getIconSource("trash")} style={styles.imgIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleLinking(item.id)}
          >
            <Image source={getIconSource("person")} style={styles.imgIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, downloadingPhotoId === item.id && styles.pendingIcon]}
            disabled={isDownloading.current}
            onPress={() => handleDownload(item.id, item.photo_url)}
          >
            <Image source={getIconSource("download")} style={styles.imgIcon} />
          </TouchableOpacity>
        </View>
      </View>
    ),
    (prevProps, nextProps) => prevProps.item.id === nextProps.item.id
  );

  const renderPhotos = useCallback(({ item, index }: { item: any, index: number }) => <PhotoItem item={item} index={index} />, []);

  // ------------------------ key extractors ------------------------
  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  // -------------------------- pagination if has more photos ---------------------------

  const HavingMorePhotos = () => {
    return HasMorePhotos.current ? (
      <ActivityIndicator size="large" color="purple" />
    ) : null;
  };

  const EmptyRender = () => {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No photos found</Text>
      </View>
    );
  };

  // ----------------------------- render components -----------------------------

  return (
    <View style={styles.container}>
      {isInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="purple" />
        </View>
      ) : (
        <>
          {/* Faces List */}
          {faces.length > 0 && (
            <View style={styles.facesContainer}>
              <FlatList
                horizontal
                data={faces || []}
                renderItem={renderFaces}
                keyExtractor={keyExtractor}
                onEndReached={() => fetchFaces(FacePage.current)}
                onEndReachedThreshold={0.2}
                contentContainerStyle={styles.facesList}
                showsHorizontalScrollIndicator={false}
                removeClippedSubviews={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => {
                      setIsRefreshing(true);
                      loadInitialData(true);
                    }}
                    colors={['purple']}
                    tintColor="purple"
                  />
                }
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                getItemLayout={(_, index) => ({
                  length: 90,
                  offset: 90 * index,
                  index,
                })}
              />
            </View>
          )}

          {/* Photos List */}
          {photos.length > 0 ? (
            <View style={styles.photosContainer}>
              <FlatList
                data={photos}
                numColumns={2}
                renderItem={renderPhotos}
                keyExtractor={keyExtractor}
                onEndReached={() => fetchPhotos(PhotoPage.current)}
                onEndReachedThreshold={0.2}
                ListFooterComponent={<HavingMorePhotos />}
                ListEmptyComponent={<EmptyRender />}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={5}
                initialNumToRender={8}
                updateCellsBatchingPeriod={50}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => {
                      setIsRefreshing(true);
                      loadInitialData(true);
                    }}
                    colors={['purple']}
                    tintColor="purple"
                  />
                }
                getItemLayout={(_, index) => ({
                  length: Dimensions.get('window').width / 2,
                  offset: (Dimensions.get('window').width / 2) * Math.floor(index / 2),
                  index
                })}
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 10 }}
              />
            </View>
          ) : null}

          <Modal visible={isLinkingModal !== null} transparent={true} animationType="fade">
            {isLinkingModal && (
              <Suspense fallback={<Loader />}>
                <FaceLinking
                  photo_id={isLinkingModal.toString()}
                  onClose={() => setIsLinkingModal(null)}
                />
              </Suspense>
            )}
          </Modal>

          <Suspense fallback={<Loader />}>
            <ImagePreview
              images={imageData}
              visible={visible}
              onClose={() => setVisible(false)}
              initialIndex={currentIndex}
            />
          </Suspense>
        </>
      )}
    </View>
  );

}

export default (HomeScreen);



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  facesContainer: {
    height: 120,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  facesList: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  faceItem: {
    width: 90,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  faceImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'purple',
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  photosContainer: {
    flex: 1,
  },
  galleryItem: {
    width: Dimensions.get('window').width / 2 - 3,
    aspectRatio: 1,
    margin: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  galleryItemImage: {
    width: '100%',
    height: '100%',
  },
  iconsContainer: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 7,
    borderRadius: 15,
  },
  pendingIcon: {
    opacity: 0.5,
  },
  imgIcon: {
    width: 22,
    height: 22,
    tintColor: 'white',
  },

});
