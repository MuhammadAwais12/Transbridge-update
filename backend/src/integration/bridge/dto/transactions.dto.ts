import { OnRampOrOffRamp, State } from './shared.dto';

export interface DetailsDisplayDto {
  label: string;
  value: string;
  copyable: boolean;
  hideable?: boolean;
}
export interface TransactionDetailsDto {
  txn_type: OnRampOrOffRamp;
  id: string;
  source_to_destination: string;
  created_at: string;
  status: State;
  amount: string;
  raw_amount: number;
  developer_fee: number;
  description: string;
  is_from_wallet: boolean;
  tracking_and_receipt: DetailsDisplayDto[];
  source_details: DetailsDisplayDto[];
  destination_details: DetailsDisplayDto[];
  instructions: {
    payment_route_instructions: DetailsDisplayDto[];
    source_details: DetailsDisplayDto[];
    destination_details: DetailsDisplayDto[];
  };
}

export class TransactionDetailsListDto {
  count: number;
  data: TransactionDetailsDto[];
}
