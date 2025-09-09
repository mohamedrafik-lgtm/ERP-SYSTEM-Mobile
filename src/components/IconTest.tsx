import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const IconTest = () => {
  const testIcons = [
    'home', 'school', 'book', 'person', 'settings', 'menu',
    'search', 'add', 'edit', 'delete', 'save', 'refresh',
    'email', 'phone', 'calendar-today', 'people', 'trending-up',
    'attach-money', 'description', 'translate', 'list', 'more-vert',
    'check-circle', 'pause-circle', 'schedule', 'assessment',
    'chevron-left', 'chevron-right', 'close'
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>اختبار الأيقونات</Text>
      <View style={styles.iconGrid}>
        {testIcons.map((iconName, index) => (
          <View key={index} style={styles.iconItem}>
            <Icon name={iconName} size={24} color="#1a237e" />
            <Text style={styles.iconName}>{iconName}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f6fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 20,
    textAlign: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  iconItem: {
    alignItems: 'center',
    margin: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 80,
  },
  iconName: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default IconTest;
