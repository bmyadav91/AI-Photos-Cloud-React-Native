import React, { useEffect, useState, memo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { apiRequest } from "../services/MainAPI";
import { showToast } from '../utils/toast';
import { getIconSource } from '../utils/icons';
import { FlatList } from 'react-native';

interface Face {
  id: number;
  face_url: string;
  name: string;
  face_count: number;
  linked: boolean;
}

interface FaceLinkingProps {
  photo_id: string;
  onClose: () => void;
}

// Memoized Face Item Component
const FaceItem = memo(({ face, onPress, isLoading, photo_id }: any) => (
  <TouchableOpacity
    key={face.id}
    style={styles.album}
    onPress={() => onPress(Number(photo_id), face.id, !face.linked)}
    disabled={isLoading}
  >
    <View style={styles.checkbox}>
      {face.linked && (
        <Image source={getIconSource("checkmark")} style={styles.imgIcon} />
      )}
    </View>
    <Image
      source={{ uri: face.face_url }}
      style={styles.faceImage}
    />
    <View style={styles.albumDetails}>
      <Text style={styles.albumTitle}>{face.name || "Untitled"}</Text>
      <Text style={styles.containedItems}>{face.face_count} items</Text>
    </View>
  </TouchableOpacity>
));

const FaceLinking: React.FC<FaceLinkingProps> = ({ photo_id, onClose }) => {
  const [faces, setFaces] = useState<Face[]>([]);
  const hasMoreFaces = useRef(true);
  const Page = useRef(1);
  const IsPageLoading = useRef(false);
  const IsFaceLinkingUnlinking = useRef(false);

  // Fetch faces from API
  const FetchFace = async (photo_id: number) => {
    try {
      if (!photo_id || IsPageLoading.current || !hasMoreFaces.current) return;
      IsPageLoading.current = true;
      const response = await apiRequest({ API: `/get_faces`, DATA: { photo_id, page: Page.current } });
      if (response.success) {
        hasMoreFaces.current = response.has_next || false;
        Page.current = response.page + 1;
        setFaces((prev) => [...prev, ...response.faces]);
      }
    } finally {
      IsPageLoading.current = false;
    }
  };

  useEffect(() => {
    FetchFace(Number(photo_id));
  }, []);

  // Link/unlink photo to face
  const LinkUnlinkPhotoWithFace = async (photo_id: number, face_id: number, checked: boolean) => {
    try {
      if (IsFaceLinkingUnlinking.current) return;
      IsFaceLinkingUnlinking.current = true;

      // Update local state immediately for better UX
      setFaces(prevFaces =>
        prevFaces.map(face =>
          face.id === face_id ? { ...face, linked: checked } : face
        )
      );

      const response = await apiRequest({
        API: `/link_unlink_photo_with_face`,
        DATA: { photo_id, face_id, checked }
      });
      if (response.success) {
        showToast(response.message || "Face updated successfully!", "success");
        // onClose();
      } else {
        // Revert the local state if the API call fails
        setFaces(prevFaces =>
          prevFaces.map(face =>
            face.id === face_id ? { ...face, linked: !checked } : face
          )
        );
        showToast(response.message || "Failed to link face", "error");
      }
    } finally {
      IsFaceLinkingUnlinking.current = false;
    }
  };

  // Memoized render function
  const renderFaceItem = useCallback(({ item: face }: any) => (
    <FaceItem
      face={face}
      onPress={LinkUnlinkPhotoWithFace}
      isLoading={IsFaceLinkingUnlinking.current}
      photo_id={photo_id}
    />
  ), []);

  // if (error) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.headerText}>Add to</Text>
            <TouchableOpacity onPress={onClose}>
              <Image source={getIconSource("close")} style={{ width: 24, height: 24 }} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={faces || []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFaceItem}
            ListEmptyComponent={() => <Text style={styles.noFacesText}>No faces found</Text>}
            ListFooterComponent={() =>
              hasMoreFaces.current ? (
                <TouchableOpacity
                  style={[styles.showMoreButton, IsPageLoading.current && styles.disabledButton]}
                  onPress={() => FetchFace(Number(photo_id))}
                  disabled={IsPageLoading.current}
                >
                  <Text style={styles.showMoreText}>
                    {IsPageLoading.current ? "Loading..." : "Show More"}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(_, index) => ({
              length: 70,
              offset: 70 * index,
              index
            })}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  album: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  faceImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  albumDetails: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  containedItems: {
    fontSize: 12,
    color: 'gray',
  },
  noFacesText: {
    textAlign: 'center',
    padding: 20,
    color: 'gray',
  },
  showMoreButton: {
    width: '100%',
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f6f6f6',
    borderRadius: 5,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  showMoreText: {
    fontWeight: 'bold',
  },
  imgIcon: {
    width: 20,
    height: 20,
    tintColor: '#0075ff',
  },
});

export default FaceLinking;
