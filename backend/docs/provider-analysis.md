# Payment provider analysis (pre Kira / Triple-A)

Read-only static analysis of `backend/src` and `frontend/src`, 2026-11-24. Nothing here was executed against a provider; "broken" means *broken by reading the code*, not observed.

## 0. Summary

There are **two** integrations, not four:

| Integration | Base URL / auth | Where |
|---|---|---|
| **A. Bridge** | `TRANSBRIDGE_API_URL`, header `Api-Key: TRANSBRIDGE_API_KEY` (+ `Idempotency-Key`) | `integration/bridge/bridge.service.ts` only |
| **B. "Online banking" gateway** | `NEXT_PUBLIC_ONLINE_BANKING_URL` (one call hardcodes `https://online-banking.originalaccounts.com`), `x-api-key` + often `Authorization: Bearer NEXT_PUBLIC_BLINDPAY_API_KEY`, paths contain `NEXT_PUBLIC_BLINDPAY_INSTANCE_ID` | `client.service`, `transfer.service`, `virtual-account.service`, `wallet.service`, `transfer/account|beneficiary|transaction.controller` |

Gateway B serves **two path families**: Bridge-shaped (`/customers`, `/kyc_links`, `/customers/{id}/virtual_accounts`, `/customers/{id}/transfers`) and BlindPay-shaped (`/v1/instances/{inst}/…`, `/v2/…`). It is presumably a proxy in front of both; this is inferred from paths, not verified. The same ID (`clients.blindpay_receiver_id`) is sent to both families **and** to Bridge (A) as `customerID`.

**Circle:** `@circle-fin/developer-controlled-wallets` is in `package.json` but never imported. **BlindPay direct:** none; always via gateway B. Other external services: Resend (email), AWS S3 (`upload.service`), and `countriesnow.space` (frontend only). These are out of scope.

## 1. External calls

Guard column: **none** = no `@UseGuards` and no global guard exists (`APP_GUARD` is not used).

| # | Backend endpoint (guard) | Code | External call | Inputs → response fields used | IDs stored |
|---|---|---|---|---|---|
| 1 | `POST /client/register` (none) | `client.service.register` | B `POST /customers`, `GET /customers/{id}/tos-acceptance-link`, `GET …/kyc-link` | `{email,type}` → `id`, `url\|link\|tos_url\|kyc_url` | `clients.blindpay_receiver_id` (business clients: overwritten with `msbs.customer_id` or `ORIGINAL_TECH_ACCOUNT_ID`) |
| 2 | `POST /client/login` (throttle only) | `client.service.login` | A `GET /customers/{id}`; if active and not MSB: A `GET …/virtual_accounts`, `GET …/wallets`, `GET …/wallets/{w}`, `GET …/virtual_accounts/{va}/history`, possibly `POST …/wallets` + `POST …/virtual_accounts` (default USD→USDC on Base) | → `status`, `first_name`, `last_name`; VA `id`, `destination.address` | `user_transfers(type='on-ramp', transfer_id=VA id)` |
| 3 | `PUT /client/:id/profile` (JWT) | `client.service.updateProfile` | B (hardcoded host) `PUT /v2/receivers/{inst}/{receiver}` | profile/KYC fields → only `ok` | none |
| 4 | `POST /client/msb-data` (none) | `getAllDataByMsbId` | B `GET /customers/{id}` ×N, `GET /kyc_links?customer_id=` ×N | → customer object, `kyc_link`, `tos_link` | none |
| 5 | `POST /client/customer/virtual_accounts` (none) | `getCustomersByMsbId` | B `GET /customers/{id}/virtual_accounts` ×N | → `data[]` | none |
| 6 | `POST /client/transactions/all` (none) | `getAllTransactionsByMsbId` | B `GET /customers/{id}/transfers?limit=100` ×N | → `data[]` | none |
| 7 | `POST /client/link-wallet` (JWT), `POST /wallet` (none) | `wallet.service.createWallet` | B `…/v2/instances/{inst}/receivers/{r}/blockchain-wallets/sign-message`, then `POST …/blockchain-wallets` | address, network, signature → `wallet_id\|id` | `wallets.blindpay_wallet_id`, `clients.blindpay_wallet_id`, `clients.wallet_address` |
| 8 | `POST /account` (none) | `transfer/account.controller.create` | B `POST /v1/instances/{inst}/receivers/{receiver_id}/bank-accounts` (`receiver_id` from body) | bank fields → `id`, `account_number\|iban\|clabe\|pix_key` | `accounts.blindpay_bank_account_id` |
| 9 | `POST /beneficiary` (none) | `beneficiary.controller` | B `POST /v2/receivers/{inst}` (new receiver incl. ID docs), then `POST /v1/instances/{inst}/receivers/{id}/bank-accounts` | → `receiver.id`, `bankAccount.id` | `beneficiaries.blindpay_bank_account_id` (receiver id **not** stored) |
| 10 | `POST /virtual-account` (none) | `virtual-account.service.create` | B `POST /v2/virtual-accounts/{inst}/{receiver}` | `{token, blockchain_wallet_id}` → `id`, `account_number`, `routing_number`, `bank_name` | `virtual_accounts.blindpay_receiver_id`, `.blindpay_virtual_account_id`, `.blockchain_wallet_id` |
| 11 | `POST /transfer` (none), preview | `transfer.service.getTransferPreview` | B `POST /v1/instances/{inst}/payin-quotes`, `POST /v2/quotes/{inst}` | receiver/bank-account id, wallet id, amount, token, network → `id`, `sender_amount`, `receiver_amount`, `flat_fee`, `partner_fee_amount` | none (returned to client) |
| 12 | `POST /transfer/confirm` (none) | `confirmTransfer` | B `POST /v1/instances/{inst}/payins/payins/evm` | `payin_quote_id` → `id` | `transactions.metadata.{payin_id, payin_quote_id, payout_quote_id, payout_quote_data, quote_creation_params, blindpay_wallet_id}`, status `payin_pending` |
| 13 | `POST /transfer/approve` (JWT) | `approveTransaction` | B optional re-quote `POST /v2/quotes/{inst}`, then `POST /v2/payouts/{inst}/evm` | `quote_id`, sender wallet → `id`, error text (`quote_expired`…) | `metadata.payout_id`, status |
| 14 | `GET /transaction/:id/payin` (none) | `transaction.controller` | B `GET /v1/e/payins/{id}` | → passthrough | none |
| 15 | `POST /webhook` (none, Svix HMAC) | `webhook.service` | inbound BlindPay events `payin.*`, `payout.*`, `receiver.*`, `kyc.*`, `document.*`, `bankAccount.new`, `blockchainWallet.new` | → `id`, `status` | `transactions.status/metadata`, `clients` KYC status |
| 16 | `/bridge/*`, 30 routes (none) | `bridge.controller` → `bridge.service` | A: `customers/{id}` GET/PUT, `external_accounts` CRUD, `transfers` CRUD, `virtual_accounts` (create/list/deactivate/reactivate/history/PUT fee), `wallets`, `developer/fees`, `kyc_links` | transfer: `id, state, amount, developer_fee, receipt.final_amount, source.*, destination.*`; VA: `id, status, customer_id, destination.*, source_deposit_instructions.*`; history: `type, deposit_id`; wallet: `address, balances[].balance` | `user_transfers(user_id, type on-ramp/off-ramp, transfer_id)`, `user_beneficiaries(user_id, external_account_id)`; `fee_accounts` is DB-only (no provider call) |

Dead code: `transfer.service.mintUSDCToWallet` (B `/utilities/mint`) and `approveTokensForBlindPay` are never called.

## 2. Frontend callers

The frontend (`frontend/src`) uses raw `fetch(${API_BASE_URL}/…)` (`lib/apiBase.ts`), almost all of it in `hooks/useDatabase.ts`:

| Backend endpoint | Frontend |
|---|---|
| `/client/register` · `/client/link-wallet` · `/client/reset-wallet` | `useDatabase.ts:1340` · `:1949` · `:1998` |
| `/account` (POST) | `useDatabase.ts:1505` |
| `/beneficiary` POST · `/beneficiary/list/:clientId` | `useDatabase.ts:1720` · `:1703` |
| `/transfer` · `/confirm` · `/approve` · `/complete/:id` | `useDatabase.ts:1861` · `:1883` · `:2099, 2148` · `:2193` |
| `/transfer/transaction/:id` | `useDatabase.ts:1903, 2046`; `useTransactionStatus.ts:24, 89` |
| `/transaction/list` POST · `/recent` · `/msb/list` POST | `useDatabase.ts:1014` · `:1156` · `:858, 929` |
| `/transaction/:id/payin` | `components/client/components/TransactionDetails.tsx:36` |
| `/virtual-account` POST · `/list` | `useDatabase.ts:1801` · `:1761` |
| `/wallet` GET/POST · `/wallet/client/:id` | `useDatabase.ts:1572, 1637` · `:1614` |
| **Not called by the frontend** | **all `/bridge/*`**, `/client/msb-data`, `/client/customer/virtual_accounts`, `/client/transactions/all`, `/account/create`, `/beneficiary/list/msb/:id`, VA `GET/:id`, `PUT /:id/status`, `DELETE` |

The Bridge flow is therefore reached from the UI only through `/client/login` (#2). `frontend/src/api/{bridge,blindpay,routefusion}.ts` are mock stubs. `api/config.ts` reads `VITE_BRIDGE_API_KEY`/`SECRET`; any `VITE_` value is bundled into the browser build.

## 3. Proposed provider-neutral interface (types only)

```ts
type ProviderId = 'bridge' | 'blindpay' | 'kira' | 'triple_a';
type Money = { amount: string; currency: string };            // decimal string; no cents/float mixing
type Rail = 'ach' | 'wire' | 'sepa' | 'spei' | 'pix' | 'base' | 'ethereum' | 'polygon' | 'solana' | 'stellar' | string;
interface ProviderRef { provider: ProviderId; ref: string }   // replaces blindpay_* / transfer_id columns

interface CustomerProvider {                                   // #1-4
  createCustomer(i: { type: 'individual' | 'business'; email: string }): Promise<ProviderRef>;
  getCustomer(ref: string): Promise<{ ref: string; status: 'pending' | 'active' | 'rejected' | string; firstName?: string; lastName?: string }>;
  updateCustomer(ref: string, p: Partial<KycProfile>): Promise<void>;
  getOnboardingLinks(ref: string): Promise<{ kycUrl?: string; tosUrl?: string }>;
}
interface BankAccountProvider {                                // #8, #9, /bridge external_accounts
  createBankAccount(customerRef: string, a: BankAccountInput): Promise<ProviderRef & { last4?: string }>;
  listBankAccounts(customerRef: string): Promise<BankAccount[]>;
  deleteBankAccount(customerRef: string, ref: string): Promise<void>;
}
interface DepositAccountProvider {                             // #10, Bridge virtual_accounts
  createDepositAccount(customerRef: string, i: { source: { currency: string }; destination: { currency: string; rail: Rail; walletRef?: string; address?: string }; feePercent?: string }): Promise<DepositAccount>;
  listDepositAccounts(customerRef: string, status?: 'active' | 'inactive'): Promise<DepositAccount[]>;
  setDepositAccountActive(customerRef: string, ref: string, active: boolean): Promise<void>;
  getDepositHistory(customerRef: string, ref: string): Promise<LedgerEvent[]>;
}
interface WalletProvider {                                     // #7, Bridge wallets
  registerExternalWallet(customerRef: string, w: { address: string; rail: Rail; signature?: string }): Promise<ProviderRef>;
  createCustodialWallet?(customerRef: string, rail: Rail): Promise<ProviderRef & { address: string }>;
  getBalances?(customerRef: string, walletRef: string): Promise<Money[]>;
}
interface QuoteProvider {                                      // #11
  quote(i: { kind: 'onramp' | 'offramp' | 'fiat_payout'; from: Money; to: { currency: string; rail: Rail }; sourceRef: string; destinationRef: string }): Promise<Quote>;
}
interface Quote { ref: string; send: Money; receive: Money; fees: Money[]; expiresAt?: string; raw: unknown }
interface TransferProvider {                                   // #12-14, Bridge transfers
  executeQuote(quoteRef: string, i?: { fromAddress?: string }): Promise<Transfer>;
  getTransfer(ref: string): Promise<Transfer>;
  listTransfers(customerRef: string, page?: { after?: string; limit?: number }): Promise<Transfer[]>;
  cancelTransfer?(ref: string): Promise<void>;
}
interface Transfer { ref: string; status: TransferStatus; send: Money; receive?: Money; fees?: Money[]; createdAt: string; raw: unknown }
type TransferStatus = 'pending' | 'awaiting_funds' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
interface FeeProvider { getDefaultFeePercent(): Promise<string>; setDepositAccountFee?(customerRef: string, ref: string, pct: string): Promise<void> }
interface WebhookProvider {                                    // #15
  verify(rawBody: Buffer, headers: Record<string, string>): boolean;
  parse(rawBody: Buffer): { type: 'customer.updated' | 'transfer.updated' | 'deposit.received' | 'kyc.updated' | string; ref: string; status?: string; raw: unknown };
}
// Supporting types (KycProfile, BankAccountInput, BankAccount, DepositAccount, LedgerEvent) mirror today's DTOs.
```

| Capability | Kira (banking) | Triple-A (crypto/OTC) |
|---|---|---|
| Customers / KYC links | TBD, needs their API docs | TBD, needs their API docs |
| Bank accounts / beneficiaries | likely; TBD, needs their API docs | n/a? TBD |
| Deposit / virtual accounts | TBD, needs their API docs | TBD (crypto deposit addresses?) |
| Quotes, on/off-ramp, OTC pricing | n/a? TBD | TBD, needs their API docs |
| Fiat payouts | TBD, needs their API docs | TBD |
| Custodial wallets / balances | TBD | TBD, needs their API docs |
| Webhook signing scheme | TBD, needs their API docs | TBD, needs their API docs |

## 4. Migration plan

**Becomes the reference Bridge adapter:** `integration/bridge/bridge.service.ts` (HTTP parts), `bridge.mapper.ts`, `dto/*`. **Becomes a "gateway/BlindPay" adapter:** every `fetch` in `client.service`, `transfer.service`, `wallet.service`, `virtual-account.service`, and `transfer/{account,beneficiary,transaction}.controller`. Business logic (DB writes, fee math in `getAccumulatedFees`, `calculateFees`) stays in services and calls the interface.

**Provider-specific columns → generic**

| Today | Proposed |
|---|---|
| `clients.blindpay_receiver_id` (actually holds Bridge/gateway customer id) | `provider_customers(client_id, provider, provider_ref, status)` |
| `clients.blindpay_wallet_id`, `wallets.blindpay_wallet_id` | `wallets.provider`, `wallets.provider_ref` |
| `accounts.blindpay_bank_account_id`, `beneficiaries.blindpay_bank_account_id`, `user_beneficiaries.external_account_id` | `provider`, `provider_ref` on `accounts` / `beneficiaries`; drop `user_beneficiaries` |
| `virtual_accounts.blindpay_receiver_id` / `.blindpay_virtual_account_id`, `user_transfers(type='on-ramp')` | `virtual_accounts.provider`, `.provider_ref`, `.provider_customer_ref` |
| `user_transfers(type='off-ramp')`, `transactions.metadata.payin_id/payout_id/…quote…` | `transactions.provider`, `.provider_ref`, plus `provider_legs(transaction_id, kind, provider, ref, status)` for multi-leg flows |
| `msbs.customer_id` | `msbs.provider`, `msbs.provider_ref` |

**Order (lowest risk first)**
1. Add an auth guard to all provider-facing controllers (§5.1) and fix the webhook raw body (§5.3). This changes no data.
2. Introduce the interfaces plus a `ProviderRegistry`. Wrap the existing calls 1:1 in `BridgeAdapter` / `GatewayAdapter` without changing behaviour. Move every env read into one config (no `NEXT_PUBLIC_*` on the server).
3. Add `provider` / `provider_ref` columns **alongside** the old ones via migrations (turn off `DB_SYNC`), backfill (`provider` = `bridge` or `blindpay` per table), dual-write, then switch reads.
4. Normalise transfer statuses to `TransferStatus` and route webhooks via `/webhook/:provider`.
5. Add the Kira / Triple-A adapters behind a per-MSB provider setting, once their API docs exist.
6. Drop the old columns, `user_transfers` / `user_beneficiaries`, and unused routes after a release cycle.

## 5. Risks / looks broken (from reading, not run)

1. **No auth on money endpoints.** `/bridge/*` (incl. `POST /transfers`, `PUT /customers/:id`, `DELETE` external accounts), `/transfer`, `/transfer/confirm`, `/account`, `/beneficiary`, `/virtual-account`, `/wallet`, `/transaction/*` and `/client/msb-data` have no guard. `customerID`/`userID`/`receiver_id` come from the URL or body, which is an open IDOR.
2. **One ID, three meanings.** `blindpay_receiver_id` is used as a gateway customer, a BlindPay receiver (`/v2/receivers/…`) **and** a Bridge `customerID`. Business clients all share the MSB's or `ORIGINAL_TECH_ACCOUNT_ID`'s customer, and the customer just created for them is discarded.
3. **Webhook signature is likely to always fail.** HMAC is computed over `JSON.stringify(req.body)`, not the raw body (no `rawBody` in `main.ts`), and the comparison is not constant-time. There is no Bridge webhook, so Bridge state is polled only.
4. **Login depends on Bridge.** `/client/login` calls Bridge synchronously and may create a wallet + VA, so a Bridge outage or slowness blocks client login. The default VA uses a 6-char `Math.random` idempotency key.
5. **Config gaps.** The local `.env` has no `NEXT_PUBLIC_ONLINE_BANKING_*` / `NEXT_PUBLIC_BLINDPAY_*` keys, so gateway calls would hit `undefined/…` URLs (registration would fail). `updateProfile` hardcodes the production gateway host. Secrets use the `NEXT_PUBLIC_` prefix, and the frontend `VITE_BRIDGE_API_*` vars would ship to browsers if set.
6. **Data handling.** `fee_accounts` stores full routing/account numbers in plaintext. Beneficiary creation falls back to routing number `021000021` if none is given. `updateMSBFeeExternalAccount` writes outside its query-runner transaction, never releases the runner, swallows errors and returns the pre-update row. `createMSBFeeExternalAccount` returns an unsaved entity on failure.
7. **Fan-out / scale.** `/client/msb-data`, `/customer/virtual_accounts`, `/transactions/all` and Bridge VA listing make N (×3) sequential-ish upstream calls per customer, with a `limit=100` cap and no pagination.
8. **Trusting client-supplied data.** `confirmTransfer` stores `payout_quote_data` from the request body, and it is later used to execute the payout.
9. **Schema conflicts.** Two entities map to table `users` (`client.entity.ts`, `msb-admin.entity.ts`) and `DB_SYNC=true` locally. Two controllers share the `/account` prefix.
10. **Frontend calls missing routes.** For example `/virtual-account/update-status/:id` (backend: `PUT /:id/status`), `/transaction/approve|reject|update-status/:id`, `/notification/*`, `/compliance-alert/list`.
