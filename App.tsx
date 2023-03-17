import 'react-native-gesture-handler';

import { View, StatusBar } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen'
import { ThemeProvider } from 'styled-components';
import * as Font from 'expo-font';
import {  } from 'react-native-screens'

import{
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold
} from '@expo-google-fonts/poppins'
import theme from './src/global/styles/theme';
import { Routes } from './src/routes/'
import { AuthProvider, useAuth } from './src/hooks/auth'


export default function App() {
  
  const [appIsReady, setAppIsReady] = useState(false)

  const { userStorageLoading } = useAuth()

  useEffect(()=>{
    async function load(){
      try{
        await SplashScreen.preventAutoHideAsync()
        await Font.loadAsync({
          Poppins_400Regular,
          Poppins_500Medium,
          Poppins_700Bold
        })
      }catch(e){
        console.warn(e)
      } finally {
        setAppIsReady(true)
      }
    } 

    load()
  }, [])

  const onLayoutRootView = useCallback(async () => {
    if(appIsReady || userStorageLoading){
      await SplashScreen.hideAsync()
    }
  }, [appIsReady])

  if(!appIsReady){
    return null;
  }


  return (
    <View
      onLayout={onLayoutRootView}
      style={{flex: 1}}
    >
      <ThemeProvider theme={theme}>
            <StatusBar barStyle="light-content" />
            <AuthProvider>
              <Routes/>
            </AuthProvider>
      </ThemeProvider>
    </View>
  )
}