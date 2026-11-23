# Bank Transfer Implementation Plan

## Overview
This plan describes how to implement seamless bank transfers using BlindPay's payin and payout APIs, while keeping the user experience simple and abstracting away all technical details. The backend will orchestrate the payin and payout flows, track all steps in the transaction table, and use webhooks for real-time status updates.

---

## User Experience (Frontend)
- User initiates a transfer (selects source, destination, amount)
- User sees a preview of total fees and recipient amount (calculated by backend)
- User confirms the transfer
- User sees a single transaction status (pending, completed, failed, etc.)

---

## Backend Orchestration
1. **On transfer initiation:**
   - Call `/payin-quotes` to get payin quote (fiat → wallet)
   - Call `/payout-quotes` to get payout quote (wallet → bank)
   - Calculate and return total fee and recipient amount to frontend
2. **On user confirmation:**
   - Initiate payin (`/payins/payins/evm`)
   - Create a transaction record in the database (status: pending)
3. **Webhooks:**
   - Listen for BlindPay webhook events (`payin.new`, `payin.complete`, `payout.new`, `payout.complete`, etc.)
   - On `payin.complete`, initiate payout
   - On `payout.complete`, update transaction status to completed/failed
   - Optionally, notify the user of status changes

---

## Transaction Table
- Use the existing `transactions` table to track the entire flow
- Store BlindPay payin and payout IDs in metadata fields
- Update status based on webhook events

---

## Webhook Security
- Implement signature verification as described in BlindPay docs
- Ensure authenticity and prevent replay attacks

---

## Implementation Checklist

- [ ] Design and implement `/transfer` backend endpoint
- [ ] Implement logic to call payin and payout quote APIs and return preview to frontend
- [ ] Implement `/transfer/confirm` endpoint to initiate payin and create transaction record
- [ ] Implement webhook endpoint to receive BlindPay events
- [ ] On `payin.complete`, initiate payout automatically
- [ ] On `payout.complete`, update transaction status in DB
- [ ] Implement signature verification for webhooks
- [ ] Update frontend to use new `/transfer` endpoint and show unified transfer flow
- [ ] Show total fees and recipient amount in transfer preview
- [ ] Show single transaction status to user (pending, completed, failed, etc.)
- [ ] Test end-to-end flow in development and production environments 