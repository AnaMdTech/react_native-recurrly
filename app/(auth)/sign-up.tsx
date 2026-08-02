import { Link, router } from 'expo-router'
import { useAuth, useClerk, useSignUp } from '@clerk/expo'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native'
import { useEffect, useState } from 'react'
import { usePostHog } from 'posthog-react-native'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

const SignUp = () => {
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { signUp } = useSignUp()
  const { setActive } = useClerk()
  const posthog = usePostHog()
  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace('/(tabs)')
    }
  }, [authLoaded, isSignedIn])

  const validateForm = () => {
    const trimmedEmail = emailAddress.trim().toLowerCase()
    let isValid = true

    if (!emailPattern.test(trimmedEmail)) {
      setEmailError('Enter a valid email address')
      isValid = false
    } else {
      setEmailError('')
    }

    if (!password || !strongPasswordPattern.test(password)) {
      setPasswordError('Create a strong password with 8+ chars, uppercase, lowercase, number, and symbol')
      isValid = false
    } else {
      setPasswordError('')
    }

    return isValid
  }

  const handleCreateAccount = async () => {
    if (!signUp) {
      return
    }

    setFormError('')
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const createResult = await signUp.create({
        emailAddress: emailAddress.trim().toLowerCase(),
        password,
      })

      if (createResult.error) {
        throw createResult.error
      }

      const sendCodeResult = await signUp.verifications.sendEmailCode()
      if (sendCodeResult.error) {
        throw sendCodeResult.error
      }

      posthog.capture('sign_up_started')
      setStep('verify')
    } catch (error: any) {
      setFormError(error?.errors?.[0]?.message || error?.message || 'We could not create your account right now.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async () => {
    if (!signUp) {
      return
    }

    if (!code.trim()) {
      setVerificationError('Enter the verification code sent to your email')
      return
    }

    setVerificationError('')
    setSubmitting(true)

    try {
      const verifyResult = await signUp.verifications.verifyEmailCode({ code })
      if (verifyResult.error) {
        throw verifyResult.error
      }

      if (signUp.status === 'complete' && signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId })
        posthog.capture('sign_up_completed')
        router.replace('/(tabs)')
        return
      }

      setVerificationError('The verification code could not be completed. Please try again.')
    } catch (error: any) {
      setVerificationError(error?.errors?.[0]?.message || error?.message || 'We could not verify your account at the moment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    if (!signUp) {
      return
    }

    setResending(true)
    setVerificationError('')
    setResendMessage('')

    try {
      const resendResult = await signUp.verifications.sendEmailCode()
      if (resendResult.error) {
        throw resendResult.error
      }

      posthog.capture('verification_code_resent')
      setResendMessage('A fresh verification code has been sent to your email.')
    } catch (error: any) {
      setVerificationError(error?.errors?.[0]?.message || error?.message || 'We could not resend the verification code right now.')
    } finally {
      setResending(false)
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

            <Text className="auth-title">Create your account</Text>
            <Text className="auth-subtitle">Start tracking your subscription and never miss a payment.</Text>

            <View className="auth-card">
              <View className="auth-form">
                {step === 'form' ? (
                  <>
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
                        placeholder="Create a strong password"
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
                      onPress={handleCreateAccount}
                      className={`auth-button ${submitting ? 'auth-button-disabled' : ''}`}
                    >
                      <Text className="auth-button-text">{submitting ? 'Creating account...' : 'Create account'}</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View className="auth-field">
                      <Text className="auth-label">Verification code</Text>
                      <TextInput
                        value={code}
                        onChangeText={(value) => {
                          setCode(value)
                          setVerificationError('')
                        }}
                        className={`auth-input ${verificationError ? 'auth-input-error' : ''}`}
                        placeholder="Enter your verification code"
                        placeholderTextColor="#6b7280"
                        keyboardType="numeric"
                      />
                      <Text className="auth-link-copy">We sent the code to {emailAddress || 'your email'}.</Text>
                      {verificationError ? <Text className="auth-error">{verificationError}</Text> : null}
                    </View>

                    <Pressable
                      disabled={submitting}
                      onPress={handleVerify}
                      className={`auth-button ${submitting ? 'auth-button-disabled' : ''}`}
                    >
                      <Text className="auth-button-text">{submitting ? 'Verifying...' : 'Verify account'}</Text>
                    </Pressable>

                    <Pressable
                      disabled={resending}
                      onPress={handleResendCode}
                      className={`auth-button auth-button-secondary ${resending ? 'auth-button-disabled' : ''}`}
                    >
                      <Text className="auth-button-text">{resending ? 'Sending...' : 'Resend code'}</Text>
                    </Pressable>
                  </>
                )}

                <View className="auth-link-row">
                  <Text className="auth-link-copy">Already have an account?</Text>
                  <Link href="/(auth)/sign-in" className="auth-link">
                    Sign in
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

export default SignUp