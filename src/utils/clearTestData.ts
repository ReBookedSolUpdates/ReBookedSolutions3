import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Clears all test/demo data from the orders table
 * This includes orders with:
 * - No book title (showing as "Unknown Book")
 * - Undefined buyer/seller names
 * - Test order IDs with specific patterns
 */
export const clearAllTestData = async (): Promise<boolean> => {
  try {
    console.log("🗑️ Starting to clear test data...");

    // Delete orders where book title is null/empty or buyer/seller names are null
    // Split into multiple queries to avoid complex OR syntax issues
    let totalOrdersDeleted = 0;

    // Delete orders with null book_id
    const { error: bookIdError, count: bookIdCount } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .is("book_id", null);

    if (bookIdError) {
      console.error("Error deleting orders with null book_id:", bookIdError);
    } else {
      totalOrdersDeleted += bookIdCount || 0;
    }

    // Delete orders with null buyer_id
    const { error: buyerIdError, count: buyerIdCount } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .is("buyer_id", null);

    if (buyerIdError) {
      console.error("Error deleting orders with null buyer_id:", buyerIdError);
    } else {
      totalOrdersDeleted += buyerIdCount || 0;
    }

    // Delete orders with null seller_id
    const { error: sellerIdError, count: sellerIdCount } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .is("seller_id", null);

    if (sellerIdError) {
      console.error("Error deleting orders with null seller_id:", sellerIdError);
    } else {
      totalOrdersDeleted += sellerIdCount || 0;
    }

    // Delete orders with zero amount
    const { error: amountError, count: amountCount } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .eq("total_amount", 0);

    if (amountError) {
      console.error("Error deleting orders with zero amount:", amountError);
    } else {
      totalOrdersDeleted += amountCount || 0;
    }

    const count = totalOrdersDeleted;
    const ordersError = null; // No single error since we're doing multiple queries

    if (ordersError) {
      console.error("Error deleting test orders:", {
        message: ordersError.message,
        details: ordersError.details,
        hint: ordersError.hint,
        code: ordersError.code
      });
      toast.error("Failed to clear test orders: " + (ordersError.message || ordersError.details || "Unknown error"));
      return false;
    }

    console.log(`🗑️ Deleted ${count} test orders`);

    // Also delete any orders with specific test patterns - using individual queries to avoid complex OR syntax
    let totalPatternCount = 0;
    const testOrderIds = [
      "2480907b", "b327b100", "5bb5a0c3", "8e1acd99", "d4e850bb",
      "dcbc8287", "7b8aa076", "9d6a6c72", "62d0eafa", "d162836e",
      "ca22899e", "a4b2aeb1", "56656692", "a6812da3", "9db2dae7",
      "f6dffab3", "f35d4f5e", "56014b83", "d2afffbc", "bbccd49d",
      "2003aa6c", "ecff28c9", "e81559e6", "2bfa5fd3", "38803ce8"
    ];

    for (const orderId of testOrderIds) {
      try {
        const { error: patternError, count: patternCount } = await supabase
          .from("orders")
          .delete({ count: "exact" })
          .ilike("id", `%${orderId}%`);

        if (patternError) {
          // Extract error message in multiple ways to handle different error formats
          const errorMessage = patternError.message ||
                              patternError.details ||
                              patternError.hint ||
                              (typeof patternError === 'string' ? patternError : 'Unknown error');

          console.error(`Error deleting order ${orderId}:`, errorMessage);
          console.error(`Full error object for ${orderId}:`, JSON.stringify(patternError, null, 2));
        } else if (patternCount && patternCount > 0) {
          console.log(`🗑️ Deleted ${patternCount} orders matching ${orderId}`);
          totalPatternCount += patternCount;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message :
                            typeof err === 'string' ? err :
                            'Unknown exception';
        console.error(`Exception deleting order ${orderId}:`, errorMessage);
        console.error(`Full exception for ${orderId}:`, JSON.stringify(err, null, 2));
      }
    }

    // Clear any notifications related to test data - split into multiple queries
    let notifCount = 0;

    // Delete notifications with "unknown book" in title
    try {
      const { error: unknownBookError, count: unknownBookCount } = await supabase
        .from("notifications")
        .delete({ count: "exact" })
        .ilike("title", "%unknown book%");

      if (!unknownBookError) {
        notifCount += unknownBookCount || 0;
      }
    } catch (err) {
      console.error("Error deleting unknown book notifications:", err);
    }

    // Delete notifications with "undefined" in message
    try {
      const { error: undefinedError, count: undefinedCount } = await supabase
        .from("notifications")
        .delete({ count: "exact" })
        .ilike("message", "%undefined%");

      if (!undefinedError) {
        notifCount += undefinedCount || 0;
      }
    } catch (err) {
      console.error("Error deleting undefined notifications:", err);
    }

    // Delete system announcement notifications
    try {
      const { error: systemError, count: systemCount } = await supabase
        .from("notifications")
        .delete({ count: "exact" })
        .ilike("title", "%system announcement%");

      if (!systemError) {
        notifCount += systemCount || 0;
      }
    } catch (err) {
      console.error("Error deleting system announcement notifications:", err);
    }

    if (notifCount > 0) {
      console.log(`🗑️ Deleted ${notifCount} test notifications`);
    }

    const totalDeleted = (count || 0) + totalPatternCount;
    
    if (totalDeleted > 0) {
      toast.success(`Successfully cleared ${totalDeleted} test orders and ${notifCount || 0} test notifications`);
    } else {
      toast.info("No test data found to clear");
    }

    console.log("✅ Test data clearing completed");
    return true;

  } catch (error) {
    console.error("Fatal error clearing test data:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);
    toast.error("Failed to clear test data: " + errorMessage);
    return false;
  }
};

/**
 * Clears all data for the current user (more aggressive cleanup)
 */
export const clearAllUserData = async (userId: string): Promise<boolean> => {
  try {
    console.log("🗑️ Starting to clear all user data...");

    // Delete all orders for this user
    const { error: ordersError, count: orderCount } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (ordersError) {
      console.error("Error deleting user orders:", {
        message: ordersError.message,
        details: ordersError.details,
        hint: ordersError.hint,
        code: ordersError.code
      });
      toast.error("Failed to clear orders: " + (ordersError.message || ordersError.details || "Unknown error"));
      return false;
    }

    // Delete all notifications for this user
    let notifCount = 0;
    try {
      const { error: notifError, count: notifDeleteCount } = await supabase
        .from("notifications")
        .delete({ count: "exact" })
        .eq("user_id", userId);

      if (notifError) {
        console.error("Error deleting user notifications:", {
          message: notifError.message,
          details: notifError.details,
          hint: notifError.hint,
          code: notifError.code
        });
        // Don't fail the whole operation for notification errors
      } else {
        notifCount = notifDeleteCount || 0;
      }
    } catch (err) {
      console.error("Exception deleting user notifications:", err);
    }

    const totalDeleted = (orderCount || 0) + (notifCount || 0);
    toast.success(`Successfully cleared all user data: ${orderCount || 0} orders and ${notifCount || 0} notifications`);
    
    console.log("✅ User data clearing completed");
    return true;

  } catch (error) {
    console.error("Fatal error clearing user data:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);
    toast.error("Failed to clear user data: " + errorMessage);
    return false;
  }
};
