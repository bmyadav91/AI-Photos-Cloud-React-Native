import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export const Loader = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="blue" />
    </View>
);
