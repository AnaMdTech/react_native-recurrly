import { Link, router } from 'expo-router'
import { useAuth, useClerk, useSignIn } from '@clerk/expo'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native'
import { useEffect, useState } from 'react'
import { usePostHog } from 'posthog-react-native'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SignIn = () => {
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { signIn } = useSignIn()
  const { setActive } = useClerk()
  const posthog = usePostHog()
  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace('/(tabs)')
    }
  }, [authLoaded, isSignedIn])

  const validate = () => {
    const trimmedEmail = emailAddress.trim().toLowerCase()
    let isValid = true

    if (!emailPattern.test(trimmedEmail)) {
      setEmailError('Enter a valid email address')
      isValid = false
    } else {
      setEmailError('')
    }

    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      isValid = false
    } else {
      setPasswordError('')
    }

    return isValid
  }

  const handleSignIn = async () => {
    if (!signIn) {
      return
    }

    setFormError('')

    if (!validate()) {
      return
    }

    setSubmitting(true)

    try {
      const result = await signIn.create({
        identifier: emailAddress.trim().toLowerCase(),
        password,
      })

      if (result.error) {
        throw result.error
      }

      if (signIn.status === 'complete' && signIn.createdSessionId) {
        await setActive({ session: signIn.createdSessionId })
        posthog.capture('sign_in_completed')
        router.replace('/(tabs)')
        return
      }

      setFormError('Your account needs additional verification before you can continue.')
    } catch (error: any) {
      setFormError(error?.errors?.[0]?.message || error?.message || 'We could not sign you in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!authLoaded) {
    return (
      <SafeAreaView className="auth-safe-area">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ea7a53" />
        </View>
      </SafeAreaView>
    )
  }

  if (isSignedIn) {
    return null
  }

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="auth-screen"
      >
        <ScrollView showsVerticalScrollIndicator={false} className="auth-scroll">
          <View className="auth-content">
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <Text className="auth-logo-mark-text">R</Text>
                </View>
                <View>
                  <Text className="auth-wordmark">Recurrly</Text>
                  <Text className="auth-wordmark-sub">Subscriptions</Text>
                </View>
              </View>
            </View>

            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">Sign in to continue managing your subscriptions</Text>

            <View className="auth-card">
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email</Text>
                  <TextInput
                    value={emailAddress}
                    onChangeText={(value) => {
                      setEmailAddress(value)
                      setEmailError('')
                      setFormError('')
                    }}
                    className={`auth-input ${emailError ? 'auth-input-error' : ''}`}
                    placeholder="Enter your email"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {emailError ? <Text className="auth-error">{emailError}</Text> : null}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <TextInput
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value)
                      setPasswordError('')
                      setFormError('')
                    }}
                    className={`auth-input ${passwordError ? 'auth-input-error' : ''}`}
                    placeholder="Enter your password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {passwordError ? <Text className="auth-error">{passwordError}</Text> : null}
                </View>

                {formError ? <Text className="auth-error">{formError}</Text> : null}

                <Pressable
                  disabled={submitting}
                  onPress={handleSignIn}
                  className={`auth-button ${submitting ? 'auth-button-disabled' : ''}`}
                >
                  <Text className="auth-button-text">{submitting ? 'Signing in...' : 'Sign in'}</Text>
                </Pressable>

                <View className="auth-link-row">
                  <Text className="auth-link-copy">New to Recurly?</Text>
                  <Link href="/(auth)/sign-up" className="auth-link">
                    Create an account
                  </Link>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default SignIn