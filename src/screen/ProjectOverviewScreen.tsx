import React, { useState, useLayoutEffect, useEffect } from 'react';
import { Modal } from 'react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Feather from '@react-native-vector-icons/feather';
import { 
  PROJECTS, 
  DEFECT_DATA, 
  DEFECT_COLORS, 
  RISK_COLORS, 
  RISK_LABELS 
} from '../data/projectsData';
import { projectAPI, UIProject } from '../service/api';
import { PieChart, LineChart } from 'react-native-chart-kit';
import Svg, { Path, Circle, Line } from 'react-native-svg';

// Add type for DEFECT_DATA keys
type DefectDataKey = keyof typeof DEFECT_DATA;

// Custom Speedometer Component
interface SpeedometerProps {
  value: number;
  size?: number;
  minValue?: number;
  maxValue?: number;
}

const CustomSpeedometer = ({ value, size = 200, minValue = 0, maxValue = 50 }: SpeedometerProps) => {
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;

  // Calculate angle for the needle based on value ranges (0-7, 7-10, 10+)
  let needleAngle;
  if (value <= 7) {
    // Green zone: 0-7 maps to 180-270 degrees (90 degrees total)
    const greenPercentage = value / 7;
    needleAngle = 180 + (greenPercentage * 90);
  } else if (value <= 10) {
    // Yellow zone: 7-10 maps to 270-306 degrees (36 degrees total)
    const yellowPercentage = (value - 7) / 3;
    needleAngle = 270 + (yellowPercentage * 36);
  } else {
    // Red zone: 10+ maps to 306-360 degrees (54 degrees total)
    const redPercentage = Math.min((value - 10) / 40, 1); // Cap at 50 total
    needleAngle = 306 + (redPercentage * 54);
  }

  // Convert angle to radians for needle position
  const needleRadians = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 10;
  const needleX = centerX + Math.cos(needleRadians) * needleLength;
  const needleY = centerY + Math.sin(needleRadians) * needleLength;

  // Create arc paths for different color segments (full circle support)
  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

    const x1 = centerX + Math.cos(start) * radius;
    const y1 = centerY + Math.sin(start) * radius;
    const x2 = centerX + Math.cos(end) * radius;
    const y2 = centerY + Math.sin(end) * radius;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size / 2 + 40} viewBox={`0 0 ${size} ${size / 2 + 40}`}>
        {/* Green segment (0-7) - Takes up ~50% of the arc */}
        <Path
          d={createArcPath(180, 270, radius)}
          stroke="#00ff6b"
          strokeWidth="20"
          fill="none"
          strokeLinecap="butt"
        />

        {/* Yellow segment (7-10) - Takes up ~20% of the arc */}
        <Path
          d={createArcPath(270, 306, radius)}
          stroke="#f4ab44"
          strokeWidth="20"
          fill="none"
          strokeLinecap="butt"
        />

        {/* Red segment (10+) - Takes up ~30% of the arc */}
        <Path
          d={createArcPath(306, 360, radius)}
          stroke="#ff2900"
          strokeWidth="20"
          fill="none"
          strokeLinecap="butt"
        />

        {/* Needle */}
        <Line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="#0066cc"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Center circle */}
        <Circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="#333"
          stroke="#0066cc"
          strokeWidth="2"
        />
      </Svg>

      {/* Value display below the horizontal semi-circle */}
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222' }}>{value}</Text>
        <Text style={{ fontSize: 12, color: '#666' }}>Defects per KLOC</Text>
      </View>
    </View>
  );
};

// If you have a RootStackParamList, import and use it here. Otherwise, fallback to any.
// import { RootStackParamList } from '../navigation/types';
// Move useNavigation inside the component to avoid invalid hook call
const ProjectOverviewScreen = () => {
  // --- Defect Severity Breakdown API state/hooks ---
  const [defectSeverityBreakdown, setDefectSeverityBreakdown] = useState<{
    status: string;
    statusCode: number;
    projectId: number;
    projectName: string;
    totalDefects: number;
    defectSummary: Array<{
      severity: string;
      Severity_color: string;
      total: number;
      statuses: {
        Open: number;
        Open_color: string;
        Fixed: number;
        Fixed_color: string;
        Retest: number;
        Retest_color: string;
        Closed: number;
        Closed_color: string;
      };
    }>;
  } | null>(null);
  const [defectSeverityBreakdownLoading, setDefectSeverityBreakdownLoading] = useState(false);
  const [defectSeverityBreakdownError, setDefectSeverityBreakdownError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const [apiProjects, setApiProjects] = useState<UIProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [remarkError, setRemarkError] = useState<string | null>(null);
  const [remarkRatio, setRemarkRatio] = useState<number | null>(null);
  const [remarkStatus, setRemarkStatus] = useState<string>('');
  const [defectCount, setDefectCount] = useState<number | null>(null);
  const [remarkCount, setRemarkCount] = useState<number | null>(null);

  // --- Defect by Module API state/hooks ---
  const [defectModuleData, setDefectModuleData] = useState<Array<{ name: string; population: number; color?: string; legendFontColor?: string; legendFontSize?: number }>>([]);
  const [defectModuleLoading, setDefectModuleLoading] = useState(false);
  const [defectModuleError, setDefectModuleError] = useState<string | null>(null);

  // --- Defect Severity Index API state/hooks ---
  const [severityIndex, setSeverityIndex] = useState<number | null>(null);
  const [severityIndexLoading, setSeverityIndexLoading] = useState(false);
  const [severityIndexError, setSeverityIndexError] = useState<string | null>(null);

  // --- Defect Distribution by Type API state/hooks ---
  const [defectTypeData, setDefectTypeData] = useState<Array<{ name: string; population: number; color: string; legendFontColor: string; legendFontSize: number }>>([]);
  const [defectTypeLoading, setDefectTypeLoading] = useState(false);
  const [defectTypeError, setDefectTypeError] = useState<string | null>(null);
  const [defectTypeTotal, setDefectTypeTotal] = useState<number>(0);
  const [defectTypeMostCommon, setDefectTypeMostCommon] = useState<string>('');
  const [defectTypeMostCommonCount, setDefectTypeMostCommonCount] = useState<number>(0);

  // --- Defect Density API state/hooks ---
  const [defectDensityData, setDefectDensityData] = useState<{
    defectDensity: number;
    totalDefects: number;
    linesOfCode: number;
    interpretation: string;
  } | null>(null);
  const [defectDensityLoading, setDefectDensityLoading] = useState(false);
  const [defectDensityError, setDefectDensityError] = useState<string | null>(null);

  // Use API data when available, fallback to static data
  const projectsToUse = apiProjects.length > 0 ? apiProjects : PROJECTS;
  const [selectedProjectIdx, setSelectedProjectIdx] = useState(0);
  const [showHighStatusModal, setShowHighStatusModal] = useState(false);
  const [showMediumStatusModal, setShowMediumStatusModal] = useState(false);
  const [showLowStatusModal, setShowLowStatusModal] = useState(false);
  // Add fallback id for static projects (use name as id)
  const project = projectsToUse[selectedProjectIdx]
    ? {
        ...projectsToUse[selectedProjectIdx],
        id: (projectsToUse[selectedProjectIdx] as any).id || projectsToUse[selectedProjectIdx].name,
        project_id: (projectsToUse[selectedProjectIdx] as any).project_id || (projectsToUse[selectedProjectIdx] as any).id || projectsToUse[selectedProjectIdx].name
      }
    : {
        ...projectsToUse[0],
        id: (projectsToUse[0] as any).id || projectsToUse[0].name,
        project_id: (projectsToUse[0] as any).project_id || (projectsToUse[0] as any).id || projectsToUse[0].name
      };

  // Fetch defect summary by module on project change
  // Fetch defect severity breakdown on project change
  useEffect(() => {
    if (!project?.project_id) return;
    setDefectSeverityBreakdownLoading(true);
    setDefectSeverityBreakdownError(null);
    projectAPI.getDefectSeverityBreakdown(project.project_id)
      .then((data) => {
        setDefectSeverityBreakdown(data);
      })
      .catch((err) => {
        setDefectSeverityBreakdownError(err instanceof Error ? err.message : 'Failed to fetch defect severity breakdown');
        setDefectSeverityBreakdown(null);
      })
      .finally(() => setDefectSeverityBreakdownLoading(false));
  }, [project?.project_id]);
  useEffect(() => {
    if (!project?.id) return;
    setDefectModuleLoading(true);
    setDefectModuleError(null);
    projectAPI.getDefectSummaryByModule(project.project_id)
      .then((data) => {
        const chartColors = [
          '#2563eb', '#10b981', '#facc15', '#ef4444', '#a78bfa', '#f472b6', '#fb7185', '#f59e42', '#22d3ee', '#a3e635'
        ];
        const total = data.reduce((sum, item) => sum + (item.population || 0), 0);
        const withColorsAndPercent = data.map((item, idx) => ({
          ...item,
          color: item.color || chartColors[idx % chartColors.length],
          legendFontColor: '#222',
          legendFontSize: 15,
          percentage: total > 0 ? (item.population / total) * 100 : 0
        }));
        setDefectModuleData(withColorsAndPercent);
      })
      .catch((err) => {
        setDefectModuleError(err instanceof Error ? err.message : 'Failed to fetch defect summary by module');
        setDefectModuleData([]);
      })
      .finally(() => setDefectModuleLoading(false));
  }, [project?.id]);

  // Fetch defect severity index on project change
  useEffect(() => {
    if (!project?.id) return;
    setSeverityIndexLoading(true);
    setSeverityIndexError(null);
    projectAPI.getDefectSeverityIndex(project.project_id)
      .then((data) => {
        setSeverityIndex(data.dsiPercentage ?? null);
      })
      .catch((err) => {
        setSeverityIndexError(err instanceof Error ? err.message : 'Failed to fetch defect severity index');
        setSeverityIndex(null);
      })
      .finally(() => setSeverityIndexLoading(false));
  }, [project?.id]);

  // Fetch defect type breakdown on project change
  useEffect(() => {
    if (!project?.project_id) return;
    setDefectTypeLoading(true);
    setDefectTypeError(null);
    projectAPI.getDefectTypeBreakdown(project.project_id)
      .then((data) => {
        const chartColors = [
          '#2563eb', '#10b981', '#facc15', '#ef4444', '#a78bfa', '#f472b6', '#fb7185', '#f59e42', '#22d3ee', '#a3e635'
        ];
        setDefectTypeTotal(data.totalDefectCount ?? 0);
        setDefectTypeMostCommon(data.mostCommonDefectType ?? '');
        setDefectTypeMostCommonCount(data.mostCommonDefectCount ?? 0);
        const chartData = (data.defectTypes || []).map((item, idx) => ({
          name: item.defectType,
          population: item.defectCount,
          color: chartColors[idx % chartColors.length],
          legendFontColor: '#222',
          legendFontSize: 15,
          percentage: item.percentage
        }));
        setDefectTypeData(chartData);
      })
      .catch((err) => {
        setDefectTypeError(err instanceof Error ? err.message : 'Failed to fetch defect type breakdown');
        setDefectTypeData([]);
        setDefectTypeTotal(0);
        setDefectTypeMostCommon('');
        setDefectTypeMostCommonCount(0);
      })
      .finally(() => setDefectTypeLoading(false));
  }, [project?.project_id]);

  // Fetch defect density on project change
  useEffect(() => {
    if (!project?.project_id) return;
    setDefectDensityLoading(true);
    setDefectDensityError(null);
    projectAPI.getDefectDensity(project.project_id)
      .then((data) => {
        setDefectDensityData(data);
      })
      .catch((err) => {
        setDefectDensityError(err instanceof Error ? err.message : 'Failed to fetch defect density');
        setDefectDensityData(null);
      })
      .finally(() => setDefectDensityLoading(false));
  }, [project?.project_id]);

  useLayoutEffect(() => {
    navigation.setOptions({
       headerTitle: () => (
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#222',marginLeft: -25 }}>Back</Text>
            ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginRight: 16 }} onPress={() => {/* handle notification press */}}>
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
      console.log(fetchedProjects);
      
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
  const defectData = DEFECT_DATA[project.name as DefectDataKey] || DEFECT_DATA['Defect Tracker'];

  const scrollToProject = (dir: 'left' | 'right') => {
    if (dir === 'left' && selectedProjectIdx > 0) setSelectedProjectIdx(selectedProjectIdx - 1);
    if (dir === 'right' && selectedProjectIdx < projectsToUse.length - 1) setSelectedProjectIdx(selectedProjectIdx + 1);
  };

  return (
    <ScrollView style={styles.bg} contentContainerStyle={{ paddingBottom: 32 }}>

      

      

      {/* Time to Fix Defects Card (at the end) */}
      {/* ...existing code... */}
      {/* API Status Indicator */}
      {/* {apiProjects.length > 0 && (
        <View style={styles.apiStatusCard}> */}
          {/* <Text style={styles.apiStatusText}>
            📊 Live API Data ({apiProjects.length} projects)
          </Text> */}
        {/* </View>
      )} */}

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

      {/* Project Selection */}
      <View style={styles.projectSelectorBox}>
        <Text style={styles.projectSelectorLabel}>
          Project Selection
          {loading && <Text style={styles.loadingIndicator}> (Loading...)</Text>}
        </Text>
        <View style={styles.projectSelectorRow}>
          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={() => scrollToProject('left')}
            disabled={selectedProjectIdx === 0}
          >
            <Text style={[styles.arrowText, selectedProjectIdx === 0 && { opacity: 0.3 }]}>{'<'}</Text>
          </TouchableOpacity>
          <FlatList
            data={projectsToUse}
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
            disabled={selectedProjectIdx === projectsToUse.length - 1}
          >
            <Text style={[styles.arrowText, selectedProjectIdx === projectsToUse.length - 1 && { opacity: 0.3 }]}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Project Title & Status */}
      <View style={styles.projectTitleBox}>
        <Text style={styles.projectTitle}>{project.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: RISK_COLORS[project.risk as 'High' | 'Medium' | 'Low'] + '22' }]}> 
          <Text style={[styles.statusBadgeText, { color: RISK_COLORS[project.risk as 'High' | 'Medium' | 'Low'] }]}>{RISK_LABELS[project.risk as 'High' | 'Medium' | 'Low']}</Text>
        </View>
      </View>

      {/* Defect Severity Breakdown */}
      <Text style={styles.sectionTitle}>Defect Severity Breakdown</Text>
      {defectSeverityBreakdownLoading ? (
        <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading severity breakdown...</Text></View>
      ) : defectSeverityBreakdownError ? (
        <View style={styles.errorContainer}><Text style={styles.errorText}>Error: {defectSeverityBreakdownError}</Text></View>
      ) : defectSeverityBreakdown ? (
        <View style={styles.defectRow}>
          {defectSeverityBreakdown.defectSummary.map((item) => (
            <View key={item.severity} style={[styles.defectCard, { borderColor: item.Severity_color }]}> 
              <Text style={[styles.defectCardTitle, { color: item.Severity_color }]}>Defects on {item.severity}</Text>
              <Text style={styles.defectTotal}>Total: {item.total}</Text>
              <View style={styles.defectList}>
                {Object.entries(item.statuses)
                  .filter(([k]) => !k.endsWith('_color'))
                  .map(([type, count]) => {
                    // Map status to color
                    let color = '#888';
                    switch (type.toUpperCase()) {
                      case 'REOPEN': color = '#fb5607'; break;
                      case 'NEW': color = '#4361ee'; break;
                      case 'OPEN': color = '#f9c74f'; break;
                      case 'FIXED': color = '#43aa8b'; break;
                      case 'CLOSED': color = '#577590'; break;
                      case 'REJECT': color = '#bc3908'; break;
                      case 'DUPLICATE': color = '#888888'; break;
                      default:
                        // fallback to API color if available
                        color = item.statuses[type + '_color'] || '#888';
                    }
                    return (
                      <View key={type} style={styles.defectItemRow}>
                        <View style={[styles.dot, { backgroundColor: color }]} />
                        <Text style={styles.defectType}>{type}</Text>
                        <Text style={styles.defectCount}>{count}</Text>
                      </View>
                    );
                  })}
              </View>
              <TouchableOpacity style={styles.chartBtn} onPress={() => {
                if (item.severity === 'High') setShowHighStatusModal(true);
                if (item.severity === 'Medium') setShowMediumStatusModal(true);
                if (item.severity === 'Low') setShowLowStatusModal(true);
              }}>
                <Text style={styles.chartBtnText}>View Chart</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ color: '#888', fontSize: 16 }}>No severity breakdown data available</Text>
      )}

      {/* Defect Density Card */}
      <Text style={styles.sectionTitle}>Defect Density Analysis</Text>
      <View style={styles.densityCard}>
        <Text style={styles.densityCardTitle}>Project Defect Density</Text>
        {/* Defect Density Meter (Speedometer) */}
        <View style={styles.speedometerContainer}>
          <View style={styles.speedometer}>
            <CustomSpeedometer
              value={defectDensityData?.defectDensity ?? 0}
              size={200}
              minValue={0}
              maxValue={1}
            />
          </View>
        </View>
        {defectDensityLoading ? (
          <Text style={{ color: '#888', fontSize: 16 }}>Loading...</Text>
        ) : defectDensityError ? (
          <Text style={{ color: '#ef4444', fontSize: 16 }}>{defectDensityError}</Text>
        ) : defectDensityData ? (
          <>
            {/* <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#222', marginTop: 8 }}>
              {defectDensityData.defectDensity}
            </Text> */}
            <View style={{ borderBottomWidth: 1, borderBottomColor: '#eee', marginVertical: 12, width: '100%' }} />
            <View style={styles.densityMetrics}>
              <View style={styles.densityMetric}>
                <Text style={styles.metricValue}>{defectDensityData.totalDefects}</Text>
                <Text style={styles.metricLabel}>Total Defects</Text>
              </View>
              <View style={styles.densityMetric}>
                <Text style={styles.metricValue}>
                  {defectDensityData.linesOfCode ? (defectDensityData.linesOfCode / 1000).toFixed(1) + 'K' : '--'}
                </Text>
                <Text style={styles.metricLabel}>Lines of Code</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={{ color: '#888', fontSize: 16 }}>No data available</Text>
        )}
      </View>

      {/* Modal for Medium Status Breakdown Pie Chart */}
      <Modal
        visible={showMediumStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMediumStatusModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, minWidth: 240, maxWidth: 280, alignItems: 'center', elevation: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>Status Breakdown for Medium</Text>
              <TouchableOpacity onPress={() => setShowMediumStatusModal(false)}>
                <Text style={{ fontSize: 22, color: '#888', marginLeft: 12 }}>×</Text>
              </TouchableOpacity>
            </View>
            <PieChart
              data={[
                { name: 'REOPEN', population: 1, color: '#fb5607', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'NEW', population: 5, color: '#4361ee', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'OPEN', population: 2, color: '#f9c74f', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'FIXED', population: 3, color: '#43aa8b', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'CLOSED', population: 4, color: '#577590', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'REJECTED', population: 1, color: '#bc3908', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'DUPLICATE', population: 1, color: '#888888', legendFontColor: '#222', legendFontSize: 13 },
              ]}
              width={260}
              height={220}
              chartConfig={{
                color: () => '#222',
                labelColor: () => '#222',
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
              }}
              accessor={'population'}
              backgroundColor={'transparent'}
              paddingLeft={'40'}
              hasLegend={false}
              absolute
              style={{ marginVertical: 8, alignSelf: 'center' }}
            />
            {/* Custom Legend */}
            <View style={{ marginTop: 12, width: 220 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#fb5607', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>REOPEN</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#4361ee', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>NEW</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#f9c74f', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>OPEN</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#43aa8b', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>FIXED</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#577590', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>CLOSED</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#bc3908', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>REJECTED</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#888888', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>DUPLICATE</Text></View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for Low Status Breakdown Pie Chart */}
      <Modal
        visible={showLowStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLowStatusModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, minWidth: 240, maxWidth: 280, alignItems: 'center', elevation: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>Status Breakdown for Low</Text>
              <TouchableOpacity onPress={() => setShowLowStatusModal(false)}>
                <Text style={{ fontSize: 22, color: '#888', marginLeft: 12 }}>×</Text>
              </TouchableOpacity>
            </View>
            <PieChart
              data={[
                { name: 'REOPEN', population: 1, color: '#fb5607', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'NEW', population: 3, color: '#4361ee', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'OPEN', population: 1, color: '#f9c74f', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'FIXED', population: 2, color: '#43aa8b', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'CLOSED', population: 2, color: '#577590', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'REJECTED', population: 0, color: '#bc3908', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'DUPLICATE', population: 0, color: '#888888', legendFontColor: '#222', legendFontSize: 13 },
              ]}
              width={260}
              height={220}
              chartConfig={{
                color: () => '#222',
                labelColor: () => '#222',
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
              }}
              accessor={'population'}
              backgroundColor={'transparent'}
              paddingLeft={'40'}
              hasLegend={false}
              absolute
              style={{ marginVertical: 8, alignSelf: 'center' }}
            />
            {/* Custom Legend */}
            <View style={{ marginTop: 12, width: 220 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#fb5607', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>REOPEN</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#4361ee', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>NEW</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#f9c74f', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>OPEN</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#43aa8b', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>FIXED</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#577590', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>CLOSED</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#bc3908', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>REJECTED</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#888888', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>DUPLICATE</Text></View>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal for High Status Breakdown Pie Chart */}
      <Modal
        visible={showHighStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHighStatusModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, minWidth: 240, maxWidth: 280, alignItems: 'center', elevation: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>Status Breakdown for High</Text>
              <TouchableOpacity onPress={() => setShowHighStatusModal(false)}>
                <Text style={{ fontSize: 22, color: '#888', marginLeft: 12 }}>×</Text>
              </TouchableOpacity>
            </View>
            <PieChart
              data={[
                { name: 'REOPEN', population: 2, color: '#fb5607', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'NEW', population: 7, color: '#4361ee', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'OPEN', population: 3, color: '#f9c74f', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'FIXED', population: 4, color: '#43aa8b', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'CLOSED', population: 5, color: '#577590', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'REJECTED', population: 1, color: '#bc3908', legendFontColor: '#222', legendFontSize: 13 },
                { name: 'DUPLICATE', population: 1, color: '#888888', legendFontColor: '#222', legendFontSize: 13 },
              ]}
              width={260}
              height={220}
              chartConfig={{
                color: () => '#222',
                labelColor: () => '#222',
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
              }}
              accessor={'population'}
              backgroundColor={'transparent'}
              paddingLeft={'40'}
              hasLegend={false}
              absolute
              style={{ marginVertical: 8, alignSelf: 'center' }}
            />
            {/* Custom Legend */}
            <View style={{ marginTop: 12, width: 220 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#fb5607', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>REOPEN</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#4361ee', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>NEW</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#f9c74f', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>OPEN</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#43aa8b', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>FIXED</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#577590', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>CLOSED</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#bc3908', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>REJECTED</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><View style={{ width: 18, height: 8, backgroundColor: '#888888', marginRight: 8 }} /><Text style={{ fontSize: 13 }}>DUPLICATE</Text></View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Defect Metrics Cards (Image-like) */}
        <View style={styles.metricsRow}>

          {/* Defect Severity Index Card */}
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Defect Severity Index</Text>
            <View style={styles.severityIndexContainer}>
              <View style={styles.severityBarBg}>
                <View style={[styles.severityBarFill, { height: severityIndex !== null ? `${severityIndex}%` : '0%' }]} />
              </View>
              <Text style={styles.metricSeverityValue}>
                {severityIndexLoading ? '...' : severityIndexError ? '--' : severityIndex !== null ? severityIndex : '--'}
              </Text>
            </View>
            <Text style={styles.metricDesc}>Weighted severity score (higher = more severe defects)</Text>
            {severityIndexError && (
              <Text style={{ color: '#ef4444', fontSize: 13, marginTop: 4 }}>{severityIndexError}</Text>
            )}
          </View>
          {/* ...Defect to Remark Ratio Card removed... */}
        </View>


  {/* Defect to Remark Ratio Card (dynamic, API-powered) */}
{  console.log(project)}
  
  <DefectRemarkRatioCard projectId={project.project_id} />
   {/* Defects Reopened Multiple Times Card (below defect to remark ratio card) */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16, marginTop: 8, alignItems: 'center', elevation: 2 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#222', marginBottom: 12, alignSelf: 'flex-start' }}>Defects Reopened Multiple Times</Text>
        <PieChart
          data={[
            { name: '2 times', population: 3, color: '#2563eb', legendFontColor: '#2563eb', legendFontSize: 15 },
            { name: '3 times', population: 1, color: '#facc15', legendFontColor: '#facc15', legendFontSize: 15 },
          ]}
          width={320}
          height={220}
          chartConfig={{
            color: () => '#222',
            labelColor: () => '#222',
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 1,
          }}
          accessor={'population'}
          backgroundColor={'transparent'}
          paddingLeft={'40'}
          hasLegend={false}
          absolute
        />
        {/* Custom Legend */}
        <View style={{ marginTop: 12, width: 220 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#2563eb', marginRight: 8 }} />
            <Text style={{ fontSize: 15, color: '#2563eb', fontWeight: 'bold' }}>2 times: 3 <Text style={{ color: '#888', fontWeight: 'normal' }}>(75.0%)</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#facc15', marginRight: 8 }} />
            <Text style={{ fontSize: 15, color: '#facc15', fontWeight: 'bold' }}>3 times: 1 <Text style={{ color: '#888', fontWeight: 'normal' }}>(25.0%)</Text></Text>
          </View>
        </View>
      </View>
      {/* Defect Distribution by Type Card */}
      <View style={styles.distributionCard}>
        <Text style={styles.distributionTitle}>Defect Distribution by Type</Text>
        {defectTypeLoading ? (
          <Text style={{ color: '#888', fontSize: 16, marginVertical: 16 }}>Loading...</Text>
        ) : defectTypeError ? (
          <Text style={{ color: '#ef4444', fontSize: 16, marginVertical: 16 }}>Error: {defectTypeError}</Text>
        ) : (
          <PieChart
            data={defectTypeData.length > 0 ? defectTypeData : [
              { name: 'No Data', population: 1, color: '#e5e7eb', legendFontColor: '#222', legendFontSize: 15 }
            ]}
            width={Dimensions.get('window').width - 48}
            height={220}
            chartConfig={{
              color: () => '#222',
              labelColor: () => '#222',
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 1,
            }}
            accessor={'population'}
            backgroundColor={'transparent'}
            paddingLeft={'80'}
            hasLegend={false}
            absolute
          />
        )}
        
        {/* Custom Legend */}
        <View style={styles.legendBox}>
          {defectTypeData.length > 0 ? defectTypeData.map((item, idx) => (
            <View key={item.name} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.name}: {item.population} ({item.percentage}%)</Text>
            </View>
          )) : (
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#e5e7eb' }]} />
              <Text style={styles.legendLabel}>No Data</Text>
            </View>
          )}
        </View>
        {/* Totals Row */}
        <View style={styles.distributionTotalsRow}>
          <View style={styles.distributionTotalBox}>
            <Text style={styles.distributionTotalValue}>{defectTypeTotal}</Text>
            <Text style={styles.distributionTotalLabel}>Total Defects</Text>
          </View>
          <View style={styles.distributionTotalBox}>
            <Text style={[styles.distributionTotalValue, { color: defectTypeData[0]?.color || '#2563eb' }]}>{defectTypeMostCommonCount}</Text>
            <Text style={styles.distributionTotalLabel}>
              Most Common{"\n"}
              <Text style={{ fontWeight: 'bold' }}>{defectTypeMostCommon}</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Time to Find Defects Card (now after distribution card) */}
      <View style={styles.timeToFindCard}>
        <Text style={styles.timeToFindTitle}>Time to Find Defects</Text>
        <LineChart
          data={{
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10'],
            datasets:
              [{
                data: [2, 3, 1, 4, 2, 3, 2, 1, 2, 1],
                color: () => '#2563eb',
                strokeWidth: 2,
              }],
          }}
          width={Dimensions.get('window').width - 48}
          height={220}
          yAxisSuffix={''}
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: () => '#2563eb',
            labelColor: () => '#222',
            propsForLabels: {
              fontSize: 8,
              fontWeight: '400',
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#fff',
              fill: '#2563eb',
            },
            propsForBackgroundLines: {
              stroke: '#e5e7eb',
            },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 12 }}
          fromZero
          segments={5}
          yLabelsOffset={8}
          xLabelsOffset={-4}
          withInnerLines
          withOuterLines
          withDots
        />
        <View style={styles.timeToFindAxisLabels}>
          <Text style={styles.timeToFindYAxis}>Defects Count</Text>
          <Text style={styles.timeToFindXAxis}>Time (Day)</Text>
        </View>
      </View>
      {/* Time to Fix Defects Card (after Time to Find Defects) */}
      <View style={styles.timeToFindCard}>
        <Text style={styles.timeToFixTitle}>Time to Fix Defects</Text>
        <LineChart
          data={{
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10'],
            datasets:
              [{
                data: [3, 2, 4, 3, 2, 3, 2, 2, 1, 2],
                color: () => '#14b8a6',
                strokeWidth: 2,
              }],
          }}
          width={Dimensions.get('window').width - 48}
          height={220}
          yAxisSuffix={''}
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: () => '#14b8a6',
            labelColor: () => '#222',
            propsForLabels: {
              fontSize: 8,
              fontWeight: '400',
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#fff',
              fill: '#14b8a6',
            },
            propsForBackgroundLines: {
              stroke: '#e5e7eb',
            },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 12 }}
          fromZero
          segments={5}
          yLabelsOffset={8}
          xLabelsOffset={-4}
          withInnerLines
          withOuterLines
          withDots
        />
        <View style={styles.timeToFindAxisLabels}>
          <Text style={styles.timeToFindYAxis}>Defects Count</Text>
          <Text style={styles.timeToFindXAxis}>Time (Day)</Text>
        </View>
      </View>
      {/* Defects by Module Card (now last, API integrated) */}
      <View style={styles.fixDefectCard}>
        <Text style={styles.fixDefectTitle}>Defects by Module</Text>
        {defectModuleLoading ? (
          <Text style={{ color: '#888', fontSize: 16, marginVertical: 16 }}>Loading...</Text>
        ) : defectModuleError ? (
          <Text style={{ color: '#ef4444', fontSize: 16, marginVertical: 16 }}>Error: {defectModuleError}</Text>
        ) : (
          <>
            <PieChart
              data={defectModuleData.length > 0 ? defectModuleData : [
                { name: 'No Data', population: 1, color: '#e5e7eb', legendFontColor: '#222', legendFontSize: 15 }
              ]}
              width={Dimensions.get('window').width - 48}
              height={260}
              chartConfig={{
                color: () => '#222',
                labelColor: () => '#222',
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 2,
              }}
              accessor={'population'}
              backgroundColor={'transparent'}
              paddingLeft={'80'}
              hasLegend={false}
              absolute
            />
            {/* Custom Legend Below Pie Chart */}
            <View style={styles.legendBox}>
              {defectModuleData.length > 0 ? defectModuleData.map((item, idx) => (
                <View key={item.name} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>
                    {item.name}: <Text style={{ fontWeight: 'bold' }}>{item.population}</Text>
                    <Text style={{ color: '#888', fontSize: 15 }}> ({item.percentage ? item.percentage.toFixed(2) : '0.00'}%)</Text>
                  </Text>
                </View>
              )) : (
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: '#e5e7eb' }]} />
                  <Text style={styles.legendLabel}>No Data</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 260,
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
    marginBottom: 12,
    alignItems: 'center',
    padding: 22,
    elevation: 2,
  },
  metricTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 8,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  gaugeArc: {
    width: 90,
    height: 50,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    borderWidth: 8,
    borderColor: '#22c55e', // left (green)
    borderBottomWidth: 0,
    borderRightColor: '#ef4444', // right (red)
    borderLeftColor: '#22c55e', // left (green)
    borderTopColor: '#eab308', // top (yellow)
    backgroundColor: '#fff',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  gaugeNeedle: {
    position: 'absolute',
    left: '50%',
    bottom: 0,
    width: 2,
    height: 38,
    backgroundColor: '#222',
    borderRadius: 1,
    marginLeft: -1,
    zIndex: 2,
  },
  metricValueLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 2,
  },
  severityIndexContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  severityBarBg: {
    width: 16,
    height: 60,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  severityBarFill: {
    width: 16,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  metricSeverityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ef4444',
    marginLeft: 4,
  },
  metricDesc: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginTop: 2,
  },
  ratioCardBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 4,
  },
  ratioValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  ratioLabel: {
    fontSize: 15,
    color: '#222',
    marginBottom: 4,
  },
  ratioCriticalBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 6,
  },
  ratioCriticalText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ratioBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
    marginTop: 2,
    marginBottom: 2,
    overflow: 'hidden',
  },
  ratioBarFill: {
    width: '100%',
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  bg: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    marginTop: 24,
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
    fontSize: 18,
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
    fontSize: 14,
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
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendBox: {
    marginTop: 12,
    marginHorizontal: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
  },
  reopenedCard: {
    flex: 1,
    minWidth: 220,
    maxWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
    marginBottom: 12,
    alignItems: 'center',
    padding: 18,
    elevation: 2,
  },
  reopenedTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  distributionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    elevation: 2,
    alignItems: 'center',
  },
  distributionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  distributionTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 18,
    paddingHorizontal: 12,
  },
  distributionTotalBox: {
    alignItems: 'center',
    flex: 1,
  },
  distributionTotalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
  },
  distributionTotalLabel: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 2,
  },
  timeToFindCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    elevation: 2,
    alignItems: 'center',
  },
  timeToFindTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  timeToFindAxisLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  timeToFindYAxis: {
    fontSize: 13,
    color: '#222',
    fontWeight: 'bold',
  },
  timeToFindXAxis: {
    fontSize: 13,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  fixDefectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    elevation: 2,
    alignItems: 'center',
  },
  fixDefectTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
    marginBottom: 12,
    alignSelf: 'center',
  },
  fixDefectLegendBox: {
    marginTop: 16,
    marginBottom: 8,
    width: '100%',
    alignSelf: 'center',
  },
  fixDefectLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 8,
  },
  // Speedometer styles
  densityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  densityCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  speedometerContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  speedometer: {
    marginBottom: 8,
  },
  speedometerWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedometerCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -25 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedometerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  speedometerUnit: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  densityInfo: {
    alignItems: 'center',
    marginTop: -20,
  },
  densityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  densityLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  densityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  densityMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  apiStatusCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  apiStatusText: {
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
  loadingIndicator: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
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
});

export default ProjectOverviewScreen;



type RemarkRatioData = {
  ratio: string;
  category: string;
  color: string;
  defectsCount: number;
  remarksCount: number;
};

interface DefectRemarkRatioCardProps {
  projectId: string;
}

const DefectRemarkRatioCard: React.FC<DefectRemarkRatioCardProps> = ({ projectId }) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<RemarkRatioData | null>(null);
console.log("jjj");

  const fetchRatio = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await projectAPI.getRemarkRatio(projectId);
      console.log(result);
      
      // Ensure the result matches the expected type
      setData({
        ratio: typeof result.ratio === 'number' ? `${result.ratio}%` : result.ratio ?? '--',
        category: result.category ?? result.status ?? '--',
        color: result.color ?? '',
        defectsCount: result.defectsCount ?? result.defects ?? '--',
        remarksCount: result.remarksCount ?? result.remarks ?? '--',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch defect to remark ratio');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRatio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 18, marginVertical: 8, marginHorizontal: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>Defect to Remark Ratio</Text>
        <TouchableOpacity onPress={fetchRatio} style={{ padding: 4 }}>
          <Text style={{ fontSize: 18, color: '#b45309' }}>⟳</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text style={{ fontSize: 18, color: '#b45309', marginBottom: 8 }}>Loading...</Text>
      ) : error ? (
        <Text style={{ fontSize: 14, color: '#ef4444', marginBottom: 8 }}>{error}</Text>
      ) : data ? (
        <>
          <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#b45309', marginBottom: 2 }}>{data.ratio || '--'}</Text>
          <Text style={{ fontSize: 15, color: '#b45309', marginBottom: 8 }}>Defect to Remark Ratio (%)</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ alignItems: 'center', marginRight: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#b45309' }}>{data.defectsCount ?? '--'}</Text>
              <Text style={{ fontSize: 14, color: '#b45309' }}>Defects</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#b45309' }}>{data.remarksCount ?? '--'}</Text>
              <Text style={{ fontSize: 14, color: '#b45309' }}>Remarks</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <View style={{ backgroundColor: '#fde68a', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 4 }}>
              <Text style={{ color: '#b45309', fontWeight: 'bold', fontSize: 16 }}>{data.category || '--'}</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={{ fontSize: 18, color: '#b45309', marginBottom: 8 }}>No data available</Text>
      )}
    </View>
  );
};