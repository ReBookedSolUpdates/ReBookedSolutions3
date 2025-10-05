import React from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, ShoppingCart, ShieldAlert, CheckCircle, ArrowUpRight } from "lucide-react";

const GettingStarted = () => {
  return (
    <Layout>
      <SEO
        title="Getting Started | ReBooked Solutions"
        description="Learn how to become a seller or buyer on ReBooked Solutions. Step-by-step guides, packaging guidelines, and important disclaimers."
        keywords="getting started, how to sell, how to buy, packaging guidelines, seller guide, buyer guide, rebooked solutions"
        url="https://www.rebookedsolutions.co.za/getting-started"
      />

      <div id="top" className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-5xl">
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Getting Started</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A quick guide to buying and selling books safely on ReBooked Solutions.
          </p>
        </div>

        {/* Quick navigation */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
          <Button asChild variant="secondary">
            <a href="#seller" aria-label="Jump to Becoming a Seller">
              <Package className="mr-2" /> Becoming a Seller
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="#buyer" aria-label="Jump to Becoming a Buyer">
              <ShoppingCart className="mr-2" /> Becoming a Buyer
            </a>
          </Button>
        </div>

        {/* Seller Section */}
        <Card id="seller" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Package className="w-6 h-6 mr-2 text-book-600" /> Becoming a Seller
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Have a valid email address and a South African phone number.</li>
                <li>Provide payout details (banking setup) so you can get paid securely.</li>
                <li>Only list genuine books in acceptable condition with accurate descriptions.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>
                  Create an account and verify your email. If you already have an account, just log in.
                </li>
                <li>
                  Complete your payout setup so funds can be transferred after successful sales. You can do this under your profile or go directly to
                  <span className="whitespace-nowrap"> </span>
                  <Link to="/banking-setup" className="text-book-600 underline">Banking Setup</Link>.
                </li>
                <li>
                  List your book with clear photos, a fair price, and honest condition details.
                </li>
                <li>
                  When a buyer places an order, you’ll be notified to confirm the sale within 48 hours.
                </li>
                <li>
                  After confirming, package the book securely and hand it over to the booked courier.
                </li>
                <li>
                  Once the shipment is in progress, you’ll be able to track the delivery and receive payout after the process completes.
                </li>
              </ol>
            </div>

            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-2">Packaging Guidelines</h4>
              <p className="text-gray-700 mb-3">
                To reduce the risk of damage during transit, we strongly recommend using padded envelopes and protective inner wrapping.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Use a padded envelope sized appropriately for the book (no excessive movement inside).</li>
                <li>Wrap the book in bubble wrap or kraft paper before placing it in the envelope.</li>
                <li>Seal all edges securely with strong packing tape.</li>
                <li>Place a slip with your order number and return details inside the package.</li>
              </ul>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-700">Example padded envelopes (external links):</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>
                    <a
                      href="https://www.waltons.co.za/buy/unbranded-protective-envelopes-padded-size-4-240mm-x-330mm-w916#:~:text=Introducing%20the%20Unbranded%20Protective%20Envelopes%20Padded%20Size%204%2C,important%20documents%2C%20photos%2C%20and%20other%20items%20during%20transit"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-book-600 hover:underline inline-flex items-center"
                    >
                      Waltons – Unbranded Protective Envelopes <ArrowUpRight className="ml-1 w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.pnp.co.za/mailite-padded-envelope-no-4-x-50/p/000000000000208659_CS1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-book-600 hover:underline inline-flex items-center"
                    >
                      Pick n Pay – Mailite Padded Envelope <ArrowUpRight className="ml-1 w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.officenational.co.za/envelopes/padded/padded-envelopes-150-x-210mm-10-pack-gs103042072"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-book-600 hover:underline inline-flex items-center"
                    >
                      Office National – Padded Envelopes <ArrowUpRight className="ml-1 w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.checkers.co.za/department/stationery-and-crafts/office-supplies/envelopes-and-courier-3-6707a53fc927aad4bab8db80?msockid=1895d113a8f5699a198bc73aa93c68c0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-book-600 hover:underline inline-flex items-center"
                    >
                      Checkers – Envelopes & Courier Supplies <ArrowUpRight className="ml-1 w-3 h-3" />
                    </a>
                  </li>
                </ul>
              </div>

              <Alert variant="destructive" className="mt-5">
                <ShieldAlert className="w-5 h-5" />
                <AlertTitle>Important Disclaimer</AlertTitle>
                <AlertDescription>
                  The platform is not responsible for damage caused during transit. Sellers are responsible for packaging items securely.
                </AlertDescription>
              </Alert>
            </div>

            <div className="pt-2">
              <a href="#top" className="text-sm text-book-600 underline">Back to top</a>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Section */}
        <Card id="buyer" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <ShoppingCart className="w-6 h-6 mr-2 text-book-600" /> Becoming a Buyer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Have a valid email address for order updates and receipts.</li>
                <li>A secure payment method for checkout (processed by Paystack).</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Browse available books and compare prices and conditions.</li>
                <li>Click Buy Now and complete payment securely at checkout.</li>
                <li>You’ll receive confirmation when the seller accepts the order (within 48 hours).</li>
                <li>Shipping is arranged and you’ll receive tracking details.</li>
                <li>Receive your book and enjoy! If there are issues, use your dashboard to contact support.</li>
              </ol>
            </div>

            <div className="flex items-center text-green-700 bg-green-50 border border-green-200 rounded-md p-4">
              <CheckCircle className="w-5 h-5 mr-2" />
              <p className="text-sm">Tip: You can track deliveries on the Shipping page and in your notifications.</p>
            </div>

            <div className="pt-2">
              <a href="#top" className="text-sm text-book-600 underline">Back to top</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GettingStarted;
