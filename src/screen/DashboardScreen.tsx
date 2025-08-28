import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Feather from '@react-native-vector-icons/feather';
import Ionicons from '@react-native-vector-icons/ionicons';
import { PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { PROJECTS, RISK_COLORS, RISK_FILTER_LABELS } from '../data/projectsData';
import { projectAPI, UIProject } from '../service/api';

const DashboardScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('All Projects');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [apiProjects, setApiProjects] = useState<UIProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  useLayoutEffect(() => {
    navigation.setOptions({
          headerTitle: () => (
            
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#222',marginLeft: -25 }}>Back</Text>
          ),

      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginRight: 16 }} onPress={() => setShowNotifications(true)}>
            <Feather name="bell" size={20} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 16 }}>Logout</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProjects = await projectAPI.getProjects();
      setApiProjects(fetchedProjects);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Use API data when available, fallback to static data
  const projectsToUse = apiProjects.length > 0 ? apiProjects : PROJECTS;

  const getFilteredProjects = () => {
    if (selectedFilter === 'All Projects') return projectsToUse;
    if (selectedFilter === 'High Risk') return projectsToUse.filter(p => p.risk === 'High');
    if (selectedFilter === 'Medium Risk') return projectsToUse.filter(p => p.risk === 'Medium');
    if (selectedFilter === 'Low Risk') return projectsToUse.filter(p => p.risk === 'Low');
    return projectsToUse;
  };

  const highRiskCount = projectsToUse.filter(p => p.risk === 'High').length;
  const mediumRiskCount = projectsToUse.filter(p => p.risk === 'Medium').length;
  const lowRiskCount = projectsToUse.filter(p => p.risk === 'Low').length;

  return (
    <View style={styles.bg}>
      {/* Notification Popup */}
      {showNotifications && (
        <View style={styles.notificationsOverlay}>
          <View style={styles.notificationsModal}>
            <View style={styles.notificationsHeader}>
              <Text style={styles.notificationsTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={styles.notificationsClose}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.notificationsList}>
              <View style={styles.notificationItem}>
                <Feather name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notificationTitleHigh}>High Priority Defect</Text>
                  <Text style={styles.notificationDesc}>Critical bug found in authentication module</Text>
                  <Text style={styles.notificationTime}>7m ago</Text>
                </View>
              </View>
              <View style={styles.notificationItem}>
                <Feather name="check-circle" size={20} color="#22c55e" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notificationTitleFixed}>Defect Fixed</Text>
                  <Text style={styles.notificationDesc}>UI alignment issue has been resolved</Text>
                  <Text style={styles.notificationTime}>32m ago</Text>
                </View>
              </View>
              <View style={styles.notificationItem}>
                <Feather name="alert-triangle" size={20} color="#facc15" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notificationTitleCodeReview}>Code Review Required</Text>
                  <Text style={styles.notificationDesc}>New defect fixes need review in Dashboard module</Text>
                  <Text style={styles.notificationTime}>2h ago</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Dashboard Overview</Text>
          <Text style={styles.headerSubtitle}>
            Gain insights into your projects with real-time health metrics and status summaries
          </Text>
          <View style={styles.headerUnderline} />
        </View>

        {/* Data Source Indicator */}
        {/* {apiProjects.length > 0 && (
          <View style={styles.dataSourceIndicator}>
            <Text style={styles.dataSourceText}>
              📊 Live API Data ({apiProjects.length} projects)
            </Text>
          </View>
        )} */}

        {/* Project Status Insights */}
        <Text style={styles.sectionTitle}>Project Status Insights</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusCard, { borderColor: '#ef4444' }]}> 
            <View style={styles.highRiskCircleIcon}>
              <Feather name="alert-triangle" size={28} color="#fff" />
            </View>
            <Text style={styles.statusCardTitle}>High Risk Projects</Text>
            <Text style={[styles.statusCount, { color: '#ef4444' }]}>
              {loading ? '...' : highRiskCount}
            </Text>
            <Text style={styles.statusDesc}>Immediate attention required</Text>
          </View>
          <View style={[styles.statusCard, { borderColor: '#facc15' }]}> 
            <View style={styles.mediumRiskCircleIcon}>
              <Feather name="clock" size={28} color="#fff" />
            </View>
            <Text style={styles.statusCardTitle}>Medium Risk Projects</Text>
            <Text style={[styles.statusCount, { color: '#facc15' }]}>
              {loading ? '...' : mediumRiskCount}
            </Text>
            <Text style={styles.statusDesc}>Monitor progress closely</Text>
          </View>
          <View style={[styles.statusCard, { borderColor: '#22c55e' }]}> 
            <View style={styles.lowRiskCircleIcon}>
              <Feather name="check-circle" size={28} color="#fff" />
            </View>
            <Text style={styles.statusCardTitle}>Low Risk Projects</Text>
            <Text style={[styles.statusCount, { color: '#22c55e' }]}>
              {loading ? '...' : lowRiskCount}
            </Text>
            <Text style={styles.statusDesc}>Stable and on track</Text>
          </View>
        </View>

        {/* All Projects Section */}
        <Text style={styles.sectionTitle}>All Projects</Text>
        
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading projects from API...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProjects}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && projectsToUse.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No projects available</Text>
          </View>
        )}
        
        <View style={styles.filterCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            // contentContainerStyle={styles.filterScrollContainer}
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
    </View>
  );
};

const styles = StyleSheet.create({
  filterCard: {
    // backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    // marginHorizontal: 16,
    // marginTop: 8,
    // marginBottom: 8,
   
    alignItems: 'center',
   
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
  // filterScrollContainer: {
  //   flexDirection: 'row',
  //   paddingHorizontal: 2,
  //   paddingVertical: 12,
  //   alignItems: 'center',
  // },
  // filterRow: {
  //   flexDirection: 'row',
  //   justifyContent: 'center',
  //   marginVertical: 12,
  //   flexWrap: 'wrap',
  // },
  filterBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginHorizontal: 2,
    minWidth: 75,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#6366f1',
  },
  filterBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 12,
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
    // backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 8,
    alignItems: 'center',
  },
  notificationsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  notificationsModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    minWidth: 320,
    maxWidth: 340,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  notificationsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  notificationsClose: {
    fontSize: 28,
    color: '#888',
    marginLeft: 12,
    fontWeight: 'bold',
  },
  notificationsList: {
    marginTop: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  notificationTitleHigh: {
    fontWeight: 'bold',
    color: '#ef4444',
    fontSize: 16,
  },
  notificationTitleFixed: {
    fontWeight: 'bold',
    color: '#22c55e',
    fontSize: 16,
  },
  notificationTitleCodeReview: {
    fontWeight: 'bold',
    color: '#facc15',
    fontSize: 16,
  },
  notificationDesc: {
    color: '#222',
    fontSize: 14,
    marginTop: 2,
  },
  notificationTime: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  dataSourceIndicator: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  dataSourceText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardScreen; 