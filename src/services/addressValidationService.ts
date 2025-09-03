import { supabase } from "@/integrations/supabase/client";
import { safeLogError } from "@/utils/errorHandling";

interface Address {
  complex?: string;
  unitNumber?: string;
  streetAddress: string;
  suburb?: string;
  city: string;
  province: string;
  postalCode: string;
  [key: string]: string | number | boolean | null;
}

export const validateAddress = (address: Address): boolean => {
  return !!(
    address.streetAddress &&
    address.city &&
    address.province &&
    address.postalCode
  );
};

export const canUserListBooks = async (userId: string): Promise<boolean> => {
  try {
    let hasValidAddress = false;

    try {
      const { getSellerDeliveryAddress } = await import("@/services/simplifiedAddressService");
      const encryptedAddress = await getSellerDeliveryAddress(userId);

      if (
        encryptedAddress &&
        encryptedAddress.street &&
        encryptedAddress.city &&
        encryptedAddress.province &&
        encryptedAddress.postal_code
      ) {
        hasValidAddress = true;
        console.log("🔐 Using encrypted pickup address for listing validation");
      }
    } catch (error) {
      console.warn("Failed to check encrypted pickup address:", error);
    }

    if (hasValidAddress) {
      console.log(`✅ User ${userId} can list books - valid encrypted pickup address`);
      return true;
    }

    // No plaintext fallback allowed
    console.log(`❌ User ${userId} cannot list books - encrypted pickup address missing`);
    return false;
  } catch (error) {
    safeLogError("Error in canUserListBooks", error, { userId });
    return false;
  }
};

export const updateAddressValidation = async (
  userId: string,
  pickupAddress: Address,
  shippingAddress: Address,
  addressesSame: boolean,
) => {
  try {
    const isPickupValid = validateAddress(pickupAddress);
    const isShippingValid = addressesSame ? isPickupValid : validateAddress(shippingAddress);
    const canList = isPickupValid && isShippingValid;

    // Update metadata only; never write plaintext addresses
    const { error } = await supabase
      .from("profiles")
      .update({
        addresses_same: addressesSame,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      safeLogError("Error updating address validation", error, { userId });
      throw new Error(
        `Failed to update address validation: ${error.message || "Unknown error"}`,
      );
    }

    return { canListBooks: canList };
  } catch (error) {
    safeLogError("Error in updateAddressValidation", error, { userId });
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Address validation failed: ${errorMessage}`);
  }
};
