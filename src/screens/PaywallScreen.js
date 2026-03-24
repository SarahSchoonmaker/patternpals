import * as InAppPurchases from "expo-in-app-purchases";

const PRODUCT_ID = "com.sschoonm.kindredpal.premium";

async function handlePurchase() {
  setLoading(true);
  try {
    await InAppPurchases.connectAsync();
    const { results } = await InAppPurchases.getProductsAsync([PRODUCT_ID]);
    if (results.length > 0) {
      await InAppPurchases.purchaseItemAsync(PRODUCT_ID);
      // Listen for purchase completion
      InAppPurchases.setPurchaseListener(async ({ responseCode, results }) => {
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          results.forEach(async (purchase) => {
            if (!purchase.acknowledged) {
              await InAppPurchases.finishTransactionAsync(purchase, true);
              await unlockPremium();
              setLoading(false);
              Alert.alert(
                "🎉 Welcome to Premium!",
                "All 9 Pals and every feature are now unlocked!",
                [{ text: "Let's Go!", onPress: () => navigation.goBack() }],
              );
            }
          });
        } else if (
          responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED
        ) {
          setLoading(false);
        } else {
          setLoading(false);
          Alert.alert("Purchase Failed", "Please try again.");
        }
      });
    }
  } catch (e) {
    setLoading(false);
    Alert.alert("Error", "Could not complete purchase. Please try again.");
  }
}

async function handleRestore() {
  setLoading(true);
  try {
    await InAppPurchases.connectAsync();
    const { responseCode, results } =
      await InAppPurchases.getPurchaseHistoryAsync();
    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      const premium = results.find((p) => p.productId === PRODUCT_ID);
      if (premium) {
        await unlockPremium();
        setLoading(false);
        Alert.alert("✓ Restored!", "Your premium access has been restored.", [
          { text: "Great!", onPress: () => navigation.goBack() },
        ]);
      } else {
        setLoading(false);
        Alert.alert("Nothing to Restore", "No previous purchase found.");
      }
    }
  } catch (e) {
    setLoading(false);
    Alert.alert("Error", "Could not restore purchase.");
  }
}
