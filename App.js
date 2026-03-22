// App.js
import React, { useCallback, useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

import HomeScreen from "./src/screens/HomeScreen";
import GameScreen from "./src/screens/GameScreen";
import PalSelectScreen from "./src/screens/PalSelectScreen";
import ParentScreen from "./src/screens/ParentScreen";
import JournalScreen from "./src/screens/JournalScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import FeelingOfDayScreen from "./src/screens/FeelingOfDayScreen";
import BottomNav from "./src/components/BottomNav";

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

// Helper — reads active route name from nav state
function getActiveRouteName(state) {
  if (!state) return "Home";
  const route = state.routes[state.index];
  if (route.state) return getActiveRouteName(route.state);
  return route.name;
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [currentRoute, setCurrentRoute] = useState("Home");
  const navigationRef = useRef(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          Baloo2_800ExtraBold: require("./node_modules/@expo-google-fonts/baloo-2/Baloo2_800ExtraBold.ttf"),
          Baloo2_900Black: require("./node_modules/@expo-google-fonts/baloo-2/Baloo2_900Black.ttf"),
          Nunito_400Regular: require("./node_modules/@expo-google-fonts/nunito/Nunito_400Regular.ttf"),
          Nunito_700Bold: require("./node_modules/@expo-google-fonts/nunito/Nunito_700Bold.ttf"),
          Nunito_800ExtraBold: require("./node_modules/@expo-google-fonts/nunito/Nunito_800ExtraBold.ttf"),
        });
      } catch (e) {
        console.warn("Font load error:", e);
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#e8f4fd",
        }}
      >
        <ActivityIndicator size="large" color="#4D96FF" />
        <Text style={{ marginTop: 12, color: "#4a5568", fontWeight: "700" }}>
          Loading Pal Feelings...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <NavigationContainer
            ref={navigationRef}
            onStateChange={(state) => {
              const name = getActiveRouteName(state);
              setCurrentRoute(name);
            }}
          >
            <View style={{ flex: 1 }}>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  animation: "slide_from_right",
                  contentStyle: { backgroundColor: "transparent" },
                }}
              >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen
                  name="Game"
                  component={GameScreen}
                  options={{ animation: "slide_from_bottom" }}
                />
                <Stack.Screen name="PalSelect" component={PalSelectScreen} />
                <Stack.Screen name="Parent" component={ParentScreen} />
                <Stack.Screen name="Journal" component={JournalScreen} />
                <Stack.Screen
                  name="Leaderboard"
                  component={LeaderboardScreen}
                />
                <Stack.Screen
                  name="FeelingOfDay"
                  component={FeelingOfDayScreen}
                />
              </Stack.Navigator>

              {/* BottomNav sits outside the stack but inside NavigationContainer */}
              <BottomNav
                navigation={navigationRef}
                currentRoute={currentRoute}
              />
            </View>
          </NavigationContainer>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
