import { Tabs } from 'expo-router';
import { ChefHat } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '献立提案',
          tabBarIcon: ({ size, color }) => (
            <ChefHat size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
