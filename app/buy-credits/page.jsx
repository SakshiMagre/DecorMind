"use client";

import React, { useState, useEffect, useContext } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { motion } from "framer-motion";
import { Users } from "@/config/schema";
import { UserDetailContext } from "../_context/UserDetailContext";
import { useRouter } from "next/navigation";
import { db } from "@/config/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Home } from "lucide-react";

const credits = [
  { amount: 5, price: 80 },
  { amount: 10, price: 160 },
  { amount: 25, price: 320 },
  { amount: 50, price: 560 },
  { amount: 100, price: 800 },
];

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

const BuyCredits = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLoaded(true);
    }
  }, []);

  const handleDashboardRedirect = () => {
    if (userDetail) {
      router.push("/dashboard");
    } else {
      router.push("/sign-up");
    }
  };

  const onPaymentSuccess = async (details) => {
    try {
      console.log("💳 Payment successful:", details);
      
      const currentCredits = parseInt(userDetail?.credits) || 0;
      const selectedCredits = parseInt(selectedOption?.amount) || 0;
      const newBalance = currentCredits + selectedCredits;

      // Update database
      const result = await db
        .update(Users)
        .set({ credits: newBalance })
        .where(eq(Users.email, userDetail?.email))
        .returning({ id: Users.id, credits: Users.credits });

      if (result && result.length > 0) {
        // Update context
        setUserDetail((prev) => ({
          ...prev,
          credits: newBalance,
        }));

        alert(`✅ Success! ${selectedCredits} credits added to your account.`);
        console.log("✅ Credits updated:", newBalance);
        
        router.push("/dashboard");
      } else {
        throw new Error("Failed to update credits in database");
      }
    } catch (error) {
      console.error("❌ Error processing payment:", error);
      alert("Payment successful but failed to add credits. Please contact support.");
    }
  };

  return (
    <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "USD" }}>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="flex items-center justify-between px-8 py-5 bg-gray-900 text-white shadow-lg rounded-b-lg">
          <h1 className="text-3xl font-bold">DECORMIND</h1>
          <nav>
            <button
              className="bg-yellow-500 px-6 py-2 rounded-lg hover:bg-yellow-600 transition"
              onClick={handleDashboardRedirect}
            >
              DASHBOARD
            </button>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-8 py-12 text-center">
          <h2 className="text-4xl font-bold text-gray-800">Buy More Credits</h2>
          <p className="text-lg text-gray-600 mt-3">
            Unlock endless possibilities with AI! Buy credits to create stunning designs.
          </p>

          {/* Current Balance */}
          {userDetail && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-block">
              <p className="text-blue-800">
                Current Balance: <strong className="text-2xl">{userDetail.credits || 0}</strong> credits
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
            {credits.map((credit) => (
              <motion.div
                key={credit.amount}
                className={`p-6 border rounded-xl shadow-lg cursor-pointer transition-transform transform hover:scale-105 ${
                  selectedOption?.amount === credit.amount 
                    ? "border-yellow-500 bg-yellow-100" 
                    : "border-gray-300 bg-white"
                }`}
                onClick={() => setSelectedOption(credit)}
                whileHover={{ scale: 1.05 }}
              >
                <h3 className="text-2xl font-semibold text-gray-800">{credit.amount} Credits</h3>
                <p className="mt-2 text-xl text-yellow-600 font-semibold">₹{credit.price}</p>
                <p className="text-gray-500 text-sm mt-1">≈ ${(credit.price / 83).toFixed(2)} USD</p>
              </motion.div>
            ))}
          </div>

          {selectedOption && isLoaded && (
            <motion.div className="mt-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-xl font-medium text-gray-700">
                Selected: {selectedOption.amount} Credits - ₹{selectedOption.price}
                <span className="text-sm text-gray-500"> (~ ${(selectedOption.price / 83).toFixed(2)} USD)</span>
              </h3>
              <div className="mt-6 flex justify-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  className="border rounded-lg overflow-hidden shadow-lg"
                >
                  <PayPalButtons
                    style={{ layout: "vertical", color: "gold", height: 50 }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        purchase_units: [
                          {
                            amount: {
                              value: (selectedOption.price / 83).toFixed(2),
                              currency_code: "USD",
                            },
                            description: `${selectedOption.amount} DecorMind Credits`,
                          },
                        ],
                      });
                    }}
                    onApprove={(data, actions) => {
                      return actions.order.capture().then((details) => {
                        onPaymentSuccess(details);
                      });
                    }}
                    onError={(err) => {
                      console.error("PayPal Checkout Error:", err);
                      alert("Something went wrong with your payment. Please try again.");
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </main>

        {/* Floating Home Button */}
        <Link href="/" passHref>
          <div className="fixed right-4 bottom-16 bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-[#5f4339] transition duration-300 cursor-pointer z-50">
            <Home className="w-6 h-6" />
          </div>
        </Link>

        <footer className="mt-16 py-6 bg-gray-900 text-white text-center rounded-t-lg">
          <p className="text-sm">© 2025 DECORMIND. All rights reserved.</p>
        </footer>
      </div>
    </PayPalScriptProvider>
  );
};

export default BuyCredits;