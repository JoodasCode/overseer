-- Add Stripe payment transactions table
CREATE TABLE "StripePayment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "paymentIntentId" TEXT,
  "amount" INTEGER NOT NULL,
  "creditAmount" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StripePayment_pkey" PRIMARY KEY ("id")
);

-- Add indexes for performance
CREATE INDEX "StripePayment_userId_idx" ON "StripePayment"("userId");
CREATE INDEX "StripePayment_sessionId_idx" ON "StripePayment"("sessionId");
CREATE INDEX "StripePayment_paymentIntentId_idx" ON "StripePayment"("paymentIntentId");
CREATE INDEX "StripePayment_status_idx" ON "StripePayment"("status");

-- Add foreign key constraints
ALTER TABLE "StripePayment" ADD CONSTRAINT "StripePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add environment variables to schema
-- STRIPE_SECRET_KEY
-- STRIPE_WEBHOOK_SECRET
-- STRIPE_PUBLIC_KEY
