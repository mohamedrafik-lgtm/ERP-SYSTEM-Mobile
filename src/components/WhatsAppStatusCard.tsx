import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface WhatsAppStatusCardProps {
  title: string;
  icon: string;
  statusBoxes: Array<{
    title: string;
    status: string;
    description: string;
    icon: string;
    color: string;
    backgroundColor: string;
    borderColor: string;
  }>;
  actionButtons: Array<{
    title: string;
    color: string;
    backgroundColor: string;
    onPress: () => void;
  }>;
}

const WhatsAppStatusCard: React.FC<WhatsAppStatusCardProps> = ({
  title,
  icon,
  statusBoxes,
  actionButtons,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name={icon} size={24} color="#1a237e" />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.statusBoxes}>
        {statusBoxes.map((box, index) => (
          <View 
            key={index}
            style={[
              styles.statusBox, 
              { 
                backgroundColor: box.backgroundColor, 
                borderColor: box.borderColor 
              }
            ]}
          >
            <View style={styles.statusBoxHeader}>
              <Icon name={box.icon} size={20} color={box.color} />
              <Text style={[styles.statusBoxTitle, { color: box.color }]}>
                {box.title}
              </Text>
            </View>
            <Text style={[styles.statusBoxStatus, { color: box.color }]}>
              {box.status}
            </Text>
            <Text style={styles.statusBoxDescription}>{box.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionButtons}>
        {actionButtons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { backgroundColor: button.backgroundColor }]}
            onPress={button.onPress}
          >
            <Text style={[styles.actionButtonText, { color: button.color }]}>
              {button.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
  },
  statusBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  statusBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusBoxStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBoxDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '22%',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default WhatsAppStatusCard;
