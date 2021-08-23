/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import type {Node} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  Image,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

import * as ImagePicker from 'react-native-image-picker';
import Moment from 'moment';
import JSONTree from 'react-native-json-tree';
import Config from 'react-native-config';

const Section = ({children, title}): Node => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [receipt, setReceipt] = useState(null);
  const [slip, setSlip] = useState(null);
  const [logs, setLogs] = useState([]);
  const [jsonResult, setJsonResult] = useState({});
  const [running, setRunning] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  const renderFileData = data => {
    if (data) {
      return (
        <View>
          <Image
            source={{uri: 'data:image/png;base64,' + data}}
            style={styles.images}
          />
          <Text
            style={{
              color: isDarkMode ? Colors.white : Colors.dark,
              textAlign: 'center',
            }}>
            {Math.round((data.length * (3 / 4) - 2) / 1000)} KB
          </Text>
        </View>
      );
    }
  };

  const getResult = (token, retry = 0, retryLimit = 3) => {
    setJsonResult({});
    setRunning(true);
    if (retry > 0) {
      log('retry get result: ' + retry);
    } else {
      log('start get result');
    }

    fetch(Config.API_URL + '/result/' + token, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'sampras-api-key': Config.API_KEY,
      },
      timeout: 3000,
    })
      .then(response => response.json())
      .then(data => {
        console.log('Success:', data);
        setJsonResult(data);
        if (data.meta.code === 200) {
          log('result available');
          setRunning(false);
        } else if (data.meta.code === 5031) {
          log('result pending');
          if (retry < retryLimit) {
            setTimeout(function () {
              getResult(token, retry + 1);
            }, 1000);
          } else {
            log('retry limit exceeded');
            setRunning(false);
          }
        } else {
          log('result fail: ' + JSON.stringify(data));
          setRunning(false);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        setRunning(false);
        log('result error');
      });
  };

  const process = () => {
    log('start upload');
    setRunning(true);
    fetch(Config.API_URL + '/process', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'sampras-api-key': Config.API_KEY,
      },
      body: JSON.stringify({
        receiptType: ['shop', 'slip'],
        imageFile: [receipt, slip],
        customId: 'tester',
      }),
      compress: true,
    })
      .then(response => response.json())
      .then(data => {
        setJsonResult(data);
        if (data.data && data.data.token) {
          log('upload success');
          getResult(data.data.token);
        } else if (data.meta && data.meta.message) {
          log('upload fail: ' + data.meta.code + ' - ' + data.meta.message);
        } else {
          log('upload fail: ' + JSON.stringify(data));
        }
      })
      .catch(error => {
        log('upload error');
        setRunning(false);
        console.log(error);
      });
  };
  const log = msg => {
    setLogs(logs => [
      ...logs,
      {time: Moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SS'), msg},
    ]);
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.ImageSections}>
        <View>
          <Text
            style={{
              color: isDarkMode ? Colors.white : Colors.dark,
              textAlign: 'center',
            }}>
            Receipt
          </Text>
          {receipt && renderFileData(receipt)}
          <View style={{margin: 5}}>
            <Button
              title="Choose Receipt"
              onPress={() => {
                ImagePicker.launchImageLibrary(
                  {
                    mediaType: 'photo',
                    includeBase64: true,
                    maxHeight: 1280,
                    maxWidth: 720,
                  },
                  response => {
                    setReceipt(
                      response && response.assets
                        ? response.assets[0]?.base64
                        : null,
                    );
                  },
                );
              }}
            />
          </View>
          <View style={{margin: 5}}>
            <Button
              title="Take Receipt Photo"
              onPress={() => {
                ImagePicker.launchCamera(
                  {
                    mediaType: 'photo',
                    includeBase64: true,
                    maxHeight: 1280,
                    maxWidth: 720,
                  },
                  response => {
                    setReceipt(
                      response && response.assets
                        ? response.assets[0]?.base64
                        : null,
                    );
                  },
                );
              }}
            />
          </View>
        </View>
        <View>
          <Text
            style={{
              color: isDarkMode ? Colors.white : Colors.dark,
              textAlign: 'center',
            }}>
            Slip
          </Text>
          {slip && renderFileData(slip)}
          <View style={{margin: 5}}>
            <Button
              title="Choose Slip"
              onPress={() => {
                ImagePicker.launchImageLibrary(
                  {
                    mediaType: 'photo',
                    includeBase64: true,
                    maxHeight: 1280,
                    maxWidth: 720,
                  },
                  response => {
                    setSlip(
                      response && response.assets
                        ? response.assets[0]?.base64
                        : null,
                    );
                  },
                );
              }}
            />
          </View>
          <View style={{margin: 5}}>
            <Button
              title="Take Slip Photo"
              onPress={() =>
                ImagePicker.launchCamera(
                  {
                    mediaType: 'photo',
                    includeBase64: true,
                    maxHeight: 1280,
                    maxWidth: 720,
                  },
                  response => {
                    setSlip(
                      response && response.assets
                        ? response.assets[0]?.base64
                        : null,
                    );
                  },
                )
              }
            />
          </View>
        </View>
      </View>
      <View style={styles.ImageSections}>
        <View style={{alignItems: 'flex-end', width: '60%'}}>
          <Button
            title="Upload"
            style={styles.button}
            onPress={process}
            disabled={running || receipt == null || slip == null}
          />
        </View>
        <View style={{alignItems: 'flex-end', width: '40%'}}>
          <Button
            title="Clear"
            style={styles.button}
            onPress={() => {
              setLogs([]);
              setJsonResult({});
            }}
          />
        </View>
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        {jsonResult.data && (
          <JSONTree data={jsonResult} shouldExpandNode={root => true} />
        )}
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          {logs
            .sort((a, b) => (a.time < b.time ? 1 : b.time < a.time ? -1 : 0))
            .map((msg, i) => {
              return (
                <Text
                  key={i}
                  style={{color: isDarkMode ? Colors.white : Colors.dark}}>
                  {msg.time} {msg.msg}
                </Text>
              );
            })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  images: {
    width: 150,
    height: 150,
    borderColor: 'black',
    borderWidth: 1,
    marginHorizontal: 3,
  },
  ImageSections: {
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    color: '#FFFFFF',
    backgroundColor: '#007AFF',
    padding: 10,
  },
});

export default App;
