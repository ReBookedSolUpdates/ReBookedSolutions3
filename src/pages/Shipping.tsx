import React from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import UnifiedTrackingComponent from "@/components/delivery/UnifiedTrackingComponent";
import { Truck, Clock, ShieldCheck, Wallet, ArrowRight, PackageSearch } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const Shipping = () => {
  const [searchParams] = useSearchParams();
  const initialTracking = searchParams.get("tracking") || "";

  return (
    <Layout>
      <SEO
        title="Shipping with BobGo – Reliable Delivery & Tracking"
        description="We use BobGo to connect to trusted couriers like The Courier Guy and Fastway. Faster pickups, better rates, and real-time tracking for buyers and sellers."
        keywords="bobgo, courier guy, fastway, delivery tracking, shipping south africa, textbook delivery"
        url="https://www.rebookedsolutions.co.za/shipping"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-10 space-y-8">
          {/* Hero / Intro */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">
              Shipping Powered by BobGo
            </h1>
            <p className="text-gray-700 text-sm sm:text-base">
              We partner with BobGo to streamline nationwide deliveries. BobGo connects us to leading couriers so you get reliable, trackable shipping at great rates.
            </p>
          </div>

          {/* Why BobGo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Why we use BobGo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Reliable nationwide delivery</p>
                  <p className="text-gray-600 text-sm">Door-to-door service with real-time tracking and delivery updates.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-emerald-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Faster pickups</p>
                  <p className="text-gray-600 text-sm">Automatic courier booking helps sellers ship sooner.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 text-amber-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Competitive rates</p>
                  <p className="text-gray-600 text-sm">Aggregated options ensure cost‑effective delivery for buyers.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Couriers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Couriers we connect through BobGo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4 text-sm sm:text-base">
                BobGo integrates with multiple leading couriers. On ReBooked, we currently use:
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="text-sm py-2 px-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" /> The Courier Guy
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Fastway
                </Badge>
              </div>
              <p className="text-gray-500 text-xs mt-3">
                Additional providers may be added over time as we expand coverage.
              </p>
            </CardContent>
          </Card>

          {/* Benefits for Buyers and Sellers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">How this helps buyers and sellers</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">For Buyers</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <PackageSearch className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-gray-700 text-sm">Live tracking and delivery notifications.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-gray-700 text-sm">Trusted couriers with proven reliability.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Wallet className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p className="text-gray-700 text-sm">Fair pricing selected during checkout.</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">For Sellers</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <p className="text-gray-700 text-sm">Faster courier bookings after an order is confirmed.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-gray-700 text-sm">Seamless pickups—just package and hand over.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-gray-700 text-sm">Transparent progress from pickup to delivery.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Section */}
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
              <CardTitle className="text-xl sm:text-2xl">Track your shipment</CardTitle>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Enter your tracking number below. If you have a link, you can paste the code at the end of the URL using ?tracking=YOUR_CODE
              </p>
            </CardHeader>
            <CardContent>
              <UnifiedTrackingComponent provider="bobgo" initialTrackingNumber={initialTracking} />
            </CardContent>
          </Card>

          <Separator />

          {/* Help */}
          <div className="text-center text-sm text-gray-600">
            Need help with shipping? Contact us via the Help menu, or check your Order details for tracking updates.
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Shipping;
