import {
  DestinationDto,
  FeatureDto,
  SourceDto,
  TransferDto,
} from './dto/transfers.dto';
import {
  VirtualAccountDto,
  VirtualAccountHistoryDto,
} from './dto/virtual-accounts.dto';
import { Currency, PaymentRail, State } from './dto/shared.dto';
import {
  DetailsDisplayDto,
  TransactionDetailsDto,
} from './dto/transactions.dto';
import { ExternalAccountDto } from './dto/external-accounts.dto';
export function mapVirtualAccountToTransfer(
  virtualAccount: VirtualAccountDto,
): TransferDto {
  const source: SourceDto = {
    currency: virtualAccount.source_deposit_instructions.currency,
    payment_rail: virtualAccount.source_deposit_instructions.payment_rail,
  };

  const destination: DestinationDto = {
    currency: virtualAccount.destination.currency,
    payment_rail: virtualAccount.destination.payment_rail,
    bridge_wallet_id: virtualAccount.destination.bridge_wallet_id,
    to_address: virtualAccount.destination.address,
  };

  const features: FeatureDto = {
    flexible_amount: true,
    static_template: false,
    allow_any_from_address: true,
  };

  const state: State =
    virtualAccount.status === 'activated'
      ? State.AWAITING_FUNDS
      : State.CANCELED;

  const nowOrCreatedAt = virtualAccount.created_at;

  return {
    id: virtualAccount.id,
    amount: virtualAccount.bridge_wallet_balance,
    currency: destination.currency,
    on_behalf_of: virtualAccount.customer_id,
    developer_fee: '0.00',
    source,
    source_deposit_instructions: virtualAccount.source_deposit_instructions,
    destination,
    state,
    receipt: {
      template: 'virtual_account',
      virtual_account_id: virtualAccount.id,
      destination_payment_rail: virtualAccount.destination.payment_rail,
    },
    created_at: nowOrCreatedAt,
    updated_at: nowOrCreatedAt,
    features,
  } as TransferDto;
}

function formatSourceToDestination(
  source: { currency: Currency; payment_rail: PaymentRail },
  destination: { currency: Currency; payment_rail: PaymentRail },
) {
  return `${formatCurrency(source.currency)} (${formatPaymentRail(source.payment_rail)}) -> ${formatCurrency(destination.currency)} (${formatPaymentRail(destination.payment_rail)})`;
}

function formatDollars(amount: string) {
  return `$${Number(amount).toFixed(2)}`;
}

function formatPaymentRail(paymentRail: PaymentRail) {
  if (paymentRail === PaymentRail.BRIDGE_WALLET) {
    return 'Virtual account wallet';
  }
  if (paymentRail === PaymentRail.ACH || paymentRail === PaymentRail.ACH_PUSH) {
    return 'ACH';
  }
  if (paymentRail === PaymentRail.WIRE) {
    return 'Wire';
  }

  if (paymentRail === PaymentRail.ACH_SAME_DAY) {
    return 'ACH (same day)';
  }

  if (paymentRail === PaymentRail.AVALANCHE_C_CHAIN) {
    return 'Avalanche';
  }

  const rail = paymentRail.replace('_', ' ');

  return rail.charAt(0).toUpperCase() + rail.slice(1);
}

function formatCurrency(currency: Currency) {
  return currency.toUpperCase();
}

export function convertVirtualAccountHistoryToTransactionDetails(
  virtualAccountHistory: VirtualAccountHistoryDto,
  virtualAccount: VirtualAccountDto,
): TransactionDetailsDto {
  const { source_deposit_instructions, destination } = virtualAccount;

  const tracking_and_receipt: DetailsDisplayDto[] = [
    {
      label: 'Transaction ID',
      value: virtualAccountHistory.id,
      copyable: true,
    },
    ...(virtualAccountHistory.deposit_id
      ? [
          {
            label: 'Deposit Tracking ID',
            value: virtualAccountHistory.deposit_id,
            copyable: true,
          },
        ]
      : []),
    ...(virtualAccountHistory.destination_tx_hash
      ? [
          {
            label: 'Destination Tracking ID',
            value: virtualAccountHistory.destination_tx_hash,
            copyable: true,
          },
        ]
      : []),
    {
      label: 'Incoming amount',
      value: formatDollars(virtualAccountHistory.amount),
      copyable: false,
    },
    {
      label: 'Developer fee',
      value: formatDollars(virtualAccountHistory.developer_fee_amount),
      copyable: false,
    },
    {
      label: 'Outgoing funds',
      value: formatDollars(virtualAccountHistory.subtotal_amount),
      copyable: false,
    },
  ];

  const source_details: DetailsDisplayDto[] = [
    {
      label: 'Source payment rail',
      value: formatPaymentRail(source_deposit_instructions.payment_rail),
      copyable: false,
    },
    {
      label: 'Source currency',
      value: formatCurrency(source_deposit_instructions.currency),
      copyable: false,
    },
    {
      label: 'Sender bank routing number',
      value: source_deposit_instructions.bank_routing_number,
      copyable: true,
    },
    {
      label: 'Developer fee',
      value: formatDollars(virtualAccountHistory.developer_fee_amount),
      copyable: false,
    },
  ];

  const destination_details: DetailsDisplayDto[] = [
    {
      label: 'Destination Virtual Account ID',
      value: virtualAccount.id,
      copyable: true,
    },
    {
      label: 'Destination beneficiary name',
      value: source_deposit_instructions.bank_beneficiary_name,
      copyable: false,
    },
  ];

  const payment_route_instructions: DetailsDisplayDto[] = [
    {
      label: 'Payment rail(s)',
      value: source_deposit_instructions.payment_rails
        .map(formatPaymentRail)
        .join(', '),
      copyable: false,
    },
    {
      label: 'Beneficiary name',
      value: source_deposit_instructions.bank_beneficiary_name,
      copyable: true,
    },
    {
      label: 'Bank routing number',
      value: source_deposit_instructions.bank_routing_number,
      copyable: true,
    },
    {
      label: 'Bank account number',
      value: source_deposit_instructions.bank_account_number,
      copyable: true,
    },
    {
      label: 'Beneficiary address',
      value: source_deposit_instructions.bank_beneficiary_address,
      copyable: true,
    },
    {
      label: 'Currency',
      value: formatCurrency(source_deposit_instructions.currency),
      copyable: false,
    },
    {
      label: 'Virtual account ID',
      value: virtualAccount.id,
      copyable: true,
    },
  ];

  const instruction_source_details: DetailsDisplayDto[] = [
    {
      label: 'Source payment rail',
      value: source_deposit_instructions.payment_rails
        .map(formatPaymentRail)
        .join(', '),
      copyable: false,
    },
    {
      label: 'Source currency',
      value: formatCurrency(source_deposit_instructions.currency),
      copyable: false,
    },
    {
      label: 'Developer fee',
      value: formatDollars(virtualAccountHistory.developer_fee_amount),
      copyable: false,
    },
  ];

  const instruction_destination_details: DetailsDisplayDto[] = [
    {
      label: 'Destination Virtual Account ID',
      value: virtualAccount.id,
      copyable: true,
    },
    {
      label: 'Destination beneficiary name',
      value: source_deposit_instructions.bank_beneficiary_name,
      copyable: false,
    },
    ...(destination.address
      ? [
          {
            label: 'Destination wallet address',
            value: destination.address,
            copyable: true,
            hideable: true,
          },
        ]
      : []),
  ];

  const instructions: TransactionDetailsDto['instructions'] = {
    payment_route_instructions,
    source_details: instruction_source_details,
    destination_details: instruction_destination_details,
  };

  return {
    txn_type: 'onramp',
    id: virtualAccountHistory.id,
    created_at: virtualAccountHistory.created_at,
    amount: formatDollars(virtualAccountHistory.subtotal_amount),
    raw_amount: Number(virtualAccountHistory.subtotal_amount),
    developer_fee: Number(virtualAccountHistory.developer_fee_amount),
    description: `(${formatPaymentRail(source_deposit_instructions.payment_rail)} Transfer) Deposit to virtual wallet under ${virtualAccount.source_deposit_instructions.bank_beneficiary_name}`,
    status: virtualAccountHistory.type,
    source_to_destination: formatSourceToDestination(
      {
        currency: source_deposit_instructions.currency,
        payment_rail: source_deposit_instructions.payment_rail,
      },
      {
        currency: destination.currency as Currency,
        payment_rail: destination.payment_rail as PaymentRail,
      },
    ),
    is_from_wallet: false, // useful in offramp only
    tracking_and_receipt,
    source_details,
    destination_details,
    instructions,
  };
}

export function convertOffRampTransferToTransactionDetails(
  transfer: TransferDto,
  externalAccount?: ExternalAccountDto,
): TransactionDetailsDto {
  const is_from_wallet =
    transfer.source.payment_rail === PaymentRail.BRIDGE_WALLET;

  let destination_details: DetailsDisplayDto[];

  if (externalAccount) {
    const extra_destination_details: DetailsDisplayDto[] =
      externalAccount.account_type === 'us'
        ? [
            {
              label: 'Account ending in',
              value: `****${externalAccount.last_4}`,
              copyable: false,
            },
            {
              label: 'Routing number',
              value: externalAccount.account.routing_number,
              copyable: true,
            },
            {
              label: 'Account subtype',
              value:
                externalAccount.account.checking_or_savings === 'checking'
                  ? 'Checking'
                  : 'Savings',
              copyable: false,
            },
          ]
        : [
            {
              label: 'IBAN last 4 digits',
              value: `****${externalAccount.iban.last_4}`,
              copyable: false,
            },
            {
              label: 'IBAN country',
              value: externalAccount.iban.country,
              copyable: false,
            },
            {
              label: 'IBAN bic',
              value: externalAccount.iban.bic,
              copyable: false,
            },
          ];

    destination_details = [
      {
        label: 'Destination payment rail',
        value: formatPaymentRail(
          transfer.destination.payment_rail as PaymentRail,
        ),
        copyable: false,
      },
      {
        label: 'Destination currency',
        value: formatCurrency(transfer.destination.currency as Currency),
        copyable: false,
      },
      {
        label: 'Bank name',
        value: externalAccount.bank_name,
        copyable: false,
      },
      {
        label: 'Account owner',
        value: externalAccount.account_owner_name,
        copyable: false,
      },
      {
        label: 'Account type',
        value: externalAccount.account_type === 'us' ? 'US' : 'EUR',
        copyable: false,
      },
      ...extra_destination_details,
    ];
  } else {
    destination_details = [
      {
        label: '-1',
        value: 'Beneficiary has been deleted',
        copyable: false,
      },
    ];
  }

  let description = 'Transfer funds to beneficiary.';
  if (externalAccount) {
    const { bank_name, account_type } = externalAccount;
    description = `Transfer funds to ${bank_name} (****${account_type === 'us' ? externalAccount.account.last_4 : externalAccount.iban.last_4})`;
  }

  return {
    txn_type: 'offramp',
    id: transfer.id,
    created_at: transfer.created_at,
    amount: formatDollars(transfer.amount),
    raw_amount: Number(transfer.amount),
    developer_fee: Number(transfer.developer_fee),
    description,
    status: transfer.state,
    source_to_destination: formatSourceToDestination(
      {
        currency: transfer.source.currency as Currency,
        payment_rail: transfer.source.payment_rail as PaymentRail,
      },
      {
        currency: transfer.destination.currency as Currency,
        payment_rail: transfer.destination.payment_rail as PaymentRail,
      },
    ),
    is_from_wallet,
    tracking_and_receipt: [
      {
        label: 'Transaction ID',
        value: transfer.id,
        copyable: true,
      },
      {
        label: 'Incoming amount',
        value: formatDollars(transfer.amount),
        copyable: false,
      },
      {
        label: 'Developer fee',
        value: formatDollars(transfer.developer_fee),
        copyable: false,
      },
      {
        label: 'Outgoing funds',
        value: formatDollars(transfer.receipt.final_amount),
        copyable: false,
      },
    ],
    source_details: [
      {
        label: 'Payment source',
        value: formatPaymentRail(transfer.source.payment_rail as PaymentRail),
        copyable: false,
      },
      {
        label: 'Source wallet address',
        value: transfer.source.from_address as string,
        copyable: true,
        hideable: true,
      },
      {
        label: 'Developer fee',
        value: formatDollars(transfer.developer_fee),
        copyable: false,
      },
    ],
    destination_details,
    instructions: {
      payment_route_instructions: [
        {
          label: 'Deposit address',
          value: transfer.source_deposit_instructions?.to_address || '',
          copyable: true,
          hideable: true,
        },
      ],
      source_details: [],
      destination_details,
    },
  };
}
