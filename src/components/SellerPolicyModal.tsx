import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SellerPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SellerPolicyModal = ({ isOpen, onClose }: SellerPolicyModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-2xl max-h-[85vh] mx-auto my-auto overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-book-600">
            Seller Policy & Platform Rules
          </DialogTitle>
          <DialogDescription>
            Terms and conditions for selling books on ReBooked
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-sm text-gray-800">
            {/* 1. Listing Requirements */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base">1. Listing Requirements</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Sellers must provide accurate and complete information about each
                  book, including title, author, edition, condition, and any defects.
                </li>
                <li>Clear photos must be uploaded to verify the book’s condition.</li>
                <li>Misleading or false listings are strictly prohibited.</li>
              </ul>
            </section>

            {/* 2. Pricing & Fees */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base">2. Pricing & Fees</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sellers set their own prices for books.</li>
                <li>ReBooked Solutions charges a 10% service fee on every successful sale.</li>
                <li>A delivery/shipping fee is added at checkout and paid by the buyer.</li>
              </ul>
            </section>

            {/* 3. Order Process & Payouts */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base">3. Order Process & Payouts</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Once an order is placed, the seller must package the book securely for collection.</li>
                <li>
                  Funds from sales are held for 24–48 hours after successful delivery to allow buyers time to
                  confirm the book matches the listing.
                </li>
                <li>If a buyer raises a complaint, funds are held until the case is resolved.</li>
                <li>
                  If the seller is at fault, the buyer receives a full refund, the seller forfeits the payout, and a
                  fine may apply.
                </li>
              </ul>
            </section>

            {/* 4. Fine System */}
            <section className="space-y-3">
              <h3 className="font-semibold text-base">4. Fine System (Incorrect or Misleading Books)</h3>
              <p>
                To protect buyers and maintain trust, a tiered penalty system applies for sellers who provide incorrect
                or misleading books:
              </p>

              <div className="space-y-2">
                <h4 className="font-semibold">First Offense</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Buyer receives a full refund.</li>
                  <li>Seller receives no payout for the sale.</li>
                  <li>Seller is fined the delivery fee from their address to the buyer’s address.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Second Offense</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Buyer receives a full refund.</li>
                  <li>Seller receives no payout for the sale.</li>
                  <li>Seller is fined the delivery fee plus R100 for misuse of ReBooked Solutions’ services.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Third Offense</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Buyer receives a full refund.</li>
                  <li>Seller receives no payout for the sale.</li>
                  <li>Seller is fined the delivery fee plus R250.</li>
                  <li>Seller account may be suspended or permanently banned, pending review.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Zero-Tolerance Clause</h4>
                <p>The following are treated as an immediate Level 3 offense:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Fraudulent or counterfeit book listings.</li>
                  <li>Intentional scams or repeated misrepresentation.</li>
                  <li>Attempts to bypass or abuse ReBooked Solutions’ systems.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Penalty for Zero-Tolerance Violations:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Buyer receives a full refund.</li>
                  <li>Seller receives no payout for the sale.</li>
                  <li>Seller is fined the delivery fee plus R250.</li>
                  <li>
                    Seller is permanently banned. Any new accounts created by the seller will also be banned.
                  </li>
                </ul>
              </div>
            </section>

            {/* 5. Book Return & Donation Policy in Disputes */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base">5. Book Return & Donation Policy in Disputes</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  If the buyer wants the incorrect book returned to the seller, the buyer must cover the return delivery
                  cost.
                </li>
                <li>
                  If neither party wants the book back, ReBooked Solutions may donate the book to partner charities that
                  support students in need.
                </li>
                <li>This ensures that even disputes can have a positive impact.</li>
              </ul>
            </section>

            {/* 6. Dispute Resolution */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base">6. Dispute Resolution</h3>
              <p>
                ReBooked Solutions will act as mediator in disputes and its decision will be final within the platform.
                Sellers may submit additional evidence if they believe a claim is unfair.
              </p>
            </section>

            {/* 7. Policy Enforcement */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base">7. Policy Enforcement</h3>
              <p>
                ReBooked Solutions reserves the right to withhold payouts, apply fines, or suspend seller accounts for any
                breach of this policy. By selling on ReBooked Solutions, you agree to these rules to help maintain a fair,
                safe, and socially impactful marketplace.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SellerPolicyModal;
