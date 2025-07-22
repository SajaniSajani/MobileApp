import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import { 
  PROJECTS, 
  DEFECT_DATA, 
  DEFECT_COLORS, 
  RISK_COLORS, 
  RISK_LABELS 
} from '../data/projectsData';

type ProjectOverviewRouteProp = RouteProp<RootStackParamList, 'ProjectOverview'>;

const ProjectOverviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ProjectOverviewRouteProp>();
  const [selectedProjectIdx, setSelectedProjectIdx] = useState(
    Math.max(0, PROJECTS.findIndex(p => p.name === route.params?.name))
  );
  const project = PROJECTS[selectedProjectIdx] || PROJECTS[0];
  const defectData = DEFECT_DATA[project.name] || DEFECT_DATA['Defect Tracker'];

  const scrollToProject = (dir: 'left' | 'right') => {
    if (dir === 'left' && selectedProjectIdx > 0) setSelectedProjectIdx(selectedProjectIdx - 1);
    if (dir === 'right' && selectedProjectIdx < PROJECTS.length - 1) setSelectedProjectIdx(selectedProjectIdx + 1);
  };

  return (
    <ScrollView style={styles.bg} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Back Button */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{'< Back'}</Text>
        </TouchableOpacity>
      </View>

      {/* Project Selection */}
      <View style={styles.projectSelectorBox}>
        <Text style={styles.projectSelectorLabel}>Project Selection</Text>
        <View style={styles.projectSelectorRow}>
          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={() => scrollToProject('left')}
            disabled={selectedProjectIdx === 0}
          >
            <Text style={[styles.arrowText, selectedProjectIdx === 0 && { opacity: 0.3 }]}>{'<'}</Text>
          </TouchableOpacity>
          <FlatList
            data={PROJECTS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.name}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.projectBtn, index === selectedProjectIdx && styles.projectBtnActive]}
                onPress={() => setSelectedProjectIdx(index)}
              >
                <Text style={[styles.projectBtnText, index === selectedProjectIdx && styles.projectBtnTextActive]}>{item.name}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ flexGrow: 1 }}
            style={{ flex: 1 }}
            extraData={selectedProjectIdx}
          />
          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={() => scrollToProject('right')}
            disabled={selectedProjectIdx === PROJECTS.length - 1}
          >
            <Text style={[styles.arrowText, selectedProjectIdx === PROJECTS.length - 1 && { opacity: 0.3 }]}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Project Title & Status */}
      <View style={styles.projectTitleBox}>
        <Text style={styles.projectTitle}>{project.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: RISK_COLORS[project.risk] + '22' }]}> 
          <Text style={[styles.statusBadgeText, { color: RISK_COLORS[project.risk] }]}>{RISK_LABELS[project.risk]}</Text>
        </View>
      </View>

      {/* Defect Severity Breakdown */}
      <Text style={styles.sectionTitle}>Defect Severity Breakdown</Text>
      <View style={styles.defectRow}>
        {['High', 'Medium', 'Low'].map(severity => (
          <View key={severity} style={[styles.defectCard, { borderColor: RISK_COLORS[severity] }]}> 
            <Text style={[styles.defectCardTitle, { color: RISK_COLORS[severity] }]}>Defects on {severity}</Text>
            <Text style={styles.defectTotal}>Total: {defectData[severity]?.total ?? 0}</Text>
            <View style={styles.defectList}>
              {Object.entries(defectData[severity] || {}).filter(([k]) => k !== 'total').map(([type, count]) => (
                <View key={type} style={styles.defectItemRow}>
                  <View style={[styles.dot, { backgroundColor: DEFECT_COLORS[type] || '#888' }]} />
                  <Text style={styles.defectType}>{type}</Text>
                  <Text style={styles.defectCount}>{count}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.chartBtn}>
              <Text style={styles.chartBtnText}>View Chart</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  projectSelectorBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  projectSelectorLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#222',
  },
  projectSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: {
    padding: 8,
  },
  arrowText: {
    fontSize: 22,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  projectBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  projectBtnActive: {
    backgroundColor: '#6366f1',
  },
  projectBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
  projectBtnTextActive: {
    color: '#fff',
  },
  projectTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
  },
  statusBadgeText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  defectRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  defectCard: {
    flex: 1,
    minWidth: 220,
    maxWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 6,
    marginBottom: 12,
    alignItems: 'flex-start',
    padding: 16,
    elevation: 2,
  },
  defectCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  defectTotal: {
    fontSize: 14,
    color: '#222',
    marginBottom: 8,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
  },
  defectList: {
    width: '100%',
    marginBottom: 8,
  },
  defectItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  defectType: {
    fontSize: 13,
    color: '#222',
    width: 70,
  },
  defectCount: {
    fontSize: 13,
    color: '#222',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  chartBtn: {
    backgroundColor: '#e0e7ff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  chartBtnText: {
    color: '#3730a3',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ProjectOverviewScreen; 