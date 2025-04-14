import React, { useEffect, useState, useCallback, useRef, Suspense, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Dimensions, TextInput } from 'react-native';
import { apiRequest } from "../../../src/services/MainAPI";
import { getIconSource } from '../../utils/icons';
import { showToast } from '../../utils/toast';
import { FlatList } from 'react-native';
import { Loader } from '../../utils/Loader';
import DownloadMedia from '../../components/DownloadMedia';
import globalStyles from '../../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';

const FaceLinking = React.lazy(() => import('../../components/FaceLinking'));
const ImagePreview = React.lazy(() => import('../../components/ImagePreview'));



const FaceDetails = ({ route }: { route: any }) => {
    const { faceId } = route.params;
    const [face, setFace] = useState<any>(null);
    const FcaeDetailsFetching = useRef(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [photos, setPhotos] = useState<any[]>([]);
    const PhotoPage = useRef(1);
    const isPhotosPageLoading = useRef(false);
    const HasMorePhotos = useRef(true);

    const isDeleting = useRef(false);
    const isDownloading = useRef(false);
    const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
    const [downloadingPhotoId, setDownloadingPhotoId] = useState<number | null>(null);
    const [isLinkingModal, setIsLinkingModal] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(false);

    const navigation = useNavigation();
    const [deletingFace, setDeletingFace] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [faceName, setFaceName] = useState("");
    const updatingName = useRef(false);



    // ------------------------------ fetch face details ------------------------------

    const fetchFaceDetails = useCallback(async () => {
        if (FcaeDetailsFetching.current) return;
        FcaeDetailsFetching.current = true;
        try {
            const faceResponse = await apiRequest({ API: `/face/${faceId}`, METHOD: 'GET' });
            if (faceResponse.success) {
                setFace(faceResponse.face);
                setFaceName(faceResponse.face.name || "Untitled");
            }
        } catch (error) {
            showToast("Failed to fetch face details", "error");
        } finally {
            FcaeDetailsFetching.current = false;
        }
    }, [faceId]);


    // ------------------------------ fetch photos ------------------------------

    const fetchPhotos = useCallback(async () => {
        try {
            if (!HasMorePhotos.current || isPhotosPageLoading.current) return;
            isPhotosPageLoading.current = true;
            const galleryResponse = await apiRequest({ API: `/photo_by_face?face_id=${faceId}&page=${PhotoPage.current}`, METHOD: 'GET' });
            if (galleryResponse.success) {
                setPhotos(prev => [...prev, ...galleryResponse.photos]);
                HasMorePhotos.current = galleryResponse.has_next || false;
                PhotoPage.current = PhotoPage.current + 1;
            }
        } finally {
            isPhotosPageLoading.current = false;
        }
    }, []);

    // ----------------------------------- Initial loading -----------------------------------

    useEffect(() => {
        const loadInitialData = async () => {
            setIsInitialLoading(true);
            try {
                await fetchFaceDetails();
                await fetchPhotos();
            } finally {
                setIsInitialLoading(false);
            }
        };

        loadInitialData();
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
    const keyExtractor = useCallback((item: any) => item.id, []);

    // ------------------------------- delete face ----------------------------------- 

    const deleteFace = useCallback(async (face_id: number) => {
        if (deletingFace) return;
        setDeletingFace(true);
        try {
            const response = await apiRequest({ API: `/delete_face`, DATA: { face_id: face_id }, METHOD: 'POST' });
            if (response.success) {
                showToast("Face deleted successfully!", "success");
                navigation.goBack();
            } else {
                showToast(response.message || "Failed to delete face", "error");
            }
        } finally {
            setDeletingFace(false);
        }
    }, []);

    // -------------------------- pagination if has more photos ---------------------------

    const HavingMorePhotos = useCallback(() => {
        if (HasMorePhotos.current) {
            return <ActivityIndicator size="large" color="purple" />
        }
        return null;
    }, []);

    // ---------------------------- api hit name update ----------------------------

    const updateFaceName = useCallback(async (face_id: number, name: string) => {
        if (!face) {
            return;
        }
        
        if (!name.trim()) {
            showToast('Name cannot be empty', 'error');
            return;
        }

        const currentName = face.name || '';
        if (name.trim() === currentName.trim()) {
            setIsEditing(false);
            return;
        }

        if (updatingName.current) {
            return;
        }

        updatingName.current = true;
        try {
            const response = await apiRequest({ API: `/update-face-name`, DATA: { face_id: face_id, name: name }, METHOD: 'POST' });

            if (response.success) {
                setFaceName(name);
                showToast('Name updated successfully!', 'success');
            } else {
                setFaceName(faceName || 'Untitled');
                showToast(response.message || 'Failed to update name', 'error');
            }
        } catch (error) {
            setFaceName(faceName || 'Untitled');
            showToast('Failed to update name', 'error');
        } finally {
            updatingName.current = false;
            setIsEditing(false);
        }
    }, [face]);

    // ---------------------------------- handle update face name ----------------------------------

    const HandleUpdateFaceName = useCallback(() => {
        updateFaceName(face.id, faceName);
        setIsEditing(false);
    }, [faceName, face]);

    // ---------------------------- redner face details header ------------------------------ 

    const renderFaceDetails = useCallback(() => {
        if (!face) return null;

        return (
            <View style={styles.faceDetailsContainer}>
                <Image source={{ uri: face.face_url }} style={styles.faceImage} />

                {isEditing ? (
                    <TextInput
                        style={styles.editableInput}
                        value={faceName}
                        onChangeText={setFaceName}
                        onSubmitEditing={HandleUpdateFaceName}
                        // onBlur={HandleUpdateFaceName}
                        autoFocus
                    />
                ) : (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Text style={styles.faceName}>{faceName || "Untitled"}</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.faceCount}>Photos: {face.face_count || 0}</Text>

                <TouchableOpacity
                    onPress={() => deleteFace(face.id)}
                    style={[
                        globalStyles.button,
                        { backgroundColor: "red" },
                        deletingFace && globalStyles.disabledButton,
                    ]}
                    disabled={deletingFace}
                >
                    <Text style={globalStyles.buttonText}>Delete Face</Text>
                </TouchableOpacity>
            </View>
        );
    }, [face, isEditing, faceName, deletingFace]);

    // ----------------------------- render components -----------------------------

    return (
        <View style={styles.container}>
            {isInitialLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="purple" />
                </View>
            ) : (
                <>
                    {renderFaceDetails()}
                    {/* Photos List */}
                    <FlatList
                        data={photos}
                        numColumns={2}
                        renderItem={renderPhotos}
                        keyExtractor={keyExtractor}
                        onEndReached={() => fetchPhotos()}
                        onEndReachedThreshold={0.2}
                        ListFooterComponent={HavingMorePhotos()}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={6}
                        windowSize={5}
                        initialNumToRender={8}
                        updateCellsBatchingPeriod={50}
                        getItemLayout={(_, index) => ({
                            length: Dimensions.get('window').width / 2,
                            offset: (Dimensions.get('window').width / 2) * Math.floor(index / 2),
                            index
                        })}
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />

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
};

export default FaceDetails;


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
    faceImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 5,
        borderWidth: 2,
        borderColor: 'purple',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: -5,
    },
    details: {
        fontSize: 16,
        color: '#666',
    },
    faceDetailsContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    nameContainer: {
        position: 'relative',
        zIndex: 1,
    },
    nameEditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    nameInput: {
        minWidth: 100,
        textAlign: 'center',
        padding: 5,
        backgroundColor: '#f5f5f5',
        borderRadius: 5,
        zIndex: 2,
    },
    saveButton: {
        padding: 5,
    },
    cancelButton: {
        padding: 5,
    },
    disabledButton: {
        opacity: 0.5,
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
    faceName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: -5,
    },
    faceCount: {
        fontSize: 16,
        color: '#666',
    },
    editableInput: {
        fontSize: 18,
        borderBottomWidth: 1,
        borderColor: '#ccc',
        padding: 4,
        marginBottom: 8,
        color: '#333',
    }
});