import { useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import dayjs from "dayjs";
import { usePostHog } from "posthog-react-native";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const posthog = usePostHog();

  const displayName = user?.fullName || user?.firstName || "Your account";
  const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar;
  const email = user?.primaryEmailAddress?.emailAddress || "No email";
  const accountId = user?.id ? `${user.id.slice(0, 12)}...` : "Account";
  const joinedAt = user?.createdAt ? dayjs(user.createdAt).format("DD.MM.YYYY") : "--";

  const handleLogout = async () => {
    posthog.capture('sign_out_completed');
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <View className="flex-1 gap-4">
        <Text className="text-[34px] font-sans-bold text-primary">Settings</Text>

        <View className="rounded-[22px] border border-black/5 bg-[#f2efe3] p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <Image source={avatarSource} className="size-14 rounded-full" />
            <View>
              <Text className="text-[22px] font-sans-bold text-primary">{displayName}</Text>
              <Text className="text-[12px] font-sans-medium text-muted-foreground">{email}</Text>
            </View>
          </View>
        </View>

        <View className="rounded-[22px] border border-black/5 bg-[#f2efe3] p-4">
          <Text className="mb-4 text-[22px] font-sans-bold text-primary">Account</Text>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[16px] font-sans-medium text-muted-foreground">Account ID</Text>
            <Text className="text-[16px] font-sans-semibold text-primary">{accountId}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[16px] font-sans-medium text-muted-foreground">Joined</Text>
            <Text className="text-[16px] font-sans-semibold text-primary">{joinedAt}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          className="rounded-[18px] bg-[#e87a51] px-4 py-4"
        >
          <Text className="text-center text-[18px] font-sans-bold text-white">Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
