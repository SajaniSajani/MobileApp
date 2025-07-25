import React, { Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
  Text
} from 'react-native';

import RNSpeedometer from 'react-native-speedometer';

class SpeedometerTest extends Component {
  state = {
    value: 15,
  };

  onChange = (value: string) => this.setState({ value: parseInt(value) || 0 });

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Defect Density Speedometer Test</Text>
        <TextInput 
          placeholder="Speedometer Value" 
          style={styles.textInput} 
          onChangeText={this.onChange}
          value={this.state.value.toString()}
        />
        <View style={styles.speedometerContainer}>
          <RNSpeedometer 
            value={this.state.value} 
            size={200}
            minValue={0}
            maxValue={50}
            allowedDecimals={0}
            labels={[
              {
                name: 'Good',
                labelColor: '#00ff6b',
                activeBarColor: '#00ff6b',
              },
              {
                name: 'Medium',
                labelColor: '#f4ab44',
                activeBarColor: '#f4ab44',
              },
              {
                name: 'High',
                labelColor: '#ff2900',
                activeBarColor: '#ff2900',
              },
            ]}
            needleColor="#333"
          />
          <Text style={styles.valueText}>{this.state.value} Defects per KLOC</Text>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  textInput: {
    borderBottomWidth: 0.3,
    borderBottomColor: 'black',
    height: 40,
    fontSize: 16,
    marginVertical: 20,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  speedometerContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
});

export default SpeedometerTest;
