import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getIconSource, icons } from '../utils/icons';


interface SettingsListItemProps {
  title: string;
  iconIMG: keyof typeof icons;
  onPress: () => void;
  showChevron?: boolean;
}

export default function SettingsListItem({ title, iconIMG, onPress, showChevron = true }: SettingsListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftContent}>
        <Image source={getIconSource(iconIMG)} style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {showChevron && <Image source={getIconSource("chevron_forward")} style={styles.icon} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  icon: {
    width: 22,
    height: 22,
    tintColor: '#333',
  },
}); 