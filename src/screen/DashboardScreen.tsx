import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { PROJECTS, RISK_COLORS, RISK_FILTER_LABELS } from '../data/projectsData';

const DashboardScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('All Projects');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 12, backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => navigation.navigate('Login')}>
          <Text style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 16 }}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const getFilteredProjects = () => {
    if (selectedFilter === 'All Projects') return PROJECTS;
    if (selectedFilter === 'High Risk') return PROJECTS.filter(p => p.risk === 'High');
    if (selectedFilter === 'Medium Risk') return PROJECTS.filter(p => p.risk === 'Medium');
    if (selectedFilter === 'Low Risk') return PROJECTS.filter(p => p.risk === 'Low');
    return PROJECTS;
  };

  const highRiskCount = PROJECTS.filter(p => p.risk === 'High').length;
  const mediumRiskCount = PROJECTS.filter(p => p.risk === 'Medium').length;
  const lowRiskCount = PROJECTS.filter(p => p.risk === 'Low').length;

  return (
    <ImageBackground
      source={require('../../assets/bg.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Dashboard Overview</Text>
          <Text style={styles.headerSubtitle}>
            Gain insights into your projects with real-time health metrics and status summaries
          </Text>
          <View style={styles.headerUnderline} />
        </View>

        {/* Project Status Insights */}
        <Text style={styles.sectionTitle}>Project Status Insights</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusCard, { borderColor: '#ef4444' }]}> 
            <View style={styles.highRiskCircleIcon}>
              <Feather name="alert-triangle" size={28} color="#fff" />
            </View>
            <Text style={styles.statusCardTitle}>High Risk Projects</Text>
            <Text style={[styles.statusCount, { color: '#ef4444' }]}>{highRiskCount}</Text>
            <Text style={styles.statusDesc}>Immediate attention required</Text>
          </View>
          <View style={[styles.statusCard, { borderColor: '#facc15' }]}> 
            <View style={styles.mediumRiskCircleIcon}>
              <Feather name="clock" size={28} color="#fff" />
            </View>
            <Text style={styles.statusCardTitle}>Medium Risk Projects</Text>
            <Text style={[styles.statusCount, { color: '#facc15' }]}>{mediumRiskCount}</Text>
            <Text style={styles.statusDesc}>Monitor progress closely</Text>
          </View>
          <View style={[styles.statusCard, { borderColor: '#22c55e' }]}> 
            <View style={styles.lowRiskCircleIcon}>
              <Feather name="check-circle" size={28} color="#fff" />
            </View>
            <Text style={styles.statusCardTitle}>Low Risk Projects</Text>
            <Text style={[styles.statusCount, { color: '#22c55e' }]}>{lowRiskCount}</Text>
            <Text style={styles.statusDesc}>Stable and on track</Text>
          </View>
        </View>

        {/* All Projects Section */}
        <Text style={styles.sectionTitle}>All Projects</Text>
        <View style={styles.filterCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContainer}
          >
            {RISK_FILTER_LABELS.map(label => {
              let btnColor = '#6366f1';
              let textColor = '#fff';
              if (selectedFilter === label) {
                if (label === 'High Risk') {
                  btnColor = '#ef4444';
                  textColor = '#fff';
                } else if (label === 'Medium Risk') {
                  btnColor = '#facc15';
                  textColor = '#fff';
                } else if (label === 'Low Risk') {
                  btnColor = '#22c55e';
                  textColor = '#fff';
                } else {
                  btnColor = '#6366f1';
                  textColor = '#fff';
                }
              } else {
                btnColor = '#f1f5f9';
                if (label === 'High Risk') textColor = '#ef4444';
                else if (label === 'Medium Risk') textColor = '#facc15';
                else if (label === 'Low Risk') textColor = '#22c55e';
                else textColor = '#222';
              }
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.filterBtn, { backgroundColor: btnColor }]}
                  onPress={() => setSelectedFilter(label)}
                >
                  <Text style={[styles.filterBtnText, { color: textColor }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.projectsCard}>
          <View style={styles.projectsRow}>
            {getFilteredProjects().map((project, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.projectCard,
                  { backgroundColor: RISK_COLORS[project.risk as keyof typeof RISK_COLORS] },
                  // Add marginRight for left card, marginLeft for right card
                  (idx % 2 === 0)
                    ? { marginRight: 12, marginLeft: 0 }
                    : { marginLeft: 12, marginRight: 0 }
                ]}
                onPress={() => navigation.navigate('ProjectOverview', { name: project.name, risk: project.risk })}
              >
                <Text style={styles.projectName}>{project.name}</Text>
                <View style={styles.projectRiskLabelBox}>
                  <Text style={styles.projectRiskLabel}>{project.risk} Risk</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        {/* Defects Reopened Multiple Times Pie Chart Card */}

    // ...existing code...
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    alignItems: 'center',
    borderWidth:2 ,
    borderColor:'#0965efff',
  },
  bg: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerUnderline: {
    width: 80,
    height: 4,
    backgroundColor: '#a78bfa',
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 6,
    alignItems: 'center',
    padding: 16,
    elevation: 2,
  },
  statusIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  statusCount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  filterScrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    flexWrap: 'wrap',
  },
  filterBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 6,
    marginVertical: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#6366f1',
  },
  filterBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  projectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    marginHorizontal: 0,
  },
  projectCard: {
    width: Dimensions.get('window').width / 2.5,
    height: Dimensions.get('window').width / 2.5,
    borderRadius: Dimensions.get('window').width / 5,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: '#fff',
  },
  projectIcon: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  projectRiskLabelBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  projectRiskLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  highRiskCircleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  highRiskIconText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  mediumRiskCircleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediumRiskIconText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  lowRiskCircleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lowRiskIconText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  reopenedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    elevation: 2,
    alignItems: 'flex-start',
  },
  reopenedTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
    marginBottom: 12,
  },
  legendBox: {
    marginTop: 12,
    marginLeft: 8,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 15,
    color: '#222',
  },
  projectsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    alignItems: 'center',
    
  },
});

export default DashboardScreen; 