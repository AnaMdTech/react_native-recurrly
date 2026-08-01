import { Tabs, router } from "expo-router";
import { tabs } from "@/constants/data";
import { View, Image } from "react-native";
import { colors, components } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from '@clerk/expo';
import { useEffect } from 'react';

const tabBar = components.tabBar;
const TabLayout = () => {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/(auth)/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  const TabIcon = ( { focused, icon }: TabIconProps ) => {
    return (
      <View className="tabs-icon">
        <View className={focused ? 'tabs-pill tabs-active' : 'tabs-pill'}>
          <Image source={icon} className="tabs-glyph" />
        </View>
      </View>
    );
  };
  
  return (
    <Tabs initialRouteName="index" screenOptions={{ headerShown: false,  tabBarShowLabel: false, tabBarStyle: {
      position: 'absolute',
      bottom:Math.max(insets.bottom, tabBar.horizontalInset),
      height: tabBar.height,
      marginHorizontal: tabBar.horizontalInset,
      borderRadius: tabBar.radius,
      backgroundColor: colors.primary,
      borderTopWidth: 0,
      elevation: 0,
    },
    tabBarItemStyle: {
      paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6,
    },
    tabBarIconStyle: {
      width: tabBar.iconFrame,
      height: tabBar.iconFrame,
      alignItems: 'center',
    }
    }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={tab.icon} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
};

export default TabLayout