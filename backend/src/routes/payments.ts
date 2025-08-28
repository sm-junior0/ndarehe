import { Router } from "express";
import { initializePayment, verifyPayment } from "@/utils/flutterwave";
import { prisma } from "../config/database";
import { sendEmail, emailTemplates } from "../utils/email";

const router = Router();

router.post("/flutterwave", async (req, res) => {
  const { bookingId, amount, currency, customer } = req.body;

  if (!bookingId || !amount || !currency || !customer) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  const tx_ref = `ACCOM-${bookingId}-${Date.now()}`;

  try {
    console.log(`[Payment] Initializing Flutterwave payment for booking ${bookingId}`);
    console.log(`[Payment] Amount: ${amount} ${currency}`);
    console.log(`[Payment] Customer: ${customer.name} (${customer.email})`);
    console.log(`[Payment] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Payment] Backend URL: ${process.env.BACKEND_URL || 'localhost:5000'}`);

    const payload = {
      tx_ref,
      amount,
      currency,
      redirect_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/flutterwave/verify`,
      customer,
      meta: { bookingId },
      payment_type: customer.phonenumber ? "mobilemoney" : "card"
    } as const;

    const response = await initializePayment(payload);

    // Fetch booking and user to satisfy required relations for PaymentCreateInput
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    });

    if (!booking || !booking.user) {
      return res.status(404).json({ success: false, message: "Booking or user not found" });
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        booking: { connect: { id: bookingId } },
        user: { connect: { id: booking.user.id } },
        method: customer.phonenumber ? "MOBILE_MONEY" : "CARD",
        transactionId: tx_ref,
        amount,
        currency,
        status: "PENDING"
      }
    });

    // Extract payment link from Flutterwave response
    const link = (response?.data?.link) || response?.link;

    if (link) {
      console.log(`[Payment] ✅ Flutterwave payment link generated: ${link}`);
      console.log(`[Payment] Transaction reference: ${tx_ref}`);
      console.log(`[Payment] Booking ID: ${bookingId}`);
      console.log(`[Payment] Redirect URL: ${payload.redirect_url}`);
    } else {
      console.error('[Payment] ❌ No payment link in Flutterwave response:', response);
      return res.status(500).json({ success: false, message: "Failed to generate payment link" });
    }

    return res.json({ success: true, link, tx_ref });
  } catch (error) {
    console.error("Flutterwave payment error:", error);
    return res.status(500).json({ success: false, message: "Payment initialization failed" });
  }
});

// Verify payment - redirect handler for Flutterwave return
router.get("/verify", async (req, res) => {
  const { tx_ref } = req.query;

  if (!tx_ref || typeof tx_ref !== "string") {
    return res.status(400).send("Transaction reference is required");
  }

  try {
    console.log(`[Payment] Verifying payment for tx_ref: ${tx_ref}`);
    
    const verification = await verifyPayment(tx_ref);
    const isPaid = verification?.status === "success" || 
                   verification?.data?.status === "successful" ||
                   verification?.data?.flw_ref ||
                   verification?.data?.transaction_id;
    const bookingId = verification?.data?.meta?.bookingId || verification?.meta?.bookingId;

    if (isPaid && bookingId) {
      console.log(`[Payment] ✅ Payment successful for booking ${bookingId}`);
      
      // Update payment status
      await prisma.payment.update({
        where: { transactionId: tx_ref },
        data: { status: "COMPLETED" }
      });

      // Update booking status
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED", isConfirmed: true, confirmedAt: new Date() },
        include: { user: true, accommodation: true, transportation: true, tour: true }
      });

      // Send confirmation email ONLY after successful payment verification
      if (updated.user) {
        const serviceName = updated.accommodation?.name || updated.transportation?.name || updated.tour?.name || 'Service';
        const { subject, html } = emailTemplates.bookingConfirmation(
          updated.user.firstName,
          {
            id: updated.id,
            serviceName,
            startDate: updated.startDate,
            totalAmount: updated.totalAmount,
            currency: updated.currency
          }
        );
        
        console.log(`[Payment] 📧 Sending confirmation email to ${updated.user.email}`);
        // Fire and forget
        sendEmail(updated.user.email, subject, html).catch((e) => {
          console.error('[Payment] ❌ Email send failed:', e);
        });
      }

      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? `${process.env.BASE_URL}/booking/success?bookingId=${bookingId}`
        : `http://localhost:5173/booking/success?bookingId=${bookingId}`;
      
      console.log(`[Payment] Redirecting to: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    } else {
      console.log(`[Payment] ❌ Payment verification failed for tx_ref: ${tx_ref}`);
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? `${process.env.BASE_URL}/booking/failed`
        : `http://localhost:5173/booking/failed`;
      return res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error("Flutterwave verification error:", error);
    return res.status(500).send("Verification failed");
  }
});

// JSON verification endpoint for AJAX polling from frontend
router.get("/verify-json", async (req, res) => {
  const { tx_ref } = req.query;
  if (!tx_ref || typeof tx_ref !== "string") {
    return res.status(400).json({ success: false, message: "tx_ref is required", paid: false });
  }
  
  try {
    console.log(`[Payment] JSON verification for tx_ref: ${tx_ref}`);
    
    const verification = await verifyPayment(tx_ref);
    const status = (verification as any)?.status || (verification as any)?.data?.status;
    const isPaid = status === "success" || status === "successful";
    const bookingId = (verification as any)?.data?.meta?.bookingId || (verification as any)?.meta?.bookingId || null;

    if (isPaid && bookingId) {
      console.log(`[Payment] ✅ JSON verification successful for booking ${bookingId}`);
      
      await prisma.payment.update({
        where: { transactionId: tx_ref },
        data: { status: "COMPLETED" }
      });
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED", isConfirmed: true, confirmedAt: new Date() },
        include: { user: true, accommodation: true, transportation: true, tour: true }
      });
      
      if (updated.user) {
        const serviceName = updated.accommodation?.name || updated.transportation?.name || updated.tour?.name || 'Service';
        const { subject, html } = emailTemplates.bookingConfirmation(
          updated.user.firstName,
          {
            id: updated.id,
            serviceName,
            startDate: updated.startDate,
            totalAmount: updated.totalAmount,
            currency: updated.currency
          }
        );
        
        console.log(`[Payment] 📧 Sending confirmation email to ${updated.user.email}`);
        sendEmail(updated.user.email, subject, html).catch((e) => {
          console.error('[Payment] ❌ Email send failed:', e);
        });
      }
      return res.json({ success: true, paid: true, bookingId });
    }

    // Not successful yet; do not 500, just return paid:false
    console.log(`[Payment] ℹ️ Not successful yet for tx_ref ${tx_ref}. Status: ${status}`);
    return res.json({ success: true, paid: false, bookingId: bookingId || null, message: 'Not successful yet' });
  } catch (error: any) {
    console.error("[Payment] ❌ Flutterwave verification error:", error?.message || error);
    if (error?.response) {
      console.error('[Payment] Verify axios error:', error.response.status, error.response.data);
      // Handle common Flutterwave errors gracefully
      const data = error.response.data || {};
      const status = data?.status || data?.message || 'error';
      return res.json({ success: true, paid: false, message: String(status) });
    }
    return res.json({ success: true, paid: false, message: 'Verification failed' });
  }
});

// Aliases under /flutterwave for compatibility with frontend and redirect_url
router.get("/flutterwave/verify", async (req, res) => {
  const { tx_ref } = req.query;
  if (!tx_ref || typeof tx_ref !== "string") {
    return res.status(400).send("Transaction reference is required");
  }
  
  try {
    console.log(`[Payment] Flutterwave verify for tx_ref: ${tx_ref}`);
    
    const verification = await verifyPayment(tx_ref);
    const isPaid = verification?.status === "success" || 
                   verification?.data?.status === "successful" ||
                   verification?.data?.flw_ref ||
                   verification?.data?.transaction_id;
    const bookingId = verification?.data?.meta?.bookingId || verification?.meta?.bookingId;

    if (isPaid && bookingId) {
      console.log(`[Payment] ✅ Flutterwave verification successful for booking ${bookingId}`);
      
      // Update payment status
      await prisma.payment.update({ 
        where: { transactionId: tx_ref }, 
        data: { status: "COMPLETED" } 
      });
      
      // Update booking status
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED", isConfirmed: true, confirmedAt: new Date() },
        include: { user: true, accommodation: true, transportation: true, tour: true }
      });
      
      // Send confirmation email ONLY after successful payment verification
      if (updated.user) {
        const serviceName = updated.accommodation?.name || updated.transportation?.name || updated.tour?.name || 'Service';
        const { subject, html } = emailTemplates.bookingConfirmation(
          updated.user.firstName,
          {
            id: updated.id,
            serviceName,
            startDate: updated.startDate,
            totalAmount: updated.totalAmount,
            currency: updated.currency
          }
        );
        
        console.log(`[Payment] 📧 Sending confirmation email to ${updated.user.email}`);
        sendEmail(updated.user.email, subject, html).catch((e) => {
          console.error('[Payment] ❌ Email send failed:', e);
        });
      }
      
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? `${process.env.BASE_URL}/booking/success?bookingId=${bookingId}`
        : `http://localhost:5173/booking/success?bookingId=${bookingId}`;
      
      console.log(`[Payment] Redirecting to: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    } else {
      console.log(`[Payment] ❌ Flutterwave verification failed for tx_ref: ${tx_ref}`);
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? `${process.env.BASE_URL}/booking/failed`
        : `http://localhost:5173/booking/failed`;
      return res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error("Flutterwave verification error:", error);
    return res.status(500).send("Verification failed");
  }
});

router.get("/flutterwave/verify-json", async (req, res) => {
  const { tx_ref } = req.query;
  if (!tx_ref || typeof tx_ref !== "string") {
    return res.status(400).json({ success: false, message: "tx_ref is required" });
  }
  
  try {
    console.log(`[Payment] Flutterwave JSON verify for tx_ref: ${tx_ref}`);
    
    const verification = await verifyPayment(tx_ref);
    const isPaid = verification?.status === "success" || 
                   verification?.data?.status === "successful" ||
                   verification?.data?.flw_ref ||
                   verification?.data?.transaction_id;
    const bookingId = verification?.data?.meta?.bookingId || verification?.meta?.bookingId || null;

    if (isPaid && bookingId) {
      console.log(`[Payment] ✅ Flutterwave JSON verification successful for booking ${bookingId}`);
      
      // Update payment status
      await prisma.payment.update({ 
        where: { transactionId: tx_ref }, 
        data: { status: "COMPLETED" } 
      });
      
      // Update booking status
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED", isConfirmed: true, confirmedAt: new Date() },
        include: { user: true, accommodation: true, transportation: true, tour: true }
      });
      
      // Send confirmation email ONLY after successful payment verification
      if (updated.user) {
        const serviceName = updated.accommodation?.name || updated.transportation?.name || updated.tour?.name || 'Service';
        const { subject, html } = emailTemplates.bookingConfirmation(
          updated.user.firstName,
          {
            id: updated.id,
            serviceName,
            startDate: updated.startDate,
            totalAmount: updated.totalAmount,
            currency: updated.currency
          }
        );
        
        console.log(`[Payment] 📧 Sending confirmation email to ${updated.user.email}`);
        sendEmail(updated.user.email, subject, html).catch((e) => {
          console.error('[Payment] ❌ Email send failed:', e);
        });
      }
    } else {
      console.log(`[Payment] ❌ Flutterwave JSON verification failed for tx_ref: ${tx_ref}`);
    }

    return res.json({ success: true, paid: !!isPaid, bookingId });
  } catch (error) {
    console.error("Flutterwave verification error:", error);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
});

export default router;

