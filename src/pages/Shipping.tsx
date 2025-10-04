import React from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import BobGoRatesExplorer from "@/components/delivery/BobGoRatesExplorer";

const Shipping = () => {
  return (
    <Layout>
      <SEO
        title="Shipping & Delivery Information - ReBooked Solutions"
        description="Learn about our shipping process and track your textbook deliveries. Powered by Courier Guy for reliable nationwide delivery across South Africa."
        keywords="shipping process, delivery tracking, courier guy, textbook delivery, order tracking, south africa shipping"
        url="https://www.rebookedsolutions.co.za/shipping"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-book-800 mb-2 sm:mb-4">
              Shipping Options
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto px-4">
              Compare live courier options via BobGo. See the cheapest, fastest, and our recommended delivery.
            </p>
          </div>

          <BobGoRatesExplorer />
        </div>
      </div>
    </Layout>
  );
};

export default Shipping;
