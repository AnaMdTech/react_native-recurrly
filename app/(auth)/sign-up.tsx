import { View, Text } from 'react-native'
import { Link } from 'expo-router'

const SignUp = () => {
  return (
    <View>
      <Text>SignUp</Text>
      <Link href="/(auth)/sign-in">Sign In</Link>
      <Link href="/(tabs)">Go to Home</Link>
    </View>
  )
}

export default SignUp